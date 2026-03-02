import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { TAX_ARTIFACT_MODULE } from "../modules/tax-artifact";
import type TaxArtifactModuleService from "../modules/tax-artifact/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:tax-credit-note-generate");

export default async function taxCreditNoteGenerate({
  event,
  container,
}: SubscriberArgs<{ id: string; refund_amount?: number; reason?: string }>) {
  const taxService: TaxArtifactModuleService =
    container.resolve(TAX_ARTIFACT_MODULE);
  const { id, refund_amount = 0, reason = "Customer refund" } = event.data;

  try {
    await taxService.generateCreditNote(id, reason, refund_amount);
    logger.info(`Tax credit note generated for order ${id}`);
  } catch (err) {
    // Non-fatal: invoice may not exist for very old or manual orders
    logger.warn(
      `Tax credit note generation warning for order ${id}: ${String(err)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["order.refunded"],
};
