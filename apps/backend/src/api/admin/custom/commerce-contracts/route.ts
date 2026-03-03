import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { COMMERCE_CONTRACT_MODULE } from "../../../../modules/commerce-contract";
import type CommerceContractModuleService from "../../../../modules/commerce-contract/service";

/**
 * GET /admin/custom/commerce-contracts
 *
 * Returns all commerce contracts from the CommerceContractModuleService.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    COMMERCE_CONTRACT_MODULE,
  ) as unknown as CommerceContractModuleService;
  const limit = parseInt((req.query.limit as string) ?? "50");
  const contracts = await svc.listCommerceContracts(
    {},
    { take: limit, order: { created_at: "DESC" } as any },
  );
  res.json({
    contracts,
    count: Array.isArray(contracts) ? contracts.length : 0,
  });
}
