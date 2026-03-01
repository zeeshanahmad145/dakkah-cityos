import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Button, Badge, toast } from "@medusajs/ui";
import { CurrencyDollar } from "@medusajs/icons";
import { useState } from "react";
import {
  usePayouts,
  useProcessPayout,
  Payout,
} from "../../hooks/use-vendors.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";

const PayoutsPage = () => {
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null);

  const { data: payoutsData, isLoading } = usePayouts();
  const processPayout = useProcessPayout();

  const payouts = payoutsData?.payouts || [];

  const pendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.net_amount || 0), 0);

  const now = new Date();
  const thisMonth = payouts.filter((p) => {
    if (p.status !== "completed") return false;
    const date = new Date(p.processing_completed_at || p.created_at);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const totalProcessed = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.net_amount || 0), 0);

  const stats = [
    {
      label: "Total Payouts",
      value: payouts.length,
      icon: <CurrencyDollar className="w-5 h-5" />,
    },
    {
      label: "Pending Amount",
      value: `$${pendingAmount.toLocaleString()}`,
      color: "orange" as const,
    },
    {
      label: "Processed This Month",
      value: thisMonth.length,
      color: "green" as const,
    },
    {
      label: "Total Processed",
      value: `$${totalProcessed.toLocaleString()}`,
      color: "blue" as const,
    },
  ];

  const handleProcessPayout = async () => {
    if (!processingPayout) return;
    try {
      await processPayout.mutateAsync({
        id: processingPayout.id,
        method: "manual",
      });
      toast.success("Payout processed successfully");
      setProcessingPayout(null);
    } catch (error) {
      toast.error("Failed to process payout");
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "stripe_connect":
        return "purple";
      case "bank_transfer":
        return "blue";
      case "paypal":
        return "orange";
      case "manual":
        return "grey";
      case "check":
        return "grey";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "vendor_name",
      header: "Vendor",
      sortable: true,
      cell: (p: Payout) => (
        <div>
          <Text className="font-medium">
            {p.vendor?.business_name || "Unknown"}
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {p.vendor?.email || ""}
          </Text>
        </div>
      ),
    },
    {
      key: "net_amount",
      header: "Net Amount",
      sortable: true,
      cell: (p: Payout) => (
        <Text className="font-medium">
          ${(p.net_amount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: "payout_number",
      header: "PO #",
      cell: (p: Payout) => <Badge color="grey">{p.payout_number}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p: Payout) => <StatusBadge status={p.status} />,
    },
    {
      key: "payment_method",
      header: "Method",
      cell: (p: Payout) => (
        <Badge color={getMethodBadgeColor(p.payment_method)}>
          {p.payment_method || "-"}
        </Badge>
      ),
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
      width: "100px",
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
            <Heading level="h1">Global Payouts</Heading>
            <Text className="text-ui-fg-muted">
              Platform-wide payout management across all vendors
            </Text>
          </div>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={payouts}
          columns={columns}
          searchable
          searchPlaceholder="Search payouts..."
          searchKeys={["vendor_name" as keyof Payout]}
          loading={isLoading}
          emptyMessage="No payouts found"
        />
      </div>

      <ConfirmModal
        open={!!processingPayout}
        onOpenChange={() => setProcessingPayout(null)}
        title="Process Payout"
        description={`Process payout of $${(processingPayout?.net_amount || 0).toLocaleString()} to ${processingPayout?.vendor?.business_name || "vendor"}?`}
        onConfirm={handleProcessPayout}
        confirmLabel="Process Payout"
        loading={processPayout.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Payouts",
  icon: CurrencyDollar,
});
export default PayoutsPage;
