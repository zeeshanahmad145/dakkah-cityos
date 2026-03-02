import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { Adjustments } from "@medusajs/icons";

const PricingResolverPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pricing-decisions"],
    queryFn: () =>
      client.get<{ pricing_decisions: any[] }>(
        "/admin/custom/pricing-resolver?limit=50",
      ),
  });
  const decisions = data?.data?.pricing_decisions ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Pricing Decisions</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Precedence audit trail · B2B / subscription / volume / node / promo
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Export Audit Log
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load pricing decisions.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Product ID</Table.HeaderCell>
              <Table.HeaderCell>Qty</Table.HeaderCell>
              <Table.HeaderCell>Base Price</Table.HeaderCell>
              <Table.HeaderCell>Final Price</Table.HeaderCell>
              <Table.HeaderCell>Winning Rule</Table.HeaderCell>
              <Table.HeaderCell>Computed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {decisions.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No pricing decisions logged yet.
                </Table.Cell>
              </Table.Row>
            ) : (
              decisions.map((d: any) => (
                <Table.Row key={d.id}>
                  <Table.Cell className="font-mono text-sm">
                    {d.order_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {d.product_id}
                  </Table.Cell>
                  <Table.Cell>{d.quantity}</Table.Cell>
                  <Table.Cell className="font-mono">
                    {d.currency_code} {Number(d.base_price).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="font-mono font-semibold">
                    {Number(d.final_price).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        d.winning_rule_type === "base_price" ? "grey" : "blue"
                      }
                    >
                      {d.winning_rule_type ?? "base_price"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {d.computed_at
                      ? new Date(d.computed_at).toLocaleString()
                      : "—"}
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
  label: "Pricing Decisions",
  icon: Adjustments,
});
export default PricingResolverPage;
