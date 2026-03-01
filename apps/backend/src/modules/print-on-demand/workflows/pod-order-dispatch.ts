import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

// ─── Steps ────────────────────────────────────────────────────────────────────

const getProductTemplate = createStep(
  "get-pod-product-template",
  async (input: { podProductId: string }, { container }) => {
    const podService = container.resolve("print-on-demand") as unknown as any;
    const template = await podService.getProductTemplate(input.podProductId);
    return new StepResponse(template);
  },
);

const submitPodOrder = createStep(
  "submit-pod-order",
  async (
    input: {
      orderId: string;
      podProductId: string;
      customizationData?: Record<string, unknown>;
      quantity?: number;
    },
    { container },
  ) => {
    const podService = container.resolve("print-on-demand") as unknown as any;
    const podOrder = await podService.submitPodOrder(input);
    return new StepResponse(podOrder, { podOrderId: podOrder.id });
  },
  async ({ podOrderId }: { podOrderId: string }, { container }) => {
    const podService = container.resolve("print-on-demand") as unknown as any;
    await podService.cancelPodOrder(podOrderId).catch(() => null);
  },
);

const trackPodOrder = createStep(
  "track-pod-order",
  async (input: { podOrderId: string }, { container }) => {
    const podService = container.resolve("print-on-demand") as unknown as any;
    const status = await podService.trackPodOrder(input.podOrderId);
    return new StepResponse(status);
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const podOrderDispatchWorkflow = createWorkflow(
  "pod-order-dispatch",
  // @ts-ignore: workflow builder return type
  (input: {
    orderId: string;
    podProductId: string;
    customizationData?: Record<string, unknown>;
    quantity?: number;
  }) => {
    const template = getProductTemplate({ podProductId: input.podProductId });
    const podOrder = submitPodOrder(input);
    return { template, podOrder };
  },
);
