import { Container, Heading, Table, Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { Clock } from "@medusajs/icons";

const MeteringPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["metering-events"],
    queryFn: () =>
      client.get<{ events: any[] }>("/admin/custom/metering?limit=100"),
  });
  const events = data?.data?.events ?? [];

  const { data: summaryData } = useQuery({
    queryKey: ["metering-summary"],
    queryFn: () =>
      client.get<{ summary: any[] }>("/admin/custom/metering/summary"),
  });
  const summary = summaryData?.data?.summary ?? [];

  return (
    <Container>
      <div className="mb-6">
        <Heading>Metering & Usage Billing</Heading>
        <Text className="text-ui-fg-muted text-sm mt-1">
          Usage events for API calls, storage, bandwidth, AI tokens, and
          per-transaction metered services
        </Text>
      </div>

      {/* Summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summary.map((s: any) => (
            <div
              key={s.meter_type}
              className="border border-ui-border-base rounded-xl p-4 bg-ui-bg-base"
            >
              <Text className="text-xs text-ui-fg-muted mb-1">
                {s.meter_type}
              </Text>
              <div className="text-xl font-bold text-ui-fg-base">
                {s.total_units?.toLocaleString()}
              </div>
              <Text className="text-xs text-ui-fg-subtle">
                {s.unique_accounts} accounts · SAR{" "}
                {s.total_billed?.toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
      )}

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Account</Table.HeaderCell>
              <Table.HeaderCell>Meter Type</Table.HeaderCell>
              <Table.HeaderCell>Units</Table.HeaderCell>
              <Table.HeaderCell>Period</Table.HeaderCell>
              <Table.HeaderCell>Billed</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No metering events in current period.
                </Table.Cell>
              </Table.Row>
            ) : (
              events.map((e: any) => (
                <Table.Row key={e.id}>
                  <Table.Cell className="font-mono text-sm">
                    {e.account_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{e.meter_type}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-semibold">
                    {e.units?.toLocaleString()}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-ui-fg-muted">
                    {e.period_start
                      ? new Date(e.period_start).toLocaleDateString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className="font-semibold text-green-600">
                    SAR {(e.billed_amount ?? 0).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={e.billed ? "green" : "orange"}>
                      {e.billed ? "billed" : "pending"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};
export const config = defineRouteConfig({ label: "Metering", icon: Clock });
export default MeteringPage;
