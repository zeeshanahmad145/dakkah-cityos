import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { subscriberLogger } from "../lib/logger";
import { appConfig } from "../lib/config";
import { syncCustomerToErpnextWorkflow } from "../workflows/sync-customer-to-erpnext";

const logger = subscriberLogger;

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  try {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: data.id },
    });

    const customer = customers[0];
    if (!customer?.email) {
      logger.warn("Customer not found or no email", { customerId: data.id });
      return;
    }

    if (appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customer.email,
        channel: "email",
        template: "customer-welcome",
        data: {
          customer_name: customer.first_name || "there",
          shop_url: appConfig.urls.storefront,
          account_url: `${appConfig.urls.storefront}/account`,
        },
      });
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New Customer",
          description: `New customer registered: ${customer.email}`,
        },
      });
    }

    logger.info("Customer created notification sent", {
      customerId: data.id,
      email: customer.email,
    });

    // Sync Customer to ERPNext
    const { result: erpResult } = await syncCustomerToErpnextWorkflow(
      container,
    ).run({
      input: { customerId: data.id },
    });

    if (erpResult.success === false) {
      if (erpResult.error === "Not Configured") {
        logger.info(
          `[ERPNextSync] Customer sync skipped: ERPNext not configured`,
        );
      } else {
        logger.error(`[ERPNextSync] Customer sync failed: ${erpResult.error}`);
      }
    } else {
      logger.info(
        `[ERPNextSync] Successfully synced customer ${data.id} to ERPNext`,
      );
    }
  } catch (error) {
    logger.error("Customer created handler error", error, {
      customerId: data.id,
    });
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
