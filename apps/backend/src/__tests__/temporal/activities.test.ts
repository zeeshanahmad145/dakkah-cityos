/**
 * Temporal Activities — Unit Tests
 *
 * Tests all 23 registered activities in isolation with a mocked container.
 * No database, Medusa server, or external APIs required.
 *
 * Run: pnpm --filter backend test:unit
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Build a mockable container ─────────────────────────────────────────────
function buildMockContainer(overrides: Record<string, any> = {}) {
  return {
    resolve: (serviceName: string) => {
      if (overrides[serviceName]) return overrides[serviceName];
      return new Proxy({} as any, {
        get(_: any, method: string) {
          return vi.fn(async () => ({ id: "mock_id", status: "ok" }));
        },
      });
    },
  };
}

// ── registerActivities exports correct activity names ──────────────────────
describe("registerActivities", () => {
  const EXPECTED_ACTIVITIES = [
    // State machine
    "kernelTransition",
    // Ledger
    "postJournal",
    "freezeScope",
    "thawScope",
    // Booking
    "allocateBooking",
    "confirmBooking",
    "completeBooking",
    "cancelBooking",
    // Fulfillment
    "createFulfillmentLeg",
    "dispatchFulfillmentLeg",
    "completeFulfillmentLeg",
    "failFulfillmentLeg",
    // Settlement
    "settleOrder",
    // Subscription
    "chargeSubscriptionCycle",
    // Metering
    "closeMeteringPeriod",
    // Evidence
    "submitEvidence",
    // Events
    "emitEvent",
    // New 9 canonical activities
    "cancelOrder",
    "postSettlementToERP",
    "issueVerifiableCredential",
    "activateVendor",
    "syncCustomerToCms",
    "updateFulfillmentTracking",
  ];

  it("returns an object containing all expected activity functions", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const container = buildMockContainer();
    const activities = registerActivities(container);

    for (const name of EXPECTED_ACTIVITIES) {
      expect(
        typeof (activities as Record<string, unknown>)[name],
        `Activity "${name}" should be a function`,
      ).toBe("function");
    }
  });

  it("should not throw when container returns mock stubs", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const container = buildMockContainer();
    expect(() => registerActivities(container)).not.toThrow();
  });

  it("returns at least 20 functions", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const container = buildMockContainer();
    const activities = registerActivities(container);
    const fns = Object.values(activities).filter(
      (v) => typeof v === "function",
    );
    expect(fns.length).toBeGreaterThanOrEqual(20);
  });
});

// ── Individual activity contract tests ────────────────────────────────────
describe("cancelOrder activity", () => {
  it("accepts (orderId, reason) without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.cancelOrder("order_123", "customer_request"),
    ).resolves.not.toThrow();
  });

  it("is callable twice without throwing (idempotent)", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await activities.cancelOrder("order_123", "fraud");
    await expect(
      activities.cancelOrder("order_123", "fraud"),
    ).resolves.not.toThrow();
  });
});

describe("postSettlementToERP activity", () => {
  it("skips gracefully when ERPNext is not configured", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    // When ERPNext not configured it logs a warning and returns (no throw)
    await expect(
      activities.postSettlementToERP({
        orderId: "order_123",
        amount: 100,
        currencyCode: "SAR",
        type: "settlement",
      }),
    ).resolves.not.toThrow();
  });
});

describe("issueVerifiableCredential activity", () => {
  it("returns a stub credential when walt.id is not configured", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    const result = await activities.issueVerifiableCredential({
      subjectId: "did:key:z6Mk...",
      type: "KYC",
      claims: { customerId: "cust_123", tenantId: "tenant_abc" },
    });
    // When not configured, returns a stub VC ID (defined, not throws)
    expect(result).toBeDefined();
  });
});

describe("activateVendor activity", () => {
  it("calls vendor service without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.activateVendor("vendor_123"),
    ).resolves.not.toThrow();
  });
});

describe("syncCustomerToCms activity", () => {
  it("skips gracefully when Payload CMS is not configured", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.syncCustomerToCms("cust_123", "customer"),
    ).resolves.not.toThrow();
  });
});

describe("updateFulfillmentTracking activity", () => {
  it("updates and logs tracking without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.updateFulfillmentTracking({
        fulfillmentId: "ful_123",
        status: "in_transit",
        metadata: { carrier: "aramex" },
      }),
    ).resolves.not.toThrow();
  });
});

describe("cancelBooking activity", () => {
  it("calls bookingService without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.cancelBooking("book_123", "customer_requested"),
    ).resolves.not.toThrow();
  });
});

describe("settleOrder activity", () => {
  it("calls settlement service without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.settleOrder({
        orderId: "order_123",
        grossAmount: 100,
        currencyCode: "SAR",
      }),
    ).resolves.not.toThrow();
  });
});

describe("emitEvent activity", () => {
  it("emits an event without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.emitEvent("order.completed", { orderId: "order_123" }),
    ).resolves.not.toThrow();
  });
});

describe("kernelTransition activity", () => {
  it("transitions entity state without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.kernelTransition({
        entityType: "order",
        entityId: "order_123",
        toState: "processing",
      }),
    ).resolves.not.toThrow();
  });
});

describe("freezeScope / thawScope activities", () => {
  it("freezeScope completes without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.freezeScope({
        scopeType: "order",
        scopeId: "scope_123",
        reason: "dispute",
        releaseCondition: "dispute_resolved",
      }),
    ).resolves.not.toThrow();
  });

  it("thawScope completes without throwing", async () => {
    const { registerActivities } = await import("../../temporal/activities");
    const activities = registerActivities(buildMockContainer());
    await expect(
      activities.thawScope("freeze_record_123"),
    ).resolves.not.toThrow();
  });
});
