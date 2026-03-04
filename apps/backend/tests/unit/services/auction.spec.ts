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
        async retrieveAuctionListing(_id: string): Promise<any> {
          return null;
        }
        async listBids(_filter: any): Promise<any> {
          return [];
        }
        async createBids(_data: any): Promise<any> {
          return {};
        }
        async updateAuctionListings(_data: any): Promise<any> {
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

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const activeAuction = {
    id: "auc_01",
    status: "active",
    starting_price: 100,
    current_price: 200,
    reserve_price: 500,
    bid_increment: 10,
    ends_at: futureDate.toISOString(),
  };

  describe("placeBid", () => {
    it("should accept a valid first bid at starting price", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        ...activeAuction,
        current_price: 100,
      });
      vi.spyOn(service, "getHighestBid").mockResolvedValue(null);
      vi.spyOn(service, "createBids").mockResolvedValue({
        id: "bid_01",
        amount: 100,
        status: "active",
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.placeBid("auc_01", "user_01", 100);
      expect(result.id).toBe("bid_01");
    });

    it("should reject bid below minimum increment", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);
      jest
        .spyOn(service, "getHighestBid")
        .mockResolvedValue({ id: "bid_01", amount: 200 });

      await expect(
        service.placeBid("auc_01", "user_02", 205),
      ).rejects.toThrow();
    });

    it("should reject bid on inactive auction", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        ...activeAuction,
        status: "ended",
      });

      await expect(service.placeBid("auc_01", "user_01", 500)).rejects.toThrow(
        "Auction is not active",
      );
    });

    it("should reject zero amount bid", async () => {
      await expect(service.placeBid("auc_01", "user_01", 0)).rejects.toThrow(
        "Bid amount must be greater than zero",
      );
    });
  });

  describe("closeAuction", () => {
    it("should determine winner when highest bid meets reserve", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);
      vi.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_10",
        bidder_id: "user_05",
        amount: 600,
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});
      vi.spyOn(service, "createAuctionResults").mockResolvedValue({
        auction_id: "auc_01",
        winner_id: "user_05",
        final_price: 600,
      });

      const result = await service.closeAuction("auc_01");
      expect(result.winner_id).toBe("user_05");
    });

    it("should end without winner when bid below reserve", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);
      vi.spyOn(service, "getHighestBid").mockResolvedValue({
        id: "bid_11",
        bidder_id: "user_06",
        amount: 300,
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.closeAuction("auc_01");
      expect(result.winner).toBeNull();
    });

    it("should reject closing a non-active auction", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        ...activeAuction,
        status: "ended",
      });

      await expect(service.closeAuction("auc_01")).rejects.toThrow(
        "Auction is not active",
      );
    });
  });

  describe("checkAntiSniping", () => {
    it("should extend when bid placed within 5 minutes of end", async () => {
      const nearEnd = new Date();
      nearEnd.setMinutes(nearEnd.getMinutes() + 3);
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        ...activeAuction,
        ends_at: nearEnd.toISOString(),
      });
      vi.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.checkAntiSniping("auc_01", new Date());
      expect(result.extended).toBe(true);
    });

    it("should not extend when sufficient time remains", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);

      const result = await service.checkAntiSniping("auc_01", new Date());
      expect(result.extended).toBe(false);
    });
  });

  describe("validateBidIncrement", () => {
    it("should validate bid at or above 5% increment", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);

      const minimumBid = 200 + 200 * 0.05;
      const result = await service.validateBidIncrement("auc_01", minimumBid);
      expect(result.valid).toBe(true);
    });

    it("should reject bid below 5% minimum increment", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue(activeAuction);

      const result = await service.validateBidIncrement("auc_01", 200);
      expect(result.valid).toBe(false);
    });

    it("should use starting price when current_price is not set", async () => {
      vi.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        ...activeAuction,
        current_price: null,
      });

      const result = await service.validateBidIncrement("auc_01", 105);
      expect(result.valid).toBe(true);
      expect(result.currentPrice).toBe(100);
    });
  });
});
