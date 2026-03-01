import { GET as getBookingSettings } from "../../../src/api/admin/settings/bookings/route";
import {
  GET as listI18n,
  POST as createI18n,
} from "../../../src/api/admin/i18n/route";
import {
  GET as listNotificationPrefs,
  POST as createNotificationPref,
} from "../../../src/api/admin/notification-preferences/route";
import { GET as listAudit } from "../../../src/api/admin/audit/route";
import { GET as listChannels } from "../../../src/api/admin/channels/route";
import { GET as getTemporalHealth } from "../../../src/api/admin/temporal/route";
import { POST as triggerTemporal } from "../../../src/api/admin/temporal/trigger/route";
import { POST as handleErpnextWebhook } from "../../../src/api/admin/webhooks/erpnext/route";
import { POST as handleFleetbaseWebhook } from "../../../src/api/admin/webhooks/fleetbase/route";
import { POST as handlePayloadWebhook } from "../../../src/api/admin/webhooks/payload/route";
import { POST as handleStripeWebhook } from "../../../src/api/admin/webhooks/stripe/route";

jest.mock("../../../src/lib/temporal-client", () => ({
  checkTemporalHealth: jest
    .fn()
    .mockResolvedValue({ healthy: true, namespace: "default" }),
  startWorkflow: jest
    .fn()
    .mockResolvedValue({ workflowId: "wf_1", runId: "run_1" }),
}));

jest.mock("../../../src/lib/event-dispatcher", () => ({
  getWorkflowForEvent: jest.fn().mockReturnValue(null),
}));

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Booking Settings Route", () => {
  it("should return booking configuration", async () => {
    const req = {
      scope: { resolve: jest.fn() },
      query: {},
      params: {},
      body: {},
    };
    const res = createRes();
    await getBookingSettings(req, res);
    expect(res.json).toHaveBeenCalledWith({
      config: expect.objectContaining({
        reminder_enabled: expect.any(Boolean),
      }),
    });
  });
});

describe("Admin I18n Routes", () => {
  describe("GET /admin/i18n", () => {
    it("should list translations with pagination", async () => {
      const items = [{ id: "t_1", key: "hello", value: "مرحبا" }];
      const mockService = {
        listTranslations: jest.fn().mockResolvedValue(items),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: { limit: "20", offset: "0" },
        params: {},
        body: {},
      };
      const res = createRes();
      await listI18n(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items, count: 1 }),
      );
    });
  });

  describe("POST /admin/i18n", () => {
    it("should create translation with valid data", async () => {
      const mockService = {
        createTranslations: jest.fn().mockResolvedValue({ id: "t_1" }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: {},
        body: {
          tenant_id: "ten_1",
          locale: "ar",
          key: "hello",
          value: "مرحبا",
        },
      };
      const res = createRes();
      await createI18n(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item: { id: "t_1" } });
    });

    it("should reject invalid i18n data", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: { locale: "ar" },
      };
      const res = createRes();
      await createI18n(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Validation failed" }),
      );
    });
  });
});

describe("Admin Notification Preferences Routes", () => {
  it("should list notification preferences", async () => {
    const items = [{ id: "np_1", channel: "email", enabled: true }];
    const mockService = {
      listNotificationPreferences: jest.fn().mockResolvedValue(items),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockService) },
      query: { limit: "20", offset: "0" },
      params: {},
      body: {},
    };
    const res = createRes();
    await listNotificationPrefs(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ items, count: 1 }),
    );
  });

  it("should reject invalid notification preference", async () => {
    const req = {
      scope: { resolve: jest.fn() },
      query: {},
      params: {},
      body: { channel: "invalid" },
    };
    const res = createRes();
    await createNotificationPref(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Temporal Routes", () => {
  describe("GET /admin/temporal", () => {
    it("should return temporal health status", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: {},
      };
      const res = createRes();
      await getTemporalHealth(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ healthy: true }),
      );
    });
  });

  describe("POST /admin/temporal/trigger", () => {
    it("should trigger a temporal workflow", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: { workflowId: "test-workflow", input: { key: "value" } },
      };
      const res = createRes();
      await triggerTemporal(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("should reject invalid trigger request", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: { workflowId: "" },
      };
      const res = createRes();
      await triggerTemporal(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe("Admin Webhook Routes", () => {
  describe("POST /admin/webhooks/erpnext", () => {
    it("should process erpnext webhook", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        headers: {},
        query: {},
        params: {},
        body: { doctype: "Sales Invoice", event: "on_submit", data: {} },
      };
      const res = createRes();
      await handleErpnextWebhook(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("POST /admin/webhooks/fleetbase", () => {
    it("should process fleetbase webhook", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        headers: {},
        query: {},
        params: {},
        body: { event: "order.completed", data: {} },
      };
      const res = createRes();
      await handleFleetbaseWebhook(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("POST /admin/webhooks/payload", () => {
    it("should process payload webhook", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        headers: {},
        query: {},
        params: {},
        body: { event: "product.published", data: { id: "content_1" } },
      };
      const res = createRes();
      await handlePayloadWebhook(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("POST /admin/webhooks/stripe", () => {
    it("should process stripe webhook without secret verification", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        headers: {},
        query: {},
        params: {},
        body: { type: "payment_intent.succeeded", data: { object: {} } },
      };
      const res = createRes();
      await handleStripeWebhook(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
