/**
 * create-restaurant-product workflow
 *
 * Creates a Medusa Product representing a restaurant menu item, then creates
 * the associated MenuItem domain record and links them via defineLink.
 *
 * Usage:
 *   const { result } = await createRestaurantProductWorkflow(container).run({ input })
 *
 * Compensation: If the MenuItem creation or link step fails, the Medusa Product
 * is deleted to prevent orphaned catalog entries.
 */
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { RESTAURANT_MODULE } from "../modules/restaurant";

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateRestaurantProductInput = {
  /** Tenant owning this menu item */
  tenant_id: string;
  /** ID of the menu section this item belongs to */
  menu_id: string;
  /** Restaurant-domain metadata */
  category?: string;
  dietary_tags?: string[];
  allergens?: string[];
  calories?: number;
  prep_time_minutes?: number;
  is_featured?: boolean;
  display_order?: number;
  /** Medusa Product fields */
  title: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  /** For Medusa PriceSet — unit price in smallest currency unit (e.g. halalas) */
  unit_price: number;
  currency_code?: string;
};

// ─── Step 1: Create Medusa Product ────────────────────────────────────────────

const createProductStep = createStep(
  "create-restaurant-medusa-product",
  async (input: CreateRestaurantProductInput, { container }) => {
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            description: input.description ?? null,
            thumbnail: input.thumbnail ?? null,
            images: input.images?.map((url) => ({ url })) ?? [],
            status: "published",
            metadata: {
              vertical: "restaurant",
              tenant_id: input.tenant_id,
              menu_id: input.menu_id,
            },
            options: [{ title: "Default", values: ["Default"] }],
            variants: [
              {
                title: "Default",
                options: { Default: "Default" },
                prices: [
                  {
                    amount: input.unit_price,
                    currency_code: input.currency_code ?? "SAR",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const product = result[0];
    return new StepResponse(product, { productId: product.id });
  },
  // Compensation: remove the product if subsequent steps fail
  async ({ productId }, { container }) => {
    const productService = container.resolve("product") as unknown as any;
    await productService.deleteProducts([productId]);
  },
);

// ─── Step 2: Create MenuItem domain record ────────────────────────────────────

const createMenuItemStep = createStep(
  "create-menu-item-domain-record",
  async (
    {
      input,
      productId,
    }: { input: CreateRestaurantProductInput; productId: string },
    { container },
  ) => {
    const restaurantService = container.resolve(RESTAURANT_MODULE) as unknown as any;
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    const [menuItem] = await restaurantService.createMenuItems([
      {
        tenant_id: input.tenant_id,
        menu_id: input.menu_id,
        category: input.category ?? null,
        dietary_tags: input.dietary_tags ?? [],
        allergens: input.allergens ?? [],
        calories: input.calories ?? null,
        prep_time_minutes: input.prep_time_minutes ?? null,
        is_featured: input.is_featured ?? false,
        display_order: input.display_order ?? 0,
      },
    ]);

    // Create the product ↔ menu_item link
    await remoteLink.create([
      {
        [RESTAURANT_MODULE]: { menu_item_id: menuItem.id },
        product: { product_id: productId },
      },
    ]);

    return new StepResponse(
      { menuItemId: menuItem.id },
      { menuItemId: menuItem.id },
    );
  },
  // Compensation: remove MenuItem if link creation fails
  async ({ menuItemId }, { container }) => {
    const restaurantService = container.resolve(RESTAURANT_MODULE) as unknown as any;
    await restaurantService.deleteMenuItems([menuItemId]);
  },
);

// ─── Workflow ──────────────────────────────────────────────────────────────────

export type CreateRestaurantProductResult = {
  productId: string;
  menuItemId: string;
};

export const createRestaurantProductWorkflow = createWorkflow(
  "create-restaurant-product",
  function (
    input: CreateRestaurantProductInput,
  ): WorkflowResponse<CreateRestaurantProductResult> {
    const product = createProductStep(input);
    const { menuItemId } = createMenuItemStep({ input, productId: product.id });
    return new WorkflowResponse({ productId: product.id, menuItemId });
  },
);
