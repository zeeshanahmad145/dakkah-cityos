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
import { Tag, ExclamationCircle, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useClassifieds,
  useCreateClassifiedListing,
  ClassifiedListing,
} from "../../hooks/use-classifieds.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const ClassifiedsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    listing_type: "sell" as const,
    price: "",
    currency_code: "usd",
    tenant_id: "",
    seller_id: "",
  });

  const { data, isLoading } = useClassifieds();
  const createListing = useCreateClassifiedListing();

  const listings = data?.items || [];
  const activeCount = listings.filter((l: any) => l.status === "active").length;
  const expiredCount = listings.filter(
    (l: any) => l.status === "expired",
  ).length;
  const flaggedCount = listings.filter(
    (l: any) => l.status === "flagged",
  ).length;

  const stats = [
    {
      label: "Total Listings",
      value: listings.length,
      icon: <Tag className="w-5 h-5" />,
    },
    { label: "Active", value: activeCount, color: "green" as const },
    { label: "Expired", value: expiredCount, color: "orange" as const },
    {
      label: "Flagged",
      value: flaggedCount,
      icon: <ExclamationCircle className="w-5 h-5" />,
      color: "red" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createListing.mutateAsync({
        ...formData,
        price: formData.price ? Number(formData.price) : undefined,
      });
      toast.success("Listing created");
      setShowCreate(false);
      setFormData({
        title: "",
        description: "",
        listing_type: "sell",
        price: "",
        currency_code: "usd",
        tenant_id: "",
        seller_id: "",
      });
    } catch (error) {
      toast.error("Failed to create listing");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Listing",
      sortable: true,
      cell: (l: ClassifiedListing) => (
        <div>
          <Text className="font-medium">{l.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {l.location_city
              ? `${l.location_city}, ${l.location_state || ""}`
              : ""}
          </Text>
        </div>
      ),
    },
    {
      key: "listing_type",
      header: "Type",
      cell: (l: ClassifiedListing) => (
        <Badge color="grey">{l.listing_type}</Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (l: ClassifiedListing) => (
        <Text className="font-medium">
          {l.price ? `$${l.price.toLocaleString()}` : "Free"}
        </Text>
      ),
    },
    {
      key: "condition",
      header: "Condition",
      cell: (l: ClassifiedListing) => l.condition || "-",
    },
    {
      key: "created_at",
      header: "Posted",
      sortable: true,
      cell: (l: ClassifiedListing) => l.created_at?.split("T")[0] || "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (l: ClassifiedListing) => <StatusBadge status={l.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Classified Listings</Heading>
            <Text className="text-ui-fg-muted">
              Manage classified ads, sellers, and moderation
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Listing
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={listings}
          columns={columns}
          searchable
          searchPlaceholder="Search listings..."
          searchKeys={["title", "listing_type"]}
          loading={isLoading}
          emptyMessage="No listings found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Listing"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createListing.isPending}
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
              placeholder="Listing title"
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
            <Label htmlFor="seller_id">Seller ID</Label>
            <Input
              id="seller_id"
              value={formData.seller_id}
              onChange={(e) =>
                setFormData({ ...formData, seller_id: e.target.value as any })
              }
              placeholder="Seller ID"
            />
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type</Label>
            <select
              id="listing_type"
              value={formData.listing_type}
              onChange={(e) =>
                setFormData({ ...formData, listing_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
              <option value="trade">Trade</option>
              <option value="free">Free</option>
              <option value="wanted">Wanted</option>
            </select>
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value as any })
              }
              placeholder="Price (optional)"
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
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Classifieds", icon: Tag });
export default ClassifiedsPage;
