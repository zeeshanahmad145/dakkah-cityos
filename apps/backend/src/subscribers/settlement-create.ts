import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:settlement-create");

// Platform fee rate — ideally from env / tenant config
const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE ?? "0.05");

export default async function settlementCreate({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  total: number;
  currency_code: string;
  vendor_id?: string;
  affiliate_id?: string;
  ambassador_id?: string;
  tax_total?: number;
}>) {
  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);
  const {
    id,
    total,
    currency_code,
    vendor_id,
    affiliate_id,
    ambassador_id,
    tax_total,
  } = event.data;

  try {
    await settlementService.settleOrder({
      orderId: id,
      grossAmount: total,
      platformFeeRate: PLATFORM_FEE_RATE,
      vendorId: vendor_id,
      affiliateId: affiliate_id,
      ambassadorId: ambassador_id,
      taxAmount: tax_total ?? 0,
      currencyCode: currency_code ?? "SAR",
    });

    logger.info(`Settlement created for order ${id}`);
  } catch (err) {
    logger.error(`Settlement error for order ${id}: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.completed"],
};
