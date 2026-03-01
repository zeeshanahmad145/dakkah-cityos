import { Container, Heading, Table, StatusBadge, Button } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import { client } from "../../../lib/client";

type Workflow = {
  workflowId: string;
  runId: string;
  type: string;
  status: string;
  startTime: string;
};
type WorkflowsResponse = { workflows: Workflow[] };

const fetchWorkflows = async (): Promise<WorkflowsResponse> => {
  const { data } = await client.get<WorkflowsResponse>(
    "/admin/temporal/workflows",
  );
  return data;
};
const statusColor = (s: string): "green" | "blue" | "red" | "grey" =>
  s === "COMPLETED"
    ? "green"
    : s === "RUNNING"
      ? "blue"
      : s === "FAILED"
        ? "red"
        : "grey";

const WorkflowsPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["temporal-workflows"],
    queryFn: fetchWorkflows,
  });
  return (
    <Container>
      <div className="flex justify-between mb-6">
        <Heading level="h1">Temporal Workflows</Heading>
        <Button onClick={() => refetch()} variant="secondary">
          Refresh
        </Button>
      </div>
      {isError && (
        <div className="text-red-500 mb-4">
          Error: {error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown"}
        </div>
      )}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Workflow ID</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Start Time</Table.HeaderCell>
              <Table.HeaderCell>Run ID</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.workflows?.map((wf) => (
              <Table.Row key={wf.runId}>
                <Table.Cell>{wf.workflowId}</Table.Cell>
                <Table.Cell>{wf.type}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={statusColor(wf.status)}>
                    {wf.status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  {new Date(wf.startTime).toLocaleString()}
                </Table.Cell>
                <Table.Cell className="text-ui-fg-subtle text-xs">
                  {wf.runId}
                </Table.Cell>
              </Table.Row>
            ))}
            {(!data?.workflows || data.workflows.length === 0) && (
              <Table.Row>
                <td colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  No workflows found
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Workflows",
  icon: ChatBubbleLeftRight,
});
export default WorkflowsPage;
