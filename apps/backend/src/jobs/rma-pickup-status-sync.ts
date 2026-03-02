import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:rma-pickup-status-sync");

const FLEETBASE_URL = process.env.FLEETBASE_API_URL ?? "";
const FLEETBASE_KEY = process.env.FLEETBASE_API_KEY ?? "";

export default async function rmaPickupStatusSync(container: MedusaContainer) {
  if (!FLEETBASE_URL || !FLEETBASE_KEY) {
    logger.warn(
      "FLEETBASE_API_URL or FLEETBASE_API_KEY not set — skipping RMA pickup sync",
    );
    return;
  }

  const rmaService = container.resolve("rma") as any;
  const eventBus = container.resolve("eventBusService") as any;

  try {
    // Find open return requests with a pickup ID
    const openRequests =
      ((await rmaService.listReturnRequests?.({
        pickup_status: ["pending", "scheduled", "in_transit"],
      })) as any[]) ?? [];

    if (openRequests.length === 0) return;

    let updated = 0;

    for (const req of openRequests) {
      if (!req.reverse_pickup_id) continue;

      try {
        const res = await fetch(
          `${FLEETBASE_URL}/v1/returns/${req.reverse_pickup_id}`,
          { headers: { Authorization: `Bearer ${FLEETBASE_KEY}` } },
        );
        if (!res.ok) continue;

        const data = (await res.json()) as any;
        const newStatus = data.status;

        if (newStatus === req.pickup_status) continue;

        await rmaService.updateReturnRequests?.({
          id: req.id,
          pickup_status: newStatus,
        });
        updated++;

        if (newStatus === "delivered") {
          await eventBus.emit?.("rma.pickup_delivered", {
            return_request_id: req.id,
            order_id: req.order_id,
            vendor_id: req.vendor_id,
            disposition: req.disposition ?? "restock",
            pickup_delivered: true,
            items: req.items,
          });
        }
      } catch {
        // Skip individual failures — non-fatal
      }
    }

    logger.info(
      `RMA pickup sync: ${updated}/${openRequests.length} statuses updated`,
    );
  } catch (err) {
    logger.error(`RMA pickup sync error: ${String(err)}`);
  }
}

export const config = {
  name: "rma-pickup-status-sync",
  schedule: "*/30 * * * *", // Every 30 minutes
};
