import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ExclamationCircle } from "@medusajs/icons";

const FraudPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["fraud-cases"],
    queryFn: () =>
      client.get<{ fraud_cases: any[] }>("/admin/custom/fraud?limit=50"),
  });
  const cases = data?.data?.fraud_cases ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Fraud Detection</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Open cases · Risk signals · Resolutions
          </Text>
        </div>
        <Button size="small" variant="secondary">
          View Rules
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">Failed to load fraud cases.</Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer ID</Table.HeaderCell>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Score</Table.HeaderCell>
              <Table.HeaderCell>Action Taken</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cases.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No fraud cases. System is clean.
                </Table.Cell>
              </Table.Row>
            ) : (
              cases.map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell className="font-mono text-sm">
                    {c.customer_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {c.order_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        c.composite_score >= 80
                          ? "red"
                          : c.composite_score >= 50
                            ? "orange"
                            : "green"
                      }
                    >
                      {c.composite_score}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        c.action_taken === "blocked"
                          ? "red"
                          : c.action_taken === "flagged"
                            ? "orange"
                            : "grey"
                      }
                    >
                      {c.action_taken ?? "none"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.status === "open" ? "orange" : "green"}>
                      {c.status}
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
  label: "Fraud Detection",
  icon: ExclamationCircle,
});
export default FraudPage;
