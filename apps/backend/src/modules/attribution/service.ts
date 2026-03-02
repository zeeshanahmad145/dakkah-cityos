import { MedusaService } from "@medusajs/framework/utils";
import {
  AttributionTouch,
  AttributionCredit,
} from "./models/attribution-touch";

class AttributionModuleService extends MedusaService({
  AttributionTouch,
  AttributionCredit,
}) {
  /**
   * Record a marketing touchpoint for a customer.
   */
  async recordTouch(params: {
    customerId: string;
    sourceType: string;
    sourceId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipCountry?: string;
    deviceType?: string;
  }): Promise<any> {
    return this.createAttributionTouches({
      customer_id: params.customerId,
      source_type: params.sourceType,
      source_id: params.sourceId ?? null,
      utm_source: params.utmSource ?? null,
      utm_medium: params.utmMedium ?? null,
      utm_campaign: params.utmCampaign ?? null,
      ip_country: params.ipCountry ?? null,
      device_type: params.deviceType ?? null,
      touched_at: new Date(),
    } as any);
  }

  /**
   * Compute attribution credits for a converted order using last-touch model.
   * Returns array of credits to trigger payout from.
   */
  async computeCredits(params: {
    orderId: string;
    customerId: string;
    orderAmount: number;
    currencyCode?: string;
    windowDays?: number;
    creditModel?: "last_touch" | "first_touch" | "linear";
  }): Promise<any[]> {
    const {
      orderId,
      customerId,
      orderAmount,
      currencyCode = "SAR",
      windowDays = 30,
      creditModel = "last_touch",
    } = params;

    const windowStart = new Date(Date.now() - windowDays * 86400000);
    const touches = (await this.listAttributionTouches({
      customer_id: customerId,
      order_id: null,
    })) as any[];
    const recent = touches.filter(
      (t: any) =>
        new Date(t.touched_at) >= windowStart && t.source_type !== "organic",
    );

    if (recent.length === 0) return [];

    let credits: { touch: any; pct: number }[] = [];

    if (creditModel === "last_touch") {
      const last = recent.sort(
        (a: any, b: any) =>
          new Date(b.touched_at).getTime() - new Date(a.touched_at).getTime(),
      )[0];
      credits = [{ touch: last, pct: 100 }];
    } else if (creditModel === "first_touch") {
      const first = recent.sort(
        (a: any, b: any) =>
          new Date(a.touched_at).getTime() - new Date(b.touched_at).getTime(),
      )[0];
      credits = [{ touch: first, pct: 100 }];
    } else {
      // Linear: split evenly
      const pct = Math.floor(100 / recent.length);
      credits = recent.map((t) => ({ touch: t, pct }));
    }

    const created: any[] = [];
    for (const { touch, pct } of credits) {
      const amount = orderAmount * (pct / 100);
      const credit = await this.createAttributionCredits({
        order_id: orderId,
        touch_id: touch.id,
        credit_model: creditModel,
        credit_pct: pct,
        amount,
        currency_code: currencyCode,
        source_type: touch.source_type,
        source_id: touch.source_id,
        payout_triggered: false,
      } as any);
      // Mark touch as converted
      await this.updateAttributionTouches({
        id: touch.id,
        order_id: orderId,
        converted_at: new Date(),
      } as any);
      created.push(credit);
    }

    return created;
  }
}

export default AttributionModuleService;
