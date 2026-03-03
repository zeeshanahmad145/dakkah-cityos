import {
  Container,
  Heading,
  Table,
  Badge,
  Button,
  Text,
  Input,
  Textarea,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { CommandLine } from "@medusajs/icons";
import { useState } from "react";

const ACTION_COLORS: Record<
  string,
  "red" | "orange" | "grey" | "blue" | "green" | "purple"
> = {
  block: "red",
  flag: "orange",
  require_approval: "blue",
  modify_price: "purple",
  add_levy: "grey",
  require_credential: "orange",
  allow: "green",
};
const RULE_TYPES = [
  "identity",
  "pricing",
  "access",
  "fraud",
  "compliance",
  "approval",
];
const ACTIONS = [
  "allow",
  "block",
  "flag",
  "require_approval",
  "modify_price",
  "add_levy",
  "require_credential",
];

const PolicyEnginePage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [testCtx, setTestCtx] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [form, setForm] = useState({
    rule_name: "",
    rule_type: "access",
    priority: "50",
    condition_dsl: '{"field":"offer.offer_type","op":"equals","value":"good"}',
    action: "allow",
    explanation: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["policy-rules"],
    queryFn: () =>
      client.get<{ policy_rules: any[] }>(
        "/admin/custom/policy-rules?limit=100",
      ),
  });
  const rules = data?.data?.policy_rules ?? [];

  const create = useMutation({
    mutationFn: (body: any) => client.post("/admin/custom/policy-rules", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy-rules"] });
      setCreating(false);
    },
  });

  const runTest = async () => {
    try {
      const ctx = JSON.parse(testCtx);
      const res = await client.post<any>("/admin/policy-engine/evaluate", {
        ...ctx,
        dry_run: true,
      });
      setTestResult(res.data);
    } catch (e: any) {
      setTestResult({ error: e.message });
    }
  };

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Policy Engine</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Composable commerce policies — rules evaluated at checkout, pricing,
            and access gates
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => setTestResult(testResult ? null : {})}
          >
            Test Rules
          </Button>
          <Button size="small" onClick={() => setCreating(!creating)}>
            New Rule
          </Button>
        </div>
      </div>

      {testResult !== null && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">Policy Evaluator (dry-run)</Text>
          <Textarea
            placeholder={
              '{\n  "offer": {"offer_type":"service","base_price":5000},\n  "actor": {"type":"customer"},\n  "customer": {"credentials":["kyc_verified"]}\n}'
            }
            value={testCtx}
            onChange={(e) => setTestCtx(e.target.value)}
            className="font-mono text-sm"
            rows={6}
          />
          <Button size="small" onClick={runTest}>
            Evaluate
          </Button>
          {testResult && Object.keys(testResult).length > 0 && (
            <pre className="bg-ui-bg-base rounded p-3 text-xs font-mono overflow-auto max-h-64">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </div>
      )}

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Policy Rule</Text>
          <Input
            placeholder="Rule name"
            value={form.rule_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, rule_name: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
              value={form.rule_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, rule_type: e.target.value }))
              }
            >
              {RULE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              className="flex-1 px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
              value={form.action}
              onChange={(e) =>
                setForm((f) => ({ ...f, action: e.target.value }))
              }
            >
              {ACTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <Input
              placeholder="Priority (0-100)"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
            />
          </div>
          <Textarea
            placeholder='Condition DSL JSON: {"field":"offer.base_price","op":"gt","value":5000}'
            value={form.condition_dsl}
            onChange={(e) =>
              setForm((f) => ({ ...f, condition_dsl: e.target.value }))
            }
            className="font-mono text-sm"
            rows={3}
          />
          <Input
            placeholder="Explanation (shown in audit trail)"
            value={form.explanation}
            onChange={(e) =>
              setForm((f) => ({ ...f, explanation: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                try {
                  create.mutate({
                    ...form,
                    priority: parseInt(form.priority),
                    condition_dsl: JSON.parse(form.condition_dsl),
                    is_active: true,
                  });
                } catch {
                  alert("Invalid JSON in condition DSL");
                }
              }}
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
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No policy rules. All offers will be allowed by default.
                </Table.Cell>
              </Table.Row>
            ) : (
              rules
                .sort(
                  (a: any, b: any) => (a.priority ?? 50) - (b.priority ?? 50),
                )
                .map((r: any) => (
                  <Table.Row key={r.id}>
                    <Table.Cell className="font-mono text-sm text-ui-fg-muted">
                      {r.priority ?? 50}
                    </Table.Cell>
                    <Table.Cell className="font-medium">
                      {r.rule_name}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue">{r.rule_type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={ACTION_COLORS[r.action] ?? "grey"}>
                        {r.action}
                      </Badge>
                    </Table.Cell>
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
  label: "Policy Engine",
  icon: CommandLine,
});
export default PolicyEnginePage;
