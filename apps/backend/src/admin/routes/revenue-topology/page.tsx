import {
  Container,
  Heading,
  Table,
  Badge,
  Button,
  Text,
  Input,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CurrencyDollar } from "@medusajs/icons";
import { useState } from "react";

const SPLIT_TYPES = ["percentage", "fixed", "residual", "levy"];
const ACCOUNT_TYPES = [
  "commission",
  "levy",
  "vendor",
  "platform",
  "government",
  "affiliate",
];

const RevenueTopologyPage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    label: "",
    node_id: "",
    parent_node_id: "",
    split_type: "percentage",
    split_value: "",
    value_base: "gross",
    ledger_account_type: "commission",
    ledger_account_id: "platform",
    priority: "10",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["revenue-split-rules"],
    queryFn: () =>
      client.get<{ rules: any[] }>("/admin/custom/revenue-topology?limit=100"),
  });
  const rules = data?.data?.rules ?? [];

  const create = useMutation({
    mutationFn: (body: any) =>
      client.post("/admin/custom/revenue-topology", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue-split-rules"] });
      setCreating(false);
    },
  });

  // Group by parent hierarchy for visual display
  const roots = rules.filter((r: any) => !r.parent_node_id);
  const children = rules.filter((r: any) => !!r.parent_node_id);

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Revenue Topology</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Multi-tier revenue distribution — City Platform → Tenant → Vendor →
            Sub-vendor → Government Levy
          </Text>
        </div>
        <Button size="small" onClick={() => setCreating(!creating)}>
          New Split Rule
        </Button>
      </div>

      {/* Quick topology preview */}
      {roots.length > 0 && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle">
          <Text className="font-medium mb-3">Revenue Flow</Text>
          <div className="flex flex-wrap gap-2 items-center">
            {rules
              .sort((a: any, b: any) => (a.priority ?? 10) - (b.priority ?? 10))
              .map((r: any, i: number) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="bg-ui-bg-base border border-ui-border-base rounded-lg px-3 py-2 text-sm">
                    <div className="font-medium">{r.label ?? r.node_id}</div>
                    <div className="text-ui-fg-muted text-xs">
                      {r.split_value}
                      {r.split_type === "percentage" ? "%" : " SAR"} of{" "}
                      {r.value_base}
                    </div>
                  </div>
                  {i < rules.length - 1 && (
                    <span className="text-ui-fg-muted">→</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Revenue Split Rule</Text>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Label (e.g. Platform Commission)"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
            />
            <Input
              placeholder="Node ID (e.g. city_platform)"
              value={form.node_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, node_id: e.target.value }))
              }
            />
            <Input
              placeholder="Parent Node ID (leave blank for root)"
              value={form.parent_node_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, parent_node_id: e.target.value }))
              }
            />
            <Input
              placeholder="Split value (% or SAR)"
              value={form.split_value}
              onChange={(e) =>
                setForm((f) => ({ ...f, split_value: e.target.value }))
              }
            />
            <select
              className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
              value={form.split_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, split_type: e.target.value }))
              }
            >
              {SPLIT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
              value={form.ledger_account_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, ledger_account_type: e.target.value }))
              }
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Input
              placeholder="Ledger account ID (e.g. platform, government)"
              value={form.ledger_account_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, ledger_account_id: e.target.value }))
              }
            />
            <Input
              placeholder="Priority (lower = first)"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() =>
                create.mutate({
                  ...form,
                  split_value: parseFloat(form.split_value),
                  priority: parseInt(form.priority),
                  is_active: true,
                })
              }
            >
              Save
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setCreating(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Priority</Table.HeaderCell>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Node</Table.HeaderCell>
              <Table.HeaderCell>Split</Table.HeaderCell>
              <Table.HeaderCell>Ledger Account</Table.HeaderCell>
              <Table.HeaderCell>Base</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No revenue split rules. All revenue goes to vendor (100%).
                </Table.Cell>
              </Table.Row>
            ) : (
              rules
                .sort(
                  (a: any, b: any) => (a.priority ?? 10) - (b.priority ?? 10),
                )
                .map((r: any) => (
                  <Table.Row key={r.id}>
                    <Table.Cell className="font-mono text-sm text-ui-fg-muted">
                      {r.priority ?? 10}
                    </Table.Cell>
                    <Table.Cell className="font-medium">{r.label}</Table.Cell>
                    <Table.Cell className="font-mono text-sm">
                      {r.node_id}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={r.split_type === "levy" ? "orange" : "blue"}
                      >
                        {r.split_value}
                        {r.split_type === "percentage" ? "%" : " SAR"} (
                        {r.split_type})
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-sm text-ui-fg-muted">
                      {r.ledger_account_type}:{r.ledger_account_id}
                    </Table.Cell>
                    <Table.Cell className="text-sm">{r.value_base}</Table.Cell>
                    <Table.Cell>
                      <Badge color={r.is_active ? "green" : "grey"}>
                        {r.is_active ? "active" : "inactive"}
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
  label: "Revenue Topology",
  icon: CurrencyDollar,
});
export default RevenueTopologyPage;
