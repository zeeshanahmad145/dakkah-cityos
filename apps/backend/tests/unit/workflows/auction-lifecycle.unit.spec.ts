import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn }
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Auction Lifecycle Workflow", () => {
  let createAuctionStep: any
  let openAuctionStep: any
  let closeAuctionStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/auction-lifecycle.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    createAuctionStep = calls.find((c: any) => c[0] === "create-auction-step")?.[1]
    openAuctionStep = calls.find((c: any) => c[0] === "open-auction-step")?.[1]
    closeAuctionStep = calls.find((c: any) => c[0] === "close-auction-step")?.[1]
  })

  describe("createAuctionStep", () => {
    const validInput = {
      productId: "prod_1",
      vendorId: "vendor_1",
      startingPrice: 100,
      startTime: "2025-01-01T10:00:00Z",
      endTime: "2025-01-01T14:00:00Z",
      tenantId: "tenant_1",
    }

    it("should create an auction with draft status", async () => {
      const createAuctions = vi.fn().mockResolvedValue({ id: "auction_1" })
      const container = mockContainer({ auction: { createAuctions } })
      const result = await createAuctionStep(validInput, { container })
      expect(result.auction.id).toBe("auction_1")
      expect(createAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: "draft", starting_price: 100 })
      )
    })

    it("should throw if end time is before start time", async () => {
      const container = mockContainer({ auction: { createAuctions: vi.fn() } })
      const input = { ...validInput, endTime: "2025-01-01T08:00:00Z" }
      await expect(createAuctionStep(input, { container })).rejects.toThrow("end time must be after start time")
    })

    it("should throw if auction duration is less than 1 hour", async () => {
      const container = mockContainer({ auction: { createAuctions: vi.fn() } })
      const input = { ...validInput, endTime: "2025-01-01T10:30:00Z" }
      await expect(createAuctionStep(input, { container })).rejects.toThrow("at least 1 hour")
    })

    it("should throw if starting price is zero or negative", async () => {
      const container = mockContainer({ auction: { createAuctions: vi.fn() } })
      const input = { ...validInput, startingPrice: 0 }
      await expect(createAuctionStep(input, { container })).rejects.toThrow("greater than zero")
    })

    it("should throw if reserve price is less than starting price", async () => {
      const container = mockContainer({ auction: { createAuctions: vi.fn() } })
      const input = { ...validInput, reservePrice: 50 }
      await expect(createAuctionStep(input, { container })).rejects.toThrow("Reserve price must be greater than or equal")
    })

    it("should default reserve price to starting price when not provided", async () => {
      const createAuctions = vi.fn().mockResolvedValue({ id: "auction_2" })
      const container = mockContainer({ auction: { createAuctions } })
      await createAuctionStep(validInput, { container })
      expect(createAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ reserve_price: 100 })
      )
    })
  })

  describe("openAuctionStep", () => {
    it("should set status to scheduled when start time is in the future", async () => {
      const futureTime = new Date(Date.now() + 86400000).toISOString()
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1", status: "scheduled" })
      const container = mockContainer({ auction: { updateAuctions } })
      const result = await openAuctionStep({ auctionId: "auction_1", startTime: futureTime }, { container })
      expect(updateAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: "scheduled" })
      )
    })

    it("should set status to active when start time is in the past", async () => {
      const pastTime = new Date(Date.now() - 86400000).toISOString()
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1", status: "active" })
      const container = mockContainer({ auction: { updateAuctions } })
      const result = await openAuctionStep({ auctionId: "auction_1", startTime: pastTime }, { container })
      expect(updateAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" })
      )
    })
  })

  describe("closeAuctionStep", () => {
    it("should close with closed_sold when highest bid meets reserve", async () => {
      const bids = [
        { id: "bid_1", amount: 200, bidder_id: "customer_1" },
        { id: "bid_2", amount: 150, bidder_id: "customer_2" },
      ]
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1", status: "closed_sold" })
      const container = mockContainer({
        auction: { listBids: vi.fn().mockResolvedValue(bids), updateAuctions },
      })
      const result = await closeAuctionStep(
        { auctionId: "auction_1", reservePrice: 100, startingPrice: 50 },
        { container }
      )
      expect(result.winner).not.toBeNull()
      expect(result.winner.winning_bid).toBe(200)
      expect(result.winner.bidder_id).toBe("customer_1")
      expect(result.total_bids).toBe(2)
    })

    it("should close with closed_reserve_not_met when highest bid is below reserve", async () => {
      const bids = [{ id: "bid_1", amount: 80, bidder_id: "customer_1" }]
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1" })
      const container = mockContainer({
        auction: { listBids: vi.fn().mockResolvedValue(bids), updateAuctions },
      })
      const result = await closeAuctionStep(
        { auctionId: "auction_1", reservePrice: 100, startingPrice: 50 },
        { container }
      )
      expect(result.winner).toBeNull()
      expect(result.close_reason).toContain("reserve price")
    })

    it("should close with closed_no_bids when there are no bids", async () => {
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1" })
      const container = mockContainer({
        auction: { listBids: vi.fn().mockResolvedValue([]), updateAuctions },
      })
      const result = await closeAuctionStep(
        { auctionId: "auction_1", reservePrice: 100, startingPrice: 50 },
        { container }
      )
      expect(result.winner).toBeNull()
      expect(result.close_reason).toBe("No bids were placed")
      expect(result.total_bids).toBe(0)
    })

    it("should use startingPrice as reserve when reservePrice is undefined", async () => {
      const bids = [{ id: "bid_1", amount: 60, bidder_id: "customer_1" }]
      const updateAuctions = vi.fn().mockResolvedValue({ id: "auction_1" })
      const container = mockContainer({
        auction: { listBids: vi.fn().mockResolvedValue(bids), updateAuctions },
      })
      const result = await closeAuctionStep(
        { auctionId: "auction_1", startingPrice: 50 },
        { container }
      )
      expect(result.winner).not.toBeNull()
      expect(result.winner.winning_bid).toBe(60)
    })
  })
})
