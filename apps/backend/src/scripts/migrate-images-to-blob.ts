import { put } from "@vercel/blob";
import { Client } from "pg";
import { Storage } from "@google-cloud/storage";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";

const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  } as any,
  projectId: "",
});

function getContentType(path: string): string {
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function extractObjectPath(url: string): string | null {
  if (url.includes("/platform/storage/serve")) {
    const match = url.match(/path=(.+)$/);
    if (match) return decodeURIComponent(match[1]);
    const pathMatch = url.match(/\/platform\/storage\/serve\/(.+)$/);
    if (pathMatch) return pathMatch[1];
  }
  return null;
}

async function downloadFromReplit(objectPath: string): Promise<Buffer | null> {
  try {
    const bucket = gcsClient.bucket(BUCKET_ID);
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  } catch (error: any) {
    console.log(`    Download error: ${error.message?.substring(0, 80)}`);
    return null;
  }
}

const uploadCache = new Map<string, string>();

async function uploadToBlob(blobPath: string, buffer: Buffer, contentType: string): Promise<string> {
  if (uploadCache.has(blobPath)) return uploadCache.get(blobPath)!;
  const blob = await put(blobPath, buffer, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: BLOB_TOKEN,
    contentType,
  });
  uploadCache.set(blobPath, blob.url);
  return blob.url;
}

async function migrateDatabase(connStr: string, dbLabel: string) {
  const pgClient = new Client({
    connectionString: connStr,
    ssl: connStr.includes("neon") ? { rejectUnauthorized: false } : undefined,
  });
  await pgClient.connect();

  const { rows: [{ current_database: dbName }] } = await pgClient.query("SELECT current_database()");
  console.log(`\n=== Migrating ${dbLabel} (${dbName}) ===\n`);

  const { rows: images } = await pgClient.query(
    "SELECT id, url, product_id FROM image WHERE deleted_at IS NULL AND url LIKE '%/platform/storage/%'"
  );
  console.log(`Found ${images.length} images on Replit storage`);

  const { rows: products } = await pgClient.query(
    "SELECT id, title, thumbnail FROM product WHERE deleted_at IS NULL AND thumbnail LIKE '%/platform/storage/%'"
  );
  console.log(`Found ${products.length} product thumbnails on Replit storage\n`);

  if (images.length === 0 && products.length === 0) {
    console.log("Nothing to migrate in this database.");
    await pgClient.end();
    return { imgSuccess: 0, imgFail: 0, thumbSuccess: 0, thumbFail: 0 };
  }

  let imgSuccess = 0, imgFail = 0;
  const urlMap = new Map<string, string>();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const objectPath = extractObjectPath(img.url);
    if (!objectPath) { imgFail++; continue; }

    if (urlMap.has(img.url)) {
      await pgClient.query("UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2", [urlMap.get(img.url)!, img.id]);
      imgSuccess++;
      if ((i + 1) % 20 === 0) console.log(`  Images: ${i + 1}/${images.length} processed...`);
      continue;
    }

    const buffer = await downloadFromReplit(objectPath);
    if (!buffer) {
      console.log(`  [${i + 1}] NOT FOUND: ${objectPath}`);
      imgFail++;
      continue;
    }

    try {
      const blobUrl = await uploadToBlob(objectPath, buffer, getContentType(objectPath));
      urlMap.set(img.url, blobUrl);
      await pgClient.query("UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2", [blobUrl, img.id]);
      imgSuccess++;
      if ((i + 1) % 10 === 0) console.log(`  Images: ${i + 1}/${images.length} processed...`);
    } catch (error: any) {
      console.log(`  [${i + 1}] UPLOAD ERROR: ${error.message?.substring(0, 80)}`);
      imgFail++;
    }
  }
  console.log(`  Images done: ${imgSuccess} ok, ${imgFail} failed\n`);

  let thumbSuccess = 0, thumbFail = 0;
  for (const product of products) {
    const objectPath = extractObjectPath(product.thumbnail);
    if (!objectPath) { thumbFail++; continue; }

    if (urlMap.has(product.thumbnail)) {
      await pgClient.query("UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2", [urlMap.get(product.thumbnail)!, product.id]);
      thumbSuccess++;
      continue;
    }

    const buffer = await downloadFromReplit(objectPath);
    if (!buffer) {
      console.log(`  Thumb NOT FOUND: ${product.title} -> ${objectPath}`);
      thumbFail++;
      continue;
    }

    try {
      const blobUrl = await uploadToBlob(objectPath, buffer, getContentType(objectPath));
      urlMap.set(product.thumbnail, blobUrl);
      await pgClient.query("UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2", [blobUrl, product.id]);
      thumbSuccess++;
    } catch (error: any) {
      console.log(`  Thumb ERROR: ${product.title} -> ${error.message?.substring(0, 60)}`);
      thumbFail++;
    }
  }
  console.log(`  Thumbnails done: ${thumbSuccess} ok, ${thumbFail} failed`);
  console.log(`  Unique blobs uploaded: ${urlMap.size}`);

  await pgClient.end();
  return { imgSuccess, imgFail, thumbSuccess, thumbFail };
}

async function main() {
  if (!BLOB_TOKEN) { console.error("BLOB_READ_WRITE_TOKEN not set"); process.exit(1); }
  if (!BUCKET_ID) { console.error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set"); process.exit(1); }

  console.log("=== Vercel Blob Migration - All Databases ===");
  console.log(`Blob token: ${BLOB_TOKEN.substring(0, 20)}...`);
  console.log(`Bucket: ${BUCKET_ID}`);

  const heliumResult = await migrateDatabase(
    process.env.DATABASE_URL || "postgresql://postgres:password@helium/heliumdb",
    "Heliumdb (dev)"
  );

  const neonConnStr = process.env.NEON_DATABASE_URL;
  let neonResult = { imgSuccess: 0, imgFail: 0, thumbSuccess: 0, thumbFail: 0 };
  if (neonConnStr) {
    neonResult = await migrateDatabase(neonConnStr, "Neon (production)");
  }

  console.log("\n=== FINAL SUMMARY ===");
  console.log(`Heliumdb: ${heliumResult.imgSuccess} images, ${heliumResult.thumbSuccess} thumbnails migrated`);
  console.log(`Neon:     ${neonResult.imgSuccess} images, ${neonResult.thumbSuccess} thumbnails migrated`);
  console.log(`Total blobs uploaded: ${uploadCache.size}`);
  console.log("\nMigration complete!");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
