jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listInvoices(_f: any): Promise<any> {
          return [];
        }
        async createInvoices(_data: any): Promise<any> {
          return null;
        }
        async createInvoiceItems(_data: any): Promise<any> {
          return [];
        }
        async updateInvoices(_data: any): Promise<any> {
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

import InvoiceModuleService from "../../../src/modules/invoice/service";

describe("InvoiceModuleService", () => {
  let service: InvoiceModuleService;

  beforeEach(() => {
    service = new InvoiceModuleService();
  });

  describe("generateInvoiceNumber", () => {
    it("generates a properly formatted invoice number", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([]);

      const result = await service.generateInvoiceNumber("comp_abcd1234");

      expect(result).toMatch(/^INV-COMP-\d{6}-0001$/);
    });

    it("uses first 4 characters of company ID as prefix", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([]);

      const result = await service.generateInvoiceNumber("test_company");

      expect(result).toMatch(/^INV-TEST-/);
    });
  });

  describe("createInvoiceWithItems", () => {
    it("creates an invoice with calculated totals", async () => {
      jest
        .spyOn(service, "generateInvoiceNumber")
        .mockResolvedValue("INV-TEST-202501-0001");
      const createInvSpy = jest
        .spyOn(service, "createInvoices")
        .mockResolvedValue({ id: "inv-1" });
      jest
        .spyOn(service, "createInvoiceItems")
        .mockResolvedValue([{ id: "ii-1" }]);

      const result = await service.createInvoiceWithItems({
        company_id: "comp-1",
        issue_date: new Date("2025-01-01"),
        due_date: new Date("2025-01-31"),
        items: [
          { title: "Widget A", quantity: 2, unit_price: 1000 },
          { title: "Widget B", quantity: 1, unit_price: 2000 },
        ],
      });

      expect(result.invoice).toEqual({ id: "inv-1" });
      expect(createInvSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 4000,
          total: 4000,
          amount_due: 4000,
          status: "draft",
        }),
      );
    });

    it("defaults currency to usd and payment_terms_days to 30", async () => {
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

    it("creates invoice items linked to the invoice", async () => {
      jest
        .spyOn(service, "generateInvoiceNumber")
        .mockResolvedValue("INV-TEST-202501-0001");
      jest.spyOn(service, "createInvoices").mockResolvedValue({ id: "inv-1" });
      const createItemsSpy = jest
        .spyOn(service, "createInvoiceItems")
        .mockResolvedValue([]);

      await service.createInvoiceWithItems({
        company_id: "comp-1",
        issue_date: new Date(),
        due_date: new Date(),
        items: [{ title: "Test", quantity: 3, unit_price: 500 }],
      });

      expect(createItemsSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          invoice_id: "inv-1",
          title: "Test",
          subtotal: 1500,
          total: 1500,
        }),
      ]);
    });
  });

  describe("markAsSent", () => {
    it("updates invoice status to sent", async () => {
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({ id: "inv-1", status: "sent" });

      await service.markAsSent("inv-1");

      expect(updateSpy).toHaveBeenCalledWith({ id: "inv-1", status: "sent" });
    });
  });

  describe("markAsPaid", () => {
    it("marks invoice as paid when full amount is paid", async () => {
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([
          { id: "inv-1", total: 5000, amount_paid: 0, status: "sent" },
        ]);
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({});

      await service.markAsPaid("inv-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "paid",
          amount_paid: 5000,
          amount_due: 0,
        }),
      );
    });

    it("applies partial payment without changing status", async () => {
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

    it("throws when invoice not found", async () => {
      jest.spyOn(service, "listInvoices").mockResolvedValue([undefined]);

      await expect(service.markAsPaid("nonexistent")).rejects.toThrow(
        "Invoice nonexistent not found",
      );
    });

    it("accumulates payments across multiple calls", async () => {
      jest
        .spyOn(service, "listInvoices")
        .mockResolvedValue([
          { id: "inv-1", total: 5000, amount_paid: 2000, status: "sent" },
        ]);
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({});

      await service.markAsPaid("inv-1", 3000);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "paid",
          amount_paid: 5000,
          amount_due: 0,
        }),
      );
    });
  });

  describe("voidInvoice", () => {
    it("voids an invoice with reason", async () => {
      const updateSpy = jest
        .spyOn(service, "updateInvoices")
        .mockResolvedValue({ id: "inv-1", status: "void" });

      await service.voidInvoice("inv-1", "Duplicate invoice");

      expect(updateSpy).toHaveBeenCalledWith({
        id: "inv-1",
        status: "void",
        internal_notes: "Duplicate invoice",
      });
    });
  });
});
