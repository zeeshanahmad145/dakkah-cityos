import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { buildTenantPath, MEDUSA_PRODUCT_PREFIX } from "../../../../lib/storage/prefixRegistry";
import { put, list, copy } from "@vercel/blob";
import { appConfig } from "../../../../lib/config";

export const AUTHENTICATE = false;

interface MigrationResult {
  totalRecords: number;
  alreadyCompliant: number;
  migrated: number;
  failed: number;
  details: Array<{
    oldPath: string;
    newPath: string;
    status: "migrated" | "skipped" | "failed";
    reason?: string;
  }>;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "X-Api-Key header required for migration",
      });
    }

    const { dryRun = true, provider = "vercel-blob" } = req.body as {
      dryRun?: boolean;
      provider?: string;
    };

    const token = appConfig.storage.blobToken;
    if (!token) {
      return res.status(500).json({
        success: false,
        error: "BLOB_READ_WRITE_TOKEN not configured",
      });
    }

    const tenantSlug = appConfig.tenant.defaultId;
    const dbUrl = appConfig.database.url;
    if (!dbUrl) {
      return res.status(500).json({
        success: false,
        error: "No database URL configured",
      });
    }

    const { Client } = require("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
      const imageResult = await client.query(
        "SELECT id, url, metadata FROM image WHERE deleted_at IS NULL AND url LIKE '%blob.vercel%'"
      );

      const result: MigrationResult = {
        totalRecords: imageResult.rows.length,
        alreadyCompliant: 0,
        migrated: 0,
        failed: 0,
        details: [],
      };

      for (const row of imageResult.rows) {
        const url = row.url as string;
        const urlObj = new URL(url);
        const currentPath = urlObj.pathname.startsWith("/")
          ? urlObj.pathname.slice(1)
          : urlObj.pathname;

        if (currentPath.startsWith(`tenants/${tenantSlug}/`)) {
          result.alreadyCompliant++;
          result.details.push({
            oldPath: currentPath,
            newPath: currentPath,
            status: "skipped",
            reason: "Already compliant",
          });
          continue;
        }

        const filename = currentPath.split("/").pop() || "";
        const newPath = buildTenantPath(tenantSlug, MEDUSA_PRODUCT_PREFIX, filename);

        if (dryRun) {
          result.migrated++;
          result.details.push({
            oldPath: currentPath,
            newPath,
            status: "migrated",
            reason: "Dry run - would migrate",
          });
          continue;
        }

        try {
          const copyResult = await copy(url, newPath, {
            access: "private",
            token,
          });

          await client.query("UPDATE image SET url = $1 WHERE id = $2", [
            copyResult.url,
            row.id,
          ]);

          result.migrated++;
          result.details.push({
            oldPath: currentPath,
            newPath,
            status: "migrated",
          });
        } catch (err: any) {
          result.failed++;
          result.details.push({
            oldPath: currentPath,
            newPath,
            status: "failed",
            reason: err.message,
          });
        }
      }

      return res.json({
        success: true,
        data: {
          dryRun,
          provider,
          tenantSlug,
          result,
        },
      });
    } finally {
      await client.end();
    }
  } catch (error: any) {
    console.error("Migration error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
