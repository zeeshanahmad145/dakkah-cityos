import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type FleetDispatchInput = {
  orderId: string
  pickupAddress: string
  deliveryAddress: string
  packageWeight: number
  priority: string
  tenantId: string
}

const prepareOrderForDispatchStep = createStep(
  "prepare-order-dispatch-step",
  async (input: FleetDispatchInput) => {
    const dispatchRequest = {
      order_id: input.orderId,
      pickup: input.pickupAddress,
      delivery: input.deliveryAddress,
      weight: input.packageWeight,
      priority: input.priority,
      status: "pending_assignment",
      created_at: new Date(),
    }
    return new StepResponse({ dispatchRequest }, { dispatchRequest })
  },
  async (compensationData: { dispatchRequest: any } | undefined, { container }) => {
    if (!compensationData?.dispatchRequest) return
    try {
      const fulfillmentModule = container.resolve("fulfillment") as any
      if (compensationData.dispatchRequest.id) {
        await fulfillmentModule.cancelFulfillment(compensationData.dispatchRequest.id)
      }
    } catch (error) {
    }
  }
)

const findAvailableDriverStep = createStep(
  "find-available-driver-step",
  async (input: { pickupAddress: string; priority: string }) => {
    const driver = {
      driver_id: `driver_${Date.now()}`,
      name: "Available Driver",
      distance_km: 2.5,
      estimated_pickup: new Date(Date.now() + 15 * 60 * 1000),
    }
    return new StepResponse({ driver })
  }
)

const assignDriverStep = createStep(
  "assign-driver-step",
  async (input: { orderId: string; driverId: string }) => {
    const assignment = {
      order_id: input.orderId,
      driver_id: input.driverId,
      status: "assigned",
      assigned_at: new Date(),
    }
    return new StepResponse({ assignment }, { assignment })
  },
  async (compensationData: { assignment: any } | undefined, { container }) => {
    if (!compensationData?.assignment) return
    try {
      const fulfillmentModule = container.resolve("fulfillment") as any
      if (compensationData.assignment.id) {
        await fulfillmentModule.updateFulfillment(compensationData.assignment.id, {
          status: "unassigned",
          driver_id: null,
        })
      }
    } catch (error) {
    }
  }
)

const initializeTrackingStep = createStep(
  "initialize-delivery-tracking-step",
  async (input: { orderId: string; driverId: string }) => {
    const tracking = {
      tracking_id: `TRK-${input.orderId}-${Date.now()}`,
      order_id: input.orderId,
      driver_id: input.driverId,
      status: "in_transit",
      started_at: new Date(),
    }
    return new StepResponse({ tracking }, { tracking })
  },
  async (compensationData: { tracking: any } | undefined, { container }) => {
    if (!compensationData?.tracking) return
    try {
      const fulfillmentModule = container.resolve("fulfillment") as any
      if (compensationData.tracking.tracking_id) {
        await fulfillmentModule.cancelFulfillment(compensationData.tracking.tracking_id)
      }
    } catch (error) {
    }
  }
)

export const fleetDispatchWorkflow = createWorkflow(
  "fleet-dispatch-workflow",
  (input: FleetDispatchInput) => {
    const { dispatchRequest } = prepareOrderForDispatchStep(input)
    const { driver } = findAvailableDriverStep({ pickupAddress: input.pickupAddress, priority: input.priority })
    const { assignment } = assignDriverStep({ orderId: input.orderId, driverId: driver.driver_id })
    const { tracking } = initializeTrackingStep({ orderId: input.orderId, driverId: driver.driver_id })
    return new WorkflowResponse({ dispatchRequest, assignment, tracking })
  }
)
