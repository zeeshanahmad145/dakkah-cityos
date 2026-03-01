import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type VolumePricingData = {
  id: string;
  pricing_type: string;
  currency_code: string;
  tiers: Array<{
    min_qty: number;
    max_qty: number | null;
    unit_price: number;
    discount_pct: number;
  }>;
};

const VolumePricingWidget = ({ data }: { data: { id: string } }) => {
  const [vp, setVp] = useState<VolumePricingData | null>(null);

  useEffect(() => {
    fetch(
      `/admin/products/${data.id}?fields=volume_pricing.*,volume_pricing.tiers.*`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.volume_pricing) setVp(d.product.volume_pricing);
      })
      .catch(() => null);
  }, [data.id]);

  if (!vp) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Volume Pricing</Heading>
        <Badge color="blue" className="capitalize">
          {vp.pricing_type?.replace("_", " ")}
        </Badge>
      </div>
      <div className="px-6 py-4">
        {!vp.tiers?.length ? (
          <Text className="text-ui-fg-muted text-sm">No tiers configured.</Text>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ui-fg-muted text-left border-b border-ui-border-base">
                <th className="pb-2 pr-4 font-medium">Qty Range</th>
                <th className="pb-2 pr-4 font-medium">Unit Price</th>
                <th className="pb-2 font-medium">Discount</th>
              </tr>
            </thead>
            <tbody>
              {vp.tiers.map((t, i) => (
                <tr
                  key={i}
                  className="border-b border-ui-border-base last:border-0"
                >
                  <td className="py-2 pr-4">
                    {t.min_qty} – {t.max_qty ?? "∞"}
                  </td>
                  <td className="py-2 pr-4">
                    {t.unit_price?.toLocaleString()}{" "}
                    {vp.currency_code?.toUpperCase()}
                  </td>
                  <td className="py-2 text-green-600">
                    {t.discount_pct ? `${t.discount_pct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default VolumePricingWidget;
