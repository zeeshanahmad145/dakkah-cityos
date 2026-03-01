// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../../lib/api-error-handler"

interface ServiceProvider {
  id: string
  name: string
  avatar?: string
  title?: string
  bio?: string
  rating?: number
  review_count?: number
  specialties?: string[]
  availability?: {
    next_available?: string
    slots_today?: number
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { serviceId } = req.params
    const query = req.scope.resolve("query") as unknown as any

    const { data: providers } = await query.graph({
      entity: "service_provider",
      fields: [
        "id",
        "name",
        "avatar_url",
        "title",
        "bio",
        "average_rating",
        "total_reviews",
        "specializations",
        "status",
        "service_ids",
        "metadata",
      ],
      filters: {
        status: "active",
      },
    })

    const serviceProviders: ServiceProvider[] = (providers || [])
      .filter((p: any) => {
        const serviceIds = p.service_ids || []
        return serviceIds.includes(serviceId)
      })
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url,
        title: p.title,
        bio: p.bio,
        rating: p.average_rating || 0,
        review_count: p.total_reviews || 0,
        specialties: p.specializations || [],
        availability: {
          next_available: p.metadata?.next_available,
          slots_today: p.metadata?.slots_today || 0,
        },
      }))

    res.json({
      providers: serviceProviders,
      count: serviceProviders.length,
    })
  } catch (error: unknown) {
    res.json({
      providers: [],
      count: 0,
    })
  }
}

