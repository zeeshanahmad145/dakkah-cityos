import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * POST /store/classifieds/:id/offer  — make an offer on a classified listing
 * GET  /store/classifieds/:id/offer  — get existing offers (listing owner only)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const classifiedService = req.scope.resolve("classified") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const listingId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { offer_amount, message } = req.body as {
      offer_amount: number;
      message?: string;
    };

    if (!offer_amount || offer_amount <= 0) {
      return res
        .status(400)
        .json({ error: "offer_amount must be greater than 0" });
    }

    // Verify listing is still active
    const listing =
      await classifiedService.retrieveClassifiedListing(listingId);
    if (listing.status !== "active") {
      return res
        .status(400)
        .json({ error: "This listing is no longer accepting offers" });
    }
    if (listing.seller_id === customerId) {
      return res
        .status(400)
        .json({ error: "You cannot make an offer on your own listing" });
    }

    const offer = await classifiedService.createListingOffers({
      classified_listing_id: listingId,
      buyer_id: customerId,
      offer_amount,
      message: message ?? null,
      status: "pending",
      offered_at: new Date(),
    });

    return res.status(201).json({ offer });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CLASSIFIED-OFFER-CREATE");
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const classifiedService = req.scope.resolve("classified") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const listingId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const listing =
      await classifiedService.retrieveClassifiedListing(listingId);

    // Only the listing seller or the offer submitter can view offers
    const offers = await classifiedService.listListingOffers({
      classified_listing_id: listingId,
    });
    const list = Array.isArray(offers) ? offers : [offers].filter(Boolean);

    const visible =
      listing.seller_id === customerId
        ? list // Seller sees all offers
        : list.filter((o: any) => o.buyer_id === customerId); // Buyer only sees own offer

    return res.json({ offers: visible, count: visible.length });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CLASSIFIED-OFFER-GET");
  }
}
