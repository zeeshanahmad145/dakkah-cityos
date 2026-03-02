import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ATTRIBUTION_MODULE } from "../modules/attribution";
import type AttributionModuleService from "../modules/attribution/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:attribution-order-credit");

export default async function attributionOrderCredit({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  total?: number;
  currency_code?: string;
}>) {
  const attributionService: AttributionModuleService =
    container.resolve(ATTRIBUTION_MODULE);
  const { id, customer_id, total = 0, currency_code } = event.data;
  if (!customer_id) return;

  try {
    const credits = await attributionService.computeCredits({
      orderId: id,
      customerId: customer_id,
      orderAmount: total,
      currencyCode: currency_code ?? "SAR",
      windowDays: 30,
      creditModel: "last_touch",
    });

    logger.info(
      `Attribution: ${credits.length} credit(s) computed for order ${id}`,
    );
  } catch (err) {
    logger.error(`Attribution credit error for order ${id}: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.completed"],
};
