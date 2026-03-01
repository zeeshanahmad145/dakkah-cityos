// @ts-nocheck
import crypto from "crypto";
import { createLogger } from "../../lib/logger";
const logger = createLogger("lib:platform");

type CircuitBreakerState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private state: CircuitBreakerState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private failureThreshold: number;
  private resetTimeoutMs: number;

  constructor(failureThreshold = 5, resetTimeoutMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime >= this.resetTimeoutMs
      ) {
        this.state = "half_open";
      } else {
        throw new Error("Circuit breaker is OPEN — request rejected");
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === "half_open") {
      this.state = "closed";
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): CircuitBreakerState {
    if (
      this.state === "open" &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime >= this.resetTimeoutMs
    ) {
      return "half_open";
    }
    return this.state;
  }

  getStats() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
    };
  }
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private requests: number[] = [];

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  record(): void {
    this.requests.push(Date.now());
  }

  getStats() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      available: this.maxRequests - this.requests.length,
    };
  }
}

const MANAGED_SYSTEMS = [
  "stripe",
  "erpnext",
  "fleetbase",
  "payload-cms",
  "waltid",
] as const;
type ManagedSystem = (typeof MANAGED_SYSTEMS)[number];

const circuitBreakers: Record<string, CircuitBreaker> = {};
const rateLimiters: Record<string, RateLimiter> = {};

for (const system of MANAGED_SYSTEMS) {
  circuitBreakers[system] = new CircuitBreaker(5, 60000);
  rateLimiters[system] = new RateLimiter(100, 60000);
}

const processedHashes = new Set<string>();
const MAX_PROCESSED_CACHE = 10000;

export class OutboxProcessor {
  async processOutbox(
    container: any,
  ): Promise<{
    processed: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    let processed = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      const eventOutboxService = container.resolve("eventOutbox") as unknown as any;
      const pendingEvents = await eventOutboxService.listPendingEvents(
        undefined,
        50,
      );

      for (const event of pendingEvents) {
        try {
          const payloadHash = this.computeHash(event);
          if (this.checkIdempotency(payloadHash)) {
            skipped++;
            await eventOutboxService.markPublished(event.id);
            continue;
          }

          await this.processEvent(event, container);
          await eventOutboxService.markPublished(event.id);
          this.markProcessed(payloadHash);
          processed++;
        } catch (err: any) {
          await eventOutboxService.markFailed(event.id, err.message);
          failed++;
          errors.push(
            `Event ${event.id} (${event.event_type}): ${err.message}`,
          );
        }
      }
    } catch (err: any) {
      errors.push(`Outbox processing error: ${err.message}`);
    }

    if (processed > 0 || failed > 0) {
      logger.info(
        `[OutboxProcessor] Processed: ${processed}, Failed: ${failed}, Skipped: ${skipped}`,
      );
    }

    return { processed, failed, skipped, errors };
  }

  async processEvent(event: any, container: any): Promise<void> {
    const system = this.routeEventToSystem(event.event_type);
    if (!system) {
      logger.info(
        `[OutboxProcessor] No system mapping for event type: ${event.event_type}`,
      );
      return;
    }

    const breaker = circuitBreakers[system];
    const limiter = rateLimiters[system];

    if (!limiter.canProceed()) {
      throw new Error(`Rate limit exceeded for system: ${system}`);
    }

    await breaker.execute(async () => {
      limiter.record();
      await this.dispatchToSystem(system, event, container);
    });
  }

  private routeEventToSystem(eventType: string): ManagedSystem | null {
    if (
      eventType.startsWith("payment") ||
      eventType.startsWith("charge") ||
      eventType.startsWith("invoice") ||
      eventType.startsWith("checkout")
    ) {
      return "stripe";
    }
    if (
      eventType.startsWith("erp") ||
      eventType.includes("invoice") ||
      eventType.includes("accounting")
    ) {
      return "erpnext";
    }
    if (
      eventType.startsWith("fulfillment") ||
      eventType.startsWith("shipment") ||
      eventType.startsWith("delivery")
    ) {
      return "fleetbase";
    }
    if (
      eventType.startsWith("content") ||
      eventType.startsWith("product.") ||
      eventType.startsWith("page.")
    ) {
      return "payload-cms";
    }
    if (
      eventType.startsWith("credential") ||
      eventType.startsWith("did") ||
      eventType.startsWith("kyc")
    ) {
      return "waltid";
    }
    return null;
  }

  private async dispatchToSystem(
    system: ManagedSystem,
    event: any,
    container: any,
  ): Promise<void> {
    const correlationId = event.correlation_id || crypto.randomUUID();
    logger.info(
      `[OutboxProcessor] Dispatching ${event.event_type} to ${system} (correlation: ${correlationId})`,
    );

    try {
      const { dispatchEventToTemporal } = await import(
        "../../lib/event-dispatcher.js"
      );
      await dispatchEventToTemporal(event.event_type, event.payload, {
        tenantId: event.tenant_id,
        nodeId: event.node_id,
        correlationId,
        channel: event.channel,
      });
    } catch (err: any) {
      logger.error(
        `[OutboxProcessor] Failed to dispatch to ${system}: ${err.message}`,
      );
      throw err;
    }
  }

  checkIdempotency(payloadHash: string): boolean {
    return processedHashes.has(payloadHash);
  }

  private markProcessed(payloadHash: string): void {
    processedHashes.add(payloadHash);
    if (processedHashes.size > MAX_PROCESSED_CACHE) {
      const iterator = processedHashes.values();
      for (let i = 0; i < 1000; i++) {
        const val = iterator.next().value;
        if (val) processedHashes.delete(val);
      }
    }
  }

  private computeHash(event: any): string {
    const data = JSON.stringify({
      type: event.event_type,
      payload: event.payload,
      tenant: event.tenant_id,
    });
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  getSystemHealth(): Record<string, { circuitBreaker: any; rateLimiter: any }> {
    const health: Record<string, any> = {};
    for (const system of MANAGED_SYSTEMS) {
      health[system] = {
        circuitBreaker: circuitBreakers[system].getStats(),
        rateLimiter: rateLimiters[system].getStats(),
      };
    }
    return health;
  }
}

export const outboxProcessor = new OutboxProcessor();

export function getCircuitBreakerStates(): Record<string, any> {
  const states: Record<string, any> = {};
  for (const system of MANAGED_SYSTEMS) {
    states[system] = circuitBreakers[system].getStats();
  }
  return states;
}
