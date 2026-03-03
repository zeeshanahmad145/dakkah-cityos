import { model } from "@medusajs/framework/utils";

/**
 * InventoryLock — priority-based inventory reservation system.
 * Lock priority hierarchy (higher = wins on conflict):
 *   booking=10  > auction=8  > cart=5  > warehouse=3
 *
 * When a lock conflict is detected (same variant_id, overlapping period),
 * the lower-priority lock is rejected with a conflict error.
 */
const InventoryLock = model.define("inventory_lock", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  quantity: model.number().default(1),
  // lock_type: booking | auction | cart | warehouse | manual
  lock_type: model.enum(["booking", "auction", "cart", "warehouse", "manual"]),
  // lock_priority: booking=10, auction=8, cart=5, warehouse=3, manual=1
  lock_priority: model.number(),
  // Reference to the entity holding the lock
  holder_id: model.text(), // order_id | cart_id | auction_id | booking_id
  holder_type: model.text(), // order | cart | auction | booking
  // When the lock should automatically expire if not confirmed
  auto_release_at: model.dateTime().nullable(),
  // Status: active | released | confirmed | expired
  status: model
    .enum(["active", "released", "confirmed", "expired"])
    .default("active"),
  tenant_id: model.text().nullable(),
  released_at: model.dateTime().nullable(),
  release_reason: model.text().nullable(),
});

export { InventoryLock };
