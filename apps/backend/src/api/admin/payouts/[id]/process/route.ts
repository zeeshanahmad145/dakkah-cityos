// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../../lib/api-error-handler"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const payoutService = req.scope.resolve("payout") as unknown as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  const eventBus = req.scope.resolve("event_bus") as unknown as any
  
  try {
    // Get payout with vendor details
    const { data: payouts } = await query.graph({
      entity: "payout",
      fields: ["*", "vendor.*"],
      filters: { id }
    })
    
    const payout = payouts?.[0]
    
    if (!payout) {
      return res.status(404).json({ message: "Payout not found" })
    }
    
    if (!["pending", "on_hold"].includes(payout.status)) {
      return res.status(400).json({ message: `Cannot process payout in ${payout.status} status` })
    }
    
    const vendor = payout.vendor
    
    if (!vendor?.stripe_account_id) {
      return res.status(400).json({ message: "Vendor has no connected Stripe account" })
    }
    
    // Dispatch to Temporal for processing (Temporal-first architecture)
    const { dispatchEventToTemporal } = await import("../../../../../lib/event-dispatcher.js")
    await dispatchEventToTemporal("payout.initiated", {
      id: payout.id,
      vendor_id: payout.vendor_id,
      amount: payout.net_amount,
      stripe_account_id: vendor.stripe_account_id,
      tenant_id: vendor.tenant_id || "01KGZ2JRYX607FWMMYQNQRKVWS",
    }, {
      tenantId: vendor.tenant_id || "01KGZ2JRYX607FWMMYQNQRKVWS",
      source: "admin-payout-process",
    })

    // Update payout status to processing locally
    const updatedPayout = await payoutService.updatePayouts({
      id,
      status: "processing",
    })
    
    res.json({ payout: updatedPayout })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-PAYOUTS-ID-PROCESS")}
}

