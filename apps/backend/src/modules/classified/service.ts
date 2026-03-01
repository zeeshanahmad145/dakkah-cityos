import { MedusaService } from "@medusajs/framework/utils";
import ClassifiedListing from "./models/classified-listing";
import ListingImage from "./models/listing-image";
import ListingOffer from "./models/listing-offer";
import ListingCategory from "./models/listing-category";
import ListingFlag from "./models/listing-flag";

class ClassifiedModuleService extends MedusaService({
  ClassifiedListing,
  ListingImage,
  ListingOffer,
  ListingCategory,
  ListingFlag,
}) {
  /** Publish a draft listing, making it visible to buyers */
  async publishListing(listingId: string): Promise<any> {
    const listing = await this.retrieveClassifiedListing(listingId) as any;

    if (listing.status === "published") {
      throw new Error("Listing is already published");
    }

    if (listing.status === "flagged") {
      throw new Error("Flagged listings cannot be published");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return await this.updateClassifiedListings({
      id: listingId,
      status: "published",
      published_at: new Date(),
      expires_at: expiresAt,
    } as any);
  }

  /** Expire an active listing */
  async expireListing(listingId: string): Promise<any> {
    const listing = await this.retrieveClassifiedListing(listingId) as any;

    if (listing.status !== "published") {
      throw new Error("Only published listings can be expired");
    }

    return await this.updateClassifiedListings({
      id: listingId,
      status: "expired",
      expired_at: new Date(),
    } as any);
  }

  /** Flag a listing for review with a reason */
  async flagListing(
    listingId: string,
    reason: string,
    reporterId?: string,
  ): Promise<any> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Flag reason is required");
    }

    const listing = await this.retrieveClassifiedListing(listingId) as any;

    const flag = await this.createListingFlags({
      listing_id: listingId,
      reason,
      reporter_id: reporterId || null,
      status: "pending",
      flagged_at: new Date(),
    } as any);

    await this.updateClassifiedListings({
      id: listingId,
      status: "flagged",
      flag_count: Number(listing.flag_count || 0) + 1,
    } as any);

    return flag;
  }

  /** Renew an expired listing for another 30 days */
  async renewListing(listingId: string, durationDays?: number): Promise<any> {
    const listing = await this.retrieveClassifiedListing(listingId) as any;

    if (!["expired", "published"].includes(listing.status)) {
      throw new Error("Only expired or published listings can be renewed");
    }

    const days = durationDays && durationDays > 0 ? durationDays : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    return await this.updateClassifiedListings({
      id: listingId,
      status: "published",
      expires_at: expiresAt,
      renewed_at: new Date(),
    } as any);
  }

  async searchListings(filters: {
    category?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    status?: string;
  }): Promise<any[]> {
    const queryFilters: Record<string, any> = {};

    if (filters.status) {
      queryFilters.status = filters.status;
    } else {
      queryFilters.status = "published";
    }

    if (filters.category) {
      queryFilters.category = filters.category;
    }

    if (filters.location) {
      queryFilters.location = filters.location;
    }

    const listings = await this.listClassifiedListings(queryFilters) as any;
    let results = Array.isArray(listings)
      ? listings
      : [listings].filter(Boolean);

    if (filters.priceMin !== undefined) {
      results = results.filter(
        (l: any) => Number(l.price || 0) >= filters.priceMin!,
      );
    }
    if (filters.priceMax !== undefined) {
      results = results.filter(
        (l: any) => Number(l.price || 0) <= filters.priceMax!,
      );
    }

    return results;
  }

  async expireOldListings(): Promise<{
    expiredCount: number;
    expiredIds: string[];
  }> {
    const published = await this.listClassifiedListings({
      status: "published",
    }) as any;
    const listings = Array.isArray(published)
      ? published
      : [published].filter(Boolean);

    const now = new Date();
    const expiredIds: string[] = [];

    for (const listing of listings) {
      if (listing.expires_at && new Date(listing.expires_at) < now) {
        await this.updateClassifiedListings({
          id: listing.id,
          status: "expired",
          expired_at: now,
        } as any);
        expiredIds.push(listing.id);
      }
    }

    return { expiredCount: expiredIds.length, expiredIds };
  }
}

export default ClassifiedModuleService;
