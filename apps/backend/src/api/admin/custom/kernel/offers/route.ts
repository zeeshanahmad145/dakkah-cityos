import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { KERNEL_MODULE } from "../../../../../modules/kernel";
import type KernelModuleService from "../../../../../modules/kernel/service";

/**
 * GET /admin/custom/kernel/offers
 *
 * Read-only browse of all Offer records in the universal kernel registry.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    KERNEL_MODULE,
  ) as unknown as KernelModuleService;
  const limit = parseInt((req.query.limit as string) ?? "100");
  const filter: Record<string, unknown> = {};
  if (req.query.offer_type) filter.offer_type = req.query.offer_type;
  if (req.query.lifecycle_state)
    filter.lifecycle_state = req.query.lifecycle_state;

  const offers = await svc.listOffers(filter, {
    take: limit,
    order: { created_at: "DESC" } as any,
  });
  res.json({ offers, count: Array.isArray(offers) ? offers.length : 0 });
}
