import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type PayloadData = {
  id: string;
  collection_slug: string;
  payload_id: string;
  synced_at: string;
  sync_status: string;
  cms_domain: string;
  cms_tenant_id: string;
};

const PayloadWidget = ({ data }: { data: { id: string } }) => {
  const [record, setRecord] = useState<PayloadData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=payload_record.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.payload_record) setRecord(d.product.payload_record);
      })
      .catch(() => null);
  }, [data.id]);

  if (!record) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Payload CMS Sync</Heading>
        <Badge
          color={
            record.sync_status === "synced"
              ? "green"
              : record.sync_status === "pending"
                ? "orange"
                : "red"
          }
        >
          {record.sync_status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Collection</Text>
          <Text className="font-medium">{record.collection_slug}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">CMS Domain</Text>
          <Text className="font-medium capitalize">{record.cms_domain}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Payload ID</Text>
          <Text className="font-mono text-xs">{record.payload_id}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Last Synced</Text>
          <Text className="font-medium">
            {record.synced_at?.split("T")[0] || "Never"}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default PayloadWidget;
