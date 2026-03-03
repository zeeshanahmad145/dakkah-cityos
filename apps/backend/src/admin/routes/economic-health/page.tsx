import { Container, Heading, Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ChartBar } from "@medusajs/icons";

type MetricStatus =
  | "healthy"
  | "elevated"
  | "critical"
  | "backlogged"
  | "undercapitalized"
  | "overextended";
const STATUS_COLOR: Record<string, "green" | "orange" | "red"> = {
  healthy: "green",
  elevated: "orange",
  critical: "red",
  backlogged: "orange",
  undercapitalized: "red",
  overextended: "red",
};

const MetricCard = ({
  title,
  subtitle,
  status,
  value,
  detail,
}: {
  title: string;
  subtitle: string;
  status: MetricStatus;
  value: string;
  detail?: string;
}) => (
  <div className="border border-ui-border-base rounded-xl p-5 bg-ui-bg-base">
    <div className="flex items-center justify-between mb-3">
      <Text className="font-semibold text-ui-fg-base">{title}</Text>
      <Badge color={STATUS_COLOR[status] ?? "grey"}>{status}</Badge>
    </div>
    <div className="text-2xl font-bold text-ui-fg-base mb-1">{value}</div>
    <Text className="text-xs text-ui-fg-muted">{subtitle}</Text>
    {detail && <Text className="text-xs text-ui-fg-subtle mt-1">{detail}</Text>}
  </div>
);

const EconomicHealthPage = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["economic-health"],
    queryFn: () => client.get<any>("/admin/economic-health"),
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
  });
  const g = data?.data;

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Economic Health</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Real-time financial observability — liquidity, refund risk,
            settlement SLA, subscription liability
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt && (
            <Text className="text-xs text-ui-fg-subtle">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </Text>
          )}
          <button
            onClick={() => refetch()}
            className="text-xs px-3 py-1.5 border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="border border-ui-border-base rounded-xl p-5 bg-ui-bg-subtle animate-pulse h-32"
            />
          ))}
        </div>
      )}

      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load economic health metrics.
        </Text>
      )}

      {!isLoading && !isError && g && (
        <>
          {/* Overall status banner */}
          {["refund_risk_index", "settlement_backlog", "chargeback_rate"].some(
            (k) => g[k]?.status === "critical",
          ) && (
            <div className="mb-6 border border-red-200 bg-red-50 rounded-xl p-4 flex items-center gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <Text className="text-red-700 font-medium">
                Critical metric(s) detected. Review highlighted cards
                immediately.
              </Text>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricCard
              title="Liquidity Exposure"
              subtitle="Total value locked in escrow"
              status="healthy"
              value={`SAR ${(g.liquidity_exposure?.total_escrow_locked ?? 0).toLocaleString()}`}
            />
            <MetricCard
              title="Refund Risk Index"
              subtitle="Open refunds / GMV (last 30d)"
              status={g.refund_risk_index?.status}
              value={`${g.refund_risk_index?.risk_pct ?? 0}%`}
              detail={`SAR ${(g.refund_risk_index?.open_refunds ?? 0).toLocaleString()} refunds · GMV SAR ${(g.refund_risk_index?.gmv_30d ?? 0).toLocaleString()}`}
            />
            <MetricCard
              title="Settlement Backlog"
              subtitle="Payouts older than 48h SLA"
              status={g.settlement_backlog?.status}
              value={`${g.settlement_backlog?.pending_count ?? 0} pending`}
              detail={`SAR ${(g.settlement_backlog?.pending_value ?? 0).toLocaleString()} · Oldest: ${g.settlement_backlog?.oldest_pending_hours ?? 0}h`}
            />
            <MetricCard
              title="Subscription Liability"
              subtitle="Monthly recurring commitments"
              status={g.subscription_liability?.status}
              value={`${(g.subscription_liability?.active_subscriptions ?? 0).toLocaleString()} active`}
              detail={`MRV: SAR ${(g.subscription_liability?.monthly_recurrence_value ?? 0).toLocaleString()}`}
            />
            <MetricCard
              title="Vendor Payout Exposure"
              subtitle="Outstanding vendor payouts vs reserve"
              status={g.vendor_payout_exposure?.status}
              value={`SAR ${(g.vendor_payout_exposure?.total_outstanding ?? 0).toLocaleString()}`}
              detail={`Reserve ratio: ${g.vendor_payout_exposure?.reserve_ratio_pct ?? 100}%`}
            />
            <MetricCard
              title="Credit Outstanding"
              subtitle="B2B credit utilization"
              status={g.credit_outstanding_risk?.status}
              value={`${g.credit_outstanding_risk?.utilization_pct ?? 0}%`}
              detail={`SAR ${(g.credit_outstanding_risk?.utilized ?? 0).toLocaleString()} of ${(g.credit_outstanding_risk?.total_credit_extended ?? 0).toLocaleString()}`}
            />
            <MetricCard
              title="Chargeback Rate"
              subtitle="Last 30 days (Visa threshold: 1%)"
              status={g.chargeback_rate?.status}
              value={`${g.chargeback_rate?.rate_pct ?? 0}%`}
              detail={`${g.chargeback_rate?.chargebacks_30d ?? 0} chargebacks of ${g.chargeback_rate?.orders_30d ?? 0} orders`}
            />
          </div>
        </>
      )}
    </Container>
  );
};
export const config = defineRouteConfig({
  label: "Economic Health",
  icon: ChartBar,
});
export default EconomicHealthPage;
