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
import { Adjustments } from "@medusajs/icons";
import { useState } from "react";

const CartRulesPage = () => {
  const qc = useQueryClient();
  const [newRule, setNewRule] = useState({
    name: "",
    rule_type: "mutual_exclusion",
    offer_types: "",
    action: "block",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["cart-rules"],
    queryFn: () =>
      client.get<{ cart_rules: any[] }>("/admin/custom/cart-rules?limit=50"),
  });
  const rules = data?.data?.cart_rules ?? [];

  const create = useMutation({
    mutationFn: (body: any) => client.post("/admin/custom/cart-rules", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-rules"] });
      setCreating(false);
    },
  });

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Cart Conflict Rules</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Mutual-exclusion rules between offer types (e.g. auction ⊗ coupon,
            subscription ⊗ flash-deal)
          </Text>
        </div>
        <Button size="small" onClick={() => setCreating(!creating)}>
          New Rule
        </Button>
      </div>

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Cart Rule</Text>
          <Input
            placeholder="Rule name"
            value={newRule.name}
            onChange={(e) =>
              setNewRule((r) => ({ ...r, name: e.target.value }))
            }
          />
          <Input
            placeholder="Offer types (comma-sep, e.g. auction,coupon)"
            value={newRule.offer_types}
            onChange={(e) =>
              setNewRule((r) => ({ ...r, offer_types: e.target.value }))
            }
          />
          <Input
            placeholder="Description"
            value={newRule.description}
            onChange={(e) =>
              setNewRule((r) => ({ ...r, description: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() =>
                create.mutate({
                  ...newRule,
                  applies_to_offer_types: newRule.offer_types
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
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Rule Type</Table.HeaderCell>
              <Table.HeaderCell>Applies To</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No cart rules configured.
                </Table.Cell>
              </Table.Row>
            ) : (
              rules.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell className="font-medium">
                    {r.rule_name ?? r.name}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">
                      {r.rule_type ?? "mutual_exclusion"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-ui-fg-muted">
                    {(r.applies_to_offer_types ?? []).join(", ")}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={r.action === "block" ? "red" : "orange"}>
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
  label: "Cart Rules",
  icon: Adjustments,
});
export default CartRulesPage;
