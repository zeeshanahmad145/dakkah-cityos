import { MedusaService } from "@medusajs/framework/utils";
import { ReconciliationConfig } from "./models/reconciliation-config";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:reconciliation-config");

/**
 * ReconciliationConfigService — manages truth hierarchy + drift threshold config.
 * Separate from EconomicHealthModuleService since it's a proper data-backed config.
 */
class ReconciliationConfigModuleService extends MedusaService({
  ReconciliationConfig,
}) {
  /**
   * Get the active config for a tenant (falls back to "default").
   */
  async getActiveConfig(tenantId?: string): Promise<any> {
    const configs = (await this.listReconciliationConfigs({
      is_active: true,
    })) as any[];

    // Prefer tenant-specific config
    if (tenantId) {
      const tenantConfig = configs.find((c: any) => c.config_key === tenantId);
      if (tenantConfig) return tenantConfig;
    }

    const defaultConfig = configs.find((c: any) => c.config_key === "default");
    if (defaultConfig) return defaultConfig;

    // Bootstrap a sensible default
    logger.info("No ReconciliationConfig found — creating default config");
    return this.createReconciliationConfigs({
      config_key: "default",
      truth_source_order: ["payment_provider", "ledger", "erp", "settlement"],
      drift_thresholds: [
        { account_type: "vendor", threshold_sar: 10, action: "auto_freeze" },
        { account_type: "escrow", threshold_sar: 1, action: "auto_freeze" },
        { account_type: "commission", threshold_sar: 50, action: "notify" },
        { account_type: "levy", threshold_sar: 0.5, action: "auto_freeze" },
        { account_type: "wallet", threshold_sar: 50, action: "notify" },
      ],
      auto_freeze_enabled: true,
      auto_freeze_grace_period_minutes: 30,
      notification_threshold_sar: 10,
      auto_reconcile_enabled: false,
      auto_reconcile_max_amount_sar: 1,
      is_active: true,
      tenant_id: null,
      metadata: null,
    } as any);
  }

  /**
   * Check if a drift amount triggers an action for an account type.
   * Returns: "none" | "notify" | "auto_freeze" | "auto_reconcile"
   */
  async getActionForDrift(
    accountType: string,
    driftAmount: number,
    tenantId?: string,
  ): Promise<"none" | "notify" | "auto_freeze" | "auto_reconcile"> {
    const config = await this.getActiveConfig(tenantId);
    const thresholds: Array<{
      account_type: string;
      threshold_sar: number;
      action: string;
    }> = config.drift_thresholds ?? [];

    const rule = thresholds.find((t) => t.account_type === accountType);
    if (!rule)
      return driftAmount > (config.notification_threshold_sar ?? 10)
        ? "notify"
        : "none";
    if (driftAmount <= 0) return "none";
    if (driftAmount >= rule.threshold_sar) return rule.action as any;
    if (driftAmount >= (config.notification_threshold_sar ?? 10))
      return "notify";
    return "none";
  }
}

export default ReconciliationConfigModuleService;
