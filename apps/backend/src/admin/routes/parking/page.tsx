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
import { Map, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useParkingZones,
  useCreateParkingZone,
} from "../../hooks/use-parking.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const ParkingPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    zone_type: "lot" as const,
    total_spots: 0,
    available_spots: 0,
    hourly_rate: 0,
    daily_rate: 0,
    currency_code: "usd",
  });

  const { data, isLoading } = useParkingZones();
  const createZone = useCreateParkingZone();

  const zones = data?.items || [];
  const totalSpots = zones.reduce(
    (s: number, z: any) => s + (z.total_spots || 0),
    0,
  );
  const availableSpots = zones.reduce(
    (s: number, z: any) => s + (z.available_spots || 0),
    0,
  );
  const occupiedSpots = totalSpots - availableSpots;

  const stats = [
    {
      label: "Total Zones",
      value: zones.length,
      icon: <Map className="w-5 h-5" />,
    },
    { label: "Total Spots", value: totalSpots, color: "blue" as const },
    { label: "Available", value: availableSpots, color: "green" as const },
    {
      label: "Occupied",
      value: occupiedSpots,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createZone.mutateAsync({
        name: formData.name,
        zone_type: formData.zone_type,
        total_spots: formData.total_spots,
        available_spots: formData.available_spots,
        hourly_rate: formData.hourly_rate,
        daily_rate: formData.daily_rate,
        currency_code: formData.currency_code,
        tenant_id: "default",
      });
      toast.success("Parking zone created");
      setShowCreate(false);
      setFormData({
        name: "",
        zone_type: "lot",
        total_spots: 0,
        available_spots: 0,
        hourly_rate: 0,
        daily_rate: 0,
        currency_code: "usd",
      });
    } catch (error) {
      toast.error("Failed to create parking zone");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "garage":
        return "blue";
      case "valet":
        return "purple";
      case "airport":
        return "green";
      case "reserved":
        return "orange";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "name",
      header: "Zone",
      sortable: true,
      cell: (z: any) => (
        <div>
          <Text className="font-medium">{z.name}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {z.description || ""}
          </Text>
        </div>
      ),
    },
    {
      key: "zone_type",
      header: "Type",
      cell: (z: any) => (
        <Badge color={getTypeColor(z.zone_type)}>{z.zone_type}</Badge>
      ),
    },
    {
      key: "total_spots",
      header: "Total Spots",
      sortable: true,
      cell: (z: any) => <Text className="font-medium">{z.total_spots}</Text>,
    },
    {
      key: "available_spots",
      header: "Available",
      sortable: true,
      cell: (z: any) => (
        <Text className="font-medium">{z.available_spots}</Text>
      ),
    },
    {
      key: "rate",
      header: "Rate",
      cell: (z: any) => (
        <div>
          <Text className="font-medium text-sm">
            {z.hourly_rate ? `$${z.hourly_rate}/hr` : "—"}
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {z.daily_rate ? `$${z.daily_rate}/day` : ""}
          </Text>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (z: any) => (
        <StatusBadge status={z.is_active !== false ? "active" : "inactive"} />
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Parking Management</Heading>
            <Text className="text-ui-fg-muted">
              Manage parking spots, zones, and occupancy
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Zone
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={zones}
          columns={columns}
          searchable
          searchPlaceholder="Search zones..."
          searchKeys={["name", "zone_type"]}
          loading={isLoading}
          emptyMessage="No parking zones found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Parking Zone"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createZone.isPending}
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
              placeholder="Zone name"
            />
          </div>
          <div>
            <Label htmlFor="zone_type">Zone Type</Label>
            <select
              id="zone_type"
              value={formData.zone_type}
              onChange={(e) =>
                setFormData({ ...formData, zone_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="street">Street</option>
              <option value="garage">Garage</option>
              <option value="lot">Lot</option>
              <option value="valet">Valet</option>
              <option value="airport">Airport</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div>
            <Label htmlFor="total_spots">Total Spots</Label>
            <Input
              id="total_spots"
              type="number"
              value={formData.total_spots}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  total_spots: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="available_spots">Available Spots</Label>
            <Input
              id="available_spots"
              type="number"
              value={formData.available_spots}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  available_spots: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="hourly_rate">Hourly Rate</Label>
            <Input
              id="hourly_rate"
              type="number"
              value={formData.hourly_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourly_rate: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="daily_rate">Daily Rate</Label>
            <Input
              id="daily_rate"
              type="number"
              value={formData.daily_rate}
              onChange={(e) =>
                setFormData({ ...formData, daily_rate: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Parking", icon: Map });
export default ParkingPage;
