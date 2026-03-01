import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type EventData = {
  id: string;
  event_type: string;
  venue_name: string;
  venue_address: string;
  starts_at: string;
  ends_at: string;
  max_capacity: number;
  tickets_sold: number;
  is_virtual: boolean;
  virtual_link: string;
  status: string;
};

const EventTicketingWidget = ({ data }: { data: { id: string } }) => {
  const [event, setEvent] = useState<EventData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=event_ticket.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.event_ticket) setEvent(d.product.event_ticket);
      })
      .catch(() => null);
  }, [data.id]);

  if (!event) return null;

  const occupancy =
    event.max_capacity > 0
      ? Math.round((event.tickets_sold / event.max_capacity) * 100)
      : 0;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Event Details</Heading>
        <div className="flex gap-2">
          {event.is_virtual && <Badge color="blue">Virtual</Badge>}
          <Badge color={event.status === "active" ? "green" : "grey"}>
            {event.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {event.event_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Venue</Text>
          <Text className="font-medium">{event.venue_name || "—"}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Starts</Text>
          <Text className="font-medium">{event.starts_at?.split("T")[0]}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Ends</Text>
          <Text className="font-medium">{event.ends_at?.split("T")[0]}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Tickets Sold</Text>
          <Text className="font-medium">
            {event.tickets_sold || 0} / {event.max_capacity}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Occupancy</Text>
          <Text className="font-medium">{occupancy}%</Text>
        </div>
      </div>
      {event.is_virtual && event.virtual_link && (
        <div className="px-6 py-3">
          <a
            href={event.virtual_link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Virtual link ↗
          </a>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default EventTicketingWidget;
