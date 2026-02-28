import { GET as advertisingGET, POST as advertisingPOST } from "../../../src/api/store/advertising/route"
import { GET as affiliatesGET, POST as affiliatesPOST } from "../../../src/api/store/affiliates/route"
import { GET as auctionsGET, POST as auctionsPOST } from "../../../src/api/store/auctions/route"
import { GET as bundlesGET } from "../../../src/api/store/bundles/route"
import { GET as flashSalesGET } from "../../../src/api/store/flash-sales/route"
import { GET as giftCardsGET, POST as giftCardsPOST } from "../../../src/api/store/gift-cards/route"
import { GET as loyaltyGET, POST as loyaltyPOST } from "../../../src/api/store/loyalty/route"
import { GET as walletGET, POST as walletPOST } from "../../../src/api/store/wallet/route"

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  return res
}

const createReq = (overrides: Record<string, any> = {}) => ({
  scope: { resolve: jest.fn(() => ({})) },
  query: {},
  params: {},
  body: {},
  auth_context: undefined as any,
  ...overrides,
})

describe("Commerce Store Routes", () => {
  beforeEach(() => jest.clearAllMocks())

  describe("Advertising /store/advertising", () => {
    const mockService = { listAdPlacements: jest.fn(), createAdPlacements: jest.fn() }

    it("GET returns items array with count", async () => {
      const items = [{ id: "ad_1", placement_type: "banner" }]
      mockService.listAdPlacements.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await advertisingGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith({ items, count: 1, limit: 20, offset: 0 })
    })

    it("GET passes pagination params", async () => {
      mockService.listAdPlacements.mockResolvedValue([])
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, query: { limit: "5", offset: "10" } })
      const res = createRes()
      await advertisingGET(req as any, res)
      expect(mockService.listAdPlacements).toHaveBeenCalledWith({}, { skip: 10, take: 5 })
    })

    it("GET passes filter parameters", async () => {
      mockService.listAdPlacements.mockResolvedValue([])
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, query: { tenant_id: "t1", placement_type: "sidebar", status: "active" } })
      const res = createRes()
      await advertisingGET(req as any, res)
      expect(mockService.listAdPlacements).toHaveBeenCalledWith({ tenant_id: "t1", placement_type: "sidebar", status: "active" }, expect.any(Object))
    })

    it("POST creates and returns item", async () => {
      const item = { id: "ad_2" }
      mockService.createAdPlacements.mockResolvedValue(item)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: { title: "New Ad" } })
      const res = createRes()
      await advertisingPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ item })
    })

    it("GET handles service error", async () => {
      mockService.listAdPlacements.mockRejectedValue(new Error("DB down"))
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await advertisingGET(req as any, res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe("Affiliates /store/affiliates", () => {
    const mockService = { listAffiliates: jest.fn(), createAffiliates: jest.fn() }

    it("GET returns items with count", async () => {
      const items = [{ id: "aff_1" }]
      mockService.listAffiliates.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await affiliatesGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith({ items, count: 1, limit: 20, offset: 0 })
    })

    it("GET passes filters", async () => {
      mockService.listAffiliates.mockResolvedValue([])
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, query: { tenant_id: "t1", status: "active" } })
      const res = createRes()
      await affiliatesGET(req as any, res)
      expect(mockService.listAffiliates).toHaveBeenCalledWith({ tenant_id: "t1", status: "active" }, expect.any(Object))
    })

    it("POST creates affiliate", async () => {
      const item = { id: "aff_2" }
      mockService.createAffiliates.mockResolvedValue(item)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: { name: "Aff" } })
      const res = createRes()
      await affiliatesPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ item })
    })
  })

  describe("Auctions /store/auctions", () => {
    const mockService = { listAuctionListings: jest.fn(), createAuctionListings: jest.fn() }

    it("GET returns active auctions", async () => {
      const items = [{ id: "auc_1", status: "active" }]
      mockService.listAuctionListings.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await auctionsGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith({ items, count: 1, limit: 20, offset: 0 })
      expect(mockService.listAuctionListings).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }), expect.any(Object))
    })

    it("POST creates auction listing", async () => {
      const item = { id: "auc_2" }
      mockService.createAuctionListings.mockResolvedValue(item)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: { title: "Item" } })
      const res = createRes()
      await auctionsPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it("POST handles error", async () => {
      mockService.createAuctionListings.mockRejectedValue(new Error("Invalid"))
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: {} })
      const res = createRes()
      await auctionsPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe("Bundles /store/bundles", () => {
    const mockService = { listProductBundles: jest.fn() }

    it("GET returns active bundles", async () => {
      const items = [{ id: "b_1", is_active: true }]
      mockService.listProductBundles.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await bundlesGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bundles: expect.any(Array) }))
    })

    it("GET filters expired bundles", async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString()
      const items = [{ id: "b_1", ends_at: pastDate }]
      mockService.listProductBundles.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await bundlesGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bundles: [], count: 0 }))
    })
  })

  describe("Flash Sales /store/flash-sales", () => {
    const mockPromotionExt = { listProductBundles: jest.fn() }
    const mockQuery = { graph: jest.fn() }

    it("GET returns flash sales", async () => {
      mockPromotionExt.listProductBundles.mockResolvedValue([])
      mockQuery.graph.mockResolvedValue({ data: [{ id: "p_1", status: "active" }] })
      const req = createReq({ scope: { resolve: jest.fn((name: string) => name === "query" ? mockQuery : mockPromotionExt) } })
      const res = createRes()
      await flashSalesGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ flash_sales: expect.any(Array) }))
    })

    it("GET handles service error", async () => {
      mockPromotionExt.listProductBundles.mockRejectedValue(new Error("fail"))
      const req = createReq({ scope: { resolve: jest.fn(() => mockPromotionExt) } })
      const res = createRes()
      await flashSalesGET(req as any, res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe("Gift Cards /store/gift-cards", () => {
    const mockService = { listGiftCardExts: jest.fn(), createGiftCardExts: jest.fn(), updateGiftCardExts: jest.fn() }

    it("GET returns active gift cards", async () => {
      const items = [{ id: "gc_1", remaining_value: 50, is_active: true }]
      mockService.listGiftCardExts.mockResolvedValue(items)
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } })
      const res = createRes()
      await giftCardsGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ gift_cards: expect.any(Array) }))
    })

    it("POST creates gift card with recipient", async () => {
      const gc = { id: "gc_2" }
      mockService.createGiftCardExts.mockResolvedValue(gc)
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { recipient_email: "test@test.com", amount: 100, tenant_id: "t1" },
      })
      const res = createRes()
      await giftCardsPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ gift_card: gc })
    })

    it("POST redeems gift card by code", async () => {
      const gc = { id: "gc_1", remaining_value: 50, is_active: true }
      mockService.listGiftCardExts.mockResolvedValue([gc])
      mockService.updateGiftCardExts.mockResolvedValue({})
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: { code: "ABC123", amount: 25 } })
      const res = createRes()
      await giftCardsPOST(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, redeemed_amount: 25 }))
    })

    it("POST returns 400 when missing required fields", async () => {
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, body: {} })
      const res = createRes()
      await giftCardsPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe("Loyalty /store/loyalty", () => {
    const mockService = {
      listLoyaltyAccounts: jest.fn(),
      getBalance: jest.fn(),
      retrieveLoyaltyProgram: jest.fn(),
      getTransactionHistory: jest.fn(),
      getOrCreateAccount: jest.fn(),
    }

    it("GET returns 401 without auth", async () => {
      const req = createReq({ auth_context: undefined })
      const res = createRes()
      await loyaltyGET(req as any, res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it("GET returns enrolled=false when no accounts", async () => {
      mockService.listLoyaltyAccounts.mockResolvedValue([])
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) }, auth_context: { actor_id: "cust_1" } })
      const res = createRes()
      await loyaltyGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith({ enrolled: false, account: null })
    })

    it("POST enrolls in loyalty program", async () => {
      const account = { id: "la_1", points_balance: 0, lifetime_points: 0, tier: "bronze", status: "active" }
      mockService.getOrCreateAccount.mockResolvedValue(account)
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        auth_context: { actor_id: "cust_1" },
        body: { program_id: "prog_1", tenant_id: "t1" },
      })
      const res = createRes()
      await loyaltyPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it("POST returns 400 when missing fields", async () => {
      const req = createReq({ auth_context: { actor_id: "cust_1" }, body: {} })
      const res = createRes()
      await loyaltyPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe("Wallet /store/wallet", () => {
    const mockLoyalty = { listLoyaltyAccounts: jest.fn() }
    const mockPromotionExt = { listGiftCardExts: jest.fn(), createGiftCardExts: jest.fn() }

    it("GET returns 401 without auth", async () => {
      const req = createReq({ auth_context: undefined })
      const res = createRes()
      await walletGET(req as any, res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it("GET returns wallet balances", async () => {
      mockLoyalty.listLoyaltyAccounts.mockResolvedValue([{ points_balance: 100 }])
      mockPromotionExt.listGiftCardExts.mockResolvedValue([{ remaining_value: 50 }])
      const req = createReq({
        scope: { resolve: jest.fn((name: string) => name === "loyalty" ? mockLoyalty : mockPromotionExt) },
        auth_context: { actor_id: "cust_1" },
      })
      const res = createRes()
      await walletGET(req as any, res)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ wallet: expect.objectContaining({ loyalty_points: 100, gift_card_balance: 50 }) }))
    })

    it("POST adds funds to wallet", async () => {
      mockPromotionExt.createGiftCardExts.mockResolvedValue({ id: "gc_1" })
      const req = createReq({
        scope: { resolve: jest.fn(() => mockPromotionExt) },
        auth_context: { actor_id: "cust_1" },
        body: { amount: 50, tenant_id: "t1" },
      })
      const res = createRes()
      await walletPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it("POST returns 400 when amount missing", async () => {
      const req = createReq({ auth_context: { actor_id: "cust_1" }, body: {} })
      const res = createRes()
      await walletPOST(req as any, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
