import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { Tag } from "@medusajs/icons";

const EntitlementsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["entitlements"],
    queryFn: () =>
      client.get<{ entitlements: any[] }>(
        "/admin/custom/entitlements?limit=50",
      ),
  });
  const entitlements = data?.data?.entitlements ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Entitlements</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Access grants · Revocations · Grace periods
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Grant Manual
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load entitlements.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer ID</Table.HeaderCell>
              <Table.HeaderCell>Resource Type</Table.HeaderCell>
              <Table.HeaderCell>Source</Table.HeaderCell>
              <Table.HeaderCell>Valid Until</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {entitlements.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No entitlement records found.
                </Table.Cell>
              </Table.Row>
            ) : (
              entitlements.map((e: any) => (
                <Table.Row key={e.id}>
                  <Table.Cell className="font-mono text-sm">
                    {e.customer_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{e.resource_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>{e.source_module}</Table.Cell>
                  <Table.Cell>
                    {e.valid_until
                      ? new Date(e.valid_until).toLocaleDateString()
                      : "Perpetual"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        e.status === "active"
                          ? "green"
                          : e.status === "grace"
                            ? "orange"
                            : "grey"
                      }
                    >
                      {e.status}
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
export const config = defineRouteConfig({ label: "Entitlements", icon: Tag });
export default EntitlementsPage;
