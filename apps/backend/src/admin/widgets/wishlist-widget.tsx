import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type WishlistData = {
  id: string;
  name: string;
  customer_id: string;
  is_public: boolean;
  item_count: number;
  created_at: string;
};

const WishlistWidget = ({ data }: { data: { id: string } }) => {
  const [wishlists, setWishlists] = useState<WishlistData[]>([]);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=wishlist_item.*`)
      .then((r) => r.json())
      .then((d) => {
        const items = d?.product?.wishlist_item;
        if (items) setWishlists(Array.isArray(items) ? items : [items]);
      })
      .catch(() => null);
  }, [data.id]);

  if (!wishlists.length) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Wishlists</Heading>
        <Badge color="orange">
          {wishlists.length} customer{wishlists.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="px-6 py-4 space-y-2 text-sm">
        {wishlists.slice(0, 5).map((w) => (
          <div key={w.id} className="flex items-center justify-between">
            <Text className="font-medium">{w.name || "Wishlist"}</Text>
            <div className="flex gap-2">
              {w.is_public && (
                <Badge color="blue" className="text-xs">
                  Public
                </Badge>
              )}
              <Text className="text-ui-fg-muted">
                {w.created_at?.split("T")[0]}
              </Text>
            </div>
          </div>
        ))}
        {wishlists.length > 5 && (
          <Text className="text-ui-fg-muted text-xs">
            +{wishlists.length - 5} more
          </Text>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default WishlistWidget;
