import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { get } from "@vercel/blob"
import { Readable } from "stream"
import path from "path"
import fs from "fs"
import { appConfig } from "../../../lib/config"
import { handleApiError } from "../../../lib/api-error-handler"

export const AUTHENTICATE = false

const SEED_IMAGES_DIR = path.join(__dirname, "../../../../static/seed-images")

const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  "fashion": "content/1548013146-72479768bada.jpg",
  "electronics": "content/1573164713988-8665fc963095.jpg",
  "home": "content/1519167758481-83f550bb49b3.jpg",
  "food": "grocery/1542838132-92c53300491e.jpg",
  "grocery": "grocery/1414235077428-338989a2e8c0.jpg",
  "beauty": "healthcare/1576091160399-112ba8d25d1d.jpg",
  "sports": "fitness/1518611012118-696072aa579a.jpg",
  "fitness": "fitness/1518611012118-696072aa579a.jpg",
  "automotive": "automotive/1489824904134-891ab64532f1.jpg",
  "education": "education/1552664730-d307ca884978.jpg",
  "real_estate": "real-estate/1502672260266-1c1ef2d93688.jpg",
  "real-estate": "real-estate/1502672260266-1c1ef2d93688.jpg",
  "travel": "travel/1507525428034-b723cf961d3e.jpg",
  "pet": "pet-services/1514888286974-6c03e2ca1dba.jpg",
  "restaurant": "restaurants/1517248135467-4c7edcad34c4.jpg",
  "office": "content/1586724237569-f3d0c1dee8c6.jpg",
  "luxury": "content/1548013146-72479768bada.jpg",
  "outdoor": "events/1540575467063-178a2e1fce56.jpg",
  "default": "content/1586724237569-f3d0c1dee8c6.jpg",
}

function serveSeedFallback(res: MedusaResponse, blobPath: string): boolean {
  if (process.env.NODE_ENV === "production") return false
  const pathSegments = blobPath.split("/")
  const filename = pathSegments.pop() || ""
  const fallbackKey = Object.keys(CATEGORY_FALLBACK_MAP).find(k => filename.toLowerCase().includes(k) || pathSegments.some(s => s.toLowerCase().includes(k))) || "default"
  const fallbackImage = CATEGORY_FALLBACK_MAP[fallbackKey]
  const fallbackPath = path.join(SEED_IMAGES_DIR, fallbackImage)

  if (fs.existsSync(fallbackPath)) {
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("X-Fallback", "seed-image")
    const stream = fs.createReadStream(fallbackPath)
    stream.pipe(res)
    return true
  }
  return false
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blobPath = req.query.path as string
  if (!blobPath) {
    return res.status(400).json({ error: "Query parameter 'path' is required" })
  }

  const token = appConfig.storage.blobToken
  if (!token) {
    if (serveSeedFallback(res, blobPath)) return
    return res.status(500).json({ error: "Storage not configured" })
  }

  try {
    const result = await get(blobPath, { token, access: "private" as any })

    if (!result || result.statusCode !== 200) {
      if (serveSeedFallback(res, blobPath)) return
      return res.status(404).json({ error: "File not found" })
    }

    const contentType = result.blob?.contentType || result.headers?.get("content-type") || "application/octet-stream"
    const contentLength = result.blob?.size || result.headers?.get("content-length")

    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("Access-Control-Allow-Origin", "*")

    if (contentLength) {
      res.setHeader("Content-Length", String(contentLength))
    }

    const webStream = result.stream
    const nodeStream = Readable.fromWeb(webStream as any)
    nodeStream.pipe(res)
  } catch (error: any) {
    if (error?.message?.includes("not found") || error?.message?.includes("404") || error?.name === "BlobNotFoundError") {
      if (serveSeedFallback(res, blobPath)) return
      return res.status(404).json({ error: "File not found" })
    }
    return handleApiError(res, error, "Media serve")
  }
}
