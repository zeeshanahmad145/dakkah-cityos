import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { BuildingStorefront } from "@medusajs/icons";
import { useEffect, useState } from "react";

type UtilityAccount = {
  id: string;
  account_number: string;
  utility_type: string;
  customer_id: string;
  status: string;
  current_balance: number;
  currency_code: string;
  meter_serial: string;
};

const UtilitiesPage = () => {
  const [accounts, setAccounts] = useState<UtilityAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/utilities")
      .then((r) => r.json())
      .then((d) => setAccounts(d?.utility_accounts || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const byType = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.utility_type] = (acc[a.utility_type] || 0) + 1;
    return acc;
  }, {});

  const statusColor = (s: string) =>
    s === "active" ? "green" : s === "suspended" ? "orange" : "red";

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base flex items-center justify-between">
        <div>
          <Heading level="h1">Utilities</Heading>
          <Text className="text-ui-fg-muted">
            Electricity, water, gas, and internet utility accounts
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-6 border-b border-ui-border-base">
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-muted text-sm">Total Accounts</Text>
          <Heading level="h2">{accounts.length}</Heading>
        </div>
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-muted text-sm capitalize">{type}</Text>
            <Heading level="h2">{count}</Heading>
          </div>
        ))}
      </div>

      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : accounts.length === 0 ? (
          <Text className="text-ui-fg-muted">No utility accounts found.</Text>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base text-ui-fg-muted text-left">
                <th className="pb-3 pr-4 font-medium">Account #</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Meter Serial</th>
                <th className="pb-3 pr-4 font-medium">Balance</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-ui-border-base">
                  <td className="py-3 pr-4 font-medium">{a.account_number}</td>
                  <td className="py-3 pr-4 capitalize">{a.utility_type}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {a.meter_serial || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {a.current_balance?.toLocaleString()}{" "}
                    {a.currency_code?.toUpperCase()}
                  </td>
                  <td className="py-3">
                    <Badge color={statusColor(a.status) as any}>
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Utilities",
  icon: BuildingStorefront,
});
export default UtilitiesPage;
