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
import { LockClosedSolid } from "@medusajs/icons";
import { useState } from "react";

const IdentityGatePage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    offer_type: "",
    credential_types: "",
    jurisdiction: "",
    failure_action: "block",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["identity-requirements"],
    queryFn: () =>
      client.get<{ identity_requirements: any[] }>(
        "/admin/custom/identity-gate?limit=50",
      ),
  });
  const reqs = data?.data?.identity_requirements ?? [];

  const create = useMutation({
    mutationFn: (body: any) => client.post("/admin/custom/identity-gate", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity-requirements"] });
      setCreating(false);
    },
  });

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Identity Gate</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Credential requirements for checkout — age verification, KYC,
            professional licenses, jurisdiction restrictions
          </Text>
        </div>
        <Button size="small" onClick={() => setCreating(!creating)}>
          New Requirement
        </Button>
      </div>

      {creating && (
        <div className="border border-ui-border-base rounded-lg p-4 mb-6 bg-ui-bg-subtle space-y-3">
          <Text className="font-medium">New Identity Requirement</Text>
          <Input
            placeholder="Offer type (e.g. service, right, good)"
            value={form.offer_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, offer_type: e.target.value }))
            }
          />
          <Input
            placeholder="Required credentials (comma-sep, e.g. kyc_verified,age_21)"
            value={form.credential_types}
            onChange={(e) =>
              setForm((f) => ({ ...f, credential_types: e.target.value }))
            }
          />
          <Input
            placeholder="Jurisdiction (e.g. SA-RYD, AE-DXB, or empty for all)"
            value={form.jurisdiction}
            onChange={(e) =>
              setForm((f) => ({ ...f, jurisdiction: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() =>
                create.mutate({
                  ...form,
                  required_credentials: form.credential_types
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
              <Table.HeaderCell>Offer Type</Table.HeaderCell>
              <Table.HeaderCell>Required Credentials</Table.HeaderCell>
              <Table.HeaderCell>Jurisdiction</Table.HeaderCell>
              <Table.HeaderCell>On Failure</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reqs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No identity requirements configured.
                </Table.Cell>
              </Table.Row>
            ) : (
              reqs.map((r: any) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <Badge color="purple">
                      {r.offer_type ?? r.scope_offer_type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-sm">
                    {(r.required_credentials ?? []).join(", ")}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-ui-fg-muted">
                    {r.jurisdiction ?? "All"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={r.failure_action === "block" ? "red" : "orange"}
                    >
                      {r.failure_action ?? "block"}
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
  label: "Identity Gate",
  icon: LockClosedSolid,
});
export default IdentityGatePage;
