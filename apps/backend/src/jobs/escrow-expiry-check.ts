import type { MedusaContainer } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../modules/entitlements";
import type EntitlementsModuleService from "../modules/entitlements/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:escrow-expiry-check");

export default async function escrowExpiryCheck(container: MedusaContainer) {
  const entitlementsService: EntitlementsModuleService =
    container.resolve(ENTITLEMENTS_MODULE);

  try {
    const expired = await entitlementsService.expireStale();
    if (expired > 0) {
      logger.info(`Expired ${expired} stale entitlements`);
    }
  } catch (err) {
    logger.error(`Escrow expiry check error: ${String(err)}`);
  }
}

export const config = {
  name: "escrow-expiry-check",
  schedule: "0 * * * *", // every hour
};
