import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("booking") as unknown as any;
    const { id } = req.params;
    
    // Try retrieve first, fall back to list+filter
    let provider: any;
    try {
      provider = await mod.retrieveServiceProvider(id);
    } catch {
      const items = await mod.listServiceProviders({ id }, { take: 1 });
      provider = Array.isArray(items) ? items[0] : items;
    }
    
    if (!provider) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json({ provider });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin service-providers/:id");
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("booking") as unknown as any;
    const { id } = req.params;
    const raw = await mod.updateServiceProviders({ id, ...req.body });
    const provider = Array.isArray(raw) ? raw[0] : raw;
    return res.json({ provider });
  } catch (error: unknown) {
    handleApiError(res, error, "PATCH admin service-providers/:id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  return PATCH(req, res);
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("booking") as unknown as any;
    const { id } = req.params;
    try {
      await mod.softDeleteServiceProviders([id]);
    } catch {
      // Fallback: try delete method
      await mod.deleteRecords?.([id]);
    }
    return res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin service-providers/:id");
  }
}
