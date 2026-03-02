import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { Minus } from "@medusajs/icons";

const RmaPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rma-requests"],
    queryFn: () =>
      client.get<{ return_requests: any[] }>("/admin/custom/rma?limit=50"),
  });
  const requests = data?.data?.return_requests ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Returns &amp; RMA</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Return requests · Inspections · Exchanges · Restocking fees
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Export
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load return requests.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Reason</Table.HeaderCell>
              <Table.HeaderCell>Vendor Resp.</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Refund</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No return requests found.
                </Table.Cell>
              </Table.Row>
            ) : (
              requests.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell className="font-mono text-sm">
                    {r.order_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{r.return_type ?? "return"}</Badge>
                  </Table.Cell>
                  <Table.Cell>{r.reason ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge color={r.vendor_responsibility ? "red" : "grey"}>
                      {r.vendor_responsibility ? "Vendor" : "Customer"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        r.status === "approved"
                          ? "green"
                          : r.status === "rejected"
                            ? "red"
                            : "orange"
                      }
                    >
                      {r.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {r.refund_amount != null
                      ? `SAR ${Number(r.refund_amount).toFixed(2)}`
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
  label: "Returns & RMA",
  icon: Minus,
});
export default RmaPage;
