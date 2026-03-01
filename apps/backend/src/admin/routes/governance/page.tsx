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
import { ShieldCheck, Plus, PencilSquare, Trash } from "@medusajs/icons";
import { useState } from "react";
import {
  useGovernanceAuthorities,
  useCreateGovernanceAuthority,
  useUpdateGovernanceAuthority,
  useDeleteGovernanceAuthority,
  GovernanceAuthority,
} from "../../hooks/use-governance.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";

const TYPES = ["region", "country", "authority"] as const;

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "region":
      return "purple";
    case "country":
      return "blue";
    case "authority":
      return "green";
    default:
      return "grey";
  }
};

const GovernancePage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingAuthority, setEditingAuthority] =
    useState<GovernanceAuthority | null>(null);
  const [deletingAuthority, setDeletingAuthority] =
    useState<GovernanceAuthority | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "region" as GovernanceAuthority["type"],
    jurisdiction_level: 0,
    status: "active" as GovernanceAuthority["status"],
  });

  const { data: authoritiesData, isLoading } = useGovernanceAuthorities();
  const createAuthority = useCreateGovernanceAuthority();
  const updateAuthority = useUpdateGovernanceAuthority();
  const deleteAuthority = useDeleteGovernanceAuthority();

  const authorities = authoritiesData?.items || [];

  const stats = [
    {
      label: "Total Authorities",
      value: authorities.length,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      label: "Active",
      value: authorities.filter((a) => a.status === "active").length,
      color: "green" as const,
    },
    {
      label: "Regions",
      value: authorities.filter((a) => a.type === "region").length,
      color: "purple" as const,
    },
    {
      label: "Countries",
      value: authorities.filter((a) => a.type === "country").length,
      color: "blue" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createAuthority.mutateAsync(formData);
      toast.success("Authority created successfully");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create authority");
    }
  };

  const handleUpdate = async () => {
    if (!editingAuthority) return;
    try {
      await updateAuthority.mutateAsync({
        id: editingAuthority.id,
        ...formData,
      });
      toast.success("Authority updated successfully");
      setEditingAuthority(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update authority");
    }
  };

  const handleDelete = async () => {
    if (!deletingAuthority) return;
    try {
      await deleteAuthority.mutateAsync(deletingAuthority.id);
      toast.success("Authority deleted");
      setDeletingAuthority(null);
    } catch (error) {
      toast.error("Failed to delete authority");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      type: "region",
      jurisdiction_level: 0,
      status: "active",
    });
  };

  const openEditDrawer = (authority: GovernanceAuthority) => {
    setFormData({
      name: authority.name,
      slug: authority.slug,
      type: authority.type,
      jurisdiction_level: authority.jurisdiction_level,
      status: authority.status,
    });
    setEditingAuthority(authority);
  };

  const columns = [
    {
      key: "name",
      header: "Authority Name",
      sortable: true,
      cell: (a: GovernanceAuthority) => (
        <div>
          <Text className="font-medium">{a.name}</Text>
          <Text className="text-ui-fg-muted text-sm font-mono">{a.slug}</Text>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (a: GovernanceAuthority) => (
        <Badge color={getTypeBadgeColor(a.type)}>{a.type}</Badge>
      ),
    },
    {
      key: "jurisdiction_level",
      header: "Level",
      cell: (a: GovernanceAuthority) => <Text>{a.jurisdiction_level}</Text>,
    },
    {
      key: "status",
      header: "Status",
      cell: (a: GovernanceAuthority) => <StatusBadge status={a.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (a: GovernanceAuthority) =>
        new Date(a.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      cell: (a: GovernanceAuthority) => (
        <div className="flex gap-1">
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(a)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setDeletingAuthority(a)}
          >
            <Trash className="w-4 h-4 text-ui-tag-red-icon" />
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
            <Heading level="h1">Governance Authorities</Heading>
            <Text className="text-ui-fg-muted">
              Manage regions, countries, and governing boards
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Authority
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={authorities}
          columns={columns}
          searchable
          searchPlaceholder="Search authorities..."
          searchKeys={["name", "slug", "type"]}
          loading={isLoading}
          emptyMessage="No authorities found"
        />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingAuthority}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingAuthority(null);
            resetForm();
          }
        }}
        title={editingAuthority ? "Edit Authority" : "Create Authority"}
        onSubmit={editingAuthority ? handleUpdate : handleCreate}
        submitLabel={editingAuthority ? "Update" : "Create"}
        loading={createAuthority.isPending || updateAuthority.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Authority Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="e.g. Dubai Health Authority"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug Identifier</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/ /g, "_"),
                })
              }
              placeholder="e.g. dhe"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as GovernanceAuthority["type"],
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              {TYPES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="jurisdiction_level">Jurisdiction Level</Label>
            <Input
              id="jurisdiction_level"
              type="number"
              value={String(formData.jurisdiction_level)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jurisdiction_level: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!deletingAuthority}
        onOpenChange={() => setDeletingAuthority(null)}
        title="Delete Authority"
        description={`Delete "${deletingAuthority?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteAuthority.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Governance",
  icon: ShieldCheck,
});
export default GovernancePage;
