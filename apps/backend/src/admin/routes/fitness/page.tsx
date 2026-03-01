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
import { Star, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useFitness,
  useCreateGymMembership,
  GymMembership,
} from "../../hooks/use-fitness.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const FitnessPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    membership_type: "basic" as const,
    monthly_fee: "",
    currency_code: "usd",
    start_date: "",
    tenant_id: "",
  });

  const { data, isLoading } = useFitness();
  const createMembership = useCreateGymMembership();

  const memberships = data?.items || [];
  const activeCount = memberships.filter(
    (m: any) => m.status === "active",
  ).length;
  const frozenCount = memberships.filter(
    (m: any) => m.status === "frozen",
  ).length;

  const stats = [
    {
      label: "Total Memberships",
      value: memberships.length,
      icon: <Star className="w-5 h-5" />,
    },
    { label: "Active", value: activeCount, color: "green" as const },
    { label: "Frozen", value: frozenCount, color: "blue" as const },
    {
      label: "Expired",
      value: memberships.filter((m: any) => m.status === "expired").length,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createMembership.mutateAsync({
        ...formData,
        monthly_fee: Number(formData.monthly_fee),
      });
      toast.success("Membership created");
      setShowCreate(false);
      setFormData({
        customer_id: "",
        membership_type: "basic",
        monthly_fee: "",
        currency_code: "usd",
        start_date: "",
        tenant_id: "",
      });
    } catch (error) {
      toast.error("Failed to create membership");
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "vip":
        return "purple";
      case "premium":
        return "orange";
      case "corporate":
        return "blue";
      case "family":
        return "green";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "customer_id",
      header: "Member",
      sortable: true,
      cell: (m: GymMembership) => (
        <div>
          <Text className="font-medium">{m.customer_id}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {m.facility_id || ""}
          </Text>
        </div>
      ),
    },
    {
      key: "membership_type",
      header: "Type",
      cell: (m: GymMembership) => (
        <Badge color={getMembershipColor(m.membership_type)}>
          {m.membership_type}
        </Badge>
      ),
    },
    {
      key: "monthly_fee",
      header: "Monthly Fee",
      sortable: true,
      cell: (m: GymMembership) => (
        <Text className="font-medium">
          ${(m.monthly_fee || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: "start_date",
      header: "Start Date",
      sortable: true,
      cell: (m: GymMembership) => m.start_date?.split("T")[0] || "-",
    },
    {
      key: "auto_renew",
      header: "Auto Renew",
      cell: (m: GymMembership) => (m.auto_renew ? "Yes" : "No"),
    },
    {
      key: "status",
      header: "Status",
      cell: (m: GymMembership) => <StatusBadge status={m.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Fitness Services</Heading>
            <Text className="text-ui-fg-muted">
              Manage fitness memberships, trainers, and classes
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Membership
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={memberships}
          columns={columns}
          searchable
          searchPlaceholder="Search memberships..."
          searchKeys={["customer_id", "membership_type"]}
          loading={isLoading}
          emptyMessage="No fitness memberships found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Add Membership"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createMembership.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer_id">Customer ID</Label>
            <Input
              id="customer_id"
              value={formData.customer_id}
              onChange={(e) =>
                setFormData({ ...formData, customer_id: e.target.value as any })
              }
              placeholder="Customer ID"
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
            <Label htmlFor="membership_type">Membership Type</Label>
            <select
              id="membership_type"
              value={formData.membership_type}
              onChange={(e) =>
                setFormData({ ...formData, membership_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
              <option value="student">Student</option>
              <option value="corporate">Corporate</option>
              <option value="family">Family</option>
            </select>
          </div>
          <div>
            <Label htmlFor="monthly_fee">Monthly Fee</Label>
            <Input
              id="monthly_fee"
              type="number"
              value={formData.monthly_fee}
              onChange={(e) =>
                setFormData({ ...formData, monthly_fee: e.target.value as any })
              }
              placeholder="Monthly fee"
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
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Fitness", icon: Star });
export default FitnessPage;
