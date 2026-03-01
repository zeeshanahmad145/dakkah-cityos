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
        async listInvoices(_filter: any, _options?: any): Promise<any> {
          return [[], 0];
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
        async createInvoiceItems(_data: any): Promise<any> {
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

import InvoiceModuleService from "../../../src/modules/invoice/service";

describe("InvoiceModuleService", () => {
  let service: InvoiceModuleService;

  beforeEach(() => {
    service = new InvoiceModuleService();
    jest.clearAllMocks();
  });

  describe("generateInvoiceNumber", () => {
    it("generates a unique invoice number with company prefix", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([]);

      const result = await service.generateInvoiceNumber("comp-1234");

      expect(result).toMatch(/^INV-COMP-\d{6}-0001$/);
    });

    it("increments sequence number based on existing invoices", async () => {
      const prefix = `INV-COMP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([
          { invoice_number: `${prefix}-0001` },
          { invoice_number: `${prefix}-0002` },
          { invoice_number: `${prefix}-0003` },
          { invoice_number: `${prefix}-0004` },
          { invoice_number: `${prefix}-0005` },
        ]);

      const result = await service.generateInvoiceNumber("comp-1234");

      expect(result).toMatch(/^INV-COMP-\d{6}-0006$/);
    });
  });

  describe("createInvoiceWithItems", () => {
    it("creates an invoice with items and calculates totals", async () => {
      jest
        .spyOn(service, "generateInvoiceNumber")
        .mockResolvedValue("INV-TEST-202501-0001");
      const createInvSpy = jest
        .spyOn(service, "createInvoices")
        .mockResolvedValue({ id: "inv-1" });
      const createItemsSpy = jest
        .spyOn(service, "createInvoiceItems")
        .mockResolvedValue([{ id: "item-1" }]);

      const result = await service.createInvoiceWithItems({
        company_id: "comp-1",
        issue_date: new Date("2025-01-01"),
        due_date: new Date("2025-01-31"),
        items: [
          { title: "Widget A", quantity: 2, unit_price: 1000 },
          { title: "Widget B", quantity: 1, unit_price: 2500 },
        ],
      });

      expect(result.invoice).toEqual({ id: "inv-1" });
      expect(createInvSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_number: "INV-TEST-202501-0001",
          status: "draft",
          subtotal: 4500,
          total: 4500,
        }),
      );
      expect(createItemsSpy).toHaveBeenCalled();
    });

    it("uses default currency and payment terms", async () => {
      jest
        .spyOn(service, "generateInvoiceNumber")
        .mockResolvedValue("INV-TEST-202501-0001");
      const createInvSpy = jest
        .spyOn(service, "createInvoices")
        .mockResolvedValue({ id: "inv-1" });
      jest.spyOn(service, "createInvoiceItems").mockResolvedValue([]);

      await service.createInvoiceWithItems({
        company_id: "comp-1",
        issue_date: new Date(),
        due_date: new Date(),
        items: [{ title: "Item", quantity: 1, unit_price: 100 }],
      });

      expect(createInvSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          currency_code: "usd",
          payment_terms_days: 30,
        }),
      );
    });
  });

  describe("markAsPaid", () => {
    it("marks invoice as paid when full amount is provided", async () => {
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([
          { id: "inv-1", total: 5000, amount_paid: 0, status: "sent" },
        ]);
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({
          id: "inv-1",
          status: "paid",
        });

      const result = await service.markAsPaid("inv-1", 5000);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "paid",
          amount_paid: 5000,
          amount_due: 0,
        }),
      );
    });

    it("keeps status when partial payment is made", async () => {
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([
          { id: "inv-1", total: 5000, amount_paid: 0, status: "sent" },
        ]);
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({});

      await service.markAsPaid("inv-1", 2000);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "sent",
          amount_paid: 2000,
          amount_due: 3000,
        }),
      );
    });

    it("throws when invoice is not found", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([undefined]);

      await expect(service.markAsPaid("inv-999")).rejects.toThrow(
        "Invoice inv-999 not found",
      );
    });
  });

  describe("voidInvoice", () => {
    it("voids an invoice with a reason", async () => {
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({
          id: "inv-1",
          status: "void",
        });

      await service.voidInvoice("inv-1", "Duplicate invoice");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "inv-1",
          status: "void",
          internal_notes: "Duplicate invoice",
        }),
      );
    });
  });

  describe("markAsSent", () => {
    it("marks invoice status as sent", async () => {
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({
          id: "inv-1",
          status: "sent",
        });

      await service.markAsSent("inv-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "inv-1",
          status: "sent",
        }),
      );
    });
  });
});
