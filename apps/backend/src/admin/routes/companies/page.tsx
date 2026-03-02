import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useNavigate } from "react-router-dom";
import { client } from "../../lib/client";
import { Buildings } from "@medusajs/icons";

const CompaniesPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["companies"],
    queryFn: () =>
      client.get<{ companies: any[] }>("/admin/custom/companies?limit=50"),
  });

  const companies = data?.data?.companies ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Companies</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            B2B company accounts, credit limits, and purchase approvals
          </Text>
        </div>
        <Button size="small" variant="secondary">
          + New Company
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load companies.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Company Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Credit Limit</Table.HeaderCell>
              <Table.HeaderCell>Used Credit</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Customers</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {companies.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No B2B companies registered yet.
                </Table.Cell>
              </Table.Row>
            ) : (
              companies.map((c: any) => (
                <Table.Row
                  key={c.id}
                  onClick={() => navigate(`/companies/${c.id}`)}
                  className="cursor-pointer"
                >
                  <Table.Cell className="font-medium">
                    {c.name ?? "—"}
                  </Table.Cell>
                  <Table.Cell>{c.company_type ?? "standard"}</Table.Cell>
                  <Table.Cell>
                    {c.credit_limit != null
                      ? `$${Number(c.credit_limit).toLocaleString()}`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {c.used_credit != null
                      ? `$${Number(c.used_credit).toLocaleString()}`
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        c.status === "active"
                          ? "green"
                          : c.status === "suspended"
                            ? "red"
                            : "orange"
                      }
                    >
                      {c.status ?? "pending"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{c.customer_count ?? 0}</Table.Cell>
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
  label: "Companies",
  icon: Buildings,
});

export default CompaniesPage;
