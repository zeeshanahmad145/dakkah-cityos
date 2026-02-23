import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { get } from "@vercel/blob"
import { Readable } from "stream"
import { appConfig } from "../../../lib/config"
import { handleApiError } from "../../../lib/api-error-handler"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blobPath = req.query.path as string
  if (!blobPath) {
    return res.status(400).json({ error: "Query parameter 'path' is required" })
  }

  const token = appConfig.storage.blobToken
  if (!token) {
    return res.status(500).json({ error: "Storage not configured" })
  }

  try {
    const result = await get(blobPath, { token, access: "private" as any })

    if (!result || result.statusCode !== 200) {
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
      return res.status(404).json({ error: "File not found" })
    }
    return handleApiError(res, error, "Media serve")
  }
}
