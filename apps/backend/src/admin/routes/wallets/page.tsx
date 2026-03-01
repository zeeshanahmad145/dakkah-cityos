import {
  Container,
  Heading,
  Table,
  StatusBadge,
  Button,
  Badge,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";

type Wallet = {
  id: string;
  customer_id: string;
  currency: string;
  balance: number | string;
  status: string;
  created_at: string;
};

type WalletsResponse = { wallets: Wallet[]; count: number };

const fetchWallets = async (): Promise<WalletsResponse> => {
  const { data } = await client.get<WalletsResponse>("/admin/wallets?limit=50");
  return data;
};

const walletColor = (s: string): "green" | "orange" | "red" =>
  s === "active" ? "green" : s === "frozen" ? "orange" : "red";

const WalletsPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: fetchWallets,
  });

  return (
    <Container>
      <div className="flex justify-between mb-6">
        <Heading level="h1">Customer Wallets</Heading>
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
              <Table.HeaderCell>Customer ID</Table.HeaderCell>
              <Table.HeaderCell>Currency</Table.HeaderCell>
              <Table.HeaderCell>Balance</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.wallets?.map((w) => (
              <Table.Row key={w.id}>
                <Table.Cell className="font-mono text-xs">
                  {w.customer_id}
                </Table.Cell>
                <Table.Cell>
                  <Badge>{w.currency?.toUpperCase()}</Badge>
                </Table.Cell>
                <Table.Cell className="font-semibold">
                  {Number(w.balance || 0).toFixed(2)}
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge color={walletColor(w.status)}>
                    {w.status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  {new Date(w.created_at).toLocaleDateString()}
                </Table.Cell>
              </Table.Row>
            ))}
            {(!data?.wallets || data.wallets.length === 0) && (
              <Table.Row>
                <td colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  No wallets found
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Wallets" });
export default WalletsPage;
