import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { appConfig } from "../lib/config";

export type CancelFleetDispatchInput = {
  orderId: string;
};

const cancelDispatchApiStep = createStep(
  "cancel-fleetbase-dispatch-step",
  async (input: CancelFleetDispatchInput, { container }) => {
    const logger = container.resolve("logger") as unknown as any;

    try {
      if (!appConfig.fleetbase.isConfigured) {
        return new StepResponse<any, any>({
          status: "skipped",
          message: "Fleetbase is not configured.",
        });
      }

      // In a production system, we would query the database to find the exact Fleetbase Order ID
      // mapped to this Medusa Order ID. For now, we assume the Order ID is mapped 1:1 or
      // we query the Fleetbase API to find the active dispatch for this Medusa reference.
      const fleetbaseOrderId = `fb_order_${input.orderId}`;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appConfig.fleetbase.apiKey}`,
      };

      const res = await fetch(
        `${appConfig.fleetbase.url}/v1/orders/${fleetbaseOrderId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      // If the order wasn't found in Fleetbase, it might not have been dispatched yet
      if (res.status === 404) {
        return new StepResponse<any, any>({
          status: "skipped",
          message: `No active Fleetbase dispatch found for order ${input.orderId}`,
        });
      }

      if (!res.ok) {
        throw new Error(`Fleetbase API cancellation failed: ${res.statusText}`);
      }

      logger.info(
        `Successfully cancelled Fleetbase dispatch for order ${input.orderId}`,
      );

      return new StepResponse<any, any>({
        status: "success",
        data: { orderId: input.orderId },
      });
    } catch (error: unknown) {
      logger.error(`Fleetbase cancellation step failed: ${(error instanceof Error ? error.message : String(error))}`);
      return new StepResponse<any, any>({
        status: "error",
        message: (error instanceof Error ? error.message : String(error)),
      });
    }
  },
);

export const cancelFleetbaseDispatchWorkflow = createWorkflow(
  "cancel-fleetbase-dispatch",
  function (input: CancelFleetDispatchInput) {
    const result = cancelDispatchApiStep(input);
    return new WorkflowResponse(result);
  },
);
