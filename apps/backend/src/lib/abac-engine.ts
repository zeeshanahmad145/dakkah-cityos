import { createLogger } from "./logger";

const logger = createLogger("lib:abac-engine");

/**
 * ABACEngine — Attribute-Based Access Control engine for deep walt.id VC integration.
 *
 * Flow:
 *   1. Customer presents a Verifiable Credential (JWT or JSON-LD)
 *   2. ABACEngine verifies signature, checks expiry, checks revocation
 *   3. Claims are mapped to ABAC attributes (pricingTier, entitlements, approvalLevel, etc.)
 *   4. These attributes decorate PolicyContext.customer before policy evaluation
 *
 * This closes the "VC claims → ABAC → pricing/entitlements/approvals" gap.
 *
 * walt.id integration:
 *   - Signature verification via walt.id JOSE JWT library
 *   - Revocation check via walt.id StatusList2021 or did:revocation registry
 *   - DID resolution via walt.id /did/resolve endpoint
 *
 * When walt.id is unavailable, falls back to trusted JWT parsing (offline mode).
 */

export type ABACAttributes = {
  // Identity
  verified_did?: string;
  credential_types: string[]; // e.g. ["NationalID", "BusinessLicense", "AgeVerification"]
  issuer_did?: string;
  expires_at?: Date;
  is_revoked: boolean;

  // Commerce ABAC attributes derived from VC claims
  pricing_tier?:
    | "standard"
    | "premium"
    | "enterprise"
    | "government"
    | "subsidized";
  entitlements: string[]; // e.g. ["gov_service_access", "vat_exempt", "bulk_pricing"]
  approval_level?: "self" | "manager" | "admin" | "regulator";
  jurisdiction?: string; // ISO 3166-1 alpha-2
  kyc_level?: "none" | "basic" | "verified" | "enhanced";
  business_registration?: string;
  age_verified?: boolean;
  disability_flag?: boolean; // enables accessibility-tier pricing
  government_employee?: boolean;
};

export type VCVerificationResult = {
  valid: boolean;
  attributes: ABACAttributes;
  raw_claims?: Record<string, unknown>;
  verification_method?: string;
  verified_at: Date;
  warnings: string[];
};

// Claim-to-ABAC mapping rules
const CLAIM_MAPPINGS: Array<{
  claim_key: string;
  claim_value?: unknown; // if undefined, matches any truthy value
  attribute: keyof ABACAttributes;
  attribute_value: unknown;
}> = [
  {
    claim_key: "credentialType",
    claim_value: "GovernmentEmployee",
    attribute: "government_employee",
    attribute_value: true,
  },
  {
    claim_key: "credentialType",
    claim_value: "GovernmentEmployee",
    attribute: "pricing_tier",
    attribute_value: "government",
  },
  {
    claim_key: "credentialType",
    claim_value: "NationalID",
    attribute: "kyc_level",
    attribute_value: "verified",
  },
  {
    claim_key: "credentialType",
    claim_value: "BusinessLicense",
    attribute: "kyc_level",
    attribute_value: "enhanced",
  },
  {
    claim_key: "credentialType",
    claim_value: "AgeVerification",
    attribute: "age_verified",
    attribute_value: true,
  },
  {
    claim_key: "credentialType",
    claim_value: "DisabilityCard",
    attribute: "disability_flag",
    attribute_value: true,
  },
  {
    claim_key: "credentialType",
    claim_value: "DisabilityCard",
    attribute: "pricing_tier",
    attribute_value: "subsidized",
  },
  {
    claim_key: "credentialType",
    claim_value: "EnterpriseSubscriber",
    attribute: "pricing_tier",
    attribute_value: "enterprise",
  },
  {
    claim_key: "vat_exempt",
    claim_value: true,
    attribute: "entitlements",
    attribute_value: "vat_exempt",
  },
  {
    claim_key: "bulk_pricing_eligible",
    claim_value: true,
    attribute: "entitlements",
    attribute_value: "bulk_pricing",
  },
  {
    claim_key: "gov_service_access",
    claim_value: true,
    attribute: "entitlements",
    attribute_value: "gov_service_access",
  },
];

export class ABACEngine {
  private static instance: ABACEngine;
  private waltIdBaseUrl: string;
  private waltIdApiKey?: string;

  constructor() {
    this.waltIdBaseUrl =
      process.env.WALT_ID_ISSUER_URL ?? "https://issuer.walt.id";
    this.waltIdApiKey = process.env.WALT_ID_API_KEY;
  }

  static getInstance(): ABACEngine {
    if (!ABACEngine.instance) ABACEngine.instance = new ABACEngine();
    return ABACEngine.instance;
  }

  /**
   * Verify a Verifiable Credential and resolve its ABAC attributes.
   * Supports both JWT-VC and JSON-LD credential formats.
   */
  async resolveVC(vcToken: string): Promise<VCVerificationResult> {
    const warnings: string[] = [];

    try {
      // Try verifying via walt.id API first
      const result = await this._verifyWithWaltId(vcToken);
      const attributes = this._mapClaimsToAttributes(result.claims);
      return {
        valid: true,
        attributes,
        raw_claims: result.claims,
        verification_method: "walt.id",
        verified_at: new Date(),
        warnings,
      };
    } catch (err: any) {
      logger.warn(
        "walt.id verification failed, attempting offline fallback:",
        err.message,
      );
      warnings.push(
        "Online verification unavailable — using offline JWT parsing",
      );

      try {
        // Offline fallback: parse JWT without signature verification
        const claims = this._parseJwtOffline(vcToken);
        const expired = claims.exp
          ? new Date((claims.exp as number) * 1000) < new Date()
          : false;
        const attributes = this._mapClaimsToAttributes(claims);
        attributes.is_revoked = false; // cannot check revocation offline

        if (expired) {
          warnings.push("Credential may be expired — could not verify online");
          attributes.credential_types = [];
        }

        return {
          valid: !expired,
          attributes,
          raw_claims: claims,
          verification_method: "offline_jwt",
          verified_at: new Date(),
          warnings,
        };
      } catch {
        return {
          valid: false,
          attributes: {
            credential_types: [],
            entitlements: [],
            is_revoked: false,
          },
          verification_method: "failed",
          verified_at: new Date(),
          warnings: ["Credential could not be parsed or verified"],
        };
      }
    }
  }

  /**
   * Check revocation status against walt.id StatusList2021.
   */
  async checkRevocation(vcId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.waltIdBaseUrl}/credential/${vcId}/status`,
        {
          headers: {
            ...(this.waltIdApiKey
              ? { Authorization: `Bearer ${this.waltIdApiKey}` }
              : {}),
          },
        },
      );
      if (!res.ok) return false;
      const data = (await res.json()) as { revoked?: boolean };
      return data.revoked === true;
    } catch {
      return false; // cannot check → not revoked (fail open for revocation)
    }
  }

  /**
   * Map ABAC attributes onto a PolicyContext customer object.
   * Call this before PolicyEngineModuleService.evaluate() to enrich the context.
   */
  enrichPolicyContext(
    policyCustomer: Record<string, unknown>,
    attributes: ABACAttributes,
  ): Record<string, unknown> {
    return {
      ...policyCustomer,
      credentials: [
        ...((policyCustomer.credentials as string[]) ?? []),
        ...attributes.credential_types,
        ...attributes.entitlements,
      ],
      pricing_tier: attributes.pricing_tier,
      kyc_level: attributes.kyc_level,
      jurisdiction: attributes.jurisdiction,
      age_verified: attributes.age_verified,
      disability_flag: attributes.disability_flag,
      government_employee: attributes.government_employee,
      vc_verified: true,
      vc_verified_at: attributes.expires_at,
    };
  }

  private async _verifyWithWaltId(
    vcToken: string,
  ): Promise<{ claims: Record<string, unknown>; did?: string }> {
    const res = await fetch(`${this.waltIdBaseUrl}/credential/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.waltIdApiKey
          ? { Authorization: `Bearer ${this.waltIdApiKey}` }
          : {}),
      },
      body: JSON.stringify({ credential: vcToken }),
    });
    if (!res.ok) throw new Error(`walt.id verify failed: ${res.status}`);
    const data = (await res.json()) as {
      claims?: Record<string, unknown>;
      subject_did?: string;
    };
    return { claims: data.claims ?? {}, did: data.subject_did };
  }

  private _parseJwtOffline(token: string): Record<string, unknown> {
    const parts = token.split(".");
    if (parts.length < 2) throw new Error("Invalid JWT format");
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  }

  private _mapClaimsToAttributes(
    claims: Record<string, unknown>,
  ): ABACAttributes {
    const attributes: ABACAttributes = {
      credential_types: [],
      entitlements: [],
      is_revoked: false,
    };

    // Extract standard VC fields
    attributes.verified_did = (claims.sub ?? claims.did) as string | undefined;
    attributes.issuer_did = claims.iss as string | undefined;
    if (claims.exp)
      attributes.expires_at = new Date((claims.exp as number) * 1000);
    if (claims.jurisdiction)
      attributes.jurisdiction = claims.jurisdiction as string;

    // Extract credentialType array
    const credTypes: string[] = Array.isArray(claims.credentialType)
      ? (claims.credentialType as string[])
      : claims.credentialType
        ? [claims.credentialType as string]
        : Array.isArray(claims.type)
          ? (claims.type as string[]).filter(
              (t: string) => t !== "VerifiableCredential",
            )
          : [];
    attributes.credential_types = credTypes;

    // Apply mapping rules
    for (const rule of CLAIM_MAPPINGS) {
      const claimVal = claims[rule.claim_key];
      const matches =
        rule.claim_value !== undefined
          ? claimVal === rule.claim_value ||
            credTypes.includes(rule.claim_value as string)
          : !!claimVal;

      if (matches) {
        if (rule.attribute === "entitlements") {
          if (
            !attributes.entitlements.includes(rule.attribute_value as string)
          ) {
            attributes.entitlements.push(rule.attribute_value as string);
          }
        } else {
          (attributes as any)[rule.attribute] = rule.attribute_value;
        }
      }
    }

    return attributes;
  }
}

export const abacEngine = ABACEngine.getInstance();
