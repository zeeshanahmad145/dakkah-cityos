import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type OrderFulfillmentInput = {
  orderId: string;
  items: { lineItemId: string; quantity: number }[];
  shippingMethod: string;
  warehouseId: string;
};

const validateOrderStep = createStep(
  "validate-order-step",
  async (input: OrderFulfillmentInput, { container }) => {
    const orderModule = container.resolve("order") as unknown as any;
    const order = await orderModule.retrieveOrder(input.orderId);
    if (!order) throw new Error(`Order ${input.orderId} not found`);
    return new StepResponse({ order }, { orderId: input.orderId });
  },
);

const allocateInventoryStep = createStep(
  "allocate-inventory-step",
  async (input: OrderFulfillmentInput, { container }) => {
    const inventoryModule = container.resolve("inventory") as unknown as any;
    const allocations = await inventoryModule.createReservationItems(
      input.items.map((item) => ({
        line_item_id: item.lineItemId,
        quantity: item.quantity,
        location_id: input.warehouseId,
      })),
    );
    return new StepResponse({ allocations }, { allocations });
  },
  async (
    compensationData: { allocations: any[] } | undefined,
    { container },
  ) => {
    if (!compensationData?.allocations?.length) return;
    try {
      const inventoryModule = container.resolve("inventory") as unknown as any;
      for (const alloc of compensationData.allocations) {
        await inventoryModule.deleteReservationItems(alloc.id);
      }
    } catch (error) {}
  },
);

const createShipmentStep = createStep(
  "create-shipment-step",
  async (input: OrderFulfillmentInput, { container }) => {
    const fulfillmentModule = container.resolve("fulfillment") as unknown as any;
    const shipment = await fulfillmentModule.createFulfillment({
      order_id: input.orderId,
      items: input.items,
      shipping_method: input.shippingMethod,
    });
    return new StepResponse({ shipment }, { shipmentId: shipment.id });
  },
  async (
    compensationData: { shipmentId: string } | undefined,
    { container },
  ) => {
    if (!compensationData?.shipmentId) return;
    try {
      const fulfillmentModule = container.resolve("fulfillment") as unknown as any;
      await fulfillmentModule.cancelFulfillment(compensationData.shipmentId);
    } catch (error) {}
  },
);

export const orderFulfillmentWorkflow = createWorkflow(
  "order-fulfillment-workflow",
  (input: OrderFulfillmentInput) => {
    const { order } = validateOrderStep(input);
    const { allocations } = allocateInventoryStep(input);
    const { shipment } = createShipmentStep(input);
    return new WorkflowResponse({ order, allocations, shipment });
  },
);
