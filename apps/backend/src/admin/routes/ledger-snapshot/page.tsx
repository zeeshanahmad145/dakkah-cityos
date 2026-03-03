import { Container, Heading, Table, Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { ReceiptPercent } from "@medusajs/icons";

const LedgerSnapshotPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["ledger-snapshots"],
    queryFn: () =>
      client.get<{ snapshots: any[] }>(
        "/admin/custom/ledger-snapshots?limit=30",
      ),
  });
  const snapshots = data?.data?.snapshots ?? [];

  return (
    <Container>
      <div className="mb-6">
        <Heading>Ledger Snapshots</Heading>
        <Text className="text-ui-fg-muted text-sm mt-1">
          Daily Medusa↔ERP balance drift detection. Each snapshot captures
          account balances; drift &gt; 0 means reconciliation required.
        </Text>
      </div>

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <>
          {snapshots.some(
            (s: any) => s.drift_amount && Math.abs(s.drift_amount) > 0,
          ) && (
            <div className="mb-6 border border-orange-200 bg-orange-50 rounded-xl p-4">
              <Text className="text-orange-700 font-medium">
                ⚠️{" "}
                {
                  snapshots.filter(
                    (s: any) => s.drift_amount && Math.abs(s.drift_amount) > 0,
                  ).length
                }{" "}
                snapshot(s) with drift detected. Investigate and reconcile.
              </Text>
            </div>
          )}
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Account Type</Table.HeaderCell>
                <Table.HeaderCell>Medusa Balance</Table.HeaderCell>
                <Table.HeaderCell>ERP Balance</Table.HeaderCell>
                <Table.HeaderCell>Drift</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {snapshots.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-center text-ui-fg-muted py-8">
                    No snapshots yet. Snapshots are generated nightly by the
                    ledger-snapshot cron job.
                  </Table.Cell>
                </Table.Row>
              ) : (
                snapshots.map((s: any) => {
                  const drift = s.drift_amount ?? 0;
                  return (
                    <Table.Row key={s.id}>
                      <Table.Cell className="text-sm">
                        {s.snapshot_date
                          ? new Date(s.snapshot_date).toLocaleDateString()
                          : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="blue">{s.account_type}</Badge>
                      </Table.Cell>
                      <Table.Cell className="font-mono text-sm">
                        SAR {(s.medusa_balance ?? 0).toLocaleString()}
                      </Table.Cell>
                      <Table.Cell className="font-mono text-sm">
                        SAR {(s.erp_balance ?? 0).toLocaleString()}
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className={
                            Math.abs(drift) > 0
                              ? "text-red-600 font-semibold"
                              : "text-green-600"
                          }
                        >
                          {drift > 0 ? "+" : ""}
                          {drift.toLocaleString()}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={Math.abs(drift) > 0 ? "orange" : "green"}>
                          {Math.abs(drift) > 0 ? "drift" : "clean"}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table>
        </>
      )}
    </Container>
  );
};
export const config = defineRouteConfig({
  label: "Ledger Snapshots",
  icon: ReceiptPercent,
});
export default LedgerSnapshotPage;
