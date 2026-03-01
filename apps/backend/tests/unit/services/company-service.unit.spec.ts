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
        async retrieveCompany(_id: string): Promise<any> {
          return null;
        }
        async listCompanies(_filter: any): Promise<any> {
          return [];
        }
        async updateCompanies(_data: any): Promise<any> {
          return {};
        }
        async retrieveCompanyUser(_id: string): Promise<any> {
          return null;
        }
        async listCompanyUsers(_filter: any): Promise<any> {
          return [];
        }
        async updateCompanyUsers(_data: any): Promise<any> {
          return {};
        }
        async retrievePurchaseOrder(_id: string): Promise<any> {
          return null;
        }
        async listPurchaseOrders(_filter: any): Promise<any> {
          return [];
        }
        async createPurchaseOrders(_data: any): Promise<any> {
          return {};
        }
        async updatePurchaseOrders(_data: any): Promise<any> {
          return {};
        }
        async createPurchaseOrderItems(_data: any): Promise<any> {
          return {};
        }
        async listPaymentTerms(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTaxExemption(_id: string): Promise<any> {
          return null;
        }
        async listTaxExemptions(_filter: any): Promise<any> {
          return [];
        }
        async updateTaxExemptions(_data: any): Promise<any> {
          return {};
        }
        async listApprovalWorkflows(_filter: any): Promise<any> {
          return [];
        }
        async retrieveApprovalWorkflow(_id: string): Promise<any> {
          return null;
        }
        async retrieveApprovalRequest(_id: string): Promise<any> {
          return null;
        }
        async createApprovalRequests(_data: any): Promise<any> {
          return {};
        }
        async updateApprovalRequests(_data: any): Promise<any> {
          return {};
        }
        async createApprovalActions(_data: any): Promise<any> {
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

import CompanyModuleService from "../../../src/modules/company/service";

describe("CompanyModuleService", () => {
  let service: CompanyModuleService;

  beforeEach(() => {
    service = new CompanyModuleService();
    jest.clearAllMocks();
  });

  describe("hasAvailableCredit", () => {
    it("returns true when sufficient credit", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_limit: "1000", credit_used: "200" });
      expect(await service.hasAvailableCredit("c1", 500n)).toBe(true);
    });

    it("returns false when insufficient credit", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_limit: "1000", credit_used: "900" });
      expect(await service.hasAvailableCredit("c1", 200n)).toBe(false);
    });
  });

  describe("reserveCredit", () => {
    it("reserves credit successfully", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_limit: "1000", credit_used: "200" });
      const updateSpy = jest
        .spyOn(service, "updateCompanies")
        .mockResolvedValue({});

      await service.reserveCredit("c1", 300n);
      expect(updateSpy).toHaveBeenCalledWith({ id: "c1", credit_used: "500" });
    });

    it("throws when insufficient credit", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_limit: "100", credit_used: "90" });

      await expect(service.reserveCredit("c1", 50n)).rejects.toThrow(
        "Insufficient credit",
      );
    });
  });

  describe("releaseCredit", () => {
    it("releases credit and reduces used amount", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_used: "500" });
      const updateSpy = jest
        .spyOn(service, "updateCompanies")
        .mockResolvedValue({});

      await service.releaseCredit("c1", 200n);
      expect(updateSpy).toHaveBeenCalledWith({ id: "c1", credit_used: "300" });
    });

    it("does not go below zero", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ credit_used: "100" });
      const updateSpy = jest
        .spyOn(service, "updateCompanies")
        .mockResolvedValue({});

      await service.releaseCredit("c1", 200n);
      expect(updateSpy).toHaveBeenCalledWith({ id: "c1", credit_used: "0" });
    });
  });

  describe("canUserApprove", () => {
    it("returns true for admin with no limit", async () => {
      jest
        .spyOn(service, "retrieveCompanyUser")
        .mockResolvedValue({ role: "admin", approval_limit: null });
      expect(await service.canUserApprove("cu1", 1000n)).toBe(true);
    });

    it("returns false for non-admin/approver role", async () => {
      jest
        .spyOn(service, "retrieveCompanyUser")
        .mockResolvedValue({ role: "buyer" });
      expect(await service.canUserApprove("cu1", 100n)).toBe(false);
    });

    it("respects approval limit", async () => {
      jest
        .spyOn(service, "retrieveCompanyUser")
        .mockResolvedValue({ role: "approver", approval_limit: "500" });
      expect(await service.canUserApprove("cu1", 500n)).toBe(true);
      expect(await service.canUserApprove("cu1", 501n)).toBe(false);
    });
  });

  describe("hasSpendingLimitAvailable", () => {
    it("returns true when no spending limit", async () => {
      jest
        .spyOn(service, "retrieveCompanyUser")
        .mockResolvedValue({ spending_limit: null });
      expect(await service.hasSpendingLimitAvailable("cu1", 1000n)).toBe(true);
    });

    it("checks remaining spending limit", async () => {
      jest.spyOn(service, "retrieveCompanyUser").mockResolvedValue({
        spending_limit: "500",
        current_period_spend: "300",
      });
      expect(await service.hasSpendingLimitAvailable("cu1", 200n)).toBe(true);
      expect(await service.hasSpendingLimitAvailable("cu1", 201n)).toBe(false);
    });
  });

  describe("recordSpending", () => {
    it("increments current period spend", async () => {
      jest
        .spyOn(service, "retrieveCompanyUser")
        .mockResolvedValue({ current_period_spend: "100" });
      const updateSpy = jest
        .spyOn(service, "updateCompanyUsers")
        .mockResolvedValue({});

      await service.recordSpending("cu1", 50n);
      expect(updateSpy).toHaveBeenCalledWith({
        id: "cu1",
        current_period_spend: "150",
      });
    });
  });

  describe("getPotentialApprovers", () => {
    it("filters users by approval limit", async () => {
      jest.spyOn(service, "listCompanyUsers").mockResolvedValue([
        { id: "u1", approval_limit: "1000" },
        { id: "u2", approval_limit: "100" },
        { id: "u3", approval_limit: null },
      ]);

      const result = await service.getPotentialApprovers("c1", 500n);
      expect(result).toHaveLength(2);
    });
  });

  describe("generatePONumber", () => {
    it("generates PO number with company prefix", async () => {
      jest
        .spyOn(service, "retrieveCompany")
        .mockResolvedValue({ name: "Acme Corp" });

      const result = await service.generatePONumber("c1");
      expect(result).toMatch(/^ACM-/);
    });
  });

  describe("calculateDueDate", () => {
    it("returns same date for due_on_receipt", () => {
      const date = new Date("2025-01-15");
      const result = service.calculateDueDate(
        { terms_type: "due_on_receipt" },
        date,
      );
      expect(result).toEqual(date);
    });

    it("adds net_days", () => {
      const date = new Date("2025-01-01");
      const result = service.calculateDueDate(
        { terms_type: "net_days", net_days: 30 },
        date,
      );
      expect(result.getDate()).toBe(31);
    });

    it("calculates end_of_month", () => {
      const date = new Date("2025-01-15");
      const result = service.calculateDueDate(
        { terms_type: "end_of_month" },
        date,
      );
      expect(result.getDate()).toBe(31);
    });

    it("calculates end_of_next_month", () => {
      const date = new Date("2025-01-15");
      const result = service.calculateDueDate(
        { terms_type: "end_of_next_month" },
        date,
      );
      expect(result.getMonth()).toBe(1);
    });

    it("defaults to 30 days for unknown terms", () => {
      const date = new Date("2025-01-01");
      const result = service.calculateDueDate({ terms_type: "unknown" }, date);
      expect(result.getDate()).toBe(31);
    });
  });

  describe("calculateEarlyPaymentDiscount", () => {
    it("returns discount when within early payment window", () => {
      const terms = {
        early_payment_discount_percent: 2,
        early_payment_discount_days: 10,
      };
      const invoiceDate = new Date("2025-01-01");
      const paymentDate = new Date("2025-01-05");

      const result = service.calculateEarlyPaymentDiscount(
        terms,
        1000,
        paymentDate,
        invoiceDate,
      );
      expect(result).toBe(20);
    });

    it("returns zero when outside early payment window", () => {
      const terms = {
        early_payment_discount_percent: 2,
        early_payment_discount_days: 10,
      };
      const invoiceDate = new Date("2025-01-01");
      const paymentDate = new Date("2025-01-20");

      const result = service.calculateEarlyPaymentDiscount(
        terms,
        1000,
        paymentDate,
        invoiceDate,
      );
      expect(result).toBe(0);
    });

    it("returns zero when no discount terms", () => {
      const result = service.calculateEarlyPaymentDiscount(
        {},
        1000,
        new Date(),
        new Date(),
      );
      expect(result).toBe(0);
    });
  });

  describe("validateTaxExemption", () => {
    it("returns true for verified non-expired exemption", async () => {
      jest.spyOn(service, "retrieveTaxExemption").mockResolvedValue({
        status: "verified",
        expiration_date: null,
      });

      expect(await service.validateTaxExemption("e1")).toBe(true);
    });

    it("returns false and marks expired", async () => {
      jest.spyOn(service, "retrieveTaxExemption").mockResolvedValue({
        status: "verified",
        expiration_date: new Date(Date.now() - 100000),
      });
      jest.spyOn(service, "updateTaxExemptions").mockResolvedValue({});

      expect(await service.validateTaxExemption("e1")).toBe(false);
    });

    it("returns false for non-verified status", async () => {
      jest
        .spyOn(service, "retrieveTaxExemption")
        .mockResolvedValue({ status: "pending" });

      expect(await service.validateTaxExemption("e1")).toBe(false);
    });
  });

  describe("getApplicableTaxExemption", () => {
    it("returns matching exemption and updates usage", async () => {
      const exemption = {
        id: "e1",
        status: "verified",
        expiration_date: null,
        applicable_regions: null,
        applicable_categories: null,
        usage_count: 0,
      };
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([exemption]);
      jest.spyOn(service, "updateTaxExemptions").mockResolvedValue({});

      const result = await service.getApplicableTaxExemption("c1");
      expect(result).toEqual(exemption);
    });

    it("returns null when no matching exemption", async () => {
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([]);

      const result = await service.getApplicableTaxExemption("c1");
      expect(result).toBeNull();
    });

    it("skips exemptions that don't match region", async () => {
      jest.spyOn(service, "listTaxExemptions").mockResolvedValue([
        {
          id: "e1",
          expiration_date: null,
          applicable_regions: ["US"],
          applicable_categories: null,
        },
      ]);

      const result = await service.getApplicableTaxExemption("c1", "EU");
      expect(result).toBeNull();
    });
  });

  describe("processApprovalAction", () => {
    const setupApprovalMocks = (steps: any[], currentStep: number) => {
      jest.spyOn(service, "retrieveApprovalRequest").mockResolvedValue({
        id: "req_1",
        workflow_id: "wf_1",
        current_step: currentStep,
        entity_type: "purchase_order",
        entity_id: "po_1",
      });
      jest.spyOn(service, "retrieveApprovalWorkflow").mockResolvedValue({
        id: "wf_1",
        steps,
      });
      jest.spyOn(service, "createApprovalActions").mockResolvedValue({});
      jest.spyOn(service, "updateApprovalRequests").mockResolvedValue({});
      jest.spyOn(service, "updatePurchaseOrders").mockResolvedValue({});
    };

    it("rejects and updates PO status", async () => {
      setupApprovalMocks([{ name: "Manager" }], 1);

      const result = await service.processApprovalAction(
        "req_1",
        "u1",
        "reject",
        "Too expensive",
      );
      expect(result.status).toBe("rejected");
    });

    it("advances to next step on approve", async () => {
      setupApprovalMocks([{ name: "Manager" }, { name: "VP" }], 1);

      const result = await service.processApprovalAction(
        "req_1",
        "u1",
        "approve",
      );
      expect(result.status).toBe("in_progress");
      expect(result.next_step).toBe(2);
    });

    it("fully approves on last step", async () => {
      setupApprovalMocks([{ name: "Manager" }], 1);

      const result = await service.processApprovalAction(
        "req_1",
        "u1",
        "approve",
      );
      expect(result.status).toBe("approved");
    });

    it("returns pending for request_changes action", async () => {
      setupApprovalMocks([{ name: "Manager" }], 1);

      const result = await service.processApprovalAction(
        "req_1",
        "u1",
        "request_changes",
      );
      expect(result.status).toBe("pending");
    });
  });

  describe("submitPOForApproval", () => {
    it("auto-approves when no workflow exists", async () => {
      jest.spyOn(service, "retrievePurchaseOrder").mockResolvedValue({
        id: "po_1",
        status: "draft",
        company_id: "c1",
        requires_approval: false,
      });
      jest.spyOn(service, "listApprovalWorkflows").mockResolvedValue([]);
      jest
        .spyOn(service, "updatePurchaseOrders")
        .mockResolvedValue({ status: "approved" });

      const result = await service.submitPOForApproval("po_1");
      expect(result.status).toBe("approved");
    });

    it("throws when PO not in draft status", async () => {
      jest
        .spyOn(service, "retrievePurchaseOrder")
        .mockResolvedValue({ id: "po_1", status: "approved" });

      await expect(service.submitPOForApproval("po_1")).rejects.toThrow(
        "Only draft POs can be submitted",
      );
    });
  });
});
