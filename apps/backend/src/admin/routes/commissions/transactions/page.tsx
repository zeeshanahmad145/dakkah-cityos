import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui";
import { CurrencyDollar } from "@medusajs/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "../../../lib/client.js";
import { StatsGrid } from "../../../components/charts/stats-grid.js";

interface Transaction {
  id: string;
  vendor_id: string;
  vendor_name: string;
  order_id: string;
  commission_amount: string | number;
  net_amount: string | number;
  transaction_type: string;
  status: string;
  payout_status: string;
  transaction_date?: string;
  notes?: string;
  created_at: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  summary: {
    total_transactions: number;
    total_amount: number;
    completed_amount: number;
    pending_amount: number;
    failed_amount: number;
  };
  count: number;
  limit: number;
  offset: number;
}

function useCommissionTransactions(filters?: {
  vendor_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.vendor_id) params.append("vendor_id", filters.vendor_id);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  return useQuery({
    queryKey: ["commission-transactions", filters],
    queryFn: async () => {
      const url = `/admin/commissions/transactions${params.toString() ? `?${params}` : ""}`;
      const { data } = await client.get<TransactionsResponse>(url);
      return data;
    },
  });
}

const CommissionTransactionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useCommissionTransactions({
    status: statusFilter || undefined,
    limit,
    offset: page * limit,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading transactions...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center">Failed to load transactions</div>;
  }

  const { transactions, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <Heading>Commission Transactions</Heading>
        <Text className="text-ui-fg-subtle">
          Track all vendor payout transactions
        </Text>
      </div>

      <StatsGrid
        stats={[
          {
            label: "Total Transactions",
            value: summary.total_transactions.toString(),
            color: "blue",
          },
          {
            label: "Total Amount",
            value: `$${summary.total_amount.toLocaleString()}`,
            color: "purple",
          },
          {
            label: "Completed",
            value: `$${summary.completed_amount.toLocaleString()}`,
            color: "green",
          },
          {
            label: "Pending",
            value: `$${summary.pending_amount.toLocaleString()}`,
            color: "orange",
          },
          {
            label: "Failed",
            value: `$${summary.failed_amount.toLocaleString()}`,
            color: "red",
          },
        ]}
      />

      <Container className="p-0">
        <div className="p-4 border-b flex items-center justify-between">
          <Heading level="h2">Transaction History</Heading>
          <div className="flex gap-2">
            {["", "pending", "completed", "failed"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "primary" : "secondary"}
                size="small"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(0);
                }}
              >
                {status || "All"}
              </Button>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead className="border-b bg-ui-bg-subtle">
            <tr className="text-left text-ui-fg-subtle">
              <th className="p-4">Date</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Type</th>
              <th className="p-4 text-right">Commission</th>
              <th className="p-4">Payout Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-ui-bg-subtle">
                <td className="p-4">
                  <Text className="text-sm">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs text-ui-fg-muted">
                    {new Date(tx.created_at).toLocaleTimeString()}
                  </Text>
                </td>
                <td className="p-4">
                  <Text className="font-medium">{tx.vendor_name}</Text>
                </td>
                <td className="p-4">
                  <Text className="font-mono text-sm">
                    {tx.order_id || "-"}
                  </Text>
                </td>
                <td className="p-4">
                  <Badge>{tx.transaction_type || "-"}</Badge>
                </td>
                <td className="p-4 text-right">
                  <Text className="font-medium">
                    $
                    {parseFloat(
                      String(tx.commission_amount || 0),
                    ).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-ui-fg-muted uppercase">
                    NET: $
                    {parseFloat(String(tx.net_amount || 0)).toLocaleString()}
                  </Text>
                </td>
                <td className="p-4">
                  <Badge
                    color={
                      tx.payout_status === "paid"
                        ? "green"
                        : tx.payout_status === "pending_payout"
                          ? "orange"
                          : tx.payout_status === "failed"
                            ? "red"
                            : "grey"
                    }
                  >
                    {tx.payout_status || tx.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-ui-fg-muted">No transactions found</Text>
          </div>
        )}

        {data.count > limit && (
          <div className="p-4 border-t flex justify-between items-center">
            <Text className="text-ui-fg-subtle">
              Showing {page * limit + 1}-
              {Math.min((page + 1) * limit, data.count)} of {data.count}
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={(page + 1) * limit >= data.count}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Commission Transactions",
  icon: CurrencyDollar,
});

export default CommissionTransactionsPage;
