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
import { FlyingBox, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useAutomotive,
  useCreateVehicleListing,
  VehicleListing,
} from "../../hooks/use-automotive.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const AutomotivePage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    make: "",
    model_name: "",
    year: "",
    price: "",
    currency_code: "usd",
    tenant_id: "",
    seller_id: "",
    listing_type: "sale" as const,
  });

  const { data, isLoading } = useAutomotive();
  const createVehicle = useCreateVehicleListing();

  const vehicles = data?.items || [];
  const forSale = vehicles.filter((v: any) => v.status === "active").length;
  const reserved = vehicles.filter((v: any) => v.status === "reserved").length;

  const stats = [
    {
      label: "Total Vehicles",
      value: vehicles.length,
      icon: <FlyingBox className="w-5 h-5" />,
    },
    { label: "Active", value: forSale, color: "green" as const },
    { label: "Reserved", value: reserved, color: "orange" as const },
    {
      label: "Sold",
      value: vehicles.filter((v: any) => v.status === "sold").length,
      color: "blue" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createVehicle.mutateAsync({
        ...formData,
        year: Number(formData.year),
        price: Number(formData.price),
      });
      toast.success("Vehicle listing created");
      setShowCreate(false);
      setFormData({
        title: "",
        make: "",
        model_name: "",
        year: "",
        price: "",
        currency_code: "usd",
        tenant_id: "",
        seller_id: "",
        listing_type: "sale",
      });
    } catch (error) {
      toast.error("Failed to create vehicle listing");
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "new":
        return "green";
      case "certified_pre_owned":
        return "blue";
      case "used":
        return "orange";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "vehicle",
      header: "Vehicle",
      sortable: true,
      cell: (v: VehicleListing) => (
        <div>
          <Text className="font-medium">
            {v.year} {v.make} {v.model_name}
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {v.color || ""}
            {v.vin ? ` · VIN: ${v.vin}` : ""}
          </Text>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (v: VehicleListing) => (
        <Text className="font-medium">${(v.price || 0).toLocaleString()}</Text>
      ),
    },
    {
      key: "mileage_km",
      header: "Mileage",
      sortable: true,
      cell: (v: VehicleListing) =>
        v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : "-",
    },
    {
      key: "condition",
      header: "Condition",
      cell: (v: VehicleListing) => (
        <Badge color={getConditionColor(v.condition)}>
          {v.condition || "N/A"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (v: VehicleListing) => <StatusBadge status={v.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Automotive / Vehicles</Heading>
            <Text className="text-ui-fg-muted">
              Manage vehicle inventory, trade-ins, and sales
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={vehicles}
          columns={columns}
          searchable
          searchPlaceholder="Search vehicles..."
          searchKeys={["make", "model_name", "color"]}
          loading={isLoading}
          emptyMessage="No vehicles found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Add Vehicle Listing"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createVehicle.isPending}
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
              placeholder="Vehicle listing title"
            />
          </div>
          <div>
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) =>
                setFormData({ ...formData, make: e.target.value as any })
              }
              placeholder="e.g. Toyota"
            />
          </div>
          <div>
            <Label htmlFor="model_name">Model</Label>
            <Input
              id="model_name"
              value={formData.model_name}
              onChange={(e) =>
                setFormData({ ...formData, model_name: e.target.value as any })
              }
              placeholder="e.g. Camry"
            />
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value as any })
              }
              placeholder="e.g. 2024"
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value as any })
              }
              placeholder="Price"
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
            <Label htmlFor="seller_id">Seller ID</Label>
            <Input
              id="seller_id"
              value={formData.seller_id}
              onChange={(e) =>
                setFormData({ ...formData, seller_id: e.target.value as any })
              }
              placeholder="Seller ID"
            />
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type</Label>
            <select
              id="listing_type"
              value={formData.listing_type}
              onChange={(e) =>
                setFormData({ ...formData, listing_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="sale">Sale</option>
              <option value="lease">Lease</option>
              <option value="auction">Auction</option>
            </select>
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Automotive",
  icon: FlyingBox,
});
export default AutomotivePage;
