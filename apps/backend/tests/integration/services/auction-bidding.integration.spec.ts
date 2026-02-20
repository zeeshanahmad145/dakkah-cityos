jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain, nullable: () => chain, default: () => chain,
      unique: () => chain, searchable: () => chain, index: () => chain,
    }
    return chain
  }
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveAuctionListing(_id: string): Promise<any> { return null }
        async listBids(_filter: any): Promise<any> { return [] }
        async createBids(_data: any): Promise<any> { return {} }
        async updateAuctionListings(_data: any): Promise<any> { return {} }
        async createAuctionResults(_data: any): Promise<any> { return {} }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable, text: chainable, number: chainable, json: chainable,
      enum: () => chainable(), boolean: chainable, dateTime: chainable,
      bigNumber: chainable, float: chainable, array: chainable,
      hasOne: () => chainable(), hasMany: () => chainable(),
      belongsTo: () => chainable(), manyToMany: () => chainable(),
    },
  }
})

import AuctionModuleService from "../../../src/modules/auction/service"

describe("Auction Bidding Integration", () => {
  let service: AuctionModuleService

  beforeEach(() => {
    service = new AuctionModuleService()
    jest.clearAllMocks()
  })

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  const activeAuction = {
    id: "auc_01",
    status: "active",
    starting_price: 100,
    current_price: 100,
    reserve_price: 500,
    bid_increment: 10,
    ends_at: futureDate.toISOString(),
  }

  describe("place valid bid", () => {
    it("should record bid and update current_price", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue(null)
      jest.spyOn(service, "createBids" as any).mockResolvedValue({
        id: "bid_01", auction_id: "auc_01", bidder_id: "user_01", amount: 150, status: "active",
      })
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})

      const result = await service.placeBid("auc_01", "user_01", 150)
      expect(result.id).toBe("bid_01")
      expect(result.amount).toBe(150)
    })

    it("should accept bid above highest bid + increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue({
        id: "bid_01", amount: 200,
      })
      jest.spyOn(service, "createBids" as any).mockResolvedValue({
        id: "bid_02", auction_id: "auc_01", bidder_id: "user_02", amount: 220, status: "active",
      })
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})

      const result = await service.placeBid("auc_01", "user_02", 220)
      expect(result.amount).toBe(220)
    })
  })

  describe("bid below minimum increment", () => {
    it("should reject bid below minimum increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue({
        id: "bid_01", amount: 200,
      })

      await expect(service.placeBid("auc_01", "user_02", 205)).rejects.toThrow("Bid must be at least 210")
    })

    it("should reject bid of zero", async () => {
      await expect(service.placeBid("auc_01", "user_01", 0)).rejects.toThrow(
        "Bid amount must be greater than zero"
      )
    })

    it("should reject negative bid", async () => {
      await expect(service.placeBid("auc_01", "user_01", -50)).rejects.toThrow(
        "Bid amount must be greater than zero"
      )
    })
  })

  describe("bid on closed auction", () => {
    it("should reject bid on ended auction", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue({
        ...activeAuction, status: "ended",
      })

      await expect(service.placeBid("auc_01", "user_01", 500)).rejects.toThrow("Auction is not active")
    })

    it("should reject bid on auction past end time", async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue({
        ...activeAuction, ends_at: pastDate.toISOString(),
      })

      await expect(service.placeBid("auc_01", "user_01", 500)).rejects.toThrow("Auction has ended")
    })
  })

  describe("close auction with bids", () => {
    it("should determine winner as highest bidder when above reserve", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue({
        id: "bid_05", bidder_id: "user_03", amount: 600,
      })
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})
      jest.spyOn(service, "createAuctionResults" as any).mockResolvedValue({
        auction_id: "auc_01", winning_bid_id: "bid_05", winner_id: "user_03",
        final_price: 600, status: "pending_payment",
      })

      const result = await service.closeAuction("auc_01")
      expect(result.winner_id).toBe("user_03")
      expect(result.final_price).toBe(600)
    })

    it("should end auction with no winner when highest bid below reserve", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue({
        id: "bid_06", bidder_id: "user_04", amount: 300,
      })
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})

      const result = await service.closeAuction("auc_01")
      expect(result.winner).toBeNull()
      expect(result.status).toBe("ended")
    })

    it("should end auction with no winner when no bids", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)
      jest.spyOn(service, "getHighestBid" as any).mockResolvedValue(null)
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})

      const result = await service.closeAuction("auc_01")
      expect(result.winner).toBeNull()
    })
  })

  describe("anti-sniping", () => {
    it("should extend end time when bid placed in last 5 minutes", async () => {
      const nearEnd = new Date()
      nearEnd.setMinutes(nearEnd.getMinutes() + 3)
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue({
        ...activeAuction, ends_at: nearEnd.toISOString(),
      })
      jest.spyOn(service, "updateAuctionListings" as any).mockResolvedValue({})

      const bidTime = new Date()
      const result = await service.checkAntiSniping("auc_01", bidTime)
      expect(result.extended).toBe(true)
      expect(result.newEndTime).toBeDefined()
    })

    it("should not extend end time when bid placed with time remaining", async () => {
      const farEnd = new Date()
      farEnd.setMinutes(farEnd.getMinutes() + 30)
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue({
        ...activeAuction, ends_at: farEnd.toISOString(),
      })

      const bidTime = new Date()
      const result = await service.checkAntiSniping("auc_01", bidTime)
      expect(result.extended).toBe(false)
    })
  })

  describe("validate bid increment", () => {
    it("should validate a valid bid amount above 5% increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)

      const result = await service.validateBidIncrement("auc_01", 105)
      expect(result.valid).toBe(true)
      expect(result.minimumBid).toBe(105)
    })

    it("should reject an invalid bid amount below 5% minimum", async () => {
      jest.spyOn(service, "retrieveAuctionListing" as any).mockResolvedValue(activeAuction)

      const result = await service.validateBidIncrement("auc_01", 100)
      expect(result.valid).toBe(false)
    })
  })
})
