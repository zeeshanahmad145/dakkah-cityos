import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type PropertyData = {
  id: string;
  property_type: string;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  floor_number: number;
  total_floors: number;
  furnished_status: string;
  location_city: string;
  location_district: string;
  amenities: string[];
  is_verified: boolean;
  deed_number: string;
};

const RealEstateWidget = ({ data }: { data: { id: string } }) => {
  const [property, setProperty] = useState<PropertyData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=property_listing.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.property_listing)
          setProperty(d.product.property_listing);
      })
      .catch(() => null);
  }, [data.id]);

  if (!property) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Property Details</Heading>
        <div className="flex gap-2">
          {property.is_verified && <Badge color="green">Verified</Badge>}
          <Badge color="blue" className="capitalize">
            {property.listing_type}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {property.property_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Location</Text>
          <Text className="font-medium">
            {property.location_district}, {property.location_city}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Area</Text>
          <Text className="font-medium">{property.area_sqm} m²</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Furnished</Text>
          <Text className="font-medium capitalize">
            {property.furnished_status?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Bedrooms</Text>
          <Text className="font-medium">
            {property.bedrooms} BR / {property.bathrooms} BA
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Floor</Text>
          <Text className="font-medium">
            {property.floor_number ?? "—"} / {property.total_floors ?? "—"}
          </Text>
        </div>
        {property.deed_number && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Deed #</Text>
            <Text className="font-mono text-xs">{property.deed_number}</Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default RealEstateWidget;
