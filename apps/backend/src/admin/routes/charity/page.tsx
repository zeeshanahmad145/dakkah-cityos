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
import { Heart, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import { useCharities, useCreateCharity } from "../../hooks/use-charity.js";
import type { Charity } from "../../hooks/use-charity.js";

const CharityPage = () => {
  const { data, isLoading } = useCharities();
  const createCharity = useCreateCharity();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const charities = data?.items || [];
  const activeCount = charities.filter(
    (c: any) => c.is_active !== false,
  ).length;
  const verifiedCount = charities.filter((c: any) => c.is_verified).length;
  const totalRaised = charities.reduce(
    (s: number, c: any) => s + (c.total_raised || 0),
    0,
  );

  const stats = [
    {
      label: "Total Charities",
      value: charities.length,
      icon: <Heart className="w-5 h-5" />,
    },
    { label: "Verified", value: verifiedCount, color: "blue" as const },
    {
      label: "Total Raised",
      value: `$${totalRaised.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
    { label: "Active", value: activeCount, color: "green" as const },
  ];

  const columns = [
    {
      key: "name",
      header: "Charity",
      sortable: true,
      cell: (c: Charity) => (
        <div>
          <Text className="font-medium">{c.name}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {c.registration_number || "—"}
          </Text>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (c: Charity) => <Badge color="grey">{c.category}</Badge>,
    },
    {
      key: "total_raised",
      header: "Total Raised",
      sortable: true,
      cell: (c: Charity) => (
        <Text className="font-medium">
          ${(c.total_raised || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: "is_verified",
      header: "Verified",
      cell: (c: Charity) => (
        <StatusBadge status={c.is_verified ? "verified" : "unverified"} />
      ),
    },
    {
      key: "email",
      header: "Contact",
      cell: (c: Charity) => <Text className="text-sm">{c.email || "—"}</Text>,
    },
    {
      key: "is_active",
      header: "Status",
      cell: (c: Charity) => (
        <StatusBadge status={c.is_active !== false ? "active" : "inactive"} />
      ),
    },
  ];

  const handleCreate = () => {
    createCharity.mutate(
      {
        tenant_id: formData.tenant_id,
        name: formData.name,
        description: formData.description,
        category: (formData.category || "other") as any,
        email: formData.email,
        website: formData.website,
      },
      {
        onSuccess: () => {
          toast.success("Charity created");
          setShowCreate(false);
          setFormData({});
        },
        onError: () => toast.error("Failed to create charity"),
      },
    );
  };

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Charity / Donations</Heading>
            <Text className="text-ui-fg-muted">
              Manage charities, donations, and campaigns
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Charity
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={charities}
          columns={columns}
          searchable
          searchPlaceholder="Search charities..."
          searchKeys={["name", "category", "email"]}
          loading={isLoading}
          emptyMessage="No charities found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Charity"
        description="Add a new charity organization"
        onSubmit={handleCreate}
        loading={createCharity.isPending}
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
            <Label>Name</Label>
            <Input
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
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
            <Label>Category</Label>
            <Input
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              placeholder="education, health, environment, poverty, disaster, animal, arts, community, other"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={formData.website || ""}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Charity", icon: Heart });
export default CharityPage;
