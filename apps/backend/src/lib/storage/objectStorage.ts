import { Storage, File } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { appConfig } from "../config";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
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
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return { bucketName, objectName };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

interface CachedMedia {
  buffer: Buffer;
  contentType: string;
  size: number;
}

const MEDIA_CACHE_MAX_ENTRIES = 300;
const MEDIA_CACHE_MAX_BYTES = 50 * 1024 * 1024;
const mediaCache = new Map<string, CachedMedia>();
let mediaCacheTotalBytes = 0;

function evictOldestCacheEntry() {
  const firstKey = mediaCache.keys().next().value;
  if (firstKey) {
    const entry = mediaCache.get(firstKey);
    if (entry) mediaCacheTotalBytes -= entry.size;
    mediaCache.delete(firstKey);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = appConfig.storage.publicObjectSearchPaths || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set.");
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = appConfig.storage.privateObjectDir || "";
    if (!dir) {
      throw new Error("PRIVATE_OBJECT_DIR not set.");
    }
    return dir;
  }

  getBucketName(): string {
    const bucketId = appConfig.storage.replitBucketId || "";
    if (!bucketId) {
      throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set.");
    }
    return bucketId;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async uploadBuffer(buffer: Buffer, objectPath: string, contentType: string): Promise<void> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectPath);
    await file.save(buffer, { contentType, resumable: false });
  }

  async getFile(objectPath: string): Promise<File> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return file;
  }

  async streamFile(file: File, res: any, cacheTtlSec: number = 31536000) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = !aclPolicy || aclPolicy.visibility === "public";

      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}, immutable`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err: any) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async serveMediaCached(objectPath: string, res: any, cacheTtlSec: number = 31536000) {
    if (!objectPath.startsWith("media/")) {
      const file = await this.getFile(objectPath);
      return this.streamFile(file, res, cacheTtlSec);
    }

    const cached = mediaCache.get(objectPath);
    if (cached) {
      mediaCache.delete(objectPath);
      mediaCache.set(objectPath, cached);
      res.set({
        "Content-Type": cached.contentType,
        "Content-Length": cached.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}, immutable`,
        "X-Cache": "HIT",
      });
      res.end(cached.buffer);
      return;
    }

    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectPath);

    try {
      const [contents] = await file.download();
      const contentType = objectPath.endsWith(".jpg") || objectPath.endsWith(".jpeg")
        ? "image/jpeg"
        : objectPath.endsWith(".png") ? "image/png"
        : objectPath.endsWith(".webp") ? "image/webp"
        : "application/octet-stream";
      const size = contents.length;

      if (size <= MEDIA_CACHE_MAX_BYTES) {
        const existing = mediaCache.get(objectPath);
        if (existing) {
          mediaCacheTotalBytes -= existing.size;
          mediaCache.delete(objectPath);
        }

        while (
          mediaCache.size >= MEDIA_CACHE_MAX_ENTRIES ||
          mediaCacheTotalBytes + size > MEDIA_CACHE_MAX_BYTES
        ) {
          if (mediaCache.size === 0) break;
          evictOldestCacheEntry();
        }

        mediaCache.set(objectPath, { buffer: contents, contentType, size });
        mediaCacheTotalBytes += size;
      }

      res.set({
        "Content-Type": contentType,
        "Content-Length": size,
        "Cache-Control": `public, max-age=${cacheTtlSec}, immutable`,
        "X-Cache": "MISS",
      });
      res.end(contents);
    } catch (error: any) {
      if (error.code === 404) {
        throw new ObjectNotFoundError();
      }
      throw error;
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const objectName = normalizedPath.startsWith("/objects/")
      ? normalizedPath.slice("/objects/".length)
      : normalizedPath.slice(1);
    const objectFile = bucket.file(objectName);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

export const storageService = new ObjectStorageService();
