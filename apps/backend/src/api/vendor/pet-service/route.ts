import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(1),
  species: z.enum([
    "dog",
    "cat",
    "bird",
    "fish",
    "reptile",
    "rabbit",
    "hamster",
    "other",
  ]),
  breed: z.string().optional(),
  date_of_birth: z.string().optional(),
  weight_kg: z.number().optional(),
  color: z.string().optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  is_neutered: z.boolean().optional(),
  microchip_id: z.string().optional(),
  medical_notes: z.string().optional(),
  allergies: z.any().optional(),
  vaccinations: z.any().optional(),
  photo_url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("petService") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { owner_id: vendorId };
    if (status) filters.status = status;

    const items = await mod.listPetProfiles(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor pet-service");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("petService") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createPetProfiles({
      ...validation.data,
      owner_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor pet-service");
  }
}
