import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ChartBar } from "@medusajs/icons";

const AttributionPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attribution-credits"],
    queryFn: () =>
      client.get<{ attribution_credits: any[] }>(
        "/admin/custom/attribution?limit=50",
      ),
  });
  const credits = data?.data?.attribution_credits ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Attribution</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Multi-touch attribution · Campaign ROI · Affiliate LTV
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Export Report
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load attribution credits.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Source Type</Table.HeaderCell>
              <Table.HeaderCell>Source ID</Table.HeaderCell>
              <Table.HeaderCell>Model</Table.HeaderCell>
              <Table.HeaderCell>Credit %</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Payout</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {credits.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No attribution credits yet.
                </Table.Cell>
              </Table.Row>
            ) : (
              credits.map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell className="font-mono text-sm">
                    {c.order_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{c.source_type}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {c.source_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell>{c.credit_model}</Table.Cell>
                  <Table.Cell>{c.credit_pct}%</Table.Cell>
                  <Table.Cell className="font-mono">
                    {c.amount != null
                      ? `${c.currency_code} ${Number(c.amount).toFixed(2)}`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.payout_triggered ? "green" : "grey"}>
                      {c.payout_triggered ? "Triggered" : "Pending"}
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
  label: "Attribution",
  icon: ChartBar,
});
export default AttributionPage;
