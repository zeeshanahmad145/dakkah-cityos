import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_TRADE_INS = [
  { id: "ti-1", title: "iPhone 14 Pro Max 256GB", description: "Space Black, excellent condition with original box and charger. Battery health at 92%.", category: "Electronics", condition: "Excellent", estimated_value: 65000, currency_code: "usd", status: "accepting", thumbnail: "/seed-images/trade-in/1524758631624-e2822e304c36.jpg", brand: "Apple", model: "iPhone 14 Pro Max", created_at: "2025-05-12T10:00:00Z" },
  { id: "ti-2", title: "Samsung Galaxy S24 Ultra", description: "Titanium Gray, 512GB, minor scratches on back. Includes S-Pen and original accessories.", category: "Electronics", condition: "Good", estimated_value: 55000, currency_code: "usd", status: "accepting", thumbnail: "/seed-images/trade-in/1593642532744-d377ab507dc8.jpg", brand: "Samsung", model: "Galaxy S24 Ultra", created_at: "2025-05-10T14:30:00Z" },
  { id: "ti-3", title: "2021 Tesla Model 3 Long Range", description: "Pearl White, 28,000 miles, autopilot, premium interior. Clean title, single owner.", category: "Automotive", condition: "Very Good", estimated_value: 2800000, currency_code: "usd", status: "accepting", thumbnail: "/seed-images/trade-in/1606144042614-b2417e99c4e3.jpg", brand: "Tesla", model: "Model 3 Long Range", created_at: "2025-04-28T09:00:00Z" },
  { id: "ti-4", title: "MacBook Air M2 2022", description: "Midnight, 16GB RAM, 512GB SSD. Light usage, battery cycle count under 50.", category: "Electronics", condition: "Like New", estimated_value: 80000, currency_code: "usd", status: "accepting", thumbnail: "/seed-images/trade-in/1542291026-7eec264c27ff.jpg", brand: "Apple", model: "MacBook Air M2", created_at: "2025-05-08T11:15:00Z" },
  { id: "ti-5", title: "Sony PlayStation 5 Digital Edition", description: "White, includes two DualSense controllers and charging dock. Factory reset, works perfectly.", category: "Electronics", condition: "Good", estimated_value: 25000, currency_code: "usd", status: "accepting", thumbnail: "/seed-images/trade-in/1544244015-0df4b3ffc6b0.jpg", brand: "Sony", model: "PlayStation 5 Digital", created_at: "2025-05-06T16:00:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.json({
      trade_ins: SEED_TRADE_INS,
      items: SEED_TRADE_INS,
      count: SEED_TRADE_INS.length,
      limit: 20,
      offset: 0,
      public_info: {
        eligible_categories: [
          {
            name: "Electronics",
            description: "Smartphones, laptops, tablets and more",
            estimated_value_range: "$50 - $800",
          },
          {
            name: "Automotive",
            description: "Vehicles, parts, and accessories",
            estimated_value_range: "$100 - $25000",
          },
          {
            name: "Furniture",
            description: "Home and office furniture",
            estimated_value_range: "$25 - $500",
          },
          {
            name: "Appliances",
            description: "Home appliances in working condition",
            estimated_value_range: "$30 - $400",
          },
        ],
        how_it_works: [
          "Submit your item details and photos",
          "Receive a trade-in value estimate",
          "Ship your item or drop it off",
          "Get credit applied to your account",
        ],
      },
    });
  }

  const {
    limit = "20",
    offset = "0",
    tenant_id,
    status,
    category,
    condition,
    search,
  } = req.query as Record<string, string | undefined>;

  try {
    const automotiveService = req.scope.resolve("automotive") as any;

    const filters: Record<string, any> = { customer_id: customerId };
    if (tenant_id) filters.tenant_id = tenant_id;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (condition) filters.condition = condition;
    if (search) filters.name = { $like: `%${search}%` };

    const items = await automotiveService.listTradeIns(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    const tradeIns = Array.isArray(items) ? items : [];

    return res.json({
      trade_ins: tradeIns,
      count: tradeIns.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    return handleApiError(res, error, "STORE-TRADE-INS");
  }
}

// POST /store/trade-ins — submit a new trade-in (migrated from /store/trade-in)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const {
    tenant_id,
    listing_id,
    make,
    model_name,
    year,
    mileage_km,
    condition,
    vin,
    description,
    photos,
    currency_code = "usd",
    metadata,
  } = req.body as {
    tenant_id: string;
    listing_id?: string;
    make: string;
    model_name: string;
    year: number;
    mileage_km: number;
    condition: string;
    vin?: string;
    description?: string;
    photos?: string[];
    currency_code?: string;
    metadata?: Record<string, unknown>;
  };

  if (
    !tenant_id ||
    !make ||
    !model_name ||
    !year ||
    !mileage_km ||
    !condition
  ) {
    return res.status(400).json({
      message:
        "tenant_id, make, model_name, year, mileage_km, and condition are required",
    });
  }

  try {
    const automotiveService = req.scope.resolve("automotive") as any;

    const tradeIn = await automotiveService.createTradeIns({
      tenant_id,
      customer_id: customerId,
      listing_id: listing_id ?? null,
      make,
      model_name,
      year,
      mileage_km,
      condition,
      vin: vin ?? null,
      description: description ?? null,
      photos: photos ?? null,
      currency_code,
      status: "submitted",
      metadata: metadata ?? null,
    });

    res.status(201).json({ trade_in: tradeIn });
  } catch (error: any) {
    handleApiError(res, error, "STORE-TRADE-INS");
  }
}
