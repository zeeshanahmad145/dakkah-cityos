import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CogSixTooth } from "@medusajs/icons";

const TaxConfigPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tax-config"],
    queryFn: () =>
      client.get<{ tax_configs: any[] }>("/admin/custom/tax-config?limit=50"),
  });

  const configs = data?.data?.tax_configs ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Tax Configuration</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Custom tax rules per region, category, and node
          </Text>
        </div>
        <Button size="small" variant="secondary">
          + New Rule
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load tax configurations.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Region / Node</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell>Rate</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {configs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No custom tax rules. Rates are managed via Medusa Regions by
                  default.
                </Table.Cell>
              </Table.Row>
            ) : (
              configs.map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell>{c.name ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {c.region_id ?? c.node_id ?? "Global"}
                  </Table.Cell>
                  <Table.Cell>{c.product_category ?? "All"}</Table.Cell>
                  <Table.Cell className="font-mono">
                    {c.tax_rate != null ? `${c.tax_rate}%` : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{c.tax_type ?? "vat"}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.is_active ? "green" : "grey"}>
                      {c.is_active ? "Active" : "Inactive"}
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
  label: "Tax Config",
  icon: CogSixTooth,
});

export default TaxConfigPage;
