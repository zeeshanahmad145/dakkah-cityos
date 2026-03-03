import type { MedusaContainer } from "@medusajs/framework";
import { LEDGER_SNAPSHOT_MODULE } from "../modules/ledger-snapshot";
import type LedgerSnapshotModuleService from "../modules/ledger-snapshot/service";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:ledger-snapshot");

// Cron: Daily at 02:00 UTC (after all settlement sweeps run)
export const config = { name: "ledger-snapshot", schedule: "0 2 * * *" };

export default async function ledgerSnapshotJob(container: MedusaContainer) {
  const snapshotService: LedgerSnapshotModuleService = container.resolve(
    LEDGER_SNAPSHOT_MODULE,
  );
  const settlementService = container.resolve(SETTLEMENT_MODULE) as any;
  const eventBus = container.resolve("event_bus") as any;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  logger.info(
    `Running ledger snapshot for ${yesterday.toISOString().split("T")[0]}`,
  );

  try {
    // Get all unique vendor IDs from yesterday's settlements
    const allLedgers = (await settlementService.listSettlementLedgers(
      {},
    )) as any[];
    const vendorIds = [
      ...new Set(allLedgers.map((l: any) => l.vendor_id).filter(Boolean)),
    ] as string[];

    // Add a platform-level snapshot (null vendor = platform total)
    const vendors: Array<string | undefined> = [undefined, ...vendorIds];

    let driftCount = 0;
    for (const vendorId of vendors) {
      const medusaTotals = await snapshotService.computeMedusaTotals(
        settlementService,
        yesterday,
        undefined,
        vendorId,
      );
      const erpTotals = await snapshotService.fetchErpTotals(
        yesterday,
        vendorId,
      );
      const { aboveThreshold, snapshot } = await snapshotService.recordSnapshot(
        {
          snapshotDate: yesterday,
          vendorId,
          medusaTotals,
          erpTotals,
        },
      );

      if (aboveThreshold) {
        driftCount++;
        // Emit alert event for ops notification
        await eventBus.emit?.("ops.ledger_drift", {
          snapshot_id: snapshot.id,
          vendor_id: vendorId ?? "platform",
          drift_amount: snapshot.drift_amount,
          drift_percentage: snapshot.drift_percentage,
          date: yesterday.toISOString().split("T")[0],
        });

        // Freeze payouts for this vendor
        if (vendorId) {
          await settlementService
            .updateSettlementLedgers?.({
              vendor_id: vendorId,
              status: "frozen",
              freeze_reason: "ledger_drift_detected",
            })
            .catch(() => {});
        }
      }
    }

    logger.info(
      `Ledger snapshot complete for ${yesterday.toISOString().split("T")[0]}: ` +
        `${vendors.length} vendors, ${driftCount} drift alerts`,
    );
  } catch (err) {
    logger.error(`Ledger snapshot job error: ${String(err)}`);
  }
}
