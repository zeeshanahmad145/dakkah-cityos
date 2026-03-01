import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "auto_seed_1",
    tenant_id: "default",
    seller_id: "seller_1",
    listing_type: "sale",
    title: "2024 Toyota Land Cruiser",
    make: "Toyota",
    model_name: "Land Cruiser",
    year: 2024,
    mileage_km: 5200,
    fuel_type: "petrol",
    transmission: "automatic",
    body_type: "suv",
    color: "Pearl White",
    condition: "new",
    price: 28500000,
    currency_code: "SAR",
    description:
      "Brand new Toyota Land Cruiser with premium package, leather interior, and advanced safety features.",
    features: [
      "Adaptive Cruise Control",
      "360 Camera",
      "Premium Audio",
      "Heated Seats",
    ],
    location_city: "Riyadh",
    location_country: "SA",
    status: "active",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price: 28500000,
      currency: "SAR",
      location: "Riyadh, Saudi Arabia",
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    reviews: [
      {
        author: "Khalid Al-Dosari",
        rating: 5,
        comment:
          "The Land Cruiser is a beast on and off road. Premium package is worth every riyal.",
        created_at: "2025-01-15T00:00:00Z",
      },
      {
        author: "Mohammed Bashir",
        rating: 5,
        comment:
          "Perfect SUV for desert driving. Leather interior is luxurious and the safety features are top-notch.",
        created_at: "2025-01-10T00:00:00Z",
      },
      {
        author: "Tariq Al-Zahrani",
        rating: 4,
        comment:
          "Reliable and powerful. The 2024 model has significant improvements over the previous generation.",
        created_at: "2025-01-05T00:00:00Z",
      },
      {
        author: "Faisal Hamdan",
        rating: 5,
        comment:
          "Best purchase I've made. The adaptive cruise control makes long highway drives effortless.",
        created_at: "2024-12-28T00:00:00Z",
      },
      {
        author: "Omar Al-Qahtani",
        rating: 4,
        comment:
          "Excellent value for the features offered. The 360 camera system is incredibly useful.",
        created_at: "2024-12-20T00:00:00Z",
      },
    ],
  },
  {
    id: "auto_seed_2",
    tenant_id: "default",
    seller_id: "seller_2",
    listing_type: "sale",
    title: "2023 BMW X5 xDrive40i",
    make: "BMW",
    model_name: "X5",
    year: 2023,
    mileage_km: 18500,
    fuel_type: "petrol",
    transmission: "automatic",
    body_type: "suv",
    color: "Mineral White",
    condition: "certified_pre_owned",
    price: 22000000,
    currency_code: "SAR",
    description:
      "Certified pre-owned BMW X5 with M Sport package, panoramic sunroof, and Harman Kardon sound system.",
    features: [
      "M Sport Package",
      "Panoramic Sunroof",
      "Harman Kardon",
      "Head-Up Display",
    ],
    location_city: "Jeddah",
    location_country: "SA",
    status: "active",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price: 22000000,
      currency: "SAR",
      location: "Jeddah, Saudi Arabia",
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    reviews: [
      {
        author: "Sarah Al-Mutairi",
        rating: 5,
        comment:
          "Certified pre-owned BMW X5 in immaculate condition. The M Sport package transforms the driving experience.",
        created_at: "2025-01-12T00:00:00Z",
      },
      {
        author: "Abdullah Al-Shehri",
        rating: 4,
        comment:
          "Panoramic sunroof and Harman Kardon sound system make every drive enjoyable. Great value for CPO.",
        created_at: "2025-01-08T00:00:00Z",
      },
      {
        author: "Nadia Hassan",
        rating: 5,
        comment:
          "Head-up display is a game changer. The car looks and drives like new despite 18K km.",
        created_at: "2025-01-02T00:00:00Z",
      },
      {
        author: "Rashid Al-Otaibi",
        rating: 4,
        comment:
          "Smooth ride quality and excellent performance. BMW's CPO warranty gives peace of mind.",
        created_at: "2024-12-25T00:00:00Z",
      },
      {
        author: "Layla Ibrahim",
        rating: 5,
        comment:
          "Perfect family SUV with premium features. The dealer in Jeddah was very professional.",
        created_at: "2024-12-18T00:00:00Z",
      },
    ],
  },
  {
    id: "auto_seed_3",
    tenant_id: "default",
    seller_id: "seller_3",
    listing_type: "sale",
    title: "2024 Mercedes-Benz GLE 450",
    make: "Mercedes-Benz",
    model_name: "GLE 450",
    year: 2024,
    mileage_km: 2100,
    fuel_type: "hybrid",
    transmission: "automatic",
    body_type: "suv",
    color: "Obsidian Black",
    condition: "new",
    price: 32000000,
    currency_code: "SAR",
    description:
      "New Mercedes-Benz GLE 450 4MATIC with AMG Line, MBUX infotainment, and EQ Boost mild hybrid system.",
    features: ["AMG Line", "MBUX", "Burmester Audio", "Air Suspension"],
    location_city: "Dammam",
    location_country: "SA",
    status: "active",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price: 32000000,
      currency: "SAR",
      location: "Dammam, Saudi Arabia",
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    reviews: [
      {
        author: "Yousef Al-Ghamdi",
        rating: 5,
        comment:
          "The GLE 450 is the perfect blend of luxury and performance. MBUX system is intuitive and responsive.",
        created_at: "2025-01-14T00:00:00Z",
      },
      {
        author: "Hala Al-Rasheed",
        rating: 5,
        comment:
          "Air suspension makes every road feel smooth. Burmester audio is concert-quality.",
        created_at: "2025-01-09T00:00:00Z",
      },
      {
        author: "Mansoor Al-Harbi",
        rating: 4,
        comment:
          "EQ Boost hybrid system delivers excellent fuel economy for its class. AMG Line looks aggressive.",
        created_at: "2025-01-03T00:00:00Z",
      },
      {
        author: "Reem Al-Turki",
        rating: 5,
        comment:
          "Brand new and loaded with features. The Dammam dealership provided outstanding service.",
        created_at: "2024-12-27T00:00:00Z",
      },
      {
        author: "Sultan Al-Fahad",
        rating: 4,
        comment:
          "Obsidian Black paint is gorgeous. The 4MATIC system handles perfectly in all conditions.",
        created_at: "2024-12-19T00:00:00Z",
      },
    ],
  },
  {
    id: "auto_seed_4",
    tenant_id: "default",
    seller_id: "seller_4",
    listing_type: "sale",
    title: "2023 Lexus ES 350 F Sport",
    make: "Lexus",
    model_name: "ES 350",
    year: 2023,
    mileage_km: 12000,
    fuel_type: "petrol",
    transmission: "automatic",
    body_type: "sedan",
    color: "Sonic Silver",
    condition: "certified_pre_owned",
    price: 16500000,
    currency_code: "SAR",
    description:
      "Lexus ES 350 F Sport with Mark Levinson audio, navigation, and advanced safety package.",
    features: [
      "F Sport Package",
      "Mark Levinson Audio",
      "Navigation",
      "Blind Spot Monitor",
    ],
    location_city: "Riyadh",
    location_country: "SA",
    status: "active",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price: 16500000,
      currency: "SAR",
      location: "Riyadh, Saudi Arabia",
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    reviews: [
      {
        author: "Bader Al-Subaie",
        rating: 5,
        comment:
          "The Lexus ES 350 F Sport is refined and sporty. Mark Levinson audio is audiophile-grade.",
        created_at: "2025-01-13T00:00:00Z",
      },
      {
        author: "Noura Al-Salem",
        rating: 4,
        comment:
          "Smooth V6 power with exceptional comfort. The blind spot monitor has saved me several times.",
        created_at: "2025-01-07T00:00:00Z",
      },
      {
        author: "Waleed Al-Anazi",
        rating: 5,
        comment:
          "F Sport package adds real character. Navigation system is accurate and easy to use.",
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        author: "Dana Al-Khaldi",
        rating: 4,
        comment:
          "Lexus reliability at its finest. CPO with only 12K km is a fantastic find.",
        created_at: "2024-12-24T00:00:00Z",
      },
      {
        author: "Fahad Al-Enazi",
        rating: 5,
        comment:
          "Silver color looks stunning. The advanced safety package gives confidence on Riyadh roads.",
        created_at: "2024-12-16T00:00:00Z",
      },
    ],
  },
  {
    id: "auto_seed_5",
    tenant_id: "default",
    seller_id: "seller_5",
    listing_type: "sale",
    title: "2024 Genesis G80 3.5T",
    make: "Genesis",
    model_name: "G80",
    year: 2024,
    mileage_km: 800,
    fuel_type: "petrol",
    transmission: "automatic",
    body_type: "sedan",
    color: "Vik Black",
    condition: "new",
    price: 19500000,
    currency_code: "SAR",
    description:
      "All-new Genesis G80 with 3.5L twin-turbo V6, Lexicon audio, and Genesis Connected Services.",
    features: [
      "Twin-Turbo V6",
      "Lexicon Audio",
      "Remote Smart Parking",
      "Highway Driving Assist",
    ],
    location_city: "Jeddah",
    location_country: "SA",
    status: "active",
    metadata: {
      thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
      price: 19500000,
      currency: "SAR",
      location: "Jeddah, Saudi Arabia",
    },
    thumbnail: "/seed-images/auctions/1489824904134-891ab64532f1.jpg",
    reviews: [
      {
        author: "Abdulaziz Al-Jaber",
        rating: 5,
        comment:
          "Genesis G80 is a hidden gem. Twin-turbo V6 delivers exhilarating power with refinement.",
        created_at: "2025-01-11T00:00:00Z",
      },
      {
        author: "Maha Al-Dossary",
        rating: 5,
        comment:
          "Lexicon audio surpasses many European competitors. Remote Smart Parking is incredibly convenient.",
        created_at: "2025-01-06T00:00:00Z",
      },
      {
        author: "Saud Al-Otaibi",
        rating: 4,
        comment:
          "Only 800 km on the clock and drives like a dream. Highway Driving Assist is impressive.",
        created_at: "2024-12-30T00:00:00Z",
      },
      {
        author: "Lama Al-Faisal",
        rating: 5,
        comment:
          "The Vik Black exterior is elegant and commanding. Genesis Connected Services are very useful.",
        created_at: "2024-12-22T00:00:00Z",
      },
      {
        author: "Nasser Al-Shamrani",
        rating: 4,
        comment:
          "Exceptional luxury sedan that rivals established brands at a better price point.",
        created_at: "2024-12-14T00:00:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("automotive") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveVehicleListing(id);
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
      return res.json({ item: seedItem });
    }
    return res.json({ item: enrichDetailItem(item, "automotive") });
  } catch (error: unknown) {
    const seedItem =
      SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
