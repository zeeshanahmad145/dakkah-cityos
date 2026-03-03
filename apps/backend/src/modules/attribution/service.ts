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

  /**
   * Compute multi-touch attribution with configurable attribution model.
   * Models:
   *   "linear"     — equal weight to all touches
   *   "time_decay" — exponential decay, recent touches weighted more heavily
   *   "first_last" — 40% first touch, 40% last touch, 20% split across middle
   */
  async computeMultiTouch(params: {
    orderId: string;
    customerId: string;
    orderAmount: number;
    currencyCode?: string;
    windowDays?: number;
    model: "linear" | "time_decay" | "first_last";
  }): Promise<any[]> {
    const {
      orderId,
      customerId,
      orderAmount,
      currencyCode = "SAR",
      windowDays = 30,
      model,
    } = params;
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const touches = (await this.listAttributionTouches({
      customer_id: customerId,
      order_id: null,
    })) as any[];
    const recent = touches
      .filter(
        (t: any) =>
          new Date(t.touched_at) >= windowStart && t.source_type !== "organic",
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.touched_at).getTime() - new Date(b.touched_at).getTime(),
      );

    if (recent.length === 0) return [];

    let weights: number[] = [];

    if (model === "linear") {
      weights = recent.map(() => 1 / recent.length);
    } else if (model === "time_decay") {
      // Half-life = 7 days: weight = 2^(-days_ago / 7)
      const now = Date.now();
      const rawWeights = recent.map((t: any) => {
        const daysAgo = (now - new Date(t.touched_at).getTime()) / 86400000;
        return Math.pow(2, -daysAgo / 7);
      });
      const total = rawWeights.reduce((s, w) => s + w, 0);
      weights = rawWeights.map((w) => w / total);
    } else if (model === "first_last") {
      if (recent.length === 1) {
        weights = [1];
      } else if (recent.length === 2) {
        weights = [0.5, 0.5];
      } else {
        const middleWeight = 0.2 / (recent.length - 2);
        weights = recent.map((_, i) =>
          i === 0 ? 0.4 : i === recent.length - 1 ? 0.4 : middleWeight,
        );
      }
    }

    const created: any[] = [];
    for (let i = 0; i < recent.length; i++) {
      const touch = recent[i];
      const pct = Math.round(weights[i] * 100 * 100) / 100; // 2 decimal places
      const amount = orderAmount * weights[i];

      const credit = await this.createAttributionCredits({
        order_id: orderId,
        touch_id: touch.id,
        credit_model: model,
        credit_pct: pct,
        amount,
        currency_code: currencyCode,
        source_type: touch.source_type,
        source_id: touch.source_id,
        payout_triggered: false,
      } as any);
      await this.updateAttributionTouches({
        id: touch.id,
        order_id: orderId,
        converted_at: new Date(),
      } as any);
      created.push(credit);
    }

    return created;
  }

  /**
   * Compute cross-channel ROI summary for a time window.
   * Returns revenue attributed per source_type and utm_campaign.
   */
  async getCrossChannelROI(windowDays = 30): Promise<
    Array<{
      source_type: string;
      campaign: string | null;
      total_attributed: number;
      credit_count: number;
    }>
  > {
    const credits = (await this.listAttributionCredits({})) as any[];
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const recent = credits.filter(
      (c: any) => new Date(c.created_at) >= windowStart,
    );
    const grouped = new Map<string, { total: number; count: number }>();

    for (const c of recent) {
      const key = `${c.source_type}::${c.source_id ?? ""}`;
      const existing = grouped.get(key) ?? { total: 0, count: 0 };
      existing.total += c.amount ?? 0;
      existing.count++;
      grouped.set(key, existing);
    }

    return [...grouped.entries()]
      .map(([key, val]) => {
        const [source_type, campaign] = key.split("::");
        return {
          source_type,
          campaign: campaign || null,
          total_attributed: val.total,
          credit_count: val.count,
        };
      })
      .sort((a, b) => b.total_attributed - a.total_attributed);
  }
}

export default AttributionModuleService;
