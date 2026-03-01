import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { Sparkles, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useCrowdfunding,
  useCreateCrowdfundCampaign,
  CrowdfundCampaign,
} from "../../hooks/use-crowdfunding.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const CrowdfundingPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    campaign_type: "reward" as const,
    goal_amount: "",
    currency_code: "usd",
    ends_at: "",
    tenant_id: "",
    creator_id: "",
  });

  const { data, isLoading } = useCrowdfunding();
  const createCampaign = useCreateCrowdfundCampaign();

  const campaigns = data?.items || [];
  const activeCampaigns = campaigns.filter(
    (c: any) => c.status === "active",
  ).length;
  const fundedCampaigns = campaigns.filter(
    (c: any) => c.status === "funded",
  ).length;
  const totalRaised = campaigns.reduce(
    (s: number, c: any) => s + (c.current_amount || 0),
    0,
  );

  const stats = [
    {
      label: "Total Campaigns",
      value: campaigns.length,
      icon: <Sparkles className="w-5 h-5" />,
    },
    { label: "Active", value: activeCampaigns, color: "blue" as const },
    { label: "Funded", value: fundedCampaigns, color: "green" as const },
    {
      label: "Total Raised",
      value: `$${totalRaised.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createCampaign.mutateAsync({
        ...formData,
        goal_amount: Number(formData.goal_amount),
      });
      toast.success("Campaign created");
      setShowCreate(false);
      setFormData({
        title: "",
        description: "",
        campaign_type: "reward",
        goal_amount: "",
        currency_code: "usd",
        ends_at: "",
        tenant_id: "",
        creator_id: "",
      });
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Campaign",
      sortable: true,
      cell: (c: CrowdfundCampaign) => (
        <div>
          <Text className="font-medium">{c.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {c.creator_id} · {c.category || c.campaign_type}
          </Text>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      sortable: true,
      cell: (c: CrowdfundCampaign) => (
        <div>
          <Text className="font-medium text-sm">
            ${(c.current_amount || 0).toLocaleString()} / $
            {(c.goal_amount || 0).toLocaleString()}
          </Text>
          <div className="w-24 h-1.5 bg-ui-bg-subtle rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-ui-tag-green-icon rounded-full"
              style={{
                width: `${Math.min(100, Math.round(((c.current_amount || 0) / (c.goal_amount || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "backers_count",
      header: "Backers",
      sortable: true,
      cell: (c: CrowdfundCampaign) => (c.backers_count || 0).toLocaleString(),
    },
    {
      key: "ends_at",
      header: "Ends At",
      sortable: true,
      cell: (c: CrowdfundCampaign) => c.ends_at?.split("T")[0] || "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (c: CrowdfundCampaign) => <StatusBadge status={c.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Crowdfunding</Heading>
            <Text className="text-ui-fg-muted">
              Manage crowdfunding campaigns, backers, and pledges
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={campaigns}
          columns={columns}
          searchable
          searchPlaceholder="Search campaigns..."
          searchKeys={["title", "campaign_type"]}
          loading={isLoading}
          emptyMessage="No campaigns found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Campaign"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createCampaign.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value as any })
              }
              placeholder="Campaign title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value as any })
              }
              placeholder="Campaign description"
            />
          </div>
          <div>
            <Label htmlFor="tenant_id">Tenant ID</Label>
            <Input
              id="tenant_id"
              value={formData.tenant_id}
              onChange={(e) =>
                setFormData({ ...formData, tenant_id: e.target.value as any })
              }
              placeholder="Tenant ID"
            />
          </div>
          <div>
            <Label htmlFor="creator_id">Creator ID</Label>
            <Input
              id="creator_id"
              value={formData.creator_id}
              onChange={(e) =>
                setFormData({ ...formData, creator_id: e.target.value as any })
              }
              placeholder="Creator ID"
            />
          </div>
          <div>
            <Label htmlFor="campaign_type">Campaign Type</Label>
            <select
              id="campaign_type"
              value={formData.campaign_type}
              onChange={(e) =>
                setFormData({ ...formData, campaign_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="reward">Reward</option>
              <option value="equity">Equity</option>
              <option value="donation">Donation</option>
              <option value="debt">Debt</option>
            </select>
          </div>
          <div>
            <Label htmlFor="goal_amount">Goal Amount</Label>
            <Input
              id="goal_amount"
              type="number"
              value={formData.goal_amount}
              onChange={(e) =>
                setFormData({ ...formData, goal_amount: e.target.value as any })
              }
              placeholder="Goal amount"
            />
          </div>
          <div>
            <Label htmlFor="currency_code">Currency Code</Label>
            <Input
              id="currency_code"
              value={formData.currency_code}
              onChange={(e) =>
                setFormData({ ...formData, currency_code: e.target.value as any })
              }
              placeholder="usd"
            />
          </div>
          <div>
            <Label htmlFor="ends_at">Ends At</Label>
            <Input
              id="ends_at"
              type="date"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Crowdfunding",
  icon: Sparkles,
});
export default CrowdfundingPage;
