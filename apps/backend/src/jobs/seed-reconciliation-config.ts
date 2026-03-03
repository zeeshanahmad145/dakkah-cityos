import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("script:seed-reconciliation-config");

/**
 * Seed ReconciliationConfig — Creates the default truth hierarchy + drift
 * threshold configuration if it doesn't already exist.
 *
 * Called from: startup job or medusa seed script
 * Safe to re-run: idempotent (skips if "default" config already exists)
 */
export default async function seedReconciliationConfig(
  container: MedusaContainer,
) {
  try {
    const configService = container.resolve("reconciliationConfig") as any;

    if (!configService) {
      logger.warn(
        "ReconciliationConfigModuleService not found in container — module may not be registered yet",
      );
      return;
    }

    const existing = await configService.getActiveConfig().catch(() => null);
    if (existing?.config_key === "default") {
      logger.info("ReconciliationConfig 'default' already seeded — skipping");
      return;
    }

    await configService.createReconciliationConfigs({
      config_key: "default",
      truth_source_order: ["payment_provider", "ledger", "erp", "settlement"],
      drift_thresholds: [
        // Government levy accounts: zero tolerance
        { account_type: "levy", threshold_sar: 0.5, action: "auto_freeze" },
        // Escrow: extremely sensitive
        { account_type: "escrow", threshold_sar: 1, action: "auto_freeze" },
        // Vendor payouts: high sensitivity
        { account_type: "vendor", threshold_sar: 10, action: "auto_freeze" },
        // Tax accounts: freeze immediately
        { account_type: "tax", threshold_sar: 5, action: "auto_freeze" },
        // Commission: lower sensitivity
        { account_type: "commission", threshold_sar: 50, action: "notify" },
        // Customer wallets: notify only
        { account_type: "wallet", threshold_sar: 50, action: "notify" },
        // Affiliate payouts: moderate
        { account_type: "affiliate", threshold_sar: 25, action: "notify" },
      ],
      auto_freeze_enabled: true,
      auto_freeze_grace_period_minutes: 30,
      notification_threshold_sar: 10,
      auto_reconcile_enabled: false, // Human-in-the-loop for financial corrections
      auto_reconcile_max_amount_sar: 1,
      is_active: true,
      tenant_id: null,
      metadata: null,
    } as any);

    logger.info("ReconciliationConfig 'default' successfully seeded");
  } catch (err: any) {
    logger.error("ReconciliationConfig seed failed:", err.message);
  }
}

// Run as a Medusa scheduled job on startup (once)
export const config = {
  name: "seed-reconciliation-config",
  schedule: "@once", // Run once on startup — Medusa "@once" semantics
};
