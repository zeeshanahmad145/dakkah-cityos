import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useNavigate } from "react-router-dom";
import { client } from "../../lib/client";
import { ArrowUpMini } from "@medusajs/icons";

const CommissionsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["commission-rules"],
    queryFn: () =>
      client.get<{ commission_rules: any[] }>(
        "/admin/custom/commissions?limit=50",
      ),
  });

  const rules = data?.data?.commission_rules ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Commissions</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Commission rule sets applied to vendor orders
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/commissions/tiers")}
          >
            Tiers
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/commissions/transactions")}
          >
            Transactions
          </Button>
          <Button size="small" variant="secondary">
            + New Rule
          </Button>
        </div>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load commission rules.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Rule Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Rate / Amount</Table.HeaderCell>
              <Table.HeaderCell>Applies To</Table.HeaderCell>
              <Table.HeaderCell>Default</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No commission rules defined. Use the Tiers or Transactions
                  sub-pages to manage commissions.
                </Table.Cell>
              </Table.Row>
            ) : (
              rules.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell className="font-medium">
                    {r.name ?? "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{r.type ?? "percentage"}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {r.type === "percentage"
                      ? `${r.rate ?? 0}%`
                      : `$${Number(r.flat_amount ?? 0).toFixed(2)}`}
                  </Table.Cell>
                  <Table.Cell>{r.applies_to ?? "All vendors"}</Table.Cell>
                  <Table.Cell>
                    {r.is_default ? <Badge color="green">Default</Badge> : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={r.is_active !== false ? "green" : "grey"}>
                      {r.is_active !== false ? "Active" : "Inactive"}
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
  label: "Commissions",
  icon: ArrowUpMini,
});

export default CommissionsPage;
