import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "campaign-seed-1",
    title: "Summer Clearance Sale",
    description:
      "Massive discounts on summer collections. Up to 60% off on selected items across all categories.",
    type: "seasonal",
    status: "active",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    raised_amount: 45000,
    goal_amount: 100000,
    currency_code: "usd",
    backers_count: 120,
    days_remaining: 45,
    starts_at: "2025-06-01T00:00:00Z",
    ends_at: "2025-08-31T23:59:59Z",
    reward_tiers: [
      {
        id: "rt-1",
        title: "Early Bird",
        description: "Get early access to the sale",
        pledge_amount: 1000,
        currency_code: "usd",
        estimated_delivery: "2025-07-01",
        limited_quantity: 50,
        claimed: 12,
        includes: ["Early access pass", "10% extra discount"],
      },
      {
        id: "rt-2",
        title: "VIP Shopper",
        description: "Premium shopping experience",
        pledge_amount: 5000,
        currency_code: "usd",
        estimated_delivery: "2025-07-01",
        limited_quantity: 20,
        claimed: 5,
        includes: ["VIP access", "Personal shopper", "25% extra discount"],
      },
    ],
    metadata: {
      image: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
      discount: "60%",
      discount_label: "Up to 60% Off",
    },
    reviews: [
      {
        author: "Ahmed Shopper",
        rating: 5,
        comment:
          "Amazing summer deals! Got 60% off on premium items. The campaign delivered exactly what it promised.",
        created_at: "2025-06-20T00:00:00Z",
      },
      {
        author: "Sarah Bargain",
        rating: 4,
        comment:
          "Great selection of discounted products. The early bird tier gave excellent extra savings.",
        created_at: "2025-06-15T00:00:00Z",
      },
      {
        author: "Mike Deals",
        rating: 5,
        comment:
          "Best summer clearance event I've participated in. VIP shopping experience was worth it.",
        created_at: "2025-06-10T00:00:00Z",
      },
      {
        author: "Fatima Value",
        rating: 4,
        comment:
          "Wide variety of categories on sale. Loved the transparency of the campaign updates.",
        created_at: "2025-06-05T00:00:00Z",
      },
      {
        author: "Chris Summer",
        rating: 5,
        comment:
          "Backed this campaign early and got phenomenal deals. Will definitely support next season.",
        created_at: "2025-06-01T00:00:00Z",
      },
    ],
  },
  {
    id: "campaign-seed-2",
    title: "Flash Friday Deals",
    description:
      "24-hour flash deals every Friday. Limited stock, unbeatable prices on top brands.",
    type: "flash",
    status: "active",
    thumbnail: "/seed-images/campaigns/1556742049-0cfed4f6a45d.jpg",
    raised_amount: 28000,
    goal_amount: 50000,
    currency_code: "usd",
    backers_count: 85,
    days_remaining: 30,
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "/seed-images/campaigns/1556742049-0cfed4f6a45d.jpg",
      discount: "40%",
      discount_label: "Up to 40% Off",
    },
    reviews: [
      {
        author: "Nora Friday",
        rating: 5,
        comment:
          "Flash Friday never disappoints. Snagged top brand items at unbeatable prices.",
        created_at: "2025-03-15T00:00:00Z",
      },
      {
        author: "Omar Quick",
        rating: 4,
        comment:
          "Limited stock creates urgency but the deals are genuine. Love the weekly format.",
        created_at: "2025-03-08T00:00:00Z",
      },
      {
        author: "Lisa Flash",
        rating: 5,
        comment:
          "40% off on premium brands every Friday. This campaign is a shopper's dream.",
        created_at: "2025-03-01T00:00:00Z",
      },
      {
        author: "Tariq Deals",
        rating: 4,
        comment:
          "Consistent quality deals throughout the year. Need to be quick though!",
        created_at: "2025-02-22T00:00:00Z",
      },
      {
        author: "Emma Fast",
        rating: 3,
        comment:
          "Good deals but they sell out very quickly. Set reminders for Friday drops.",
        created_at: "2025-02-15T00:00:00Z",
      },
    ],
  },
  {
    id: "campaign-seed-3",
    title: "End of Season Clearance",
    description:
      "Final markdowns on winter inventory. Everything must go to make room for new arrivals.",
    type: "clearance",
    status: "active",
    thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
    raised_amount: 15000,
    goal_amount: 30000,
    currency_code: "usd",
    backers_count: 60,
    days_remaining: 15,
    starts_at: "2025-02-01T00:00:00Z",
    ends_at: "2025-03-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
      discount: "70%",
      discount_label: "Up to 70% Off",
    },
    reviews: [
      {
        author: "Khalid Clearance",
        rating: 5,
        comment:
          "70% off winter items was incredible. Stocked up on quality coats and boots.",
        created_at: "2025-03-20T00:00:00Z",
      },
      {
        author: "Maryam Season",
        rating: 5,
        comment:
          "Final markdowns were genuinely deep discounts. Found amazing pieces for next winter.",
        created_at: "2025-03-15T00:00:00Z",
      },
      {
        author: "David End",
        rating: 4,
        comment:
          "Great clearance prices. Selection was still good even late in the campaign.",
        created_at: "2025-03-10T00:00:00Z",
      },
      {
        author: "Aisha Winter",
        rating: 4,
        comment:
          "Everything must go and the prices reflected it. Saved hundreds on my purchases.",
        created_at: "2025-03-05T00:00:00Z",
      },
      {
        author: "Peter Sale",
        rating: 5,
        comment:
          "Best end-of-season sale I've seen. Quality inventory at deep discount prices.",
        created_at: "2025-02-28T00:00:00Z",
      },
    ],
  },
  {
    id: "campaign-seed-4",
    title: "Holiday Gift Guide",
    description:
      "Curated gift collections for everyone on your list. Special bundles and free gift wrapping.",
    type: "holiday",
    status: "active",
    thumbnail: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
    raised_amount: 8000,
    goal_amount: 25000,
    currency_code: "usd",
    backers_count: 40,
    days_remaining: 60,
    starts_at: "2025-11-15T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "/seed-images/crowdfunding/1560472355-536de3962603.jpg",
      discount: "30%",
      discount_label: "30% Off Bundles",
    },
    reviews: [
      {
        author: "Reem Gifts",
        rating: 5,
        comment:
          "The curated gift collections made holiday shopping so easy. Beautiful packaging too!",
        created_at: "2025-12-20T00:00:00Z",
      },
      {
        author: "Hassan Holiday",
        rating: 4,
        comment:
          "30% off bundles is a great deal. Free gift wrapping saved time and money.",
        created_at: "2025-12-15T00:00:00Z",
      },
      {
        author: "Jennifer Wrap",
        rating: 5,
        comment:
          "Found perfect gifts for everyone on my list. The guide categories were very helpful.",
        created_at: "2025-12-10T00:00:00Z",
      },
      {
        author: "Ali Gifts",
        rating: 4,
        comment:
          "Well-curated collections for different interests. Special bundles were excellent value.",
        created_at: "2025-12-05T00:00:00Z",
      },
      {
        author: "Sophie Present",
        rating: 5,
        comment:
          "Made holiday gifting stress-free. The bundles were thoughtfully put together.",
        created_at: "2025-11-30T00:00:00Z",
      },
    ],
  },
  {
    id: "campaign-seed-5",
    title: "Back to School Savings",
    description:
      "Stock up on school supplies, electronics, and dorm essentials at discounted prices.",
    type: "seasonal",
    status: "active",
    thumbnail: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
    raised_amount: 12000,
    goal_amount: 20000,
    currency_code: "usd",
    backers_count: 95,
    days_remaining: 25,
    starts_at: "2025-07-15T00:00:00Z",
    ends_at: "2025-09-15T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "/seed-images/campaigns/1503676260728-1c00da094a0b.jpg",
      discount: "25%",
      discount_label: "25% Off",
    },
    reviews: [
      {
        author: "Layla Student",
        rating: 5,
        comment:
          "Saved so much on school supplies and a laptop. Best back-to-school campaign ever.",
        created_at: "2025-08-15T00:00:00Z",
      },
      {
        author: "Carlos Campus",
        rating: 4,
        comment:
          "Great discounts on electronics and dorm essentials. 25% off really adds up.",
        created_at: "2025-08-10T00:00:00Z",
      },
      {
        author: "Priya Study",
        rating: 5,
        comment:
          "Everything for the new semester at discounted prices. The campaign timing was perfect.",
        created_at: "2025-08-05T00:00:00Z",
      },
      {
        author: "Tom College",
        rating: 4,
        comment:
          "Dorm essentials bundle was a lifesaver. Quality items at student-friendly prices.",
        created_at: "2025-07-30T00:00:00Z",
      },
      {
        author: "Nadia School",
        rating: 5,
        comment:
          "Stocked up on supplies for the whole year. Great savings for families with multiple kids.",
        created_at: "2025-07-25T00:00:00Z",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveCrowdfundCampaign(id);
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
      return res.json({ item: seedItem });
    }
    const reward_tiers = await mod.listRewardTiers(
      { campaign_id: id },
      { take: 100 },
    );
    return res.json({
      item: enrichDetailItem({ ...item, reward_tiers }, "crowdfunding"),
    });
  } catch (error: unknown) {
    const seedItem =
      SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
