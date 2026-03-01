import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type InsuranceData = {
  id: string;
  plan_type: string;
  coverage_amount: number;
  premium: number;
  policy_number: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_id: string;
  order_id: string;
};

const InsuranceWidget = ({ data }: { data: { id: string } }) => {
  const [policy, setPolicy] = useState<InsuranceData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=insurance_policy.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.insurance_policy) setPolicy(d.product.insurance_policy);
      })
      .catch(() => null);
  }, [data.id]);

  if (!policy) return null;

  const statusColor = (s: string) =>
    s === "active"
      ? "green"
      : s === "expired"
        ? "orange"
        : s === "claimed"
          ? "blue"
          : "red";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Insurance Policy</Heading>
        <Badge color={statusColor(policy.status) as any}>{policy.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Plan Type</Text>
          <Text className="font-medium capitalize">
            {policy.plan_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Policy #</Text>
          <Text className="font-medium font-mono text-xs">
            {policy.policy_number}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Coverage</Text>
          <Text className="font-medium">
            {policy.coverage_amount?.toLocaleString()}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Premium</Text>
          <Text className="font-medium">
            {policy.premium?.toLocaleString()}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Start</Text>
          <Text className="font-medium">
            {policy.start_date?.split("T")[0]}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">End</Text>
          <Text className="font-medium">{policy.end_date?.split("T")[0]}</Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default InsuranceWidget;
