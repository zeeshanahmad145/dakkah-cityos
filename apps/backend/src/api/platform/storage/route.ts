// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { storageService } from "../../../lib/storage"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    let bucketName = ""
    let publicPaths: string[] = []
    let privateDir = ""

    try {
      bucketName = storageService.getBucketName()
    } catch (e) {}
    try {
      publicPaths = storageService.getPublicObjectSearchPaths()
    } catch (e) {}
    try {
      privateDir = storageService.getPrivateObjectDir()
    } catch (e) {}

    return res.json({
      success: true,
      data: {
        configured: !!bucketName,
        bucketName,
        publicPaths,
        privateDir: privateDir ? "[configured]" : "",
        serveEndpoint: "/platform/storage/serve",
      },
    })
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: (error instanceof Error ? error.message : String(error)) })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const apiKey = req.headers["x-api-key"]
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "X-API-Key header required" })
    }

    const uploadURL = await storageService.getObjectEntityUploadURL()
    const objectPath = storageService.normalizeObjectEntityPath(uploadURL)

    return res.json({
      success: true,
      data: {
        uploadURL,
        objectPath,
      },
    })
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: (error instanceof Error ? error.message : String(error)) })
  }
}
