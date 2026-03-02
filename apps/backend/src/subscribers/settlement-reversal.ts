import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:settlement-reversal");

export default async function settlementReversal({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);
  const triggerType = event.name === "order.refunded" ? "refund" : "rma";

  try {
    const query = container.resolve("query");
    // Find ledger for this order
    const orderId = event.data.order_id ?? event.data.id;
    const ledgers = (await settlementService.listSettlementLedgers({
      order_id: orderId,
    })) as any[];
    if (ledgers.length === 0) {
      logger.warn(`No settlement ledger found for order ${orderId}`);
      return;
    }

    const ledger = ledgers[0];
    if (ledger.status === "reversed") {
      logger.info(`Settlement already reversed for order ${orderId}`);
      return;
    }

    await settlementService.reverseSettlement(
      ledger.id,
      ledger.gross_amount,
      triggerType,
      event.data.id,
    );

    logger.info(
      `Settlement reversed for order ${orderId} (trigger: ${triggerType})`,
    );
  } catch (err) {
    logger.error(`Settlement reversal error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.refunded", "rma.inspection_approved"],
};
