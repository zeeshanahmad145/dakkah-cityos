import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_VEHICLES = [
  {
    id: "vehicle-seed-1",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    price: 2899900,
    currency: "USD",
    mileage: 15200,
    fuel_type: "hybrid",
    transmission: "automatic",
    condition: "certified-pre-owned",
    description: "Well-maintained Toyota Camry Hybrid with excellent fuel economy, advanced safety features, and a comfortable interior. Perfect for daily commuting and family use.",
    features: ["Adaptive Cruise Control", "Lane Departure Warning", "Apple CarPlay", "Android Auto", "Heated Seats", "Backup Camera"],
    thumbnail: "/seed-images/automotive/1556189250-72ba954cfc2b.jpg",
    reviews: [
      { author: "Michael Torres", rating: 5, comment: "Best hybrid sedan on the market. Fuel economy is outstanding and the ride is smooth.", created_at: "2025-04-15T00:00:00Z" },
      { author: "Sarah Mitchell", rating: 4, comment: "Reliable and comfortable. The Camry Hybrid is perfect for my daily commute.", created_at: "2025-04-10T00:00:00Z" },
      { author: "David Chen", rating: 5, comment: "Toyota quality at its finest. CPO certification gives extra peace of mind.", created_at: "2025-04-05T00:00:00Z" },
      { author: "Jennifer Lee", rating: 4, comment: "Great value for a hybrid vehicle. Safety features are comprehensive and intuitive.", created_at: "2025-03-28T00:00:00Z" },
      { author: "Robert Wilson", rating: 5, comment: "Exceeded all expectations. Low mileage CPO with every feature I wanted.", created_at: "2025-03-20T00:00:00Z" },
    ],
  },
  {
    id: "vehicle-seed-2",
    make: "Tesla",
    model: "Model 3",
    year: 2025,
    price: 4299900,
    currency: "USD",
    mileage: 0,
    fuel_type: "electric",
    transmission: "automatic",
    condition: "new",
    description: "Brand new Tesla Model 3 with Long Range battery, Autopilot, and premium interior. Zero emissions driving with cutting-edge technology and over-the-air updates.",
    features: ["Autopilot", "Long Range Battery", "Premium Interior", "Glass Roof", "15-inch Touchscreen", "Sentry Mode"],
    thumbnail: "/seed-images/automotive/1621993202323-f438eec934ff.jpg",
    reviews: [
      { author: "Alex Rivera", rating: 5, comment: "The future of driving is here. Autopilot and over-the-air updates keep getting better.", created_at: "2025-04-12T00:00:00Z" },
      { author: "Emma Watson", rating: 5, comment: "Incredible acceleration and zero emissions. The 15-inch touchscreen is amazing.", created_at: "2025-04-08T00:00:00Z" },
      { author: "Chris Park", rating: 4, comment: "Long range battery easily handles my 60-mile daily commute. Charging at home is convenient.", created_at: "2025-04-01T00:00:00Z" },
      { author: "Lisa Anderson", rating: 5, comment: "Glass roof makes the cabin feel spacious. Sentry Mode gives security peace of mind.", created_at: "2025-03-25T00:00:00Z" },
      { author: "James Kim", rating: 4, comment: "Premium interior is well-appointed. The minimalist design takes some getting used to but I love it.", created_at: "2025-03-18T00:00:00Z" },
    ],
  },
  {
    id: "vehicle-seed-3",
    make: "Honda",
    model: "CR-V",
    year: 2024,
    price: 3499900,
    currency: "USD",
    mileage: 8500,
    fuel_type: "gasoline",
    transmission: "automatic",
    condition: "certified-pre-owned",
    description: "Honda CR-V with low mileage and full service history. Spacious interior, Honda Sensing safety suite, and excellent reliability ratings make this the ideal family SUV.",
    features: ["Honda Sensing", "AWD", "Heated Seats", "Power Liftgate", "Wireless Charging", "Blind Spot Monitor"],
    thumbnail: "/seed-images/automotive/1568605117036-5fe5e7bab0b7.jpg",
    reviews: [
      { author: "Patricia Garcia", rating: 5, comment: "Honda CR-V is the gold standard for compact SUVs. Spacious and fuel efficient.", created_at: "2025-04-14T00:00:00Z" },
      { author: "Brian Thompson", rating: 4, comment: "AWD handles great in all weather conditions. Power liftgate is super convenient.", created_at: "2025-04-09T00:00:00Z" },
      { author: "Nancy Liu", rating: 5, comment: "Only 8,500 miles and drives like new. Honda Sensing keeps the whole family safe.", created_at: "2025-04-03T00:00:00Z" },
      { author: "Kevin Brown", rating: 5, comment: "Best value in the compact SUV segment. Wireless charging is a nice bonus feature.", created_at: "2025-03-27T00:00:00Z" },
      { author: "Amanda Foster", rating: 4, comment: "Reliable and practical. The blind spot monitor has already prevented several close calls.", created_at: "2025-03-19T00:00:00Z" },
    ],
  },
  {
    id: "vehicle-seed-4",
    make: "BMW",
    model: "X5",
    year: 2025,
    price: 6599900,
    currency: "USD",
    mileage: 0,
    fuel_type: "hybrid",
    transmission: "automatic",
    condition: "new",
    description: "All-new BMW X5 xDrive45e plug-in hybrid with M Sport package. Combining luxury, performance, and efficiency with electric-only range for daily driving.",
    features: ["M Sport Package", "Panoramic Sunroof", "Harman Kardon Audio", "Head-Up Display", "Parking Assistant Plus", "Gesture Control"],
    thumbnail: "/seed-images/automotive/1632245889029-e406faaa34cd.jpg",
    reviews: [
      { author: "Richard Martinez", rating: 5, comment: "The X5 hybrid is the perfect blend of luxury and efficiency. M Sport styling is aggressive.", created_at: "2025-04-13T00:00:00Z" },
      { author: "Diana Lee", rating: 5, comment: "Panoramic sunroof and Harman Kardon audio create an incredible driving experience.", created_at: "2025-04-07T00:00:00Z" },
      { author: "Thomas Wright", rating: 4, comment: "Head-up display and gesture control add futuristic touches. Build quality is exceptional.", created_at: "2025-04-02T00:00:00Z" },
      { author: "Sophia Chen", rating: 5, comment: "Electric-only range covers my daily commute. The plug-in hybrid system is seamless.", created_at: "2025-03-26T00:00:00Z" },
      { author: "William Davis", rating: 4, comment: "Parking Assistant Plus makes tight spots easy. Premium luxury at its finest.", created_at: "2025-03-17T00:00:00Z" },
    ],
  },
  {
    id: "vehicle-seed-5",
    make: "Ford",
    model: "F-150",
    year: 2024,
    price: 4899900,
    currency: "USD",
    mileage: 22000,
    fuel_type: "gasoline",
    transmission: "automatic",
    condition: "used",
    description: "Ford F-150 XLT with towing package, bed liner, and SYNC 4 infotainment. America's best-selling truck with proven capability and modern technology.",
    features: ["Towing Package", "Bed Liner", "SYNC 4", "Pro Trailer Backup Assist", "360-Degree Camera", "FordPass Connect"],
    thumbnail: "/seed-images/automotive/1618843479313-40f8afb4b4d8.jpg",
    reviews: [
      { author: "Jake Morrison", rating: 5, comment: "The F-150 is the ultimate work truck. Towing package handles my boat trailer effortlessly.", created_at: "2025-04-11T00:00:00Z" },
      { author: "Mike Johnson", rating: 4, comment: "SYNC 4 is a huge upgrade. Pro Trailer Backup Assist is worth its weight in gold.", created_at: "2025-04-06T00:00:00Z" },
      { author: "Steve Williams", rating: 5, comment: "22K miles and runs perfectly. Bed liner protects against daily wear and tear.", created_at: "2025-03-30T00:00:00Z" },
      { author: "Tony Rodriguez", rating: 4, comment: "360-degree camera makes parking this big truck much easier. Great value for used.", created_at: "2025-03-22T00:00:00Z" },
      { author: "Ryan Cooper", rating: 5, comment: "FordPass Connect keeps me connected on job sites. Best truck I've ever owned.", created_at: "2025-03-15T00:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const automotiveService = req.scope.resolve("automotive") as any
    if (automotiveService?.retrieveVehicleListing) {
      const item = await automotiveService.retrieveVehicleListing(id)
      if (item) {
        return res.json({ item })
      }
    }
  } catch (_e) {}

  const seedMatch = SEED_VEHICLES.find((v) => v.id === id) || SEED_VEHICLES[0]
  return res.json({ item: seedMatch })
}
