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
  vehicle_type?: string
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
  async (input: { pickupAddress: string; priority: string; vehicle_type?: string }, { container }) => {
    try {
      const fleetbaseService = container.resolve("fleetbaseService") as any
      const drivers = await fleetbaseService.getAvailableDrivers({
        location: input.pickupAddress,
        vehicle_type: input.vehicle_type || "standard",
      })
      if (!drivers || drivers.length === 0) {
        throw new Error("No available drivers found")
      }
      const selectedDriver = drivers[0]
      const driver = {
        driver_id: selectedDriver.id,
        name: selectedDriver.name,
        phone: selectedDriver.phone,
        vehicle_type: selectedDriver.vehicle_type,
        current_location: selectedDriver.current_location,
        source: "fleetbase",
      }
      return new StepResponse({ driver })
    } catch (error) {
      const driver = {
        driver_id: `manual_queue_${Date.now()}`,
        name: "Pending Manual Assignment",
        phone: null as any,
        vehicle_type: input.vehicle_type || "standard",
        current_location: null as any,
        source: "manual_queue",
      }
      return new StepResponse({ driver })
    }
  }
)

const assignDriverStep = createStep(
  "assign-driver-step",
  async (input: { orderId: string; driverId: string; source?: string }, { container }) => {
    if (input.source === "manual_queue") {
      const assignment = {
        order_id: input.orderId,
        driver_id: input.driverId,
        status: "queued_for_manual_assignment",
        assigned_at: new Date(),
      }
      return new StepResponse({ assignment }, { assignment })
    }

    try {
      const fleetbaseService = container.resolve("fleetbaseService") as any
      await fleetbaseService.assignDriver(input.orderId, input.driverId)
      const assignment = {
        order_id: input.orderId,
        driver_id: input.driverId,
        status: "assigned",
        assigned_at: new Date(),
      }
      return new StepResponse({ assignment }, { assignment })
    } catch (error) {
      const assignment = {
        order_id: input.orderId,
        driver_id: input.driverId,
        status: "queued_for_manual_assignment",
        assignment_error: error instanceof Error ? error.message : "Failed to assign driver via FleetbaseService",
        assigned_at: new Date(),
      }
      return new StepResponse({ assignment }, { assignment })
    }
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
    const { driver } = findAvailableDriverStep({
      pickupAddress: input.pickupAddress,
      priority: input.priority,
      vehicle_type: input.vehicle_type,
    })
    const { assignment } = assignDriverStep({
      orderId: input.orderId,
      driverId: driver.driver_id,
      source: driver.source,
    })
    const { tracking } = initializeTrackingStep({ orderId: input.orderId, driverId: driver.driver_id })
    return new WorkflowResponse({ dispatchRequest, assignment, tracking })
  }
)
