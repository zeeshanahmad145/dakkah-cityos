import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type ParkingZoneData = {
  zone_type: string;
  capacity: number;
  available_spaces: number | null;
  latitude: number | null;
  longitude: number | null;
  operating_hours: Record<string, string> | null;
  amenities: string[] | null;
};

const ParkingZoneWidget = ({ data }: Props) => {
  const [zone, setZone] = useState<ParkingZoneData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=parking_zone.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.parking_zone) setZone(d.product.parking_zone);
      })
      .catch(() => null);
  }, [data.id]);

  if (!zone) return null;

  const occupancyPct =
    zone.available_spaces != null && zone.capacity > 0
      ? Math.round(
          ((zone.capacity - zone.available_spaces) / zone.capacity) * 100,
        )
      : null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Parking Zone</Heading>
        <Badge color="orange" className="capitalize">
          {zone.zone_type}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Capacity</Text>
          <Text className="font-medium">{zone.capacity} spots</Text>
        </div>
        {zone.available_spaces != null && (
          <div>
            <Text className="text-ui-fg-subtle">Available</Text>
            <Text className="font-medium">
              {zone.available_spaces} ({100 - (occupancyPct ?? 0)}% free)
            </Text>
          </div>
        )}
        {zone.latitude && zone.longitude && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Coordinates</Text>
            <Text className="font-medium font-mono text-xs">
              {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)}
            </Text>
          </div>
        )}
        {zone.amenities && zone.amenities.length > 0 && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Amenities</Text>
            <div className="mt-1 flex flex-wrap gap-1">
              {zone.amenities.map((a, i) => (
                <Badge key={i} size="xsmall">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default ParkingZoneWidget;
