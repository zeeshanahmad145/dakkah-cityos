import { MedusaService } from "@medusajs/framework/utils";
import { UsageEvent, MeteringPeriod } from "./models/metering-models";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:metering");

class MeteringModuleService extends MedusaService({
  UsageEvent,
  MeteringPeriod,
}) {
  /**
   * Record a usage event for a customer.
   */
  async recordUsage(params: {
    customerId: string;
    resourceType: string;
    resourceId: string;
    units: number;
    unitLabel?: string;
    unitPrice: number;
    currencyCode?: string;
    tenantId?: string;
    vendorId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const totalAmount = params.units * params.unitPrice;
    const event = await this.createUsageEvents({
      customer_id: params.customerId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      units: params.units,
      unit_label: params.unitLabel ?? "unit",
      unit_price: params.unitPrice,
      total_amount: totalAmount,
      currency_code: params.currencyCode ?? "SAR",
      tenant_id: params.tenantId ?? null,
      vendor_id: params.vendorId ?? null,
      metadata: params.metadata ?? null,
      billed: false,
    } as any);

    return event;
  }

  /**
   * Get all unbilled usage events grouped by customer + resource_type.
   * Called by the billing-cycle job.
   */
  async getUnbilledSummary(): Promise<
    Array<{
      customer_id: string;
      resource_type: string;
      total_units: number;
      total_amount: number;
      currency_code: string;
      event_ids: string[];
    }>
  > {
    const events = (await this.listUsageEvents({ billed: false })) as any[];

    const grouped = new Map<
      string,
      {
        total_units: number;
        total_amount: number;
        currency_code: string;
        event_ids: string[];
      }
    >();
    for (const e of events) {
      const key = `${e.customer_id}::${e.resource_type}::${e.currency_code}`;
      const existing = grouped.get(key) ?? {
        total_units: 0,
        total_amount: 0,
        currency_code: e.currency_code,
        event_ids: [],
      };
      existing.total_units += e.units;
      existing.total_amount += e.total_amount;
      existing.event_ids.push(e.id);
      grouped.set(key, existing);
    }

    return [...grouped.entries()].map(([key, data]) => {
      const [customer_id, resource_type] = key.split("::");
      return { customer_id, resource_type, ...data };
    });
  }

  /**
   * Mark a set of usage events as billed and link them to a metering period.
   */
  async markBilled(eventIds: string[], periodId: string): Promise<void> {
    for (const id of eventIds) {
      await this.updateUsageEvents({
        id,
        billed: true,
        billing_period_id: periodId,
      } as any);
    }
  }

  /**
   * Create a metering period record for a billing window.
   */
  async createPeriod(params: {
    customerId: string;
    resourceType: string;
    periodStart: Date;
    periodEnd: Date;
    totalUnits: number;
    totalAmount: number;
    currencyCode?: string;
    tenantId?: string;
  }): Promise<any> {
    return this.createMeteringPeriods({
      customer_id: params.customerId,
      resource_type: params.resourceType,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      total_units: params.totalUnits,
      total_amount: params.totalAmount,
      currency_code: params.currencyCode ?? "SAR",
      status: "closed",
      tenant_id: params.tenantId ?? null,
    } as any);
  }
}

export default MeteringModuleService;
