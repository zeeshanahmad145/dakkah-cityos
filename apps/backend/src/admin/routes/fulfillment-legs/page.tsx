import { Container, Heading, Table, Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { TruckFast } from "@medusajs/icons";

const LEG_STATUS_COLOR: Record<
  string,
  "grey" | "blue" | "orange" | "green" | "red"
> = {
  pending: "grey",
  dispatched: "blue",
  in_transit: "orange",
  delivered: "green",
  failed: "red",
  cancelled: "grey",
};

const FulfillmentLegsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["fulfillment-legs"],
    queryFn: () =>
      client.get<{ legs: any[] }>("/admin/custom/fulfillment-legs?limit=100"),
  });
  const legs = data?.data?.legs ?? [];

  // Group by order
  const byOrder = legs.reduce((acc: Record<string, any[]>, leg: any) => {
    if (!acc[leg.order_id]) acc[leg.order_id] = [];
    acc[leg.order_id].push(leg);
    return acc;
  }, {});

  return (
    <Container>
      <div className="mb-6">
        <Heading>Fulfillment Legs</Heading>
        <Text className="text-ui-fg-muted text-sm mt-1">
          Multi-vendor and multi-warehouse delivery segments — each order leg is
          a separate dispatch
        </Text>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(["pending", "in_transit", "delivered", "failed"] as const).map(
          (s) => (
            <div
              key={s}
              className="border border-ui-border-base rounded-xl p-4 bg-ui-bg-base text-center"
            >
              <div className="text-2xl font-bold text-ui-fg-base">
                {legs.filter((l: any) => l.status === s).length}
              </div>
              <Badge color={LEG_STATUS_COLOR[s]}>{s}</Badge>
            </div>
          ),
        )}
      </div>

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Leg #</Table.HeaderCell>
              <Table.HeaderCell>Provider</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Tracking</Table.HeaderCell>
              <Table.HeaderCell>Escrow Release</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {legs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No fulfillment legs found.
                </Table.Cell>
              </Table.Row>
            ) : (
              legs
                .sort((a: any, b: any) => a.leg_index - b.leg_index)
                .map((leg: any) => (
                  <Table.Row key={leg.id}>
                    <Table.Cell className="font-mono text-sm">
                      {leg.order_id?.slice(0, 12)}…
                    </Table.Cell>
                    <Table.Cell className="text-center font-semibold">
                      {leg.leg_index + 1}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="grey">{leg.provider}</Badge>
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {leg.fulfillment_type}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={LEG_STATUS_COLOR[leg.status] ?? "grey"}>
                        {leg.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-sm text-ui-fg-muted">
                      {leg.tracking_number ? (
                        <a
                          href={leg.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {leg.tracking_number}
                        </a>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-ui-fg-muted">
                      {leg.releases_escrow_percent ?? 0}%
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
  label: "Fulfillment Legs",
  icon: TruckFast,
});
export default FulfillmentLegsPage;
