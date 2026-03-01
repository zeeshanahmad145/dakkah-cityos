import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type PodData = {
  template_url: string;
  print_provider: string | null;
  customization_options: Record<string, unknown> | null;
  base_cost: number;
};

const PodProductWidget = ({ data }: Props) => {
  const [pod, setPod] = useState<PodData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=pod_product.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.pod_product) setPod(d.product.pod_product);
      })
      .catch(() => null);
  }, [data.id]);

  if (!pod) return null;

  const providerColors: Record<string, "blue" | "green" | "orange"> = {
    printful: "blue",
    printify: "green",
    custom: "orange",
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Print-on-Demand Details</Heading>
        {pod.print_provider && (
          <Badge
            color={providerColors[pod.print_provider] ?? "grey"}
            className="capitalize"
          >
            {pod.print_provider}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Base Cost</Text>
          <Text className="font-medium">
            {(pod.base_cost / 100).toFixed(2)} SAR
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Template</Text>
          <a
            href={pod.template_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 text-xs underline"
          >
            View Template
          </a>
        </div>
        {pod.customization_options &&
          Object.keys(pod.customization_options).length > 0 && (
            <div className="col-span-2">
              <Text className="text-ui-fg-subtle">Customization Options</Text>
              <pre className="mt-1 text-xs bg-ui-bg-subtle p-2 rounded overflow-auto max-h-28">
                {JSON.stringify(pod.customization_options, null, 2)}
              </pre>
            </div>
          )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default PodProductWidget;
