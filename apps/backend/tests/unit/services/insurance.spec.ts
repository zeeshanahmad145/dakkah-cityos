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
        async createInsPolicys(_data: any): Promise<any> {
          return {};
        }
        async updateInsPolicys(_data: any): Promise<any> {
          return {};
        }
        async retrieveInsPolicy(_id: string): Promise<any> {
          return null;
        }
        async createInsClaims(_data: any): Promise<any> {
          return {};
        }
        async updateInsClaims(_data: any): Promise<any> {
          return {};
        }
        async retrieveInsClaim(_id: string): Promise<any> {
          return null;
        }
        async listInsClaims(_filter: any): Promise<any> {
          return [];
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

import InsuranceModuleService from "../../../src/modules/insurance/service";

describe("InsuranceModuleService", () => {
  let service: InsuranceModuleService;

  beforeEach(() => {
    service = new InsuranceModuleService();
    jest.clearAllMocks();
  });

  describe("cancelPolicy", () => {
    it("should cancel an active policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_01",
        status: "active",
        premium: 1200,
        start_date: new Date("2026-01-01"),
        end_date: new Date("2027-01-01"),
      });
      jest.spyOn(service, "updateInsPolicys").mockResolvedValue({
        id: "pol_01",
        status: "cancelled",
      });

      const result = await service.cancelPolicy("pol_01", "Customer request");
      expect(result.status).toBe("cancelled");
    });

    it("should reject cancelling an already cancelled policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_01",
        status: "cancelled",
      });

      await expect(service.cancelPolicy("pol_01")).rejects.toThrow(
        "Policy is already cancelled",
      );
    });
  });

  describe("createPolicy", () => {
    it("should reject policy with zero coverage", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_01",
          productId: "prod_01",
          planType: "basic",
          coverageAmount: 0,
          premium: 100,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Coverage amount must be greater than zero");
    });

    it("should reject policy with negative premium", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_01",
          productId: "prod_01",
          planType: "basic",
          coverageAmount: 50000,
          premium: -100,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Premium must be greater than zero");
    });
  });
});
