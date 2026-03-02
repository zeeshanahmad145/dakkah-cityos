import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:dunning-cycle");

export default async function dunningCycle(container: MedusaContainer) {
  const companyService = container.resolve("company") as any;
  const eventBus = container.resolve("eventBusService") as any;

  try {
    // Find companies with overdue invoices
    const companies = await companyService.listCompanies?.({
      has_overdue_invoices: true,
    });
    if (!companies || companies.length === 0) return;

    const today = new Date();

    for (const company of companies) {
      const policy = await companyService.retrieveNetTermsPolicy?.(company.id);
      if (!policy) continue;

      const dunningThreshold = policy.dunning_start_days_overdue ?? 7;
      const autoSuspendThreshold = policy.auto_suspend_at ?? 30;
      const lateFeeRate = policy.late_fee_rate ?? 0.015;

      for (const invoice of company.overdue_invoices ?? []) {
        const overdueDays = Math.floor(
          (today.getTime() - new Date(invoice.due_at).getTime()) / 86400000,
        );
        if (overdueDays < dunningThreshold) continue;

        const lateFee = invoice.total * lateFeeRate;

        // Create dunning record
        await companyService.createDunningRecords?.({
          company_id: company.id,
          invoice_id: invoice.id,
          overdue_days: overdueDays,
          fee_charged: lateFee,
          notice_sent_at: today,
        });

        // Emit dunning notification
        await eventBus.emit?.("company.dunning_notice", {
          company_id: company.id,
          invoice_id: invoice.id,
          overdue_days: overdueDays,
          late_fee: lateFee,
        });

        // Auto-suspend if over threshold
        if (overdueDays >= autoSuspendThreshold) {
          await companyService.updateCompanies?.({
            id: company.id,
            status: "suspended",
          });
          logger.warn(
            `Company ${company.id} AUTO-SUSPENDED (overdue ${overdueDays} days)`,
          );
        }
      }
    }

    logger.info("Dunning cycle complete");
  } catch (err) {
    logger.error(`Dunning cycle error: ${String(err)}`);
  }
}

export const config = {
  name: "dunning-cycle",
  schedule: "0 8 * * *", // Daily at 8am
};
