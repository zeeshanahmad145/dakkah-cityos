import { createLogger } from "../../lib/logger";

const logger = createLogger("service:offer-resolver");

/**
 * OfferResolver — Bridges Payload CMS content to kernel Offer records.
 *
 * Closes the "Offer Page abstraction" gap:
 *   - Given a POI (Point of Interest) → returns ordered list of offers for that location
 *   - Given a Payload page_id → returns the kernel Offer the page represents
 *   - Given an Offer → returns the Payload content blocks for its landing page
 *
 * This is the "everything is a POI landing page" pattern:
 *   Payload manages visual content (hero, blocks, SEO)
 *   Kernel manages commerce structure (offer type, pricing, lifecycle)
 *   OfferResolver joins them at request time.
 */

export type OfferPageComposition = {
  offer_id: string;
  offer_type: string;
  monetization_model: string;
  title: string;
  currency_code: string;
  base_price: number;
  content_blocks: ContentBlock[];
  seo: { title: string; description: string; keywords?: string[] };
  personalization?: OfferPersonalization;
};

export type ContentBlock = {
  type:
    | "hero"
    | "features"
    | "pricing"
    | "gallery"
    | "reviews"
    | "cta"
    | "map"
    | "schedule"
    | "custom";
  data: Record<string, unknown>;
};

export type OfferPersonalization = {
  pricing_tier?: string;
  discount_pct?: number;
  highlight_entitlement?: string;
};

export class OfferResolver {
  private kernelService: any;
  private payloadApiUrl: string;
  private payloadApiKey?: string;

  constructor(kernelService: any) {
    this.kernelService = kernelService;
    this.payloadApiUrl =
      process.env.PAYLOAD_API_URL ?? "http://localhost:3001/api";
    this.payloadApiKey = process.env.PAYLOAD_API_KEY;
  }

  /**
   * For a given POI (Place/Location), return ordered list of active Offers.
   * Filters by tenant/channel/persona context.
   */
  async resolveForPOI(
    poiId: string,
    context?: { tenantId?: string; personaId?: string; channelId?: string },
  ): Promise<OfferPageComposition[]> {
    const filter: Record<string, unknown> = { is_active: true };
    if (context?.tenantId) filter.tenant_id = context.tenantId;

    const offers = (await this.kernelService.listOffers({
      ...filter,
      metadata: { poi_id: poiId }, // offers tagged with this POI
    })) as any[];

    const pages = await Promise.allSettled(
      offers.map((offer: any) => this.getOfferPage(offer.id, offer, context)),
    );
    return pages
      .filter(
        (r): r is PromiseFulfilledResult<OfferPageComposition> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);
  }

  /**
   * Get the full page composition for a given offer_id.
   * Fetches kernel Offer + Payload content blocks.
   */
  async getOfferPage(
    offerId: string,
    offerData?: any,
    context?: { personaId?: string; pricingTier?: string },
  ): Promise<OfferPageComposition> {
    const offer =
      offerData ?? (await this.kernelService.retrieveOffer(offerId));

    // Try to fetch Payload content blocks for this offer
    let contentBlocks: ContentBlock[] = [];
    let seo: { title: string; description: string; keywords?: string[] } = {
      title: offer.title ?? offer.id,
      description: "",
    };

    try {
      const payloadRes = await fetch(
        `${this.payloadApiUrl}/offers-content?where[offer_id][equals]=${offerId}`,
        {
          headers: {
            ...(this.payloadApiKey
              ? { Authorization: `Bearer ${this.payloadApiKey}` }
              : {}),
          },
        },
      );
      if (payloadRes.ok) {
        const payloadData = (await payloadRes.json()) as { docs?: any[] };
        const doc = payloadData.docs?.[0];
        if (doc) {
          contentBlocks = (doc.blocks ?? []) as ContentBlock[];
          seo = {
            title: doc.seo_title ?? offer.title ?? offer.id,
            description: doc.seo_description ?? "",
            keywords: doc.seo_keywords ?? [],
          };
        }
      }
    } catch (err: any) {
      logger.warn(
        `Payload content not available for offer ${offerId}: ${err.message}`,
      );
    }

    // Default content blocks if Payload content not available
    if (contentBlocks.length === 0) {
      contentBlocks = this._defaultContentBlocks(offer);
    }

    return {
      offer_id: offer.id,
      offer_type: offer.offer_type,
      monetization_model: offer.monetization_model,
      title: offer.title ?? offer.source_entity_id,
      currency_code: offer.currency_code ?? "SAR",
      base_price: offer.base_price ?? 0,
      content_blocks: contentBlocks,
      seo,
    };
  }

  /**
   * Resolve which kernel Offer a Payload page represents.
   * Uses the offer_id field stored in Payload document metadata.
   */
  async resolveForPage(
    payloadPageId: string,
  ): Promise<{ offer_id: string | null; offer?: any }> {
    try {
      const res = await fetch(`${this.payloadApiUrl}/pages/${payloadPageId}`, {
        headers: {
          ...(this.payloadApiKey
            ? { Authorization: `Bearer ${this.payloadApiKey}` }
            : {}),
        },
      });
      if (!res.ok) return { offer_id: null };
      const doc = (await res.json()) as { offer_id?: string };
      if (!doc.offer_id) return { offer_id: null };

      const offer = await this.kernelService.retrieveOffer(doc.offer_id);
      return { offer_id: doc.offer_id, offer };
    } catch {
      return { offer_id: null };
    }
  }

  /**
   * Generate default content blocks for an offer based on its type and monetization model.
   * Used when Payload CMS has no content configured yet.
   */
  private _defaultContentBlocks(offer: any): ContentBlock[] {
    const blocks: ContentBlock[] = [
      {
        type: "hero",
        data: {
          title: offer.title,
          subtitle: `${offer.offer_type} · ${offer.monetization_model}`,
        },
      },
    ];

    if (
      ["recurring", "usage", "milestone"].includes(offer.monetization_model)
    ) {
      blocks.push({
        type: "pricing",
        data: {
          base_price: offer.base_price,
          currency: offer.currency_code,
          model: offer.monetization_model,
        },
      });
    }

    if (offer.execution_engine === "booking") {
      blocks.push({ type: "schedule", data: { booking_enabled: true } });
    }

    blocks.push({
      type: "cta",
      data: { label: "Get Started", action: "checkout" },
    });
    return blocks;
  }
}
