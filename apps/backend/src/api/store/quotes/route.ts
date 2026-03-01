import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

interface IQuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  sku?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number | string;
  subtotal?: string;
  total?: string;
}

interface IQuote {
  id: string;
  quote_number: string;
  customer_id: string;
  company_id?: string;
  tenant_id?: string;
  store_id?: string;
  region_id?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "converted";
  customer_notes?: string;
  currency_code: string;
  created_at?: Date;
}

interface IQuoteModuleService {
  generateQuoteNumber(): Promise<string>;
  createQuotes(data: Partial<IQuote>): Promise<IQuote>;
  createQuoteItems(data: Partial<IQuoteItem>): Promise<IQuoteItem>;
  calculateQuoteTotals(quoteId: string): Promise<void>;
  retrieveQuote(id: string): Promise<IQuote>;
  listQuotes(
    filters: Partial<IQuote>,
    config?: Record<string, unknown>,
  ): Promise<IQuote[]>;
  listQuoteItems(filters: Partial<IQuoteItem>): Promise<IQuoteItem[]>;
}

const SEED_QUOTES = [
  {
    id: "quote-seed-1",
    title: "Office Furniture Bulk Order",
    customer_name: "Acme Corp",
    status: "pending",
    total: 1250000,
    currency: "USD",
    items_count: 12,
    created_at: "2026-02-10T09:00:00Z",
    thumbnail: "/seed-images/quotes/1504384308090-c894fdcc538d.jpg",
  },
  {
    id: "quote-seed-2",
    title: "IT Equipment Refresh",
    customer_name: "TechStart Inc",
    status: "approved",
    total: 875000,
    currency: "USD",
    items_count: 8,
    created_at: "2026-02-08T14:30:00Z",
    thumbnail: "/seed-images/quotes/1551288049-bebda4e38f71.jpg",
  },
  {
    id: "quote-seed-3",
    title: "Event Supplies Package",
    customer_name: "EventPro LLC",
    status: "draft",
    total: 340000,
    currency: "USD",
    items_count: 25,
    created_at: "2026-02-05T11:00:00Z",
    thumbnail: "/seed-images/quotes/1519494026892-80bbd2d6fd0d.jpg",
  },
  {
    id: "quote-seed-4",
    title: "Restaurant Kitchen Equipment",
    customer_name: "Bistro Moderne",
    status: "pending",
    total: 2100000,
    currency: "USD",
    items_count: 15,
    created_at: "2026-02-03T08:00:00Z",
    thumbnail: "/seed-images/quotes/1504384308090-c894fdcc538d.jpg",
  },
  {
    id: "quote-seed-5",
    title: "Warehouse Shelving System",
    customer_name: "LogiStore Ltd",
    status: "approved",
    total: 560000,
    currency: "USD",
    items_count: 6,
    created_at: "2026-01-28T16:00:00Z",
    thumbnail: "/seed-images/quotes/1551288049-bebda4e38f71.jpg",
  },
];

const quoteItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  title: z.string().min(1),
  sku: z.string().optional(),
  thumbnail: z.string().optional(),
  quantity: z.number().min(1),
  unit_price: z.union([z.string(), z.number()]),
});

const createQuoteSchema = z.object({
  items: z.array(quoteItemSchema).optional(),
  customer_notes: z.string().optional(),
  company_id: z.string().optional(),
  tenant_id: z.string().optional(),
  region_id: z.string().optional(),
  store_id: z.string().optional(),
});

/**
 * POST /store/quotes
 * Create a new quote request
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve(
      "quote",
    ) as unknown as IQuoteModuleService;

    const parsed = createQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const {
      items,
      customer_notes,
      company_id,
      tenant_id,
      region_id,
      store_id,
    } = parsed.data;

    // Validate authenticated customer
    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customerId = req.auth_context.actor_id;

    // Generate quote number
    const quoteNumber = await quoteModuleService.generateQuoteNumber();

    // Create quote
    const quote = await quoteModuleService.createQuotes({
      quote_number: quoteNumber,
      customer_id: customerId,
      company_id,
      tenant_id,
      store_id,
      region_id,
      status: "draft",
      customer_notes,
      currency_code: "usd",
    });

    // Create quote items
    const quoteItems: IQuoteItem[] = [];
    for (const item of items || []) {
      const quoteItem = await quoteModuleService.createQuoteItems({
        quote_id: quote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        sku: item.sku,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: String(Number(item.unit_price) * Number(item.quantity)),
        total: String(Number(item.unit_price) * Number(item.quantity)),
      });
      quoteItems.push(quoteItem);
    }

    // Calculate totals
    await quoteModuleService.calculateQuoteTotals(quote.id);

    const updatedQuote = await quoteModuleService.retrieveQuote(quote.id);
    let fetchedItems: any[] = [];
    try {
      const rawItems = await quoteModuleService.listQuoteItems({
        quote_id: quote.id,
      });
      fetchedItems = Array.isArray(rawItems)
        ? rawItems
        : [rawItems].filter(Boolean);
    } catch {}
    return res.json({ quote: { ...updatedQuote, items: fetchedItems } });
  } catch (error: unknown) {
    handleApiError(res, error, "POST store quotes");
  }
}

/**
 * GET /store/quotes
 * List customer's quotes
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    if (!req.auth_context?.actor_id) {
      return res.json({
        quotes: SEED_QUOTES,
        count: SEED_QUOTES.length,
        public_info: {
          title: "Request a Quote",
          description:
            "Get custom pricing for bulk orders, special requirements, or B2B purchases.",
          how_it_works: [
            "Browse products and add items to your quote request",
            "Submit your quote with any special requirements",
            "Our team reviews and provides custom pricing",
            "Accept the quote to place your order",
          ],
        },
      });
    }

    const quoteModuleService = req.scope.resolve(
      "quote",
    ) as unknown as IQuoteModuleService;
    const customerId = req.auth_context.actor_id;

    const quotes = await quoteModuleService.listQuotes(
      { customer_id: customerId },
      { order: { created_at: "DESC" } },
    );

    return res.json({
      quotes,
      count: Array.isArray(quotes) ? quotes.length : 0,
    });
  } catch (error: unknown) {
    return res.json({
      quotes: SEED_QUOTES,
      count: SEED_QUOTES.length,
      public_info: {
        title: "Request a Quote",
        description:
          "Get custom pricing for bulk orders, special requirements, or B2B purchases.",
      },
    });
  }
}
