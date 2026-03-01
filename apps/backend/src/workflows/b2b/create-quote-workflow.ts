import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

interface CreateQuoteInput {
  company_id: string;
  customer_id: string;
  tenant_id: string;
  store_id?: string;
  region_id?: string;
  items: Array<{
    product_id: string;
    variant_id: string;
    quantity: number;
    custom_unit_price?: string;
  }>;
  customer_notes?: string;
  valid_days?: number;
}

// Step 1: Generate quote number
const generateQuoteNumberStep = createStep(
  "generate-quote-number",
  async (input: CreateQuoteInput, { container }) => {
    const quoteService = container.resolve("quote") as unknown as any;
    const quoteNumber = await quoteService.generateQuoteNumber();
    return new StepResponse({ quoteNumber, input }, null);
  },
);

// Step 2: Get product info
const getProductInfoStep = createStep(
  "get-product-info",
  async ({ input }: { input: CreateQuoteInput }, { container }) => {
    const productService = container.resolve(Modules.PRODUCT) as unknown as any;
    const products: Record<string, unknown>[] = [];

    for (const item of input.items) {
      const product = await productService.retrieveProduct(item.product_id, {
        relations: ["variants", "variants.prices"],
      });
      const variants = product.variants as Array<Record<string, unknown>>;
      const variant = variants?.find(
        (v: Record<string, unknown>) => v.id === item.variant_id,
      );
      const prices = variant?.prices as Array<Record<string, unknown>>;
      const price = prices?.[0];

      products.push({
        ...item,
        title: product.title,
        description: product.description,
        sku: variant?.sku,
        thumbnail: product.thumbnail,
        unit_price: price?.amount?.toString() || "0",
      });
    }

    return new StepResponse({ products }, null);
  },
);

// Step 3: Create quote
const createQuoteStep = createStep(
  "create-quote",
  async (
    {
      input,
      quoteNumber,
      products,
    }: {
      input: CreateQuoteInput;
      quoteNumber: string;
      products: Record<string, unknown>[];
    },
    { container },
  ) => {
    const quoteService = container.resolve("quote") as unknown as any;

    const validUntil = input.valid_days
      ? new Date(Date.now() + input.valid_days * 24 * 60 * 60 * 1000)
      : null;

    const quote = await quoteService.createQuotes({
      quote_number: quoteNumber,
      company_id: input.company_id,
      customer_id: input.customer_id,
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      region_id: input.region_id,
      status: "draft",
      customer_notes: input.customer_notes,
      valid_until: validUntil,
    });

    return new StepResponse({ quote }, { quoteId: quote.id });
  },
  async (compensationData: { quoteId: string }, { container }) => {
    if (!compensationData?.quoteId) return;
    try {
      const quoteService = container.resolve("quote") as unknown as any;
      await quoteService.deleteQuotes(compensationData.quoteId);
    } catch (error) {}
  },
);

// Step 4: Create quote items
const createQuoteItemsStep = createStep(
  "create-quote-items",
  async (
    {
      quote,
      products,
    }: { quote: Record<string, unknown>; products: Record<string, unknown>[] },
    { container },
  ) => {
    const quoteService = container.resolve("quote") as unknown as any;

    const items: Record<string, unknown>[] = [];
    for (const item of products) {
      const unitPrice = (item.custom_unit_price || item.unit_price) as string;
      const quantity = item.quantity as number;
      const subtotal = BigInt(unitPrice) * BigInt(quantity);

      const quoteItem = await quoteService.createQuoteItems({
        quote_id: quote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        description: item.description,
        sku: item.sku,
        thumbnail: item.thumbnail,
        quantity: quantity,
        unit_price: item.unit_price,
        custom_unit_price: item.custom_unit_price,
        subtotal: subtotal.toString(),
        total: subtotal.toString(),
      });
      items.push(quoteItem);
    }

    return new StepResponse(
      { items },
      { itemIds: items.map((i: Record<string, unknown>) => i.id as string) },
    );
  },
  async (compensationData: { itemIds: string[] }, { container }) => {
    if (!compensationData?.itemIds?.length) return;
    try {
      const quoteService = container.resolve("quote") as unknown as any;
      for (const itemId of compensationData.itemIds) {
        await quoteService.deleteQuoteItems(itemId);
      }
    } catch (error) {}
  },
);

// Step 5: Calculate totals
const calculateQuoteTotalsStep = createStep(
  "calculate-quote-totals",
  async ({ quote }: { quote: Record<string, unknown> }, { container }) => {
    const quoteService = container.resolve("quote") as unknown as any;
    await quoteService.calculateQuoteTotals(quote.id as string);
    return new StepResponse({ success: true }, null);
  },
);

/**
 * Create B2B Quote Workflow
 *
 * Creates a new quote request from a company.
 * Generates quote number and calculates totals.
 */
export const createQuoteWorkflow = createWorkflow(
  "create-quote",
  (input: CreateQuoteInput) => {
    // 1. Generate quote number
    const { quoteNumber } = generateQuoteNumberStep(input);

    // 2. Get product info for line items
    const { products } = getProductInfoStep({ input });

    // 3. Create quote
    const { quote } = createQuoteStep({ input, quoteNumber, products });

    // 4. Create quote items
    createQuoteItemsStep({ quote, products });

    // 5. Calculate totals
    calculateQuoteTotalsStep({ quote });

    return new WorkflowResponse({ quote });
  },
);
