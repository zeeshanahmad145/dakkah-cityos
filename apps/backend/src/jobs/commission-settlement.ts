// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { jobLogger } from "../lib/logger"

const logger = jobLogger

export default async function commissionSettlementJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const commissionService = container.resolve("commission") as unknown as any
  const payoutService = container.resolve("payout") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("Starting daily commission settlement")
  
  try {
    // Get all unsettled commissions older than 7 days (hold period)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: pendingTransactions } = await query.graph({
      entity: "commission_transaction",
      fields: ["*", "vendor.*"],
      filters: {
        status: "pending",
        created_at: { $lt: sevenDaysAgo.toISOString() }
      }
    })
    
    if (!pendingTransactions || pendingTransactions.length === 0) {
      logger.info("No pending commissions to settle")
      return
    }
    
    // Group by vendor
    const vendorCommissions: Record<string, {
      vendor: Record<string, unknown>
      transactions: Record<string, unknown>[]
      totalGross: number
      totalCommission: number
    }> = {}
    
    for (const tx of pendingTransactions) {
      const vendorId = tx.vendor_id as string
      if (!vendorId) continue
      
      if (!vendorCommissions[vendorId]) {
        vendorCommissions[vendorId] = {
          vendor: tx.vendor as Record<string, unknown>,
          transactions: [],
          totalGross: 0,
          totalCommission: 0
        }
      }
      
      vendorCommissions[vendorId].transactions.push(tx)
      vendorCommissions[vendorId].totalGross += Number(tx.order_total || 0)
      vendorCommissions[vendorId].totalCommission += Number(tx.commission_amount || 0)
    }
    
    // Process each vendor's commissions
    let successCount = 0
    let failCount = 0
    
    for (const [vendorId, data] of Object.entries(vendorCommissions)) {
      try {
        const netAmount = data.totalGross - data.totalCommission
        
        if (netAmount <= 0) {
          logger.debug("Skipping vendor - no positive balance", { vendorId })
          continue
        }
        
        // Get period dates
        const oldestTx = data.transactions.reduce((oldest, tx) => 
          new Date(tx.created_at as string) < new Date(oldest.created_at as string) ? tx : oldest
        )
        const newestTx = data.transactions.reduce((newest, tx) => 
          new Date(tx.created_at as string) > new Date(newest.created_at as string) ? tx : newest
        )
        
        // Create payout
        const payout = await payoutService.createVendorPayout({
          vendorId,
          tenantId: (data.vendor?.tenant_id as string) || "01KGZ2JRYX607FWMMYQNQRKVWS",
          periodStart: new Date(oldestTx.created_at as string),
          periodEnd: new Date(newestTx.created_at as string),
          transactionIds: data.transactions.map((tx) => tx.id as string),
          grossAmount: data.totalGross,
          commissionAmount: data.totalCommission,
          paymentMethod: "stripe_connect",
        })
        
        // Mark transactions as settled
        for (const tx of data.transactions) {
          await commissionService.updateCommissionTransactions({
            id: tx.id,
            status: "paid",
            paid_at: new Date(),
            payout_id: payout.id
          })
        }
        
        // Process the payout if vendor has Stripe account
        try {
          const { dispatchEventToTemporal } = await import("../lib/event-dispatcher.js")
          await dispatchEventToTemporal("payout.initiated", {
            id: payout.id,
            vendor_id: vendorId,
            amount: netAmount,
            stripe_account_id: data.vendor?.stripe_account_id,
            tenant_id: (data.vendor?.tenant_id as string) || "01KGZ2JRYX607FWMMYQNQRKVWS",
          }, {
            tenantId: (data.vendor?.tenant_id as string) || "01KGZ2JRYX607FWMMYQNQRKVWS",
            source: "commission-settlement-job",
          })
        } catch (dispatchError) {
          logger.error("Failed to dispatch payout to Temporal", dispatchError, { vendorId })
          await eventBus.emit("payout.failed", {
            id: payout.id,
            vendor_id: vendorId,
            error: (dispatchError as Error).message,
          })
        }
        
        successCount++
        logger.info("Commission settled", { 
          vendorId, 
          vendorName: data.vendor?.business_name,
          amount: netAmount 
        })
      } catch (error) {
        failCount++
        logger.error("Commission settlement failed for vendor", error, { vendorId })
      }
    }
    
    logger.info("Commission settlement completed", { successCount, failCount })
  } catch (error) {
    logger.error("Commission settlement job failed", error)
  }
}

export const config = {
  name: "commission-settlement",
  schedule: "0 2 * * *", // Daily at 2 AM
}
