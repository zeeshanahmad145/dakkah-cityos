import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type RentalData = {
  id: string;
  rental_type: string;
  unit_name: string;
  min_rental_days: number;
  max_rental_days: number;
  security_deposit: number;
  currency_code: string;
  is_available: boolean;
  location_city: string;
  location_country: string;
  amenities: string[];
};

const RentalWidget = ({ data }: { data: { id: string } }) => {
  const [rental, setRental] = useState<RentalData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=rental_unit.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.rental_unit) setRental(d.product.rental_unit);
      })
      .catch(() => null);
  }, [data.id]);

  if (!rental) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Rental Details</Heading>
        <Badge color={rental.is_available ? "green" : "red"}>
          {rental.is_available ? "Available" : "Unavailable"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {rental.rental_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Location</Text>
          <Text className="font-medium">
            {rental.location_city}, {rental.location_country}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Min Days</Text>
          <Text className="font-medium">{rental.min_rental_days}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Max Days</Text>
          <Text className="font-medium">{rental.max_rental_days || "∞"}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Security Deposit</Text>
          <Text className="font-medium">
            {rental.security_deposit?.toLocaleString()}{" "}
            {rental.currency_code?.toUpperCase()}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default RentalWidget;
