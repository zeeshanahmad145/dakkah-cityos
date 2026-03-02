import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:rma-disposition");

const FLEETBASE_URL = process.env.FLEETBASE_API_URL ?? "";
const FLEETBASE_KEY = process.env.FLEETBASE_API_KEY ?? "";

export default async function rmaDisposition({
  event,
  container,
}: SubscriberArgs<{
  return_request_id: string;
  disposition: "restock" | "refurbish" | "scrap" | "vendor_return";
  pickup_delivered: boolean;
  order_id?: string;
  vendor_id?: string;
  items?: any[];
}>) {
  const d = event.data;
  if (!d.pickup_delivered) return;

  try {
    switch (d.disposition) {
      case "restock": {
        // Trigger inventory adjustment via Medusa inventory module
        const inventoryService = container.resolve("inventoryService") as any;
        if (inventoryService?.updateInventoryLevel && Array.isArray(d.items)) {
          for (const item of d.items) {
            await inventoryService.updateInventoryLevel?.(
              item.inventory_item_id,
              item.location_id,
              { stocked_quantity: item.quantity },
            );
          }
        }
        logger.info(
          `RMA ${d.return_request_id}: ${d.items?.length ?? 0} items restocked`,
        );
        break;
      }
      case "vendor_return": {
        // Emit event for payout/settlement deduction
        const eventBus = container.resolve("eventBusService") as any;
        await eventBus.emit?.("rma.vendor_return_confirmed", {
          return_request_id: d.return_request_id,
          vendor_id: d.vendor_id,
          order_id: d.order_id,
        });
        logger.info(`RMA ${d.return_request_id}: vendor return confirmed`);
        break;
      }
      case "scrap": {
        logger.info(`RMA ${d.return_request_id}: items scrapped (loop closed)`);
        break;
      }
      case "refurbish": {
        logger.info(
          `RMA ${d.return_request_id}: items queued for refurbishment`,
        );
        break;
      }
    }

    // Notify Fleetbase of completion
    if (FLEETBASE_URL && FLEETBASE_KEY) {
      await fetch(
        `${FLEETBASE_URL}/v1/returns/${d.return_request_id}/disposition`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FLEETBASE_KEY}`,
          },
          body: JSON.stringify({
            disposition: d.disposition,
            status: "completed",
          }),
        },
      ).catch((err) =>
        logger.warn(`Fleetbase disposition update failed: ${String(err)}`),
      );
    }
  } catch (err) {
    logger.error(
      `RMA disposition error (${d.return_request_id}): ${String(err)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["rma.pickup_delivered"],
};
