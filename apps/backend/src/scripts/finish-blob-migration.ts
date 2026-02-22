import { put } from "@vercel/blob";
import { Client } from "pg";
import { Storage } from "@google-cloud/storage";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";

const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token",
    type: "external_account",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  } as any,
  projectId: "",
});

function getContentType(p: string): string {
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function extractPath(url: string): string | null {
  const m = url.match(/path=(.+)$/);
  if (m) return decodeURIComponent(m[1]);
  return null;
}

async function download(objectPath: string): Promise<Buffer | null> {
  try {
    const file = gcsClient.bucket(BUCKET_ID).file(objectPath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  } catch { return null; }
}

const cache = new Map<string, string>();

async function upload(blobPath: string, buffer: Buffer, ct: string): Promise<string> {
  if (cache.has(blobPath)) return cache.get(blobPath)!;
  const blob = await put(blobPath, buffer, {
    access: "private", addRandomSuffix: false, allowOverwrite: true, token: BLOB_TOKEN, contentType: ct,
  });
  cache.set(blobPath, blob.url);
  return blob.url;
}

async function main() {
  const pgClient = new Client({ connectionString: "postgresql://postgres:password@helium/heliumdb" });
  await pgClient.connect();

  console.log("=== Finishing Blob Migration ===\n");

  const { rows: thumbs } = await pgClient.query(
    "SELECT id, title, thumbnail FROM product WHERE deleted_at IS NULL AND thumbnail LIKE '%/platform/%'"
  );
  console.log(`Remaining thumbnails: ${thumbs.length}`);

  let tOk = 0, tFail = 0;
  for (const p of thumbs) {
    const objPath = extractPath(p.thumbnail);
    if (!objPath) { tFail++; continue; }

    if (cache.has(objPath)) {
      await pgClient.query("UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2", [cache.get(objPath)!, p.id]);
      tOk++;
      continue;
    }

    const buf = await download(objPath);
    if (!buf) {
      const mainPath = objPath.replace(/-thumb\.jpg$/, ".jpg");
      const mainBuf = await download(mainPath);
      if (mainBuf) {
        try {
          const url = await upload(objPath, mainBuf, getContentType(objPath));
          await pgClient.query("UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2", [url, p.id]);
          console.log(`  ${p.title}: used main image -> ${url.substring(0, 60)}...`);
          tOk++;
        } catch (e: any) {
          console.log(`  ${p.title}: upload error ${e.message?.substring(0, 60)}`);
          tFail++;
        }
      } else {
        console.log(`  ${p.title}: NOT FOUND ${objPath}`);
        tFail++;
      }
      continue;
    }

    try {
      const url = await upload(objPath, buf, getContentType(objPath));
      await pgClient.query("UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2", [url, p.id]);
      tOk++;
    } catch (e: any) {
      console.log(`  ${p.title}: upload error ${e.message?.substring(0, 60)}`);
      tFail++;
    }
  }
  console.log(`\nThumbnails: ${tOk} ok, ${tFail} failed`);

  const { rows: missedImgs } = await pgClient.query(
    "SELECT id, url, product_id FROM image WHERE deleted_at IS NULL AND url LIKE '%/platform/%'"
  );
  console.log(`\nRemaining images: ${missedImgs.length}`);

  let iOk = 0, iFail = 0;
  for (const img of missedImgs) {
    const objPath = extractPath(img.url);
    if (!objPath) { iFail++; continue; }

    if (cache.has(objPath)) {
      await pgClient.query("UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2", [cache.get(objPath)!, img.id]);
      iOk++;
      continue;
    }

    const buf = await download(objPath);
    if (!buf) {
      const siblingImgs = await pgClient.query(
        "SELECT url FROM image WHERE product_id = $1 AND deleted_at IS NULL AND url LIKE '%blob.vercel%' LIMIT 1",
        [img.product_id]
      );
      if (siblingImgs.rows.length > 0) {
        await pgClient.query("UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2", [siblingImgs.rows[0].url, img.id]);
        console.log(`  ${img.id}: pointed to sibling blob image`);
        iOk++;
      } else {
        iFail++;
      }
      continue;
    }

    try {
      const url = await upload(objPath, buf, getContentType(objPath));
      await pgClient.query("UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2", [url, img.id]);
      iOk++;
    } catch (e: any) { iFail++; }
  }
  console.log(`Images: ${iOk} ok, ${iFail} failed`);

  const { rows: summary } = await pgClient.query(`
    SELECT 
      (SELECT COUNT(*) FROM image WHERE deleted_at IS NULL AND url LIKE '%blob.vercel%') as blob_images,
      (SELECT COUNT(*) FROM image WHERE deleted_at IS NULL AND url LIKE '%/platform/%') as replit_images,
      (SELECT COUNT(*) FROM product WHERE deleted_at IS NULL AND thumbnail LIKE '%blob.vercel%') as blob_thumbs,
      (SELECT COUNT(*) FROM product WHERE deleted_at IS NULL AND thumbnail LIKE '%/platform/%') as replit_thumbs
  `);
  console.log("\n=== Final State ===");
  console.log(JSON.stringify(summary[0], null, 2));

  await pgClient.end();
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
