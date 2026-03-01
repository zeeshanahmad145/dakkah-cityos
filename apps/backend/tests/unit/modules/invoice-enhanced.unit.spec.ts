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
        async listInvoices(_filter: any): Promise<any> {
          return [];
        }
        async retrieveInvoice(_id: string): Promise<any> {
          return null;
        }
        async createInvoices(_data: any): Promise<any> {
          return {};
        }
        async updateInvoices(_data: any): Promise<any> {
          return {};
        }
        async listInvoiceItems(_filter: any): Promise<any> {
          return [];
        }
        async createInvoiceItems(_data: any): Promise<any> {
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

import InvoiceModuleService from "../../../src/modules/invoice/service";

describe("InvoiceModuleService – Enhanced Methods", () => {
  let service: InvoiceModuleService;

  beforeEach(() => {
    service = new InvoiceModuleService();
    jest.clearAllMocks();
  });

  describe("generateInvoiceNumberByTenant", () => {
    it("generates invoice number with year and sequence", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([]);
      const result = await service.generateInvoiceNumberByTenant("tenant-1");
      const year = new Date().getFullYear();
      expect(result).toMatch(new RegExp(`^INV-${year}-00001$`));
    });

    it("increments sequence based on existing invoices", async () => {
      const yr = new Date().getFullYear();
      jest.spyOn(service, "listInvoices").mockResolvedValue([
        { id: "inv-1", invoice_number: `INV-${yr}-00001` },
        { id: "inv-2", invoice_number: `INV-${yr}-00002` },
        { id: "inv-3", invoice_number: `INV-${yr}-00003` },
      ]);
      const result = await service.generateInvoiceNumberByTenant("tenant-1");
      const year = new Date().getFullYear();
      expect(result).toBe(`INV-${year}-00004`);
    });
  });

  describe("calculateInvoiceTotals", () => {
    it("calculates totals from invoice items", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue({
        id: "inv-1",
        amount_paid: 0,
      });
      jest.spyOn(service, "listInvoiceItems").mockResolvedValue([
        { quantity: 2, unit_price: 1000, tax_total: 200 },
        { quantity: 1, unit_price: 500, tax_total: 50 },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({});

      const result = await service.calculateInvoiceTotals("inv-1");

      expect(result.subtotal).toBe(2500);
      expect(result.taxTotal).toBe(250);
      expect(result.total).toBe(2750);
      expect(result.itemCount).toBe(2);
      expect(updateSpy).toHaveBeenCalled();
    });

    it("throws when invoice not found", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue(null);
      await expect(service.calculateInvoiceTotals("inv-bad")).rejects.toThrow(
        "Invoice not found",
      );
    });
  });

  describe("markOverdue", () => {
    it("marks overdue invoices and returns count", async () => {
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([{ id: "inv-1" }, { id: "inv-2" }]);
      jest.spyOn(service, "updateInvoices").mockResolvedValue({});

      const result = await service.markOverdue("tenant-1");

      expect(result.updated).toBe(2);
      expect(result.invoiceIds).toEqual(["inv-1", "inv-2"]);
    });

    it("returns zero when no overdue invoices exist", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([]);

      const result = await service.markOverdue("tenant-1");

      expect(result.updated).toBe(0);
      expect(result.invoiceIds).toEqual([]);
    });
  });

  describe("getPaymentSummary", () => {
    it("returns fully paid summary", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue({
        id: "inv-1",
        status: "paid",
        total: 1000,
        amount_paid: 1000,
        paid_at: "2025-01-15",
        due_date: "2025-01-30",
      });

      const result = await service.getPaymentSummary("inv-1");

      expect(result.isFullyPaid).toBe(true);
      expect(result.balanceRemaining).toBe(0);
      expect(result.isOverdue).toBe(false);
    });

    it("returns partially paid summary with balance", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue({
        id: "inv-1",
        status: "sent",
        total: 1000,
        amount_paid: 400,
        paid_at: null,
        due_date: "2099-12-31",
      });

      const result = await service.getPaymentSummary("inv-1");

      expect(result.isFullyPaid).toBe(false);
      expect(result.balanceRemaining).toBe(600);
      expect(result.amountPaid).toBe(400);
    });

    it("detects overdue invoices", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue({
        id: "inv-1",
        status: "sent",
        total: 500,
        amount_paid: 0,
        paid_at: null,
        due_date: "2020-01-01",
      });

      const result = await service.getPaymentSummary("inv-1");

      expect(result.isOverdue).toBe(true);
      expect(result.isFullyPaid).toBe(false);
    });

    it("throws when invoice not found", async () => {
      jest.spyOn(service, "retrieveInvoice").mockResolvedValue(null);
      await expect(service.getPaymentSummary("inv-bad")).rejects.toThrow(
        "Invoice not found",
      );
    });
  });
});
