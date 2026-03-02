import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CurrencyDollar } from "@medusajs/icons";

const SettlementPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["settlement-ledgers"],
    queryFn: () =>
      client.get<{ settlement_ledgers: any[] }>(
        "/admin/custom/settlement?limit=50",
      ),
  });
  const ledgers = data?.data?.settlement_ledgers ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Settlement Ledger</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Multi-party settlement · Reversals · ERP postings
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Post to ERP
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load settlement ledgers.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Gross</Table.HeaderCell>
              <Table.HeaderCell>Platform Fee</Table.HeaderCell>
              <Table.HeaderCell>Vendor Net</Table.HeaderCell>
              <Table.HeaderCell>Tax</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>ERP Posted</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {ledgers.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No settlement ledgers found.
                </Table.Cell>
              </Table.Row>
            ) : (
              ledgers.map((l: any) => (
                <Table.Row key={l.id}>
                  <Table.Cell className="font-mono text-sm">
                    {l.order_id}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {l.gross_amount != null
                      ? `${l.currency_code} ${Number(l.gross_amount).toFixed(2)}`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {l.platform_fee != null
                      ? Number(l.platform_fee).toFixed(2)
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {l.vendor_net != null
                      ? Number(l.vendor_net).toFixed(2)
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {l.tax_collected != null
                      ? Number(l.tax_collected).toFixed(2)
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        l.status === "settled"
                          ? "green"
                          : l.status === "frozen"
                            ? "orange"
                            : l.status === "reversed"
                              ? "red"
                              : "grey"
                      }
                    >
                      {l.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={l.erp_posted_at ? "green" : "grey"}>
                      {l.erp_posted_at ? "Posted" : "Pending"}
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
  label: "Settlement",
  icon: CurrencyDollar,
});
export default SettlementPage;
