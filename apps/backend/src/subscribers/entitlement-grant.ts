import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../modules/entitlements";
import type EntitlementsModuleService from "../modules/entitlements/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:entitlement-grant");

const SOURCE_MAP: Record<string, { resourceType: string }> = {
  "subscription.activated": { resourceType: "subscription_access" },
  "membership.enrolled": { resourceType: "membership_access" },
  "order.completed": { resourceType: "digital_content" },
};

export default async function entitlementGrant({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  subscription_plan_id?: string;
  plan_type?: string;
  resource_id?: string;
  valid_until?: string;
}>) {
  const entitlementsService: EntitlementsModuleService =
    container.resolve(ENTITLEMENTS_MODULE);
  const mapping = SOURCE_MAP[event.name];
  if (!mapping) return;

  const customerId = event.data.customer_id;
  if (!customerId) return;

  try {
    await entitlementsService.grant({
      customerId,
      sourceModule: event.name.split(".")[0],
      sourceId: event.data.id,
      resourceType: mapping.resourceType,
      resourceId: event.data.resource_id ?? null,
      validUntil: event.data.valid_until
        ? new Date(event.data.valid_until)
        : null,
    });
    logger.info(
      `Entitlement granted for customer ${customerId} (${event.name})`,
    );
  } catch (err) {
    logger.error(`Entitlement grant error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["subscription.activated", "membership.enrolled", "order.completed"],
};
