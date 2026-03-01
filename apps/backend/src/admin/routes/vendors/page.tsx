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
import {
  Buildings,
  Plus,
  PencilSquare,
  CheckCircle,
  XCircle,
  CurrencyDollar,
} from "@medusajs/icons";
import { useState } from "react";
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useApproveVendor,
  useRejectVendor,
  Vendor,
} from "../../hooks/use-vendors.js";
import {
  usePayouts,
  useProcessPayout,
  Payout,
} from "../../hooks/use-vendors.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const VendorsPage = () => {
  const [activeTab, setActiveTab] = useState<"vendors" | "payouts">("vendors");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [approvingVendor, setApprovingVendor] = useState<Vendor | null>(null);
  const [rejectingVendor, setRejectingVendor] = useState<Vendor | null>(null);
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null);

  const [formData, setFormData] = useState({
    business_name: "",
    legal_name: "",
    email: "",
    phone: "",
    description: "",
    commission_rate: 15,
    commission_type: "percentage" as any as "percentage" | "flat" | "tiered",
  });

  const { data: vendorsData, isLoading: loadingVendors } = useVendors();
  const { data: payoutsData, isLoading: loadingPayouts } = usePayouts();

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const processPayout = useProcessPayout();

  const vendors = vendorsData?.vendors || [];
  const payouts = payoutsData?.payouts || [];

  const stats = [
    {
      label: "Total Vendors",
      value: vendors.length,
      icon: <Buildings className="w-5 h-5" />,
    },
    {
      label: "Active",
      value: vendors.filter((v) => v.status === "active").length,
      color: "green" as const,
    },
    {
      label: "Onboarding",
      value: vendors.filter((v) => v.status === "onboarding").length,
      color: "orange" as const,
    },
    {
      label: "Pending Payouts",
      value: payouts.filter((p) => p.status === "pending").length,
      icon: <CurrencyDollar className="w-5 h-5" />,
    },
  ];

  const handleCreateVendor = async () => {
    try {
      await createVendor.mutateAsync(formData);
      toast.success("Vendor created successfully");
      setShowCreateDrawer(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create vendor");
    }
  };

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;
    try {
      await updateVendor.mutateAsync({ id: editingVendor.id, ...formData });
      toast.success("Vendor updated successfully");
      setEditingVendor(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update vendor");
    }
  };

  const handleApproveVendor = async () => {
    if (!approvingVendor) return;
    try {
      await approveVendor.mutateAsync(approvingVendor.id);
      toast.success("Vendor approved");
      setApprovingVendor(null);
    } catch (error) {
      toast.error("Failed to approve vendor");
    }
  };

  const handleRejectVendor = async () => {
    if (!rejectingVendor) return;
    try {
      await rejectVendor.mutateAsync({
        id: rejectingVendor.id,
        reason: "Rejected by admin",
      });
      toast.success("Vendor rejected");
      setRejectingVendor(null);
    } catch (error) {
      toast.error("Failed to reject vendor");
    }
  };

  const handleProcessPayout = async () => {
    if (!processingPayout) return;
    try {
      await processPayout.mutateAsync({
        id: processingPayout.id,
        method: "manual",
      });
      toast.success("Payout processed");
      setProcessingPayout(null);
    } catch (error) {
      toast.error("Failed to process payout");
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: "",
      legal_name: "",
      email: "",
      phone: "",
      description: "",
      commission_rate: 15,
      commission_type: "percentage" as any,
    });
  };

  const openEditDrawer = (vendor: Vendor) => {
    setFormData({
      business_name: vendor.business_name,
      legal_name: vendor.legal_name || "",
      email: vendor.email,
      phone: vendor.phone || "",
      description: vendor.description || "",
      commission_rate: vendor.commission_rate,
      commission_type: (vendor.commission_type || "percentage") as any,
    });
    setEditingVendor(vendor);
  };

  const vendorColumns = [
    {
      key: "business_name",
      header: "Vendor",
      sortable: true,
      cell: (v: Vendor) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ui-bg-subtle flex items-center justify-center">
            <Buildings className="w-4 h-4 text-ui-fg-muted" />
          </div>
          <div>
            <Text className="font-medium">{v.business_name}</Text>
            <Text className="text-ui-fg-muted text-sm">{v.email}</Text>
          </div>
        </div>
      ),
    },
    {
      key: "commission_type",
      header: "Type",
      cell: (v: Vendor) => <Badge color="grey">{v.commission_type}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (v: Vendor) => <StatusBadge status={v.status} />,
    },
    {
      key: "commission_rate",
      header: "Commission",
      cell: (v: Vendor) => `${v.commission_rate}%`,
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      cell: (v: Vendor) => (
        <div className="flex gap-1">
          {v.status === "onboarding" && (
            <>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setApprovingVendor(v)}
              >
                <CheckCircle className="w-4 h-4 text-ui-tag-green-icon" />
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setRejectingVendor(v)}
              >
                <XCircle className="w-4 h-4 text-ui-tag-red-icon" />
              </Button>
            </>
          )}
          <Button
            variant="transparent"
            size="small"
            onClick={() => openEditDrawer(v)}
          >
            <PencilSquare className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const payoutColumns = [
    {
      key: "vendor",
      header: "Vendor",
      cell: (p: Payout) => p.vendor?.business_name || "-",
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (p: Payout) => `$${p.net_amount.toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (p: Payout) => <StatusBadge status={p.status} />,
    },
    {
      key: "payment_method",
      header: "Method",
      cell: (p: Payout) => p.payment_method || "-",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (p: Payout) => new Date(p.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      cell: (p: Payout) =>
        p.status === "pending" ? (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setProcessingPayout(p)}
          >
            Process
          </Button>
        ) : null,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Marketplace</Heading>
            <Text className="text-ui-fg-muted">
              Manage vendors, commissions, and payouts
            </Text>
          </div>
          <Button onClick={() => setShowCreateDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-4 border-b border-ui-border-base mb-4">
          <button
            className={`pb-2 px-1 ${activeTab === "vendors" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`}
            onClick={() => setActiveTab("vendors")}
          >
            <div className="flex items-center gap-2">
              <Buildings className="w-4 h-4" />
              Vendors ({vendors.length})
            </div>
          </button>
          <button
            className={`pb-2 px-1 ${activeTab === "payouts" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`}
            onClick={() => setActiveTab("payouts")}
          >
            <div className="flex items-center gap-2">
              <CurrencyDollar className="w-4 h-4" />
              Payouts ({payouts.length})
            </div>
          </button>
        </div>

        {activeTab === "vendors" && (
          <DataTable
            data={vendors}
            columns={vendorColumns}
            searchable
            searchPlaceholder="Search vendors..."
            searchKeys={["business_name", "email"]}
            loading={loadingVendors}
            emptyMessage="No vendors found"
          />
        )}

        {activeTab === "payouts" && (
          <DataTable
            data={payouts}
            columns={payoutColumns}
            searchable={false}
            loading={loadingPayouts}
            emptyMessage="No payouts found"
          />
        )}
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingVendor}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDrawer(false);
            setEditingVendor(null);
            resetForm();
          }
        }}
        title={editingVendor ? "Edit Vendor" : "Create Vendor"}
        onSubmit={editingVendor ? handleUpdateVendor : handleCreateVendor}
        submitLabel={editingVendor ? "Update" : "Create"}
        loading={createVendor.isPending || updateVendor.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  business_name: e.target.value as any,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) =>
                setFormData({ ...formData, legal_name: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value as any })
              }
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
            />
          </div>
          <div>
            <Label htmlFor="commission_type">Commission Type</Label>
            <select
              id="commission_type"
              value={formData.commission_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_type: e.target.value as any,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
              <option value="tiered">Tiered</option>
            </select>
          </div>
          <div>
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              value={formData.commission_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_rate: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!approvingVendor}
        onOpenChange={() => setApprovingVendor(null)}
        title="Approve Vendor"
        description={`Approve ${approvingVendor?.business_name}?`}
        onConfirm={handleApproveVendor}
        confirmLabel="Approve"
        loading={approveVendor.isPending}
      />
      <ConfirmModal
        open={!!rejectingVendor}
        onOpenChange={() => setRejectingVendor(null)}
        title="Reject Vendor"
        description={`Reject ${rejectingVendor?.business_name}?`}
        onConfirm={handleRejectVendor}
        confirmLabel="Reject"
        variant="danger"
        loading={rejectVendor.isPending}
      />
      <ConfirmModal
        open={!!processingPayout}
        onOpenChange={() => setProcessingPayout(null)}
        title="Process Payout"
        description={`Process payout of $${processingPayout?.net_amount?.toLocaleString() || "0"}?`}
        onConfirm={handleProcessPayout}
        confirmLabel="Process"
        loading={processPayout.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Vendors", icon: Buildings });
export default VendorsPage;
