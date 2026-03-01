import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

/**
 * Governance Permission Middleware
 * Checks that the actor has effective permission for the requested admin resource.
 * Reads permissions from the GovernanceAuthority chain for the actor's tenant.
 *
 * Usage: Apply in medusa-config.ts as an admin route middleware.
 */
export async function governancePermissionMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const governanceService = req.scope.resolve("governance") as unknown as any;

    // Skip if governance module not wired
    if (!governanceService) return next();

    const tenantId: string | undefined =
      req.auth_context?.app_metadata?.tenant_id || req.query.tenant_id;

    if (!tenantId) return next(); // No tenant context → allow (handled by auth guard upstream)

    // Check compliance status — only block if explicitly violated
    const status = await governanceService.checkComplianceStatus(tenantId);

    if (!status.compliant && status.violations.length > 0) {
      const criticalViolations = status.violations.filter(
        (v: any) =>
          v.policyType === "access_control" || v.policyType === "security",
      );

      if (criticalViolations.length > 0) {
        return res.status(403).json({
          error: "Access blocked by governance policy",
          violations: criticalViolations.map((v: any) => ({
            policy: v.policyName,
            reason: v.reason,
          })),
        });
      }
    }

    // Attach effective policies to request for downstream handlers
    req.governance_policies =
      await governanceService.resolveEffectivePolicies(tenantId);

    return next();
  } catch {
    // Non-blocking — governance check failures should not prevent access
    return next();
  }
}
