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
import { ChatBubble, Plus } from "@medusajs/icons";
import { useState } from "react";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import {
  useSocialCommerce,
  useCreateSocialCommerce,
} from "../../hooks/use-social-commerce.js";
import type { SocialCommerceItem } from "../../hooks/use-social-commerce.js";

const SocialCommercePage = () => {
  const { data, isLoading } = useSocialCommerce();
  const createItem = useCreateSocialCommerce();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const items = data?.items || [];
  const liveCount = items.filter((p: any) => p.status === "live").length;
  const scheduledCount = items.filter(
    (p: any) => p.status === "scheduled",
  ).length;

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "purple";
      case "tiktok":
        return "blue";
      case "youtube":
        return "red";
      case "facebook":
        return "blue";
      default:
        return "grey";
    }
  };

  const stats = [
    {
      label: "Total Streams",
      value: items.length,
      icon: <ChatBubble className="w-5 h-5" />,
    },
    { label: "Live Now", value: liveCount, color: "green" as const },
    { label: "Scheduled", value: scheduledCount, color: "blue" as const },
    { label: "Total Items", value: data?.count || 0, color: "purple" as const },
  ];

  const columns = [
    {
      key: "title",
      header: "Stream",
      sortable: true,
      cell: (p: SocialCommerceItem) => (
        <div className="max-w-xs">
          <Text className="font-medium truncate">{p.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {p.host_id} · {p.scheduled_at || "—"}
          </Text>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      cell: (p: SocialCommerceItem) => (
        <Badge color={getPlatformColor(p.platform || "")}>
          {p.platform || "internal"}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (p: SocialCommerceItem) => (
        <Text className="text-sm max-w-xs truncate">
          {p.description || "—"}
        </Text>
      ),
    },
    {
      key: "scheduled_at",
      header: "Scheduled",
      sortable: true,
      cell: (p: SocialCommerceItem) => (
        <Text className="text-sm">{p.scheduled_at || "—"}</Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p: SocialCommerceItem) => (
        <StatusBadge status={p.status || "scheduled"} />
      ),
    },
  ];

  const handleCreate = () => {
    createItem.mutate(
      {
        tenant_id: formData.tenant_id,
        host_id: formData.host_id,
        title: formData.title,
        description: formData.description,
        platform: (formData.platform || "internal") as any,
        scheduled_at: formData.scheduled_at,
      },
      {
        onSuccess: () => {
          toast.success("Stream created");
          setShowCreate(false);
          setFormData({});
        },
        onError: () => toast.error("Failed to create stream"),
      },
    );
  };

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Social Commerce</Heading>
            <Text className="text-ui-fg-muted">
              Manage social media streams, engagement, and conversions
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Stream
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={items}
          columns={columns}
          searchable
          searchPlaceholder="Search streams..."
          searchKeys={["title", "host_id", "platform"]}
          loading={isLoading}
          emptyMessage="No social commerce items found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Live Stream"
        description="Add a new social commerce stream"
        onSubmit={handleCreate}
        loading={createItem.isPending}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label>Tenant ID</Label>
            <Input
              value={formData.tenant_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, tenant_id: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Host ID</Label>
            <Input
              value={formData.host_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, host_id: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Platform</Label>
            <Input
              value={formData.platform || ""}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value as any })
              }
              placeholder="internal, instagram, tiktok, youtube, facebook"
            />
          </div>
          <div>
            <Label>Scheduled At</Label>
            <Input
              value={formData.scheduled_at || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scheduled_at: e.target.value as any,
                })
              }
              placeholder="2026-03-01T10:00:00Z"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Social Commerce",
  icon: ChatBubble,
});
export default SocialCommercePage;
