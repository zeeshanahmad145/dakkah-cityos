import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getAllPrefixes,
  getAllSystemPolicies,
  getAllCollectionMappings,
} from "../../../../lib/storage/prefixRegistry";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const prefixes = getAllPrefixes();
    const policies = getAllSystemPolicies();
    const mappings = getAllCollectionMappings();

    const activeProvider = process.env.BLOB_READ_WRITE_TOKEN
      ? "vercel-blob"
      : "replit-object-storage";

    const storageProviderOverride = process.env.STORAGE_PROVIDER || null;

    return res.json({
      success: true,
      data: {
        provider: {
          active: storageProviderOverride || activeProvider,
          override: storageProviderOverride,
          vercelBlobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
          replitObjectStorageAvailable: true,
        },
        prefixCount: Object.keys(prefixes).length,
        systemPolicyCount: Object.keys(policies).length,
        collectionMappingCount: Object.keys(mappings).length,
        defaultTenant: process.env.CITYOS_DEFAULT_TENANT || "dakkah",
        endpoints: {
          info: "/platform/storage/info",
          gateway: "/platform/storage/gateway/download?key={path}",
          serve: "/platform/storage/serve?path={objectPath}",
          upload: "/platform/storage",
          uploadBuffer: "/platform/storage/upload-buffer",
          migrate: "/platform/storage/migrate",
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
