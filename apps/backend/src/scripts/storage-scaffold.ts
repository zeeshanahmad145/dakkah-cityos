#!/usr/bin/env tsx
import { Client } from "pg";
import { copy } from "@vercel/blob";
import {
  buildTenantPath,
  MEDUSA_PRODUCT_PREFIX,
  getAllPrefixes,
  getAllSystemPolicies,
} from "../lib/storage/prefixRegistry";
import { appConfig } from "../lib/config";

const TENANT_SLUG = appConfig.tenant.defaultId;

async function scaffold() {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix");
  const verbose = args.includes("--verbose");

  console.log("=== CityOS Storage Scaffold ===");
  console.log(`Tenant: ${TENANT_SLUG}`);
  console.log(`Mode: ${fix ? "FIX" : "AUDIT"}`);
  console.log("");

  const prefixes = getAllPrefixes();
  const policies = getAllSystemPolicies();
  console.log(`Prefix registry: ${Object.keys(prefixes).length} entries`);
  console.log(`System policies: ${Object.keys(policies).length} entries`);

  const token = appConfig.storage.blobToken;
  if (!token) {
    console.error("ERROR: BLOB_READ_WRITE_TOKEN not configured");
    process.exit(1);
  }
  console.log("Vercel Blob: configured");

  const dbUrl = appConfig.database.url;
  if (!dbUrl) {
    console.error("ERROR: No database URL configured");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log("Database: connected");
  console.log("");

  const { rows } = await client.query(
    "SELECT id, url FROM image WHERE deleted_at IS NULL AND url LIKE '%blob.vercel%'"
  );

  let compliant = 0;
  let nonCompliant = 0;
  let migrated = 0;
  let failed = 0;

  for (const row of rows) {
    const urlObj = new URL(row.url);
    const path = urlObj.pathname.startsWith("/")
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    if (path.startsWith(`tenants/${TENANT_SLUG}/`)) {
      compliant++;
      if (verbose) console.log(`  OK: ${path}`);
      continue;
    }

    nonCompliant++;
    const filename = path.split("/").pop() || "";
    const newPath = buildTenantPath(TENANT_SLUG, MEDUSA_PRODUCT_PREFIX, filename);

    if (verbose || !fix) {
      console.log(`  NON-COMPLIANT: ${path} => ${newPath}`);
    }

    if (fix) {
      try {
        const result = await copy(row.url, newPath, {
          access: "private",
          token,
        });
        await client.query("UPDATE image SET url = $1 WHERE id = $2", [
          result.url,
          row.id,
        ]);
        migrated++;
        console.log(`  FIXED: ${filename}`);
      } catch (err: any) {
        failed++;
        console.error(`  FAIL: ${filename}: ${err.message}`);
      }
    }
  }

  console.log("");
  console.log("=== Results ===");
  console.log(`Total images: ${rows.length}`);
  console.log(`Compliant: ${compliant}`);
  console.log(`Non-compliant: ${nonCompliant}`);
  if (fix) {
    console.log(`Migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);
  }

  const isFullyCompliant = nonCompliant === 0 || (fix && failed === 0);
  console.log("");
  console.log(
    isFullyCompliant
      ? "STATUS: FULLY COMPLIANT"
      : `STATUS: ${nonCompliant} images need migration (run with --fix)`
  );

  await client.end();
  process.exit(isFullyCompliant ? 0 : 1);
}

scaffold().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
