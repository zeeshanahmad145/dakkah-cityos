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
import { EllipsisHorizontal, Plus, PencilSquare, Trash } from "@medusajs/icons";
import { useState } from "react";
import {
  useRegionZones,
  useCreateRegionZone,
  useUpdateRegionZone,
  useDeleteRegionZone,
  RegionZoneMapping,
} from "../../hooks/use-region-zones.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";

const ZONE_CODES = ["GCC", "EU", "MENA", "APAC", "AMERICAS", "GLOBAL"] as const;

const getZoneBadgeColor = (code: string) => {
  switch (code) {
    case "GCC":
      return "blue";
    case "EU":
      return "blue";
    case "MENA":
      return "green";
    case "APAC":
      return "orange";
    case "AMERICAS":
      return "purple";
    case "GLOBAL":
      return "grey";
    default:
      return "grey";
  }
};

const RegionZonesPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingZone, setEditingZone] = useState<RegionZoneMapping | null>(
    null,
  );
  const [deletingZone, setDeletingZone] = useState<RegionZoneMapping | null>(
    null,
  );

  const [formData, setFormData] = useState({
    residency_zone: "GLOBAL" as RegionZoneMapping["residency_zone"],
    medusa_region_id: "",
    country_codes: "",
    policies_override: "",
  });

  const { data: zonesData, isLoading } = useRegionZones();
  const createZone = useCreateRegionZone();
  const updateZone = useUpdateRegionZone();
  const deleteZone = useDeleteRegionZone();

  const zones = zonesData?.items || [];
  const totalCountries = zones.reduce((sum, z) => {
    if (!z.country_codes || !Array.isArray(z.country_codes)) return sum;
    return sum + z.country_codes.length;
  }, 0);

  const stats = [
    {
      label: "Total Zones",
      value: zones.length,
      icon: <EllipsisHorizontal className="w-5 h-5" />,
    },
    {
      label: "Countries Mapped",
      value: totalCountries,
      color: "blue" as const,
    },
    {
      label: "Global",
      value: zones.filter((z) => z.residency_zone === "GLOBAL").length,
      color: "purple" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      let policies_override: Record<string, unknown> | undefined;
      if (formData.policies_override) {
        try {
          policies_override = JSON.parse(formData.policies_override);
        } catch {
          toast.error("Invalid JSON for policies");
          return;
        }
      }
      const country_codes = formData.country_codes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await createZone.mutateAsync({
        ...formData,
        country_codes,
        policies_override,
      });
      toast.success("Region zone created successfully");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create region zone");
    }
  };

  const handleUpdate = async () => {
    if (!editingZone) return;
    try {
      let policies_override: Record<string, unknown> | undefined;
      if (formData.policies_override) {
        try {
          policies_override = JSON.parse(formData.policies_override);
        } catch {
          toast.error("Invalid JSON for policies");
          return;
        }
      }
      const country_codes = formData.country_codes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await updateZone.mutateAsync({
        id: editingZone.id,
        ...formData,
        country_codes,
        policies_override,
      });
      toast.success("Region zone updated successfully");
      setEditingZone(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update region zone");
    }
  };

  const handleDelete = async () => {
    if (!deletingZone) return;
    try {
      await deleteZone.mutateAsync(deletingZone.id);
      toast.success("Region zone deleted");
      setDeletingZone(null);
    } catch (error) {
      toast.error("Failed to delete region zone");
    }
  };

  const resetForm = () => {
    setFormData({
      residency_zone: "GLOBAL",
      medusa_region_id: "",
      country_codes: "",
      policies_override: "",
    });
  };

  const openEditDrawer = (zone: RegionZoneMapping) => {
    setFormData({
      residency_zone: zone.residency_zone,
      medusa_region_id: zone.medusa_region_id,
      country_codes: Array.isArray(zone.country_codes)
        ? zone.country_codes.join(", ")
        : "",
      policies_override: zone.policies_override
        ? JSON.stringify(zone.policies_override, null, 2)
        : "",
    });
    setEditingZone(zone);
  };

  const columns = [
    {
      key: "residency_zone",
      header: "Residency Zone",
      cell: (z: RegionZoneMapping) => (
        <Badge color={getZoneBadgeColor(z.residency_zone)}>
          {z.residency_zone}
        </Badge>
      ),
    },
    {
      key: "medusa_region_id",
      header: "Mapped Medusa Region",
      cell: (z: RegionZoneMapping) => (
        <Text className="font-mono text-sm">{z.medusa_region_id}</Text>
      ),
    },
    {
      key: "country_codes",
      header: "Countries",
      cell: (z: RegionZoneMapping) => (
        <Text>
          {Array.isArray(z.country_codes) ? z.country_codes.length : 0}{" "}
          countries
        </Text>
      ),
    },
    {
      key: "policies_override",
      header: "Policies",
      cell: (z: RegionZoneMapping) => (
        <Text>{z.policies_override ? "Configured" : "-"}</Text>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (z: RegionZoneMapping) =>
        new Date(z.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      cell: (z: RegionZoneMapping) => (
        <div className="flex gap-1">
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(z)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setDeletingZone(z)}
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
            <Heading level="h1">Region Zones</Heading>
            <Text className="text-ui-fg-muted">
              Manage data residency zones: GCC/EU, MENA, APAC, AMERICAS, GLOBAL
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
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
          searchKeys={["residency_zone", "medusa_region_id"]}
          loading={isLoading}
          emptyMessage="No region zones found"
        />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingZone}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingZone(null);
            resetForm();
          }
        }}
        title={editingZone ? "Edit Region Zone" : "Create Region Zone"}
        onSubmit={editingZone ? handleUpdate : handleCreate}
        submitLabel={editingZone ? "Update" : "Create"}
        loading={createZone.isPending || updateZone.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="residency_zone">Residency Zone</Label>
            <select
              id="residency_zone"
              value={formData.residency_zone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  residency_zone: e.target
                    .value as RegionZoneMapping["residency_zone"],
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              {ZONE_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="medusa_region_id">Medusa Region ID</Label>
            <Input
              id="medusa_region_id"
              value={formData.medusa_region_id}
              onChange={(e) =>
                setFormData({ ...formData, medusa_region_id: e.target.value as any })
              }
              placeholder="reg_01..."
            />
          </div>
          <div>
            <Label htmlFor="country_codes">Countries (comma-separated)</Label>
            <Input
              id="country_codes"
              value={formData.country_codes}
              onChange={(e) =>
                setFormData({ ...formData, country_codes: e.target.value as any })
              }
              placeholder="AE, SA, QA, KW, BH, OM"
            />
          </div>
          <div>
            <Label htmlFor="policies_override">Policies Override (JSON)</Label>
            <textarea
              id="policies_override"
              value={formData.policies_override}
              onChange={(e) =>
                setFormData({ ...formData, policies_override: e.target.value as any })
              }
              placeholder='{"storage": "local", "encryption": "AES-256"}'
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base min-h-[100px] font-mono text-sm"
            />
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!deletingZone}
        onOpenChange={() => setDeletingZone(null)}
        title="Delete Region Zone"
        description={`Delete Zone Mapping? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteZone.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Region Zones",
  icon: EllipsisHorizontal,
});
export default RegionZonesPage;
