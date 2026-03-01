/**
 * parseRouteQuery — shared Zod query param validator for store routes
 *
 * Validates and coerces URL query parameters (all arrive as strings from Express).
 * Returns typed, sanitized query values + a standard 400 helper.
 *
 * Usage:
 *   import { parseStoreQuery, paginationSchema } from "../../../lib/route-query-validator"
 *
 *   const q = parseStoreQuery(req, res, mySchema)
 *   if (!q) return  // 400 already sent
 *   const { limit, offset, tenant_id, ...domain } = q
 */
import { z, ZodSchema } from "zod";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// ─── Shared schemas ────────────────────────────────────────────────────────────

/**
 * Common pagination + tenant params — added to every store route schema.
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  tenant_id: z.string().optional(),
  search: z.string().max(256).optional(),
});

/**
 * Grocery listing query params
 */
export const groceryQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  storage_type: z
    .enum(["refrigerated", "frozen", "ambient", "controlled"])
    .optional(),
  is_organic: z.enum(["true", "false"]).optional(),
});

/**
 * Fitness listing query params
 */
export const fitnessQuerySchema = paginationSchema.extend({
  vertical: z.enum(["class", "membership"]).default("class"),
  service_type: z.string().optional(),
});

/**
 * Freelance/gig listing query params
 */
export const gigQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  skill_level: z.enum(["junior", "mid", "senior", "expert"]).optional(),
});

/**
 * Restaurant menu item query params
 */
export const restaurantQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  menu_id: z.string().optional(),
  dietary_tag: z.string().optional(),
  is_featured: z.enum(["true", "false"]).optional(),
});

/**
 * Vehicle listing query params
 */
export const vehicleQuerySchema = paginationSchema.extend({
  make: z.string().optional(),
  listing_type: z.enum(["sale", "lease", "auction"]).optional(),
  condition: z
    .enum(["new", "certified_pre_owned", "used", "salvage"])
    .optional(),
  fuel_type: z
    .enum(["petrol", "diesel", "electric", "hybrid", "gas"])
    .optional(),
  min_year: z.coerce.number().int().min(1900).max(2100).optional(),
  max_year: z.coerce.number().int().min(1900).max(2100).optional(),
});

/**
 * Travel / accommodation query params
 */
export const travelQuerySchema = paginationSchema.extend({
  occupancy: z.coerce.number().int().min(1).max(20).optional(),
  check_in: z.string().datetime({ offset: true }).optional(),
  check_out: z.string().datetime({ offset: true }).optional(),
});

/**
 * Crowdfunding campaign query params
 */
export const crowdfundingQuerySchema = paginationSchema.extend({
  campaign_type: z.enum(["reward", "donation", "equity", "loan"]).optional(),
  category: z.string().optional(),
  status: z
    .enum(["draft", "active", "funded", "failed", "cancelled"])
    .default("active"),
});

/**
 * Parking zone query params
 */
export const parkingQuerySchema = paginationSchema.extend({
  zone_type: z.enum(["outdoor", "covered", "underground", "valet"]).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius_km: z.coerce.number().min(0.1).max(50).optional(),
});

/**
 * Subscription plan query params
 */
export const subscriptionQuerySchema = paginationSchema.extend({
  billing_interval: z
    .enum(["monthly", "yearly", "weekly", "quarterly"])
    .optional(),
});

/**
 * Healthcare query params
 */
export const healthcareQuerySchema = paginationSchema.extend({
  subcategory: z.enum(["pharmacy", "consultation", "lab", "device"]).optional(),
  prescription_required: z.enum(["true", "false"]).optional(),
});

/**
 * Real estate query params
 */
export const realEstateQuerySchema = paginationSchema.extend({
  listing_type: z.enum(["sale", "rent"]).optional(),
  property_type: z
    .enum(["apartment", "villa", "office", "land", "warehouse", "shop"])
    .optional(),
  city: z.string().max(100).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  furnished: z.enum(["true", "false"]).optional(),
});

/**
 * Insurance query params
 */
export const insuranceQuerySchema = paginationSchema.extend({
  plan_type: z
    .enum(["health", "auto", "life", "property", "travel"])
    .optional(),
  coverage_type: z.string().optional(),
});

/**
 * POD query params
 */
export const podQuerySchema = paginationSchema.extend({
  print_provider: z
    .enum(["printful", "printify", "gooten", "custom"])
    .optional(),
});

// ─── Validator helper ─────────────────────────────────────────────────────────

/**
 * Validates req.query against a Zod schema.
 * Returns the parsed + coerced query object, or sends a 400 and returns null.
 */
export function parseStoreQuery<T extends ZodSchema>(
  req: MedusaRequest,
  res: MedusaResponse,
  schema: T,
): z.infer<T> | null {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      message: "Invalid query parameters",
      errors: result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return null;
  }
  return result.data as z.infer<T>;
}
