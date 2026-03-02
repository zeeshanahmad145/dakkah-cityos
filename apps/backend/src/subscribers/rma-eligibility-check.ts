import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { RMA_MODULE } from "../modules/rma";
import type RmaModuleService from "../modules/rma/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:rma-eligibility-check");

export default async function rmaEligibilityCheck({
  event,
  container,
}: SubscriberArgs<{
  order_id: string;
  customer_id: string;
  vendor_id?: string;
  return_type?: string;
  reason: string;
  reason_details?: string;
  items: any[];
  delivered_at?: string;
}>) {
  const rmaService: RmaModuleService = container.resolve(RMA_MODULE);
  const {
    order_id,
    customer_id,
    vendor_id,
    return_type,
    reason,
    reason_details,
    items,
    delivered_at,
  } = event.data;

  try {
    const deliveredDate = delivered_at ? new Date(delivered_at) : new Date();
    const {
      eligible,
      reason: ineligibleReason,
      expiresAt,
    } = await rmaService.checkEligibility(
      order_id,
      vendor_id ?? null,
      deliveredDate,
      return_type ?? "return",
    );

    if (!eligible) {
      logger.warn(`RMA ineligible for order ${order_id}: ${ineligibleReason}`);
      return;
    }

    await rmaService.createReturnRequests({
      order_id,
      customer_id,
      status: "pending",
      return_type: return_type ?? "return",
      reason,
      reason_details: reason_details ?? null,
      items,
      vendor_id: vendor_id ?? null,
      eligibility_expires_at: expiresAt ?? null,
    } as any);

    logger.info(`RMA created for order ${order_id}`);
  } catch (err) {
    logger.error(`RMA eligibility check error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.return_requested"],
};
