import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { ClockSolid } from "@medusajs/icons";
import { useAuditLogs, AuditLog } from "../../hooks/use-audit.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatsGrid } from "../../components/charts/stats-grid.js";

const getActionBadgeColor = (action: string) => {
  if (action.startsWith("create") || action.startsWith("add")) return "green";
  if (action.startsWith("update") || action.startsWith("edit")) return "blue";
  if (action.startsWith("delete") || action.startsWith("remove")) return "red";
  if (action.startsWith("login") || action.startsWith("auth")) return "purple";
  return "grey";
};

const AuditPage = () => {
  const { data: auditData, isLoading } = useAuditLogs();
  const logs = auditData?.audit_logs || [];

  const today = new Date().toDateString();
  const todayEvents = logs.filter(
    (l) => new Date(l.created_at).toDateString() === today,
  ).length;
  const uniqueActors = new Set(logs.map((l) => l.actor_email)).size;

  const stats = [
    {
      label: "Total Events",
      value: logs.length,
      icon: <ClockSolid className="w-5 h-5" />,
    },
    { label: "Today's Events", value: todayEvents, color: "blue" as const },
    { label: "Unique Actors", value: uniqueActors, color: "green" as const },
    {
      label: "Resource Types",
      value: new Set(logs.map((l) => l.resource_type)).size,
      color: "purple" as const,
    },
  ];

  const columns = [
    {
      key: "created_at",
      header: "Timestamp",
      sortable: true,
      cell: (l: AuditLog) => (
        <Text className="text-sm">
          {new Date(l.created_at).toLocaleString()}
        </Text>
      ),
    },
    {
      key: "actor_email",
      header: "Actor",
      cell: (l: AuditLog) => (
        <Text className="font-medium">{l.actor_email || "System"}</Text>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (l: AuditLog) => (
        <Badge color={getActionBadgeColor(l.action)}>{l.action}</Badge>
      ),
    },
    {
      key: "resource_type",
      header: "Resource Type",
      cell: (l: AuditLog) => <Text>{l.resource_type}</Text>,
    },
    {
      key: "resource_id",
      header: "Resource ID",
      cell: (l: AuditLog) => (
        <Text className="text-ui-fg-muted text-sm font-mono">
          {l.resource_id || "-"}
        </Text>
      ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      cell: (l: AuditLog) => (
        <Text className="text-ui-fg-muted text-sm">{l.ip_address || "-"}</Text>
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Audit Logs</Heading>
            <Text className="text-ui-fg-muted">
              View platform activity and audit trail
            </Text>
          </div>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={logs}
          columns={columns}
          searchable
          searchPlaceholder="Search by actor, action, resource..."
          searchKeys={["actor_email", "action", "resource_type", "resource_id"]}
          loading={isLoading}
          emptyMessage="No audit logs found"
        />
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Audit Logs",
  icon: ClockSolid,
});
export default AuditPage;
