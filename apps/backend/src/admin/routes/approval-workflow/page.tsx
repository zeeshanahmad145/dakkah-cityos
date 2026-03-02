import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CheckCircle } from "@medusajs/icons";

const ApprovalWorkflowPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["approval-requests"],
    queryFn: () =>
      client.get<{ approval_requests: any[] }>(
        "/admin/custom/approval-workflow?limit=50",
      ),
  });
  const requests = data?.data?.approval_requests ?? [];
  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Approval Workflows</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Quote approvals · PO approvals · Credit increase · Refund approvals
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Manage Policies
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load approval requests.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Entity Type</Table.HeaderCell>
              <Table.HeaderCell>Entity ID</Table.HeaderCell>
              <Table.HeaderCell>Requestor</Table.HeaderCell>
              <Table.HeaderCell>Step</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Expires</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No pending approval requests.
                </Table.Cell>
              </Table.Row>
            ) : (
              requests.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <Badge color="blue">{r.entity_type}</Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm">
                    {r.entity_id}
                  </Table.Cell>
                  <Table.Cell>{r.requestor_id ?? "—"}</Table.Cell>
                  <Table.Cell>{r.current_step ?? 0}</Table.Cell>
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
                    {r.expires_at
                      ? new Date(r.expires_at).toLocaleDateString()
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
  label: "Approval Workflows",
  icon: CheckCircle,
});
export default ApprovalWorkflowPage;
