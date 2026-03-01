import { MedusaService } from "@medusajs/framework/utils";
import NotificationPreference from "./models/notification-preference";

type NotificationPreferenceRecord = {
  id: string;
  customer_id: string;
  tenant_id: string;
  channel: string;
  event_type: string;
  enabled: boolean;
  frequency: string;
  metadata: Record<string, unknown> | null;
};

type EffectivePreference = {
  channel: string;
  category: string;
  enabled: boolean;
  source: "user" | "default";
};

interface NotificationPreferencesServiceBase {
  listNotificationPreferences(
    filters: Record<string, unknown>,
  ): Promise<NotificationPreferenceRecord[]>;
  createNotificationPreferences(
    data: Record<string, unknown>,
  ): Promise<NotificationPreferenceRecord>;
  updateNotificationPreferences(
    data: { id: string } & Record<string, unknown>,
  ): Promise<NotificationPreferenceRecord>;
}

class NotificationPreferencesModuleService extends MedusaService({
  NotificationPreference,
}) {
  async getByCustomer(
    customerId: string,
    tenantId: string,
  ): Promise<NotificationPreferenceRecord[]> {
    return (
      this as unknown as NotificationPreferencesServiceBase
    ).listNotificationPreferences({
      customer_id: customerId,
      tenant_id: tenantId,
    });
  }

  async updatePreference(data: {
    customerId: string;
    tenantId: string;
    channel: string;
    eventType: string;
    enabled: boolean;
    frequency?: string;
  }): Promise<NotificationPreferenceRecord> {
    const svc = this as unknown as NotificationPreferencesServiceBase;
    const existing = await svc.listNotificationPreferences({
      customer_id: data.customerId,
      tenant_id: data.tenantId,
      channel: data.channel,
      event_type: data.eventType,
    });

    if (existing.length > 0) {
      return svc.updateNotificationPreferences({
        id: existing[0].id,
        enabled: data.enabled,
        frequency: data.frequency ?? existing[0].frequency,
      });
    }

    return svc.createNotificationPreferences({
      customer_id: data.customerId,
      tenant_id: data.tenantId,
      channel: data.channel,
      event_type: data.eventType,
      enabled: data.enabled,
      frequency: data.frequency ?? "immediate",
    });
  }

  async getEnabledChannelsForEvent(
    customerId: string,
    tenantId: string,
    eventType: string,
  ): Promise<string[]> {
    const prefs = await (
      this as unknown as NotificationPreferencesServiceBase
    ).listNotificationPreferences({
      customer_id: customerId,
      tenant_id: tenantId,
      event_type: eventType,
      enabled: true,
    });

    return prefs.map((p) => p.channel);
  }

  async initializeDefaults(
    customerId: string,
    tenantId: string,
  ): Promise<NotificationPreferenceRecord[]> {
    const defaults: Array<{
      channel: string;
      event_type: string;
      enabled: boolean;
      frequency: string;
    }> = [
      {
        channel: "email",
        event_type: "order_update",
        enabled: true,
        frequency: "immediate",
      },
      {
        channel: "email",
        event_type: "shipping",
        enabled: true,
        frequency: "immediate",
      },
      {
        channel: "email",
        event_type: "promotion",
        enabled: true,
        frequency: "weekly_digest",
      },
      {
        channel: "email",
        event_type: "review_request",
        enabled: true,
        frequency: "immediate",
      },
      {
        channel: "email",
        event_type: "price_drop",
        enabled: true,
        frequency: "daily_digest",
      },
      {
        channel: "email",
        event_type: "back_in_stock",
        enabled: true,
        frequency: "immediate",
      },
      {
        channel: "email",
        event_type: "newsletter",
        enabled: true,
        frequency: "weekly_digest",
      },
      {
        channel: "in_app",
        event_type: "order_update",
        enabled: true,
        frequency: "immediate",
      },
      {
        channel: "in_app",
        event_type: "shipping",
        enabled: true,
        frequency: "immediate",
      },
    ];

    const svc = this as unknown as NotificationPreferencesServiceBase;
    const created: NotificationPreferenceRecord[] = [];
    for (const def of defaults) {
      const pref = await svc.createNotificationPreferences({
        customer_id: customerId,
        tenant_id: tenantId,
        ...def,
      });
      created.push(pref);
    }

    return created;
  }

  async bulkUpdate(
    customerId: string,
    tenantId: string,
    updates: Array<{
      channel: string;
      eventType: string;
      enabled: boolean;
      frequency?: string;
    }>,
  ): Promise<NotificationPreferenceRecord[]> {
    const results: NotificationPreferenceRecord[] = [];
    for (const update of updates) {
      const result = await this.updatePreference({
        customerId,
        tenantId,
        channel: update.channel,
        eventType: update.eventType,
        enabled: update.enabled,
        frequency: update.frequency,
      } as any);
      results.push(result);
    }
    return results;
  }

  async getEffectivePreferences(
    customerId: string,
    tenantId: string,
  ): Promise<EffectivePreference[]> {
    const defaultPrefs: Array<{
      channel: string;
      category: string;
      enabled: boolean;
    }> = [
      { channel: "email", category: "transactional", enabled: true },
      { channel: "email", category: "marketing", enabled: true },
      { channel: "email", category: "security", enabled: true },
      { channel: "sms", category: "transactional", enabled: false },
      { channel: "sms", category: "marketing", enabled: false },
      { channel: "sms", category: "security", enabled: true },
      { channel: "push", category: "transactional", enabled: true },
      { channel: "push", category: "marketing", enabled: false },
      { channel: "push", category: "security", enabled: true },
      { channel: "in_app", category: "transactional", enabled: true },
      { channel: "in_app", category: "marketing", enabled: true },
      { channel: "in_app", category: "security", enabled: true },
    ];

    const prefList = await (
      this as unknown as NotificationPreferencesServiceBase
    ).listNotificationPreferences({
      customer_id: customerId,
      tenant_id: tenantId,
    });

    return defaultPrefs.map((def): EffectivePreference => {
      const override = prefList.find(
        (p) => p.channel === def.channel && p.event_type === def.category,
      );
      return {
        channel: def.channel,
        category: def.category,
        enabled: override ? override.enabled : def.enabled,
        source: override ? "user" : "default",
      };
    });
  }

  async updateChannelPreference(
    customerId: string,
    channel: string,
    enabled: boolean,
  ): Promise<{ channel: string; enabled: boolean; updated: number }> {
    const validChannels = ["email", "sms", "push", "in_app"];
    if (!validChannels.includes(channel)) {
      throw new Error(
        `Invalid channel. Must be one of: ${validChannels.join(", ")}`,
      );
    }

    const svc = this as unknown as NotificationPreferencesServiceBase;
    const existing = await svc.listNotificationPreferences({
      customer_id: customerId,
      channel,
    });

    const results: NotificationPreferenceRecord[] = [];
    for (const pref of existing) {
      const updated = await svc.updateNotificationPreferences({
        id: pref.id,
        enabled,
      });
      results.push(updated);
    }

    return { channel, enabled, updated: results.length };
  }

  async updateCategoryPreference(
    customerId: string,
    category: string,
    enabled: boolean,
  ): Promise<{ category: string; enabled: boolean; updated: number }> {
    const validCategories = ["marketing", "transactional", "security"];
    if (!validCategories.includes(category)) {
      throw new Error(
        `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      );
    }

    const svc = this as unknown as NotificationPreferencesServiceBase;
    const existing = await svc.listNotificationPreferences({
      customer_id: customerId,
      event_type: category,
    });

    const results: NotificationPreferenceRecord[] = [];
    for (const pref of existing) {
      const updated = await svc.updateNotificationPreferences({
        id: pref.id,
        enabled,
      });
      results.push(updated);
    }

    return { category, enabled, updated: results.length };
  }

  async shouldNotify(
    customerId: string,
    tenantId: string,
    channel: string,
    category: string,
  ): Promise<boolean> {
    const effective = await this.getEffectivePreferences(customerId, tenantId);
    const match = effective.find(
      (p) => p.channel === channel && p.category === category,
    );
    return match ? match.enabled : false;
  }

  async bulkOptOut(
    customerId: string,
    channels?: string[],
  ): Promise<{ optedOut: number; channels: string[] }> {
    const targetChannels = channels ?? ["email", "sms", "push", "in_app"];
    const svc = this as unknown as NotificationPreferencesServiceBase;
    const existing = await svc.listNotificationPreferences({
      customer_id: customerId,
    });

    const results: NotificationPreferenceRecord[] = [];
    for (const pref of existing) {
      if (targetChannels.includes(pref.channel)) {
        const updated = await svc.updateNotificationPreferences({
          id: pref.id,
          enabled: false,
        });
        results.push(updated);
      }
    }

    return { optedOut: results.length, channels: targetChannels };
  }
}

export default NotificationPreferencesModuleService;
