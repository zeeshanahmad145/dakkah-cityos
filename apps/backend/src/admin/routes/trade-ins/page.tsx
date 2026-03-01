import { Container, Heading, Table, StatusBadge, Button } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";

type TradeIn = {
  id: string;
  customer_id: string;
  product_id?: string;
  product_title?: string;
  condition: string;
  status: string;
  customer_expected_value?: number | null;
  created_at: string;
};

type TradeInsResponse = { trade_ins: TradeIn[]; count: number };

const fetchTradeIns = async (): Promise<TradeInsResponse> => {
  const { data } = await client.get<TradeInsResponse>(
    "/admin/trade-ins?limit=50",
  );
  return data;
};

const tradeColor = (s: string): "green" | "blue" | "red" | "orange" | "grey" =>
  s === "completed"
    ? "green"
    : s === "accepted"
      ? "blue"
      : s === "rejected"
        ? "red"
        : s === "offer_ready"
          ? "orange"
          : "grey";

const TradeInsPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-trade-ins"],
    queryFn: fetchTradeIns,
  });

  return (
    <Container>
      <div className="flex justify-between mb-6">
        <Heading level="h1">Trade-In Requests</Heading>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="text-red-500 mb-4">
          Error: {error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error"}
        </div>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Condition</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Estimate</Table.HeaderCell>
              <Table.HeaderCell>Submitted</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.trade_ins?.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell className="font-mono text-xs">
                  {t.customer_id}
                </Table.Cell>
                <Table.Cell>
                  {t.product_title || t.product_id || "—"}
                </Table.Cell>
                <Table.Cell className="capitalize">{t.condition}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={tradeColor(t.status)}>
                    {t.status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  {t.customer_expected_value
                    ? Number(t.customer_expected_value).toFixed(2)
                    : "—"}
                </Table.Cell>
                <Table.Cell>
                  {new Date(t.created_at).toLocaleDateString()}
                </Table.Cell>
              </Table.Row>
            ))}
            {(!data?.trade_ins || data.trade_ins.length === 0) && (
              <Table.Row>
                <td colSpan={6} className="text-center py-8 text-ui-fg-subtle">
                  No trade-in requests found
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Trade-Ins" });
export default TradeInsPage;
