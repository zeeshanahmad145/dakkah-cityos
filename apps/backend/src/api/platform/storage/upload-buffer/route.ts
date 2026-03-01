// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { storageService } from "../../../../lib/storage"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { path, contentType, data } = req.body as {
      path: string
      contentType: string
      data: string
    }

    if (!path || !data) {
      return res.status(400).json({ success: false, error: "Missing required fields: path, data" })
    }

    const buffer = Buffer.from(data, "base64")
    await storageService.uploadBuffer(buffer, path, contentType || "image/jpeg")

    return res.json({
      success: true,
      data: {
        path,
        serveUrl: `/platform/storage/serve/${path}`,
        size: buffer.length,
      },
    })
  } catch (error: unknown) {
    return res.status(500).json({ success: false, error: (error instanceof Error ? error.message : String(error)) })
  }
}
