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
    subscription: {
      maxPaymentRetries: 3,
      gracePeriodDays: 7,
    },
  },
}));

import subscriptionCancelledHandler from "../../../src/subscribers/subscription-cancelled";
import { config as cancelledConfig } from "../../../src/subscribers/subscription-cancelled";
import subscriptionCreatedHandler from "../../../src/subscribers/subscription-created";
import { config as createdConfig } from "../../../src/subscribers/subscription-created";
import subscriptionPausedHandler from "../../../src/subscribers/subscription-paused";
import { config as pausedConfig } from "../../../src/subscribers/subscription-paused";
import subscriptionPaymentFailedHandler from "../../../src/subscribers/subscription-payment-failed";
import { config as paymentFailedConfig } from "../../../src/subscribers/subscription-payment-failed";
import subscriptionPlanChangedHandler from "../../../src/subscribers/subscription-plan-changed";
import { config as planChangedConfig } from "../../../src/subscribers/subscription-plan-changed";
import subscriptionRenewalUpcomingHandler from "../../../src/subscribers/subscription-renewal-upcoming";
import { config as renewalConfig } from "../../../src/subscribers/subscription-renewal-upcoming";
import subscriptionResumedHandler from "../../../src/subscribers/subscription-resumed";
import { config as resumedConfig } from "../../../src/subscribers/subscription-resumed";

const mockCreateNotifications = vi.fn();
const mockRetrieveSubscription = vi.fn();
const mockRetrieveSubscriptionPlan = vi.fn();

function makeContainer() {
  return {
    resolve: vi.fn((dep: string) => {
      if (dep === "notification")
        return { createNotifications: mockCreateNotifications };
      if (dep === "subscription")
        return {
          retrieveSubscription: mockRetrieveSubscription,
          retrieveSubscriptionPlan: mockRetrieveSubscriptionPlan,
        };
      return {};
    }),
  };
}

function makeArgs(data: any) {
  return { event: { data }, container: makeContainer() };
}

const fullSubscription = {
  id: "sub_1",
  customer: { email: "sub@test.com", first_name: "Alice" },
  plan: { name: "Pro Plan", price: 1999 },
  billing_interval: "monthly",
  next_billing_date: "2025-02-01",
  current_period_end: "2025-02-01",
  metadata: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRetrieveSubscription.mockResolvedValue(fullSubscription);
  mockRetrieveSubscriptionPlan.mockResolvedValue({ name: "Basic Plan" });
});

describe("subscription-cancelled subscriber", () => {
  it("exports correct event config", () => {
    expect(cancelledConfig.event).toBe("subscription.cancelled");
  });

  it("sends email and admin notification", async () => {
    await subscriptionCancelledHandler(
      makeArgs({ id: "sub_1", reason: "too expensive" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "subscription-cancelled",
        to: "sub@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionCancelledHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-created subscriber", () => {
  it("exports correct event config", () => {
    expect(createdConfig.event).toBe("subscription.created");
  });

  it("sends welcome email and admin notification", async () => {
    await subscriptionCreatedHandler(makeArgs({ id: "sub_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "subscription-welcome" }),
    );
  });

  it("returns early when subscription not found", async () => {
    mockRetrieveSubscription.mockResolvedValue(null);
    await subscriptionCreatedHandler(makeArgs({ id: "missing" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("returns early when no customer email", async () => {
    mockRetrieveSubscription.mockResolvedValue({
      ...fullSubscription,
      customer: {},
      metadata: {},
    });
    await subscriptionCreatedHandler(makeArgs({ id: "sub_1" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionCreatedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-paused subscriber", () => {
  it("exports correct event config", () => {
    expect(pausedConfig.event).toBe("subscription.paused");
  });

  it("sends email and admin notification", async () => {
    await subscriptionPausedHandler(
      makeArgs({ id: "sub_1", reason: "vacation" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "subscription-paused" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionPausedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-payment-failed subscriber", () => {
  it("exports correct event config", () => {
    expect(paymentFailedConfig.event).toBe("subscription.payment_failed");
  });

  it("sends email with retry info and admin notification", async () => {
    await subscriptionPaymentFailedHandler(
      makeArgs({ id: "sub_1", error: "card declined", retry_count: 2 }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "subscription-payment-failed",
        data: expect.objectContaining({
          retry_count: 2,
          max_retries: 3,
          will_retry: true,
        }),
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionPaymentFailedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-plan-changed subscriber", () => {
  it("exports correct event config", () => {
    expect(planChangedConfig.event).toBe("subscription.plan_changed");
  });

  it("sends email and admin notification with plan names", async () => {
    await subscriptionPlanChangedHandler(
      makeArgs({
        id: "sub_1",
        old_plan_id: "plan_old",
        new_plan_id: "plan_new",
      }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "subscription-plan-changed",
        data: expect.objectContaining({
          old_plan_name: "Basic Plan",
          new_plan_name: "Pro Plan",
        }),
      }),
    );
  });

  it("handles missing old plan gracefully", async () => {
    mockRetrieveSubscriptionPlan.mockRejectedValue(new Error("not found"));
    await subscriptionPlanChangedHandler(
      makeArgs({ id: "sub_1", old_plan_id: "gone" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "subscription-plan-changed",
        data: expect.objectContaining({ old_plan_name: "Previous Plan" }),
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionPlanChangedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-renewal-upcoming subscriber", () => {
  it("exports correct event config", () => {
    expect(renewalConfig.event).toBe("subscription.renewal_upcoming");
  });

  it("sends email reminder with days until renewal", async () => {
    await subscriptionRenewalUpcomingHandler(
      makeArgs({ id: "sub_1", days_until_renewal: 3 }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "subscription-renewal-upcoming",
        data: expect.objectContaining({ days_until_renewal: 3 }),
      }),
    );
  });

  it("defaults to 7 days when not specified", async () => {
    await subscriptionRenewalUpcomingHandler(makeArgs({ id: "sub_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ days_until_renewal: 7 }),
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionRenewalUpcomingHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("subscription-resumed subscriber", () => {
  it("exports correct event config", () => {
    expect(resumedConfig.event).toBe("subscription.resumed");
  });

  it("sends email and admin notification", async () => {
    await subscriptionResumedHandler(makeArgs({ id: "sub_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "subscription-resumed" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error("fail"));
    await expect(
      subscriptionResumedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});
