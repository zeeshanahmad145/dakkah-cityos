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
        async listSalesChannelMappings(
          _filter: any,
          _options?: any,
        ): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import ChannelModuleService from "../../../src/modules/channel/service";

describe("ChannelModuleService", () => {
  let service: ChannelModuleService;

  beforeEach(() => {
    service = new ChannelModuleService();
    jest.clearAllMocks();
  });

  describe("getChannelForRequest", () => {
    it("returns matching channel for tenant and type", async () => {
      jest.spyOn(service, "listSalesChannelMappings").mockResolvedValue([
        {
          id: "ch-1",
          tenant_id: "t-1",
          channel_type: "web",
          is_active: true,
        },
      ]);

      const result = await service.getChannelForRequest("t-1", "web");
      expect(result).toEqual(expect.objectContaining({ id: "ch-1" }));
    });

    it("returns null when no channel matches", async () => {
      jest.spyOn(service, "listSalesChannelMappings").mockResolvedValue([]);

      const result = await service.getChannelForRequest("t-1", "mobile");
      expect(result).toBeNull();
    });

    it("falls back to channel without nodeId when nodeId match fails", async () => {
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "ch-fallback",
            tenant_id: "t-1",
            channel_type: "web",
            is_active: true,
          },
        ]);

      const result = await service.getChannelForRequest("t-1", "web", "node-1");
      expect(result).toEqual(expect.objectContaining({ id: "ch-fallback" }));
    });
  });

  describe("listChannels", () => {
    it("returns all channels for a tenant", async () => {
      jest.spyOn(service, "listSalesChannelMappings").mockResolvedValue([
        { id: "ch-1", channel_type: "web" },
        { id: "ch-2", channel_type: "mobile" },
      ]);

      const result = await service.listChannels("t-1");
      expect(result).toHaveLength(2);
    });

    it("returns empty array when tenant has no channels", async () => {
      jest.spyOn(service, "listSalesChannelMappings").mockResolvedValue([]);

      const result = await service.listChannels("t-1");
      expect(result).toHaveLength(0);
    });
  });

  describe("getChannelAnalytics", () => {
    it("returns analytics for a valid channel", async () => {
      jest.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch-1",
        name: "Web Store",
        channel_type: "web",
        is_active: true,
        tenant_id: "t-1",
        config: {},
        metadata: {},
      });
      jest
        .spyOn(service, "listSalesChannelMappings")
        .mockResolvedValue([{ id: "ch-1" }, { id: "ch-2" }]);

      const result = await service.getChannelAnalytics("ch-1");
      expect(result!.channelName).toBe("Web Store");
      expect(result!.totalPeerChannels).toBe(2);
    });

    it("returns null when channel not found", async () => {
      jest
        .spyOn(service, "retrieveSalesChannelMapping")
        .mockResolvedValue(null);

      const result = await service.getChannelAnalytics("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("syncChannelInventory", () => {
    it("syncs new products to channel", async () => {
      jest.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch-1",
        is_active: true,
        config: { synced_products: ["p-1"] },
      });
      jest.spyOn(service, "updateSalesChannelMappings").mockResolvedValue({});

      const result = await service.syncChannelInventory("ch-1", [
        "p-1",
        "p-2",
        "p-3",
      ]);
      expect(result.syncedCount).toBe(2);
      expect(result.totalSynced).toBe(3);
      expect(result.newProductIds).toEqual(["p-2", "p-3"]);
    });

    it("throws when channel is not active", async () => {
      jest.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch-1",
        is_active: false,
        config: {},
      });

      await expect(
        service.syncChannelInventory("ch-1", ["p-1"]),
      ).rejects.toThrow("Channel is not active");
    });
  });

  describe("validateChannelConfig", () => {
    it("returns valid true when channel has all required fields", async () => {
      jest.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch-1",
        name: "Web Store",
        channel_type: "web",
        tenant_id: "t-1",
        medusa_sales_channel_id: "msc-1",
        config: { theme: "dark" },
      });

      const result = await service.validateChannelConfig("ch-1");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors when name is missing", async () => {
      jest.spyOn(service, "retrieveSalesChannelMapping").mockResolvedValue({
        id: "ch-1",
        name: "",
        channel_type: "web",
        tenant_id: "t-1",
        config: {},
      });

      const result = await service.validateChannelConfig("ch-1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Channel name is required");
    });
  });
});
