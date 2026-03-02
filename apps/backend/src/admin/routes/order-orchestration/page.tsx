import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ArrowPathMini } from "@medusajs/icons";

const OrderOrchestrationPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-sla-timers"],
    queryFn: () =>
      client.get<{ sla_timers: any[] }>(
        "/admin/custom/order-orchestration/timers?limit=50",
      ),
  });
  const timers = data?.data?.sla_timers ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Order Orchestration</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            State machine · SLA timers · Transition log
          </Text>
        </div>
        <Button size="small" variant="secondary">
          View Transition Log
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load SLA timers.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Current State</Table.HeaderCell>
              <Table.HeaderCell>SLA Deadline</Table.HeaderCell>
              <Table.HeaderCell>Escalation</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {timers.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No active SLA timers.
                </Table.Cell>
              </Table.Row>
            ) : (
              timers.map((t: any) => (
                <Table.Row key={t.id}>
                  <Table.Cell className="font-mono text-sm">
                    {t.order_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{t.current_state}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {t.sla_deadline
                      ? new Date(t.sla_deadline).toLocaleString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        t.escalation_status === "none"
                          ? "green"
                          : t.escalation_status === "breached"
                            ? "red"
                            : "orange"
                      }
                    >
                      {t.escalation_status ?? "none"}
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
export const config = defineRouteConfig({
  label: "Order Orchestration",
  icon: ArrowPathMini,
});
export default OrderOrchestrationPage;
