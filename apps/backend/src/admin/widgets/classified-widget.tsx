import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type ClassifiedData = {
  id: string;
  listing_type: string;
  condition: string;
  seller_id: string;
  location_city: string;
  location_country: string;
  is_negotiable: boolean;
  is_featured: boolean;
  view_count: number;
  status: string;
  expires_at: string;
};

const ClassifiedWidget = ({ data }: { data: { id: string } }) => {
  const [listing, setListing] = useState<ClassifiedData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=classified_listing.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.classified_listing)
          setListing(d.product.classified_listing);
      })
      .catch(() => null);
  }, [data.id]);

  if (!listing) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Classified Listing</Heading>
        <div className="flex gap-2">
          {listing.is_featured && <Badge color="purple">Featured</Badge>}
          <Badge color={listing.status === "active" ? "green" : "grey"}>
            {listing.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">{listing.listing_type}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Condition</Text>
          <Text className="font-medium capitalize">{listing.condition}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Location</Text>
          <Text className="font-medium">
            {listing.location_city}, {listing.location_country}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Negotiable</Text>
          <Text className="font-medium">
            {listing.is_negotiable ? "Yes" : "No"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Views</Text>
          <Text className="font-medium">{listing.view_count || 0}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Expires</Text>
          <Text className="font-medium">
            {listing.expires_at?.split("T")[0] || "—"}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default ClassifiedWidget;
