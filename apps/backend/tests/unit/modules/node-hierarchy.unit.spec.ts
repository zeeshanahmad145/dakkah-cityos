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
        async listNodes(_filter: any, _options?: any): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import NodeModuleService from "../../../src/modules/node/service";

describe("NodeModuleService – Hierarchy", () => {
  let service: NodeModuleService;

  beforeEach(() => {
    service = new NodeModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getNodePath", () => {
    it("returns full path from root to node", async () => {
      jest
        .spyOn(service, "retrieveNode")
        .mockResolvedValueOnce({
          id: "n3",
          name: "Zone A",
          type: "ZONE",
          depth: 2,
          parent_id: "n2",
        })
        .mockResolvedValueOnce({
          id: "n2",
          name: "District 1",
          type: "DISTRICT",
          depth: 1,
          parent_id: "n1",
        })
        .mockResolvedValueOnce({
          id: "n1",
          name: "Metro City",
          type: "CITY",
          depth: 0,
          parent_id: null,
        });

      const result = await service.getNodePath("n3");

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe("CITY");
      expect(result[2].type).toBe("ZONE");
    });

    it("returns single-element path for root node", async () => {
      vi.spyOn(service, "retrieveNode").mockResolvedValueOnce({
        id: "n1",
        name: "Metro City",
        type: "CITY",
        depth: 0,
        parent_id: null,
      });

      const result = await service.getNodePath("n1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Metro City");
    });

    it("returns empty path when node not found", async () => {
      vi.spyOn(service, "retrieveNode").mockResolvedValueOnce(null);

      const result = await service.getNodePath("nonexistent");
      expect(result).toHaveLength(0);
    });
  });

  describe("getNodeDescendants", () => {
    it("returns all descendants recursively", async () => {
      jest
        .spyOn(service, "listNodes")
        .mockResolvedValueOnce([
          { id: "n2", name: "District", parent_id: "n1" },
        ])
        .mockResolvedValueOnce([{ id: "n3", name: "Zone", parent_id: "n2" }])
        .mockResolvedValueOnce([]);

      const result = await service.getNodeDescendants("n1");
      expect(result).toHaveLength(2);
    });

    it("respects maxDepth parameter", async () => {
      jest
        .spyOn(service, "listNodes")
        .mockResolvedValueOnce([
          { id: "n2", name: "District", parent_id: "n1" },
        ]);

      const result = await service.getNodeDescendants("n1", 1);
      expect(result).toHaveLength(1);
    });

    it("returns empty array when node has no children", async () => {
      vi.spyOn(service, "listNodes").mockResolvedValue([]);

      const result = await service.getNodeDescendants("n1");
      expect(result).toHaveLength(0);
    });
  });

  describe("validateNodePlacement", () => {
    it("returns valid for correct parent-child relationship", async () => {
      vi.spyOn(service, "retrieveNode").mockResolvedValue({
        id: "n1",
        type: "CITY",
      });

      const result = await service.validateNodePlacement("n1", "DISTRICT");
      expect(result.valid).toBe(true);
    });

    it("returns invalid for wrong parent type", async () => {
      vi.spyOn(service, "retrieveNode").mockResolvedValue({
        id: "n1",
        type: "ZONE",
      });

      const result = await service.validateNodePlacement("n1", "DISTRICT");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("requires parent of type");
    });
  });
});
