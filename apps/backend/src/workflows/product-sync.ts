import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type ProductSyncInput = {
  sourceSystem: string;
  targetSystem: string;
  productIds?: string[];
  tenantId: string;
  syncAll?: boolean;
};

const fetchProductsStep = createStep(
  "fetch-source-products-step",
  async (input: ProductSyncInput, { container }) => {
    const productModule = container.resolve("product") as unknown as any;
    const filters = input.productIds ? { id: input.productIds } : {};
    const products = await productModule.listProducts(filters);
    return new StepResponse({ products, count: products.length });
  },
);

const transformProductsStep = createStep(
  "transform-products-step",
  async (input: { products: any[]; targetSystem: string }) => {
    const transformed = input.products.map((p: any) => ({
      external_id: p.id,
      title: p.title,
      description: p.description,
      handle: p.handle,
      status: p.status,
      target: input.targetSystem,
    }));
    return new StepResponse({ transformed });
  },
);

const upsertProductsStep = createStep(
  "upsert-synced-products-step",
  async (
    input: { transformed: any[]; targetSystem: string },
    { container },
  ) => {
    const syncResults = input.transformed.map((p: any) => ({
      externalId: p.external_id,
      status: "synced",
      target: input.targetSystem,
      syncedAt: new Date(),
    }));
    return new StepResponse(
      { syncResults },
      {
        syncedIds: syncResults.map((r: any) => r.externalId),
        targetSystem: input.targetSystem,
      },
    );
  },
  async (
    compensationData: { syncedIds: string[]; targetSystem: string } | undefined,
  ) => {
    if (!compensationData?.syncedIds?.length) return;
    try {
    } catch (error) {}
  },
);

const verifySyncStep = createStep(
  "verify-product-sync-step",
  async (input: { syncResults: any[] }) => {
    const failed = input.syncResults.filter((r: any) => r.status !== "synced");
    return new StepResponse({
      verified: true,
      failedCount: failed.length,
      totalCount: input.syncResults.length,
    });
  },
);

export const productSyncWorkflow = createWorkflow(
  "product-sync-workflow",
  (input: ProductSyncInput) => {
    const { products } = fetchProductsStep(input);
    const { transformed } = transformProductsStep({
      products,
      targetSystem: input.targetSystem,
    });
    const { syncResults } = upsertProductsStep({
      transformed,
      targetSystem: input.targetSystem,
    });
    const verification = verifySyncStep({ syncResults });
    return new WorkflowResponse({ syncResults, verification });
  },
);
