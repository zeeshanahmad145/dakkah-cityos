import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { DocumentText } from "@medusajs/icons";
import { useState } from "react";

const STATE_COLOR: Record<
  string,
  "grey" | "blue" | "orange" | "green" | "red" | "purple"
> = {
  CREATED: "grey",
  AUTHORIZED: "blue",
  ALLOCATED: "blue",
  EXECUTED: "orange",
  VERIFIED: "purple",
  SETTLED: "green",
  RECONCILED: "green",
  DISPUTED: "red",
  REVERSED: "red",
  CANCELLED: "grey",
};

const CommerceContractPage = () => {
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["commerce-contracts"],
    queryFn: () =>
      client.get<{ contracts: any[] }>(
        "/admin/custom/commerce-contracts?limit=50",
      ),
  });
  const contracts = data?.data?.contracts ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Commerce Contracts</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Multi-party commerce agreements — buyer, seller, agent, government.
            Tracks obligations, settlement rules, disputes.
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract list */}
        <div className="lg:col-span-2">
          {isLoading && <Text>Loading...</Text>}
          {!isLoading && (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Reference</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Parties</Table.HeaderCell>
                  <Table.HeaderCell>Settlement</Table.HeaderCell>
                  <Table.HeaderCell>State</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {contracts.length === 0 ? (
                  <Table.Row>
                    <Table.Cell className="text-center text-ui-fg-muted py-8">
                      No commerce contracts.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  contracts.map((c: any) => (
                    <Table.Row
                      key={c.id}
                      className="cursor-pointer hover:bg-ui-bg-subtle"
                      onClick={() => setSelected(c)}
                    >
                      <Table.Cell className="font-mono text-sm">
                        {c.reference_id ?? c.id?.slice(0, 12)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="blue">
                          {c.contract_type ?? "standard"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-sm">
                        {(c.parties ?? []).length} parties
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="grey">
                          {c.settlement_rules?.type ?? "flat"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={STATE_COLOR[c.lifecycle_state] ?? "grey"}>
                          {c.lifecycle_state}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          )}
        </div>

        {/* Contract detail panel */}
        <div className="border border-ui-border-base rounded-xl p-5 bg-ui-bg-subtle h-fit">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <Text className="font-semibold">Contract Detail</Text>
                <button
                  onClick={() => setSelected(null)}
                  className="text-ui-fg-muted text-sm hover:text-ui-fg-base"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-ui-fg-muted">ID:</span>{" "}
                  <span className="font-mono">{selected.id}</span>
                </div>
                <div>
                  <span className="text-ui-fg-muted">State:</span>{" "}
                  <Badge
                    color={STATE_COLOR[selected.lifecycle_state] ?? "grey"}
                  >
                    {selected.lifecycle_state}
                  </Badge>
                </div>
                <div>
                  <span className="text-ui-fg-muted block mb-1">Parties:</span>
                  {(selected.parties ?? []).map((p: any, i: number) => (
                    <div
                      key={i}
                      className="font-mono text-xs bg-ui-bg-base rounded px-2 py-1 mb-1"
                    >
                      {p.role}: {p.party_id}
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-ui-fg-muted block mb-1">
                    Obligations:
                  </span>
                  {(selected.obligations ?? []).map((o: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-ui-bg-base rounded px-2 py-1 mb-1"
                    >
                      <span className="text-xs">
                        {o.party_role}: {o.action}
                      </span>
                      <Badge
                        color={o.status === "fulfilled" ? "green" : "grey"}
                        className="text-xs"
                      >
                        {o.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-ui-fg-muted">Settlement:</span>
                  <pre className="text-xs font-mono bg-ui-bg-base rounded p-2 mt-1 overflow-auto">
                    {JSON.stringify(selected.settlement_rules, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <Text className="text-ui-fg-muted text-sm text-center py-8">
              Click a contract to view details
            </Text>
          )}
        </div>
      </div>
    </Container>
  );
};
export const config = defineRouteConfig({
  label: "Commerce Contracts",
  icon: DocumentText,
});
export default CommerceContractPage;
