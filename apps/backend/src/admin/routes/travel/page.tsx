import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { Map, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import { useTravel, useCreateTravel } from "../../hooks/use-travel.js";
import type { TravelProperty } from "../../hooks/use-travel.js";

const TravelPage = () => {
  const { data, isLoading } = useTravel();
  const createTravel = useCreateTravel();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const properties = data?.items || [];
  const activeCount = properties.filter(
    (p: any) => p.is_active !== false,
  ).length;
  const uniqueCities = new Set(properties.map((p: any) => p.city)).size;

  const stats = [
    {
      label: "Total Properties",
      value: properties.length,
      icon: <Map className="w-5 h-5" />,
    },
    { label: "Active", value: activeCount, color: "green" as const },
    { label: "Cities", value: uniqueCities, color: "blue" as const },
    {
      label: "Total Listed",
      value: data?.count || 0,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "purple" as const,
    },
  ];

  const columns = [
    {
      key: "name",
      header: "Property",
      sortable: true,
      cell: (p: TravelProperty) => (
        <div>
          <Text className="font-medium">{p.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{p.property_type}</Text>
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      cell: (p: TravelProperty) => (
        <div>
          <Text className="text-sm">{p.city}</Text>
          <Text className="text-ui-fg-muted text-sm">{p.country_code}</Text>
        </div>
      ),
    },
    {
      key: "star_rating",
      header: "Stars",
      sortable: true,
      cell: (p: TravelProperty) => (p.star_rating ? `${p.star_rating} ★` : "—"),
    },
    {
      key: "check_in_time",
      header: "Check-in",
      cell: (p: TravelProperty) => p.check_in_time || "—",
    },
    {
      key: "check_out_time",
      header: "Check-out",
      cell: (p: TravelProperty) => p.check_out_time || "—",
    },
    {
      key: "is_active",
      header: "Status",
      cell: (p: TravelProperty) => (
        <StatusBadge status={p.is_active !== false ? "active" : "inactive"} />
      ),
    },
  ];

  const handleCreate = () => {
    createTravel.mutate(
      {
        tenant_id: formData.tenant_id,
        name: formData.name,
        property_type: (formData.property_type || "hotel") as any,
        address_line1: formData.address_line1,
        city: formData.city,
        country_code: formData.country_code || "us",
        description: formData.description,
        star_rating: formData.star_rating
          ? Number(formData.star_rating)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Property created");
          setShowCreate(false);
          setFormData({});
        },
        onError: () => toast.error("Failed to create property"),
      },
    );
  };

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Travel Properties</Heading>
            <Text className="text-ui-fg-muted">
              Manage travel properties, bookings, and destinations
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Property
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={properties}
          columns={columns}
          searchable
          searchPlaceholder="Search properties..."
          searchKeys={["name", "city", "property_type"]}
          loading={isLoading}
          emptyMessage="No properties found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Travel Property"
        description="Add a new travel property"
        onSubmit={handleCreate}
        loading={createTravel.isPending}
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
            <Label>Property Type</Label>
            <Input
              value={formData.property_type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  property_type: e.target.value as any as any,
                })
              }
              placeholder="hotel, resort, hostel, apartment, villa"
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
            <Label>Address</Label>
            <Input
              value={formData.address_line1 || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address_line1: e.target.value as any,
                })
              }
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Country Code</Label>
            <Input
              value={formData.country_code || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  country_code: e.target.value as any,
                })
              }
              placeholder="us"
            />
          </div>
          <div>
            <Label>Star Rating</Label>
            <Input
              type="number"
              value={formData.star_rating || ""}
              onChange={(e) =>
                setFormData({ ...formData, star_rating: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Travel", icon: Map });
export default TravelPage;
