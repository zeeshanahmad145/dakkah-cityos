import { Container, Heading, Table, Badge, Text, Input } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { Sparkles } from "@medusajs/icons";
import { useState } from "react";

const LIFECYCLE_COLORS: Record<
  string,
  "grey" | "blue" | "orange" | "green" | "red" | "purple"
> = {
  CREATED: "grey",
  AUTHORIZED: "blue",
  ALLOCATED: "blue",
  CONFIRMED: "blue",
  EXECUTED: "orange",
  VERIFIED: "purple",
  SETTLED: "green",
  RECONCILED: "green",
  DISPUTED: "red",
  REVERSED: "red",
  CANCELLED: "grey",
  EXPIRED: "grey",
};

const OFFER_TYPE_COLORS: Record<
  string,
  "grey" | "blue" | "orange" | "green" | "red" | "purple"
> = {
  good: "blue",
  service: "green",
  right: "purple",
  access: "orange",
  license: "grey",
  usage: "blue",
  subscription: "green",
};

const KernelPage = () => {
  const [filterType, setFilterType] = useState("");
  const [filterState, setFilterState] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["kernel-offers", filterType, filterState],
    queryFn: () =>
      client.get<{ offers: any[]; count: number }>(
        `/admin/custom/kernel/offers?limit=100${filterType ? `&offer_type=${filterType}` : ""}${filterState ? `&lifecycle_state=${filterState}` : ""}`,
      ),
  });
  const offers = data?.data?.offers ?? [];
  const count = data?.data?.count ?? 0;

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Offer Registry (Kernel)</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Universal offer abstraction — all commerce entities normalised to a
            single lifecycle machine
          </Text>
        </div>
        <Text className="text-ui-fg-muted text-sm">{count} total offers</Text>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All offer types</option>
          {[
            "good",
            "service",
            "right",
            "access",
            "license",
            "usage",
            "subscription",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 text-sm border border-ui-border-base rounded-lg bg-ui-bg-base"
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
        >
          <option value="">All states</option>
          {[
            "CREATED",
            "AUTHORIZED",
            "EXECUTED",
            "SETTLED",
            "RECONCILED",
            "DISPUTED",
            "REVERSED",
            "CANCELLED",
            "EXPIRED",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Offer ID</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Monetization</Table.HeaderCell>
              <Table.HeaderCell>Source Module</Table.HeaderCell>
              <Table.HeaderCell>Lifecycle State</Table.HeaderCell>
              <Table.HeaderCell>Base Price</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {offers.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No offers in registry. Offers are registered when modules
                  create commerce entities.
                </Table.Cell>
              </Table.Row>
            ) : (
              offers.map((o: any) => (
                <Table.Row key={o.id}>
                  <Table.Cell className="font-mono text-sm">
                    {o.id?.slice(0, 16)}…
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={OFFER_TYPE_COLORS[o.offer_type] ?? "grey"}>
                      {o.offer_type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-ui-fg-muted">
                    {o.monetization_model ?? "—"}
                  </Table.Cell>
                  <Table.Cell className="text-sm">
                    {o.source_module ?? "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={LIFECYCLE_COLORS[o.lifecycle_state] ?? "grey"}
                    >
                      {o.lifecycle_state}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="font-semibold">
                    {o.base_price
                      ? `${o.currency_code ?? "SAR"} ${o.base_price.toLocaleString()}`
                      : "—"}
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
  label: "Offer Registry",
  icon: Sparkles,
});
export default KernelPage;
