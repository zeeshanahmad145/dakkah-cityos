import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type PromotionBundleData = {
  id: string;
  bundle_name: string;
  bundle_type: string;
  discount_type: string;
  discount_value: number;
  min_bundle_qty: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  usage_count: number;
  usage_limit: number;
};

const PromotionExtWidget = ({ data }: { data: { id: string } }) => {
  const [bundle, setBundle] = useState<PromotionBundleData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=customer_segment.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.customer_segment) setBundle(d.product.customer_segment);
      })
      .catch(() => null);
  }, [data.id]);

  if (!bundle) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Promotion Bundle</Heading>
        <Badge color={bundle.is_active ? "green" : "grey"}>
          {bundle.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Bundle</Text>
          <Text className="font-medium">{bundle.bundle_name}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {bundle.bundle_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Discount</Text>
          <Text className="font-medium text-green-600">
            {bundle.discount_value}
            {bundle.discount_type === "percentage" ? "%" : " off"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Min Qty</Text>
          <Text className="font-medium">{bundle.min_bundle_qty}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Usage</Text>
          <Text className="font-medium">
            {bundle.usage_count || 0} / {bundle.usage_limit || "∞"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Ends</Text>
          <Text className="font-medium">
            {bundle.ends_at?.split("T")[0] || "—"}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default PromotionExtWidget;
