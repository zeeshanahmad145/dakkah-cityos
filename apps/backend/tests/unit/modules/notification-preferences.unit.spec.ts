jest.mock("@medusajs/framework/utils", () => {
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
    service = new NotificationPreferencesModuleService();
    jest.clearAllMocks();
  });

  describe("getByCustomer", () => {
    it("returns preferences for a customer", async () => {
      const prefs = [
        {
          id: "pref-1",
          channel: "email",
          event_type: "order_update",
          enabled: true,
        },
        {
          id: "pref-2",
          channel: "sms",
          event_type: "shipping",
          enabled: false,
        },
      ];
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue(prefs);

      const result = await service.getByCustomer("cust-1", "tenant-1");

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe("email");
    });

    it("returns empty array when no preferences exist", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([]);

      const result = await service.getByCustomer("cust-1", "tenant-1");

      expect(result).toEqual([]);
    });
  });

  describe("updatePreference", () => {
    it("updates an existing preference", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        {
          id: "pref-1",
          channel: "email",
          event_type: "order_update",
          enabled: true,
          frequency: "immediate",
        },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({ id: "pref-1", enabled: false });

      const result = await service.updatePreference({
        customerId: "cust-1",
        tenantId: "tenant-1",
        channel: "email",
        eventType: "order_update",
        enabled: false,
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "pref-1", enabled: false }),
      );
    });

    it("creates a new preference when none exists", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createNotificationPreferences")
        .mockResolvedValue({ id: "pref-new" });

      await service.updatePreference({
        customerId: "cust-1",
        tenantId: "tenant-1",
        channel: "push",
        eventType: "promotion",
        enabled: true,
        frequency: "daily_digest",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          channel: "push",
          event_type: "promotion",
          enabled: true,
          frequency: "daily_digest",
        }),
      );
    });
  });

  describe("getEnabledChannelsForEvent", () => {
    it("returns only enabled channels for an event type", async () => {
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue([{ channel: "email" }, { channel: "in_app" }]);

      const result = await service.getEnabledChannelsForEvent(
        "cust-1",
        "tenant-1",
        "order_update",
      );

      expect(result).toEqual(["email", "in_app"]);
    });
  });

  describe("initializeDefaults", () => {
    it("creates default notification preferences for a new customer", async () => {
      const createSpy = jest
        .spyOn(service, "createNotificationPreferences")
        .mockResolvedValue({ id: "pref-new" });

      const result = await service.initializeDefaults("cust-1", "tenant-1");

      expect(createSpy).toHaveBeenCalledTimes(9);
      expect(result).toHaveLength(9);
    });
  });

  describe("updateChannelPreference", () => {
    it("throws on invalid channel", async () => {
      await expect(
        service.updateChannelPreference("cust-1", "pigeon", true),
      ).rejects.toThrow("Invalid channel");
    });

    it("updates all preferences for a valid channel", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "pref-1", channel: "email" },
        { id: "pref-2", channel: "email" },
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
      expect(result).toEqual({ channel: "email", enabled: false, updated: 2 });
    });
  });

  describe("updateCategoryPreference", () => {
    it("throws on invalid category", async () => {
      await expect(
        service.updateCategoryPreference("cust-1", "unknown", true),
      ).rejects.toThrow("Invalid category");
    });
  });

  describe("shouldNotify", () => {
    it("returns true when preference is enabled", async () => {
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue([
          { channel: "email", event_type: "transactional", enabled: true },
        ]);

      const result = await service.shouldNotify(
        "cust-1",
        "tenant-1",
        "email",
        "transactional",
      );

      expect(result).toBe(true);
    });

    it("returns false when preference is disabled by user override", async () => {
      jest
        .spyOn(service, "listNotificationPreferences")
        .mockResolvedValue([
          { channel: "email", event_type: "marketing", enabled: false },
        ]);

      const result = await service.shouldNotify(
        "cust-1",
        "tenant-1",
        "email",
        "marketing",
      );

      expect(result).toBe(false);
    });
  });

  describe("bulkOptOut", () => {
    it("opts out of all channels when none specified", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "p1", channel: "email" },
        { id: "p2", channel: "sms" },
        { id: "p3", channel: "push" },
      ]);
      jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({});

      const result = await service.bulkOptOut("cust-1");

      expect(result.optedOut).toBe(3);
      expect(result.channels).toEqual(["email", "sms", "push", "in_app"]);
    });

    it("opts out of specific channels only", async () => {
      jest.spyOn(service, "listNotificationPreferences").mockResolvedValue([
        { id: "p1", channel: "email" },
        { id: "p2", channel: "sms" },
        { id: "p3", channel: "push" },
      ]);
      jest
        .spyOn(service, "updateNotificationPreferences")
        .mockResolvedValue({});

      const result = await service.bulkOptOut("cust-1", ["email"]);

      expect(result.optedOut).toBe(1);
      expect(result.channels).toEqual(["email"]);
    });
  });
});
