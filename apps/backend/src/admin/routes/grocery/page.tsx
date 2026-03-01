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
import { ShoppingCart, InboxSolid, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useGroceryProducts,
  useCreateGroceryProduct,
} from "../../hooks/use-grocery.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const GroceryPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    storage_type: "ambient" as const,
    shelf_life_days: 7,
    unit_type: "piece" as const,
    origin_country: "",
    organic: false,
  });

  const { data, isLoading } = useGroceryProducts();
  const createProduct = useCreateGroceryProduct();

  const items = data?.items || [];
  const frozenCount = items.filter(
    (i: any) => i.storage_type === "frozen",
  ).length;
  const chilledCount = items.filter(
    (i: any) => i.storage_type === "chilled",
  ).length;

  const stats = [
    {
      label: "Total Products",
      value: items.length,
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    { label: "Chilled", value: chilledCount, color: "blue" as const },
    {
      label: "Frozen",
      value: frozenCount,
      icon: <InboxSolid className="w-5 h-5" />,
      color: "purple" as const,
    },
    {
      label: "Organic",
      value: items.filter((i: any) => i.organic).length,
      color: "green" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createProduct.mutateAsync({
        product_id: formData.product_id,
        storage_type: formData.storage_type,
        shelf_life_days: formData.shelf_life_days,
        unit_type: formData.unit_type,
        origin_country: formData.origin_country,
        organic: formData.organic,
        tenant_id: "default",
      });
      toast.success("Grocery product created");
      setShowCreate(false);
      setFormData({
        product_id: "",
        storage_type: "ambient",
        shelf_life_days: 7,
        unit_type: "piece",
        origin_country: "",
        organic: false,
      });
    } catch (error) {
      toast.error("Failed to create grocery product");
    }
  };

  const getStorageColor = (type: string) => {
    switch (type) {
      case "chilled":
        return "blue";
      case "frozen":
        return "purple";
      case "live":
        return "green";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "product_id",
      header: "Product",
      sortable: true,
      cell: (i: any) => (
        <div>
          <Text className="font-medium">{i.product_id}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {i.origin_country || "—"}
          </Text>
        </div>
      ),
    },
    {
      key: "storage_type",
      header: "Storage",
      cell: (i: any) => (
        <Badge color={getStorageColor(i.storage_type)}>{i.storage_type}</Badge>
      ),
    },
    {
      key: "unit_type",
      header: "Unit",
      cell: (i: any) => <Badge color="grey">{i.unit_type}</Badge>,
    },
    {
      key: "shelf_life_days",
      header: "Shelf Life",
      sortable: true,
      cell: (i: any) => (
        <Text className="font-medium">{i.shelf_life_days} days</Text>
      ),
    },
    {
      key: "organic",
      header: "Organic",
      cell: (i: any) =>
        i.organic ? (
          <Badge color="green">Yes</Badge>
        ) : (
          <Badge color="grey">No</Badge>
        ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Grocery Management</Heading>
            <Text className="text-ui-fg-muted">
              Manage grocery products, inventory, and delivery zones
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
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
          searchPlaceholder="Search products..."
          searchKeys={["product_id", "origin_country"]}
          loading={isLoading}
          emptyMessage="No products found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Grocery Product"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createProduct.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="product_id">Product ID</Label>
            <Input
              id="product_id"
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value as any })
              }
              placeholder="Product ID"
            />
          </div>
          <div>
            <Label htmlFor="storage_type">Storage Type</Label>
            <select
              id="storage_type"
              value={formData.storage_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  storage_type: e.target.value as any,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="ambient">Ambient</option>
              <option value="chilled">Chilled</option>
              <option value="frozen">Frozen</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div>
            <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
            <Input
              id="shelf_life_days"
              type="number"
              value={formData.shelf_life_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shelf_life_days: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="unit_type">Unit Type</Label>
            <select
              id="unit_type"
              value={formData.unit_type}
              onChange={(e) =>
                setFormData({ ...formData, unit_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="piece">Piece</option>
              <option value="kg">Kg</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="bunch">Bunch</option>
              <option value="pack">Pack</option>
            </select>
          </div>
          <div>
            <Label htmlFor="origin_country">Origin Country</Label>
            <Input
              id="origin_country"
              value={formData.origin_country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  origin_country: e.target.value as any,
                })
              }
              placeholder="Country of origin"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Grocery",
  icon: ShoppingCart,
});
export default GroceryPage;
