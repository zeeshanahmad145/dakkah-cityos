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
        async listWarrantyPlans(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWarrantyPlan(_id: string): Promise<any> {
          return null;
        }
        async listWarrantyClaims(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWarrantyClaim(_id: string): Promise<any> {
          return null;
        }
        async createWarrantyClaims(_data: any): Promise<any> {
          return {};
        }
        async updateWarrantyClaims(_data: any): Promise<any> {
          return {};
        }
        async listRepairOrders(_filter: any): Promise<any> {
          return [];
        }
        async createRepairOrders(_data: any): Promise<any> {
          return {};
        }
        async updateRepairOrders(_data: any): Promise<any> {
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

import WarrantyModuleService from "../../../src/modules/warranty/service";

describe("WarrantyModuleService", () => {
  let service: WarrantyModuleService;

  beforeEach(() => {
    service = new WarrantyModuleService();
    jest.clearAllMocks();
  });

  describe("registerWarranty", () => {
    it("registers a warranty for a product", async () => {
      jest
        .spyOn(service, "listWarrantyPlans")
        .mockResolvedValue([{ id: "plan-1", duration_months: 24 }]);
      const createSpy = jest
        .spyOn(service, "createWarrantyClaims")
        .mockResolvedValue({
          id: "war-1",
          status: "registered",
        });

      const result = await service.registerWarranty(
        "prod-1",
        "cust-1",
        new Date("2025-01-01"),
      );

      expect(result.status).toBe("registered");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: "plan-1",
          product_id: "prod-1",
          customer_id: "cust-1",
          status: "registered",
        }),
      );
    });

    it("throws when no warranty plan exists for the product", async () => {
      jest.spyOn(service, "listWarrantyPlans").mockResolvedValue([]);

      await expect(
        service.registerWarranty("prod-1", "cust-1", new Date()),
      ).rejects.toThrow("No warranty plan found for this product");
    });
  });

  describe("fileClaim", () => {
    it("files a claim for a covered warranty", async () => {
      jest.spyOn(service, "checkCoverage").mockResolvedValue({ covered: true });
      const updateSpy = jest
        .spyOn(service, "updateWarrantyClaims")
        .mockResolvedValue({
          id: "war-1",
          status: "claimed",
        });

      const result = await service.fileClaim("war-1", "Screen cracked");

      expect(result.status).toBe("claimed");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "claimed",
          issue_description: "Screen cracked",
        }),
      );
    });

    it("throws when warranty does not cover the claim", async () => {
      jest.spyOn(service, "checkCoverage").mockResolvedValue({
        covered: false,
        reason: "Warranty has expired",
      });

      await expect(service.fileClaim("war-1", "Issue")).rejects.toThrow(
        "Warranty has expired",
      );
    });
  });

  describe("processClaimDecision", () => {
    it("approves a claim and creates a repair order", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "claimed",
      });
      const updateSpy = jest
        .spyOn(service, "updateWarrantyClaims")
        .mockResolvedValue({
          id: "war-1",
          status: "approved",
        });
      const repairSpy = jest
        .spyOn(service, "createRepairOrders")
        .mockResolvedValue({});

      const result = await service.processClaimDecision("war-1", "approved");

      expect(result.status).toBe("approved");
      expect(repairSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          warranty_claim_id: "war-1",
          status: "pending",
        }),
      );
    });

    it("rejects a claim without creating repair order", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "claimed",
      });
      const updateSpy = jest
        .spyOn(service, "updateWarrantyClaims")
        .mockResolvedValue({
          id: "war-1",
          status: "rejected",
        });
      const repairSpy = jest.spyOn(service, "createRepairOrders");

      await service.processClaimDecision("war-1", "rejected");

      expect(repairSpy).not.toHaveBeenCalled();
    });

    it("throws when claim is not in reviewable state", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "approved",
      });

      await expect(
        service.processClaimDecision("war-1", "rejected"),
      ).rejects.toThrow("Claim is not in a reviewable state");
    });
  });

  describe("extendWarranty", () => {
    it("extends a registered warranty", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "registered",
        expiry_date: "2026-01-01",
      });
      const updateSpy = jest
        .spyOn(service, "updateWarrantyClaims")
        .mockResolvedValue({
          id: "war-1",
          status: "registered",
        });

      const result = await service.extendWarranty("war-1", 12, 4999);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "registered",
          extension_fee: 4999,
        }),
      );
    });

    it("throws when additional months is zero or negative", async () => {
      await expect(service.extendWarranty("war-1", 0, 100)).rejects.toThrow(
        "Additional months must be a positive number",
      );
    });

    it("throws when fee is negative", async () => {
      await expect(service.extendWarranty("war-1", 6, -100)).rejects.toThrow(
        "Fee cannot be negative",
      );
    });

    it("throws when warranty is voided", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "voided",
        expiry_date: "2025-01-01",
      });

      await expect(service.extendWarranty("war-1", 6, 100)).rejects.toThrow(
        "Cannot extend a voided or already-claimed warranty",
      );
    });
  });

  describe("checkCoverage", () => {
    it("returns covered for valid warranty", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "registered",
        expiry_date: futureDate.toISOString(),
      });

      const result = await service.checkCoverage("war-1");

      expect(result.covered).toBe(true);
    });

    it("returns not covered for expired warranty", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "war-1",
        status: "registered",
        expiry_date: "2020-01-01",
      });

      const result = await service.checkCoverage("war-1");

      expect(result.covered).toBe(false);
      expect(result.reason).toBe("Warranty has expired");
    });
  });
});
