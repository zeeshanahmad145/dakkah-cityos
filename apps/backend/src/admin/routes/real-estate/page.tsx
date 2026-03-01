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
import { BuildingStorefront, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  usePropertyListings,
  useCreatePropertyListing,
} from "../../hooks/use-real-estate.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const RealEstatePage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    property_type: "apartment" as any,
    listing_type: "sale" as any,
    price: 0,
    currency_code: "usd",
    address_line1: "",
    city: "",
    postal_code: "",
    country_code: "US",
    bedrooms: 0,
    bathrooms: 0,
    area_sqm: 0,
  });

  const { data, isLoading } = usePropertyListings();
  const createListing = useCreatePropertyListing();

  const properties = data?.items || [];
  const forSale = properties.filter(
    (p: any) => p.listing_type === "sale",
  ).length;
  const forRent = properties.filter(
    (p: any) => p.listing_type === "rent",
  ).length;
  const saleProperties = properties.filter(
    (p: any) => p.listing_type === "sale",
  );
  const avgPrice =
    saleProperties.length > 0
      ? Math.round(
          saleProperties.reduce((s: number, p: any) => s + (p.price || 0), 0) /
            saleProperties.length,
        )
      : 0;

  const stats = [
    {
      label: "Total Listings",
      value: properties.length,
      icon: <BuildingStorefront className="w-5 h-5" />,
    },
    { label: "For Sale", value: forSale, color: "blue" as const },
    { label: "For Rent", value: forRent, color: "green" as const },
    {
      label: "Avg Price",
      value: `$${avgPrice.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createListing.mutateAsync({
        title: formData.title,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: formData.price,
        currency_code: formData.currency_code,
        address_line1: formData.address_line1,
        city: formData.city,
        postal_code: formData.postal_code,
        country_code: formData.country_code,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area_sqm: formData.area_sqm,
        tenant_id: "default",
      });
      toast.success("Property listing created");
      setShowCreate(false);
      setFormData({
        title: "",
        property_type: "apartment" as any,
        listing_type: "sale" as any,
        price: 0,
        currency_code: "usd",
        address_line1: "",
        city: "",
        postal_code: "",
        country_code: "US",
        bedrooms: 0,
        bathrooms: 0,
        area_sqm: 0,
      });
    } catch (error) {
      toast.error("Failed to create property listing");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Property",
      sortable: true,
      cell: (p: any) => (
        <div>
          <Text className="font-medium">{p.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {p.address_line1}
            {p.city ? `, ${p.city}` : ""}
          </Text>
        </div>
      ),
    },
    {
      key: "property_type",
      header: "Type",
      cell: (p: any) => <Badge color="grey">{p.property_type}</Badge>,
    },
    {
      key: "listing_type",
      header: "Listing",
      cell: (p: any) => (
        <Badge color={p.listing_type === "sale" ? "blue" : "green"}>
          {p.listing_type === "sale"
            ? "For Sale"
            : p.listing_type === "rent"
              ? "For Rent"
              : p.listing_type}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (p: any) => (
        <Text className="font-medium">
          {p.listing_type === "rent"
            ? `$${(p.price || 0).toLocaleString()}/mo`
            : `$${(p.price || 0).toLocaleString()}`}
        </Text>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (p: any) => (
        <Text className="text-sm">
          {p.bedrooms
            ? `${p.bedrooms} bd / ${p.bathrooms || 0} ba`
            : `${p.bathrooms || 0} ba`}
          {p.area_sqm ? ` · ${p.area_sqm} sqm` : ""}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p: any) => <StatusBadge status={p.status || "draft"} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Real Estate Listings</Heading>
            <Text className="text-ui-fg-muted">
              Manage property listings, sales, and rentals
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Listing
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={properties}
          columns={columns}
          searchable
          searchPlaceholder="Search properties..."
          searchKeys={["title", "city", "property_type"]}
          loading={isLoading}
          emptyMessage="No properties found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Property Listing"
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
              placeholder="Property title"
            />
          </div>
          <div>
            <Label htmlFor="property_type">Property Type</Label>
            <select
              id="property_type"
              value={formData.property_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  property_type: e.target.value,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type</Label>
            <select
              id="listing_type"
              value={formData.listing_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  listing_type: e.target.value,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
              <option value="auction">Auction</option>
            </select>
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              placeholder="Price"
            />
          </div>
          <div>
            <Label htmlFor="address_line1">Address</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address_line1: e.target.value as any,
                })
              }
              placeholder="Address"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value as any })
              }
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value as any })
              }
              placeholder="Postal code"
            />
          </div>
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) =>
                setFormData({ ...formData, bedrooms: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={(e) =>
                setFormData({ ...formData, bathrooms: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="area_sqm">Area (sqm)</Label>
            <Input
              id="area_sqm"
              type="number"
              value={formData.area_sqm}
              onChange={(e) =>
                setFormData({ ...formData, area_sqm: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Real Estate",
  icon: BuildingStorefront,
});
export default RealEstatePage;
