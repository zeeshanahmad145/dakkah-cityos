import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { DocumentText } from "@medusajs/icons";

const ReconciliationPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reconciliation-batches"],
    queryFn: () =>
      client.get<{ batches: any[] }>("/admin/custom/reconciliation?limit=50"),
  });
  const batches = data?.data?.batches ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Payment Reconciliation</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Provider payout batches · Settlement matching · Mismatch detection
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Run Sweep
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load reconciliation batches.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Batch Ref</Table.HeaderCell>
              <Table.HeaderCell>Provider</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Mismatch</Table.HeaderCell>
              <Table.HeaderCell>Auto Hold</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {batches.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No batches found.
                </Table.Cell>
              </Table.Row>
            ) : (
              batches.map((b: any) => (
                <Table.Row key={b.id}>
                  <Table.Cell className="font-mono text-sm">
                    {b.batch_reference}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{b.provider}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {b.currency_code} {Number(b.batch_amount).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>
                    {b.batch_date
                      ? new Date(b.batch_date).toLocaleDateString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        b.status === "matched"
                          ? "green"
                          : b.status === "mismatched"
                            ? "red"
                            : "orange"
                      }
                    >
                      {b.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {b.mismatch_amount !== 0
                      ? Number(b.mismatch_amount).toFixed(2)
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={b.auto_held ? "red" : "grey"}>
                      {b.auto_held ? "Held" : "Normal"}
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
  label: "Reconciliation",
  icon: DocumentText,
});
export default ReconciliationPage;
