jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async createAuctionListings(_data: any): Promise<any> {
          return {};
        }
        async updateAuctionListings(_data: any): Promise<any> {
          return {};
        }
        async retrieveAuctionListing(_id: string): Promise<any> {
          return null;
        }
        async listAuctionListings(_filter?: any): Promise<any> {
          return [];
        }
        async createBids(_data: any): Promise<any> {
          return {};
        }
        async listBids(_filter?: any): Promise<any> {
          return [];
        }
        async createAuctionResults(_data: any): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
    },
  };
});

import AuctionModuleService from "../../../src/modules/auction/service";

describe("AuctionModuleService", () => {
  let service: AuctionModuleService;

  beforeEach(() => {
    service = new AuctionModuleService();
    jest.clearAllMocks();
  });

  describe("placeBid", () => {
    it("places a valid bid on an active auction", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        ends_at: new Date(Date.now() + 86400000),
        starting_price: 100,
        bid_increment: 10,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue(null);

      const createBidSpy = jest.spyOn(service, "createBids").mockResolvedValue({
        id: "bid_1",
        auction_id: "auc_1",
        amount: 100,
        status: "active",
      });

      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.placeBid("auc_1", "user_1", 100);

      expect(createBidSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          auction_id: "auc_1",
          customer_id: "user_1",
          amount: 100,
          status: "active",
        }),
      );
    });

    it("throws when bid amount is zero or negative", async () => {
      await expect(service.placeBid("auc_1", "user_1", 0)).rejects.toThrow(
        "Bid amount must be greater than zero",
      );
      await expect(service.placeBid("auc_1", "user_1", -5)).rejects.toThrow(
        "Bid amount must be greater than zero",
      );
    });

    it("throws when auction is not active", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "ended",
      });

      await expect(service.placeBid("auc_1", "user_1", 100)).rejects.toThrow(
        "Auction is not active",
      );
    });

    it("throws when auction has ended", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        ends_at: new Date("2020-01-01"),
      });

      await expect(service.placeBid("auc_1", "user_1", 100)).rejects.toThrow(
        "Auction has ended",
      );
    });

    it("throws when bid is below minimum increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        ends_at: new Date(Date.now() + 86400000),
        starting_price: 100,
        bid_increment: 10,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_1",
        amount: 200,
      });

      await expect(service.placeBid("auc_1", "user_1", 205)).rejects.toThrow(
        "Bid must be at least 210",
      );
    });

    it("accepts bid at exactly the minimum increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        ends_at: new Date(Date.now() + 86400000),
        starting_price: 100,
        bid_increment: 10,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_1",
        amount: 200,
      });

      jest.spyOn(service, "createBids").mockResolvedValue({
        id: "bid_2",
        amount: 210,
      });
      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.placeBid("auc_1", "user_1", 210);
      expect(result.amount).toBe(210);
    });
  });

  describe("closeAuction", () => {
    it("closes auction with winner when reserve is met", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        reserve_price: 500,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_1",
        bidder_id: "user_1",
        amount: 600,
      });

      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const createResultSpy = jest
        .spyOn(service, "createAuctionResults")
        .mockResolvedValue({
          auction_id: "auc_1",
          winning_bid_id: "bid_1",
          winner_id: "user_1",
          final_price: 600,
          status: "pending_payment",
        });

      const result = await service.closeAuction("auc_1");

      expect(createResultSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          winner_id: "user_1",
          final_price: 600,
        }),
      );
    });

    it("closes auction without winner when reserve is not met", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        reserve_price: 1000,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_1",
        amount: 500,
      });

      const updateSpy = jest
        .spyOn(service, "updateAuctionListings")
        .mockResolvedValue({});

      const result = await service.closeAuction("auc_1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ended" }),
      );
      expect(result.winner).toBeNull();
    });

    it("closes auction without winner when no bids", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        reserve_price: 0,
      });

      jest.spyOn(service, "getHighestBid").mockResolvedValue(null);
      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.closeAuction("auc_1");
      expect(result.winner).toBeNull();
      expect(result.status).toBe("ended");
    });

    it("throws when auction is not active", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "ended",
      });

      await expect(service.closeAuction("auc_1")).rejects.toThrow(
        "Auction is not active",
      );
    });
  });

  describe("getHighestBid", () => {
    it("returns the highest bid from all bids", async () => {
      jest.spyOn(service, "listBids").mockResolvedValue([
        { id: "bid_1", amount: 100 },
        { id: "bid_3", amount: 300 },
        { id: "bid_2", amount: 200 },
      ]);

      const result = await service.getHighestBid("auc_1");
      expect(result.id).toBe("bid_3");
      expect(Number(result.amount)).toBe(300);
    });

    it("returns null when no bids exist", async () => {
      jest.spyOn(service, "listBids").mockResolvedValue([]);

      const result = await service.getHighestBid("auc_1");
      expect(result).toBeNull();
    });
  });

  describe("validateBidIncrement", () => {
    it("returns valid true when bid meets 5% minimum increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        current_price: 1000,
      });

      const result = await service.validateBidIncrement("auc_1", 1050);
      expect(result.valid).toBe(true);
      expect(result.currentPrice).toBe(1000);
    });

    it("returns valid false when bid is below minimum increment", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        current_price: 1000,
      });

      const result = await service.validateBidIncrement("auc_1", 1020);
      expect(result.valid).toBe(false);
    });
  });

  describe("isAuctionActive", () => {
    it("returns true for active auction within date range", async () => {
      const now = new Date();
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "active",
        starts_at: new Date(now.getTime() - 86400000),
        ends_at: new Date(now.getTime() + 86400000),
      });

      const result = await service.isAuctionActive("auc_1");
      expect(result).toBe(true);
    });

    it("returns false for non-active status", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc_1",
        status: "ended",
      });

      const result = await service.isAuctionActive("auc_1");
      expect(result).toBe(false);
    });
  });
});
