import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { TAX_ARTIFACT_MODULE } from "../modules/tax-artifact";
import type TaxArtifactModuleService from "../modules/tax-artifact/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:tax-invoice-generate");

export default async function taxInvoiceGenerate({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  total?: number;
  tax_total?: number;
  subtotal?: number;
  currency_code?: string;
  items?: any[];
  billing_address?: any;
  customer?: any;
  company_id?: string;
}>) {
  const taxService: TaxArtifactModuleService =
    container.resolve(TAX_ARTIFACT_MODULE);
  const d = event.data;

  try {
    // Optionally resolve B2B company for VAT number
    let company: any = undefined;
    if (d.company_id) {
      const companyService = container.resolve("company") as any;
      company = await companyService
        .retrieveCompany?.(d.company_id)
        .catch(() => null);
    }

    await taxService.generateInvoice({
      id: d.id,
      total: d.total ?? 0,
      tax_total: d.tax_total ?? 0,
      subtotal: d.subtotal ?? (d.total ?? 0) - (d.tax_total ?? 0),
      currency_code: d.currency_code ?? "SAR",
      items: d.items ?? [],
      billing_address: d.billing_address,
      customer: d.customer,
      company: company
        ? { vat_number: company.vat_number, name: company.name }
        : undefined,
    });

    logger.info(`Tax invoice generated for order ${d.id}`);
  } catch (err) {
    logger.error(
      `Tax invoice generation error for order ${d.id}: ${String(err)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["order.completed"],
};
