import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type TradeInData = {
  id: string;
  condition: string;
  trade_in_status: string;
  estimated_value: number;
  final_value: number;
  currency_code: string;
  customer_id: string;
  notes: string;
  created_at: string;
};

const TradeInWidget = ({ data }: { data: { id: string } }) => {
  const [request, setRequest] = useState<TradeInData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=trade_in_request.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.trade_in_request)
          setRequest(d.product.trade_in_request);
      })
      .catch(() => null);
  }, [data.id]);

  if (!request) return null;

  const statusColor = (s: string) =>
    s === "approved"
      ? "green"
      : s === "pending"
        ? "orange"
        : s === "rejected"
          ? "red"
          : "grey";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Trade-In Request</Heading>
        <Badge color={statusColor(request.trade_in_status) as any}>
          {request.trade_in_status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Condition</Text>
          <Text className="font-medium capitalize">
            {request.condition?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Estimated</Text>
          <Text className="font-medium">
            {request.estimated_value?.toLocaleString()}{" "}
            {request.currency_code?.toUpperCase()}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Final Value</Text>
          <Text className="font-medium text-green-600">
            {request.final_value?.toLocaleString() || "Pending"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Submitted</Text>
          <Text className="font-medium">
            {request.created_at?.split("T")[0]}
          </Text>
        </div>
        {request.notes && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Notes</Text>
            <Text className="text-xs">{request.notes}</Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default TradeInWidget;
