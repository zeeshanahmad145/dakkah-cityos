import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_CLASSIFIEDS = [
  {
    id: "cls-1",
    title: "iPhone 15 Pro Max – 256GB, Like New",
    description:
      "Barely used iPhone 15 Pro Max in Natural Titanium. Comes with original box, charger, and AppleCare+ until 2026. No scratches or dents.",
    category_id: "electronics",
    listing_type: "sale",
    condition: "like_new",
    price: 380000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    thumbnail: "/seed-images/classifieds/1592750475338-74b7b21085ab.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1592750475338-74b7b21085ab.jpg",
      images: ["/seed-images/classifieds/1592750475338-74b7b21085ab.jpg"],
    },
    reviews: [
      {
        author: "Mohammed A.",
        rating: 5,
        comment:
          "Excellent condition, exactly as described. Seller was very responsive and the phone looks brand new.",
        created_at: "2025-12-10T14:30:00Z",
      },
      {
        author: "Layla S.",
        rating: 4,
        comment:
          "Great deal on a premium phone. Minor box wear but the device itself is flawless.",
        created_at: "2025-12-08T09:15:00Z",
      },
      {
        author: "Khalid R.",
        rating: 5,
        comment:
          "Smooth transaction, met in a safe location. AppleCare+ transfer went seamlessly.",
        created_at: "2025-12-05T16:45:00Z",
      },
      {
        author: "Nora M.",
        rating: 4,
        comment:
          "Good price for a like-new phone. Delivery was quick and the seller included all accessories.",
        created_at: "2025-12-01T11:20:00Z",
      },
      {
        author: "Omar H.",
        rating: 3,
        comment:
          "Phone works perfectly but had a tiny scratch on the back that wasn't mentioned. Still a fair deal.",
        created_at: "2025-11-28T08:00:00Z",
      },
    ],
  },
  {
    id: "cls-2",
    title: "Leather Sectional Sofa – Italian Design",
    description:
      "Beautiful Italian leather L-shaped sectional sofa in dark brown. Seats 6 comfortably. Moving sale – must go this week!",
    category_id: "furniture",
    listing_type: "sale",
    condition: "good",
    price: 250000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Jeddah",
    status: "active",
    thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1555041469-a586c61ea9bc.jpg",
      images: ["/seed-images/classifieds/1555041469-a586c61ea9bc.jpg"],
    },
    reviews: [
      {
        author: "Sara K.",
        rating: 5,
        comment:
          "Stunning sofa! The leather quality is amazing and it fits perfectly in our living room.",
        created_at: "2025-12-09T13:00:00Z",
      },
      {
        author: "Ahmed F.",
        rating: 4,
        comment:
          "Beautiful piece of furniture. Some minor wear on the armrest but overall great condition.",
        created_at: "2025-12-07T10:30:00Z",
      },
      {
        author: "Fatima Z.",
        rating: 5,
        comment:
          "Seller helped with delivery arrangements. The sofa is even more beautiful in person.",
        created_at: "2025-12-04T15:20:00Z",
      },
      {
        author: "Youssef B.",
        rating: 3,
        comment:
          "Nice sofa but the color was slightly different from the photos. Still happy with the purchase.",
        created_at: "2025-11-30T09:45:00Z",
      },
      {
        author: "Hana T.",
        rating: 4,
        comment:
          "Great value for Italian leather furniture. Would recommend this seller.",
        created_at: "2025-11-27T14:10:00Z",
      },
    ],
  },
  {
    id: "cls-3",
    title: "2022 Toyota Camry – Low Mileage",
    description:
      "Single-owner 2022 Toyota Camry Grande with only 18,000 km. Full service history, extended warranty, pearl white color.",
    category_id: "vehicles",
    listing_type: "sale",
    condition: "like_new",
    price: 8500000,
    currency_code: "SAR",
    is_negotiable: false,
    location_city: "Dammam",
    status: "active",
    thumbnail: "/seed-images/classifieds/1621007947382-bb3c3994e3fb.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1621007947382-bb3c3994e3fb.jpg",
      images: ["/seed-images/classifieds/1621007947382-bb3c3994e3fb.jpg"],
    },
    reviews: [
      {
        author: "Abdullah D.",
        rating: 5,
        comment:
          "Car is in pristine condition. Full service records verified at Toyota dealership. Very honest seller.",
        created_at: "2025-12-11T12:00:00Z",
      },
      {
        author: "Reem A.",
        rating: 5,
        comment:
          "Low mileage and well maintained. The extended warranty is a great bonus.",
        created_at: "2025-12-08T17:30:00Z",
      },
      {
        author: "Tariq N.",
        rating: 4,
        comment:
          "Good car, fair price. Negotiation was straightforward and professional.",
        created_at: "2025-12-03T10:15:00Z",
      },
      {
        author: "Mona S.",
        rating: 4,
        comment:
          "Pearl white color is gorgeous. Minor cosmetic wear but mechanically perfect.",
        created_at: "2025-11-29T14:45:00Z",
      },
      {
        author: "Faisal K.",
        rating: 5,
        comment:
          "Best used car deal I've found. Seller provided all documentation promptly.",
        created_at: "2025-11-25T11:30:00Z",
      },
    ],
  },
  {
    id: "cls-4",
    title: 'MacBook Pro M3 14" – Brand New Sealed',
    description:
      "Brand new, sealed MacBook Pro 14-inch with M3 chip, 18GB RAM, 512GB SSD. Space Black.",
    category_id: "electronics",
    listing_type: "sale",
    condition: "new",
    price: 620000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    thumbnail: "/seed-images/classifieds/1517336714731-489689fd1ca8.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1517336714731-489689fd1ca8.jpg",
      images: ["/seed-images/classifieds/1517336714731-489689fd1ca8.jpg"],
    },
    reviews: [
      {
        author: "Nasser W.",
        rating: 5,
        comment:
          "Sealed in box as advertised. Saved a lot compared to retail price. Fast meetup.",
        created_at: "2025-12-10T09:00:00Z",
      },
      {
        author: "Lina Q.",
        rating: 5,
        comment:
          "Genuine Apple product, verified the serial number. Great price for a brand new machine.",
        created_at: "2025-12-06T14:20:00Z",
      },
      {
        author: "Hassan M.",
        rating: 4,
        comment:
          "Good deal on a sealed MacBook. Seller was flexible with meeting time and location.",
        created_at: "2025-12-02T11:45:00Z",
      },
      {
        author: "Dalia R.",
        rating: 4,
        comment:
          "Price was fair and the product was exactly as described. Smooth transaction.",
        created_at: "2025-11-28T16:30:00Z",
      },
      {
        author: "Sami A.",
        rating: 3,
        comment:
          "Product was genuine but seller took a while to respond to messages. Eventually worked out fine.",
        created_at: "2025-11-24T13:15:00Z",
      },
    ],
  },
  {
    id: "cls-5",
    title: "Vintage Oud Collection – 3 Pieces",
    description:
      "Three beautiful vintage oud instruments from different regions. Perfect for collectors or musicians.",
    category_id: "collectibles",
    listing_type: "sale",
    condition: "good",
    price: 450000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Madinah",
    status: "active",
    thumbnail: "/seed-images/classifieds/1511379938547-c1f69419868d.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1511379938547-c1f69419868d.jpg",
      images: ["/seed-images/classifieds/1511379938547-c1f69419868d.jpg"],
    },
    reviews: [
      {
        author: "Mustafa Y.",
        rating: 5,
        comment:
          "Incredible collection! Each oud has unique character and rich sound. A treasure for any musician.",
        created_at: "2025-12-09T10:00:00Z",
      },
      {
        author: "Amira J.",
        rating: 5,
        comment:
          "Seller is very knowledgeable about ouds. The instruments are well-preserved and authentic.",
        created_at: "2025-12-05T15:40:00Z",
      },
      {
        author: "Ziad H.",
        rating: 4,
        comment:
          "Beautiful instruments. One needed minor tuning work but overall excellent condition.",
        created_at: "2025-12-01T12:30:00Z",
      },
      {
        author: "Salma F.",
        rating: 4,
        comment:
          "Fair price for vintage pieces. Seller shared the history of each instrument.",
        created_at: "2025-11-27T09:20:00Z",
      },
      {
        author: "Ibrahim K.",
        rating: 3,
        comment:
          "Good collection but the cases showed more wear than expected. The ouds themselves are lovely.",
        created_at: "2025-11-23T17:00:00Z",
      },
    ],
  },
  {
    id: "cls-6",
    title: "Looking for: Standing Desk – Adjustable",
    description:
      "Looking to buy a quality adjustable standing desk in good condition. Preferably electric height adjustment.",
    category_id: "furniture",
    listing_type: "wanted",
    condition: "good",
    price: 150000,
    currency_code: "SAR",
    is_negotiable: true,
    location_city: "Riyadh",
    status: "active",
    thumbnail: "/seed-images/classifieds/1593062096033-9a26b09da705.jpg",
    metadata: {
      thumbnail: "/seed-images/classifieds/1593062096033-9a26b09da705.jpg",
      images: ["/seed-images/classifieds/1593062096033-9a26b09da705.jpg"],
    },
    reviews: [
      {
        author: "Rania M.",
        rating: 5,
        comment:
          "Buyer was prompt, polite, and paid immediately. Smooth transaction.",
        created_at: "2025-12-08T11:00:00Z",
      },
      {
        author: "Waleed S.",
        rating: 4,
        comment:
          "Good communication throughout. Buyer knew exactly what they wanted.",
        created_at: "2025-12-04T14:30:00Z",
      },
      {
        author: "Nouf A.",
        rating: 5,
        comment:
          "Reliable buyer. Showed up on time and inspected the desk carefully before purchasing.",
        created_at: "2025-11-30T10:15:00Z",
      },
      {
        author: "Majed T.",
        rating: 4,
        comment: "Friendly and professional. Would sell to this buyer again.",
        created_at: "2025-11-26T16:45:00Z",
      },
      {
        author: "Huda B.",
        rating: 3,
        comment:
          "Buyer was somewhat picky about condition but eventually we agreed on a fair price.",
        created_at: "2025-11-22T13:00:00Z",
      },
    ],
  },
];

const SEED_REVIEWS = [
  {
    author: "Mohammed A.",
    rating: 5,
    comment:
      "Excellent condition, exactly as described. Seller was very responsive.",
    created_at: "2025-12-10T14:30:00Z",
  },
  {
    author: "Sara K.",
    rating: 4,
    comment:
      "Great deal. Minor differences from photos but overall happy with purchase.",
    created_at: "2025-12-08T09:15:00Z",
  },
  {
    author: "Khalid R.",
    rating: 5,
    comment:
      "Smooth transaction, met in a safe location. Highly recommend this seller.",
    created_at: "2025-12-05T16:45:00Z",
  },
  {
    author: "Nora M.",
    rating: 4,
    comment: "Good price and quick communication. Would buy from again.",
    created_at: "2025-12-01T11:20:00Z",
  },
  {
    author: "Omar H.",
    rating: 4,
    comment: "Fair deal overall. Product works perfectly.",
    created_at: "2025-11-28T08:00:00Z",
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("classified") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveClassifiedListing(id);
    if (!item) {
      const seed =
        SEED_CLASSIFIEDS.find((s) => s.id === id) || SEED_CLASSIFIEDS[0];
      return res.json({ item: { ...seed, id } });
    }
    const enriched = {
      ...item,
      thumbnail:
        item.metadata?.thumbnail ||
        `/seed-images/classifieds/1592750475338-74b7b21085ab.jpg`,
      images: item.metadata?.images || [
        item.metadata?.thumbnail ||
          `/seed-images/classifieds/1592750475338-74b7b21085ab.jpg`,
      ],
      reviews: SEED_REVIEWS,
    };
    return res.json({ item: enrichDetailItem(enriched, "classifieds") });
  } catch (error: unknown) {
    const { id } = req.params;
    const seed =
      SEED_CLASSIFIEDS.find((s) => s.id === id) || SEED_CLASSIFIEDS[0];
    return res.json({ item: { ...seed, id } });
  }
}
