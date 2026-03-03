import { Container, Heading, Table, Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ReceiptPercent } from "@medusajs/icons";
import { useState } from "react";

const ENTRY_TYPE_COLOR: Record<string, "blue" | "green" | "red" | "grey"> = {
  debit: "red",
  credit: "green",
  reversal: "grey",
  freeze: "blue",
  unfreeze: "blue",
};

const LedgerPage = () => {
  const [accountFilter, setAccountFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ledger-entries", accountFilter, typeFilter],
    queryFn: () =>
      client.get<{ entries: any[]; count: number }>(
        `/admin/custom/ledger/entries?limit=100${accountFilter ? `&account_id=${accountFilter}` : ""}${typeFilter ? `&entry_type=${typeFilter}` : ""}`,
      ),
  });
  const entries = data?.data?.entries ?? [];
  const count = data?.data?.count ?? 0;

  // Summary: total by account type
  const creditTotal = entries
    .filter((e: any) => e.entry_type === "credit")
    .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
  const debitTotal = entries
    .filter((e: any) => e.entry_type === "debit")
    .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Ledger Explorer</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Double-entry ledger — unified value audit trail across all commerce
            verticals
          </Text>
        </div>
        <Text className="text-ui-fg-muted text-sm">{count} entries</Text>
      </div>

      {/* Summary row */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-ui-border-base rounded-xl p-4 bg-ui-bg-base">
            <Text className="text-xs text-ui-fg-muted mb-1">
              Total Credits (shown)
            </Text>
            <div className="text-2xl font-bold text-green-600">
              SAR {creditTotal.toLocaleString()}
            </div>
          </div>
          <div className="border border-ui-border-base rounded-xl p-4 bg-ui-bg-base">
            <Text className="text-xs text-ui-fg-muted mb-1">
              Total Debits (shown)
            </Text>
            <div className="text-2xl font-bold text-red-600">
              SAR {debitTotal.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Filter by account ID…"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base flex-1"
        />
        <select
          className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {["debit", "credit", "reversal", "freeze", "unfreeze"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Entry ID</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>From Account</Table.HeaderCell>
              <Table.HeaderCell>To Account</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Reference</Table.HeaderCell>
              <Table.HeaderCell>Posted At</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {entries.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No ledger entries. Entries are written by settlement,
                  commission, refund, and wallet operations.
                </Table.Cell>
              </Table.Row>
            ) : (
              entries.map((e: any) => (
                <Table.Row key={e.id}>
                  <Table.Cell className="font-mono text-xs">
                    {e.id?.slice(0, 12)}…
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={ENTRY_TYPE_COLOR[e.entry_type] ?? "grey"}>
                      {e.entry_type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs text-ui-fg-muted">
                    {e.from_account_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs text-ui-fg-muted">
                    {e.to_account_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="font-semibold">
                    SAR {(e.amount ?? 0).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-ui-fg-muted">
                    {e.reference_id ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-ui-fg-muted">
                    {e.posted_at ? new Date(e.posted_at).toLocaleString() : "—"}
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
  label: "Ledger Explorer",
  icon: ReceiptPercent,
});
export default LedgerPage;
