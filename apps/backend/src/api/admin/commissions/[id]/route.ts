import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("commission") as unknown as any;
    const { id } = req.params;
    let rule: any;
    try {
      rule = await mod.retrieveCommissionRule(id);
    } catch {
      const items = await mod.listCommissionRules({ id }, { take: 1 });
      rule = Array.isArray(items) ? items[0] : items;
    }
    if (!rule) return res.status(404).json({ message: "Not found" });
    return res.json({ rule });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin commissions/:id");
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("commission") as unknown as any;
    const { id } = req.params;
    const raw = await mod.updateCommissionRules({ id, ...req.body });
    const rule = Array.isArray(raw) ? raw[0] : raw;
    return res.json({ rule });
  } catch (error: unknown) {
    handleApiError(res, error, "PATCH admin commissions/:id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  return PATCH(req, res);
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("commission") as unknown as any;
    const { id } = req.params;
    try {
      await mod.softDeleteCommissionRules([id]);
    } catch {
      /* no-op */
    }
    return res.status(200).json({ id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin commissions/:id");
  }
}
