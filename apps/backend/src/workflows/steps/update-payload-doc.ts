import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYLOAD_MODULE } from "../../modules/payload";

export type UpdatePayloadDocInput = {
  collection: string;
  id: string;
  data: Record<string, any>;
} | null;

export const updatePayloadDocStep = createStep(
  "update-payload-doc",
  async (input: UpdatePayloadDocInput, { container }) => {
    const logger = container.resolve("logger");

    if (!input || !input.collection || !input.id) {
      logger.info(
        "[PayloadSync] No payload record linked or missing data. Skipping sync.",
      );
      return new StepResponse(null, null);
    }

    const payloadService = container.resolve(PAYLOAD_MODULE);
    try {
      const result = await payloadService.updateDocument(
        input.collection,
        input.id,
        input.data,
      );
      return new StepResponse(result, input);
    } catch (error: any) {
      logger.error(
        `[PayloadSync] Failed to update ${input.collection}/${input.id}: ${error.message}`,
      );
      throw new Error(
        `[PayloadSync] Failed to update ${input.collection}/${input.id}: ${error.message}`,
      );
    }
  },
  async (input, { container }) => {
    // Compensation logic: Log failure. Full rollback of a 3rd party system is complex
    // without knowing prior state. Usually handled via dead-letter queue or retry mechanisms.
    const logger = container.resolve("logger");
    if (input && input.collection && input.id) {
      logger.warn(
        `[PayloadSync] Compensation triggered for ${input.collection}/${input.id}. Manual sync may be required.`,
      );
    }
  },
);
