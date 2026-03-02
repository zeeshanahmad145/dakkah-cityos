import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
import { createLogger } from "../lib/logger";

const logger = createLogger("middleware:node-price-override");

/**
 * Node-Aware Price Override Middleware
 *
 * Injects node-specific pricing context into cart and checkout requests.
 * Each city/district node may have:
 *   - price multipliers (e.g. +15% in remote regions)
 *   - flat overrides (specific products priced differently)
 *   - tax rate overrides (jurisdiction-specific VAT)
 *   - currency overrides (USD ↔ SAR ↔ KWD)
 *
 * Reads: x-node-id header
 * Writes: req.pricingContext (picked up by price calculation steps)
 *
 * Pattern: this middleware populates context; the actual price
 * computation happens in the Medusa pricing module when cart is created.
 */
export async function nodePriceOverrideMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const nodeId =
      (req.headers["x-node-id"] as string) || (req.query?.node_id as string);
    if (!nodeId) return next();

    const regionZoneService = req.scope.resolve("regionZone") as any;

    // Get the zone mapping for this node
    const mappings = (await regionZoneService.listRegionZoneMappings?.({
      node_id: nodeId,
      is_active: true,
    })) as any[] | undefined;

    if (!mappings || mappings.length === 0) return next();

    const zone = mappings[0];

    (req as any).pricingContext = {
      nodeId,
      regionZoneId: zone.id,
      zoneName: zone.name,
      priceMultiplier: zone.price_multiplier ?? 1.0,
      taxRateOverride: zone.tax_rate_override ?? null,
      currencyOverride: zone.currency_override ?? null,
      governorateCode: zone.governorate_code ?? null,
    };

    // Also set as pricing context for Medusa's price API
    if (!(req as any).pricingParams) {
      (req as any).pricingParams = {};
    }
    (req as any).pricingParams.context = {
      ...(req as any).pricingParams.context,
      node_id: nodeId,
      region_zone_id: zone.id,
    };

    logger.debug(
      `Node ${nodeId} → zone ${zone.name}, multiplier: ${zone.price_multiplier}`,
    );
  } catch (err: any) {
    logger.warn(
      "Node price override middleware error (skipped):",
      err?.message,
    );
  }

  next();
}
