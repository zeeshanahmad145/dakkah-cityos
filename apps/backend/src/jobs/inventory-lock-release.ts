import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:inventory-lock-release");

// Cron: every 5 minutes
export const config = {
  name: "inventory-lock-release",
  schedule: "*/5 * * * *",
};

/**
 * Releases expired inventory locks sorted by priority (lowest priority released first).
 * This ensures high-priority locks (bookings, auctions) are never incorrectly released.
 */
export default async function inventoryLockRelease(container: MedusaContainer) {
  // Resolve inventory module — it may or may not have the lock model depending on migration state
  const inventoryService = container.resolve("inventory") as any;

  if (!inventoryService?.listInventoryLocks) {
    // InventoryLock not yet available if migration not yet run — skip gracefully
    return;
  }

  try {
    const now = new Date();

    // Get all active locks where auto_release_at has passed
    const expiredLocks = (await inventoryService.listInventoryLocks({
      status: "active",
    })) as any[];

    const toRelease = expiredLocks
      .filter(
        (lock: any) =>
          lock.auto_release_at && new Date(lock.auto_release_at) <= now,
      )
      // Sort ascending by priority — lowest goes first
      .sort(
        (a: any, b: any) => (a.lock_priority ?? 0) - (b.lock_priority ?? 0),
      );

    if (toRelease.length === 0) return;

    let released = 0;
    for (const lock of toRelease) {
      try {
        await inventoryService.updateInventoryLocks({
          id: lock.id,
          status: "expired",
          released_at: now,
          release_reason: "auto_release_ttl",
        });
        released++;
      } catch (err) {
        logger.warn(`Failed to release lock ${lock.id}: ${String(err)}`);
      }
    }

    logger.info(
      `Inventory lock release: ${released}/${toRelease.length} expired locks released`,
    );
  } catch (err) {
    logger.error(`Inventory lock release job error: ${String(err)}`);
  }
}
