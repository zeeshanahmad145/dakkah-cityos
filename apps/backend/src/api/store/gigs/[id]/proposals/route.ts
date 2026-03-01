import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET  /store/gigs/:id/proposals  — list proposals for a gig (owner only)
 * POST /store/gigs/:id/proposals  — submit a proposal (auth required)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const freelanceService = req.scope.resolve("freelance") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const gigId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only list proposals if customer is the gig owner
    const gig = await freelanceService.retrieveGigListing(gigId);
    if (gig.owner_id !== customerId) {
      return res
        .status(403)
        .json({ error: "Only the gig owner can view proposals" });
    }

    const proposals = await freelanceService.listProposals({
      gig_id: gigId,
    });
    const list = Array.isArray(proposals)
      ? proposals
      : [proposals].filter(Boolean);

    return res.json({ proposals: list, count: list.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-GIG-PROPOSALS-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const freelanceService = req.scope.resolve("freelance") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const gigId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { cover_letter, bid_amount, estimated_days } = req.body as {
      cover_letter: string;
      bid_amount: number;
      estimated_days: number;
    };

    if (!cover_letter || !bid_amount || !estimated_days) {
      return res.status(400).json({
        error: "cover_letter, bid_amount, and estimated_days are required",
      });
    }

    const gig = await freelanceService.retrieveGigListing(gigId);
    if (gig.status !== "active") {
      return res
        .status(400)
        .json({ error: "This gig is not accepting proposals" });
    }

    const proposal = await freelanceService.createProposals({
      gig_id: gigId,
      freelancer_id: customerId,
      cover_letter,
      bid_amount,
      estimated_days,
      status: "submitted",
      submitted_at: new Date(),
    });

    return res.status(201).json({ proposal });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-GIG-PROPOSALS-CREATE");
  }
}
