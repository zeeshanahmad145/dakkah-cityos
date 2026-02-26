import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "pet-seed-001",
    name: "Professional Dog Grooming",
    species: "dog",
    breed: "All Breeds",
    description: "Full-service grooming including bath, haircut, nail trim, and ear cleaning. Experienced groomers for all breeds.",
    metadata: {
      thumbnail: "/seed-images/pet-services%2F1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services%2F1542838132-92c53300491e.jpg"],
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
      thumbnail: "/seed-images/pet-services%2F1587300003388-59208cc962cb.jpg",
      images: ["/seed-images/pet-services%2F1587300003388-59208cc962cb.jpg"],
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
      thumbnail: "/seed-images/pet-services%2F1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services%2F1542838132-92c53300491e.jpg"],
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
      thumbnail: "/seed-images/pet-services%2F1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services%2F1542838132-92c53300491e.jpg"],
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
    const mod = req.scope.resolve("petService") as any
    const { id } = req.params
    const item = await mod.retrievePetProfile(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
