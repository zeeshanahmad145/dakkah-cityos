import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "rental_seed_1",
    tenant_id: "default",
    product_id: "prod_rental_1",
    rental_type: "daily",
    title: "Professional DSLR Camera Kit",
    name: "Professional DSLR Camera Kit",
    description:
      "Canon EOS R5 with 24-70mm f/2.8 lens, tripod, and carry case. Perfect for events, travel photography, and content creation.",
    daily_rate: 15000,
    weekly_rate: 75000,
    monthly_rate: 200000,
    deposit_amount: 50000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 48,
    category: "electronics",
    rating: 4.8,
    metadata: {
      thumbnail: "/seed-images/auctions/1526170375885-4d8ecf77b99f.jpg",
      price: 15000,
    },
    thumbnail: "/seed-images/auctions/1526170375885-4d8ecf77b99f.jpg",
    price: 15000,
    reviews: [
      {
        author: "Nasser A.",
        rating: 5,
        comment:
          "Amazing camera kit, everything was in perfect condition. Great for my wedding shoot.",
        created_at: "2024-11-15T10:00:00Z",
      },
      {
        author: "Sara M.",
        rating: 5,
        comment:
          "Picked up and returned smoothly. The lens quality was superb.",
        created_at: "2024-11-02T14:30:00Z",
      },
      {
        author: "Fahad K.",
        rating: 4,
        comment:
          "Good kit overall, the tripod was a bit worn but camera was flawless.",
        created_at: "2024-10-20T09:15:00Z",
      },
      {
        author: "Lina H.",
        rating: 5,
        comment:
          "Perfect for my content creation weekend. Will definitely rent again!",
        created_at: "2024-10-05T16:45:00Z",
      },
      {
        author: "Omar R.",
        rating: 4,
        comment:
          "Excellent value for money compared to buying. Camera performed great.",
        created_at: "2024-09-18T11:20:00Z",
      },
    ],
  },
  {
    id: "rental_seed_2",
    tenant_id: "default",
    product_id: "prod_rental_2",
    rental_type: "daily",
    title: "Electric Scooter",
    name: "Electric Scooter",
    description:
      "Segway Ninebot Max G30 electric scooter with 65km range. Ideal for city commuting and sightseeing.",
    daily_rate: 5000,
    weekly_rate: 25000,
    monthly_rate: 70000,
    deposit_amount: 20000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 120,
    category: "vehicles",
    rating: 4.5,
    metadata: {
      thumbnail: "/seed-images/rentals/1560343090-f0409e92791a.jpg",
      price: 5000,
    },
    thumbnail: "/seed-images/rentals/1560343090-f0409e92791a.jpg",
    price: 5000,
    reviews: [
      {
        author: "Khalid S.",
        rating: 5,
        comment:
          "Amazing scooter for exploring the city. Battery lasted all day!",
        created_at: "2024-11-10T08:00:00Z",
      },
      {
        author: "Mona B.",
        rating: 4,
        comment:
          "Fun ride, very convenient for short trips around the neighborhood.",
        created_at: "2024-10-28T13:45:00Z",
      },
      {
        author: "Yousef T.",
        rating: 5,
        comment:
          "Used it for a week of commuting. Saved so much on transport costs.",
        created_at: "2024-10-15T07:30:00Z",
      },
      {
        author: "Huda W.",
        rating: 4,
        comment:
          "Good condition, easy to use. Wish the range was a bit longer.",
        created_at: "2024-09-30T17:00:00Z",
      },
      {
        author: "Rami J.",
        rating: 5,
        comment:
          "Perfect for sightseeing. Rented for tourists and they loved it.",
        created_at: "2024-09-12T10:20:00Z",
      },
    ],
  },
  {
    id: "rental_seed_3",
    tenant_id: "default",
    product_id: "prod_rental_3",
    rental_type: "weekly",
    title: "Camping & Outdoor Gear Set",
    name: "Camping & Outdoor Gear Set",
    description:
      "Complete camping package: 4-person tent, sleeping bags, portable stove, lantern, and cooler. Everything you need for a desert or mountain adventure.",
    daily_rate: 10000,
    weekly_rate: 50000,
    monthly_rate: 150000,
    deposit_amount: 30000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Very Good",
    total_rentals: 65,
    category: "sports",
    rating: 4.6,
    metadata: {
      thumbnail: "/seed-images/freelance/1532629345422-7515f3d16bb6.jpg",
      price: 50000,
    },
    thumbnail: "/seed-images/freelance/1532629345422-7515f3d16bb6.jpg",
    price: 50000,
    reviews: [
      {
        author: "Abdulaziz F.",
        rating: 5,
        comment:
          "Everything we needed for a desert camping trip. Tent was spacious and clean.",
        created_at: "2024-11-08T15:00:00Z",
      },
      {
        author: "Noura G.",
        rating: 4,
        comment: "Great gear set. The sleeping bags were warm and comfortable.",
        created_at: "2024-10-22T09:30:00Z",
      },
      {
        author: "Tariq L.",
        rating: 5,
        comment:
          "Rented for a family weekend trip. Kids loved the lantern and stove worked perfectly.",
        created_at: "2024-10-10T12:00:00Z",
      },
      {
        author: "Reem K.",
        rating: 5,
        comment:
          "Saved us from buying all this gear. Everything was well-maintained.",
        created_at: "2024-09-25T14:15:00Z",
      },
      {
        author: "Saleh N.",
        rating: 4,
        comment:
          "Good quality gear. The cooler kept food fresh for three days.",
        created_at: "2024-09-08T08:45:00Z",
      },
    ],
  },
  {
    id: "rental_seed_4",
    tenant_id: "default",
    product_id: "prod_rental_4",
    rental_type: "monthly",
    title: "Standing Desk & Ergonomic Chair",
    name: "Standing Desk & Ergonomic Chair",
    description:
      "Motorized sit-stand desk with Herman Miller Aeron chair. Transform your home office with premium ergonomic furniture.",
    daily_rate: 8000,
    weekly_rate: 40000,
    monthly_rate: 120000,
    deposit_amount: 40000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Excellent",
    total_rentals: 32,
    category: "furniture",
    rating: 4.9,
    metadata: {
      thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg",
      price: 120000,
    },
    thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg",
    price: 120000,
    reviews: [
      {
        author: "Amal D.",
        rating: 5,
        comment:
          "The standing desk transformed my home office. Chair was incredibly comfortable.",
        created_at: "2024-11-12T10:30:00Z",
      },
      {
        author: "Bader H.",
        rating: 5,
        comment:
          "Rented for a month to try before buying. Now I know exactly what I want.",
        created_at: "2024-10-30T16:00:00Z",
      },
      {
        author: "Dina R.",
        rating: 4,
        comment:
          "Great furniture, delivery was smooth. The desk motor is very quiet.",
        created_at: "2024-10-18T11:45:00Z",
      },
      {
        author: "Faisal M.",
        rating: 5,
        comment:
          "My back pain improved significantly. The Aeron chair is worth every riyal.",
        created_at: "2024-10-02T09:00:00Z",
      },
      {
        author: "Ghada S.",
        rating: 4,
        comment:
          "Excellent ergonomic setup. Wish the rental period was more flexible.",
        created_at: "2024-09-15T13:30:00Z",
      },
    ],
  },
  {
    id: "rental_seed_5",
    tenant_id: "default",
    product_id: "prod_rental_5",
    rental_type: "daily",
    title: "Power Tools Construction Kit",
    name: "Power Tools Construction Kit",
    description:
      "DeWalt professional toolkit with drill, circular saw, reciprocating saw, and impact driver. Includes batteries and charger.",
    daily_rate: 12000,
    weekly_rate: 60000,
    monthly_rate: 180000,
    deposit_amount: 35000,
    currency_code: "SAR",
    is_available: true,
    condition_on_listing: "Good",
    total_rentals: 87,
    category: "tools",
    rating: 4.7,
    metadata: {
      thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
      price: 12000,
    },
    thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
    price: 12000,
    reviews: [
      {
        author: "Hassan Q.",
        rating: 5,
        comment:
          "All tools were in great working condition. Saved me from buying for a one-time project.",
        created_at: "2024-11-05T08:00:00Z",
      },
      {
        author: "Jamal W.",
        rating: 4,
        comment:
          "Good power tools set. Batteries held charge well throughout the day.",
        created_at: "2024-10-25T14:00:00Z",
      },
      {
        author: "Karim B.",
        rating: 5,
        comment:
          "Professional grade tools at a fraction of the cost. Highly recommend.",
        created_at: "2024-10-12T10:30:00Z",
      },
      {
        author: "Layla T.",
        rating: 5,
        comment: "Rented for a home renovation. Everything worked perfectly.",
        created_at: "2024-09-28T07:15:00Z",
      },
      {
        author: "Majed A.",
        rating: 4,
        comment:
          "Convenient rental process. The circular saw was especially impressive.",
        created_at: "2024-09-10T16:45:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveRentalProduct(id);
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
      return res.json({ item: seedItem });
    }
    return res.json({ item: enrichDetailItem(item, "rentals") });
  } catch (error: unknown) {
    const seedItem =
      SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
