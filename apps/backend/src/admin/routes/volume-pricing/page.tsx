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
import { CurrencyDollar, Plus, PencilSquare, Trash } from "@medusajs/icons";
import { useState } from "react";
import {
  useVolumePricingRules,
  useCreateVolumePricing,
  useUpdateVolumePricing,
  useDeleteVolumePricing,
  VolumePricingRule,
} from "../../hooks/use-volume-pricing.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const VolumePricingPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingRule, setEditingRule] = useState<VolumePricingRule | null>(
    null,
  );
  const [deletingRule, setDeletingRule] = useState<VolumePricingRule | null>(
    null,
  );

  const [formData, setFormData] = useState({
    name: "",
    applies_to: "product" as
      | "product"
      | "variant"
      | "collection"
      | "category"
      | "all",
    target_id: "",
    pricing_type: "percentage" as "percentage" | "fixed" | "fixed_price",
    min_quantity: 1,
    max_quantity: 100,
    discount_percentage: 10,
    status: "active" as "active" | "inactive" | "scheduled",
  });

  const { data: rulesData, isLoading } = useVolumePricingRules();
  const createRule = useCreateVolumePricing();
  const updateRule = useUpdateVolumePricing();
  const deleteRule = useDeleteVolumePricing();

  const rules = rulesData?.rules || [];

  const allTiers = rules.reduce((sum, r) => sum + (r.tiers?.length || 0), 0);
  const activeTiers = rules
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + (r.tiers?.length || 0), 0);
  const productsWithPricing = new Set(
    rules.filter((r) => r.target_id).map((r) => r.target_id),
  ).size;

  const stats = [
    {
      label: "Total Rules",
      value: rules.length,
      icon: <CurrencyDollar className="w-5 h-5" />,
    },
    { label: "Total Tiers", value: allTiers },
    { label: "Active Tiers", value: activeTiers, color: "green" as const },
    {
      label: "Products with Pricing",
      value: productsWithPricing,
      color: "blue" as const,
    },
  ];

  const handleCreateRule = async () => {
    try {
      await createRule.mutateAsync({
        name: formData.name,
        applies_to: formData.applies_to,
        target_id: formData.target_id || undefined,
        pricing_type: formData.pricing_type,
        status: formData.status,
        tiers: [
          {
            min_quantity: formData.min_quantity,
            max_quantity: formData.max_quantity,
            discount_percentage:
              formData.pricing_type === "percentage"
                ? formData.discount_percentage
                : undefined,
          },
        ],
      });
      toast.success("Volume pricing rule created");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create volume pricing rule");
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await updateRule.mutateAsync({
        id: editingRule.id,
        name: formData.name,
        applies_to: formData.applies_to,
        target_id: formData.target_id || undefined,
        pricing_type: formData.pricing_type,
        status: formData.status,
        tiers: [
          {
            min_quantity: formData.min_quantity,
            max_quantity: formData.max_quantity,
            discount_percentage:
              formData.pricing_type === "percentage"
                ? formData.discount_percentage
                : undefined,
          },
        ],
      });
      toast.success("Volume pricing rule updated");
      setEditingRule(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update volume pricing rule");
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule.mutateAsync(deletingRule.id);
      toast.success("Volume pricing rule deleted");
      setDeletingRule(null);
    } catch (error) {
      toast.error("Failed to delete volume pricing rule");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      applies_to: "product",
      target_id: "",
      pricing_type: "percentage",
      min_quantity: 1,
      max_quantity: 100,
      discount_percentage: 10,
      status: "active",
    });
  };

  const openEditDrawer = (rule: VolumePricingRule) => {
    const firstTier = rule.tiers?.[0];
    setFormData({
      name: rule.name,
      applies_to: rule.applies_to,
      target_id: rule.target_id || "",
      pricing_type: rule.pricing_type,
      min_quantity: firstTier?.min_quantity || 1,
      max_quantity: firstTier?.max_quantity || 100,
      discount_percentage: firstTier?.discount_percentage || 10,
      status: rule.status,
    });
    setEditingRule(rule);
  };

  const columns = [
    {
      key: "name",
      header: "Rule Name",
      sortable: true,
      cell: (r: VolumePricingRule) => (
        <div>
          <Text className="font-medium">{r.name}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {r.target?.title || r.target?.name || r.applies_to}
          </Text>
        </div>
      ),
    },
    {
      key: "tiers",
      header: "Tiers",
      cell: (r: VolumePricingRule) => (
        <Badge color="grey">
          {r.tiers?.length || 0} tier{(r.tiers?.length || 0) !== 1 ? "s" : ""}
        </Badge>
      ),
    },
    {
      key: "min_quantity",
      header: "Min Qty",
      cell: (r: VolumePricingRule) => r.tiers?.[0]?.min_quantity ?? "-",
    },
    {
      key: "max_quantity",
      header: "Max Qty",
      cell: (r: VolumePricingRule) => r.tiers?.[0]?.max_quantity ?? "∞",
    },
    {
      key: "discount",
      header: "Discount",
      cell: (r: VolumePricingRule) => {
        const tier = r.tiers?.[0];
        if (tier?.discount_percentage) return `${tier.discount_percentage}%`;
        if (tier?.discount_amount) return `$${tier.discount_amount}`;
        if (tier?.fixed_price) return `$${tier.fixed_price} fixed`;
        return "-";
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (r: VolumePricingRule) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      cell: (r: VolumePricingRule) => (
        <div className="flex gap-1">
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(r)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setDeletingRule(r)}
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
            <Heading level="h1">Volume Pricing</Heading>
            <Text className="text-ui-fg-muted">
              Manage volume-based pricing rules and discount tiers
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={rules}
          columns={columns}
          searchable
          searchPlaceholder="Search rules..."
          searchKeys={["name"]}
          loading={isLoading}
          emptyMessage="No volume pricing rules found"
        />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingRule}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingRule(null);
            resetForm();
          }
        }}
        title={
          editingRule
            ? "Edit Volume Pricing Rule"
            : "Create Volume Pricing Rule"
        }
        onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
        submitLabel={editingRule ? "Update" : "Create"}
        loading={createRule.isPending || updateRule.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="Bulk Discount"
            />
          </div>
          <div>
            <Label htmlFor="applies_to">Applies To</Label>
            <select
              id="applies_to"
              value={formData.applies_to}
              onChange={(e) =>
                setFormData({ ...formData, applies_to: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="product">Product</option>
              <option value="variant">Variant</option>
              <option value="collection">Collection</option>
              <option value="category">Category</option>
              <option value="all">All Products</option>
            </select>
          </div>
          {formData.applies_to !== "all" && (
            <div>
              <Label htmlFor="target_id">Target ID</Label>
              <Input
                id="target_id"
                value={formData.target_id}
                onChange={(e) =>
                  setFormData({ ...formData, target_id: e.target.value as any })
                }
                placeholder="prod_..."
              />
            </div>
          )}
          <div>
            <Label htmlFor="pricing_type">Discount Type</Label>
            <select
              id="pricing_type"
              value={formData.pricing_type}
              onChange={(e) =>
                setFormData({ ...formData, pricing_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="fixed_price">Fixed Price</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_quantity">Min Quantity</Label>
              <Input
                id="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_quantity: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="max_quantity">Max Quantity</Label>
              <Input
                id="max_quantity"
                type="number"
                value={formData.max_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_quantity: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          {formData.pricing_type === "percentage" && (
            <div>
              <Label htmlFor="discount_percentage">
                Discount Percentage (%)
              </Label>
              <Input
                id="discount_percentage"
                type="number"
                value={formData.discount_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_percentage: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!deletingRule}
        onOpenChange={() => setDeletingRule(null)}
        title="Delete Rule"
        description={`Delete volume pricing rule "${deletingRule?.name}"?`}
        onConfirm={handleDeleteRule}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteRule.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Volume Pricing",
  icon: CurrencyDollar,
});
export default VolumePricingPage;
