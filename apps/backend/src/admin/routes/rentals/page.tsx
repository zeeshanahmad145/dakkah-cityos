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
import { ReceiptPercent, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";
import { useRentals, useCreateRental } from "../../hooks/use-rentals.js";
import type { Rental } from "../../hooks/use-rentals.js";

const RentalsPage = () => {
  const { data, isLoading } = useRentals();
  const createRental = useCreateRental();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const rentals = data?.items || [];
  const activeCount = rentals.filter(
    (r: any) => r.is_available !== false,
  ).length;
  const totalCount = rentals.length;

  const stats = [
    {
      label: "Total Rental Items",
      value: totalCount,
      icon: <ReceiptPercent className="w-5 h-5" />,
    },
    { label: "Available", value: activeCount, color: "green" as const },
    { label: "Total Listed", value: totalCount, color: "blue" as const },
    {
      label: "Currency",
      value: rentals[0]?.currency_code || "—",
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
  ];

  const columns = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      cell: (r: Rental) => (
        <div>
          <Text className="font-medium">{r.id}</Text>
          <Text className="text-ui-fg-muted text-sm">{r.rental_type}</Text>
        </div>
      ),
    },
    {
      key: "product_id",
      header: "Product",
      cell: (r: Rental) => <Text className="text-sm">{r.product_id}</Text>,
    },
    {
      key: "base_price",
      header: "Base Price",
      sortable: true,
      cell: (r: Rental) => (
        <Text className="font-medium">
          {r.base_price} {r.currency_code}
        </Text>
      ),
    },
    {
      key: "deposit_amount",
      header: "Deposit",
      sortable: true,
      cell: (r: Rental) => (r.deposit_amount ? `${r.deposit_amount}` : "—"),
    },
    {
      key: "rental_type",
      header: "Type",
      cell: (r: Rental) => <StatusBadge status={r.rental_type} />,
    },
    {
      key: "is_available",
      header: "Available",
      cell: (r: Rental) => (
        <StatusBadge
          status={r.is_available !== false ? "active" : "inactive"}
        />
      ),
    },
  ];

  const handleCreate = () => {
    createRental.mutate(
      {
        tenant_id: formData.tenant_id,
        product_id: formData.product_id,
        rental_type: (formData.rental_type || "daily") as any,
        base_price: Number(formData.base_price) || 0,
        currency_code: formData.currency_code || "usd",
        deposit_amount: formData.deposit_amount
          ? Number(formData.deposit_amount)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Rental created");
          setShowCreate(false);
          setFormData({});
        },
        onError: () => toast.error("Failed to create rental"),
      },
    );
  };

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Rental Management</Heading>
            <Text className="text-ui-fg-muted">
              Manage rental items, bookings, and returns
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Rental
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={rentals}
          columns={columns}
          searchable
          searchPlaceholder="Search rentals..."
          searchKeys={["id", "product_id", "rental_type"]}
          loading={isLoading}
          emptyMessage="No rentals found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Rental"
        description="Add a new rental item"
        onSubmit={handleCreate}
        loading={createRental.isPending}
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
            <Label>Product ID</Label>
            <Input
              value={formData.product_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Rental Type</Label>
            <Input
              value={formData.rental_type || ""}
              onChange={(e) =>
                setFormData({ ...formData, rental_type: e.target.value as any })
              }
              placeholder="daily, weekly, monthly, hourly, custom"
            />
          </div>
          <div>
            <Label>Base Price</Label>
            <Input
              type="number"
              value={formData.base_price || ""}
              onChange={(e) =>
                setFormData({ ...formData, base_price: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label>Currency Code</Label>
            <Input
              value={formData.currency_code || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currency_code: e.target.value as any,
                })
              }
              placeholder="usd"
            />
          </div>
          <div>
            <Label>Deposit Amount</Label>
            <Input
              type="number"
              value={formData.deposit_amount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deposit_amount: e.target.value as any,
                })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Rentals",
  icon: ReceiptPercent,
});
export default RentalsPage;
