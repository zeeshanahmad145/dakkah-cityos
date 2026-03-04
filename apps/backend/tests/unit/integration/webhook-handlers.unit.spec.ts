import { vi } from "vitest";
import crypto from "crypto";

const createRes = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  headers: {},
  body: {},
  query: {},
  params: {},
  ...overrides,
});

const mockStripeService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  handlePaymentIntentSucceeded: vi.fn(),
  handleCheckoutSessionCompleted: vi.fn(),
};

const mockErpNextService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  handleSalesInvoiceCreated: vi.fn(),
  handlePaymentEntrySubmitted: vi.fn(),
};

const mockPayloadCmsService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  handleCollectionCreate: vi.fn(),
  handleCollectionUpdate: vi.fn(),
};

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const timestamp = signature
    .split(",")
    .find((s: string) => s.startsWith("t="))
    ?.split("=")[1];
  const sig = signature
    .split(",")
    .find((s: string) => s.startsWith("v1="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!timestamp || !sig) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return expected === sig;
}

function verifyErpNextSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

function verifyPayloadApiKey(apiKey: string, expectedKey: string): boolean {
  return apiKey === expectedKey;
}

async function handleStripeWebhook(
  req: any,
  res: any,
  config: { secret: string; service: any },
) {
  try {
    const payload =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!payload || payload === "{}") {
      res.status(400).json({ error: "Malformed payload" });
      return;
    }
    const signature = req.headers["stripe-signature"];
    if (
      !signature ||
      !verifyStripeSignature(payload, signature, config.secret)
    ) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
    const event =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    switch (event.type) {
      case "payment_intent.succeeded":
        await config.service.handlePaymentIntentSucceeded(event.data);
        break;
      case "checkout.session.completed":
        await config.service.handleCheckoutSessionCompleted(event.data);
        break;
      default:
        res.status(200).json({ received: true, handled: false });
        return;
    }
    res.status(200).json({ received: true, handled: true });
  } catch {
    res.status(400).json({ error: "Malformed payload" });
  }
}

async function handleErpNextWebhook(
  req: any,
  res: any,
  config: { secret: string; service: any },
) {
  const signature = req.headers["x-erpnext-signature"];
  if (!signature) {
    res.status(401).json({ error: "Missing signature" });
    return;
  }
  const payload =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (!verifyErpNextSignature(payload, signature, config.secret)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }
  const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const eventType = event.event;
  if (!eventType) {
    res.status(400).json({ error: "Missing event type" });
    return;
  }
  switch (eventType) {
    case "sales_invoice.created":
      await config.service.handleSalesInvoiceCreated(event.data);
      break;
    case "payment_entry.submitted":
      await config.service.handlePaymentEntrySubmitted(event.data);
      break;
  }
  res.status(200).json({ received: true });
}

async function handlePayloadCmsWebhook(
  req: any,
  res: any,
  config: { apiKey: string; service: any },
) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || !verifyPayloadApiKey(apiKey, config.apiKey)) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }
  const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  switch (event.event) {
    case "collection.create":
      await config.service.handleCollectionCreate(event.data);
      break;
    case "collection.update":
      await config.service.handleCollectionUpdate(event.data);
      break;
  }
  res.status(200).json({ received: true });
}

describe("Webhook Handlers", () => {
  beforeEach(() => vi.clearAllMocks());

  const stripeSecret = "whsec_test_secret";
  const erpNextSecret = "erpnext_webhook_secret";
  const payloadApiKey = "payload_api_key_123";

  function createStripeSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    return `t=${timestamp},v1=${sig}`;
  }

  describe("Stripe Webhook Handler", () => {
    it("should verify webhook signature", async () => {
      const body = JSON.stringify({
        type: "payment_intent.succeeded",
        data: { id: "pi_123" },
      });
      const signature = createStripeSignature(body, stripeSecret);
      const req = createReq({
        headers: { "stripe-signature": signature },
        body,
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true, handled: true });
    });

    it("should process payment_intent.succeeded event", async () => {
      const eventData = { id: "pi_123", amount: 5000, currency: "usd" };
      const body = JSON.stringify({
        type: "payment_intent.succeeded",
        data: eventData,
      });
      const signature = createStripeSignature(body, stripeSecret);
      const req = createReq({
        headers: { "stripe-signature": signature },
        body,
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(
        mockStripeService.handlePaymentIntentSucceeded,
      ).toHaveBeenCalledWith(eventData);
    });

    it("should process checkout.session.completed event", async () => {
      const eventData = { id: "cs_123", payment_status: "paid" };
      const body = JSON.stringify({
        type: "checkout.session.completed",
        data: eventData,
      });
      const signature = createStripeSignature(body, stripeSecret);
      const req = createReq({
        headers: { "stripe-signature": signature },
        body,
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(
        mockStripeService.handleCheckoutSessionCompleted,
      ).toHaveBeenCalledWith(eventData);
    });

    it("should return 400 for invalid signature", async () => {
      const body = JSON.stringify({
        type: "payment_intent.succeeded",
        data: {},
      });
      const req = createReq({
        headers: { "stripe-signature": "t=123,v1=invalidsig" },
        body,
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid signature" });
    });

    it("should return 200 for unhandled event types", async () => {
      const body = JSON.stringify({ type: "customer.updated", data: {} });
      const signature = createStripeSignature(body, stripeSecret);
      const req = createReq({
        headers: { "stripe-signature": signature },
        body,
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true, handled: false });
    });

    it("should handle malformed payload gracefully", async () => {
      const req = createReq({
        headers: { "stripe-signature": "t=123,v1=abc" },
        body: {},
      });
      const res = createRes();
      await handleStripeWebhook(req, res, {
        secret: stripeSecret,
        service: mockStripeService,
      });
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("ERPNext Webhook Handler", () => {
    function createErpNextSignature(payload: string, secret: string): string {
      return crypto.createHmac("sha256", secret).update(payload).digest("hex");
    }

    it("should verify HMAC signature", async () => {
      const body = JSON.stringify({
        event: "sales_invoice.created",
        data: { name: "SINV-001" },
      });
      const signature = createErpNextSignature(body, erpNextSecret);
      const req = createReq({
        headers: { "x-erpnext-signature": signature },
        body,
      });
      const res = createRes();
      await handleErpNextWebhook(req, res, {
        secret: erpNextSecret,
        service: mockErpNextService,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it("should process sales_invoice.created event", async () => {
      const eventData = { name: "SINV-001", grand_total: 1500 };
      const body = JSON.stringify({
        event: "sales_invoice.created",
        data: eventData,
      });
      const signature = createErpNextSignature(body, erpNextSecret);
      const req = createReq({
        headers: { "x-erpnext-signature": signature },
        body,
      });
      const res = createRes();
      await handleErpNextWebhook(req, res, {
        secret: erpNextSecret,
        service: mockErpNextService,
      });
      expect(mockErpNextService.handleSalesInvoiceCreated).toHaveBeenCalledWith(
        eventData,
      );
    });

    it("should process payment_entry.submitted event", async () => {
      const eventData = { name: "PE-001", paid_amount: 500 };
      const body = JSON.stringify({
        event: "payment_entry.submitted",
        data: eventData,
      });
      const signature = createErpNextSignature(body, erpNextSecret);
      const req = createReq({
        headers: { "x-erpnext-signature": signature },
        body,
      });
      const res = createRes();
      await handleErpNextWebhook(req, res, {
        secret: erpNextSecret,
        service: mockErpNextService,
      });
      expect(
        mockErpNextService.handlePaymentEntrySubmitted,
      ).toHaveBeenCalledWith(eventData);
    });

    it("should return 401 for missing signature", async () => {
      const body = JSON.stringify({ event: "sales_invoice.created", data: {} });
      const req = createReq({ headers: {}, body });
      const res = createRes();
      await handleErpNextWebhook(req, res, {
        secret: erpNextSecret,
        service: mockErpNextService,
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing signature" });
    });

    it("should handle missing event type", async () => {
      const body = JSON.stringify({ data: { name: "SINV-001" } });
      const signature = createErpNextSignature(body, erpNextSecret);
      const req = createReq({
        headers: { "x-erpnext-signature": signature },
        body,
      });
      const res = createRes();
      await handleErpNextWebhook(req, res, {
        secret: erpNextSecret,
        service: mockErpNextService,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing event type" });
    });
  });

  describe("Payload CMS Webhook Handler", () => {
    it("should verify API key", async () => {
      const body = JSON.stringify({
        event: "collection.create",
        data: { collection: "products", id: "p_1" },
      });
      const req = createReq({ headers: { "x-api-key": payloadApiKey }, body });
      const res = createRes();
      await handlePayloadCmsWebhook(req, res, {
        apiKey: payloadApiKey,
        service: mockPayloadCmsService,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it("should process collection.create event", async () => {
      const eventData = {
        collection: "products",
        id: "p_1",
        title: "New Product",
      };
      const body = JSON.stringify({
        event: "collection.create",
        data: eventData,
      });
      const req = createReq({ headers: { "x-api-key": payloadApiKey }, body });
      const res = createRes();
      await handlePayloadCmsWebhook(req, res, {
        apiKey: payloadApiKey,
        service: mockPayloadCmsService,
      });
      expect(mockPayloadCmsService.handleCollectionCreate).toHaveBeenCalledWith(
        eventData,
      );
    });

    it("should process collection.update event", async () => {
      const eventData = {
        collection: "products",
        id: "p_1",
        title: "Updated Product",
      };
      const body = JSON.stringify({
        event: "collection.update",
        data: eventData,
      });
      const req = createReq({ headers: { "x-api-key": payloadApiKey }, body });
      const res = createRes();
      await handlePayloadCmsWebhook(req, res, {
        apiKey: payloadApiKey,
        service: mockPayloadCmsService,
      });
      expect(mockPayloadCmsService.handleCollectionUpdate).toHaveBeenCalledWith(
        eventData,
      );
    });

    it("should return 403 for invalid API key", async () => {
      const body = JSON.stringify({ event: "collection.create", data: {} });
      const req = createReq({ headers: { "x-api-key": "wrong_key" }, body });
      const res = createRes();
      await handlePayloadCmsWebhook(req, res, {
        apiKey: payloadApiKey,
        service: mockPayloadCmsService,
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid API key" });
    });
  });
});
