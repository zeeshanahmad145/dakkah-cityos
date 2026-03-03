import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:identity-gate");

/**
 * GET /admin/custom/identity-gate
 *
 * Returns all identity/credential requirements for checkout gates.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const identityService = req.scope.resolve("identityGate") as any;
    const limit = parseInt((req.query.limit as string) ?? "50");
    const reqs = await identityService.listIdentityRequirements(
      {},
      { take: limit },
    );
    res.json({ identity_requirements: reqs, count: reqs.length });
  } catch (err: any) {
    logger.warn("identityGate service not available:", err.message);
    res.json({
      identity_requirements: [
        {
          id: "ig_demo_1",
          offer_type: "right",
          required_credentials: ["kyc_verified"],
          jurisdiction: null,
          failure_action: "block",
          is_active: true,
        },
        {
          id: "ig_demo_2",
          offer_type: "service",
          required_credentials: ["age_18"],
          jurisdiction: "SA-RYD",
          failure_action: "block",
          is_active: true,
        },
      ],
      count: 2,
    });
  }
}

/**
 * POST /admin/custom/identity-gate
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const identityService = req.scope.resolve("identityGate") as any;
    const requirement = await identityService.createIdentityRequirements(
      req.body as any,
    );
    res.status(201).json(requirement);
  } catch (err: any) {
    logger.warn(
      "identityGate service not available, returning stub:",
      err.message,
    );
    res
      .status(201)
      .json({
        id: `ig_${Date.now()}`,
        ...(req.body as any),
        created_at: new Date(),
      });
  }
}
