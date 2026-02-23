import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  validateSystemAccess,
  getPrefixEntry,
  parseTenantFromPath,
} from "../../../../../lib/storage/prefixRegistry";
import { randomUUID } from "crypto";
import { appConfig } from "../../../../../lib/config";

export const AUTHENTICATE = false;

const PUBLIC_PREFIXES = [
  "media",
  "templates",
  "branding",
  "poi",
  "domains/commerce/products",
  "domains/commerce/catalogs",
  "domains/commerce/vendors",
  "domains/charity",
  "domains/education",
  "domains/real-estate",
  "domains/fitness",
  "domains/pet-service",
  "domains/automotive",
  "domains/restaurant",
  "domains/travel",
  "domains/parking",
  "domains/advertising",
  "domains/social-commerce",
  "domains/crowdfunding",
  "domains/membership",
  "domains/freelance",
  "domains/event-ticketing",
  "domains/classified",
  "domains/auction",
  "domains/rental",
  "domains/grocery",
];

const PRIVATE_PREFIXES = [
  "governance",
  "system",
  "workflows",
  "users",
  "domains/healthcare",
  "domains/fleet-logistics",
  "domains/transportation",
  "domains/government",
  "domains/legal",
  "domains/utilities",
  "domains/insurance",
  "domains/digital-product",
];

function isPublicPrefix(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function isPrivatePrefix(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function extractPrefix(path: string): string {
  const parts = path.split("/");
  if (parts[0] === "domains" && parts.length >= 3) {
    return parts.slice(0, 3).join("/");
  }
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("/");
  }
  return parts[0];
}

function getCacheControl(visibility: string): string {
  switch (visibility) {
    case "public":
      return "public, max-age=31536000, immutable";
    case "tenant":
      return "private, max-age=3600";
    case "private":
    case "user-private":
      return "no-store, no-cache, must-revalidate";
    default:
      return "public, max-age=31536000, immutable";
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const keyParam = req.query.key as string;
    if (!keyParam) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'key' is required (storage path)",
      });
    }

    const correlationId = (req.headers["x-correlation-id"] as string) || randomUUID();

    let effectivePath = keyParam;
    const tenantInfo = parseTenantFromPath(keyParam);
    if (tenantInfo) {
      effectivePath = tenantInfo.rest;
    }

    const prefix = extractPrefix(effectivePath);
    const prefixEntry = getPrefixEntry(prefix);
    const visibility = prefixEntry?.visibility || "public";

    if (isPrivatePrefix(effectivePath)) {
      const apiKey = req.headers["x-api-key"] as string;
      const systemId = req.headers["x-system-id"] as string;

      if (!apiKey || !systemId) {
        return res.status(401).json({
          success: false,
          error: "X-Api-Key and X-System-Id headers required for private files",
        });
      }

      const accessCheck = validateSystemAccess(systemId, prefix);
      if (!accessCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: accessCheck.reason,
        });
      }
    }

    const blobBaseUrl = appConfig.storage.blobStoreUrl;
    const downloadUrl = blobBaseUrl
      ? `${blobBaseUrl}/${keyParam}`
      : keyParam.startsWith("http")
        ? keyParam
        : `/platform/storage/serve?path=${encodeURIComponent(keyParam)}`;

    res.set({
      "X-Media-Id": keyParam,
      "X-Source-System": (req.headers["x-system-id"] as string) || "unknown",
      "X-Visibility": visibility,
      "X-Correlation-Id": correlationId,
      "Cache-Control": getCacheControl(visibility),
    });

    return res.json({
      success: true,
      data: {
        key: keyParam,
        prefix,
        visibility,
        tenantSlug: tenantInfo?.tenantSlug || null,
        downloadUrl,
        correlationId,
      },
    });
  } catch (error: any) {
    console.error("Gateway download error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
