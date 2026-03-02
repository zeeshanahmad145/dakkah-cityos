import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { MagnifyingGlass } from "@medusajs/icons";

const SearchPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["search-indexes"],
    queryFn: () =>
      client.get<{ configs: any[] }>("/admin/custom/search/indexes?limit=50"),
  });
  const configs = data?.data?.configs ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Search Indexes</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Meilisearch · Node-aware · Tenant-aware · Exclusion rules
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Trigger Full Reindex
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load search index configs.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Index Name</Table.HeaderCell>
              <Table.HeaderCell>Provider</Table.HeaderCell>
              <Table.HeaderCell>Tenant</Table.HeaderCell>
              <Table.HeaderCell>Node</Table.HeaderCell>
              <Table.HeaderCell>Facets</Table.HeaderCell>
              <Table.HeaderCell>Last Synced</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {configs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No search indexes configured.
                </Table.Cell>
              </Table.Row>
            ) : (
              configs.map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell className="font-mono text-sm">
                    {c.index_name}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{c.provider}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {c.tenant_id ?? "global"}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {c.node_id ?? "all"}
                  </Table.Cell>
                  <Table.Cell>
                    {Array.isArray(c.facet_fields)
                      ? c.facet_fields.join(", ")
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {c.last_synced_at
                      ? new Date(c.last_synced_at).toLocaleString()
                      : "Never"}
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
  label: "Search Indexes",
  icon: MagnifyingGlass,
});
export default SearchPage;
