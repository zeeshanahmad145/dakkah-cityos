import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_CHARITIES = [
  {
    id: "charity_seed_01",
    tenant_id: "tenant_seed",
    name: "Clean Water Initiative",
    title: "Clean Water Initiative",
    description:
      "Providing clean drinking water to communities in need across developing nations. Every donation helps build wells and water purification systems.",
    category: "one_time",
    campaign_type: "one_time",
    logo_url: "/seed-images/charity/1541544537156-7627a7a4aa1c.jpg",
    thumbnail: "/seed-images/charity/1541544537156-7627a7a4aa1c.jpg",
    goal: 5000000,
    target_amount: 5000000,
    raised: 3200000,
    amount_raised: 3200000,
    donor_count: 1240,
    organization: "WaterAid Global",
    currency: "USD",
    end_date: "2025-12-31T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "charity_seed_02",
    tenant_id: "tenant_seed",
    name: "Emergency Disaster Relief",
    title: "Emergency Disaster Relief",
    description:
      "Rapid response fund for natural disasters worldwide. Providing shelter, food, and medical supplies to affected communities.",
    category: "emergency",
    campaign_type: "emergency",
    logo_url: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
    thumbnail: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
    goal: 10000000,
    target_amount: 10000000,
    raised: 7800000,
    amount_raised: 7800000,
    donor_count: 3560,
    organization: "Global Relief Network",
    currency: "USD",
    end_date: "2025-06-30T00:00:00Z",
    is_urgent: true,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-05T00:00:00Z",
  },
  {
    id: "charity_seed_03",
    tenant_id: "tenant_seed",
    name: "Children's Education Fund",
    title: "Children's Education Fund",
    description:
      "Supporting underprivileged children with access to quality education, school supplies, and scholarship programs worldwide.",
    category: "recurring",
    campaign_type: "recurring",
    logo_url: "/seed-images/charity/1497486751825-1233686d5d80.jpg",
    thumbnail: "/seed-images/charity/1497486751825-1233686d5d80.jpg",
    goal: 2000000,
    target_amount: 2000000,
    raised: 1450000,
    amount_raised: 1450000,
    donor_count: 890,
    organization: "EduCare Foundation",
    currency: "USD",
    end_date: "2025-09-15T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "charity_seed_04",
    tenant_id: "tenant_seed",
    name: "Wildlife Conservation Project",
    title: "Wildlife Conservation Project",
    description:
      "Protecting endangered species and their habitats through conservation programs, anti-poaching efforts, and community engagement.",
    category: "matching",
    campaign_type: "matching",
    logo_url: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
    thumbnail: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
    goal: 3000000,
    target_amount: 3000000,
    raised: 1800000,
    amount_raised: 1800000,
    donor_count: 670,
    organization: "Earth Guardians",
    currency: "USD",
    end_date: "2025-11-30T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "charity_seed_05",
    tenant_id: "tenant_seed",
    name: "Hunger Relief Campaign",
    title: "Hunger Relief Campaign",
    description:
      "Fighting hunger by distributing meals, supporting food banks, and building sustainable agriculture programs in food-insecure regions.",
    category: "one_time",
    campaign_type: "one_time",
    logo_url: "/seed-images/charity/1488521787991-ed7bbaae773c.jpg",
    thumbnail: "/seed-images/charity/1488521787991-ed7bbaae773c.jpg",
    goal: 4000000,
    target_amount: 4000000,
    raised: 2900000,
    amount_raised: 2900000,
    donor_count: 2100,
    organization: "Feed The World",
    currency: "USD",
    end_date: "2025-10-31T00:00:00Z",
    is_urgent: true,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-20T00:00:00Z",
  },
];

const SEED_CAMPAIGNS = SEED_CHARITIES;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const charityService = req.scope.resolve("charity") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      status,
      is_verified,
      search,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (is_verified !== undefined) filters.is_verified = is_verified === "true";
    if (search) filters.name = { $like: `%${search}%` };

    const paginationOpts = {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    };

    const [charities, campaigns] = await Promise.all([
      charityService.listCharityOrgs(filters, paginationOpts),
      charityService.listDonationCampaigns(filters, paginationOpts),
    ]);

    const charityList =
      Array.isArray(charities) && charities.length > 0
        ? charities
        : SEED_CHARITIES;
    const campaignList =
      Array.isArray(campaigns) && campaigns.length > 0
        ? campaigns
        : SEED_CAMPAIGNS;

    return res.json({
      charities: charityList,
      campaigns: campaignList,
      count: charityList.length + campaignList.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-CHARITY");
  }
}
