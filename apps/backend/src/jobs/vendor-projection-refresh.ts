import type { MedusaContainer } from "@medusajs/framework";
import { PROJECTIONS_MODULE } from "../modules/projections";
import type ProjectionsModuleService from "../modules/projections/service";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:vendor-projection-refresh");

// Cron: Every hour at minute 5
export const config = {
  name: "vendor-projection-refresh",
  schedule: "5 * * * *",
};

export default async function vendorProjectionRefresh(
  container: MedusaContainer,
) {
  const projectionsService: ProjectionsModuleService =
    container.resolve(PROJECTIONS_MODULE);
  const settlementService = container.resolve(SETTLEMENT_MODULE) as any;

  try {
    // Get all unique vendor IDs from settlement ledgers
    const allLedgers = (await settlementService.listSettlementLedgers(
      {},
    )) as any[];
    const vendorIds = [
      ...new Set(allLedgers.map((l: any) => l.vendor_id).filter(Boolean)),
    ] as string[];

    if (vendorIds.length === 0) {
      logger.info("Vendor projection refresh: no vendors to update");
      return;
    }

    let refreshed = 0;
    for (const vendorId of vendorIds) {
      // Refresh today, MTD, and YTD projections for each vendor
      await Promise.all([
        projectionsService
          .refreshVendorProjection(vendorId, "today", settlementService)
          .catch(() => {}),
        projectionsService
          .refreshVendorProjection(vendorId, "mtd", settlementService)
          .catch(() => {}),
        projectionsService
          .refreshVendorProjection(vendorId, "ytd", settlementService)
          .catch(() => {}),
      ]);
      refreshed++;
    }

    logger.info(
      `Vendor projection refresh: updated ${refreshed} vendors × 3 periods = ${refreshed * 3} projections`,
    );
  } catch (err) {
    logger.error(`Vendor projection refresh error: ${String(err)}`);
  }
}
