jest.mock("../../../src/lib/logger", () => ({
  subscriberLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));
jest.mock("../../../src/lib/config", () => ({
  appConfig: {
    storefrontUrl: "https://store.test",
    urls: { storefront: "https://store.test" },
    emails: { support: "support@test.com" },
    features: {
      enableEmailNotifications: true,
      enableAdminNotifications: true,
    },
    subscription: {
      maxPaymentRetries: 3,
      gracePeriodDays: 7,
    },
    temporal: {
      isConfigured: true,
      namespace: "default",
      taskQueue: "cityos-main",
    },
  },
}));
jest.mock("../../../src/lib/event-dispatcher", () => ({
  dispatchEventToTemporal: jest.fn(),
  getWorkflowForEvent: jest.fn(),
}));

import companyCreatedHandler from "../../../src/subscribers/company-created";
import { config as companyConfig } from "../../../src/subscribers/company-created";
import customerCreatedHandler from "../../../src/subscribers/customer-created";
import { config as customerConfig } from "../../../src/subscribers/customer-created";
import payoutCompletedHandler from "../../../src/subscribers/payout-completed";
import { config as payoutCompletedConfig } from "../../../src/subscribers/payout-completed";
import payoutFailedHandler from "../../../src/subscribers/payout-failed";
import { config as payoutFailedConfig } from "../../../src/subscribers/payout-failed";
import purchaseOrderSubmittedHandler from "../../../src/subscribers/purchase-order-submitted";
import { config as poConfig } from "../../../src/subscribers/purchase-order-submitted";
import quoteAcceptedHandler from "../../../src/subscribers/quote-accepted";
import { config as quoteAcceptedConfig } from "../../../src/subscribers/quote-accepted";
import quoteApprovedHandler from "../../../src/subscribers/quote-approved";
import { config as quoteApprovedConfig } from "../../../src/subscribers/quote-approved";
import quoteDeclinedHandler from "../../../src/subscribers/quote-declined";
import { config as quoteDeclinedConfig } from "../../../src/subscribers/quote-declined";
import reviewCreatedHandler from "../../../src/subscribers/review-created";
import { config as reviewConfig } from "../../../src/subscribers/review-created";
import integrationSyncHandler from "../../../src/subscribers/integration-sync-subscriber";
import { config as integrationSyncConfig } from "../../../src/subscribers/integration-sync-subscriber";
import temporalEventBridge from "../../../src/subscribers/temporal-event-bridge";
import { config as temporalConfig } from "../../../src/subscribers/temporal-event-bridge";
import {
  dispatchEventToTemporal,
  getWorkflowForEvent,
} from "../../../src/lib/event-dispatcher";

const mockCreateNotifications = jest.fn();
const mockGraph = jest.fn();
const mockRetrieveCompany = jest.fn();
const mockRetrievePurchaseOrder = jest.fn();
const mockRetrieveQuote = jest.fn();

function makeContainer() {
  return {
    resolve: jest.fn((dep: string) => {
      if (dep === "notification")
        return { createNotifications: mockCreateNotifications };
      if (dep === "query") return { graph: mockGraph };
      if (dep === "logger")
        return { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
      if (dep === "company") return { retrieveCompany: mockRetrieveCompany };
      if (dep === "purchaseOrder")
        return { retrievePurchaseOrder: mockRetrievePurchaseOrder };
      if (dep === "quote") return { retrieveQuote: mockRetrieveQuote };
      return {};
    }),
  };
}

function makeArgs(data: any) {
  return { event: { data }, container: makeContainer() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("company-created subscriber", () => {
  const company = { id: "comp_1", name: "Acme Inc", email: "acme@test.com" };

  beforeEach(() => {
    mockRetrieveCompany.mockResolvedValue(company);
  });

  it("exports correct event config", () => {
    expect(companyConfig.event).toBe("company.created");
  });

  it("sends email and admin notification", async () => {
    await companyCreatedHandler(makeArgs({ id: "comp_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "company-welcome",
        to: "acme@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveCompany.mockRejectedValue(new Error("fail"));
    await expect(
      companyCreatedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("customer-created subscriber", () => {
  const customer = { id: "cust_1", email: "user@test.com", first_name: "Bob" };

  beforeEach(() => {
    mockGraph.mockResolvedValue({ data: [customer] });
  });

  it("exports correct event config", () => {
    expect(customerConfig.event).toBe("customer.created");
  });

  it("sends welcome email and admin notification", async () => {
    await customerCreatedHandler(makeArgs({ id: "cust_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "customer-welcome",
        to: "user@test.com",
      }),
    );
  });

  it("returns early when no email", async () => {
    mockGraph.mockResolvedValue({ data: [{ id: "cust_1" }] });
    await customerCreatedHandler(makeArgs({ id: "cust_1" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      customerCreatedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("payout-completed subscriber", () => {
  beforeEach(() => {
    mockGraph
      .mockResolvedValueOnce({
        data: [{ id: "vendor_1", name: "V1", contact_email: "v@test.com" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "pay_1",
            payout_number: "PO-001",
            net_amount: 10000,
            currency: "USD",
          },
        ],
      });
  });

  it("exports correct event config", () => {
    expect(payoutCompletedConfig.event).toBe("payout.completed");
  });

  it("sends email and admin notification", async () => {
    await payoutCompletedHandler(
      makeArgs({ id: "pay_1", vendor_id: "vendor_1" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "payout-completed",
        to: "v@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockReset().mockRejectedValue(new Error("fail"));
    await expect(
      payoutCompletedHandler(makeArgs({ id: "x", vendor_id: "y" })),
    ).resolves.toBeUndefined();
  });
});

describe("payout-failed subscriber", () => {
  beforeEach(() => {
    mockGraph
      .mockResolvedValueOnce({
        data: [{ id: "vendor_1", name: "V1", contact_email: "v@test.com" }],
      })
      .mockResolvedValueOnce({
        data: [{ id: "pay_1", payout_number: "PO-002", net_amount: 5000 }],
      });
  });

  it("exports correct event config", () => {
    expect(payoutFailedConfig.event).toBe("payout.failed");
  });

  it("sends email and admin notification", async () => {
    await payoutFailedHandler(
      makeArgs({ id: "pay_1", vendor_id: "vendor_1", error: "bank rejected" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "payout-failed", to: "v@test.com" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockReset().mockRejectedValue(new Error("fail"));
    await expect(
      payoutFailedHandler(makeArgs({ id: "x", vendor_id: "y" })),
    ).resolves.toBeUndefined();
  });
});

describe("purchase-order-submitted subscriber", () => {
  const po = {
    id: "po_1",
    po_number: "PO-100",
    total: 50000,
    status: "submitted",
    company: { name: "Acme", email: "acme@test.com" },
  };

  beforeEach(() => {
    mockRetrievePurchaseOrder.mockResolvedValue(po);
  });

  it("exports correct event config", () => {
    expect(poConfig.event).toBe("purchase_order.submitted");
  });

  it("sends email and admin notification", async () => {
    await purchaseOrderSubmittedHandler(makeArgs({ id: "po_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "purchase-order-submitted",
        to: "acme@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrievePurchaseOrder.mockRejectedValue(new Error("fail"));
    await expect(
      purchaseOrderSubmittedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("quote-accepted subscriber", () => {
  beforeEach(() => {
    mockRetrieveQuote.mockResolvedValue({
      id: "q_1",
      quote_number: "Q-001",
      company: { name: "Acme" },
    });
  });

  it("exports correct event config", () => {
    expect(quoteAcceptedConfig.event).toBe("quote.accepted");
  });

  it("sends admin notification", async () => {
    await quoteAcceptedHandler(makeArgs({ id: "q_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveQuote.mockRejectedValue(new Error("fail"));
    await expect(
      quoteAcceptedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("quote-approved subscriber", () => {
  const quote = {
    id: "q_1",
    quote_number: "Q-002",
    total: 10000,
    valid_until: "2025-06-01",
    company: { name: "Acme", email: "acme@test.com" },
    metadata: {},
  };

  beforeEach(() => {
    mockRetrieveQuote.mockResolvedValue(quote);
  });

  it("exports correct event config", () => {
    expect(quoteApprovedConfig.event).toBe("quote.approved");
  });

  it("sends email and admin notification", async () => {
    await quoteApprovedHandler(makeArgs({ id: "q_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "quote-approved",
        to: "acme@test.com",
      }),
    );
  });

  it("returns early when quote not found", async () => {
    mockRetrieveQuote.mockResolvedValue(null);
    await quoteApprovedHandler(makeArgs({ id: "missing" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockRetrieveQuote.mockRejectedValue(new Error("fail"));
    await expect(
      quoteApprovedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("quote-declined subscriber", () => {
  beforeEach(() => {
    mockRetrieveQuote.mockResolvedValue({ id: "q_1", quote_number: "Q-003" });
  });

  it("exports correct event config", () => {
    expect(quoteDeclinedConfig.event).toBe("quote.declined");
  });

  it("sends admin notification", async () => {
    await quoteDeclinedHandler(
      makeArgs({ id: "q_1", reason: "too expensive" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveQuote.mockRejectedValue(new Error("fail"));
    await expect(
      quoteDeclinedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("review-created subscriber", () => {
  it("exports correct event config", () => {
    expect(reviewConfig.event).toBe("review.created");
  });

  it("sends admin notification with product name", async () => {
    mockGraph.mockResolvedValue({ data: [{ title: "Widget" }] });
    await reviewCreatedHandler(
      makeArgs({ id: "rev_1", product_id: "prod_1", rating: 4 }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "admin-ui",
        data: expect.objectContaining({
          description: expect.stringContaining("4-star"),
        }),
      }),
    );
  });

  it("uses default product name when no product_id", async () => {
    await reviewCreatedHandler(makeArgs({ id: "rev_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: expect.stringContaining("Product"),
        }),
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      reviewCreatedHandler(makeArgs({ id: "x", product_id: "p" })),
    ).resolves.toBeUndefined();
  });
});

describe("integration-sync-subscriber", () => {
  it("exports correct event config (empty array)", () => {
    expect(integrationSyncConfig.event).toEqual([]);
  });

  it("is a no-op handler", async () => {
    await integrationSyncHandler({ event: { data: {} } });
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });
});

describe("temporal-event-bridge subscriber", () => {
  const origEnv = process.env.TEMPORAL_API_KEY;

  beforeEach(() => {
    process.env.TEMPORAL_API_KEY = "test-key";
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.TEMPORAL_API_KEY = origEnv;
    } else {
      delete process.env.TEMPORAL_API_KEY;
    }
  });

  it("exports correct event config (array of events)", () => {
    expect(Array.isArray(temporalConfig.event)).toBe(true);
    expect((temporalConfig.event as string[]).length).toBeGreaterThan(10);
    expect(temporalConfig.event).toContain("order.placed");
  });

  it("dispatches event to Temporal when workflow exists", async () => {
    (getWorkflowForEvent as jest.Mock).mockReturnValue({
      workflowId: "test-wf",
    });
    (dispatchEventToTemporal as jest.Mock).mockResolvedValue({
      dispatched: true,
      runId: "run_1",
    });

    await temporalEventBridge({
      event: { name: "order.placed", data: { id: "order_1", tenant_id: "t1" } },
      container: makeContainer(),
    });

    expect(dispatchEventToTemporal).toHaveBeenCalledWith(
      "order.placed",
      { id: "order_1", tenant_id: "t1" },
      expect.objectContaining({ source: "medusa-subscriber" }),
    );
  });

  it("skips dispatch when Temporal is not configured", async () => {
    const configModule = jest.requireMock("../../../src/lib/config");
    const origIsConfigured = configModule.appConfig.temporal.isConfigured;
    configModule.appConfig.temporal.isConfigured = false;
    await temporalEventBridge({
      event: { name: "order.placed", data: {} },
      container: makeContainer(),
    });
    configModule.appConfig.temporal.isConfigured = origIsConfigured;

    expect(dispatchEventToTemporal).not.toHaveBeenCalled();
  });

  it("skips dispatch when no workflow mapped for event", async () => {
    (getWorkflowForEvent as jest.Mock).mockReturnValue(null);

    await temporalEventBridge({
      event: { name: "unknown.event", data: {} },
      container: makeContainer(),
    });

    expect(dispatchEventToTemporal).not.toHaveBeenCalled();
  });

  it("handles dispatch errors gracefully", async () => {
    (getWorkflowForEvent as jest.Mock).mockReturnValue({
      workflowId: "test-wf",
    });
    (dispatchEventToTemporal as jest.Mock).mockRejectedValue(
      new Error("connection refused"),
    );

    await expect(
      temporalEventBridge({
        event: { name: "order.placed", data: {} },
        container: makeContainer(),
      }),
    ).resolves.toBeUndefined();
  });
});
