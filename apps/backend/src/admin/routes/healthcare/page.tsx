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
import { Heart, Star, Clock, User, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useHealthcarePractitioners,
  useCreateHealthcarePractitioner,
} from "../../hooks/use-healthcare.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const HealthcarePage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    license_number: "",
    consultation_fee: 0,
    tenant_id: "default",
  });

  const { data, isLoading } = useHealthcarePractitioners();
  const createPractitioner = useCreateHealthcarePractitioner();

  const providers = data?.items || [];
  const accepting = providers.filter(
    (p: any) => p.is_accepting_patients,
  ).length;

  const stats = [
    {
      label: "Total Providers",
      value: providers.length,
      icon: <User className="w-5 h-5" />,
    },
    { label: "Accepting Patients", value: accepting, color: "blue" as const },
    {
      label: "Specializations",
      value: [...new Set(providers.map((p: any) => p.specialization))].length,
      icon: <Clock className="w-5 h-5" />,
      color: "orange" as const,
    },
    {
      label: "Total Practitioners",
      value: providers.length,
      icon: <Star className="w-5 h-5" />,
      color: "green" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createPractitioner.mutateAsync({
        name: formData.name,
        specialization: formData.specialization,
        license_number: formData.license_number,
        consultation_fee: formData.consultation_fee,
        tenant_id: formData.tenant_id,
      });
      toast.success("Practitioner created");
      setShowCreate(false);
      setFormData({
        name: "",
        specialization: "",
        license_number: "",
        consultation_fee: 0,
        tenant_id: "default",
      });
    } catch (error) {
      toast.error("Failed to create practitioner");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Provider",
      sortable: true,
      cell: (p: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ui-bg-subtle flex items-center justify-center">
            <Heart className="w-4 h-4 text-ui-tag-red-icon" />
          </div>
          <div>
            <Text className="font-medium">{p.name}</Text>
            <Text className="text-ui-fg-muted text-sm">{p.title || ""}</Text>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialty",
      cell: (p: any) => <Badge color="blue">{p.specialization}</Badge>,
    },
    {
      key: "license_number",
      header: "License #",
      cell: (p: any) => (
        <Text className="font-mono text-sm">{p.license_number || "—"}</Text>
      ),
    },
    {
      key: "consultation_fee",
      header: "Fee",
      sortable: true,
      cell: (p: any) => (
        <Text className="font-medium">
          {p.consultation_fee ? `$${p.consultation_fee}` : "—"}
        </Text>
      ),
    },
    {
      key: "experience_years",
      header: "Experience",
      sortable: true,
      cell: (p: any) =>
        p.experience_years ? `${p.experience_years} yrs` : "—",
    },
    {
      key: "is_accepting_patients",
      header: "Status",
      cell: (p: any) => (
        <StatusBadge status={p.is_accepting_patients ? "active" : "inactive"} />
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Healthcare Services</Heading>
            <Text className="text-ui-fg-muted">
              Manage healthcare providers, appointments, and services
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Provider
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={providers}
          columns={columns}
          searchable
          searchPlaceholder="Search providers..."
          searchKeys={["name", "specialization"]}
          loading={isLoading}
          emptyMessage="No providers found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Practitioner"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createPractitioner.isPending}
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
              placeholder="Provider name"
            />
          </div>
          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value as any })
              }
              placeholder="Specialization"
            />
          </div>
          <div>
            <Label htmlFor="license_number">License Number</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) =>
                setFormData({ ...formData, license_number: e.target.value as any })
              }
              placeholder="License number"
            />
          </div>
          <div>
            <Label htmlFor="consultation_fee">Consultation Fee</Label>
            <Input
              id="consultation_fee"
              type="number"
              value={formData.consultation_fee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consultation_fee: Number(e.target.value),
                })
              }
              placeholder="Fee"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Healthcare", icon: Heart });
export default HealthcarePage;
