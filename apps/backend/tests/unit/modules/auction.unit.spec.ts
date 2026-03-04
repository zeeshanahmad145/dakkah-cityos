import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
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
        async listAuctionListings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAuctionListing(_id: string): Promise<any> {
          return null;
        }
        async createAuctionListings(_data: any): Promise<any> {
          return {};
        }
        async updateAuctionListings(_data: any): Promise<any> {
          return {};
        }
        async listBids(_filter: any): Promise<any> {
          return [];
        }
        async createBids(_data: any): Promise<any> {
          return {};
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
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import AuctionModuleService from "../../../src/modules/auction/service";

describe("AuctionModuleService", () => {
  let service: AuctionModuleService;

  beforeEach(() => {
    service = new AuctionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("placeBid", () => {
    it("places a valid bid on an active auction", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        ends_at: "2099-12-31",
        bid_increment: 10,
        starting_price: 100,
      });
      vi.spyOn(service, "getHighestBid").mockResolvedValue(null);
      const createSpy = jest
        .spyOn(service, "createBids")
        .mockResolvedValue({ id: "bid-1" });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.placeBid("auc-1", "user-1", 150);

      expect(result).toEqual({ id: "bid-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          auction_id: "auc-1",
          customer_id: "user-1",
          amount: 150,
          status: "active",
        }),
      );
    });

    it("throws when bid amount is zero", async () => {
      await expect(service.placeBid("auc-1", "user-1", 0)).rejects.toThrow(
        "Bid amount must be greater than zero",
      );
    });

    it("throws when auction is not active", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "ended",
        ends_at: "2099-12-31",
      });

      await expect(service.placeBid("auc-1", "user-1", 100)).rejects.toThrow(
        "Auction is not active",
      );
    });

    it("throws when auction has ended by time", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        ends_at: "2020-01-01",
      });

      await expect(service.placeBid("auc-1", "user-1", 100)).rejects.toThrow(
        "Auction has ended",
      );
    });

    it("throws when bid is below minimum increment", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        ends_at: "2099-12-31",
        bid_increment: 10,
      });
      jest
        .spyOn(service, "getHighestBid")
        .mockResolvedValue({ id: "bid-0", amount: 100 });

      await expect(service.placeBid("auc-1", "user-1", 105)).rejects.toThrow(
        "Bid must be at least 110",
      );
    });
  });

  describe("closeAuction", () => {
    it("closes auction with winner when reserve is met", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        reserve_price: 100,
      });
      vi.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid-1",
        bidder_id: "user-1",
        amount: 150,
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});
      const resultSpy = jest
        .spyOn(service, "createAuctionResults")
        .mockResolvedValue({ id: "res-1" });

      const result = await service.closeAuction("auc-1");

      expect(result).toEqual({ id: "res-1" });
      expect(resultSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          winning_bid_id: "bid-1",
          winner_id: "user-1",
          final_price: 150,
          status: "pending_payment",
        }),
      );
    });

    it("closes auction without winner when reserve is not met", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        reserve_price: 500,
      });
      vi.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid-1",
        bidder_id: "user-1",
        amount: 200,
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.closeAuction("auc-1");

      expect(result).toEqual({
        auctionId: "auc-1",
        status: "ended",
        winner: null,
      });
    });

    it("throws when auction is not active", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "ended",
      });

      await expect(service.closeAuction("auc-1")).rejects.toThrow(
        "Auction is not active",
      );
    });
  });

  describe("getHighestBid", () => {
    it("returns highest bid from active bids", async () => {
      vi.spyOn(service, "listBids").mockResolvedValue([
        { id: "bid-1", amount: 100 },
        { id: "bid-2", amount: 300 },
        { id: "bid-3", amount: 200 },
      ]);

      const result = await service.getHighestBid("auc-1");
      expect(result.id).toBe("bid-2");
      expect(result.amount).toBe(300);
    });

    it("returns null when no bids exist", async () => {
      vi.spyOn(service, "listBids").mockResolvedValue([]);

      const result = await service.getHighestBid("auc-1");
      expect(result).toBeNull();
    });
  });

  describe("isAuctionActive", () => {
    it("returns true when auction is active and within time range", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "active",
        starts_at: "2020-01-01",
        ends_at: "2099-12-31",
      });

      const result = await service.isAuctionActive("auc-1");
      expect(result).toBe(true);
    });

    it("returns false when auction status is not active", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        id: "auc-1",
        status: "ended",
        starts_at: "2020-01-01",
        ends_at: "2099-12-31",
      });

      const result = await service.isAuctionActive("auc-1");
      expect(result).toBe(false);
    });
  });
});
