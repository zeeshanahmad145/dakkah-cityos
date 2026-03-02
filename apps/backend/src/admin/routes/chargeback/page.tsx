import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CreditCard } from "@medusajs/icons";

const ChargebackPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["chargebacks"],
    queryFn: () =>
      client.get<{ chargebacks: any[] }>("/admin/custom/chargeback?limit=50"),
  });
  const items = data?.data?.chargebacks ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Chargebacks</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Provider-level payment disputes · Evidence · Negative balances
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Export
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load chargebacks.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Provider Ref</Table.HeaderCell>
              <Table.HeaderCell>Reason</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Due By</Table.HeaderCell>
              <Table.HeaderCell>Settlement</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No chargebacks. All clear.
                </Table.Cell>
              </Table.Row>
            ) : (
              items.map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell className="font-mono text-sm">
                    {c.order_id}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {c.provider_reference_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="orange">{c.reason_code}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {c.currency_code} {Number(c.amount).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        c.status === "won"
                          ? "green"
                          : c.status === "lost"
                            ? "red"
                            : "orange"
                      }
                    >
                      {c.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {c.due_by ? new Date(c.due_by).toLocaleDateString() : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.settlement_frozen ? "red" : "green"}>
                      {c.settlement_frozen ? "Frozen" : "Normal"}
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
  label: "Chargebacks",
  icon: CreditCard,
});
export default ChargebackPage;
