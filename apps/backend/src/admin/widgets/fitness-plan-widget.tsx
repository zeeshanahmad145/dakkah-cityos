import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type FitnessPlanData = {
  membership_type: string;
  billing_interval: string;
  trial_period_days: number;
  freeze_count: number;
  max_freezes: number;
  access_hours: Record<string, string> | null;
  includes: string[] | null;
};

const FitnessPlanWidget = ({ data }: Props) => {
  const [plan, setPlan] = useState<FitnessPlanData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=gym_membership.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.gym_membership) setPlan(d.product.gym_membership);
      })
      .catch(() => null);
  }, [data.id]);

  if (!plan) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Fitness Membership Plan</Heading>
        <Badge color="blue" className="capitalize">
          {plan.membership_type}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Billing</Text>
          <Text className="font-medium capitalize">
            {plan.billing_interval}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Trial</Text>
          <Text className="font-medium">{plan.trial_period_days} days</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Max Freezes</Text>
          <Text className="font-medium">{plan.max_freezes}</Text>
        </div>
        {plan.includes && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Includes</Text>
            <div className="mt-1 flex flex-wrap gap-1">
              {plan.includes.map((f, i) => (
                <Badge key={i} color="green" size="xsmall">
                  {f}
                </Badge>
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
export default FitnessPlanWidget;
