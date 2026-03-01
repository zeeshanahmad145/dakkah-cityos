import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type WarrantyData = {
  id: string;
  warranty_type: string;
  duration_months: number;
  coverage_type: string;
  provider_name: string;
  terms_url: string;
  is_transferable: boolean;
  claim_count: number;
};

const WarrantyWidget = ({ data }: { data: { id: string } }) => {
  const [warranty, setWarranty] = useState<WarrantyData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=warranty_plan.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.warranty_plan) setWarranty(d.product.warranty_plan);
      })
      .catch(() => null);
  }, [data.id]);

  if (!warranty) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Warranty Plan</Heading>
        <div className="flex gap-2">
          {warranty.is_transferable && <Badge color="blue">Transferable</Badge>}
          <Badge color="green" className="capitalize">
            {warranty.warranty_type?.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Duration</Text>
          <Text className="font-medium">{warranty.duration_months} months</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Coverage</Text>
          <Text className="font-medium capitalize">
            {warranty.coverage_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Provider</Text>
          <Text className="font-medium">
            {warranty.provider_name || "Manufacturer"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Claims</Text>
          <Text className="font-medium">{warranty.claim_count || 0}</Text>
        </div>
      </div>
      {warranty.terms_url && (
        <div className="px-6 py-3">
          <a
            href={warranty.terms_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View warranty terms ↗
          </a>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default WarrantyWidget;
