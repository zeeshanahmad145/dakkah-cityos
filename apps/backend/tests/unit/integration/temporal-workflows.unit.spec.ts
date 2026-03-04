import { vi } from "vitest";
const mockWorkflowClient = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  start: vi.fn().mockResolvedValue({ workflowId: "wf_mock", runId: "run_mock" }),
  getHandle: vi.fn().mockReturnValue({
    signal: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({}),
    cancel: vi.fn().mockResolvedValue(undefined),
  }),
}

vi.mock("@temporalio/client", () => ({
  WorkflowClient: vi.fn(() => mockWorkflowClient),
  Connection: { connect: vi.fn().mockResolvedValue({}) },
}))

const TASK_QUEUES = {
  ORDER_PROCESSING: "order-processing-queue",
  PRODUCT_SYNC: "product-sync-queue",
  PAYMENT: "payment-queue",
  HIERARCHY_SYNC: "hierarchy-sync-queue",
}

interface WorkflowDispatcher {
  dispatchOrderCreated(orderId: string, data: Record<string, any>): Promise<{ workflowId: string; runId: string }>
  dispatchOrderFulfilled(orderId: string, data: Record<string, any>): Promise<{ workflowId: string; runId: string }>
  dispatchOrderCancelled(orderId: string, data: Record<string, any>): Promise<{ workflowId: string; runId: string }>
  dispatchProductSyncToErpNext(productIds: string[]): Promise<{ workflowId: string; runId: string }>
  dispatchProductSyncToPayloadCms(productIds: string[]): Promise<{ workflowId: string; runId: string }>
  dispatchCommissionCalculation(orderId: string, vendorId: string): Promise<{ workflowId: string; runId: string }>
  dispatchVendorPayout(vendorId: string, amount: number): Promise<{ workflowId: string; runId: string }>
  dispatchHierarchyReconciliation(nodeId: string): Promise<{ workflowId: string; runId: string }>
  dispatchNodeSync(nodeId: string, changes: Record<string, any>): Promise<{ workflowId: string; runId: string }>
}

function createDispatcher(client: typeof mockWorkflowClient): WorkflowDispatcher {
  return {
    async dispatchOrderCreated(orderId, data) {
      return client.start("orderCreatedWorkflow", {
        workflowId: `order-created-${orderId}`,
        taskQueue: TASK_QUEUES.ORDER_PROCESSING,
        args: [{ orderId, ...data }],
      })
    },
    async dispatchOrderFulfilled(orderId, data) {
      return client.start("orderFulfilledWorkflow", {
        workflowId: `order-fulfilled-${orderId}`,
        taskQueue: TASK_QUEUES.ORDER_PROCESSING,
        args: [{ orderId, ...data }],
      })
    },
    async dispatchOrderCancelled(orderId, data) {
      return client.start("orderCancelledWorkflow", {
        workflowId: `order-cancelled-${orderId}`,
        taskQueue: TASK_QUEUES.ORDER_PROCESSING,
        args: [{ orderId, compensation: true, ...data }],
      })
    },
    async dispatchProductSyncToErpNext(productIds) {
      const batchSize = 50
      if (productIds.length > batchSize) {
        const batches: string[][] = []
        for (let i = 0; i < productIds.length; i += batchSize) {
          batches.push(productIds.slice(i, i + batchSize))
        }
        const results = []
        for (let i = 0; i < batches.length; i++) {
          results.push(
            await client.start("productSyncErpNextWorkflow", {
              workflowId: `product-sync-erpnext-batch-${i}`,
              taskQueue: TASK_QUEUES.PRODUCT_SYNC,
              args: [{ productIds: batches[i], target: "erpnext" }],
              retry: { maximumAttempts: 3 },
            })
          )
        }
        return results[0]
      }
      return client.start("productSyncErpNextWorkflow", {
        workflowId: `product-sync-erpnext-${Date.now()}`,
        taskQueue: TASK_QUEUES.PRODUCT_SYNC,
        args: [{ productIds, target: "erpnext" }],
        retry: { maximumAttempts: 3 },
      })
    },
    async dispatchProductSyncToPayloadCms(productIds) {
      return client.start("productSyncPayloadCmsWorkflow", {
        workflowId: `product-sync-payload-${Date.now()}`,
        taskQueue: TASK_QUEUES.PRODUCT_SYNC,
        args: [{ productIds, target: "payload-cms" }],
        retry: { maximumAttempts: 3 },
      })
    },
    async dispatchCommissionCalculation(orderId, vendorId) {
      return client.start("commissionCalculationWorkflow", {
        workflowId: `commission-calc-${orderId}`,
        taskQueue: TASK_QUEUES.PAYMENT,
        args: [{ orderId, vendorId }],
      })
    },
    async dispatchVendorPayout(vendorId, amount) {
      return client.start("vendorPayoutWorkflow", {
        workflowId: `vendor-payout-${vendorId}-${Date.now()}`,
        taskQueue: TASK_QUEUES.PAYMENT,
        args: [{ vendorId, amount, compensation: true }],
      })
    },
    async dispatchHierarchyReconciliation(nodeId) {
      return client.start("hierarchyReconciliationWorkflow", {
        workflowId: `hierarchy-reconcile-${nodeId}`,
        taskQueue: TASK_QUEUES.HIERARCHY_SYNC,
        args: [{ nodeId }],
      })
    },
    async dispatchNodeSync(nodeId, changes) {
      return client.start("nodeSyncWorkflow", {
        workflowId: `node-sync-${nodeId}`,
        taskQueue: TASK_QUEUES.HIERARCHY_SYNC,
        args: [{ nodeId, changes, targets: ["erpnext", "payload-cms"] }],
      })
    },
  }
}

describe("Temporal Workflow Dispatch", () => {
  let dispatcher: WorkflowDispatcher

  beforeEach(() => {
    vi.clearAllMocks()
    mockWorkflowClient.start.mockResolvedValue({ workflowId: "wf_mock", runId: "run_mock" })
    dispatcher = createDispatcher(mockWorkflowClient)
  })

  describe("Order Workflows", () => {
    it("should dispatch order.created workflow", async () => {
      const result = await dispatcher.dispatchOrderCreated("ord_123", { items: ["item_1"] })
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("orderCreatedWorkflow", expect.objectContaining({
        workflowId: "order-created-ord_123",
        args: [{ orderId: "ord_123", items: ["item_1"] }],
      }))
      expect(result).toEqual({ workflowId: "wf_mock", runId: "run_mock" })
    })

    it("should dispatch order.fulfilled workflow", async () => {
      await dispatcher.dispatchOrderFulfilled("ord_456", { trackingNumber: "TRK-001" })
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("orderFulfilledWorkflow", expect.objectContaining({
        workflowId: "order-fulfilled-ord_456",
        args: [{ orderId: "ord_456", trackingNumber: "TRK-001" }],
      }))
    })

    it("should dispatch order.cancelled workflow with compensation", async () => {
      await dispatcher.dispatchOrderCancelled("ord_789", { reason: "customer_request" })
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("orderCancelledWorkflow", expect.objectContaining({
        workflowId: "order-cancelled-ord_789",
        args: [{ orderId: "ord_789", compensation: true, reason: "customer_request" }],
      }))
    })

    it("should route to correct task queue", async () => {
      await dispatcher.dispatchOrderCreated("ord_100", {})
      expect(mockWorkflowClient.start).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ taskQueue: TASK_QUEUES.ORDER_PROCESSING })
      )
    })
  })

  describe("Product Sync Workflows", () => {
    it("should dispatch product sync to ERPNext", async () => {
      await dispatcher.dispatchProductSyncToErpNext(["prod_1", "prod_2"])
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("productSyncErpNextWorkflow", expect.objectContaining({
        taskQueue: TASK_QUEUES.PRODUCT_SYNC,
        args: [{ productIds: ["prod_1", "prod_2"], target: "erpnext" }],
      }))
    })

    it("should dispatch product sync to Payload CMS", async () => {
      await dispatcher.dispatchProductSyncToPayloadCms(["prod_3", "prod_4"])
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("productSyncPayloadCmsWorkflow", expect.objectContaining({
        taskQueue: TASK_QUEUES.PRODUCT_SYNC,
        args: [{ productIds: ["prod_3", "prod_4"], target: "payload-cms" }],
      }))
    })

    it("should handle sync failures with retry", async () => {
      await dispatcher.dispatchProductSyncToErpNext(["prod_5"])
      expect(mockWorkflowClient.start).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ retry: { maximumAttempts: 3 } })
      )
    })

    it("should batch large sync operations", async () => {
      const productIds = Array.from({ length: 120 }, (_, i) => `prod_${i}`)
      await dispatcher.dispatchProductSyncToErpNext(productIds)
      expect(mockWorkflowClient.start).toHaveBeenCalledTimes(3)
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("productSyncErpNextWorkflow", expect.objectContaining({
        workflowId: "product-sync-erpnext-batch-0",
        args: [expect.objectContaining({ productIds: expect.any(Array) })],
      }))
      const firstBatchArgs = mockWorkflowClient.start.mock.calls[0][1].args[0]
      expect(firstBatchArgs.productIds).toHaveLength(50)
    })
  })

  describe("Payment Workflows", () => {
    it("should dispatch commission calculation workflow", async () => {
      await dispatcher.dispatchCommissionCalculation("ord_200", "vendor_1")
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("commissionCalculationWorkflow", expect.objectContaining({
        workflowId: "commission-calc-ord_200",
        taskQueue: TASK_QUEUES.PAYMENT,
        args: [{ orderId: "ord_200", vendorId: "vendor_1" }],
      }))
    })

    it("should dispatch vendor payout workflow", async () => {
      await dispatcher.dispatchVendorPayout("vendor_2", 1500)
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("vendorPayoutWorkflow", expect.objectContaining({
        taskQueue: TASK_QUEUES.PAYMENT,
        args: [expect.objectContaining({ vendorId: "vendor_2", amount: 1500 })],
      }))
    })

    it("should handle payment failure with saga compensation", async () => {
      await dispatcher.dispatchVendorPayout("vendor_3", 2000)
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("vendorPayoutWorkflow", expect.objectContaining({
        args: [expect.objectContaining({ compensation: true })],
      }))
    })
  })

  describe("Hierarchy Sync Workflows", () => {
    it("should dispatch hierarchy reconciliation", async () => {
      await dispatcher.dispatchHierarchyReconciliation("node_1")
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("hierarchyReconciliationWorkflow", expect.objectContaining({
        workflowId: "hierarchy-reconcile-node_1",
        taskQueue: TASK_QUEUES.HIERARCHY_SYNC,
        args: [{ nodeId: "node_1" }],
      }))
    })

    it("should sync node changes across systems", async () => {
      const changes = { name: "Updated Node", parent_id: "node_0" }
      await dispatcher.dispatchNodeSync("node_2", changes)
      expect(mockWorkflowClient.start).toHaveBeenCalledWith("nodeSyncWorkflow", expect.objectContaining({
        taskQueue: TASK_QUEUES.HIERARCHY_SYNC,
        args: [{ nodeId: "node_2", changes, targets: ["erpnext", "payload-cms"] }],
      }))
    })
  })
})
