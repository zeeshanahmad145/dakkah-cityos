import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { DocumentText } from "@medusajs/icons";

const InsurancePage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["insurance-policies"],
    queryFn: () =>
      client.get<{ insurance_policies: any[] }>(
        "/admin/custom/insurance?limit=50",
      ),
  });

  const policies = data?.data?.insurance_policies ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading>Insurance</Heading>
        <Button size="small" variant="secondary">
          + New Policy Type
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load insurance policies.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Policy Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Provider</Table.HeaderCell>
              <Table.HeaderCell>Coverage</Table.HeaderCell>
              <Table.HeaderCell>Premium</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {policies.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No insurance policies found.
                </Table.Cell>
              </Table.Row>
            ) : (
              policies.map((p: any) => (
                <Table.Row key={p.id}>
                  <Table.Cell>{p.policy_name ?? p.name ?? "—"}</Table.Cell>
                  <Table.Cell>{p.insurance_type ?? "—"}</Table.Cell>
                  <Table.Cell>{p.provider ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {p.coverage_amount != null
                      ? `$${Number(p.coverage_amount).toLocaleString()}`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {p.premium_amount != null
                      ? `$${Number(p.premium_amount).toFixed(2)}/mo`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        p.status === "active"
                          ? "green"
                          : p.status === "pending"
                            ? "orange"
                            : "grey"
                      }
                    >
                      {p.status ?? "draft"}
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
  label: "Insurance",
  icon: DocumentText,
});

export default InsurancePage;
