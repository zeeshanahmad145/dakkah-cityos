import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { FRAUD_MODULE } from "../modules/fraud";
import type FraudModuleService from "../modules/fraud/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:fraud-order-check");

export default async function fraudOrderCheck({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  total?: number;
  currency_code?: string;
  coupon_code?: string;
  ip_country?: string;
  billing_country?: string;
  items?: any[];
}>) {
  const fraudService: FraudModuleService = container.resolve(FRAUD_MODULE);
  const {
    id,
    customer_id,
    total = 0,
    coupon_code,
    ip_country,
    billing_country,
  } = event.data;
  if (!customer_id) return;

  try {
    // Get order velocity for this customer (last hour)
    // In real impl: count from order repository; here we estimate
    const recentSignals = (await fraudService.listFraudSignals({
      customer_id,
      signal_type: "velocity",
    })) as any[];
    const recentCount = recentSignals.filter((s: any) => {
      const age = Date.now() - new Date(s.created_at ?? Date.now()).getTime();
      return age < 3600000;
    }).length;

    const { action, score } = await fraudService.evaluateOrder({
      orderId: id,
      customerId: customer_id,
      orderTotal: total,
      cartItemCount: event.data.items?.length ?? 1,
      customerOrderCountLastHour: recentCount,
      couponCode: coupon_code,
      ipCountry: ip_country,
      billingCountry: billing_country,
    });

    if (action === "block") {
      logger.warn(`Order ${id} BLOCKED by fraud engine (score=${score})`);
      // In real: throw error to prevent order completion
    } else if (action === "flag") {
      logger.warn(`Order ${id} FLAGGED for review (score=${score})`);
    }
  } catch (err) {
    logger.error(`Fraud check error for order ${id}: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};
