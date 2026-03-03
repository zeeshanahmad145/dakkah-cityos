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
import { BuildingTax } from "@medusajs/icons";
import { useState } from "react";

const RESOURCE_TYPE_COLOR: Record<
  string,
  "blue" | "green" | "orange" | "grey" | "purple"
> = {
  time_slot: "blue",
  pool: "green",
  seat: "purple",
  metered: "orange",
  fixed: "grey",
};

const ResourcePage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    resource_key: "",
    resource_type: "pool",
    total_capacity: "",
    unit_label: "units",
    owner_id: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () =>
      client.get<{ resources: any[] }>("/admin/custom/resources?limit=100"),
  });
  const resources = data?.data?.resources ?? [];

  const create = useMutation({
    mutationFn: (body: any) => client.post("/admin/custom/resources", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      setCreating(false);
    },
  });

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Resource Capacity</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Universal capacity pool — time slots, seats, inventory pools,
            metered quotas
          </Text>
        </div>
        <Button size="small" onClick={() => setCreating(!creating)}>
          Register Resource
        </Button>
      </div>

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Resource</Text>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Resource key (e.g. booking:court_a:2026-03-01)"
              value={form.resource_key}
              onChange={(e) =>
                setForm((f) => ({ ...f, resource_key: e.target.value }))
              }
            />
            <select
              className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
              value={form.resource_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, resource_type: e.target.value }))
              }
            >
              {["time_slot", "pool", "seat", "metered", "fixed"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Total capacity"
              value={form.total_capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, total_capacity: e.target.value }))
              }
            />
            <Input
              placeholder="Unit label (e.g. slots, seats, GB)"
              value={form.unit_label}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit_label: e.target.value }))
              }
            />
            <Input
              placeholder="Owner ID (vendor, tenant, or module)"
              value={form.owner_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, owner_id: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() =>
                create.mutate({
                  ...form,
                  total_capacity: parseInt(form.total_capacity),
                  consumed_capacity: 0,
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
              <Table.HeaderCell>Resource Key</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Capacity</Table.HeaderCell>
              <Table.HeaderCell>Consumed</Table.HeaderCell>
              <Table.HeaderCell>Available</Table.HeaderCell>
              <Table.HeaderCell>Utilization</Table.HeaderCell>
              <Table.HeaderCell>Owner</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {resources.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No resources registered. Resources are auto-created by
                  booking, fitness, parking, and other capacity-based modules.
                </Table.Cell>
              </Table.Row>
            ) : (
              resources.map((r: any) => {
                const util =
                  r.total_capacity > 0
                    ? Math.round((r.consumed_capacity / r.total_capacity) * 100)
                    : 0;
                const available =
                  (r.total_capacity ?? 0) - (r.consumed_capacity ?? 0);
                return (
                  <Table.Row key={r.id}>
                    <Table.Cell className="font-mono text-xs">
                      {r.resource_key}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={RESOURCE_TYPE_COLOR[r.resource_type] ?? "grey"}
                      >
                        {r.resource_type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="font-semibold">
                      {r.total_capacity?.toLocaleString()} {r.unit_label}
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-muted">
                      {r.consumed_capacity?.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell
                      className={
                        available < 0
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {available.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-ui-bg-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${util >= 90 ? "bg-red-500" : util >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                        <span className="text-xs text-ui-fg-muted">
                          {util}%
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-xs text-ui-fg-muted">
                      {r.owner_id ?? "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={r.is_active ? "green" : "grey"}>
                        {r.is_active ? "active" : "inactive"}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};
export const config = defineRouteConfig({
  label: "Resource Capacity",
  icon: BuildingTax,
});
export default ResourcePage;
