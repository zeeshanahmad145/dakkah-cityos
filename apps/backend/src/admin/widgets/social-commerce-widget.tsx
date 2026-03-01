import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type GroupBuyData = {
  id: string;
  group_type: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  discount_percentage: number;
  deadline: string;
  status: string;
  is_live_stream: boolean;
};

const SocialCommerceWidget = ({ data }: { data: { id: string } }) => {
  const [groupBuy, setGroupBuy] = useState<GroupBuyData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=group_buy.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.group_buy) setGroupBuy(d.product.group_buy);
      })
      .catch(() => null);
  }, [data.id]);

  if (!groupBuy) return null;

  const fillRate =
    groupBuy.max_participants > 0
      ? Math.round(
          (groupBuy.current_participants / groupBuy.max_participants) * 100,
        )
      : 0;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Social Commerce</Heading>
        <div className="flex gap-2">
          {groupBuy.is_live_stream && <Badge color="purple">Live Stream</Badge>}
          <Badge color={groupBuy.status === "active" ? "green" : "grey"}>
            {groupBuy.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {groupBuy.group_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Discount</Text>
          <Text className="font-medium text-green-600">
            {groupBuy.discount_percentage}% off
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Participants</Text>
          <Text className="font-medium">
            {groupBuy.current_participants} / {groupBuy.max_participants}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Min Required</Text>
          <Text className="font-medium">{groupBuy.min_participants}</Text>
        </div>
        <div className="col-span-2">
          <div className="flex justify-between mb-1">
            <Text className="text-ui-fg-subtle">Fill Rate</Text>
            <Text className="font-medium">{fillRate}%</Text>
          </div>
          <div className="h-2 bg-ui-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${fillRate}%` }}
            />
          </div>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Deadline</Text>
          <Text className="font-medium">
            {groupBuy.deadline?.split("T")[0]}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default SocialCommerceWidget;
