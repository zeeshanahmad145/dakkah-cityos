import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ReceiptPercent } from "@medusajs/icons";

const TaxArtifactPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tax-invoices"],
    queryFn: () =>
      client.get<{ tax_invoices: any[] }>(
        "/admin/custom/tax-artifact?limit=50",
      ),
  });
  const invoices = data?.data?.tax_invoices ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Tax Artifacts</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            VAT invoices · Credit notes · ERPNext posting status
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Post Unposted to ERP
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load tax invoices.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Invoice #</Table.HeaderCell>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Buyer VAT</Table.HeaderCell>
              <Table.HeaderCell>Excl. Tax</Table.HeaderCell>
              <Table.HeaderCell>Tax</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Table.HeaderCell>ERP Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invoices.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No tax invoices yet.
                </Table.Cell>
              </Table.Row>
            ) : (
              invoices.map((inv: any) => (
                <Table.Row key={inv.id}>
                  <Table.Cell className="font-mono text-sm">
                    {inv.invoice_number}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {inv.order_id}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {inv.buyer_vat_number ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {Number(inv.total_excl_tax).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {Number(inv.total_tax).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell className="font-mono font-semibold">
                    {inv.currency_code} {Number(inv.total_incl_tax).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={inv.erp_posted_at ? "green" : "orange"}>
                      {inv.erp_posted_at ? "Posted" : "Pending"}
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
  label: "Tax Artifacts",
  icon: ReceiptPercent,
});
export default TaxArtifactPage;
