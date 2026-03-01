/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateVendorSchema = z
  .object({
    businessName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: z
      .enum(["onboarding", "active", "inactive", "suspended", "terminated"])
      .optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorModule = req.scope.resolve("vendor") as unknown as any;
    const { id } = req.params;

    const [vendor] = await vendorModule.listVendors({ id }, { take: 1 });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json({ vendor });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin vendors id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorModule = req.scope.resolve("vendor") as unknown as any;
    const { id } = req.params;

    const validation = updateVendorSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const vendor = await vendorModule.updateVendors({
      id,
      business_name: validation.data.businessName,
      email: validation.data.email,
      phone: validation.data.phone,
      status: validation.data.status,
      commission_rate: validation.data.commissionRate,
      metadata: validation.data.metadata,
    });

    return res.json({ vendor });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin vendors id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorModule = req.scope.resolve("vendor") as unknown as any;
    const { id } = req.params;

    await vendorModule.deleteVendors([id]);

    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin vendors id");
  }
}
