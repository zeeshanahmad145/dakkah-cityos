import { vi } from "vitest";
vi.mock(
  "../../../src/lib/event-dispatcher",
  () => ({
    dispatchEventToTemporal: vi.fn().mockResolvedValue(undefined),
  }),
  { virtual: true },
);

import {
  CircuitBreaker,
  RateLimiter,
  OutboxProcessor,
  getCircuitBreakerStates,
} from "../../../src/lib/platform/outbox-processor";

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker(3, 1000);
  });

  it("starts in closed state", () => {
    expect(cb.getState()).toBe("closed");
  });

  it("executes function successfully in closed state", async () => {
    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
  });

  it("opens after reaching failure threshold", () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe("open");
  });

  it("rejects requests when open", async () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    await expect(cb.execute(async () => 1)).rejects.toThrow(
      "Circuit breaker is OPEN",
    );
  });

  it("transitions to half_open after reset timeout", async () => {
    cb = new CircuitBreaker(1, 10);
    cb.recordFailure();
    expect(cb.getState()).toBe("open");
    await new Promise((r) => setTimeout(r, 15));
    expect(cb.getState()).toBe("half_open");
  });

  it("closes from half_open after success", async () => {
    cb = new CircuitBreaker(1, 10);
    cb.recordFailure();
    await new Promise((r) => setTimeout(r, 15));
    await cb.execute(async () => "ok");
    expect(cb.getState()).toBe("closed");
  });

  it("resets failure count on success", () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    const stats = cb.getStats();
    expect(stats.failureCount).toBe(0);
    expect(stats.successCount).toBe(1);
  });

  it("getStats returns full statistics", () => {
    cb.recordFailure();
    const stats = cb.getStats();
    expect(stats.state).toBe("closed");
    expect(stats.failureCount).toBe(1);
    expect(stats.lastFailureTime).toBeTruthy();
  });
});

describe("RateLimiter", () => {
  let rl: RateLimiter;

  beforeEach(() => {
    rl = new RateLimiter(3, 60000);
  });

  it("allows requests under limit", () => {
    expect(rl.canProceed()).toBe(true);
  });

  it("blocks after reaching max requests", () => {
    rl.record();
    rl.record();
    rl.record();
    expect(rl.canProceed()).toBe(false);
  });

  it("returns correct stats", () => {
    rl.record();
    rl.record();
    const stats = rl.getStats();
    expect(stats.currentRequests).toBe(2);
    expect(stats.maxRequests).toBe(3);
    expect(stats.available).toBe(1);
  });

  it("expires old requests outside window", async () => {
    const shortRl = new RateLimiter(1, 10);
    shortRl.record();
    expect(shortRl.canProceed()).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(shortRl.canProceed()).toBe(true);
  });
});

describe("OutboxProcessor", () => {
  let processor: OutboxProcessor;

  beforeEach(() => {
    processor = new OutboxProcessor();
  });

  it("returns zero counts when no events", async () => {
    const container = {
      resolve: () => ({
        listPendingEvents: vi.fn().mockResolvedValue([]),
      }),
    };
    const result = await processor.processOutbox(container);
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("handles container resolution errors gracefully", async () => {
    const container = {
      resolve: () => {
        throw new Error("Service not found");
      },
    };
    const result = await processor.processOutbox(container);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Outbox processing error");
  });

  it("checkIdempotency returns false for unknown hash", () => {
    expect(processor.checkIdempotency("unknown-hash")).toBe(false);
  });

  it("getSystemHealth returns health for all managed systems", () => {
    const health = processor.getSystemHealth();
    expect(health).toHaveProperty("stripe");
    expect(health).toHaveProperty("erpnext");
    expect(health).toHaveProperty("fleetbase");
    expect(health).toHaveProperty("payload-cms");
    expect(health).toHaveProperty("waltid");
    expect(health.stripe.circuitBreaker).toHaveProperty("state");
    expect(health.stripe.rateLimiter).toHaveProperty("currentRequests");
  });
});

describe("getCircuitBreakerStates", () => {
  it("returns states for all managed systems", () => {
    const states = getCircuitBreakerStates();
    expect(Object.keys(states)).toEqual(
      expect.arrayContaining([
        "stripe",
        "erpnext",
        "fleetbase",
        "payload-cms",
        "waltid",
      ]),
    );
    for (const key of Object.keys(states)) {
      expect(states[key]).toHaveProperty("state");
      expect(states[key]).toHaveProperty("failureCount");
    }
  });
});
