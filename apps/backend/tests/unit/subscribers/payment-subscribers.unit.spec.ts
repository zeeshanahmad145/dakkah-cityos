import { vi } from "vitest";
vi.mock("../../../src/lib/logger", () => ({
  subscriberLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock("../../../src/lib/config", () => ({
  appConfig: {
    storefrontUrl: "https://store.test",
    urls: { storefront: "https://store.test" },
    features: {
      enableEmailNotifications: true,
      enableAdminNotifications: true,
    },
  },
}));

import paymentAuthorizedHandler from "../../../src/subscribers/payment-authorized";
import { config as authorizedConfig } from "../../../src/subscribers/payment-authorized";
import paymentCapturedHandler from "../../../src/subscribers/payment-captured";
import { config as capturedConfig } from "../../../src/subscribers/payment-captured";
import paymentFailedHandler from "../../../src/subscribers/payment-failed";
import { config as failedConfig } from "../../../src/subscribers/payment-failed";
import paymentRefundedHandler from "../../../src/subscribers/payment-refunded";
import { config as refundedConfig } from "../../../src/subscribers/payment-refunded";

const mockCreateNotifications = vi.fn();
const mockGraph = vi.fn();

function makeContainer() {
  return {
    resolve: vi.fn((dep: string) => {
      if (dep === "notification")
        return { createNotifications: mockCreateNotifications };
      if (dep === "query") return { graph: mockGraph };
      if (dep === "logger")
        return { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
      return {};
    }),
  };
}

function makeArgs(data: any) {
  return { event: { data }, container: makeContainer() };
}

const fullPayment = {
  id: "pay_1",
  amount: 5000,
  currency_code: "usd",
  payment_collection: {
    order: {
      id: "order_1",
      display_id: 1001,
      customer: { email: "buyer@test.com", first_name: "Jane" },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGraph.mockResolvedValue({ data: [fullPayment] });
});

describe("payment-authorized subscriber", () => {
  it("exports correct event config", () => {
    expect(authorizedConfig.event).toBe("payment.authorized");
  });

  it("sends admin notification on authorization", async () => {
    await paymentAuthorizedHandler(makeArgs({ id: "pay_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      paymentAuthorizedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("payment-captured subscriber", () => {
  it("exports correct event config", () => {
    expect(capturedConfig.event).toBe("payment.captured");
  });

  it("sends email and admin notification on capture", async () => {
    await paymentCapturedHandler(makeArgs({ id: "pay_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "payment-confirmed",
        to: "buyer@test.com",
      }),
    );
  });

  it("skips email when no customer email", async () => {
    mockGraph.mockResolvedValue({
      data: [
        {
          ...fullPayment,
          payment_collection: {
            order: { id: "order_1", display_id: 1001, customer: {} },
          },
        },
      ],
    });
    await paymentCapturedHandler(makeArgs({ id: "pay_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(1);
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      paymentCapturedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("payment-failed subscriber", () => {
  it("exports correct event config", () => {
    expect(failedConfig.event).toBe("payment.payment_capture_failed");
  });

  it("sends email and admin notification on failure", async () => {
    await paymentFailedHandler(
      makeArgs({ id: "pay_1", error: "card declined" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "payment-failed",
        to: "buyer@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      paymentFailedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("payment-refunded subscriber", () => {
  it("exports correct event config", () => {
    expect(refundedConfig.event).toBe("payment.refunded");
  });

  it("sends email and admin notification on refund", async () => {
    await paymentRefundedHandler(makeArgs({ id: "pay_1", amount: 2500 }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "payment-refunded",
        to: "buyer@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      paymentRefundedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});
