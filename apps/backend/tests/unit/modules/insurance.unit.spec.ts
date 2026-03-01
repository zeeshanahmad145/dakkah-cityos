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
        async listInsPolicys(_filter: any): Promise<any> {
          return [];
        }
        async retrieveInsPolicy(_id: string): Promise<any> {
          return null;
        }
        async createInsPolicys(_data: any): Promise<any> {
          return {};
        }
        async updateInsPolicys(_data: any): Promise<any> {
          return {};
        }
        async listInsClaims(_filter: any): Promise<any> {
          return [];
        }
        async retrieveInsClaim(_id: string): Promise<any> {
          return null;
        }
        async createInsClaims(_data: any): Promise<any> {
          return {};
        }
        async updateInsClaims(_data: any): Promise<any> {
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

import InsuranceModuleService from "../../../src/modules/insurance/service";

describe("InsuranceModuleService", () => {
  let service: InsuranceModuleService;

  beforeEach(() => {
    service = new InsuranceModuleService();
    jest.clearAllMocks();
  });

  describe("createPolicy", () => {
    it("creates an insurance policy successfully", async () => {
      const createSpy = jest
        .spyOn(service, "createInsPolicys")
        .mockResolvedValue({
          id: "pol-1",
          status: "active",
        });

      const result = await service.createPolicy({
        customerId: "cust-1",
        productId: "prod-1",
        planType: "comprehensive",
        coverageAmount: 50000,
        premium: 500,
        startDate: new Date("2025-01-01"),
      });

      expect(result.status).toBe("active");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          coverage_amount: 50000,
          status: "active",
        }),
      );
    });

    it("throws when coverage amount is zero", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust-1",
          productId: "prod-1",
          planType: "basic",
          coverageAmount: 0,
          premium: 100,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Coverage amount must be greater than zero");
    });

    it("throws when premium is zero", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust-1",
          productId: "prod-1",
          planType: "basic",
          coverageAmount: 10000,
          premium: 0,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Premium must be greater than zero");
    });
  });

  describe("fileInsuranceClaim", () => {
    it("files a claim for an active policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol-1",
        status: "active",
        coverage_amount: 50000,
      });
      const createSpy = jest
        .spyOn(service, "createInsClaims")
        .mockResolvedValue({
          id: "clm-1",
          status: "pending",
        });

      const result = await service.fileInsuranceClaim(
        "pol-1",
        "Water damage to device",
        5000,
      );

      expect(result.status).toBe("pending");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          policy_id: "pol-1",
          claim_amount: 5000,
          status: "pending",
        }),
      );
    });

    it("throws when description is empty", async () => {
      await expect(
        service.fileInsuranceClaim("pol-1", "", 1000),
      ).rejects.toThrow("Claim description is required");
    });

    it("throws when claim amount is zero", async () => {
      await expect(
        service.fileInsuranceClaim("pol-1", "Damage", 0),
      ).rejects.toThrow("Claim amount must be greater than zero");
    });

    it("throws when policy is not active", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol-1",
        status: "cancelled",
      });

      await expect(
        service.fileInsuranceClaim("pol-1", "Damage", 1000),
      ).rejects.toThrow("Policy is not active");
    });

    it("throws when claim amount exceeds coverage", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol-1",
        status: "active",
        coverage_amount: 5000,
      });

      await expect(
        service.fileInsuranceClaim("pol-1", "Major damage", 10000),
      ).rejects.toThrow("Claim amount exceeds coverage limit");
    });
  });

  describe("processInsuranceClaim", () => {
    it("approves a pending claim", async () => {
      jest.spyOn(service, "retrieveInsClaim").mockResolvedValue({
        id: "clm-1",
        status: "pending",
        claim_amount: 5000,
      });
      const updateSpy = jest
        .spyOn(service, "updateInsClaims")
        .mockResolvedValue({
          id: "clm-1",
          status: "approved",
        });

      const result = await service.processInsuranceClaim(
        "clm-1",
        "approved",
        "Valid claim",
      );

      expect(result.status).toBe("approved");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "approved",
          payout_amount: 5000,
        }),
      );
    });

    it("rejects a claim with zero payout", async () => {
      jest.spyOn(service, "retrieveInsClaim").mockResolvedValue({
        id: "clm-1",
        status: "pending",
        claim_amount: 5000,
      });
      const updateSpy = jest
        .spyOn(service, "updateInsClaims")
        .mockResolvedValue({
          id: "clm-1",
          status: "rejected",
        });

      const result = await service.processInsuranceClaim(
        "clm-1",
        "rejected",
        "Not covered",
      );

      expect(result.status).toBe("rejected");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "rejected",
          payout_amount: 0,
        }),
      );
    });

    it("throws when claim is not reviewable", async () => {
      jest.spyOn(service, "retrieveInsClaim").mockResolvedValue({
        id: "clm-1",
        status: "approved",
      });

      await expect(
        service.processInsuranceClaim("clm-1", "rejected"),
      ).rejects.toThrow("Claim is not in a reviewable state");
    });
  });

  describe("cancelPolicy", () => {
    it("cancels an active policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol-1",
        status: "active",
      });
      const updateSpy = jest
        .spyOn(service, "updateInsPolicys")
        .mockResolvedValue({
          id: "pol-1",
          status: "cancelled",
        });

      const result = await service.cancelPolicy("pol-1", "No longer needed");

      expect(result.status).toBe("cancelled");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancellation_reason: "No longer needed",
        }),
      );
    });

    it("throws when policy is already cancelled", async () => {
      jest.spyOn(service, "retrieveInsPolicy").mockResolvedValue({
        id: "pol-1",
        status: "cancelled",
      });

      await expect(service.cancelPolicy("pol-1")).rejects.toThrow(
        "Policy is already cancelled",
      );
    });
  });
});
