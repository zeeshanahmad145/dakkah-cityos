/**
 * Gig Listing Product Extension Widget
 *
 * Appears in the Medusa Admin product detail sidebar for products
 * of type "freelance-gig". Shows GigListing metadata (delivery time,
 * revisions, skills, type, performance metrics).
 */
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

interface GigListingData {
  id: string;
  listing_type: "fixed_price" | "hourly" | "milestone";
  category?: string;
  subcategory?: string;
  delivery_time_days?: number;
  revisions_included: number;
  total_orders: number;
  avg_rating?: number;
  skill_tags?: string[];
  portfolio_urls?: string[];
}

const LISTING_TYPE_COLORS: Record<string, "blue" | "green" | "orange"> = {
  fixed_price: "green",
  hourly: "blue",
  milestone: "orange",
};

const GigProductWidget = ({
  data,
}: {
  data: { product: { id: string; type?: { value: string } } };
}) => {
  const [gig, setGig] = useState<GigListingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data?.product?.type?.value !== "freelance-gig") {
      setLoading(false);
      return;
    }
    fetch(`/admin/gig-listings?product_id=${data.product.id}`)
      .then((r) => r.json())
      .then((res) => setGig(res.gig_listing))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [data?.product?.id]);

  if (loading || !gig) return null;

  return (
    <Container className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">💼 Gig Details</Heading>
        <Badge color={LISTING_TYPE_COLORS[gig.listing_type] ?? "grey"}>
          {gig.listing_type.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        {gig.category && (
          <div>
            <Text className="text-ui-fg-muted">Category</Text>
            <Text className="font-medium">
              {gig.category}
              {gig.subcategory ? ` / ${gig.subcategory}` : ""}
            </Text>
          </div>
        )}
        {gig.delivery_time_days && (
          <div>
            <Text className="text-ui-fg-muted">Delivery</Text>
            <Text className="font-medium">{gig.delivery_time_days} days</Text>
          </div>
        )}
        <div>
          <Text className="text-ui-fg-muted">Revisions</Text>
          <Text className="font-medium">{gig.revisions_included}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-muted">Orders Completed</Text>
          <Text className="font-medium">{gig.total_orders}</Text>
        </div>
        {gig.avg_rating && (
          <div>
            <Text className="text-ui-fg-muted">Rating</Text>
            <Text className="font-medium">⭐ {gig.avg_rating.toFixed(1)}</Text>
          </div>
        )}
      </div>

      {gig.skill_tags && gig.skill_tags.length > 0 && (
        <div>
          <Text className="text-ui-fg-muted text-sm mb-2">Skills</Text>
          <div className="flex flex-wrap gap-1">
            {gig.skill_tags.map((tag) => (
              <Badge key={tag} color="grey">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default GigProductWidget;
