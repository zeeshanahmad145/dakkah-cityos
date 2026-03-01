import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { Calendar, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useEvents,
  useCreateEvent,
  EventTicketing,
} from "../../hooks/use-events.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const EventsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "conference" as const,
    starts_at: "",
    ends_at: "",
    tenant_id: "",
    organizer_name: "",
    max_capacity: "",
  });

  const { data, isLoading } = useEvents();
  const createEvent = useCreateEvent();

  const events = data?.items || [];
  const upcoming = events.filter((e: any) => e.status !== "completed").length;
  const liveCount = events.filter((e: any) => e.status === "live").length;

  const stats = [
    {
      label: "Total Events",
      value: events.length,
      icon: <Calendar className="w-5 h-5" />,
    },
    { label: "Upcoming", value: upcoming, color: "blue" as const },
    { label: "Live", value: liveCount, color: "green" as const },
    {
      label: "Completed",
      value: events.filter((e: any) => e.status === "completed").length,
      color: "orange" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createEvent.mutateAsync({
        ...formData,
        max_capacity: formData.max_capacity
          ? Number(formData.max_capacity)
          : undefined,
      });
      toast.success("Event created");
      setShowCreate(false);
      setFormData({
        title: "",
        event_type: "conference",
        starts_at: "",
        ends_at: "",
        tenant_id: "",
        organizer_name: "",
        max_capacity: "",
      });
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Event",
      sortable: true,
      cell: (e: EventTicketing) => (
        <div>
          <Text className="font-medium">{e.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {e.organizer_name || ""}
          </Text>
        </div>
      ),
    },
    {
      key: "starts_at",
      header: "Date",
      sortable: true,
      cell: (e: EventTicketing) => e.starts_at?.split("T")[0] || "-",
    },
    {
      key: "event_type",
      header: "Type",
      cell: (e: EventTicketing) => <Badge color="grey">{e.event_type}</Badge>,
    },
    {
      key: "max_capacity",
      header: "Capacity",
      sortable: true,
      cell: (e: EventTicketing) => (e.max_capacity || 0).toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      cell: (e: EventTicketing) => <StatusBadge status={e.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Event Ticketing</Heading>
            <Text className="text-ui-fg-muted">
              Manage events, venues, and ticket sales
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Event
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={events}
          columns={columns}
          searchable
          searchPlaceholder="Search events..."
          searchKeys={["title", "event_type", "organizer_name"]}
          loading={isLoading}
          emptyMessage="No events found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Event"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createEvent.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value as any })
              }
              placeholder="Event title"
            />
          </div>
          <div>
            <Label htmlFor="organizer_name">Organizer Name</Label>
            <Input
              id="organizer_name"
              value={formData.organizer_name}
              onChange={(e) =>
                setFormData({ ...formData, organizer_name: e.target.value as any })
              }
              placeholder="Organizer name"
            />
          </div>
          <div>
            <Label htmlFor="tenant_id">Tenant ID</Label>
            <Input
              id="tenant_id"
              value={formData.tenant_id}
              onChange={(e) =>
                setFormData({ ...formData, tenant_id: e.target.value as any })
              }
              placeholder="Tenant ID"
            />
          </div>
          <div>
            <Label htmlFor="event_type">Event Type</Label>
            <select
              id="event_type"
              value={formData.event_type}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="concert">Concert</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="sports">Sports</option>
              <option value="festival">Festival</option>
              <option value="webinar">Webinar</option>
              <option value="meetup">Meetup</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="max_capacity">Max Capacity</Label>
            <Input
              id="max_capacity"
              type="number"
              value={formData.max_capacity}
              onChange={(e) =>
                setFormData({ ...formData, max_capacity: e.target.value as any })
              }
              placeholder="Max capacity"
            />
          </div>
          <div>
            <Label htmlFor="starts_at">Starts At</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) =>
                setFormData({ ...formData, starts_at: e.target.value as any })
              }
            />
          </div>
          <div>
            <Label htmlFor="ends_at">Ends At</Label>
            <Input
              id="ends_at"
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value as any })
              }
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Events", icon: Calendar });
export default EventsPage;
