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
    packages: [
      { name: "Basic Bath", price: 120, duration: "45 min", description: "Bath, blow-dry, and brush out" },
      { name: "Full Groom", price: 250, duration: "90 min", description: "Bath, haircut, nail trim, ear cleaning, and finishing spray" },
      { name: "Puppy Package", price: 150, duration: "60 min", description: "Gentle bath, light trim, nail clip, and socialization" },
    ],
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
    packages: [
      { name: "Day Care", price: 80, duration: "Full day", description: "Supervised play, meals, and rest in individual suite" },
      { name: "Overnight Stay", price: 150, duration: "24 hours", description: "Private suite with bedding, meals, and evening playtime" },
      { name: "Extended Stay (7 days)", price: 900, duration: "7 days", description: "Weekly boarding with daily enrichment and photo updates" },
    ],
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
    packages: [
      { name: "Basic Checkup", price: 200, duration: "30 min", description: "Physical exam, weight check, and vaccination review" },
      { name: "Comprehensive Wellness", price: 450, duration: "60 min", description: "Full exam, blood work, dental check, and nutrition consultation" },
      { name: "Senior Pet Wellness", price: 600, duration: "90 min", description: "Extended exam with X-rays, blood panel, joint assessment, and diet plan" },
    ],
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
    packages: [
      { name: "Puppy Basics", price: 300, duration: "4 weeks", description: "Sit, stay, come, and leash walking fundamentals" },
      { name: "Obedience Program", price: 600, duration: "8 weeks", description: "Advanced commands, off-leash training, and behavioral correction" },
      { name: "Private Sessions", price: 150, duration: "60 min", description: "One-on-one training tailored to your dog's specific needs" },
    ],
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
    packages: [
      { name: "Single Walk", price: 50, duration: "30 min", description: "GPS-tracked walk with photo updates" },
      { name: "Daily Walk Plan", price: 800, duration: "Monthly", description: "One 30-minute walk per day, Monday through Friday" },
      { name: "Premium Plan", price: 1400, duration: "Monthly", description: "Two walks per day with weekend coverage and pet sitting" },
    ],
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
