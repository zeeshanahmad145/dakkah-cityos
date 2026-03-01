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
import { Users, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useAffiliates,
  useCreateAffiliate,
  Affiliate,
} from "../../hooks/use-affiliates.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const AffiliatesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    affiliate_type: "standard" as const,
    commission_rate: "",
    tenant_id: "",
  });

  const { data, isLoading } = useAffiliates();
  const createAffiliate = useCreateAffiliate();

  const affiliates = data?.items || [];
  const activeAffiliates = affiliates.filter(
    (a: any) => a.status === "active",
  ).length;

  const stats = [
    {
      label: "Total Affiliates",
      value: affiliates.length,
      icon: <Users className="w-5 h-5" />,
    },
    { label: "Active", value: activeAffiliates, color: "green" as const },
    {
      label: "Pending",
      value: affiliates.filter((a: any) => a.status === "pending").length,
      color: "orange" as const,
    },
    {
      label: "Suspended",
      value: affiliates.filter((a: any) => a.status === "suspended").length,
      color: "red" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createAffiliate.mutateAsync({
        ...formData,
        commission_rate: Number(formData.commission_rate),
      });
      toast.success("Affiliate created");
      setShowCreate(false);
      setFormData({
        name: "",
        email: "",
        affiliate_type: "standard",
        commission_rate: "",
        tenant_id: "",
      });
    } catch (error) {
      toast.error("Failed to create affiliate");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ambassador":
        return "purple";
      case "influencer":
        return "orange";
      case "partner":
        return "blue";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "name",
      header: "Affiliate",
      sortable: true,
      cell: (a: Affiliate) => (
        <div>
          <Text className="font-medium">{a.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{a.email}</Text>
        </div>
      ),
    },
    {
      key: "affiliate_type",
      header: "Type",
      cell: (a: Affiliate) => (
        <Badge color={getTypeColor(a.affiliate_type)}>{a.affiliate_type}</Badge>
      ),
    },
    {
      key: "commission_rate",
      header: "Commission Rate",
      sortable: true,
      cell: (a: Affiliate) => (
        <Text className="font-medium">{a.commission_rate}%</Text>
      ),
    },
    {
      key: "commission_type",
      header: "Commission Type",
      cell: (a: Affiliate) => a.commission_type || "percentage",
    },
    {
      key: "status",
      header: "Status",
      cell: (a: Affiliate) => <StatusBadge status={a.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Affiliate Program</Heading>
            <Text className="text-ui-fg-muted">
              Manage affiliates, referrals, and commissions
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Affiliate
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={affiliates}
          columns={columns}
          searchable
          searchPlaceholder="Search affiliates..."
          searchKeys={["name", "email"]}
          loading={isLoading}
          emptyMessage="No affiliates found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Add Affiliate"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createAffiliate.isPending}
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
              placeholder="Affiliate name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value as any })
              }
              placeholder="Email address"
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
            <Label htmlFor="affiliate_type">Type</Label>
            <select
              id="affiliate_type"
              value={formData.affiliate_type}
              onChange={(e) =>
                setFormData({ ...formData, affiliate_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="standard">Standard</option>
              <option value="influencer">Influencer</option>
              <option value="partner">Partner</option>
              <option value="ambassador">Ambassador</option>
            </select>
          </div>
          <div>
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              value={formData.commission_rate}
              onChange={(e) =>
                setFormData({ ...formData, commission_rate: e.target.value as any })
              }
              placeholder="Commission rate"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Affiliates", icon: Users });
export default AffiliatesPage;
