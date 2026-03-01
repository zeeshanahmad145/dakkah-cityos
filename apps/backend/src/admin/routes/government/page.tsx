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
import { BuildingStorefront, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useGovernmentServices,
  useCreateGovernmentService,
} from "../../hooks/use-government.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const GovernmentPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    request_type: "inquiry" as any,
    department: "",
    priority: "medium" as const,
    reference_number: "",
    citizen_id: "",
  });

  const { data, isLoading } = useGovernmentServices();
  const createService = useCreateGovernmentService();

  const services = data?.items || [];
  const totalServices = services.length;
  const inProgress = services.filter(
    (s: any) => s.status === "in_progress",
  ).length;
  const resolved = services.filter((s: any) => s.status === "resolved").length;
  const submitted = services.filter(
    (s: any) => s.status === "submitted",
  ).length;

  const stats = [
    {
      label: "Total Services",
      value: totalServices,
      icon: <BuildingStorefront className="w-5 h-5" />,
    },
    { label: "Submitted", value: submitted, color: "blue" as const },
    { label: "Resolved", value: resolved, color: "green" as const },
    { label: "In Progress", value: inProgress, color: "orange" as const },
  ];

  const handleCreate = async () => {
    try {
      await createService.mutateAsync({
        title: formData.title,
        description: formData.description,
        request_type: formData.request_type,
        department: formData.department,
        priority: formData.priority,
        reference_number: formData.reference_number,
        citizen_id: formData.citizen_id,
        tenant_id: "default",
      });
      toast.success("Service request created");
      setShowCreate(false);
      setFormData({
        title: "",
        description: "",
        request_type: "inquiry" as any,
        department: "",
        priority: "medium",
        reference_number: "",
        citizen_id: "",
      });
    } catch (error) {
      toast.error("Failed to create service request");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Service",
      sortable: true,
      cell: (s: any) => (
        <div>
          <Text className="font-medium">{s.title}</Text>
          <Text className="text-ui-fg-muted text-sm">{s.description}</Text>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (s: any) => <Badge color="grey">{s.department || "—"}</Badge>,
    },
    {
      key: "request_type",
      header: "Type",
      cell: (s: any) => <Badge color="blue">{s.request_type}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (s: any) => {
        const color =
          s.priority === "urgent" || s.priority === "high"
            ? "red"
            : s.priority === "medium"
              ? "orange"
              : "green";
        return <Badge color={color}>{s.priority || "—"}</Badge>;
      },
    },
    {
      key: "reference_number",
      header: "Ref #",
      cell: (s: any) => (
        <Text className="font-mono text-sm">{s.reference_number}</Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (s: any) => <StatusBadge status={s.status || "submitted"} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Government Services</Heading>
            <Text className="text-ui-fg-muted">
              Manage government services, applications, and permits
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Request
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={services}
          columns={columns}
          searchable
          searchPlaceholder="Search services..."
          searchKeys={["title", "department", "reference_number"]}
          loading={isLoading}
          emptyMessage="No government services found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Service Request"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createService.isPending}
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
              placeholder="Service title"
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
              placeholder="Description"
            />
          </div>
          <div>
            <Label htmlFor="citizen_id">Citizen ID</Label>
            <Input
              id="citizen_id"
              value={formData.citizen_id}
              onChange={(e) =>
                setFormData({ ...formData, citizen_id: e.target.value as any })
              }
              placeholder="Citizen ID"
            />
          </div>
          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reference_number: e.target.value as any,
                })
              }
              placeholder="Reference number"
            />
          </div>
          <div>
            <Label htmlFor="request_type">Request Type</Label>
            <select
              id="request_type"
              value={formData.request_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  request_type: e.target.value,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="maintenance">Maintenance</option>
              <option value="complaint">Complaint</option>
              <option value="inquiry">Inquiry</option>
              <option value="permit">Permit</option>
              <option value="license">License</option>
              <option value="inspection">Inspection</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value as any })
              }
              placeholder="Department"
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Government",
  icon: BuildingStorefront,
});
export default GovernmentPage;
