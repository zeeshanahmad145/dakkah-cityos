import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { FREELANCE_MODULE } from "../modules/freelance";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateGigProductInput {
  tenant_id: string;
  freelancer_id: string;
  // Medusa Product fields (catalog)
  title: string;
  description?: string;
  thumbnail?: string;
  price_amount?: number; // fixed price
  hourly_rate_amount?: number; // hourly gigs
  currency_code?: string;
  // GigListing domain fields
  category?: string;
  subcategory?: string;
  listing_type: "fixed_price" | "hourly" | "milestone";
  delivery_time_days?: number;
  revisions_included?: number;
  skill_tags?: string[];
  portfolio_urls?: string[];
}

// ─── Step 1: Create Medusa Product ───────────────────────────────────────────

const createGigMedusaProductStep = createStep(
  "create-gig-medusa-product-step",
  async (input: CreateGigProductInput, { container }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productService = container.resolve(Modules.PRODUCT) as unknown as any;

    // Hourly gigs: create a variant for the hourly rate
    // Fixed-price gigs: create a single variant with the fixed price
    const priceAmount =
      input.listing_type === "hourly"
        ? (input.hourly_rate_amount ?? 0)
        : (input.price_amount ?? 0);

    const variantTitle =
      input.listing_type === "hourly" ? "Per Hour" : "Fixed Price";

    const products = (await productService.createProducts([
      {
        title: input.title,
        description: input.description,
        status: "published" as const,
        tags: [{ value: "freelance-gig" }],
        images: input.thumbnail ? [{ url: input.thumbnail }] : [],
        variants: [{ title: variantTitle }],
        metadata: {
          vertical: "freelance",
          listing_type: input.listing_type,
          tenant_id: input.tenant_id,
          freelancer_id: input.freelancer_id,
        },
      },
    ])) as unknown as Array<{ id: string; [key: string]: unknown }>;
    const product = products[0];

    // Set price via the pricing module
    if (priceAmount > 0) {
      const pricingService = container.resolve(Modules.PRICING);
      await pricingService.createPriceSets([
        {
          prices: [
            {
              amount: Math.round(priceAmount * 100),
              currency_code: input.currency_code ?? "sar",
            },
          ],
        },
      ]);
    }

    return new StepResponse(product, product.id);
  },
  async (productId, { container }) => {
    if (!productId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productService = container.resolve(Modules.PRODUCT) as unknown as any;
    await productService.deleteProducts([productId]);
  },
);

// ─── Step 2: Create GigListing Extension ────────────────────────────────────

const createGigListingExtensionStep = createStep(
  "create-gig-listing-extension-step",
  async (
    {
      product,
      input,
    }: { product: { id: string }; input: CreateGigProductInput },
    { container },
  ) => {
    interface IFreelanceService {
      createGigListings(
        data: Record<string, unknown>[],
      ): Promise<Array<{ id: string }>>;
      deleteGigListings(ids: string[]): Promise<void>;
    }
    const freelanceService = container.resolve(
      FREELANCE_MODULE,
    ) as unknown as IFreelanceService;

    const [gigListing] = await freelanceService.createGigListings([
      {
        tenant_id: input.tenant_id,
        freelancer_id: input.freelancer_id,
        category: input.category ?? null,
        subcategory: input.subcategory ?? null,
        listing_type: input.listing_type,
        delivery_time_days: input.delivery_time_days ?? null,
        revisions_included: input.revisions_included ?? 1,
        skill_tags: input.skill_tags ?? null,
        portfolio_urls: input.portfolio_urls ?? null,
        total_orders: 0,
        avg_rating: null,
      },
    ]);

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
    await remoteLink.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [FREELANCE_MODULE]: { gig_listing_id: gigListing.id },
    });

    return new StepResponse(gigListing, gigListing.id);
  },
  async (gigListingId, { container }) => {
    if (!gigListingId) return;
    const freelanceService = container.resolve(FREELANCE_MODULE) as unknown as {
      deleteGigListings(ids: string[]): Promise<void>;
    };
    await freelanceService.deleteGigListings([gigListingId]);
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const createGigProductWorkflow = createWorkflow(
  "create-gig-product",
  (input: CreateGigProductInput) => {
    const product = createGigMedusaProductStep(input);
    const gigListing = createGigListingExtensionStep({ product, input });
    return new WorkflowResponse({ product, gigListing });
  },
);
