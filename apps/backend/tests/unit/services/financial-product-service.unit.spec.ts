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
        async listLoanProducts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveLoanProduct(_id: string): Promise<any> {
          return null;
        }
        async createLoanApplications(_data: any): Promise<any> {
          return {};
        }
        async listLoanApplications(_filter: any): Promise<any> {
          return [];
        }
        async retrieveLoanApplication(_id: string): Promise<any> {
          return null;
        }
        async updateLoanApplications(_data: any): Promise<any> {
          return {};
        }
        async listInsuranceProducts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveInsuranceProduct(_id: string): Promise<any> {
          return null;
        }
        async listInsurancePolicies(_filter: any): Promise<any> {
          return [];
        }
        async listInvestmentPlans(_filter: any): Promise<any> {
          return [];
        }
        async retrieveInvestmentPlan(_id: string): Promise<any> {
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

import FinancialProductModuleService from "../../../src/modules/financial-product/service";

describe("FinancialProductModuleService", () => {
  let service: FinancialProductModuleService;

  beforeEach(() => {
    service = new FinancialProductModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("calculateRepaymentSchedule", () => {
    it("calculates correct monthly payment and schedule", () => {
      const result = service.calculateRepaymentSchedule(12000, 12, 12);

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(12);
      expect(result.totalPayment).toBeGreaterThan(12000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.schedule[11].balance).toBe(0);
    });

    it("handles zero interest rate", () => {
      const result = service.calculateRepaymentSchedule(12000, 0, 12);

      expect(result.monthlyPayment).toBe(1000);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPayment).toBe(12000);
    });

    it("throws for invalid principal", () => {
      expect(() => service.calculateRepaymentSchedule(0, 5, 12)).toThrow(
        "Principal must be greater than zero",
      );
    });

    it("throws for negative interest rate", () => {
      expect(() => service.calculateRepaymentSchedule(10000, -1, 12)).toThrow(
        "Interest rate cannot be negative",
      );
    });

    it("throws for invalid term", () => {
      expect(() => service.calculateRepaymentSchedule(10000, 5, 0)).toThrow(
        "Term must be greater than zero",
      );
    });
  });

  describe("applyForProduct", () => {
    it("creates a loan application with valid data", async () => {
      vi.spyOn(service, "retrieveLoanProduct").mockResolvedValue({
        id: "prod-1",
        min_amount: 1000,
        max_amount: 50000,
      });
      const createSpy = jest
        .spyOn(service, "createLoanApplications")
        .mockResolvedValue({ id: "app-1" });

      await service.applyForProduct("cust-1", "prod-1", {
        amount: 5000,
        term: 12,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          product_id: "prod-1",
          amount: 5000,
          status: "pending",
        }),
      );
    });

    it("throws when amount is below minimum", async () => {
      vi.spyOn(service, "retrieveLoanProduct").mockResolvedValue({
        id: "prod-1",
        min_amount: 5000,
        max_amount: 50000,
      });

      await expect(
        service.applyForProduct("cust-1", "prod-1", { amount: 1000, term: 12 }),
      ).rejects.toThrow("Amount below minimum");
    });

    it("throws when amount exceeds maximum", async () => {
      vi.spyOn(service, "retrieveLoanProduct").mockResolvedValue({
        id: "prod-1",
        min_amount: 1000,
        max_amount: 50000,
      });

      await expect(
        service.applyForProduct("cust-1", "prod-1", {
          amount: 100000,
          term: 12,
        }),
      ).rejects.toThrow("Amount exceeds maximum");
    });
  });

  describe("assessApplication", () => {
    it("returns eligible for a valid application", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        customer_id: "cust-1",
        amount: 5000,
        term_months: 12,
        product_id: "prod-1",
      });
      vi.spyOn(service, "retrieveLoanProduct").mockResolvedValue({
        id: "prod-1",
        min_amount: 1000,
        max_amount: 50000,
      });

      const result = await service.assessApplication("app-1");

      expect(result.eligible).toBe(true);
      expect(result.score).toBe(100);
      expect(result.reasons).toHaveLength(0);
    });

    it("deducts score for missing customer info", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        customer_id: null,
        amount: 5000,
        term_months: 12,
      });

      const result = await service.assessApplication("app-1");

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Missing customer information");
    });

    it("deducts score for invalid amount", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        customer_id: "cust-1",
        amount: 0,
        term_months: 12,
      });

      const result = await service.assessApplication("app-1");

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Invalid loan amount");
    });
  });

  describe("approveApplication", () => {
    it("approves a pending application", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        status: "pending",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoanApplications")
        .mockResolvedValue({ id: "app-1", status: "approved" });

      await service.approveApplication("app-1", "admin-1", {
        interestRate: 5.5,
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "approved",
          approved_by: "admin-1",
          interest_rate: 5.5,
        }),
      );
    });

    it("throws when already approved", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        status: "approved",
      });

      await expect(
        service.approveApplication("app-1", "admin-1"),
      ).rejects.toThrow("already approved");
    });

    it("throws when trying to approve a rejected application", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        status: "rejected",
      });

      await expect(
        service.approveApplication("app-1", "admin-1"),
      ).rejects.toThrow("Cannot approve a rejected application");
    });
  });

  describe("rejectApplication", () => {
    it("rejects a pending application with a reason", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        status: "pending",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoanApplications")
        .mockResolvedValue({ id: "app-1", status: "rejected" });

      await service.rejectApplication("app-1", "Insufficient income");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "rejected",
          rejection_reason: "Insufficient income",
        }),
      );
    });

    it("throws when reason is missing", async () => {
      await expect(service.rejectApplication("app-1", "")).rejects.toThrow(
        "Rejection reason is required",
      );
    });

    it("throws when trying to reject an approved application", async () => {
      vi.spyOn(service, "retrieveLoanApplication").mockResolvedValue({
        id: "app-1",
        status: "approved",
      });

      await expect(
        service.rejectApplication("app-1", "reason"),
      ).rejects.toThrow("Cannot reject an approved application");
    });
  });
});
