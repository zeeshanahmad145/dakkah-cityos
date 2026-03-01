import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { RocketLaunch, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useAdvertising,
  useCreateAdCampaign,
  AdCampaign,
} from "../../hooks/use-advertising.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const AdvertisingPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    advertiser_id: "",
    campaign_type: "banner" as const,
    budget: "",
    currency_code: "usd",
    tenant_id: "",
  });

  const { data, isLoading } = useAdvertising();
  const createCampaign = useCreateAdCampaign();

  const campaigns = data?.items || [];
  const activeAds = campaigns.filter((c: any) => c.status === "active").length;

  const stats = [
    {
      label: "Total Campaigns",
      value: campaigns.length,
      icon: <RocketLaunch className="w-5 h-5" />,
    },
    { label: "Active Ads", value: activeAds, color: "green" as const },
    {
      label: "Completed",
      value: campaigns.filter((c: any) => c.status === "completed").length,
      color: "blue" as const,
    },
    {
      label: "Draft",
      value: campaigns.filter((c: any) => c.status === "draft").length,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createCampaign.mutateAsync({
        ...formData,
        budget: Number(formData.budget),
      });
      toast.success("Campaign created");
      setShowCreate(false);
      setFormData({
        name: "",
        advertiser_id: "",
        campaign_type: "banner",
        budget: "",
        currency_code: "usd",
        tenant_id: "",
      });
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Campaign",
      sortable: true,
      cell: (c: AdCampaign) => (
        <div>
          <Text className="font-medium">{c.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{c.advertiser_id}</Text>
        </div>
      ),
    },
    {
      key: "campaign_type",
      header: "Type",
      cell: (c: AdCampaign) => <Badge color="grey">{c.campaign_type}</Badge>,
    },
    {
      key: "budget",
      header: "Budget",
      sortable: true,
      cell: (c: AdCampaign) => (
        <div>
          <Text className="font-medium">
            ${(c.budget || 0).toLocaleString()}
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            Spent: ${(c.spent || 0).toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      key: "currency_code",
      header: "Currency",
      cell: (c: AdCampaign) => (c.currency_code || "").toUpperCase(),
    },
    {
      key: "status",
      header: "Status",
      cell: (c: AdCampaign) => <StatusBadge status={c.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Advertising</Heading>
            <Text className="text-ui-fg-muted">
              Manage ad campaigns, impressions, and performance
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
          searchKeys={["name", "campaign_type"]}
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="Campaign name"
            />
          </div>
          <div>
            <Label htmlFor="advertiser_id">Advertiser ID</Label>
            <Input
              id="advertiser_id"
              value={formData.advertiser_id}
              onChange={(e) =>
                setFormData({ ...formData, advertiser_id: e.target.value as any })
              }
              placeholder="Advertiser ID"
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
            <Label htmlFor="campaign_type">Campaign Type</Label>
            <select
              id="campaign_type"
              value={formData.campaign_type}
              onChange={(e) =>
                setFormData({ ...formData, campaign_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="sponsored_listing">Sponsored Listing</option>
              <option value="banner">Banner</option>
              <option value="search">Search</option>
              <option value="social">Social</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) =>
                setFormData({ ...formData, budget: e.target.value as any })
              }
              placeholder="Budget amount"
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
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Advertising",
  icon: RocketLaunch,
});
export default AdvertisingPage;
