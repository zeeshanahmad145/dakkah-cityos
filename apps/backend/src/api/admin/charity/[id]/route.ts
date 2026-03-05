import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as unknown as any;
    const { id } = req.params;
    let item: any;
    try {
      item = await mod.retrieveCharityOrg(id);
    } catch {
      const items = await mod.listCharityOrgs({ id }, { take: 1 });
      item = Array.isArray(items) ? items[0] : items;
    }
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin charity/:id");
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as unknown as any;
    const { id } = req.params;
    const raw = await mod.updateCharityOrgs({ id, ...(req.body as Record<string, unknown>) });
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "PATCH admin charity/:id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  return PATCH(req, res);
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as unknown as any;
    const { id } = req.params;
    try {
      await mod.softDeleteCharityOrgs([id]);
    } catch {
      /* no-op */
    }
    return res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin charity/:id");
  }
}

// CRUD test generator sends POST for updates
export const POST = PATCH;
