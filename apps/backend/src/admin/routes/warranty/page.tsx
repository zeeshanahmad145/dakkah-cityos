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
  useWarrantyTemplates,
  useCreateWarrantyTemplate,
  useUpdateWarrantyTemplate,
  useDeleteWarrantyTemplate,
  WarrantyTemplate,
} from "../../hooks/use-warranty.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const WarrantyPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WarrantyTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<WarrantyTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_months: 12,
    plan_type: "standard" as "standard" | "extended" | "premium" | "accidental",
    price: 0,
    currency_code: "usd",
    coverage_terms: "",
    is_active: true,
  });

  const { data: templatesData, isLoading } = useWarrantyTemplates();
  const createTemplate = useCreateWarrantyTemplate();
  const updateTemplate = useUpdateWarrantyTemplate();
  const deleteTemplate = useDeleteWarrantyTemplate();

  const templates = templatesData?.templates || [];

  const stats = [
    {
      label: "Total Templates",
      value: templates.length,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      label: "Active",
      value: templates.filter((t) => t.is_active).length,
      color: "green" as const,
    },
    {
      label: "Standard",
      value: templates.filter((t) => t.plan_type === "standard").length,
      color: "blue" as const,
    },
    {
      label: "Extended",
      value: templates.filter((t) => t.plan_type === "extended").length,
      color: "purple" as const,
    },
  ];

  const getCoverageBadgeColor = (type: string) => {
    switch (type) {
      case "standard":
        return "green";
      case "premium":
        return "orange";
      case "extended":
        return "purple";
      case "accidental":
        return "red";
      default:
        return "grey";
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        duration_months: formData.duration_months,
        plan_type: formData.plan_type,
        price: formData.price,
        currency_code: formData.currency_code,
        coverage: { terms: formData.coverage_terms },
        is_active: formData.is_active,
      });
      toast.success("Warranty template created");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create warranty template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        name: formData.name,
        description: formData.description || undefined,
        duration_months: formData.duration_months,
        plan_type: formData.plan_type,
        price: formData.price,
        currency_code: formData.currency_code,
        coverage: { terms: formData.coverage_terms },
        is_active: formData.is_active,
      });
      toast.success("Warranty template updated");
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update warranty template");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteTemplate.mutateAsync(deletingTemplate.id);
      toast.success("Warranty template deleted");
      setDeletingTemplate(null);
    } catch (error) {
      toast.error("Failed to delete warranty template");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_months: 12,
      plan_type: "standard",
      price: 0,
      currency_code: "usd",
      coverage_terms: "",
      is_active: true,
    });
  };

  const openEditDrawer = (template: WarrantyTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      duration_months: template.duration_months,
      plan_type: template.plan_type,
      price: template.price || 0,
      currency_code: template.currency_code || "usd",
      coverage_terms: (template.coverage?.terms as string) || "",
      is_active: template.is_active,
    });
    setEditingTemplate(template);
  };

  const columns = [
    {
      key: "name",
      header: "Template Name",
      sortable: true,
      cell: (t: WarrantyTemplate) => (
        <div>
          <Text className="font-medium">{t.name}</Text>
          {t.description && (
            <Text className="text-ui-fg-muted text-sm">{t.description}</Text>
          )}
        </div>
      ),
    },
    {
      key: "plan_type",
      header: "Coverage",
      cell: (t: WarrantyTemplate) => (
        <Badge color={getCoverageBadgeColor(t.plan_type)}>
          {t.plan_type.charAt(0).toUpperCase() + t.plan_type.slice(1)}
        </Badge>
      ),
    },
    {
      key: "duration_months",
      header: "Duration",
      sortable: true,
      cell: (t: WarrantyTemplate) => `${t.duration_months} months`,
    },
    {
      key: "price",
      header: "Price",
      cell: (t: WarrantyTemplate) => (
        <Text>{t.price ? `$${t.price}` : "Free"}</Text>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (t: WarrantyTemplate) => (
        <StatusBadge status={t.is_active ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      cell: (t: WarrantyTemplate) => (
        <div className="flex gap-1">
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(t)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setDeletingTemplate(t)}
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
            <Heading level="h1">Warranty Templates</Heading>
            <Text className="text-ui-fg-muted">
              Manage global warranty templates and coverage policies
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={templates}
          columns={columns}
          searchable
          searchPlaceholder="Search templates..."
          searchKeys={["name"]}
          loading={isLoading}
          emptyMessage="No warranty templates found"
        />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingTemplate(null);
            resetForm();
          }
        }}
        title={
          editingTemplate
            ? "Edit Warranty Template"
            : "Create Warranty Template"
        }
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        submitLabel={editingTemplate ? "Update" : "Create"}
        loading={createTemplate.isPending || updateTemplate.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="Standard Warranty"
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
              placeholder="Coverage description"
            />
          </div>
          <div>
            <Label htmlFor="plan_type">Plan Type</Label>
            <select
              id="plan_type"
              value={formData.plan_type}
              onChange={(e) =>
                setFormData({ ...formData, plan_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="standard">Standard</option>
              <option value="extended">Extended</option>
              <option value="premium">Premium</option>
              <option value="accidental">Accidental</option>
            </select>
          </div>
          <div>
            <Label htmlFor="duration_months">Duration (Months)</Label>
            <Input
              id="duration_months"
              type="number"
              value={formData.duration_months}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_months: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
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
            />
          </div>
          <div>
            <Label htmlFor="coverage_terms">Coverage Terms</Label>
            <textarea
              id="coverage_terms"
              value={formData.coverage_terms}
              onChange={(e) =>
                setFormData({ ...formData, coverage_terms: e.target.value as any })
              }
              placeholder="Warranty terms and conditions..."
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base min-h-[100px] resize-y"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
        title="Delete Template"
        description={`Delete warranty template "${deletingTemplate?.name}"?`}
        onConfirm={handleDeleteTemplate}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTemplate.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Warranty",
  icon: ShieldCheck,
});
export default WarrantyPage;
