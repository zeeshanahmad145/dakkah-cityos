import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GROCERY_MODULE } from "../modules/grocery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateGroceryProductInput {
  tenant_id: string;
  // Medusa product fields
  title: string;
  description?: string;
  thumbnail?: string;
  price_amount: number;
  currency_code?: string;
  // FreshProduct domain fields
  storage_type: "ambient" | "chilled" | "frozen" | "live";
  shelf_life_days: number;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  origin_country?: string;
  organic?: boolean;
  unit_type: "piece" | "kg" | "gram" | "liter" | "bunch" | "pack";
  min_order_quantity?: number;
  is_seasonal?: boolean;
  season_start?: string;
  season_end?: string;
  nutrition_info?: Record<string, unknown>;
}

// ─── Step 1: Create Medusa Product ───────────────────────────────────────────

const createMedusaProductStep = createStep(
  "create-medusa-product-step",
  async (input: CreateGroceryProductInput, { container }) => {
    const productService = container.resolve(Modules.PRODUCT);

    // Create the Medusa product (variants without prices — pricing module handles prices)
    const [product] = await productService.createProducts([
      {
        title: input.title,
        description: input.description,
        status: "published" as const,
        images: input.thumbnail ? [{ url: input.thumbnail }] : [],
        variants: [
          {
            title: input.unit_type,
          },
        ],
        metadata: { vertical: "grocery", tenant_id: input.tenant_id },
      },
    ] as any);

    // Add the price via the pricing module
    const pricingService = container.resolve(Modules.PRICING);
    const [priceSet] = await pricingService.createPriceSets([
      {
        prices: [
          {
            amount: Math.round(input.price_amount * 100),
            currency_code: input.currency_code ?? "sar",
          },
        ],
      },
    ]);

    // Link variant → price set
    await pricingService.createPriceRules([
      {
        price_set_id: priceSet.id,
        attribute: "variant_id",
        value: (product as any).variants?.[0]?.id ?? "",
      },
    ] as any);

    return new StepResponse(product, product.id);
  },
  // Compensation — delete product if subsequent steps fail
  async (productId, { container }) => {
    if (!productId) return;
    const productService = container.resolve(Modules.PRODUCT);
    await productService.deleteProducts([productId]);
  },
);

// ─── Step 2: Create FreshProduct Extension ───────────────────────────────────

const createFreshProductExtensionStep = createStep(
  "create-fresh-product-extension-step",
  async (
    { product, input }: { product: any; input: CreateGroceryProductInput },
    { container },
  ) => {
    const groceryService = container.resolve(GROCERY_MODULE);

    const [freshProduct] = await (groceryService as any).createFreshProducts([
      {
        tenant_id: input.tenant_id,
        storage_type: input.storage_type,
        shelf_life_days: input.shelf_life_days,
        optimal_temp_min: input.optimal_temp_min ?? null,
        optimal_temp_max: input.optimal_temp_max ?? null,
        origin_country: input.origin_country ?? null,
        organic: input.organic ?? false,
        unit_type: input.unit_type,
        min_order_quantity: input.min_order_quantity ?? 1,
        is_seasonal: input.is_seasonal ?? false,
        season_start: input.season_start ?? null,
        season_end: input.season_end ?? null,
        nutrition_info: input.nutrition_info ?? null,
      },
    ]);

    // Create the product ↔ freshProduct link
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
    await remoteLink.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [GROCERY_MODULE]: { fresh_product_id: freshProduct.id },
    });

    return new StepResponse(freshProduct, freshProduct.id);
  },
  // Compensation — delete freshProduct if link creation failed
  async (freshProductId, { container }) => {
    if (!freshProductId) return;
    const groceryService = container.resolve(GROCERY_MODULE);
    await (groceryService as any).deleteFreshProducts([freshProductId]);
  },
);

// ─── Workflow ────────────────────────────────────────────────────────────────

export const createGroceryProductWorkflow = createWorkflow(
  "create-grocery-product",
  (input: CreateGroceryProductInput) => {
    const product = createMedusaProductStep(input);
    const freshProduct = createFreshProductExtensionStep({ product, input });
    return new WorkflowResponse({ product, freshProduct });
  },
);
