import { MedusaService } from "@medusajs/framework/utils";
import AnalyticsEvent from "./models/analytics-event";
import Report from "./models/report";
import Dashboard from "./models/dashboard";

type AnalyticsEventRecord = {
  id: string;
  tenant_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  customer_id: string | null;
  session_id: string | null;
  properties: Record<string, unknown> | null;
  revenue: number | string | null;
  currency: string | null;
  created_at?: Date | string;
};

type ReportRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  report_type: string;
  date_range_type: string;
  filters: Record<string, unknown> | null;
  schedule: string | null;
  last_generated: Date | null;
  is_public: boolean;
  metadata: Record<string, unknown> | null;
};

type DashboardRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  widgets: unknown | null;
  layout: Record<string, unknown> | null;
  is_default: boolean;
  role_access: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

interface AnalyticsServiceBase {
  listAnalyticsEvents(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<AnalyticsEventRecord[]>;
  retrieveReport(id: string): Promise<ReportRecord>;
  listDashboards(filters?: Record<string, unknown>): Promise<DashboardRecord[]>;
  createAnalyticsEvents(
    data: Record<string, unknown>,
  ): Promise<AnalyticsEventRecord>;
  updateReports(data: Record<string, unknown>): Promise<ReportRecord>;
}

const Base = MedusaService({ AnalyticsEvent, Report, Dashboard });

class AnalyticsModuleService extends Base implements AnalyticsServiceBase {
  async trackEvent(data: {
    tenant_id: string;
    event_type: string;
    entity_type?: string;
    entity_id?: string;
    customer_id?: string;
    session_id?: string;
    properties?: Record<string, unknown>;
    revenue?: number;
    currency?: string;
  }): Promise<AnalyticsEventRecord> {
    return this.createAnalyticsEvents({
      tenant_id: data.tenant_id,
      event_type: data.event_type,
      entity_type: data.entity_type ?? null,
      entity_id: data.entity_id ?? null,
      customer_id: data.customer_id ?? null,
      session_id: data.session_id ?? null,
      properties: data.properties ?? null,
      revenue: data.revenue ?? null,
      currency: data.currency ?? null,
    } as any);
  }

  async getEventCounts(
    tenantId: string,
    eventType: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{
    event_type: string;
    count: number;
    date_range: { start: Date; end: Date };
  }> {
    const events = await this.listAnalyticsEvents({
      tenant_id: tenantId,
      event_type: eventType,
    }) as any;
    const filtered = events.filter((e) => {
      const createdAt = new Date(e.created_at);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
    return {
      event_type: eventType,
      count: filtered.length,
      date_range: dateRange,
    };
  }

  async getSalesMetrics(
    tenantId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
    dateRange: { start: Date; end: Date };
  }> {
    const events = await this.listAnalyticsEvents({
      tenant_id: tenantId,
      event_type: "purchase",
    }) as any;
    const filtered = events.filter((e) => {
      const createdAt = new Date(e.created_at);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
    const revenue = filtered.reduce(
      (sum, e) => sum + (Number(e.revenue) || 0),
      0,
    );
    const orderCount = filtered.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    return { revenue, orderCount, avgOrderValue, dateRange };
  }

  async getTopProducts(
    tenantId: string,
    limit: number = 10,
    dateRange: { start: Date; end: Date },
  ): Promise<Array<{ product_id: string; count: number; revenue: number }>> {
    const events = await this.listAnalyticsEvents({
      tenant_id: tenantId,
      event_type: "purchase",
    }) as any;
    const filtered = events.filter((e) => {
      const createdAt = new Date(e.created_at);
      return (
        createdAt >= dateRange.start &&
        createdAt <= dateRange.end &&
        e.entity_type === "product"
      );
    });
    const productCounts: Record<string, { count: number; revenue: number }> =
      {};
    for (const event of filtered) {
      if (event.entity_id) {
        productCounts[event.entity_id] ??= { count: 0, revenue: 0 };
        productCounts[event.entity_id].count++;
        productCounts[event.entity_id].revenue += Number(event.revenue) || 0;
      }
    }
    return Object.entries(productCounts)
      .map(([product_id, data]) => ({ product_id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async trackPageView(data: {
    sessionId: string;
    pageUrl: string;
    referrer?: string;
    deviceType?: string;
    tenantId: string;
  }): Promise<AnalyticsEventRecord> {
    if (!data.sessionId || !data.pageUrl || !data.tenantId) {
      throw new Error("Session ID, page URL, and tenant ID are required");
    }
    return this.createAnalyticsEvents({
      tenant_id: data.tenantId,
      event_type: "page_view",
      session_id: data.sessionId,
      properties: {
        page_url: data.pageUrl,
        referrer: data.referrer ?? null,
        device_type: data.deviceType ?? "unknown",
      },
    });
  }

  async getConversionFunnel(
    tenantId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{
    steps: Array<{ step: string; count: number; conversionRate: number }>;
    overallConversion: number;
  }> {
    const funnelSteps = [
      "page_view",
      "product_view",
      "add_to_cart",
      "checkout_started",
      "purchase",
    ];
    const steps: Array<{
      step: string;
      count: number;
      conversionRate: number;
    }> = [];

    let firstStepCount = 0;
    for (let i = 0; i < funnelSteps.length; i++) {
      const result = await this.getEventCounts(
        tenantId,
        funnelSteps[i],
        dateRange,
      );
      const count = result.count;
      if (i === 0) firstStepCount = count;
      const conversionRate =
        i === 0
          ? 100
          : steps[i - 1].count > 0
            ? Math.round((count / steps[i - 1].count) * 10000) / 100
            : 0;
      steps.push({ step: funnelSteps[i], count, conversionRate });
    }

    const lastStep = steps[steps.length - 1];
    const overallConversion =
      firstStepCount > 0
        ? Math.round((lastStep.count / firstStepCount) * 10000) / 100
        : 0;

    return { steps, overallConversion };
  }

  async generateDashboardMetrics(tenantId: string): Promise<{
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    pageViews: number;
    uniqueSessions: number;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateRange = { start: thirtyDaysAgo, end: now };

    const salesMetrics = await this.getSalesMetrics(tenantId, dateRange);
    const pageViewResult = await this.getEventCounts(
      tenantId,
      "page_view",
      dateRange,
    );

    const events = await this.listAnalyticsEvents({
      tenant_id: tenantId,
      event_type: "page_view",
    }) as any;
    const filteredEvents = events.filter((e) => {
      const createdAt = new Date(e.created_at);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
    const uniqueSessions = new Set(
      filteredEvents
        .map((e) => e.session_id)
        .filter((s): s is string => s !== null),
    ).size;

    const conversionRate =
      pageViewResult.count > 0
        ? Math.round((salesMetrics.orderCount / pageViewResult.count) * 10000) /
          100
        : 0;

    return {
      revenue: salesMetrics.revenue,
      orderCount: salesMetrics.orderCount,
      averageOrderValue: salesMetrics.avgOrderValue,
      conversionRate,
      pageViews: pageViewResult.count,
      uniqueSessions,
    };
  }

  async generateReport(reportId: string): Promise<ReportRecord> {
    await this.updateReports({ id: reportId, last_generated: new Date() } as any);
    return this.retrieveReport(reportId);
  }

  async getDashboard(
    tenantId: string,
    dashboardSlug: string,
  ): Promise<DashboardRecord> {
    const list = await this.listDashboards({
      tenant_id: tenantId,
      slug: dashboardSlug,
    }) as any;
    if (list.length === 0) {
      throw new Error(`Dashboard "${dashboardSlug}" not found`);
    }
    return list[0];
  }
}

export default AnalyticsModuleService;
