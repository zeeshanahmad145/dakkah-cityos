/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAuctionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  starting_price: z.number(),
  reserve_price: z.number().optional(),
  start_time: z.string(),
  end_time: z.string(),
  seller_id: z.string(),
  category_id: z.string().optional(),
}).strict()

interface CityOSContext {
  tenantId?: string
  storeId?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const auctionModule = req.scope.resolve("auction") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const filters: any = {}
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId
    }

    const { status, seller_id, category_id } = req.query as Record<string, string | undefined>
    if (status) filters.status = status
    if (seller_id) filters.seller_id = seller_id
    if (category_id) filters.category_id = category_id

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const auctions = await auctionModule.listAuctionListings(filters, { skip: offset, take: limit })

    res.json({
      auctions,
      count: Array.isArray(auctions) ? auctions.length : 0,
      limit,
      offset,
    })
  } catch (error) {
    handleApiError(res, error, "GET admin auctions")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createAuctionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const auctionModule = req.scope.resolve("auction") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const auction = await auctionModule.createAuctionListings({
      ...parsed.data,
      starts_at: parsed.data.start_time,
      ends_at: parsed.data.end_time,
      tenant_id: cityosContext?.tenantId || "default",
    })

    res.status(201).json({ auction })
  } catch (error) {
    handleApiError(res, error, "POST admin auctions")
  }
}
