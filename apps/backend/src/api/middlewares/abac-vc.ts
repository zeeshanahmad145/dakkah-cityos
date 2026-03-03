import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { abacEngine } from "../../lib/abac-engine";
import { createLogger } from "../../lib/logger";

type NextFunction = () => void;

const logger = createLogger("middleware:abac-vc");

/**
 * ABAC VC Middleware — enriches PolicyContext.customer with resolved
 * Verifiable Credential attributes before route handlers execute.
 *
 * Reads X-VC-Token header (or Authorization: Bearer vc_... for VC tokens).
 * If a VC token is present and valid, resolves ABAC attributes and attaches
 * them to req as req.abac_attributes for downstream policy evaluation.
 *
 * This enables PolicyEngineModuleService.evaluate() to apply VC-aware rules:
 *   - Government employee → government pricing tier
 *   - DisabilityCard → subsidized pricing
 *   - BusinessLicense → B2B/enterprise entitlements
 *   - NationalID → KYC-verified flag
 */
export async function abacVcMiddleware(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: NextFunction,
): Promise<void> {
  try {
    // Read VC token from dedicated header or Authorization (vc_ prefix)
    const vcHeader = req.headers["x-vc-token"] as string | undefined;
    const authHeader = req.headers["authorization"] as string | undefined;
    const vcToken =
      vcHeader ??
      (authHeader?.startsWith("Bearer vc_") ? authHeader.slice(7) : undefined);

    if (vcToken) {
      const result = await abacEngine.resolveVC(vcToken);

      if (result.valid) {
        // Attach to request for use by policy engine + route handlers
        (req as any).abac_attributes = result.attributes;
        (req as any).vc_verified = true;

        // Enrich any existing customer context
        if ((req as any).policy_context?.customer) {
          (req as any).policy_context.customer = abacEngine.enrichPolicyContext(
            (req as any).policy_context.customer,
            result.attributes,
          );
        }

        logger.info(
          `ABAC: VC resolved for ${result.attributes.verified_did ?? "unknown"} — tier=${result.attributes.pricing_tier ?? "standard"} kyc=${result.attributes.kyc_level ?? "none"}`,
        );
      } else {
        // Token present but invalid — log and continue (don't block, policy engine will handle)
        logger.warn(`ABAC: Invalid VC token — ${result.warnings.join("; ")}`);
        (req as any).vc_verified = false;
      }
    } else {
      (req as any).vc_verified = false;
    }
  } catch (err: any) {
    // Never block the request — ABAC is enrichment, not hard auth
    logger.error("ABAC middleware error (non-blocking):", err.message);
  }
  next();
}

/**
 * Policy context builder middleware — attaches a normalized PolicyContext
 * to the request from auth_context + query/body data.
 * Must run before policy evaluation in route handlers.
 */
export function buildPolicyContextMiddleware(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: NextFunction,
): void {
  const actor = req.auth_context;
  (req as any).policy_context = {
    actor: { type: actor?.actor_type ?? "anonymous", id: actor?.actor_id },
    customer: {
      id: actor?.actor_id,
      ...(actor?.actor_type === "customer" ? { credentials: [] } : {}),
    },
    context: {
      ip_country: (req.headers["cf-ipcountry"] as string) ?? undefined,
      jurisdiction: (req.headers["x-jurisdiction"] as string) ?? undefined,
      node_id: (req.headers["x-node-id"] as string) ?? undefined,
    },
  };
  next();
}
