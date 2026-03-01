/**
 * Grocery Product Extension Widget
 *
 * Appears in the Medusa Admin product detail sidebar for products
 * tagged with the "grocery" vertical. Shows FreshProduct metadata
 * (storage type, shelf life, origin, organic flag, etc.)
 */
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

interface FreshProductData {
  id: string;
  storage_type: "ambient" | "chilled" | "frozen" | "live";
  shelf_life_days: number;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  origin_country?: string;
  organic: boolean;
  unit_type: string;
  min_order_quantity: number;
  is_seasonal: boolean;
  season_start?: string;
  season_end?: string;
  nutrition_info?: Record<string, unknown>;
}

const STORAGE_COLORS: Record<string, "blue" | "purple" | "orange" | "green"> = {
  ambient: "orange",
  chilled: "blue",
  frozen: "purple",
  live: "green",
};

const GroceryProductWidget = ({
  data,
}: {
  data: { product: { id: string; metadata?: Record<string, unknown> } };
}) => {
  const [freshProduct, setFreshProduct] = useState<FreshProductData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data?.product?.metadata?.vertical !== "grocery") {
      setLoading(false);
      return;
    }
    // Fetch the linked fresh product extension
    fetch(`/admin/fresh-products?product_id=${data.product.id}`)
      .then((r) => r.json())
      .then((res) => setFreshProduct(res.fresh_product))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [data?.product?.id]);

  if (loading) return null;
  if (!freshProduct) return null;

  return (
    <Container className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">🛒 Grocery Details</Heading>
        <div className="flex gap-2">
          <Badge color={STORAGE_COLORS[freshProduct.storage_type] ?? "grey"}>
            {freshProduct.storage_type}
          </Badge>
          {freshProduct.organic && <Badge color="green">Organic</Badge>}
          {freshProduct.is_seasonal && <Badge color="orange">Seasonal</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Text className="text-ui-fg-muted">Shelf Life</Text>
          <Text className="font-medium">
            {freshProduct.shelf_life_days} days
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-muted">Unit Type</Text>
          <Text className="font-medium">{freshProduct.unit_type}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-muted">Min Order</Text>
          <Text className="font-medium">{freshProduct.min_order_quantity}</Text>
        </div>
        {freshProduct.origin_country && (
          <div>
            <Text className="text-ui-fg-muted">Origin</Text>
            <Text className="font-medium">{freshProduct.origin_country}</Text>
          </div>
        )}
        {(freshProduct.optimal_temp_min != null ||
          freshProduct.optimal_temp_max != null) && (
          <div className="col-span-2">
            <Text className="text-ui-fg-muted">Optimal Temp</Text>
            <Text className="font-medium">
              {freshProduct.optimal_temp_min ?? "—"}°C –{" "}
              {freshProduct.optimal_temp_max ?? "—"}°C
            </Text>
          </div>
        )}
        {freshProduct.is_seasonal && freshProduct.season_start && (
          <div className="col-span-2">
            <Text className="text-ui-fg-muted">Season</Text>
            <Text className="font-medium">
              {freshProduct.season_start} →{" "}
              {freshProduct.season_end ?? "ongoing"}
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default GroceryProductWidget;
