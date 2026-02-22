/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const quoteItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  title: z.string().min(1),
  sku: z.string().optional(),
  thumbnail: z.string().optional(),
  quantity: z.number().min(1),
  unit_price: z.union([z.string(), z.number()]),
})

const createQuoteSchema = z.object({
  items: z.array(quoteItemSchema).optional(),
  customer_notes: z.string().optional(),
  company_id: z.string().optional(),
  tenant_id: z.string().optional(),
  region_id: z.string().optional(),
  store_id: z.string().optional(),
})

/**
 * POST /store/quotes
 * Create a new quote request
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;

    const parsed = createQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const { items, customer_notes, company_id, tenant_id, region_id, store_id } = parsed.data;

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
    const quoteItems: any[] = [];
    for (const item of ((items || []) as any[])) {
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

    // Retrieve updated quote
    const updatedQuote = await quoteModuleService.retrieveQuote(quote.id, {
      relations: ["items"],
    });

    res.json({ quote: updatedQuote });

  } catch (error: any) {
    handleApiError(res, error, "POST store quotes")}
}

/**
 * GET /store/quotes
 * List customer's quotes
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModuleService = req.scope.resolve("quoteModuleService") as any;

    if (!req.auth_context?.actor_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customerId = req.auth_context.actor_id;

    const quotes = await quoteModuleService.listQuotes(
      {
        customer_id: customerId,
      },
      {
        order: { created_at: "DESC" },
      }
    );

    res.json({ quotes, count: Array.isArray(quotes) ? quotes.length : 0 });

  } catch (error: any) {
    handleApiError(res, error, "GET store quotes")}
}

