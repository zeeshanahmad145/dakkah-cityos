jest.mock("@medusajs/framework/utils", () => {
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
        async listNodes(_filter: any): Promise<any> {
          return [];
        }
        async retrieveNode(_id: string): Promise<any> {
          return null;
        }
        async createNodes(_data: any): Promise<any> {
          return {};
        }
        async updateNodes(_data: any): Promise<any> {
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

import NodeModuleService from "../../../src/modules/node/service";

describe("NodeModuleService", () => {
  let service: NodeModuleService;

  beforeEach(() => {
    service = new NodeModuleService();
    jest.clearAllMocks();
  });

  describe("listNodesByTenant", () => {
    it("lists nodes filtered by tenant", async () => {
      const nodes = [{ id: "n1", tenant_id: "t1" }];
      jest.spyOn(service, "listNodes").mockResolvedValue(nodes);

      const result = await service.listNodesByTenant("t1");
      expect(result).toEqual(nodes);
    });

    it("passes additional filters", async () => {
      const listSpy = jest.spyOn(service, "listNodes").mockResolvedValue([]);

      await service.listNodesByTenant("t1", { type: "CITY" });
      expect(listSpy).toHaveBeenCalledWith({ tenant_id: "t1", type: "CITY" });
    });
  });

  describe("listChildren", () => {
    it("returns children of a node", async () => {
      const children = [{ id: "n2", parent_id: "n1" }];
      jest.spyOn(service, "listNodes").mockResolvedValue(children);

      const result = await service.listChildren("n1");
      expect(result).toEqual(children);
    });
  });

  describe("getAncestors", () => {
    it("returns ancestors in root-to-parent order", async () => {
      const city = { id: "city_1", name: "Riyadh", parent_id: null };
      const district = {
        id: "dist_1",
        name: "District A",
        parent_id: "city_1",
      };
      const zone = { id: "zone_1", name: "Zone B", parent_id: "dist_1" };

      jest
        .spyOn(service, "retrieveNode")
        .mockImplementation(async (id: string) => {
          if (id === "zone_1") return zone;
          if (id === "dist_1") return district;
          if (id === "city_1") return city;
          return null;
        });

      const result = await service.getAncestors("zone_1");
      expect(result).toEqual([city, district]);
    });

    it("returns empty array for root node", async () => {
      jest
        .spyOn(service, "retrieveNode")
        .mockResolvedValue({ id: "city_1", parent_id: null });

      const result = await service.getAncestors("city_1");
      expect(result).toEqual([]);
    });
  });

  describe("getDescendants", () => {
    it("returns all descendants via BFS", async () => {
      const child1 = { id: "c1", parent_id: "root" };
      const child2 = { id: "c2", parent_id: "root" };
      const grandchild = { id: "gc1", parent_id: "c1" };

      jest
        .spyOn(service, "listNodes")
        .mockResolvedValueOnce([child1, child2])
        .mockResolvedValueOnce([grandchild])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDescendants("root");
      expect(result).toHaveLength(3);
    });
  });

  describe("getBreadcrumbs", () => {
    it("returns breadcrumb path from root to node", async () => {
      const city = {
        id: "city_1",
        name: "Riyadh",
        slug: "riyadh",
        type: "CITY",
        depth: 0,
        parent_id: null,
      };
      const district = {
        id: "dist_1",
        name: "District A",
        slug: "district-a",
        type: "DISTRICT",
        depth: 1,
        parent_id: "city_1",
      };

      jest
        .spyOn(service, "retrieveNode")
        .mockImplementation(async (id: string) => {
          if (id === "dist_1") return district;
          if (id === "city_1") return city;
          return null;
        });

      const result = await service.getBreadcrumbs("dist_1");
      expect(result).toEqual([
        {
          id: "city_1",
          name: "Riyadh",
          slug: "riyadh",
          type: "CITY",
          depth: 0,
        },
        {
          id: "dist_1",
          name: "District A",
          slug: "district-a",
          type: "DISTRICT",
          depth: 1,
        },
      ]);
    });
  });

  describe("validateParentChild", () => {
    it("validates CITY -> DISTRICT", () => {
      expect(service.validateParentChild("CITY", "DISTRICT")).toBe(true);
    });

    it("rejects invalid parent-child", () => {
      expect(service.validateParentChild("CITY", "ZONE")).toBe(false);
    });

    it("returns false for unknown parent type", () => {
      expect(service.validateParentChild("UNKNOWN", "CITY")).toBe(false);
    });
  });

  describe("createNodeWithValidation", () => {
    it("creates root node without parent", async () => {
      jest
        .spyOn(service, "createNodes")
        .mockResolvedValue({ id: "n1", type: "CITY" });

      const result = await service.createNodeWithValidation({
        tenant_id: "t1",
        name: "Riyadh",
        slug: "riyadh",
        type: "CITY",
      });
      expect(result.type).toBe("CITY");
    });

    it("throws for invalid node type", async () => {
      await expect(
        service.createNodeWithValidation({
          tenant_id: "t1",
          name: "Test",
          slug: "test",
          type: "INVALID",
        }),
      ).rejects.toThrow("Invalid node type: INVALID");
    });

    it("throws when parent required but missing", async () => {
      await expect(
        service.createNodeWithValidation({
          tenant_id: "t1",
          name: "Test",
          slug: "test",
          type: "DISTRICT",
        }),
      ).rejects.toThrow("requires a parent");
    });

    it("throws when root node has parent", async () => {
      await expect(
        service.createNodeWithValidation({
          tenant_id: "t1",
          name: "Test",
          slug: "test",
          type: "CITY",
          parent_id: "p1",
        }),
      ).rejects.toThrow("cannot have a parent");
    });

    it("throws for invalid hierarchy", async () => {
      jest.spyOn(service, "retrieveNode").mockResolvedValue({
        id: "p1",
        type: "CITY",
        tenant_id: "t1",
      });
      jest.spyOn(service, "listNodes").mockResolvedValue([]);

      await expect(
        service.createNodeWithValidation({
          tenant_id: "t1",
          name: "Test",
          slug: "test",
          type: "ZONE",
          parent_id: "p1",
        }),
      ).rejects.toThrow("Invalid hierarchy");
    });

    it("throws when parent belongs to different tenant", async () => {
      jest.spyOn(service, "retrieveNode").mockResolvedValue({
        id: "p1",
        type: "CITY",
        tenant_id: "other_tenant",
        name: "City",
        slug: "city",
        depth: 0,
        parent_id: null,
      });

      await expect(
        service.createNodeWithValidation({
          tenant_id: "t1",
          name: "District",
          slug: "district",
          type: "DISTRICT",
          parent_id: "p1",
        }),
      ).rejects.toThrow("different tenant");
    });
  });
});
