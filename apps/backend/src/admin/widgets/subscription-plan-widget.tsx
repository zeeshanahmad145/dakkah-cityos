import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type SubPlanData = {
  handle: string;
  billing_interval: string;
  billing_interval_count: number;
  trial_period_days: number;
  features: string[] | null;
  limits: Record<string, number> | null;
  sort_order: number;
  stripe_price_id: string | null;
};

const SubscriptionPlanWidget = ({ data }: Props) => {
  const [plan, setPlan] = useState<SubPlanData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=subscription_plan.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.subscription_plan) setPlan(d.product.subscription_plan);
      })
      .catch(() => null);
  }, [data.id]);

  if (!plan) return null;

  const cycleLabel =
    plan.billing_interval_count > 1
      ? `Every ${plan.billing_interval_count} ${plan.billing_interval}s`
      : `${plan.billing_interval.charAt(0).toUpperCase()}${plan.billing_interval.slice(1)}`;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Subscription Plan</Heading>
        <Badge color="blue">{cycleLabel}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Handle</Text>
          <Text className="font-mono text-xs">{plan.handle}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Trial</Text>
          <Text className="font-medium">
            {plan.trial_period_days > 0
              ? `${plan.trial_period_days} days`
              : "None"}
          </Text>
        </div>
        {plan.stripe_price_id && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">
              Stripe Price ID{" "}
              <span className="text-orange-400">(deprecated)</span>
            </Text>
            <Text className="font-mono text-xs">{plan.stripe_price_id}</Text>
          </div>
        )}
        {plan.features && plan.features.length > 0 && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Features</Text>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {plan.features.map((f, i) => (
                <li key={i} className="text-xs">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {plan.limits && Object.keys(plan.limits).length > 0 && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Limits</Text>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {Object.entries(plan.limits).map(([k, v]) => (
                <span key={k} className="text-xs">
                  <span className="font-medium capitalize">
                    {k.replace(/_/g, " ")}:
                  </span>{" "}
                  {v === -1 ? "Unlimited" : v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default SubscriptionPlanWidget;
