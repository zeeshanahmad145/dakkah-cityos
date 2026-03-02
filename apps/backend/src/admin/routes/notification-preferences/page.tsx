import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { client } from "../../lib/client";
import { BellAlertDone } from "@medusajs/icons";

const NotificationPreferencesPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      client.get<{ notification_preferences: any[] }>(
        "/admin/custom/notification-preferences?limit=50",
      ),
  });

  const prefs = data?.data?.notification_preferences ?? [];

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Notification Preferences</Heading>
          <Text className="text-ui-fg-muted text-sm mt-1">
            Per-customer channel opt-in/opt-out settings
          </Text>
        </div>
        <Button size="small" variant="secondary">
          Export CSV
        </Button>
      </div>
      {isLoading && <Text>Loading...</Text>}
      {isError && (
        <Text className="text-ui-fg-error">
          Failed to load notification preferences.
        </Text>
      )}
      {!isLoading && !isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer ID</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>SMS</Table.HeaderCell>
              <Table.HeaderCell>Push</Table.HeaderCell>
              <Table.HeaderCell>In-App</Table.HeaderCell>
              <Table.HeaderCell>WhatsApp</Table.HeaderCell>
              <Table.HeaderCell>Language</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {prefs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-muted py-8">
                  No notification preferences found.
                </Table.Cell>
              </Table.Row>
            ) : (
              prefs.map((p: any) => (
                <Table.Row key={p.id}>
                  <Table.Cell className="font-mono text-sm">
                    {p.customer_id}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={p.email_enabled ? "green" : "grey"}>
                      {p.email_enabled ? "On" : "Off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={p.sms_enabled ? "green" : "grey"}>
                      {p.sms_enabled ? "On" : "Off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={p.push_enabled ? "green" : "grey"}>
                      {p.push_enabled ? "On" : "Off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={p.in_app_enabled ? "green" : "grey"}>
                      {p.in_app_enabled ? "On" : "Off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={p.whatsapp_enabled ? "green" : "grey"}>
                      {p.whatsapp_enabled ? "On" : "Off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{p.language ?? "—"}</Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Notification Preferences",
  icon: BellAlertDone,
});

export default NotificationPreferencesPage;
