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
      thumbnail: "/seed-images/pet-services/1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services/1542838132-92c53300491e.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "grooming",
    is_active: true,
    thumbnail: "/seed-images/pet-services/1542838132-92c53300491e.jpg",
    packages: [
      { name: "Basic Bath", price: 120, duration: "45 min", description: "Bath, blow-dry, and brush out" },
      { name: "Full Groom", price: 250, duration: "90 min", description: "Bath, haircut, nail trim, ear cleaning, and finishing spray" },
      { name: "Puppy Package", price: 150, duration: "60 min", description: "Gentle bath, light trim, nail clip, and socialization" },
    ],
    reviews: [
      { author: "Layla K.", rating: 5, comment: "My golden retriever looks amazing after every visit. The groomers are so gentle!", created_at: "2025-01-05T10:00:00Z" },
      { author: "Ahmed S.", rating: 4, comment: "Great grooming service. My poodle always comes back looking like a show dog.", created_at: "2025-01-15T13:00:00Z" },
      { author: "Fatima R.", rating: 5, comment: "The puppy package was perfect for our new rescue. Very patient staff.", created_at: "2025-01-25T11:00:00Z" },
      { author: "Khalid M.", rating: 4, comment: "Consistent quality every time. Nail trim is always done carefully.", created_at: "2025-02-05T09:00:00Z" },
      { author: "Sara W.", rating: 5, comment: "Best grooming service in the area. My dog actually enjoys going there!", created_at: "2025-02-15T14:00:00Z" },
    ],
  },
  {
    id: "pet-seed-002",
    name: "Cat Boarding & Daycare",
    species: "cat",
    breed: "All Breeds",
    description: "Safe and comfortable boarding facility with individual suites, play areas, and 24/7 veterinary care on call.",
    metadata: {
      thumbnail: "/seed-images/pet-services/1587300003388-59208cc962cb.jpg",
      images: ["/seed-images/pet-services/1587300003388-59208cc962cb.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "boarding",
    is_active: true,
    thumbnail: "/seed-images/pet-services/1587300003388-59208cc962cb.jpg",
    packages: [
      { name: "Day Care", price: 80, duration: "Full day", description: "Supervised play, meals, and rest in individual suite" },
      { name: "Overnight Stay", price: 150, duration: "24 hours", description: "Private suite with bedding, meals, and evening playtime" },
      { name: "Extended Stay (7 days)", price: 900, duration: "7 days", description: "Weekly boarding with daily enrichment and photo updates" },
    ],
    reviews: [
      { author: "Nadia T.", rating: 5, comment: "My cat came home relaxed and happy. The individual suites are spacious and clean.", created_at: "2025-01-08T10:00:00Z" },
      { author: "Omar F.", rating: 4, comment: "Photo updates during extended stays give great peace of mind.", created_at: "2025-01-18T14:00:00Z" },
      { author: "Reem B.", rating: 5, comment: "Vet on call 24/7 is exactly what I need for my senior cat. Excellent care.", created_at: "2025-01-28T09:00:00Z" },
      { author: "Yousef D.", rating: 4, comment: "Day care is perfect for when I have long work days. Cat loves the play area.", created_at: "2025-02-07T11:00:00Z" },
      { author: "Huda G.", rating: 5, comment: "Best boarding facility we've used. Staff genuinely cares about the animals.", created_at: "2025-02-17T15:00:00Z" },
    ],
  },
  {
    id: "pet-seed-003",
    name: "Veterinary Wellness Check",
    species: "dog",
    breed: "All Breeds",
    description: "Comprehensive health examination including vaccinations, dental check, blood work, and nutrition consultation.",
    metadata: {
      thumbnail: "/seed-images/pet-services/1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services/1542838132-92c53300491e.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "veterinary",
    is_active: true,
    thumbnail: "/seed-images/pet-services/1514888286974-6c03e2ca1dba.jpg",
    packages: [
      { name: "Basic Checkup", price: 200, duration: "30 min", description: "Physical exam, weight check, and vaccination review" },
      { name: "Comprehensive Wellness", price: 450, duration: "60 min", description: "Full exam, blood work, dental check, and nutrition consultation" },
      { name: "Senior Pet Wellness", price: 600, duration: "90 min", description: "Extended exam with X-rays, blood panel, joint assessment, and diet plan" },
    ],
    reviews: [
      { author: "Badr H.", rating: 5, comment: "Thorough examination and the vet explained everything clearly. Very professional.", created_at: "2025-01-06T09:00:00Z" },
      { author: "Mona S.", rating: 4, comment: "The comprehensive wellness package is excellent value. Covers everything.", created_at: "2025-01-16T11:00:00Z" },
      { author: "Waleed K.", rating: 5, comment: "Senior pet wellness check caught an early issue with my dog's joints. Grateful!", created_at: "2025-01-26T14:00:00Z" },
      { author: "Salwa A.", rating: 4, comment: "Nutrition consultation was really helpful. Changed my dog's diet for the better.", created_at: "2025-02-06T10:00:00Z" },
      { author: "Tariq L.", rating: 5, comment: "Best vet checkup experience. Staff is knowledgeable and compassionate.", created_at: "2025-02-16T13:00:00Z" },
    ],
  },
  {
    id: "pet-seed-004",
    name: "Dog Training & Obedience",
    species: "dog",
    breed: "All Breeds",
    description: "Professional dog training programs from puppy basics to advanced obedience. Group and private sessions available.",
    metadata: {
      thumbnail: "/seed-images/pet-services/1587300003388-59208cc962cb.jpg",
      images: ["/seed-images/pet-services/1587300003388-59208cc962cb.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "training",
    is_active: true,
    thumbnail: "/seed-images/pet-services/1516734212186-a967f81ad0d7.jpg",
    packages: [
      { name: "Puppy Basics", price: 300, duration: "4 weeks", description: "Sit, stay, come, and leash walking fundamentals" },
      { name: "Obedience Program", price: 600, duration: "8 weeks", description: "Advanced commands, off-leash training, and behavioral correction" },
      { name: "Private Sessions", price: 150, duration: "60 min", description: "One-on-one training tailored to your dog's specific needs" },
    ],
    reviews: [
      { author: "Mansour Q.", rating: 5, comment: "Our husky went from uncontrollable to perfectly obedient. Amazing trainers!", created_at: "2025-01-07T10:00:00Z" },
      { author: "Dina V.", rating: 4, comment: "Puppy basics class was excellent. Our golden learned so quickly.", created_at: "2025-01-17T12:00:00Z" },
      { author: "Faisal N.", rating: 5, comment: "Private sessions addressed our dog's specific behavioral issues perfectly.", created_at: "2025-01-27T15:00:00Z" },
      { author: "Ghada E.", rating: 4, comment: "Great group classes. My dog also made friends which helped with socialization.", created_at: "2025-02-08T09:00:00Z" },
      { author: "Jaber C.", rating: 5, comment: "Best investment in our dog's wellbeing. The training methods are positive and effective.", created_at: "2025-02-18T14:00:00Z" },
    ],
  },
  {
    id: "pet-seed-005",
    name: "Pet Sitting & Dog Walking",
    species: "dog",
    breed: "All Breeds",
    description: "Reliable pet sitting and daily dog walking services. GPS-tracked walks with photo updates sent to your phone.",
    metadata: {
      thumbnail: "/seed-images/pet-services/1542838132-92c53300491e.jpg",
      images: ["/seed-images/pet-services/1542838132-92c53300491e.jpg"],
    },
    weight: null,
    gender: null,
    age: null,
    color: null,
    service_type: "walking",
    is_active: true,
    thumbnail: "/seed-images/pet-services/1601758228041-f3b2795255f1.jpg",
    packages: [
      { name: "Single Walk", price: 50, duration: "30 min", description: "GPS-tracked walk with photo updates" },
      { name: "Daily Walk Plan", price: 800, duration: "Monthly", description: "One 30-minute walk per day, Monday through Friday" },
      { name: "Premium Plan", price: 1400, duration: "Monthly", description: "Two walks per day with weekend coverage and pet sitting" },
    ],
    reviews: [
      { author: "Amira P.", rating: 5, comment: "GPS tracking gives me total peace of mind. Love the photo updates during walks!", created_at: "2025-01-09T08:00:00Z" },
      { author: "Sami J.", rating: 4, comment: "Daily walk plan is a lifesaver for my busy schedule. Dog is always tired and happy.", created_at: "2025-01-19T11:00:00Z" },
      { author: "Lamia O.", rating: 5, comment: "Premium plan covers everything. Weekend pet sitting is especially convenient.", created_at: "2025-01-29T10:00:00Z" },
      { author: "Ziad R.", rating: 4, comment: "Reliable and punctual walkers. My dog gets excited when they arrive.", created_at: "2025-02-09T14:00:00Z" },
      { author: "Noura H.", rating: 5, comment: "Best pet walking service. The walkers genuinely love animals and it shows.", created_at: "2025-02-19T09:00:00Z" },
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
