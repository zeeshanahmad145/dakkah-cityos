import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { subscriberLogger } from "../lib/logger";
import NotificationPreferencesModuleService from "../modules/notification-preferences/service";

const logger = subscriberLogger;

export default async function customerNotificationPreferencesHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const notificationPreferences = container.resolve(
      "notificationPreferences",
    ) as unknown as any;

    const existing = await notificationPreferences.listNotificationPreferences({
      customer_id: data.id,
    });

    if (existing.length > 0) {
      return;
    }

    await notificationPreferences.createNotificationPreferences({
      customer_id: data.id,
      tenant_id: "default",
      channel: "email",
      event_type: "order_updates",
      enabled: true,
    });

    await notificationPreferences.createNotificationPreferences({
      customer_id: data.id,
      tenant_id: "default",
      channel: "email",
      event_type: "marketing",
      enabled: false,
    });

    logger.info("Default notification preferences created for customer", {
      customerId: data.id,
    });
  } catch (error) {
    logger.error("Customer notification preferences error", error, {
      customerId: data.id,
    });
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
