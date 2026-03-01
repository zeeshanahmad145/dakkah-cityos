import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

interface IStoreModuleService {
  listAndCountStores(
    filters: Record<string, unknown>,
    config?: { take?: number; skip?: number },
  ): Promise<[Array<Record<string, unknown>>, number]>;
  retrieveStoreByHandle(
    handle: string,
  ): Promise<Record<string, unknown> | null>;
  createStores(data: Record<string, unknown>): Promise<Record<string, unknown>>;
}
interface ISalesChannelModuleService {
  createSalesChannels(data: Record<string, unknown>): Promise<{ id: string }>;
}

/**
 * Tenant Admin: List Stores in Current Tenant
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantId = req.scope.resolve("adminTenantId") as unknown as
      | string
      | null;

    if (!tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Tenant context required",
      });
    }

    const storeModuleService = req.scope.resolve(
      "storeModuleService",
    ) as unknown as IStoreModuleService;

    const { status, store_type, limit = 50, offset = 0 } = req.query;

    // Build filters
    const filters: Record<string, unknown> = { tenant_id: tenantId };
    if (status) filters.status = status;
    if (store_type) filters.store_type = store_type;

    const [stores, count] = await storeModuleService.listAndCountStores(
      filters,
      {
        take: Number(limit),
        skip: Number(offset),
      },
    );

    res.json({
      stores,
      count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-TENANT-STORES");
  }
}

/**
 * Tenant Admin: Create Store
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantId = req.scope.resolve("adminTenantId") as unknown as
      | string
      | null;

    if (!tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Tenant context required",
      });
    }

    const createStoreSchema = z
      .object({
        handle: z
          .string()
          .min(3)
          .max(50)
          .regex(
            /^[a-z0-9-]+$/,
            "Handle must contain only lowercase letters, numbers, and hyphens",
          ),
        name: z.string().min(1).max(200),
        store_type: z.enum([
          "retail",
          "marketplace",
          "b2b",
          "subscription",
          "hybrid",
        ]),
        subdomain: z.string().optional(),
        custom_domain: z.string().optional(),
        storefront_url: z.string().url("Must be a valid URL").optional(),
        theme_config: z.record(z.string(), z.any()).optional(),
        settings: z.record(z.string(), z.any()).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .passthrough();

    const parsed = createStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const validatedData = parsed.data;

    const storeModuleService = req.scope.resolve(
      "storeModuleService",
    ) as unknown as IStoreModuleService;
    const salesChannelService = req.scope.resolve(
      "salesChannelModuleService",
    ) as unknown as ISalesChannelModuleService;

    // Check handle uniqueness
    const existing = await storeModuleService.retrieveStoreByHandle(
      validatedData.handle,
    );
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "Store handle already exists",
      });
    }

    // Create sales channel for this store
    const salesChannel = await salesChannelService.createSalesChannels({
      name: validatedData.name,
      description: `Sales channel for ${validatedData.name}`,
      is_disabled: false,
    });

    // Create store
    const store = await storeModuleService.createStores({
      ...validatedData,
      tenant_id: tenantId,
      sales_channel_id: salesChannel.id,
      status: "inactive", // Require explicit activation
    });

    res.status(201).json({ store });
  } catch (error: unknown) {
    if (error instanceof Error && (error instanceof Error ? (error as NodeJS.ErrnoException).name : undefined) === "ZodError") {
      return handleApiError(res, error, "ADMIN-TENANT-STORES");
    }
    handleApiError(res, error, "ADMIN-TENANT-STORES");
  }
}
