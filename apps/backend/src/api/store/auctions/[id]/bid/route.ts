import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { handleApiError } from "../../../../../lib/api-error-handler";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const auctionId = req.params.id;
  const { bidder_id, amount } = req.body as {
    bidder_id: string;
    amount: number;
  };

  if (!bidder_id || !amount) {
    return res.status(400).json({ error: "bidder_id and amount are required" });
  }

  try {
    const auctionService = req.scope.resolve("auction") as any;
    const bid = await auctionService.placeBid(
      auctionId,
      bidder_id,
      Number(amount),
    );

    return res.status(201).json({ bid });
  } catch (error: any) {
    return handleApiError(res, error, "Place bid");
  }
}
