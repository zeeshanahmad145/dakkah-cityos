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
        async retrieveGovernanceAuthority(_id: string): Promise<any> {
          return null;
        }
        async listGovernanceAuthorities(_filter: any): Promise<any> {
          return [];
        }
      },
    model: {
      define: () => ({
        indexes: () => ({}),
      }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
    },
  };
});

import GovernanceModuleService from "../../../src/modules/governance/service";

describe("GovernanceModuleService", () => {
  let service: GovernanceModuleService;

  beforeEach(() => {
    service = new GovernanceModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
  });

  describe("resolveEffectivePolicies", () => {
    it("returns empty object when no authorities found", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({});
    });

    it("returns region policies when only region authority exists", async () => {
      const regionPolicies = {
        commerce: { allowed: true },
        tax: { rate: 0.1 },
      };
      jest
        .spyOn(service, "listGovernanceAuthorities")
        .mockResolvedValue([
          { id: "r1", type: "region", policies: regionPolicies },
        ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual(regionPolicies);
    });

    it("deep merges country policies over region policies", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "r1",
          type: "region",
          policies: {
            commerce: { allowed: true, maxItems: 100 },
            tax: { rate: 0.1 },
          },
        },
        {
          id: "c1",
          type: "country",
          policies: {
            commerce: { maxItems: 50 },
            customs: { required: true },
          },
        },
      ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({
        commerce: { allowed: true, maxItems: 50 },
        tax: { rate: 0.1 },
        customs: { required: true },
      });
    });

    it("merges region + country + multiple authorities sorted by jurisdiction_level", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "r1",
          type: "region",
          policies: { commerce: { allowed: true, maxItems: 100 } },
        },
        {
          id: "c1",
          type: "country",
          policies: { commerce: { maxItems: 50 } },
        },
        {
          id: "a2",
          type: "authority",
          jurisdiction_level: 20,
          policies: { commerce: { maxItems: 10 } },
        },
        {
          id: "a1",
          type: "authority",
          jurisdiction_level: 10,
          policies: { commerce: { maxItems: 25, localRule: true } },
        },
      ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({
        commerce: { allowed: true, maxItems: 10, localRule: true },
      });
    });

    it("wraps non-array authorities response (single object) in array", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue({
        id: "r1",
        type: "region",
        policies: { tax: { rate: 0.2 } },
      });

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({ tax: { rate: 0.2 } });
    });

    it("filters out falsy values when wrapping non-array response", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue(null);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({});
    });

    it("skips authorities that have no policies field", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        { id: "r1", type: "region" },
        {
          id: "c1",
          type: "country",
          policies: { commerce: { allowed: true } },
        },
        { id: "a1", type: "authority", jurisdiction_level: 1 },
      ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({ commerce: { allowed: true } });
    });

    it("skips region with no policies but merges country policies", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        { id: "r1", type: "region" },
        {
          id: "c1",
          type: "country",
          policies: { tax: { rate: 0.15 } },
        },
      ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({ tax: { rate: 0.15 } });
    });

    describe("deepMerge behavior (tested indirectly)", () => {
      it("deeply merges nested objects", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: {
              commerce: {
                shipping: { domestic: true, international: false },
                payments: { credit: true },
              },
            },
          },
          {
            id: "c1",
            type: "country",
            policies: {
              commerce: {
                shipping: { international: true },
                payments: { debit: true },
              },
            },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({
          commerce: {
            shipping: { domestic: true, international: true },
            payments: { credit: true, debit: true },
          },
        });
      });

      it("arrays in source override arrays in target", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: {
              allowedCategories: ["food", "electronics"],
            },
          },
          {
            id: "c1",
            type: "country",
            policies: {
              allowedCategories: ["food"],
            },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({
          allowedCategories: ["food"],
        });
      });

      it("primitives in source override primitives in target", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: {
              maxWeight: 100,
              currency: "USD",
              enabled: true,
            },
          },
          {
            id: "c1",
            type: "country",
            policies: {
              maxWeight: 50,
              currency: "EUR",
              enabled: false,
            },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({
          maxWeight: 50,
          currency: "EUR",
          enabled: false,
        });
      });

      it("source null overrides target object", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: {
              commerce: { allowed: true },
            },
          },
          {
            id: "c1",
            type: "country",
            policies: {
              commerce: null,
            },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({ commerce: null });
      });

      it("source object merges into target when both are objects", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: { a: { b: { c: 1 } } },
          },
          {
            id: "c1",
            type: "country",
            policies: { a: { b: { d: 2 } } },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
      });

      it("array in source replaces object in target", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: { items: { nested: true } },
          },
          {
            id: "c1",
            type: "country",
            policies: { items: [1, 2, 3] },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({ items: [1, 2, 3] });
      });

      it("object in source replaces array in target", async () => {
        vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
          {
            id: "r1",
            type: "region",
            policies: { items: [1, 2, 3] },
          },
          {
            id: "c1",
            type: "country",
            policies: { items: { nested: true } },
          },
        ]);

        const result = await service.resolveEffectivePolicies("tenant-1");
        expect(result).toEqual({ items: { nested: true } });
      });
    });

    it("authorities without jurisdiction_level default to 0 for sorting", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "a1",
          type: "authority",
          policies: { base: true },
        },
        {
          id: "a2",
          type: "authority",
          jurisdiction_level: 5,
          policies: { override: true },
        },
      ]);

      const result = await service.resolveEffectivePolicies("tenant-1");
      expect(result).toEqual({ base: true, override: true });
    });

    it("passes tenant_id filter to listGovernanceAuthorities", async () => {
      const listSpy = jest
        .spyOn(service, "listGovernanceAuthorities")
        .mockResolvedValue([]);

      await service.resolveEffectivePolicies("my-tenant");
      expect(listSpy).toHaveBeenCalledWith({ tenant_id: "my-tenant" });
    });
  });

  describe("buildAuthorityChain", () => {
    it("returns single authority with no parent", async () => {
      const authority = { id: "a1", name: "Root", parent_authority_id: null };
      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockResolvedValue(authority);

      const result = await service.buildAuthorityChain("a1");
      expect(result).toEqual([authority]);
    });

    it("returns chain of 3 authorities ordered from root to leaf", async () => {
      const root = { id: "root", name: "Root", parent_authority_id: null };
      const mid = { id: "mid", name: "Mid", parent_authority_id: "root" };
      const leaf = { id: "leaf", name: "Leaf", parent_authority_id: "mid" };

      const retrieveSpy = jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockImplementation(async (id: string) => {
          if (id === "leaf") return leaf;
          if (id === "mid") return mid;
          if (id === "root") return root;
          return null;
        });

      const result = await service.buildAuthorityChain("leaf");
      expect(result).toEqual([root, mid, leaf]);
      expect(retrieveSpy).toHaveBeenCalledTimes(3);
    });

    it("returns empty array when authority not found", async () => {
      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockResolvedValue(null);

      const result = await service.buildAuthorityChain("nonexistent");
      expect(result).toEqual([]);
    });

    it("stops walking when a parent is not found", async () => {
      const child = {
        id: "child",
        name: "Child",
        parent_authority_id: "missing",
      };

      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockImplementation(async (id: string) => {
          if (id === "child") return child;
          return null;
        });

      const result = await service.buildAuthorityChain("child");
      expect(result).toEqual([child]);
    });

    it("handles authority with empty string parent_authority_id", async () => {
      const authority = { id: "a1", name: "Auth", parent_authority_id: "" };
      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockResolvedValue(authority);

      const result = await service.buildAuthorityChain("a1");
      expect(result).toEqual([authority]);
    });

    it("handles authority with undefined parent_authority_id", async () => {
      const authority = { id: "a1", name: "Auth" };
      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockResolvedValue(authority);

      const result = await service.buildAuthorityChain("a1");
      expect(result).toEqual([authority]);
    });
  });

  describe("getCommercePolicy", () => {
    it("returns commerce key from effective policies", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "r1",
          type: "region",
          policies: {
            commerce: { allowed: true, maxItems: 100 },
            tax: { rate: 0.1 },
          },
        },
      ]);

      const result = await service.getCommercePolicy("tenant-1");
      expect(result).toEqual({ allowed: true, maxItems: 100 });
    });

    it("returns empty object when no commerce policy exists", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "r1",
          type: "region",
          policies: { tax: { rate: 0.1 } },
        },
      ]);

      const result = await service.getCommercePolicy("tenant-1");
      expect(result).toEqual({});
    });

    it("returns empty object when no authorities exist", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([]);

      const result = await service.getCommercePolicy("tenant-1");
      expect(result).toEqual({});
    });

    it("returns merged commerce policies from multiple authority levels", async () => {
      vi.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "r1",
          type: "region",
          policies: {
            commerce: { allowed: true, shipping: { domestic: true } },
          },
        },
        {
          id: "c1",
          type: "country",
          policies: {
            commerce: { shipping: { international: true } },
          },
        },
      ]);

      const result = await service.getCommercePolicy("tenant-1");
      expect(result).toEqual({
        allowed: true,
        shipping: { domestic: true, international: true },
      });
    });
  });
});
