import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type AuctionLifecycleInput = {
  productId: string;
  vendorId: string;
  startingPrice: number;
  reservePrice?: number;
  startTime: string;
  endTime: string;
  tenantId: string;
  minimumIncrement?: number;
};

const createAuctionStep = createStep(
  "create-auction-step",
  async (input: AuctionLifecycleInput, { container }) => {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (endTime <= startTime) {
      throw new Error("Auction end time must be after start time");
    }

    if (endTime.getTime() - startTime.getTime() < 3600000) {
      throw new Error("Auction must run for at least 1 hour");
    }

    if (input.startingPrice <= 0) {
      throw new Error("Starting price must be greater than zero");
    }

    if (
      input.reservePrice !== undefined &&
      input.reservePrice < input.startingPrice
    ) {
      throw new Error(
        "Reserve price must be greater than or equal to starting price",
      );
    }

    const auctionModule = container.resolve("auction") as unknown as any;
    const auction = await auctionModule.createAuctions({
      product_id: input.productId,
      vendor_id: input.vendorId,
      starting_price: input.startingPrice,
      reserve_price: input.reservePrice || input.startingPrice,
      minimum_increment:
        input.minimumIncrement ||
        Math.max(1, Math.round(input.startingPrice * 0.05)),
      start_time: startTime,
      end_time: endTime,
      status: "draft",
    });
    return new StepResponse({ auction }, { auctionId: auction.id });
  },
  async (
    compensationData: { auctionId: string } | undefined,
    { container },
  ) => {
    if (!compensationData?.auctionId) return;
    try {
      const auctionModule = container.resolve("auction") as unknown as any;
      await auctionModule.deleteAuctions(compensationData.auctionId);
    } catch (error) {}
  },
);

const openAuctionStep = createStep(
  "open-auction-step",
  async (input: { auctionId: string; startTime: string }, { container }) => {
    const now = new Date();
    const startTime = new Date(input.startTime);

    if (startTime > now) {
      const scheduled = {
        auction_id: input.auctionId,
        status: "scheduled",
        scheduled_open: startTime,
      };

      const auctionModule = container.resolve("auction") as unknown as any;
      const updated = await auctionModule.updateAuctions({
        id: input.auctionId,
        status: "scheduled",
        scheduled_at: startTime,
      });
      return new StepResponse(
        { auction: updated },
        { auctionId: input.auctionId, previousStatus: "draft" },
      );
    }

    const auctionModule = container.resolve("auction") as unknown as any;
    const opened = await auctionModule.updateAuctions({
      id: input.auctionId,
      status: "active",
      opened_at: now,
    });
    return new StepResponse(
      { auction: opened },
      { auctionId: input.auctionId, previousStatus: "draft" },
    );
  },
  async (
    compensationData: { auctionId: string; previousStatus: string } | undefined,
    { container },
  ) => {
    if (!compensationData?.auctionId) return;
    try {
      const auctionModule = container.resolve("auction") as unknown as any;
      await auctionModule.updateAuctions({
        id: compensationData.auctionId,
        status: compensationData.previousStatus,
      });
    } catch (error) {}
  },
);

const closeAuctionStep = createStep(
  "close-auction-step",
  async (
    input: {
      auctionId: string;
      reservePrice?: number;
      startingPrice: number;
      minimumIncrement?: number;
    },
    { container },
  ) => {
    const auctionModule = container.resolve("auction") as unknown as any;

    let bids: any[] = [];
    try {
      if (auctionModule.listBids) {
        bids = await auctionModule.listBids({ auction_id: input.auctionId });
      } else if (auctionModule.listAuctionBids) {
        bids = await auctionModule.listAuctionBids(input.auctionId);
      }
    } catch (error) {
      bids = [];
    }

    const sortedBids = bids.sort(
      (a: any, b: any) => (b.amount || 0) - (a.amount || 0),
    );
    const highestBid = sortedBids.length > 0 ? sortedBids[0] : null;
    const reservePrice = input.reservePrice || input.startingPrice;
    const minimumIncrement =
      input.minimumIncrement ||
      Math.max(1, Math.round(input.startingPrice * 0.05));

    let winner = null;
    let finalStatus = "closed";
    let closeReason = "";

    if (!highestBid) {
      finalStatus = "closed_no_bids";
      closeReason = "No bids were placed";
    } else if (highestBid.amount < reservePrice) {
      finalStatus = "closed_reserve_not_met";
      closeReason = `Highest bid (${highestBid.amount}) did not meet reserve price (${reservePrice})`;
    } else {
      finalStatus = "closed_sold";
      winner = {
        bidder_id: highestBid.bidder_id || highestBid.customer_id,
        winning_bid: highestBid.amount,
        bid_id: highestBid.id,
      };
    }

    const invalidBids = sortedBids.filter((bid: any, index: number) => {
      if (bid.amount < input.startingPrice) return true;
      const previousBid = sortedBids[index + 1];
      if (previousBid && bid.amount - previousBid.amount < minimumIncrement)
        return true;
      return false;
    });

    const closed = await auctionModule.updateAuctions({
      id: input.auctionId,
      status: finalStatus,
      closed_at: new Date(),
      winner_id: winner?.bidder_id || null,
      winning_bid: winner?.winning_bid || null,
    });

    return new StepResponse(
      {
        auction: closed,
        winner,
        total_bids: sortedBids.length,
        invalid_bids: invalidBids.length,
        close_reason: closeReason,
      },
      { auctionId: input.auctionId, previousStatus: "active" },
    );
  },
  async (
    compensationData: { auctionId: string; previousStatus: string } | undefined,
    { container },
  ) => {
    if (!compensationData?.auctionId) return;
    try {
      const auctionModule = container.resolve("auction") as unknown as any;
      await auctionModule.updateAuctions({
        id: compensationData.auctionId,
        status: compensationData.previousStatus,
      });
    } catch (error) {}
  },
);

export const auctionLifecycleWorkflow = createWorkflow(
  "auction-lifecycle-workflow",
  (input: AuctionLifecycleInput) => {
    const { auction } = createAuctionStep(input);
    const opened = openAuctionStep({
      auctionId: auction.id,
      startTime: input.startTime,
    });
    const closed = closeAuctionStep({
      auctionId: auction.id,
      reservePrice: input.reservePrice,
      startingPrice: input.startingPrice,
      minimumIncrement: input.minimumIncrement,
    });
    return new WorkflowResponse({
      auction: closed.auction,
      winner: closed.winner,
      total_bids: closed.total_bids,
      close_reason: closed.close_reason,
    });
  },
);
