import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";

const PrintOnDemandPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["print-on-demand"],
    queryFn: () =>
      client.get<{ print_on_demand: any[] }>(
        "/admin/custom/print-on-demand?limit=50",
      ),
  });

  const items = data?.data?.print_on_demand ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading>Print on Demand</Heading>
        <Button size="small" variant="secondary">
          + New Template
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load print-on-demand products.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Template Name</Table.HeaderCell>
              <Table.HeaderCell>Product ID</Table.HeaderCell>
              <Table.HeaderCell>Provider</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Base Cost</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No print-on-demand templates found.
                </Table.Cell>
              </Table.Row>
            ) : (
              items.map((item: any) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{item.template_name ?? "—"}</Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {item.product_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell>{item.provider ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge color={item.status === "active" ? "green" : "grey"}>
                      {item.status ?? "draft"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {item.base_cost != null
                      ? `$${Number(item.base_cost).toFixed(2)}`
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

export const config = defineRouteConfig({ label: "Print on Demand" });

export default PrintOnDemandPage;
