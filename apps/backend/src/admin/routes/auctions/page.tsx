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
import { ShoppingBag, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useAuctions,
  useCreateAuction,
  AuctionListing,
} from "../../hooks/use-auctions.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const AuctionsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    product_id: "",
    tenant_id: "",
    auction_type: "english" as const,
    starting_price: "",
    bid_increment: "",
    currency_code: "usd",
    starts_at: "",
    ends_at: "",
  });

  const { data, isLoading } = useAuctions();
  const createAuction = useCreateAuction();

  const auctions = data?.items || [];
  const activeCount = auctions.filter((a: any) => a.status === "active").length;
  const endedCount = auctions.filter((a: any) => a.status === "ended").length;

  const stats = [
    {
      label: "Total Auctions",
      value: auctions.length,
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    { label: "Active", value: activeCount, color: "green" as const },
    { label: "Ended", value: endedCount, color: "orange" as const },
    {
      label: "Scheduled",
      value: auctions.filter((a: any) => a.status === "scheduled").length,
      color: "blue" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createAuction.mutateAsync({
        ...formData,
        starting_price: Number(formData.starting_price),
        bid_increment: Number(formData.bid_increment),
      });
      toast.success("Auction created");
      setShowCreate(false);
      setFormData({
        title: "",
        product_id: "",
        tenant_id: "",
        auction_type: "english",
        starting_price: "",
        bid_increment: "",
        currency_code: "usd",
        starts_at: "",
        ends_at: "",
      });
    } catch (error) {
      toast.error("Failed to create auction");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Item",
      sortable: true,
      cell: (a: AuctionListing) => (
        <div>
          <Text className="font-medium">{a.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {a.auction_type} · {a.currency_code?.toUpperCase()}
          </Text>
        </div>
      ),
    },
    {
      key: "starting_price",
      header: "Starting Price",
      sortable: true,
      cell: (a: AuctionListing) => (
        <div>
          <Text className="font-medium">
            ${(a.starting_price || 0).toLocaleString()}
          </Text>
          {a.reserve_price && (
            <Text className="text-ui-fg-muted text-sm">
              Reserve: ${a.reserve_price.toLocaleString()}
            </Text>
          )}
        </div>
      ),
    },
    {
      key: "bid_increment",
      header: "Bid Increment",
      sortable: true,
      cell: (a: AuctionListing) =>
        `$${(a.bid_increment || 0).toLocaleString()}`,
    },
    {
      key: "ends_at",
      header: "Ends At",
      sortable: true,
      cell: (a: AuctionListing) => a.ends_at?.split("T")[0] || "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (a: AuctionListing) => <StatusBadge status={a.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Auction Management</Heading>
            <Text className="text-ui-fg-muted">
              Manage auctions, bids, and listings
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Auction
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={auctions}
          columns={columns}
          searchable
          searchPlaceholder="Search auctions..."
          searchKeys={["title", "auction_type"]}
          loading={isLoading}
          emptyMessage="No auctions found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Auction"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createAuction.isPending}
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
              placeholder="Auction title"
            />
          </div>
          <div>
            <Label htmlFor="product_id">Product ID</Label>
            <Input
              id="product_id"
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value as any })
              }
              placeholder="Product ID"
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
            <Label htmlFor="auction_type">Auction Type</Label>
            <select
              id="auction_type"
              value={formData.auction_type}
              onChange={(e) =>
                setFormData({ ...formData, auction_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="english">English</option>
              <option value="dutch">Dutch</option>
              <option value="sealed">Sealed</option>
              <option value="reserve">Reserve</option>
            </select>
          </div>
          <div>
            <Label htmlFor="starting_price">Starting Price</Label>
            <Input
              id="starting_price"
              type="number"
              value={formData.starting_price}
              onChange={(e) =>
                setFormData({ ...formData, starting_price: e.target.value as any })
              }
              placeholder="Starting price"
            />
          </div>
          <div>
            <Label htmlFor="bid_increment">Bid Increment</Label>
            <Input
              id="bid_increment"
              type="number"
              value={formData.bid_increment}
              onChange={(e) =>
                setFormData({ ...formData, bid_increment: e.target.value as any })
              }
              placeholder="Bid increment"
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
            <Label htmlFor="starts_at">Starts At</Label>
            <Input
              id="starts_at"
              type="date"
              value={formData.starts_at}
              onChange={(e) =>
                setFormData({ ...formData, starts_at: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label htmlFor="ends_at">Ends At</Label>
            <Input
              id="ends_at"
              type="date"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Auctions",
  icon: ShoppingBag,
});
export default AuctionsPage;
