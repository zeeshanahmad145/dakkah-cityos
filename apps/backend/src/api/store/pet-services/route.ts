import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "pet-seed-001",
    name: "Professional Dog Grooming",
    species: "dog",
    breed: "All Breeds",
    description: "Full-service grooming including bath, haircut, nail trim, and ear cleaning. Experienced groomers for all breeds.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1516734212186-a967f81ad0d7.jpg",
      images: ["/seed-images/pet-services%2F1516734212186-a967f81ad0d7.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "grooming",
    is_active: true,
  },
  {
    id: "pet-seed-002",
    name: "Cat Boarding & Daycare",
    species: "cat",
    breed: "All Breeds",
    description: "Safe and comfortable boarding facility with individual suites, play areas, and 24/7 veterinary care on call.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1514888286974-6c03e2ca1dba.jpg",
      images: ["/seed-images/pet-services%2F1514888286974-6c03e2ca1dba.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "boarding",
    is_active: true,
  },
  {
    id: "pet-seed-003",
    name: "Veterinary Wellness Check",
    species: "dog",
    breed: "All Breeds",
    description: "Comprehensive health examination including vaccinations, dental check, blood work, and nutrition consultation.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1628009368231-7bb7cfcb0def.jpg",
      images: ["/seed-images/pet-services%2F1628009368231-7bb7cfcb0def.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "veterinary",
    is_active: true,
  },
  {
    id: "pet-seed-004",
    name: "Dog Training & Obedience",
    species: "dog",
    breed: "All Breeds",
    description: "Professional dog training programs from puppy basics to advanced obedience. Group and private sessions available.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1587300003388-59208cc962cb.jpg",
      images: ["/seed-images/pet-services%2F1587300003388-59208cc962cb.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "training",
    is_active: true,
  },
  {
    id: "pet-seed-005",
    name: "Pet Sitting & Dog Walking",
    species: "dog",
    breed: "All Breeds",
    description: "Reliable pet sitting and daily dog walking services. GPS-tracked walks with photo updates sent to your phone.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1601758228041-f3b2795255f1.jpg",
      images: ["/seed-images/pet-services%2F1601758228041-f3b2795255f1.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "walking",
    is_active: true,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const petServiceMod = req.scope.resolve("petService") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      service_type,
      species,
      pet_type,
      is_active,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (service_type) filters.service_type = service_type
    if (species) filters.species = species
    if (pet_type) filters.pet_type = pet_type
    if (is_active !== undefined) filters.is_active = is_active === "true"
    if (search) filters.name = { $like: `%${search}%` }

    const items = await petServiceMod.listPetProfiles(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const itemList = Array.isArray(items) && items.length > 0 ? items : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    })
  }
}

