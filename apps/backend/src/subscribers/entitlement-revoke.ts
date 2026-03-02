import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../modules/entitlements";
import type EntitlementsModuleService from "../modules/entitlements/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:entitlement-revoke");

export default async function entitlementRevoke({
  event,
  container,
}: SubscriberArgs<{ id: string; customer_id?: string }>) {
  const entitlementsService: EntitlementsModuleService =
    container.resolve(ENTITLEMENTS_MODULE);
  const moduleSource = event.name.split(".")[0];
  const customerId = event.data.customer_id;
  if (!customerId) return;

  try {
    // Find entitlements from this source
    const entitlements = (await entitlementsService.listEntitlements({
      customer_id: customerId,
      source_module: moduleSource,
      source_id: event.data.id,
      status: "active",
    })) as any[];

    for (const ent of entitlements) {
      await entitlementsService.revoke(
        ent.id,
        `${event.name} event`,
        false /* grace period */,
      );
    }

    if (entitlements.length > 0) {
      logger.info(
        `${entitlements.length} entitlements set to grace for customer ${customerId}`,
      );
    }
  } catch (err) {
    logger.error(`Entitlement revoke error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: [
    "subscription.expired",
    "subscription.cancelled",
    "membership.cancelled",
    "order.refunded",
  ],
};
