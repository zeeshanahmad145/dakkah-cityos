import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listNotificationPreferences(_filter: any): Promise<any> {
          return [];
        }
        async retrieveNotificationPreference(_id: string): Promise<any> {
          return null;
        }
        async createNotificationPreferences(_data: any): Promise<any> {
          return {};
        }
        async updateNotificationPreferences(_data: any): Promise<any> {
          return {};
        }
        async deleteNotificationPreferences(_id: string): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import NotificationPreferencesModuleService from "../../../src/modules/notification-preferences/service";

describe("NotificationPreferencesModuleService", () => {
  let service: NotificationPreferencesModuleService;

  beforeEach(() => {
    service = new NotificationPreferencesModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getEffectivePreferences", () => {
    it("returns defaults when no user overrides exist", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([]);

      const result = await service.getEffectivePreferences(
        "cust-1",
        "tenant-1",
      );

      expect(result).toHaveLength(12);
      const emailMarketing = result.find(
        (p) => p.channel === "email" && p.category === "marketing",
      );
      expect(emailMarketing?.enabled).toBe(true);
      expect(emailMarketing?.source).toBe("default");
    });

    it("merges user overrides with defaults", async () => {
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue([
          { channel: "email", event_type: "marketing", enabled: false },
        ]);

      const result = await service.getEffectivePreferences(
        "cust-1",
        "tenant-1",
      );

      const emailMarketing = result.find(
        (p) => p.channel === "email" && p.category === "marketing",
      );
      expect(emailMarketing?.enabled).toBe(false);
      expect(emailMarketing?.source).toBe("user");

      const emailTransactional = result.find(
        (p) => p.channel === "email" && p.category === "transactional",
      );
      expect(emailTransactional?.enabled).toBe(true);
      expect(emailTransactional?.source).toBe("default");
    });
  });

  describe("updateChannelPreference", () => {
    it("updates all preferences for a valid channel", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "p1", channel: "email", enabled: true },
        { id: "p2", channel: "email", enabled: true },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({});

      const result = await service.updateChannelPreference(
        "cust-1",
        "email",
        false,
      );

      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(result.channel).toBe("email");
      expect(result.enabled).toBe(false);
      expect(result.updated).toBe(2);
    });

    it("throws for invalid channel", async () => {
      await expect(
        service.updateChannelPreference("cust-1", "telegram", true),
      ).rejects.toThrow("Invalid channel");
    });
  });

  describe("shouldNotify", () => {
    it("returns true when channel/category is enabled", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([]);

      const result = await service.shouldNotify(
        "cust-1",
        "tenant-1",
        "email",
        "transactional",
      );

      expect(result).toBe(true);
    });

    it("returns false when channel/category is disabled by default", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([]);

      const result = await service.shouldNotify(
        "cust-1",
        "tenant-1",
        "sms",
        "marketing",
      );

      expect(result).toBe(false);
    });

    it("returns false when user has disabled the preference", async () => {
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue([
          { channel: "email", event_type: "transactional", enabled: false },
        ]);

      const result = await service.shouldNotify(
        "cust-1",
        "tenant-1",
        "email",
        "transactional",
      );

      expect(result).toBe(false);
    });
  });

  describe("bulkOptOut", () => {
    it("opts out of all channels when none specified", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "p1", channel: "email", enabled: true },
        { id: "p2", channel: "sms", enabled: true },
        { id: "p3", channel: "push", enabled: true },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({});

      const result = await service.bulkOptOut("cust-1");

      expect(updateSpy).toHaveBeenCalledTimes(3);
      expect(result.optedOut).toBe(3);
      expect(result.channels).toEqual(["email", "sms", "push", "in_app"]);
    });

    it("opts out of only specified channels", async () => {
      vi.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "p1", channel: "email", enabled: true },
        { id: "p2", channel: "sms", enabled: true },
        { id: "p3", channel: "push", enabled: true },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({});

      const result = await service.bulkOptOut("cust-1", ["email"]);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(result.optedOut).toBe(1);
      expect(result.channels).toEqual(["email"]);
    });
  });
});
