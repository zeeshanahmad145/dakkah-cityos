import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type ServiceProductData = {
  service_type: string;
  duration_minutes: number;
  max_capacity: number;
  location_type: string;
  pricing_type: string;
  cancellation_policy_hours: number;
  is_active: boolean;
};

type Props = { data: { id: string } };

const BookingServiceWidget = ({ data }: Props) => {
  const [service, setService] = useState<ServiceProductData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=service_product.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.service_product) setService(d.product.service_product);
      })
      .catch(() => null);
  }, [data.id]);

  if (!service) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Booking Service Details</Heading>
        <Badge color={service.is_active ? "green" : "grey"}>
          {service.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Service Type</Text>
          <Text className="font-medium capitalize">{service.service_type}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Duration</Text>
          <Text className="font-medium">{service.duration_minutes} min</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Max Capacity</Text>
          <Text className="font-medium">{service.max_capacity} people</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Location</Text>
          <Text className="font-medium capitalize">
            {service.location_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Pricing</Text>
          <Text className="font-medium capitalize">
            {service.pricing_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Cancel Policy</Text>
          <Text className="font-medium">
            {service.cancellation_policy_hours}h notice
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default BookingServiceWidget;
