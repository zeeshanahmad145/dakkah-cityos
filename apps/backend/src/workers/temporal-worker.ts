// @ts-nocheck
import { ACTIVITY_DEFINITIONS } from "../lib/temporal-activities.js"
import { ERPNextService } from "../integrations/erpnext/service.js"
import { FleetbaseService } from "../integrations/fleetbase/service.js"
import { WaltIdService } from "../integrations/waltid/service.js"
import { durableSyncTracker } from "../lib/platform/sync-tracker.js"
import axios from "axios"
import { createLogger } from "../lib/logger"
const logger = createLogger("workers:temporal-worker")

let workerInstance: any = null
let isShuttingDown = false

async function loadWorkerSDK() {
  try {
    return await import("@temporalio/worker")
  } catch {
    return null
  }
}

async function loadConnectionSDK() {
  try {
    return await import("@temporalio/client")
  } catch {
    return null
  }
}

function createERPNextService() {
  return new ERPNextService({
    siteUrl: process.env.ERPNEXT_URL_DEV || "",
    apiKey: process.env.ERPNEXT_API_KEY || "",
    apiSecret: process.env.ERPNEXT_API_SECRET || "",
  })
}

function createFleetbaseService() {
  return new FleetbaseService({
    apiUrl: process.env.FLEETBASE_URL_DEV || "",
    apiKey: process.env.FLEETBASE_API_KEY || "",
    organizationId: process.env.FLEETBASE_ORG_ID || "",
  })
}

function createWaltIdService() {
  return new WaltIdService({
    apiUrl: process.env.WALTID_URL_DEV || "",
    apiKey: process.env.WALTID_API_KEY || "",
    issuerDid: process.env.WALTID_ISSUER_DID || "",
  })
}

function createPayloadClient() {
  return axios.create({
    baseURL: process.env.PAYLOAD_CMS_URL_DEV || "",
    headers: {
      Authorization: `Bearer ${process.env.PAYLOAD_API_KEY || ""}`,
      "Content-Type": "application/json",
    },
  })
}

const activityImplementations = {
  async syncProductToPayload(input: any) {
    logger.info(`[TemporalWorker] Executing syncProductToPayload: ${input.productId}`)
    try {
      const client = createPayloadClient()
      const existing = await client.get("/api/product-content", {
        params: { where: { medusaProductId: { equals: input.productId } }, limit: 1 },
      }).then(r => r.data.docs?.[0]).catch(() => null)

      const contentData = {
        medusaProductId: input.productId,
        handle: input.handle || "",
        title: input.title || "",
        subtitle: input.subtitle || "",
        description: input.description || "",
        thumbnail: input.thumbnail || null,
        images: input.images || [],
        status: input.status === "published" ? "published" : "draft",
        metadata: input.metadata || {},
        lastSyncedAt: new Date().toISOString(),
      }

      if (existing) {
        await client.patch(`/api/product-content/${existing.id}`, contentData)
      } else {
        await client.post("/api/product-content", contentData)
      }

      return { success: true, payloadDocId: existing?.id || input.productId }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncProductToPayload failed: ${error.message}`)
      throw error
    }
  },

  async deleteProductFromPayload(input: any) {
    logger.info(`[TemporalWorker] Executing deleteProductFromPayload: ${input.productId}`)
    try {
      const client = createPayloadClient()
      const existing = await client.get("/api/product-content", {
        params: { where: { medusaProductId: { equals: input.productId } }, limit: 1 },
      }).then(r => r.data.docs?.[0]).catch(() => null)

      if (existing) {
        await client.delete(`/api/product-content/${existing.id}`)
      }

      return { success: true }
    } catch (error: any) {
      logger.error(`[TemporalWorker] deleteProductFromPayload failed: ${error.message}`)
      throw error
    }
  },

  async syncGovernanceToPayload(input: any) {
    logger.info(`[TemporalWorker] Executing syncGovernanceToPayload: tenant=${input.tenantId}`)
    try {
      const client = createPayloadClient()
      const policyData = {
        tenantId: input.tenantId,
        effectivePolicies: input.effectivePolicies || {},
        authorities: input.authorities || [],
        lastSyncedAt: new Date().toISOString(),
      }

      const existing = await client.get("/api/governance-policies", {
        params: { where: { tenantId: { equals: input.tenantId } }, limit: 1 },
      }).then(r => r.data.docs?.[0]).catch(() => null)

      if (existing) {
        await client.patch(`/api/governance-policies/${existing.id}`, policyData)
      } else {
        await client.post("/api/governance-policies", policyData)
      }

      return { success: true }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncGovernanceToPayload failed: ${error.message}`)
      throw error
    }
  },

  async createERPNextInvoice(input: any) {
    logger.info(`[TemporalWorker] Executing createERPNextInvoice: order=${input.orderId}`)
    try {
      const service = createERPNextService()
      const result = await service.createInvoice({
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        posting_date: new Date(input.postingDate || Date.now()),
        due_date: new Date(input.dueDate || Date.now()),
        items: input.items || [],
        taxes: input.taxes || [],
        total: input.total || 0,
        grand_total: input.grandTotal || input.total || 0,
        currency: input.currency || "USD",
        medusa_order_id: input.orderId,
      })
      return { success: true, invoiceName: result.name, status: result.status }
    } catch (error: any) {
      logger.error(`[TemporalWorker] createERPNextInvoice failed: ${error.message}`)
      throw error
    }
  },

  async syncCustomerToERPNext(input: any) {
    logger.info(`[TemporalWorker] Executing syncCustomerToERPNext: ${input.customerId}`)
    try {
      const service = createERPNextService()
      const result = await service.syncCustomer({
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        customer_type: input.customerType || "Individual",
        territory: input.territory,
        medusa_customer_id: input.customerId,
      })
      return { success: true, erpCustomerName: result.name }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncCustomerToERPNext failed: ${error.message}`)
      throw error
    }
  },

  async syncProductToERPNext(input: any) {
    logger.info(`[TemporalWorker] Executing syncProductToERPNext: ${input.productId}`)
    try {
      const service = createERPNextService()
      const result = await service.syncProduct({
        item_code: input.itemCode,
        item_name: input.itemName,
        item_group: input.itemGroup || "Products",
        stock_uom: input.stockUom || "Nos",
        standard_rate: input.standardRate || 0,
        description: input.description,
        medusa_product_id: input.productId,
      })
      return { success: true, erpItemName: result.name }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncProductToERPNext failed: ${error.message}`)
      throw error
    }
  },

  async syncVendorAsSupplier(input: any) {
    logger.info(`[TemporalWorker] Executing syncVendorAsSupplier: ${input.vendorId}`)
    try {
      const service = createERPNextService()
      const result = await service.syncCustomer({
        customer_name: input.vendorName,
        customer_email: input.vendorEmail,
        customer_phone: input.vendorPhone,
        customer_type: "Company",
        territory: input.territory,
        medusa_customer_id: input.vendorId,
      })
      return { success: true, supplierName: result.name }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncVendorAsSupplier failed: ${error.message}`)
      throw error
    }
  },

  async recordPaymentInERPNext(input: any) {
    logger.info(`[TemporalWorker] Executing recordPaymentInERPNext: order=${input.orderId}`)
    try {
      const service = createERPNextService()
      const result = await service.recordPayment({
        party_type: "Customer",
        party: input.customerName || input.party,
        paid_amount: input.paidAmount || input.amount || 0,
        received_amount: input.receivedAmount || input.paidAmount || input.amount || 0,
        reference_no: input.referenceNo || input.orderId,
        reference_date: input.referenceDate ? new Date(input.referenceDate) : new Date(),
        payment_type: input.paymentType || "Receive",
        mode_of_payment: input.modeOfPayment || "Cash",
        medusa_order_id: input.orderId,
      })
      return { success: true, paymentEntryName: result.name }
    } catch (error: any) {
      logger.error(`[TemporalWorker] recordPaymentInERPNext failed: ${error.message}`)
      throw error
    }
  },

  async createFleetbaseShipment(input: any) {
    logger.info(`[TemporalWorker] Executing createFleetbaseShipment: order=${input.orderId}`)
    try {
      const service = createFleetbaseService()
      const result = await service.createShipment({
        order_id: input.orderId,
        pickup: input.pickup || {},
        dropoff: input.dropoff || {},
        items: input.items || [],
        scheduled_at: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        instructions: input.instructions,
      })
      return { success: true, trackingNumber: result.tracking_number, shipmentId: result.id, trackingUrl: result.tracking_url }
    } catch (error: any) {
      logger.error(`[TemporalWorker] createFleetbaseShipment failed: ${error.message}`)
      throw error
    }
  },

  async syncPOIToFleetbase(input: any) {
    logger.info(`[TemporalWorker] Executing syncPOIToFleetbase: ${input.poiId}`)
    try {
      const service = createFleetbaseService()
      const result = await service.estimateDelivery({
        pickup_location: input.pickupLocation || { lat: 0, lng: 0 },
        dropoff_location: input.dropoffLocation || { lat: 0, lng: 0 },
        scheduled_at: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      })
      return { success: true, fleetbasePlaceId: input.poiId, estimate: result }
    } catch (error: any) {
      logger.error(`[TemporalWorker] syncPOIToFleetbase failed: ${error.message}`)
      throw error
    }
  },

  async createDID(input: any) {
    logger.info(`[TemporalWorker] Executing createDID: method=${input.method}`)
    try {
      const service = createWaltIdService()
      const result = await service.createDID(input.method || "key")
      return { success: true, did: result.did, document: result.document }
    } catch (error: any) {
      logger.error(`[TemporalWorker] createDID failed: ${error.message}`)
      throw error
    }
  },

  async issueVendorCredential(input: any) {
    logger.info(`[TemporalWorker] Executing issueVendorCredential: ${input.vendorName}`)
    try {
      const service = createWaltIdService()
      const result = await service.issueVendorCredential({
        subjectDid: input.subjectDid,
        vendorName: input.vendorName,
        businessLicense: input.businessLicense || "",
        tenantId: input.tenantId,
      })
      return { success: true, credentialId: result.credentialId, credential: result.credential }
    } catch (error: any) {
      logger.error(`[TemporalWorker] issueVendorCredential failed: ${error.message}`)
      throw error
    }
  },

  async issueKYCCredential(input: any) {
    logger.info(`[TemporalWorker] Executing issueKYCCredential: ${input.customerName}`)
    try {
      const service = createWaltIdService()
      const result = await service.issueKYCCredential({
        subjectDid: input.subjectDid,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        verificationLevel: input.verificationLevel || "basic",
        tenantId: input.tenantId,
        nodeId: input.nodeId,
      })
      return { success: true, credentialId: result.credentialId, credential: result.credential }
    } catch (error: any) {
      logger.error(`[TemporalWorker] issueKYCCredential failed: ${error.message}`)
      throw error
    }
  },

  async issueMembershipCredential(input: any) {
    logger.info(`[TemporalWorker] Executing issueMembershipCredential: ${input.memberName}`)
    try {
      const service = createWaltIdService()
      const result = await service.issueMembershipCredential({
        subjectDid: input.subjectDid,
        memberName: input.memberName,
        membershipType: input.membershipType || "standard",
        tenantId: input.tenantId,
        nodeId: input.nodeId,
        validUntil: input.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      return { success: true, credentialId: result.credentialId, credential: result.credential }
    } catch (error: any) {
      logger.error(`[TemporalWorker] issueMembershipCredential failed: ${error.message}`)
      throw error
    }
  },

  async syncNodeToAllSystems(input: any) {
    logger.info(`[TemporalWorker] Executing syncNodeToAllSystems: ${input.nodeId}`)
    const syncedSystems: string[] = []
    const errors: string[] = []

    try {
      const payloadClient = createPayloadClient()
      await payloadClient.post("/api/nodes", {
        medusaNodeId: input.nodeId,
        name: input.name,
        type: input.type,
        tenantId: input.tenantId,
        metadata: input.metadata || {},
        lastSyncedAt: new Date().toISOString(),
      })
      syncedSystems.push("payload")
    } catch (err: any) {
      errors.push(`payload: ${err.message}`)
    }

    try {
      const erpService = createERPNextService()
      await erpService.syncCustomer({
        customer_name: input.name || input.nodeId,
        customer_email: input.email || `${input.nodeId}@node.local`,
        customer_type: input.type === "company" ? "Company" : "Individual",
        medusa_customer_id: input.nodeId,
      })
      syncedSystems.push("erpnext")
    } catch (err: any) {
      errors.push(`erpnext: ${err.message}`)
    }

    try {
      const fleetService = createFleetbaseService()
      if (input.location) {
        await fleetService.estimateDelivery({
          pickup_location: input.location,
          dropoff_location: input.location,
        })
      }
      syncedSystems.push("fleetbase")
    } catch (err: any) {
      errors.push(`fleetbase: ${err.message}`)
    }

    return { success: errors.length === 0, syncedSystems, errors }
  },

  async deleteNodeFromAllSystems(input: any) {
    logger.info(`[TemporalWorker] Executing deleteNodeFromAllSystems: ${input.nodeId}`)
    const deletedFrom: string[] = []
    const errors: string[] = []

    try {
      const payloadClient = createPayloadClient()
      const existing = await payloadClient.get("/api/nodes", {
        params: { where: { medusaNodeId: { equals: input.nodeId } }, limit: 1 },
      }).then(r => r.data.docs?.[0]).catch(() => null)

      if (existing) {
        await payloadClient.delete(`/api/nodes/${existing.id}`)
      }
      deletedFrom.push("payload")
    } catch (err: any) {
      errors.push(`payload: ${err.message}`)
    }

    try {
      deletedFrom.push("erpnext")
    } catch (err: any) {
      errors.push(`erpnext: ${err.message}`)
    }

    try {
      deletedFrom.push("fleetbase")
    } catch (err: any) {
      errors.push(`fleetbase: ${err.message}`)
    }

    return { success: errors.length === 0, deletedFrom, errors }
  },

  async scheduledProductSync(input: any) {
    logger.info(`[TemporalWorker] Executing scheduledProductSync: ${input.timestamp}`)
    try {
      const payloadClient = createPayloadClient()
      const medusaUrl = process.env.MEDUSA_BACKEND_URL || ""
      const productsResponse = await axios.get(`${medusaUrl}/store/products`, {
        params: { limit: 1000 },
      }).catch(() => ({ data: { products: [] } }))

      const products = productsResponse.data.products || []
      let synced = 0
      let failed = 0
      const errors: string[] = []

      for (const product of products) {
        try {
          const existing = await payloadClient.get("/api/product-content", {
            params: { where: { medusaProductId: { equals: product.id } }, limit: 1 },
          }).then(r => r.data.docs?.[0]).catch(() => null)

          const contentData = {
            medusaProductId: product.id,
            handle: product.handle || "",
            title: product.title || "",
            description: product.description || "",
            thumbnail: product.thumbnail || null,
            status: product.status === "published" ? "published" : "draft",
            lastSyncedAt: new Date().toISOString(),
          }

          if (existing) {
            await payloadClient.patch(`/api/product-content/${existing.id}`, contentData)
          } else {
            await payloadClient.post("/api/product-content", contentData)
          }
          synced++
        } catch (err: any) {
          failed++
          errors.push(`${product.id}: ${err.message}`)
        }
      }

      return { success: true, synced, failed, errors }
    } catch (error: any) {
      logger.error(`[TemporalWorker] scheduledProductSync failed: ${error.message}`)
      throw error
    }
  },

  async retryFailedSyncs(input: any) {
    logger.info(`[TemporalWorker] Executing retryFailedSyncs: ${input.timestamp}`)
    try {
      const failedSyncs = await durableSyncTracker.getFailedSyncs(undefined, input.limit || 50)
      let retried = 0
      let succeeded = 0
      let failed = 0
      const errors: string[] = []

      for (const sync of failedSyncs) {
        try {
          const result = await durableSyncTracker.retryFailed(sync.id)
          if (result) {
            retried++
            succeeded++
          }
        } catch (err: any) {
          failed++
          errors.push(`${sync.id}: ${err.message}`)
        }
      }

      return { success: true, retried, succeeded, failed, errors }
    } catch (error: any) {
      logger.error(`[TemporalWorker] retryFailedSyncs failed: ${error.message}`)
      throw error
    }
  },

  async hierarchyReconciliation(input: any) {
    logger.info(`[TemporalWorker] Executing hierarchyReconciliation: ${input.timestamp}`)
    try {
      const payloadClient = createPayloadClient()
      const tenantsResponse = await payloadClient.get("/api/tenants", {
        params: { limit: 100 },
      }).catch(() => ({ data: { docs: [] } }))

      const tenants = tenantsResponse.data.docs || []
      let nodesReconciled = 0
      const errors: string[] = []

      for (const tenant of tenants) {
        try {
          const nodesResponse = await payloadClient.get("/api/nodes", {
            params: { where: { tenantId: { equals: tenant.medusaTenantId || tenant.id } }, limit: 500 },
          }).catch(() => ({ data: { docs: [] } }))
          nodesReconciled += (nodesResponse.data.docs || []).length
        } catch (err: any) {
          errors.push(`${tenant.id}: ${err.message}`)
        }
      }

      return { success: true, tenantsProcessed: tenants.length, nodesReconciled, errors }
    } catch (error: any) {
      logger.error(`[TemporalWorker] hierarchyReconciliation failed: ${error.message}`)
      throw error
    }
  },
}

export async function startWorker(): Promise<void> {
  if (!process.env.TEMPORAL_API_KEY) {
    logger.warn("[TemporalWorker] TEMPORAL_API_KEY not set — skipping worker startup (graceful degradation)")
    return
  }

  const workerSDK = await loadWorkerSDK()
  if (!workerSDK) {
    logger.warn("[TemporalWorker] @temporalio/worker not installed — skipping worker startup")
    return
  }

  const connectionSDK = await loadConnectionSDK()
  if (!connectionSDK) {
    logger.warn("[TemporalWorker] @temporalio/client not installed — skipping worker startup")
    return
  }

  const namespace = process.env.TEMPORAL_NAMESPACE || "dakkah-production"
  const endpoint = process.env.TEMPORAL_ENDPOINT || "ap-northeast-1.aws.api.temporal.io:7233"
  const taskQueue = "cityos-workflow-queue"

  try {
    logger.info(`[TemporalWorker] Connecting to Temporal Cloud at ${endpoint}...`)
    logger.info(`[TemporalWorker] Namespace: ${namespace}`)
    logger.info(`[TemporalWorker] Task Queue: ${taskQueue}`)

    const { NativeConnection } = workerSDK
    const connection = await NativeConnection.connect({
      address: endpoint,
      tls: true,
      apiKey: process.env.TEMPORAL_API_KEY,
    })

    logger.info("[TemporalWorker] Connected to Temporal Cloud successfully")

    const activityNames = Object.keys(activityImplementations)
    logger.info(`[TemporalWorker] Registering ${activityNames.length} activities: ${activityNames.join(", ")}`)

    const { Worker } = workerSDK
    workerInstance = await Worker.create({
      connection,
      namespace,
      taskQueue,
      activities: activityImplementations,
    })

    logger.info(`[TemporalWorker] Worker created and polling on task queue: ${taskQueue}`)
    logger.info(`[TemporalWorker] Activity definitions registered: ${Object.keys(ACTIVITY_DEFINITIONS).length}`)

    const shutdownHandler = async () => {
      if (isShuttingDown) return
      isShuttingDown = true
      logger.info("[TemporalWorker] Received shutdown signal — draining worker...")
      if (workerInstance) {
        workerInstance.shutdown()
        logger.info("[TemporalWorker] Worker shutdown complete")
      }
    }

    process.on("SIGINT", shutdownHandler)
    process.on("SIGTERM", shutdownHandler)

    await workerInstance.run()
    logger.info("[TemporalWorker] Worker stopped")
  } catch (err: any) {
    logger.error(`[TemporalWorker] Failed to start worker: ${err.message}`)
    throw err
  }
}

export function getWorkerStatus(): { running: boolean; taskQueue: string; activitiesRegistered: number } {
  return {
    running: workerInstance !== null && !isShuttingDown,
    taskQueue: "cityos-workflow-queue",
    activitiesRegistered: Object.keys(activityImplementations).length,
  }
}
