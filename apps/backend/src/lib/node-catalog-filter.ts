import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
import { createLogger } from "../lib/logger";

const logger = createLogger("middleware:node-catalog-filter");

/**
 * Node-Aware Catalog Filter Middleware
 *
 * Intercepts GET /store/products requests and injects node-based visibility filters.
 * Products can be restricted to specific cities/districts/regions via the
 * `governance` module's restriction rules.
 *
 * How it works:
 * 1. Reads x-node-id header (set by storefront from customer's resolved node)
 * 2. Queries governance module for restrictions on that node
 * 3. Appends `node_restrictions` to req.filterableFields so the product
 *    API handler can include/exclude products accordingly
 *
 * Falls through silently if no node context is provided (global catalog).
 */
export async function nodeCatalogFilterMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const nodeId =
      (req.headers["x-node-id"] as string) || (req.query?.node_id as string);
    if (!nodeId) return next();

    const governanceService = req.scope.resolve("governance") as any;

    // Get restrictions for this node
    const restrictions = (await governanceService.listNodeRestrictions?.({
      node_id: nodeId,
      status: "active",
    })) as any[] | undefined;
    if (!restrictions || restrictions.length === 0) return next();

    const excludedCategoryIds = restrictions
      .filter((r: any) => r.restriction_type === "category_block")
      .map((r: any) => r.target_id);

    const excludedProductIds = restrictions
      .filter((r: any) => r.restriction_type === "product_block")
      .map((r: any) => r.target_id);

    const requiresPermit = restrictions
      .filter((r: any) => r.restriction_type === "permit_required")
      .map((r: any) => r.target_id);

    // Attach to request for downstream handlers
    (req as any).nodeContext = {
      nodeId,
      excludedCategoryIds,
      excludedProductIds,
      requiresPermit,
    };

    logger.debug(
      `Node ${nodeId}: blocking ${excludedCategoryIds.length} categories, ${excludedProductIds.length} products`,
    );
  } catch (err: any) {
    // Non-blocking — catalog still serves if governance is unavailable
    logger.warn("Node catalog filter error (skipped):", err?.message);
  }

  next();
}
