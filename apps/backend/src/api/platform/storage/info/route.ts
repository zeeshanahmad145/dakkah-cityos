import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getAllPrefixes,
  getAllSystemPolicies,
  getAllCollectionMappings,
} from "../../../../lib/storage/prefixRegistry";
import { appConfig } from "../../../../lib/config";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const prefixes = getAllPrefixes();
    const policies = getAllSystemPolicies();
    const mappings = getAllCollectionMappings();

    const activeProvider = appConfig.storage.isBlobConfigured
      ? "vercel-blob"
      : "replit-object-storage";

    const storageProviderOverride = appConfig.storage.provider !== "vercel-blob" ? appConfig.storage.provider : null;

    return res.json({
      success: true,
      data: {
        provider: {
          active: storageProviderOverride || activeProvider,
          override: storageProviderOverride,
          vercelBlobConfigured: appConfig.storage.isBlobConfigured,
          replitObjectStorageAvailable: true,
        },
        prefixCount: Object.keys(prefixes).length,
        systemPolicyCount: Object.keys(policies).length,
        collectionMappingCount: Object.keys(mappings).length,
        defaultTenant: appConfig.tenant.defaultId,
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
