import { POST as rescheduleBooking } from "../../../src/api/admin/bookings/[id]/reschedule/route";
import { GET as listInvoices } from "../../../src/api/admin/invoices/route";
import { POST as voidInvoice } from "../../../src/api/admin/invoices/[id]/void/route";
import { POST as payInvoice } from "../../../src/api/admin/invoices/[id]/pay/route";
import { POST as sendInvoice } from "../../../src/api/admin/invoices/[id]/send/route";
import { GET as listOverdueInvoices } from "../../../src/api/admin/invoices/overdue/route";
import { GET as listPayouts } from "../../../src/api/admin/payouts/route";
import { POST as holdPayout } from "../../../src/api/admin/payouts/[id]/hold/route";
import {
  GET as getProductCommission,
  POST as setProductCommission,
} from "../../../src/api/admin/products/[id]/commission/route";

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
    MedusaService: () => class MockMedusaBase {},
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
    ContainerRegistrationKeys: { QUERY: "query" },
  };
});

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Booking Reschedule Route", () => {
  it("should reschedule a valid booking", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "book_1", status: "confirmed" }] }),
    };
    const mockService = {
      updateBookings: jest.fn().mockResolvedValue({ id: "book_1" }),
    };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "bookingModuleService" ? mockService : mockQuery,
        ),
      },
      query: {},
      params: { id: "book_1" },
      body: { new_scheduled_at: futureDate, reason: "Customer request" },
    };
    const res = createRes();
    await rescheduleBooking(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
  });

  it("should return 404 for non-existent booking", async () => {
    const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "book_missing" },
      body: { new_scheduled_at: new Date(Date.now() + 86400000).toISOString() },
    };
    const res = createRes();
    await rescheduleBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should reject rescheduling completed bookings", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "book_1", status: "completed" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "book_1" },
      body: { new_scheduled_at: new Date(Date.now() + 86400000).toISOString() },
    };
    const res = createRes();
    await rescheduleBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Invoices Routes", () => {
  describe("GET /admin/invoices", () => {
    it("should list invoices with filters", async () => {
      const invoices = [{ id: "inv_1", status: "sent", total: 100 }];
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: invoices }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { status: "sent" },
        params: {},
        body: {},
      };
      const res = createRes();
      await listInvoices(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "invoice",
          filters: expect.objectContaining({ status: "sent" }),
        }),
      );
    });
  });

  describe("POST /admin/invoices/:id/void", () => {
    it("should void an invoice", async () => {
      const mockModule = {
        voidInvoice: jest
          .fn()
          .mockResolvedValue({ id: "inv_1", status: "voided" }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockModule) },
        query: {},
        params: { id: "inv_1" },
        body: { reason: "Duplicate" },
      };
      const res = createRes();
      await voidInvoice(req, res);
      expect(mockModule.voidInvoice).toHaveBeenCalledWith("inv_1", "Duplicate");
      expect(res.json).toHaveBeenCalledWith({
        invoice: expect.objectContaining({ status: "voided" }),
      });
    });
  });

  describe("POST /admin/invoices/:id/pay", () => {
    it("should mark invoice as paid", async () => {
      const mockModule = {
        markAsPaid: jest
          .fn()
          .mockResolvedValue({ id: "inv_1", status: "paid" }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockModule) },
        query: {},
        params: { id: "inv_1" },
        body: { amount: 100 },
      };
      const res = createRes();
      await payInvoice(req, res);
      expect(mockModule.markAsPaid).toHaveBeenCalledWith("inv_1", 100);
      expect(res.json).toHaveBeenCalledWith({
        invoice: expect.objectContaining({ status: "paid" }),
      });
    });
  });

  describe("POST /admin/invoices/:id/send", () => {
    it("should mark invoice as sent", async () => {
      const mockModule = {
        markAsSent: jest
          .fn()
          .mockResolvedValue({ id: "inv_1", status: "sent" }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockModule) },
        query: {},
        params: { id: "inv_1" },
        body: {},
      };
      const res = createRes();
      await sendInvoice(req, res);
      expect(mockModule.markAsSent).toHaveBeenCalledWith("inv_1");
    });
  });

  describe("GET /admin/invoices/overdue", () => {
    it("should list overdue invoices", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({
          data: [
            {
              id: "inv_1",
              status: "sent",
              total: 100,
              amount_paid: 0,
              due_date: "2025-01-01",
            },
          ],
        }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      };
      const res = createRes();
      await listOverdueInvoices(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            status: { $in: ["sent", "partially_paid"] },
          }),
        }),
      );
    });
  });
});

describe("Admin Payouts Routes", () => {
  describe("GET /admin/payouts", () => {
    it("should list payouts with pagination", async () => {
      const payouts = [{ id: "pay_1", amount: 500 }];
      const mockQuery = {
        graph: jest
          .fn()
          .mockResolvedValue({ data: payouts, metadata: { count: 1 } }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { limit: "20", offset: "0" },
        params: {},
        body: {},
      };
      const res = createRes();
      await listPayouts(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ payouts, count: 1 }),
      );
    });
  });

  describe("POST /admin/payouts/:id/hold", () => {
    it("should hold a pending payout", async () => {
      const mockQuery = {
        graph: jest
          .fn()
          .mockResolvedValue({ data: [{ id: "pay_1", status: "pending" }] }),
      };
      const mockService = {
        updatePayouts: jest
          .fn()
          .mockResolvedValue({ id: "pay_1", status: "on_hold" }),
      };
      const req = {
        scope: {
          resolve: jest.fn((name: string) =>
            name === "payoutModuleService" ? mockService : mockQuery,
          ),
        },
        query: {},
        params: { id: "pay_1" },
        body: { reason: "Review needed" },
      };
      const res = createRes();
      await holdPayout(req, res);
      expect(mockService.updatePayouts).toHaveBeenCalledWith(
        expect.objectContaining({ status: "on_hold" }),
      );
    });

    it("should return 404 for non-existent payout", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [undefined] }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "pay_missing" },
        body: {},
      };
      const res = createRes();
      await holdPayout(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reject holding non-pending payouts", async () => {
      const mockQuery = {
        graph: jest
          .fn()
          .mockResolvedValue({ data: [{ id: "pay_1", status: "completed" }] }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "pay_1" },
        body: {},
      };
      const res = createRes();
      await holdPayout(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe("Admin Product Commission Routes", () => {
  describe("GET /admin/products/:id/commission", () => {
    it("should return commission override if exists", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({
          data: [{ id: "comm_1", product_id: "prod_1", rate: 15 }],
        }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "prod_1" },
        body: {},
      };
      const res = createRes();
      await getProductCommission(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ has_override: true }),
      );
    });

    it("should return no override when none set", async () => {
      const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "prod_1" },
        body: {},
      };
      const res = createRes();
      await getProductCommission(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ has_override: false, commission: null }),
      );
    });
  });

  describe("POST /admin/products/:id/commission", () => {
    it("should reject invalid percentage rate", async () => {
      const mockQuery = { graph: jest.fn() };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "prod_1" },
        body: { rate: 150, type: "percentage" },
      };
      const res = createRes();
      await setProductCommission(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
