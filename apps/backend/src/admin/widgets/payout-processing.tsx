import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge, Button, Table } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

interface Payout {
  id: string;
  payout_number: string;
  vendor_id: string;
  vendor_name?: string;
  net_amount: number;
  status: string;
  payment_method?: string;
  transaction_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
  processing_completed_at?: string;
}

const PayoutProcessingWidget = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        payouts: Payout[];
        count: number;
      }>("/admin/payouts", { credentials: "include" });
      return response;
    },
  });

  const processMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return sdk.client.fetch(`/admin/payouts/${payoutId}/process`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
  });

  const payouts = data?.payouts || [];
  const pendingPayouts = payouts.filter((p) => p.status === "pending");
  const totalPending = pendingPayouts.reduce(
    (sum, p) => sum + (p.net_amount || 0),
    0,
  );

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Vendor Payouts</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">Loading payouts...</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Vendor Payouts</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {pendingPayouts.length} pending ({" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(totalPending)}
            )
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        {payouts.length === 0 ? (
          <Text className="text-ui-fg-subtle">No payouts to process</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Vendor</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Transactions</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.slice(0, 10).map((payout) => (
                <Table.Row key={payout.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {payout.vendor_name || payout.vendor_id.slice(0, 8)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={
                        payout.status === "completed"
                          ? "green"
                          : payout.status === "pending"
                            ? "orange"
                            : payout.status === "processing"
                              ? "blue"
                              : "red"
                      }
                    >
                      {payout.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(payout.net_amount || 0)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{payout.transaction_count}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {new Date(payout.period_start).toLocaleDateString()} -{" "}
                      {new Date(payout.period_end).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {payout.status === "pending" && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => processMutation.mutate(payout.id)}
                        disabled={processMutation.isPending}
                      >
                        Process
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
});

export default PayoutProcessingWidget;
