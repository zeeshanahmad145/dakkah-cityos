import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_ITEMS = [
  {
    id: "ti-seed-1",
    name: "iPhone 15 Pro",
    category: "phones",
    thumbnail: "/seed-images/auctions/1523275335684-37898b6baf30.jpg",
    description:
      "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.",
    condition_requirements: "Powers on, no cracks, all buttons functional",
    estimated_value_min: 150000,
    estimated_value_max: 280000,
    currency: "SAR",
    status: "active",
    requirements: [
      "Item must be in working condition",
      "Original charger and cable included",
      "No cracks or major scratches on screen",
      "Factory reset completed before trade-in",
    ],
    reviews: [
      {
        author: "Nasser K.",
        rating: 5,
        comment:
          "Got a great value for my old iPhone. Process was quick and transparent.",
        created_at: "2024-11-14T10:00:00Z",
      },
      {
        author: "Huda M.",
        rating: 4,
        comment:
          "Fair pricing and fast evaluation. Credit was applied within 24 hours.",
        created_at: "2024-11-01T15:30:00Z",
      },
      {
        author: "Ali S.",
        rating: 5,
        comment:
          "Best trade-in experience I've had. Much better value than other platforms.",
        created_at: "2024-10-18T09:00:00Z",
      },
      {
        author: "Reem A.",
        rating: 4,
        comment:
          "Smooth process overall. The condition check was thorough but fair.",
        created_at: "2024-10-05T14:15:00Z",
      },
      {
        author: "Fahad W.",
        rating: 5,
        comment:
          "Traded in my Pro for store credit towards the new model. Easy!",
        created_at: "2024-09-20T11:45:00Z",
      },
    ],
  },
  {
    id: "ti-seed-2",
    name: "Samsung Galaxy S24 Ultra",
    category: "phones",
    thumbnail: "/seed-images/trade-in/1610945415295-d9bbf067e59c.jpg",
    description:
      "Trade in your Samsung Galaxy S24 Ultra for instant store credit.",
    condition_requirements: "Powers on, screen intact, no water damage",
    estimated_value_min: 120000,
    estimated_value_max: 250000,
    currency: "SAR",
    status: "active",
    requirements: [
      "Device powers on and holds charge",
      "Screen intact with no dead pixels",
      "No water damage indicators triggered",
      "All buttons and ports functional",
    ],
    reviews: [
      {
        author: "Omar T.",
        rating: 5,
        comment:
          "Instant credit was amazing. Walked in with old phone, walked out with new one.",
        created_at: "2024-11-10T12:00:00Z",
      },
      {
        author: "Sara B.",
        rating: 4,
        comment:
          "Good trade-in value for my S24 Ultra. Process took about 30 minutes.",
        created_at: "2024-10-28T10:30:00Z",
      },
      {
        author: "Majed H.",
        rating: 5,
        comment:
          "Fair evaluation and quick processing. Will use this service again.",
        created_at: "2024-10-12T16:00:00Z",
      },
      {
        author: "Layla F.",
        rating: 4,
        comment: "Appreciated the transparency in the condition assessment.",
        created_at: "2024-09-25T09:45:00Z",
      },
      {
        author: "Ziad R.",
        rating: 5,
        comment:
          "Got max value because my phone was in excellent condition. Very satisfied.",
        created_at: "2024-09-08T13:30:00Z",
      },
    ],
  },
  {
    id: "ti-seed-3",
    name: "MacBook Pro M3",
    category: "laptops",
    thumbnail: "/seed-images/classifieds/1517336714731-489689fd1ca8.jpg",
    description:
      "Get top value for your MacBook Pro M3. All configurations accepted.",
    condition_requirements: "Boots normally, keyboard functional, no dents",
    estimated_value_min: 350000,
    estimated_value_max: 650000,
    currency: "SAR",
    status: "active",
    requirements: [
      "Boots normally to desktop",
      "Keyboard and trackpad fully functional",
      "No significant dents or cosmetic damage",
      "Battery health above 70%",
    ],
    reviews: [
      {
        author: "Khalid N.",
        rating: 5,
        comment:
          "Got top dollar for my MacBook. The evaluation was fair and thorough.",
        created_at: "2024-11-08T11:00:00Z",
      },
      {
        author: "Amira D.",
        rating: 5,
        comment:
          "Upgraded to the latest model with great credit from my trade-in.",
        created_at: "2024-10-22T14:30:00Z",
      },
      {
        author: "Bader L.",
        rating: 4,
        comment:
          "Good value considering the laptop was 2 years old. Quick turnaround.",
        created_at: "2024-10-05T10:15:00Z",
      },
      {
        author: "Noura G.",
        rating: 5,
        comment:
          "Professional service. They checked everything carefully and gave a fair price.",
        created_at: "2024-09-18T15:00:00Z",
      },
      {
        author: "Sami K.",
        rating: 4,
        comment:
          "Smooth trade-in process. Credit applied instantly to my account.",
        created_at: "2024-09-02T09:30:00Z",
      },
    ],
  },
  {
    id: "ti-seed-4",
    name: 'iPad Pro 12.9"',
    category: "tablets",
    thumbnail: "/seed-images/trade-in/1544244015-0df4b3ffc6b0.jpg",
    description: "Trade in your iPad Pro for store credit towards new devices.",
    condition_requirements: "Powers on, touch screen responsive, no cracks",
    estimated_value_min: 100000,
    estimated_value_max: 200000,
    currency: "SAR",
    status: "active",
    requirements: [
      "Touch screen fully responsive",
      "No cracks on screen or body",
      "Apple Pencil support functional if applicable",
      "Signed out of iCloud before submission",
    ],
    reviews: [
      {
        author: "Dana M.",
        rating: 5,
        comment:
          "Traded my old iPad for a new one. The value offered was very competitive.",
        created_at: "2024-11-06T13:00:00Z",
      },
      {
        author: "Turki S.",
        rating: 4,
        comment:
          "Process was straightforward. Had to sign out of iCloud first which makes sense.",
        created_at: "2024-10-20T10:00:00Z",
      },
      {
        author: "Ghada H.",
        rating: 5,
        comment:
          "Great way to upgrade without paying full price. Highly recommend.",
        created_at: "2024-10-08T16:30:00Z",
      },
      {
        author: "Mansour A.",
        rating: 4,
        comment:
          "Fair assessment of my iPad's condition. Got a reasonable credit.",
        created_at: "2024-09-22T11:45:00Z",
      },
      {
        author: "Salwa R.",
        rating: 5,
        comment:
          "Quick and easy trade-in. Applied credit towards a MacBook instead.",
        created_at: "2024-09-05T08:15:00Z",
      },
    ],
  },
  {
    id: "ti-seed-5",
    name: "Sony PS5",
    category: "gaming",
    thumbnail: "/seed-images/trade-in/1606144042614-b2417e99c4e3.jpg",
    description: "Trade in your PlayStation 5 console for store credit.",
    condition_requirements:
      "Powers on, controllers included, no disc read errors",
    estimated_value_min: 80000,
    estimated_value_max: 150000,
    currency: "SAR",
    status: "active",
    requirements: [
      "Console powers on without errors",
      "At least one controller included",
      "No disc read errors or overheating issues",
      "All cables and power adapter included",
    ],
    reviews: [
      {
        author: "Youssef B.",
        rating: 5,
        comment:
          "Traded my PS5 for credit towards the new Pro model. Excellent value.",
        created_at: "2024-11-04T17:00:00Z",
      },
      {
        author: "Hassan T.",
        rating: 4,
        comment:
          "Good deal for a used console. They tested everything on the spot.",
        created_at: "2024-10-18T14:30:00Z",
      },
      {
        author: "Mona K.",
        rating: 5,
        comment:
          "Easy process. Included both controllers and got a nice bonus credit.",
        created_at: "2024-10-02T11:00:00Z",
      },
      {
        author: "Rashid F.",
        rating: 4,
        comment:
          "Fair pricing for gaming consoles. Better than selling on classifieds.",
        created_at: "2024-09-15T16:15:00Z",
      },
      {
        author: "Aisha D.",
        rating: 3,
        comment:
          "Decent value but wish they offered more for the disc edition.",
        created_at: "2024-09-01T10:30:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const mod = req.scope.resolve("tradeIn") as unknown as any;
    const item = await mod.retrieveTradeInRequest(id);
    if (item) return res.json({ item: enrichDetailItem(item, "trade-in") });
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0];
    return res.json({ item: { ...seed, id } });
  } catch {
    const { id } = req.params;
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0];
    return res.json({ item: { ...seed, id } });
  }
}
