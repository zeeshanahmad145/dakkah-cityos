import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type RoomTypeData = {
  id: string;
  room_type: string;
  max_occupancy: number;
  bed_type: string;
  view_type: string;
  floor: number;
  is_smoking_allowed: boolean;
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
};

const TravelWidget = ({ data }: { data: { id: string } }) => {
  const [room, setRoom] = useState<RoomTypeData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=room_type.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.room_type) setRoom(d.product.room_type);
      })
      .catch(() => null);
  }, [data.id]);

  if (!room) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Room / Accommodation</Heading>
        {room.is_smoking_allowed === false && (
          <Badge color="grey">Non-Smoking</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Room Type</Text>
          <Text className="font-medium capitalize">
            {room.room_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Bed Type</Text>
          <Text className="font-medium capitalize">
            {room.bed_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Max Occupancy</Text>
          <Text className="font-medium">{room.max_occupancy} guests</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">View</Text>
          <Text className="font-medium capitalize">
            {room.view_type?.replace("_", " ") || "—"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Check-in</Text>
          <Text className="font-medium">{room.check_in_time || "—"}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Check-out</Text>
          <Text className="font-medium">{room.check_out_time || "—"}</Text>
        </div>
        {room.cancellation_policy && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Cancellation</Text>
            <Text className="text-xs">{room.cancellation_policy}</Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default TravelWidget;
