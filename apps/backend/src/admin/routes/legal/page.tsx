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
import { DocumentText, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useLegalAttorneys,
  useCreateLegalAttorney,
} from "../../hooks/use-legal.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const LegalPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bar_number: "",
    bio: "",
    experience_years: 0,
    hourly_rate: 0,
    currency_code: "usd",
  });

  const { data, isLoading } = useLegalAttorneys();
  const createAttorney = useCreateLegalAttorney();

  const attorneys = data?.items || [];
  const acceptingCases = attorneys.filter(
    (a: any) => a.is_accepting_cases,
  ).length;
  const totalAttorneys = attorneys.length;

  const stats = [
    {
      label: "Total Attorneys",
      value: totalAttorneys,
      icon: <DocumentText className="w-5 h-5" />,
    },
    { label: "Accepting Cases", value: acceptingCases, color: "blue" as const },
    {
      label: "Specializations",
      value: [
        ...new Set(attorneys.flatMap((a: any) => a.specializations || [])),
      ].length,
      color: "green" as const,
    },
    {
      label: "Total Profiles",
      value: totalAttorneys,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createAttorney.mutateAsync({
        name: formData.name,
        bar_number: formData.bar_number,
        bio: formData.bio,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
        currency_code: formData.currency_code,
        tenant_id: "default",
      });
      toast.success("Attorney profile created");
      setShowCreate(false);
      setFormData({
        name: "",
        bar_number: "",
        bio: "",
        experience_years: 0,
        hourly_rate: 0,
        currency_code: "usd",
      });
    } catch (error) {
      toast.error("Failed to create attorney profile");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Attorney",
      sortable: true,
      cell: (a: any) => (
        <div>
          <Text className="font-medium">{a.name}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {a.bar_number ? `Bar #${a.bar_number}` : ""}
          </Text>
        </div>
      ),
    },
    {
      key: "experience_years",
      header: "Experience",
      sortable: true,
      cell: (a: any) =>
        a.experience_years ? `${a.experience_years} years` : "—",
    },
    {
      key: "hourly_rate",
      header: "Rate",
      sortable: true,
      cell: (a: any) =>
        a.hourly_rate ? (
          <Text className="font-medium">${a.hourly_rate}/hr</Text>
        ) : (
          <Text className="text-ui-fg-muted">—</Text>
        ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      cell: (a: any) =>
        a.rating ? <Text className="font-medium">⭐ {a.rating}</Text> : "—",
    },
    {
      key: "is_accepting_cases",
      header: "Status",
      cell: (a: any) => (
        <StatusBadge status={a.is_accepting_cases ? "active" : "inactive"} />
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Legal Services</Heading>
            <Text className="text-ui-fg-muted">
              Manage legal cases, compliance, and contracts
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Attorney
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={attorneys}
          columns={columns}
          searchable
          searchPlaceholder="Search attorneys..."
          searchKeys={["name", "bar_number"]}
          loading={isLoading}
          emptyMessage="No attorneys found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Attorney Profile"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createAttorney.isPending}
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
              placeholder="Attorney name"
            />
          </div>
          <div>
            <Label htmlFor="bar_number">Bar Number</Label>
            <Input
              id="bar_number"
              value={formData.bar_number}
              onChange={(e) =>
                setFormData({ ...formData, bar_number: e.target.value as any })
              }
              placeholder="Bar number"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value as any })
              }
              placeholder="Short bio"
            />
          </div>
          <div>
            <Label htmlFor="experience_years">Experience (years)</Label>
            <Input
              id="experience_years"
              type="number"
              value={formData.experience_years}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience_years: Number(e.target.value),
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
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Legal", icon: DocumentText });
export default LegalPage;
