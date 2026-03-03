/**
 * walt.id VC Lifecycle Service
 *
 * Manages the full Verifiable Credential lifecycle at key operational checkpoints:
 *   - Issuance: issue a VC for a Dakkah customer event (KYC approved, vendor onboarded, etc.)
 *   - Revocation: revoke a VC when a credential becomes invalid (account suspended, etc.)
 *   - Status check: verify if a VC's StatusList2021 bit is revoked
 *   - Validity window: check expiry against system clock
 *   - Edge validation: offline JWT parse for venue/field ops checkpoints
 *
 * For ABAC integration, the ABACEngine (lib/abac-engine.ts) handles
 * verification + attribute mapping at request time. This service handles
 * the issuance and revocation management layer.
 *
 * Environment:
 *   WALT_ID_ISSUER_URL    — walt.id issuer API base URL
 *   WALT_ID_API_KEY       — API key for walt.id
 *   WALT_ID_VERIFIER_URL  — verifier API URL (may differ from issuer)
 *   WALT_ID_DID           — Platform DID (issuer identity)
 */

import { createLogger } from "../../lib/logger";

const logger = createLogger("waltid:lifecycle");

function waltHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(process.env.WALT_ID_API_KEY
      ? { Authorization: `Bearer ${process.env.WALT_ID_API_KEY}` }
      : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Credential Type Registry — maps business events to VC credential types
// ─────────────────────────────────────────────────────────────────────────────
export const CREDENTIAL_TYPES = {
  KYC_VERIFIED: "KYCIdentityCredential",
  VENDOR_ONBOARDED: "VendorLicenseCredential",
  GOVERNMENT_EMPLOYEE: "GovernmentEmployeeCredential",
  DISABILITY_CARD: "DisabilityCardCredential",
  BUSINESS_LICENSE: "BusinessLicenseCredential",
  NATIONAL_ID: "NationalIdentityCredential",
  SUBSCRIPTION_BENEFIT: "SubscriptionBenefitCredential",
  ENTITLEMENT: "EntitlementCredential",
} as const;

export type CredentialType =
  (typeof CREDENTIAL_TYPES)[keyof typeof CREDENTIAL_TYPES];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Issue a Verifiable Credential
// ─────────────────────────────────────────────────────────────────────────────
export async function issueVC(params: {
  holderDid: string;
  credentialType: CredentialType;
  subjectData: Record<string, unknown>;
  expiresInDays?: number;
}): Promise<{ credential: string; credentialId: string }> {
  const issuerUrl = process.env.WALT_ID_ISSUER_URL;
  if (!issuerUrl) {
    logger.warn("walt.id issuer not configured — VC issuance skipped");
    return { credential: "", credentialId: "" };
  }

  const expirationDate = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86_400_000).toISOString()
    : undefined;

  const body = {
    issuerDid: process.env.WALT_ID_DID ?? "",
    subjectDid: params.holderDid,
    credentialData: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
      ],
      type: ["VerifiableCredential", params.credentialType],
      credentialSubject: {
        id: params.holderDid,
        ...params.subjectData,
      },
      ...(expirationDate ? { expirationDate } : {}),
    },
    signatureType: "JsonWebSignature2020",
  };

  const res = await fetch(`${issuerUrl}/v1/credentials/issue`, {
    method: "POST",
    headers: waltHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`walt.id issuance failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as any;
  const credentialId = data.id ?? data.credentialId ?? "";

  logger.info(
    `Issued ${params.credentialType} VC ${credentialId} for ${params.holderDid}`,
  );
  return {
    credential: data.vc ?? data.credential ?? JSON.stringify(data),
    credentialId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Revoke a Verifiable Credential (StatusList2021)
// ─────────────────────────────────────────────────────────────────────────────
export async function revokeVC(params: {
  credentialId: string;
  reason?: string;
}): Promise<void> {
  const issuerUrl = process.env.WALT_ID_ISSUER_URL;
  if (!issuerUrl)
    return logger.warn("walt.id issuer not configured — revocation skipped");

  const res = await fetch(
    `${issuerUrl}/v1/credentials/${params.credentialId}/revoke`,
    {
      method: "POST",
      headers: waltHeaders(),
      body: JSON.stringify({ reason: params.reason ?? "Account suspended" }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    logger.error(
      `walt.id revocation failed for ${params.credentialId}: ${res.status} ${err}`,
    );
    return;
  }

  logger.info(`Revoked VC ${params.credentialId} — ${params.reason ?? ""}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Verify a VC at runtime (wraps the verifier endpoint)
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyVC(vcToken: string): Promise<{
  valid: boolean;
  holderDid?: string;
  credentialType?: string;
  expiresAt?: Date;
  reason?: string;
}> {
  const verifierUrl =
    process.env.WALT_ID_VERIFIER_URL ?? process.env.WALT_ID_ISSUER_URL;
  if (!verifierUrl) {
    return { valid: false, reason: "Verifier not configured" };
  }

  try {
    const res = await fetch(`${verifierUrl}/v1/verify`, {
      method: "POST",
      headers: waltHeaders(),
      body: JSON.stringify({ vc: vcToken }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || data.valid === false) {
      return { valid: false, reason: data.error ?? "Invalid VC" };
    }

    const claims = data.credentialSubject ?? {};
    const expirationDate = data.expirationDate
      ? new Date(data.expirationDate)
      : undefined;

    // Check expiry
    if (expirationDate && expirationDate < new Date()) {
      return { valid: false, reason: "VC expired", expiresAt: expirationDate };
    }

    // Check revocation via StatusList2021 status
    if (data.credentialStatus?.statusListCredential) {
      const revoked = await _checkRevocationStatus(
        data.credentialStatus.statusListCredential,
        data.credentialStatus.statusListIndex,
      );
      if (revoked) return { valid: false, reason: "VC revoked" };
    }

    return {
      valid: true,
      holderDid: claims.id,
      credentialType: (data.type as string[])?.find(
        (t) => t !== "VerifiableCredential",
      ),
      expiresAt: expirationDate,
    };
  } catch (err: any) {
    logger.error(`walt.id verification error: ${err.message}`);
    return { valid: false, reason: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Edge validation — offline JWT check for field/venue checkpoints
//    (no network required — signature verification skipped, expiry checked)
// ─────────────────────────────────────────────────────────────────────────────
export function verifyVCOffline(vcToken: string): {
  valid: boolean;
  claims?: Record<string, unknown>;
  reason?: string;
} {
  try {
    const parts = vcToken.split(".");
    if (parts.length < 2) return { valid: false, reason: "Not a JWT" };

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: "JWT expired", claims: payload };
    }

    if (payload.nbf && payload.nbf > now) {
      return { valid: false, reason: "JWT not yet valid", claims: payload };
    }

    // NOTE: Signature is NOT verified in offline mode.
    // This is intentional for edge/field checkpoint use only.
    // Do not use for financial authorization decisions.
    logger.warn("Offline VC verification used — signature NOT checked");

    return { valid: true, claims: payload };
  } catch (err: any) {
    return { valid: false, reason: `JWT parse error: ${err.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function _checkRevocationStatus(
  statusListCredentialUrl: string,
  index: number,
): Promise<boolean> {
  try {
    const res = await fetch(statusListCredentialUrl);
    if (!res.ok) return false;
    const statusList = (await res.json()) as any;
    // StatusList2021: encoded bitstring at credentialSubject.encodedList
    const encoded = statusList?.credentialSubject?.encodedList ?? "";
    if (!encoded) return false;
    const decoded = Buffer.from(encoded, "base64");
    const byteIndex = Math.floor(index / 8);
    const bitIndex = 7 - (index % 8);
    return !!((decoded[byteIndex] ?? 0) & (1 << bitIndex));
  } catch {
    return false;
  }
}
