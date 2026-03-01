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
        async listTaxRules(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveTaxRule(_id: string): Promise<any> {
          return null;
        }
        async createTaxRules(_data: any): Promise<any> {
          return {};
        }
        async listTaxExemptions(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveTaxExemption(_id: string): Promise<any> {
          return null;
        }
        async createTaxExemptions(_data: any): Promise<any> {
          return {};
        }
        async updateTaxExemptions(_data: any): Promise<any> {
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

import TaxConfigModuleService from "../../../src/modules/tax-config/service";

describe("TaxConfigModuleService – Enhanced", () => {
  let service: TaxConfigModuleService;

  beforeEach(() => {
    service = new TaxConfigModuleService();
    jest.clearAllMocks();
  });

  describe("getEffectiveTaxRate", () => {
    it("returns combined tax rate from applicable rules", async () => {
      jest.spyOn(service, "listTaxRules").mockResolvedValue([
        {
          id: "r1",
          tax_rate: 10,
          region_code: "CA",
          status: "active",
          tax_type: "standard",
          priority: 1,
        },
        {
          id: "r2",
          tax_rate: 5,
          region_code: "CA",
          status: "active",
          tax_type: "standard",
          priority: 0,
        },
      ]);

      const result = await service.getEffectiveTaxRate("t-1", "CA");
      expect(result.effectiveRate).toBe(15);
      expect(result.rules).toHaveLength(2);
    });

    it("returns zero rate when exempt rule applies", async () => {
      jest
        .spyOn(service, "listTaxRules")
        .mockResolvedValue([
          {
            id: "r1",
            tax_rate: 0,
            region_code: "CA",
            status: "active",
            tax_type: "exempt",
            priority: 10,
          },
        ]);

      const result = await service.getEffectiveTaxRate("t-1", "CA");
      expect(result.effectiveRate).toBe(0);
    });

    it("filters by product category", async () => {
      jest.spyOn(service, "listTaxRules").mockResolvedValue([
        {
          id: "r1",
          tax_rate: 8,
          region_code: "CA",
          status: "active",
          tax_type: "standard",
          category: "food",
        },
        {
          id: "r2",
          tax_rate: 15,
          region_code: "CA",
          status: "active",
          tax_type: "standard",
          category: "electronics",
        },
      ]);

      const result = await service.getEffectiveTaxRate("t-1", "CA", "food");
      expect(result.effectiveRate).toBe(8);
      expect(result.category).toBe("food");
    });
  });

  describe("validateTaxExemption", () => {
    it("returns valid exemption for active customer exemption", async () => {
      const now = new Date();
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          id: "e1",
          status: "active",
          valid_from: new Date(now.getTime() - 86400000).toISOString(),
          valid_to: new Date(now.getTime() + 86400000 * 60).toISOString(),
        },
      ]);

      const result = await service.validateTaxExemption("cust-1", "t-1");
      expect(result.hasValidExemption).toBe(true);
      expect(result.exemptions).toHaveLength(1);
    });

    it("identifies expiring-soon exemptions", async () => {
      const now = new Date();
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          id: "e1",
          status: "active",
          valid_from: new Date(now.getTime() - 86400000).toISOString(),
          valid_to: new Date(now.getTime() + 86400000 * 10).toISOString(),
        },
      ]);

      const result = await service.validateTaxExemption("cust-1", "t-1");
      expect(result.expiringSoon).toHaveLength(1);
    });

    it("returns no valid exemption when all expired", async () => {
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          id: "e1",
          status: "active",
          valid_from: new Date("2020-01-01").toISOString(),
          valid_to: new Date("2020-12-31").toISOString(),
        },
      ]);

      const result = await service.validateTaxExemption("cust-1", "t-1");
      expect(result.hasValidExemption).toBe(false);
    });
  });

  describe("generateTaxReport", () => {
    it("generates report with rules grouped by region", async () => {
      jest.spyOn(service, "listTaxRules").mockResolvedValue([
        { id: "r1", tax_rate: 10, region_code: "CA", status: "active" },
        { id: "r2", tax_rate: 8, region_code: "NY", status: "active" },
        { id: "r3", tax_rate: 12, region_code: "CA", status: "active" },
      ]);

      const result = await service.generateTaxReport("t-1", {
        start: new Date("2025-01-01"),
        end: new Date("2025-12-31"),
      });

      expect(result.totalRules).toBe(3);
      expect(result.byRegion["CA"].ruleCount).toBe(2);
      expect(result.byRegion["NY"].ruleCount).toBe(1);
      expect(result.summary.totalRegions).toBe(2);
    });

    it("returns empty report when no rules exist", async () => {
      jest.spyOn(service, "listTaxRules").mockResolvedValue([]);

      const result = await service.generateTaxReport("t-1", {
        start: new Date("2025-01-01"),
        end: new Date("2025-12-31"),
      });

      expect(result.totalRules).toBe(0);
      expect(result.summary.totalRegions).toBe(0);
    });
  });
});
