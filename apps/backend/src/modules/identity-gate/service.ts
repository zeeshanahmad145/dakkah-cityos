import { MedusaService } from "@medusajs/framework/utils";
import { IdentityRequirement } from "./models/identity-requirement";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:identity-gate");

class IdentityGateModuleService extends MedusaService({ IdentityRequirement }) {
  /**
   * Check whether a customer satisfies identity requirements for the given product types.
   * Returns { allowed: true } if all requirements pass, or { allowed: false, violations: [] }.
   *
   * Verification strategy:
   *   1. Check walt.id verifiable presentation (VP) if provider === "walt_id"
   *   2. Fall back to internal profile flags if provider === "internal"
   *   3. Soft-gate (is_hard_gate=false) only warns, doesn't block
   */
  async checkRequirements(
    customerId: string,
    productTypes: string[],
    customerProfile: {
      verified_credentials?: string[]; // e.g. ["age_21", "kyc_verified"]
      vp_jwt?: string; // walt.id VP token if available
    } = {},
  ): Promise<{
    allowed: boolean;
    violations: Array<{
      product_type: string;
      required: string;
      is_hard: boolean;
      message?: string;
    }>;
    warnings: string[];
  }> {
    const violations: Array<{
      product_type: string;
      required: string;
      is_hard: boolean;
      message?: string;
    }> = [];
    const warnings: string[] = [];

    const verifiedCreds = new Set(customerProfile.verified_credentials ?? []);

    for (const productType of productTypes) {
      const requirements = (await this.listIdentityRequirements({
        product_type: productType,
        is_active: true,
      })) as any[];

      for (const req of requirements) {
        const credType: string = req.required_credential_type;

        // Check if customer holds the required credential
        const held = verifiedCreds.has(credType);
        if (held) continue; // Satisfied

        // Also try to verify from walt.id VP if JWT provided
        if (customerProfile.vp_jwt && req.verification_provider === "walt_id") {
          const verified = await this._verifyFromWaltId(
            customerProfile.vp_jwt,
            credType,
          );
          if (verified) {
            verifiedCreds.add(credType); // Cache for subsequent checks
            continue;
          }
        }

        if (req.is_hard_gate) {
          violations.push({
            product_type: productType,
            required: credType,
            is_hard: true,
            message:
              req.rejection_message ??
              `You must have a verified ${credType} to purchase ${productType} products.`,
          });
        } else {
          warnings.push(
            `Purchasing ${productType} products requires ${credType} verification. Please verify before delivery.`,
          );
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Stub for walt.id VP verification.
   * In production: decode the JWT VP, extract credentials, verify signature.
   */
  private async _verifyFromWaltId(
    vpJwt: string,
    requiredCredType: string,
  ): Promise<boolean> {
    try {
      const WALT_ID_URL = process.env.WALT_ID_VERIFIER_URL ?? "";
      if (!WALT_ID_URL) return false;

      const response = await fetch(`${WALT_ID_URL}/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vp: vpJwt,
          required_credential_type: requiredCredType,
        }),
      });
      if (!response.ok) return false;
      const result: any = await response.json();
      return result.verified === true;
    } catch {
      logger.warn(
        `walt.id verification failed for cred type: ${requiredCredType}`,
      );
      return false;
    }
  }
}

export default IdentityGateModuleService;
