import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  toast,
  Label,
} from "@medusajs/ui";
import {
  ServerStack,
  Plus,
  PencilSquare,
  CheckCircle,
  XCircle,
  CurrencyDollar,
} from "@medusajs/icons";
import { useState } from "react";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useSuspendTenant,
  useActivateTenant,
  Tenant,
} from "../../hooks/use-tenants.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const TenantsPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [suspendingTenant, setSuspendingTenant] = useState<Tenant | null>(null);
  const [activatingTenant, setActivatingTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    handle: "",
    email: "",
    phone: "",
    domain: "",
    plan: "starter" as "free" | "starter" | "professional" | "enterprise",
  });

  const { data: tenantsData, isLoading } = useTenants();

  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();

  const tenants = tenantsData?.tenants || [];

  const planPrices: Record<string, number> = {
    free: 0,
    starter: 29,
    professional: 99,
    enterprise: 299,
  };
  const mrr = tenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + (planPrices[t.plan] || 0), 0);

  const stats = [
    {
      label: "Total Tenants",
      value: tenants.length,
      icon: <ServerStack className="w-5 h-5" />,
    },
    {
      label: "Active",
      value: tenants.filter((t) => t.status === "active").length,
      color: "green" as const,
    },
    {
      label: "MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
    {
      label: "Enterprise",
      value: tenants.filter((t) => t.plan === "enterprise").length,
      color: "purple" as const,
    },
  ];

  const handleCreateTenant = async () => {
    try {
      await createTenant.mutateAsync(formData);
      toast.success("Tenant created successfully");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create tenant");
    }
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;
    try {
      await updateTenant.mutateAsync({ id: editingTenant.id, ...formData });
      toast.success("Tenant updated successfully");
      setEditingTenant(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update tenant");
    }
  };

  const handleSuspendTenant = async () => {
    if (!suspendingTenant) return;
    try {
      await suspendTenant.mutateAsync({ id: suspendingTenant.id });
      toast.success("Tenant suspended");
      setSuspendingTenant(null);
    } catch (error) {
      toast.error("Failed to suspend tenant");
    }
  };

  const handleActivateTenant = async () => {
    if (!activatingTenant) return;
    try {
      await activateTenant.mutateAsync(activatingTenant.id);
      toast.success("Tenant activated");
      setActivatingTenant(null);
    } catch (error) {
      toast.error("Failed to activate tenant");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      handle: "",
      email: "",
      phone: "",
      domain: "",
      plan: "starter",
    });
  };

  const openEditDrawer = (tenant: Tenant) => {
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      handle: tenant.handle || "",
      email: tenant.email,
      phone: tenant.phone || "",
      domain: tenant.domain || "",
      plan: tenant.plan,
    });
    setEditingTenant(tenant);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "grey";
      case "starter":
        return "blue";
      case "professional":
        return "green";
      case "enterprise":
        return "purple";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "name",
      header: "Tenant",
      sortable: true,
      cell: (t: Tenant) => (
        <div>
          <Text className="font-medium">{t.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{t.slug}</Text>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      cell: (t: Tenant) => (
        <div>
          <Text>{t.email}</Text>
          {t.domain && (
            <Text className="text-ui-fg-muted text-sm">{t.domain}</Text>
          )}
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (t: Tenant) => (
        <Badge color={getPlanBadgeColor(t.plan)}>
          {t.plan.charAt(0).toUpperCase() + t.plan.slice(1)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t: Tenant) => <StatusBadge status={t.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (t: Tenant) => new Date(t.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      cell: (t: Tenant) => (
        <div className="flex gap-1">
          {t.status === "active" && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSuspendingTenant(t)}
            >
              <XCircle className="w-4 h-4 text-ui-tag-red-icon" />
            </Button>
          )}
          {t.status === "suspended" && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setActivatingTenant(t)}
            >
              <CheckCircle className="w-4 h-4 text-ui-tag-green-icon" />
            </Button>
          )}
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(t)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Multi-Tenant Platform</Heading>
            <Text className="text-ui-fg-muted">
              Manage tenants, plans, and billing
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={tenants}
          columns={columns}
          searchable
          searchPlaceholder="Search tenants..."
          searchKeys={["name", "email", "slug"]}
          loading={isLoading}
          emptyMessage="No tenants found"
        />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingTenant}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingTenant(null);
            resetForm();
          }
        }}
        title={editingTenant ? "Edit Tenant" : "Create Tenant"}
        onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant}
        submitLabel={editingTenant ? "Update" : "Create"}
        loading={createTenant.isPending || updateTenant.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value as any })
              }
              placeholder="acme-inc"
            />
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={formData.handle}
              onChange={(e) =>
                setFormData({ ...formData, handle: e.target.value as any })
              }
              placeholder="acm-inc-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value as any })
              }
              placeholder="admin@acme.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label htmlFor="domain">Custom Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value as any })
              }
              placeholder="store.acme.com"
            />
          </div>
          <div>
            <Label htmlFor="plan">Plan</Label>
            <select
              id="plan"
              value={formData.plan}
              onChange={(e) =>
                setFormData({ ...formData, plan: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="free">Free ($0/mo)</option>
              <option value="starter">Starter ($29/mo)</option>
              <option value="professional">Professional ($99/mo)</option>
              <option value="enterprise">Enterprise ($299/mo)</option>
            </select>
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!suspendingTenant}
        onOpenChange={() => setSuspendingTenant(null)}
        title="Suspend Tenant"
        description={`Suspend ${suspendingTenant?.name}?`}
        onConfirm={handleSuspendTenant}
        confirmLabel="Suspend"
        variant="danger"
        loading={suspendTenant.isPending}
      />
      <ConfirmModal
        open={!!activatingTenant}
        onOpenChange={() => setActivatingTenant(null)}
        title="Activate Tenant"
        description={`Activate ${activatingTenant?.name}?`}
        onConfirm={handleActivateTenant}
        confirmLabel="Activate"
        loading={activateTenant.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Tenants",
  icon: ServerStack,
});
export default TenantsPage;
