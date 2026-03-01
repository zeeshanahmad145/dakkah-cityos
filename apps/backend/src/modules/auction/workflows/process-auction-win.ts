import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

const notifyAuctionWinner = createStep(
  "notify-auction-winner",
  async ({
    auctionId,
    winnerId,
    finalPrice,
  }: {
    auctionId: string;
    winnerId: string;
    finalPrice: number;
  }) => {
    // Emit event for notification subscriber
    return new StepResponse({
      auctionId,
      winnerId,
      finalPrice,
      notified: true,
    });
  },
);

const createAuctionOrder = createStep(
  "create-auction-order",
  async (
    {
      auctionId,
      winnerId,
      finalPrice,
    }: { auctionId: string; winnerId: string; finalPrice: number },
    { container },
  ) => {
    // Reserve escrow and create order reference
    const auctionService = container.resolve("auction") as unknown as any;
    const escrow = await auctionService.createAuctionEscrows({
      auction_id: auctionId,
      payer_id: winnerId,
      amount: finalPrice,
      status: "held",
    });
    return new StepResponse({
      escrowId: escrow.id,
      auctionId,
      winnerId,
      finalPrice,
    });
  },
  // Compensation: release escrow if order creation fails
  async ({ escrowId }: { escrowId: string }, { container }) => {
    const auctionService = container.resolve("auction") as unknown as any;
    await auctionService.updateAuctionEscrows({
      id: escrowId,
      status: "released",
    });
  },
);

export const processAuctionWinWorkflow = createWorkflow(
  "process-auction-win",
  // @ts-ignore: workflow builder type
  (input: { auctionId: string; winnerId: string; finalPrice: number }) => {
    const notifyResult = notifyAuctionWinner(input);
    const orderResult = createAuctionOrder(input);
    return { notifyResult, orderResult };
  },
);
