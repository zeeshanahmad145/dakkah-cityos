import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge, Button, toast } from "@medusajs/ui";
import { PuzzleSolid } from "@medusajs/icons";
import { useEffect, useState } from "react";

type WhiteLabelConfig = {
  id: string;
  tenant_id: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
  custom_domain: string;
  theme_mode: string;
  is_active: boolean;
};

const WhiteLabelPage = () => {
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/white-label")
      .then((r) => r.json())
      .then((d) => setConfigs(d?.white_label_configs || []))
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = configs.filter((c) => c.is_active).length;

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base flex items-center justify-between">
        <div>
          <Heading level="h1">White Label</Heading>
          <Text className="text-ui-fg-muted">
            Tenant branding, custom domains, and theme configuration
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-6 border-b border-ui-border-base">
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-muted text-sm">Total Configs</Text>
          <Heading level="h2">{configs.length}</Heading>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-muted text-sm">Active</Text>
          <Heading level="h2">{activeCount}</Heading>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-muted text-sm">Custom Domains</Text>
          <Heading level="h2">
            {configs.filter((c) => c.custom_domain).length}
          </Heading>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : configs.length === 0 ? (
          <Text className="text-ui-fg-muted">
            No white label configurations found.
          </Text>
        ) : (
          <div className="space-y-3">
            {configs.map((c) => (
              <div
                key={c.id}
                className="border border-ui-border-base rounded-lg p-4 flex items-center gap-4"
              >
                {c.logo_url && (
                  <img
                    src={c.logo_url}
                    alt="logo"
                    className="h-10 w-10 rounded object-contain border border-ui-border-base"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Text className="font-medium">{c.brand_name}</Text>
                    <Badge color={c.is_active ? "green" : "grey"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge color="blue">{c.theme_mode}</Badge>
                  </div>
                  <Text className="text-ui-fg-muted text-sm">
                    {c.custom_domain || "No custom domain"}
                  </Text>
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-6 h-6 rounded-full border border-ui-border-base"
                    style={{ background: c.primary_color }}
                    title={`Primary: ${c.primary_color}`}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-ui-border-base"
                    style={{ background: c.secondary_color }}
                    title={`Secondary: ${c.secondary_color}`}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    fetch(`/admin/white-label/${c.id}/publish`, {
                      method: "POST",
                    })
                      .then(() => toast.success("Theme published"))
                      .catch(() => toast.error("Publish failed"));
                  }}
                >
                  Publish
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "White Label",
  icon: PuzzleSolid,
});
export default WhiteLabelPage;
