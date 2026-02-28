import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  toast,
  Label,
} from "@medusajs/ui";
import { ExclamationCircle, PencilSquare } from "@medusajs/icons";
import { useState } from "react";
import {
  useDisputes,
  useUpdateDispute,
  useResolveDispute,
  Dispute,
} from "../../hooks/use-disputes.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const DisputesPage = () => {
  const [editing, setEditing] = useState<Dispute | null>(null);
  const [formData, setFormData] = useState({ status: "open", resolution: "" });

  const { data: disputesData, isLoading } = useDisputes();
  const updateDispute = useUpdateDispute();
  const resolveDispute = useResolveDispute();

  const disputes = disputesData?.disputes || [];

  const stats = [
    {
      label: "Open Disputes",
      value: disputes.filter((d) => d.status === "open").length,
      icon: <ExclamationCircle className="w-5 h-5" />,
      color: "red" as const,
    },
    {
      label: "Under Review",
      value: disputes.filter((d) => d.status === "under_review").length,
      color: "orange" as const,
    },
    {
      label: "Resolved",
      value: disputes.filter((d) => d.status === "resolved").length,
      color: "green" as const,
    },
    {
      label: "Escalated",
      value: disputes.filter((d) => d.status === "escalated").length,
      color: "purple" as const,
    },
  ];

  const handleSubmit = async () => {
    if (!editing) return;
    try {
      if (formData.status === "resolved") {
        await resolveDispute.mutateAsync({
          id: editing.id,
          resolution: formData.resolution,
          resolution_type: "refund",
        });
      } else {
        await updateDispute.mutateAsync({
          id: editing.id,
          status: formData.status as Dispute["status"],
        });
      }
      toast.success("Dispute updated");
      setEditing(null);
    } catch (error) {
      toast.error("Failed to update dispute");
    }
  };

  const openEdit = (d: Dispute) => {
    setFormData({ status: d.status, resolution: d.resolution || "" });
    setEditing(d);
  };

  const columns = [
    {
      key: "order_id",
      header: "Order",
      sortable: true,
      cell: (d: Dispute) => (
        <Text className="font-medium font-mono">{d.order_id}</Text>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (d: Dispute) => (
        <div>
          <Text className="font-medium">
            {d.customer?.first_name} {d.customer?.last_name}
          </Text>
          <Text className="text-ui-fg-muted text-sm">{d.customer?.email}</Text>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (d: Dispute) => <Text>{d.type}</Text>,
    },
    {
      key: "status",
      header: "Status",
      cell: (d: Dispute) => <StatusBadge status={d.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (d: Dispute) => d.created_at?.split("T")[0],
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      cell: (d: Dispute) => (
        <Button variant="transparent" size="small" onClick={() => openEdit(d)}>
          <PencilSquare className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Disputes</Heading>
            <Text className="text-ui-fg-muted">
              Manage customer disputes and resolutions
            </Text>
          </div>
        </div>
      </div>
      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>
      <div className="px-6 pb-6">
        <DataTable
          data={disputes}
          columns={columns}
          searchable
          searchPlaceholder="Search disputes..."
          searchKeys={["order_id", "type"]}
          loading={isLoading}
          emptyMessage="No disputes found"
        />
      </div>
      <FormDrawer
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Update Dispute"
        onSubmit={handleSubmit}
        submitLabel="Update"
        loading={updateDispute.isPending || resolveDispute.isPending}
      >
        <div className="space-y-4">
          {editing && (
            <div>
              <Text className="text-sm text-ui-fg-muted">
                Order: {editing.order_id} — {editing.customer?.first_name}{" "}
                {editing.customer?.last_name}
              </Text>
            </div>
          )}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          <div>
            <Label htmlFor="resolution">Resolution Notes</Label>
            <Input
              id="resolution"
              value={formData.resolution}
              onChange={(e) =>
                setFormData({ ...formData, resolution: e.target.value })
              }
              placeholder="Add notes about this dispute..."
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Disputes",
  icon: ExclamationCircle,
});
export default DisputesPage;
