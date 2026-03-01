import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type CampaignData = {
  id: string;
  campaign_type: string;
  status: string;
  goal_amount: number;
  raised_amount: number;
  backer_count: number;
  starts_at: string;
  ends_at: string;
  is_flexible_funding: boolean;
  category: string;
};

const CrowdfundingWidget = ({ data }: { data: { id: string } }) => {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=crowdfund_campaign.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.crowdfund_campaign)
          setCampaign(d.product.crowdfund_campaign);
      })
      .catch(() => null);
  }, [data.id]);

  if (!campaign) return null;

  const progress =
    campaign.goal_amount > 0
      ? Math.min(
          100,
          Math.round((campaign.raised_amount / campaign.goal_amount) * 100),
        )
      : 0;

  const statusColor = (s: string) =>
    s === "active"
      ? "green"
      : s === "funded"
        ? "blue"
        : s === "failed"
          ? "red"
          : "grey";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Crowdfunding Campaign</Heading>
        <Badge color={statusColor(campaign.status) as any}>
          {campaign.status}
        </Badge>
      </div>
      <div className="px-6 py-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {campaign.campaign_type}
          </Text>
        </div>
        <div className="flex justify-between">
          <Text className="text-ui-fg-subtle">Goal</Text>
          <Text className="font-medium">
            {campaign.goal_amount?.toLocaleString()}
          </Text>
        </div>
        <div className="flex justify-between">
          <Text className="text-ui-fg-subtle">Raised</Text>
          <Text className="font-medium text-green-600">
            {campaign.raised_amount?.toLocaleString()}
          </Text>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <Text className="text-ui-fg-subtle">Progress</Text>
            <Text className="font-medium">{progress}%</Text>
          </div>
          <div className="h-2 bg-ui-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Text className="text-ui-fg-subtle">Backers</Text>
          <Text className="font-medium">{campaign.backer_count || 0}</Text>
        </div>
        <div className="flex justify-between">
          <Text className="text-ui-fg-subtle">Ends</Text>
          <Text className="font-medium">{campaign.ends_at?.split("T")[0]}</Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default CrowdfundingWidget;
