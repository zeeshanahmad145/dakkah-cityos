import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listSalesChannelMappings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveSalesChannelMapping(_id: string): Promise<any> {
          return null;
        }
        async createSalesChannelMappings(_data: any): Promise<any> {
          return {};
        }
        async updateSalesChannelMappings(_data: any): Promise<any> {
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

import ChannelModuleService from "../../../src/modules/channel/service";

describe("ChannelModuleService", () => {
  let service: ChannelModuleService;

  beforeEach(() => {
    service = new ChannelModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getChannelForRequest", () => {
    it("returns first matching channel", async () => {
      const channel = {
        id: "ch_1",
        tenant_id: "t1",
        channel_type: "web",
        is_active: true,
      };
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValue([channel]);

      const result = await service.getChannelForRequest("t1", "web");
      expect(result).toEqual(channel);
    });

    it("falls back to non-node channel when nodeId specified but no match", async () => {
      const fallbackChannel = {
        id: "ch_2",
        tenant_id: "t1",
        channel_type: "web",
        is_active: true,
        node_id: null,
      };
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([fallbackChannel]);

      const result = await service.getChannelForRequest("t1", "web", "node_1");
      expect(result).toEqual(fallbackChannel);
    });

    it("returns null when no channels found and no nodeId", async () => {
      vi.spyOn(service, "listSalesChannelMappings").mockResolvedValue([]);

      const result = await service.getChannelForRequest("t1", "web");
      expect(result).toBeNull();
    });
  });

  describe("getActiveChannels", () => {
    it("groups channels by type", async () => {
      const channels = [
        {
          id: "ch_1",
          name: "Web Store",
          channel_type: "web",
          medusa_sales_channel_id: "sc_1",
          node_id: null,
          description: "Main",
          is_active: true,
        },
        {
          id: "ch_2",
          name: "Mobile App",
          channel_type: "mobile",
          medusa_sales_channel_id: "sc_2",
          node_id: null,
          description: "App",
          is_active: true,
        },
      ];
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValue(channels);

      const result = await service.getActiveChannels("t1");
      expect(result.totalChannels).toBe(2);
      expect(result.channelsByType.web).toHaveLength(1);
      expect(result.channelsByType.mobile).toHaveLength(1);
    });
  });

  describe("getChannelByCode", () => {
    it("finds channel by code derived from name", async () => {
      const channel = {
        id: "ch_1",
        name: "Web Store",
        channel_type: "web",
        is_active: true,
        medusa_sales_channel_id: "sc_1",
        config: { theme: "dark" },
      };
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValue([channel]);

      const result = await service.getChannelByCode("web-store");
      expect(result).toMatchObject({
        id: "ch_1",
        code: "web-store",
        name: "Web Store",
      });
    });

    it("returns null when no match", async () => {
      vi.spyOn(service, "listSalesChannelMappings").mockResolvedValue([]);

      const result = await service.getChannelByCode("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockRejectedValue(new Error("fail"));

      const result = await service.getChannelByCode("test");
      expect(result).toBeNull();
    });
  });

  describe("validateChannelAccess", () => {
    it("returns true for active channel belonging to tenant", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        tenant_id: "t1",
        is_active: true,
      });

      const result = await service.validateChannelAccess("t1", "ch_1");
      expect(result).toBe(true);
    });

    it("returns false when tenant mismatch", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        tenant_id: "t2",
        is_active: true,
      });

      const result = await service.validateChannelAccess("t1", "ch_1");
      expect(result).toBe(false);
    });

    it("returns false when channel inactive", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        tenant_id: "t1",
        is_active: false,
      });

      const result = await service.validateChannelAccess("t1", "ch_1");
      expect(result).toBe(false);
    });

    it("returns false on error", async () => {
      jest
        .spyOn(service, "retrieveSalesChannelMapping")
        .mockRejectedValue(new Error("not found"));

      const result = await service.validateChannelAccess("t1", "ch_1");
      expect(result).toBe(false);
    });
  });

  describe("getChannelCapabilities", () => {
    it("returns capabilities for web channel", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        channel_type: "web",
      });

      const result = await service.getChannelCapabilities("ch_1");
      expect(result!.capabilities.supportsSearch).toBe(true);
      expect(result!.capabilities.supportsInventory).toBe(true);
      expect(result!.supportedPaymentMethods).toContain("credit_card");
    });

    it("returns api-specific capabilities", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        channel_type: "api",
      });

      const result = await service.getChannelCapabilities("ch_1");
      expect(result!.capabilities.supportsB2B).toBe(true);
      expect(result!.maxConcurrentUsers).toBe(1000);
      expect(result!.apiRateLimit).toBe("unlimited");
    });

    it("returns null when channel not found", async () => {
      jest
        .spyOn(service, "retrieveSalesChannelMapping")
        .mockRejectedValue(new Error("not found"));

      const result = await service.getChannelCapabilities("ch_1");
      expect(result).toBeNull();
    });
  });

  describe("syncChannelSettings", () => {
    it("merges settings into existing config", async () => {
      vi.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch_1",
        config: { existing: true },
      });
      vi.spyOn(service, "updateSalesChannelMappings").mockResolvedValue({});

      const result = await service.syncChannelSettings("ch_1", {
        newSetting: "val",
      });
      expect(result!.synced).toBe(true);
      expect(result!.syncedSettings).toContain("newSetting");
    });

    it("returns null on error", async () => {
      jest
        .spyOn(service, "retrieveSalesChannelMapping")
        .mockRejectedValue(new Error("fail"));

      const result = await service.syncChannelSettings("ch_1", {});
      expect(result).toBeNull();
    });
  });
});
