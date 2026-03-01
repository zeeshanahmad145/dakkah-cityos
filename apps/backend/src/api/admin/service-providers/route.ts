import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createProviderSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    avatar_url: z.string().optional(),
    is_active: z.boolean().optional(),
    color: z.string().optional(),
    timezone: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve("booking") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;

    // Bypass query.graph and fetch directly using the booking module
    const providers = await bookingModuleService.listServiceProviders(
      {},
      { skip: Number(offset), take: Number(limit) },
    );

    res.json({
      providers,
      count: Array.isArray(providers) ? providers.length : 0,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin service-providers");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve("booking") as unknown as any;

    const parsed = createProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const provider = await bookingModuleService.createServiceProviders(
      parsed.data,
    );

    res.status(201).json({ provider });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin service-providers");
  }
}
