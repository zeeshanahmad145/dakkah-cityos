import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type VehicleData = {
  make: string;
  model_name: string;
  year: number;
  mileage_km: number | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  color: string | null;
  vin: string | null;
  condition: string;
  listing_type: string;
  location_city: string | null;
  location_country: string | null;
  seller_id: string;
};

const VehicleListingWidget = ({ data }: Props) => {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=vehicle_listing.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.vehicle_listing) setVehicle(d.product.vehicle_listing);
      })
      .catch(() => null);
  }, [data.id]);

  if (!vehicle) return null;

  const conditionColor: Record<string, "green" | "blue" | "orange" | "red"> = {
    new: "green",
    certified_pre_owned: "blue",
    used: "orange",
    salvage: "red",
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Vehicle Details</Heading>
        <div className="flex gap-2">
          <Badge
            color={conditionColor[vehicle.condition] ?? "grey"}
            className="capitalize"
          >
            {vehicle.condition?.replace("_", " ")}
          </Badge>
          <Badge color="purple" className="capitalize">
            {vehicle.listing_type}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Make / Model</Text>
          <Text className="font-medium">
            {vehicle.make} {vehicle.model_name}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Year</Text>
          <Text className="font-medium">{vehicle.year}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Mileage</Text>
          <Text className="font-medium">
            {vehicle.mileage_km != null
              ? `${vehicle.mileage_km.toLocaleString()} km`
              : "New"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Fuel</Text>
          <Text className="font-medium capitalize">
            {vehicle.fuel_type ?? "—"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Transmission</Text>
          <Text className="font-medium capitalize">
            {vehicle.transmission ?? "—"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Colour</Text>
          <Text className="font-medium capitalize">{vehicle.color ?? "—"}</Text>
        </div>
        {vehicle.vin && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">VIN</Text>
            <Text className="font-mono text-xs">{vehicle.vin}</Text>
          </div>
        )}
        {vehicle.location_city && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Location</Text>
            <Text className="font-medium">
              {vehicle.location_city}, {vehicle.location_country}
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
export default VehicleListingWidget;
