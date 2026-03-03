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
import { Star } from "@medusajs/icons";
import { useState } from "react";

const SubscriptionBenefitsPage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    plan_id: "",
    benefit_type: "discount",
    discount_pct: "",
    applies_to_offer_types: "",
    max_uses_per_period: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-benefits"],
    queryFn: () =>
      client.get<{ rules: any[] }>(
        "/admin/custom/subscription-benefits?limit=50",
      ),
  });
  const rules = data?.data?.rules ?? [];

  const create = useMutation({
    mutationFn: (body: any) =>
      client.post("/admin/custom/subscription-benefits", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription-benefits"] });
      setCreating(false);
    },
  });

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Subscription Benefits</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Cross-product benefit rules — subscription plans that grant
            discounts or access to other verticals
          </Text>
        </div>
        <Button size="small" onClick={() => setCreating(!creating)}>
          New Benefit Rule
        </Button>
      </div>

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Benefit Rule</Text>
          <Input
            placeholder="Plan ID (e.g. plan_premium_monthly)"
            value={form.plan_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, plan_id: e.target.value }))
            }
          />
          <Input
            placeholder="Discount % (e.g. 15)"
            value={form.discount_pct}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount_pct: e.target.value }))
            }
          />
          <Input
            placeholder="Applies to offer types (comma-sep, e.g. booking,good)"
            value={form.applies_to_offer_types}
            onChange={(e) =>
              setForm((f) => ({ ...f, applies_to_offer_types: e.target.value }))
            }
          />
          <Input
            placeholder="Max uses per period (leave blank = unlimited)"
            value={form.max_uses_per_period}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_uses_per_period: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() =>
                create.mutate({
                  ...form,
                  discount_pct: parseFloat(form.discount_pct),
                  applies_to_offer_types: form.applies_to_offer_types
                    .split(",")
                    .map((s) => s.trim()),
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
              <Table.HeaderCell>Plan</Table.HeaderCell>
              <Table.HeaderCell>Benefit Type</Table.HeaderCell>
              <Table.HeaderCell>Value</Table.HeaderCell>
              <Table.HeaderCell>Applies To</Table.HeaderCell>
              <Table.HeaderCell>Max Uses</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No benefit rules configured.
                </Table.Cell>
              </Table.Row>
            ) : (
              rules.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell className="font-mono text-sm">
                    {r.plan_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="purple">{r.benefit_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-semibold text-green-600">
                      {r.discount_pct}%
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-ui-fg-muted">
                    {(r.applies_to_offer_types ?? []).join(", ")}
                  </Table.Cell>
                  <Table.Cell className="text-sm">
                    {r.max_uses_per_period ?? "∞"}
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
  label: "Subscription Benefits",
  icon: Star,
});
export default SubscriptionBenefitsPage;
