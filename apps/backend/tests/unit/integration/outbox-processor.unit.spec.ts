import { vi } from "vitest";
interface OutboxEvent {
  id: string
  type: string
  payload: Record<string, any>
  status: "pending" | "processing" | "processed" | "failed"
  retries: number
  maxRetries: number
  createdAt: Date
  processedAt?: Date
  error?: string
}

interface OutboxRepository {
  findPending: jest.Mock
  markProcessing: jest.Mock
  markProcessed: jest.Mock
  markFailed: jest.Mock
  findByType: jest.Mock
}

interface EventHandler {
  handle: jest.Mock
}

interface Logger {
  info: jest.Mock
  error: jest.Mock
  warn: jest.Mock
}

class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private isOpen = false

  constructor(
    private threshold: number,
    private cooldownMs: number
  ) {}

  recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.threshold) this.isOpen = true
  }

  recordSuccess() {
    this.failures = 0
    this.isOpen = false
  }

  canProceed(): boolean {
    if (!this.isOpen) return true
    if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
      this.isOpen = false
      this.failures = 0
      return true
    }
    return false
  }
}

class RateLimiter {
  private tokens: number
  constructor(private maxTokens: number) {
    this.tokens = maxTokens
  }
  tryAcquire(): boolean {
    if (this.tokens > 0) { this.tokens--; return true }
    return false
  }
  reset() { this.tokens = this.maxTokens }
}

class OutboxProcessor {
  private circuitBreaker: CircuitBreaker
  private rateLimiter: RateLimiter
  private processing = new Set<string>()

  constructor(
    private repo: OutboxRepository,
    private handler: EventHandler,
    private logger: Logger,
    private maxRetries = 3,
    circuitBreakerThreshold = 5,
    circuitBreakerCooldownMs = 30000,
    rateLimit = 10
  ) {
    this.circuitBreaker = new CircuitBreaker(circuitBreakerThreshold, circuitBreakerCooldownMs)
    this.rateLimiter = new RateLimiter(rateLimit)
  }

  async processEvents(filterType?: string): Promise<{ processed: number; failed: number; skipped: number }> {
    const events: OutboxEvent[] = filterType
      ? await this.repo.findByType(filterType)
      : await this.repo.findPending()

    let processed = 0, failed = 0, skipped = 0

    for (const event of events) {
      if (!this.circuitBreaker.canProceed()) {
        this.logger.warn("Circuit breaker open, skipping remaining events")
        skipped += events.length - (processed + failed + skipped)
        break
      }

      if (!this.rateLimiter.tryAcquire()) {
        skipped++
        continue
      }

      if (event.retries >= event.maxRetries) {
        skipped++
        this.logger.warn(`Skipping event ${event.id}: exceeded max retries`)
        continue
      }

      if (this.processing.has(event.id)) {
        skipped++
        continue
      }

      this.processing.add(event.id)
      await this.repo.markProcessing(event.id)

      try {
        await this.handler.handle(event)
        await this.repo.markProcessed(event.id)
        this.circuitBreaker.recordSuccess()
        processed++
        this.logger.info(`Processed event ${event.id} of type ${event.type}`)
      } catch (err: any) {
        await this.repo.markFailed(event.id, err.message)
        this.circuitBreaker.recordFailure()
        failed++
        this.logger.error(`Failed to process event ${event.id}: ${err.message}`)
      } finally {
        this.processing.delete(event.id)
      }
    }

    return { processed, failed, skipped }
  }
}

const createMockRepo = (): OutboxRepository => ({
  findPending: vi.fn().mockResolvedValue([]),
  markProcessing: vi.fn().mockResolvedValue(undefined),
  markProcessed: vi.fn().mockResolvedValue(undefined),
  markFailed: vi.fn().mockResolvedValue(undefined),
  findByType: vi.fn().mockResolvedValue([]),
})

const createMockHandler = (): EventHandler => ({
  handle: vi.fn().mockResolvedValue(undefined),
})

const createMockLogger = (): Logger => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
})

const createEvent = (overrides: Partial<OutboxEvent> = {}): OutboxEvent => ({
  id: `evt_${Math.random().toString(36).slice(2, 8)}`,
  type: "order.created",
  payload: { orderId: "ord_123" },
  status: "pending",
  retries: 0,
  maxRetries: 3,
  createdAt: new Date(),
  ...overrides,
})

describe("Outbox Processor", () => {
  let repo: OutboxRepository
  let handler: EventHandler
  let logger: Logger
  let processor: OutboxProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    repo = createMockRepo()
    handler = createMockHandler()
    logger = createMockLogger()
    processor = new OutboxProcessor(repo, handler, logger, 3, 5, 30000, 10)
  })

  it("should pick up pending events from outbox", async () => {
    const events = [createEvent({ id: "evt_1" }), createEvent({ id: "evt_2" })]
    repo.findPending.mockResolvedValue(events)
    await processor.processEvents()
    expect(repo.findPending).toHaveBeenCalled()
    expect(handler.handle).toHaveBeenCalledTimes(2)
  })

  it("should process events in order", async () => {
    const events = [
      createEvent({ id: "evt_1", type: "order.created" }),
      createEvent({ id: "evt_2", type: "order.fulfilled" }),
      createEvent({ id: "evt_3", type: "order.cancelled" }),
    ]
    repo.findPending.mockResolvedValue(events)
    const callOrder: string[] = []
    handler.handle.mockImplementation((e: OutboxEvent) => { callOrder.push(e.id); return Promise.resolve() })
    await processor.processEvents()
    expect(callOrder).toEqual(["evt_1", "evt_2", "evt_3"])
  })

  it("should mark events as processed after success", async () => {
    const events = [createEvent({ id: "evt_1" })]
    repo.findPending.mockResolvedValue(events)
    const result = await processor.processEvents()
    expect(repo.markProcessed).toHaveBeenCalledWith("evt_1")
    expect(result.processed).toBe(1)
  })

  it("should mark events as failed after error", async () => {
    const events = [createEvent({ id: "evt_1" })]
    repo.findPending.mockResolvedValue(events)
    handler.handle.mockRejectedValue(new Error("Processing failed"))
    const result = await processor.processEvents()
    expect(repo.markFailed).toHaveBeenCalledWith("evt_1", "Processing failed")
    expect(result.failed).toBe(1)
  })

  it("should retry failed events up to max retries", async () => {
    const events = [createEvent({ id: "evt_1", retries: 2, maxRetries: 3 })]
    repo.findPending.mockResolvedValue(events)
    await processor.processEvents()
    expect(handler.handle).toHaveBeenCalledTimes(1)
  })

  it("should skip events that exceed max retries", async () => {
    const events = [createEvent({ id: "evt_1", retries: 3, maxRetries: 3 })]
    repo.findPending.mockResolvedValue(events)
    const result = await processor.processEvents()
    expect(handler.handle).not.toHaveBeenCalled()
    expect(result.skipped).toBe(1)
    expect(logger.warn).toHaveBeenCalledWith("Skipping event evt_1: exceeded max retries")
  })

  it("should apply circuit breaker after consecutive failures", async () => {
    const events = Array.from({ length: 7 }, (_, i) => createEvent({ id: `evt_${i}` }))
    repo.findPending.mockResolvedValue(events)
    handler.handle.mockRejectedValue(new Error("Service down"))
    const result = await processor.processEvents()
    expect(result.failed).toBe(5)
    expect(result.skipped).toBe(2)
    expect(logger.warn).toHaveBeenCalledWith("Circuit breaker open, skipping remaining events")
  })

  it("should reset circuit breaker after cooldown period", async () => {
    const processorWithShortCooldown = new OutboxProcessor(repo, handler, logger, 3, 2, 1, 100)
    const failEvents = [createEvent({ id: "evt_1" }), createEvent({ id: "evt_2" })]
    repo.findPending.mockResolvedValue(failEvents)
    handler.handle.mockRejectedValue(new Error("fail"))
    await processorWithShortCooldown.processEvents()

    await new Promise((r) => setTimeout(r, 5))

    const successEvents = [createEvent({ id: "evt_3" })]
    repo.findPending.mockResolvedValue(successEvents)
    handler.handle.mockResolvedValue(undefined)
    const result = await processorWithShortCooldown.processEvents()
    expect(result.processed).toBe(1)
  })

  it("should respect rate limits", async () => {
    const processorWithLowRate = new OutboxProcessor(repo, handler, logger, 3, 5, 30000, 2)
    const events = [createEvent({ id: "evt_1" }), createEvent({ id: "evt_2" }), createEvent({ id: "evt_3" })]
    repo.findPending.mockResolvedValue(events)
    const result = await processorWithLowRate.processEvents()
    expect(handler.handle).toHaveBeenCalledTimes(2)
    expect(result.processed).toBe(2)
    expect(result.skipped).toBe(1)
  })

  it("should handle concurrent processing safely", async () => {
    const events = [createEvent({ id: "evt_1" }), createEvent({ id: "evt_2" })]
    repo.findPending.mockResolvedValue(events)
    const [result1, result2] = await Promise.all([
      processor.processEvents(),
      processor.processEvents(),
    ])
    const totalProcessed = result1.processed + result2.processed
    expect(totalProcessed).toBeGreaterThanOrEqual(2)
  })

  it("should log event processing results", async () => {
    const events = [createEvent({ id: "evt_1", type: "order.created" })]
    repo.findPending.mockResolvedValue(events)
    await processor.processEvents()
    expect(logger.info).toHaveBeenCalledWith("Processed event evt_1 of type order.created")
  })

  it("should support event filtering by type", async () => {
    const events = [createEvent({ id: "evt_1", type: "order.created" })]
    repo.findByType.mockResolvedValue(events)
    await processor.processEvents("order.created")
    expect(repo.findByType).toHaveBeenCalledWith("order.created")
    expect(repo.findPending).not.toHaveBeenCalled()
    expect(handler.handle).toHaveBeenCalledTimes(1)
  })
})
