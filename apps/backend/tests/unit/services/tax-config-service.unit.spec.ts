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
        async listTaxRules(_f: any): Promise<any> {
          return [];
        }
        async listTaxExemptions(_f: any): Promise<any> {
          return [];
        }
        async createTaxExemptions(_data: any): Promise<any> {
          return null;
        }
        async retrieveTaxExemption(_id: string): Promise<any> {
          return null;
        }
        async updateTaxExemptions(_data: any): Promise<any> {
          return null;
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

import TaxConfigModuleService from "../../../src/modules/tax-config/service";

describe("TaxConfigModuleService", () => {
  let service: TaxConfigModuleService;

  beforeEach(() => {
    service = new TaxConfigModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("calculateTax", () => {
    it("returns zero tax when no rules apply", async () => {
      vi.spyOn(service, "getApplicableRules").mockResolvedValue([]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
      });

      expect(result).toEqual({ taxAmount: 0, taxRate: 0, rules: [] });
    });

    it("calculates tax from applicable rules", async () => {
      jest
        .spyOn(service, "getApplicableRules")
        .mockResolvedValue([{ id: "r-1", tax_rate: 10, tax_type: "standard" }]);
      vi.spyOn(service, "listTaxExemptions").mockResolvedValue([]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
      });

      expect(result.taxAmount).toBe(100);
      expect(result.taxRate).toBe(10);
    });

    it("returns zero for exempt tax type", async () => {
      jest
        .spyOn(service, "getApplicableRules")
        .mockResolvedValue([{ id: "r-1", tax_rate: 10, tax_type: "exempt" }]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
      });

      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(0);
    });

    it("applies full exemption when entity has one", async () => {
      jest
        .spyOn(service, "getApplicableRules")
        .mockResolvedValue([{ id: "r-1", tax_rate: 15, tax_type: "standard" }]);
      vi.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          exemption_type: "full",
          status: "active",
          valid_from: "2020-01-01",
          valid_to: "2030-12-31",
        },
      ]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
        entityType: "company",
        entityId: "comp-1",
      });

      expect(result.taxAmount).toBe(0);
    });

    it("applies partial exemption", async () => {
      jest
        .spyOn(service, "getApplicableRules")
        .mockResolvedValue([{ id: "r-1", tax_rate: 20, tax_type: "standard" }]);
      vi.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          exemption_type: "partial",
          exemption_rate: 50,
          status: "active",
          valid_from: "2020-01-01",
          valid_to: "2030-12-31",
        },
      ]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
        entityType: "company",
        entityId: "comp-1",
      });

      expect(result.taxRate).toBe(10);
      expect(result.taxAmount).toBe(100);
    });

    it("sums rates from multiple rules", async () => {
      vi.spyOn(service, "getApplicableRules").mockResolvedValue([
        { id: "r-1", tax_rate: 5, tax_type: "standard" },
        { id: "r-2", tax_rate: 3, tax_type: "standard" },
      ]);
      vi.spyOn(service, "listTaxExemptions").mockResolvedValue([]);

      const result = await service.calculateTax({
        tenantId: "t-1",
        countryCode: "US",
        amount: 1000,
      });

      expect(result.taxRate).toBe(8);
      expect(result.taxAmount).toBe(80);
    });
  });

  describe("getApplicableRules", () => {
    it("filters rules by tenant and country", async () => {
      const listSpy = jest
        .spyOn(service, "listTaxRules")
        .mockResolvedValue([
          {
            id: "r-1",
            tax_rate: 10,
            status: "active",
            applies_to: "all",
            priority: 1,
          },
        ]);

      const result = await service.getApplicableRules({
        tenantId: "t-1",
        countryCode: "US",
      });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t-1",
          country_code: "US",
          status: "active",
        }),
      );
      expect(result).toHaveLength(1);
    });

    it("filters out rules with non-matching region code", async () => {
      vi.spyOn(service, "listTaxRules").mockResolvedValue([
        { id: "r-1", tax_rate: 10, region_code: "CA", applies_to: "all" },
        { id: "r-2", tax_rate: 5, region_code: "NY", applies_to: "all" },
      ]);

      const result = await service.getApplicableRules({
        tenantId: "t-1",
        countryCode: "US",
        regionCode: "NY",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r-2");
    });

    it("filters out expired rules", async () => {
      vi.spyOn(service, "listTaxRules").mockResolvedValue([
        { id: "r-1", tax_rate: 10, valid_to: "2020-01-01", applies_to: "all" },
        { id: "r-2", tax_rate: 5, applies_to: "all" },
      ]);

      const result = await service.getApplicableRules({
        tenantId: "t-1",
        countryCode: "US",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r-2");
    });

    it("sorts rules by priority descending", async () => {
      vi.spyOn(service, "listTaxRules").mockResolvedValue([
        { id: "r-1", tax_rate: 5, priority: 1, applies_to: "all" },
        { id: "r-2", tax_rate: 10, priority: 10, applies_to: "all" },
      ]);

      const result = await service.getApplicableRules({
        tenantId: "t-1",
        countryCode: "US",
      });

      expect(result[0].id).toBe("r-2");
    });
  });

  describe("addExemption", () => {
    it("creates a full exemption", async () => {
      const createSpy = jest
        .spyOn(service, "createTaxExemptions")
        .mockResolvedValue({ id: "ex-1" });

      const result = await service.addExemption({
        tenantId: "t-1",
        entityType: "company",
        entityId: "comp-1",
        exemptionType: "full",
        validFrom: new Date("2025-01-01"),
      });

      expect(result).toEqual({ id: "ex-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          exemption_type: "full",
          status: "active",
        }),
      );
    });

    it("throws for partial exemption without rate", async () => {
      await expect(
        service.addExemption({
          tenantId: "t-1",
          entityType: "company",
          entityId: "comp-1",
          exemptionType: "partial",
          validFrom: new Date(),
        }),
      ).rejects.toThrow("Partial exemptions require an exemption rate");
    });
  });

  describe("validateExemption", () => {
    it("returns valid for active exemption within date range", async () => {
      vi.spyOn(service, "retrieveTaxExemption").mockResolvedValue({
        status: "active",
        valid_from: "2020-01-01",
        valid_to: "2030-12-31",
      });

      const result = await service.validateExemption("ex-1");

      expect(result).toEqual({ valid: true });
    });

    it("returns invalid for revoked exemption", async () => {
      jest
        .spyOn(service, "retrieveTaxExemption")
        .mockResolvedValue({ status: "revoked" });

      const result = await service.validateExemption("ex-1");

      expect(result).toEqual({
        valid: false,
        reason: "Exemption has been revoked",
      });
    });

    it("marks expired and returns invalid when valid_to is in the past", async () => {
      vi.spyOn(service, "retrieveTaxExemption").mockResolvedValue({
        status: "active",
        valid_from: "2020-01-01",
        valid_to: "2020-12-31",
      });
      const updateSpy = jest
        .spyOn(service, "updateTaxExemptions")
        .mockResolvedValue({});

      const result = await service.validateExemption("ex-1");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Exemption has expired");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "expired" }),
      );
    });
  });

  describe("validateTaxId", () => {
    it("validates a correct GB VAT number", async () => {
      const result = await service.validateTaxId("GB123456789", "GB");
      expect(result.valid).toBe(true);
      expect(result.format).toBe("VAT");
    });

    it("rejects an invalid GB VAT number", async () => {
      const result = await service.validateTaxId("GB12345", "GB");
      expect(result.valid).toBe(false);
      expect(result.format).toBe("VAT");
      expect(result.reason).toContain("Invalid VAT format");
    });

    it("validates a correct US TIN", async () => {
      const result = await service.validateTaxId("12-3456789", "US");
      expect(result.valid).toBe(true);
      expect(result.format).toBe("TIN");
    });

    it("validates a correct FR VAT number", async () => {
      const result = await service.validateTaxId("FRXX123456789", "FR");
      expect(result.valid).toBe(true);
      expect(result.format).toBe("VAT");
    });

    it("falls back to length check for unknown country codes", async () => {
      const result = await service.validateTaxId("TAX12345", "AE");
      expect(result.format).toBe("unknown");
      expect(result.valid).toBe(true);
    });

    it("returns invalid when tax ID or country code is missing", async () => {
      const result = await service.validateTaxId("", "GB");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("required");
    });
  });

  describe("getTaxSummary", () => {
    it("groups rules by region", async () => {
      vi.spyOn(service, "listTaxRules").mockResolvedValue([
        { id: "r1", region_code: "CA", country_code: "US", tax_rate: 7.25 },
        { id: "r2", region_code: "CA", country_code: "US", tax_rate: 1.0 },
        { id: "r3", region_code: "NY", country_code: "US", tax_rate: 8.0 },
      ]);

      const result = await service.getTaxSummary("tenant-1");

      expect(result.totalRules).toBe(3);
      expect(result.regions).toBe(2);
      expect(result.byRegion["CA"]).toHaveLength(2);
      expect(result.byRegion["NY"]).toHaveLength(1);
    });

    it("uses country_code when region_code is absent", async () => {
      jest
        .spyOn(service, "listTaxRules")
        .mockResolvedValue([{ id: "r1", country_code: "GB", tax_rate: 20 }]);

      const result = await service.getTaxSummary("tenant-1");

      expect(result.byRegion["GB"]).toHaveLength(1);
    });

    it("filters by regionId when provided", async () => {
      const listSpy = vi.spyOn(service, "listTaxRules").mockResolvedValue([]);

      await service.getTaxSummary("tenant-1", "CA");

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ region_code: "CA" }),
      );
    });
  });

  describe("getApplicableExemptions", () => {
    it("returns only currently active exemptions", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      vi.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          id: "ex1",
          valid_from: pastDate.toISOString(),
          valid_to: futureDate.toISOString(),
          status: "active",
        },
        {
          id: "ex2",
          valid_from: pastDate.toISOString(),
          valid_to: pastDate.toISOString(),
          status: "active",
        },
      ]);

      const result = await service.getApplicableExemptions(
        "cust-1",
        "tenant-1",
      );

      expect(result.count).toBe(1);
      expect(result.exemptions[0].id).toBe("ex1");
    });

    it("filters out exemptions that have not yet started", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      jest
        .spyOn(service, "listTaxExemptions")
        .mockResolvedValue([
          {
            id: "ex1",
            valid_from: futureDate.toISOString(),
            valid_to: null,
            status: "active",
          },
        ]);

      const result = await service.getApplicableExemptions(
        "cust-1",
        "tenant-1",
      );

      expect(result.count).toBe(0);
    });
  });
});
