import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type DigitalAssetData = {
  id: string;
  asset_type: string;
  file_url: string;
  file_size_bytes: number;
  file_format: string;
  download_limit: number;
  download_count: number;
  license_type: string;
  is_watermarked: boolean;
  preview_url: string;
};

const DigitalProductWidget = ({ data }: { data: { id: string } }) => {
  const [asset, setAsset] = useState<DigitalAssetData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=digital_asset.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.digital_asset) setAsset(d.product.digital_asset);
      })
      .catch(() => null);
  }, [data.id]);

  if (!asset) return null;

  const sizeLabel = asset.file_size_bytes
    ? asset.file_size_bytes > 1048576
      ? `${(asset.file_size_bytes / 1048576).toFixed(1)} MB`
      : `${(asset.file_size_bytes / 1024).toFixed(0)} KB`
    : "—";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Digital Asset</Heading>
        <div className="flex gap-2">
          {asset.is_watermarked && <Badge color="orange">Watermarked</Badge>}
          <Badge color="blue" className="uppercase">
            {asset.file_format}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Asset Type</Text>
          <Text className="font-medium capitalize">
            {asset.asset_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">File Size</Text>
          <Text className="font-medium">{sizeLabel}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">License</Text>
          <Text className="font-medium capitalize">
            {asset.license_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Downloads</Text>
          <Text className="font-medium">
            {asset.download_count || 0} / {asset.download_limit || "∞"}
          </Text>
        </div>
      </div>
      {asset.preview_url && (
        <div className="px-6 py-3">
          <a
            href={asset.preview_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Preview file ↗
          </a>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default DigitalProductWidget;
