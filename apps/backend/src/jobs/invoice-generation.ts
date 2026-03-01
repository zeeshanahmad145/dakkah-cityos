// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function invoiceGenerationJob(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as unknown as any;
  const invoiceService = container.resolve("invoice") as unknown as any;
  const eventBus = container.resolve(Modules.EVENT_BUS) as unknown as any;

  logger.info("[Invoice Generation] Starting monthly invoice generation...");

  try {
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name", "email", "payment_terms_days", "metadata"],
      filters: {
        status: "active",
        payment_terms_days: { $gt: 0 },
      },
    });

    if (!companies || companies.length === 0) {
      logger.info("[Invoice Generation] No companies need invoices");
      return;
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let generatedCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        const { data: orders } = await query.graph({
          entity: "order",
          fields: ["id", "display_id", "total", "created_at", "currency_code"],
          filters: {
            metadata: { company_id: company.id },
            status: "completed",
            created_at: {
              $gte: lastMonth.toISOString(),
              $lte: lastMonthEnd.toISOString(),
            },
          },
        });

        if (!orders || orders.length === 0) {
          continue;
        }

        const paymentTermsDays = company.payment_terms_days || 30;
        const dueDate = new Date(
          now.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000,
        );

        const invoiceItems = orders.map((order: any) => ({
          title: `Order #${order.display_id}`,
          description: `Order placed on ${new Date(order.created_at).toLocaleDateString()}`,
          order_id: order.id,
          order_display_id: String(order.display_id),
          quantity: 1,
          unit_price: Number(order.total),
        }));

        const { invoice, items } = await invoiceService.createInvoiceWithItems({
          company_id: company.id,
          issue_date: now,
          due_date: dueDate,
          period_start: lastMonth,
          period_end: lastMonthEnd,
          payment_terms: `net_${paymentTermsDays}`,
          payment_terms_days: paymentTermsDays,
          currency_code: orders[0]?.currency_code || "usd",
          notes: `Monthly invoice for ${lastMonth.toLocaleString("default", { month: "long", year: "numeric" })}`,
          items: invoiceItems,
          metadata: {
            generated_by: "invoice-generation-job",
            order_count: orders.length,
          },
        });

        await invoiceService.markAsSent(invoice.id);

        logger.info(
          `[Invoice Generation] Created ${invoice.invoice_number} for ${company.name}: $${invoice.total} (${items.length} items)`,
        );

        await eventBus.emit("invoice.created", {
          invoice_id: invoice.id,
          company_id: company.id,
          invoice_number: invoice.invoice_number,
          total: invoice.total,
          due_date: dueDate,
        });

        generatedCount++;
      } catch (error: unknown) {
        logger.error(
          `[Invoice Generation] Failed for company ${company.name}: ${(error instanceof Error ? error.message : String(error))}`,
        );
        errorCount++;
      }
    }

    logger.info(
      `[Invoice Generation] Completed: ${generatedCount} invoices generated, ${errorCount} errors`,
    );

    const overdueInvoices = await invoiceService.markOverdueInvoices();
    if (overdueInvoices.length > 0) {
      logger.info(
        `[Invoice Generation] Marked ${overdueInvoices.length} invoices as overdue`,
      );

      for (const invoice of overdueInvoices) {
        await eventBus.emit("invoice.overdue", {
          invoice_id: invoice.id,
          company_id: invoice.company_id,
          invoice_number: invoice.invoice_number,
          amount_due: invoice.amount_due,
        });
      }
    }
  } catch (error: unknown) {
    logger.error(`[Invoice Generation] Job failed: ${(error instanceof Error ? error.message : String(error))}`);
    throw error;
  }
}

export const config = {
  name: "invoice-generation",
  schedule: "0 4 1 * *", // 1st of every month at 4 AM
};
