import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { REVENUE_TOPOLOGY_MODULE } from "../../../../modules/revenue-topology";
import type RevenueTopologyModuleService from "../../../../modules/revenue-topology/service";

/**
 * GET /admin/custom/revenue-topology
 *
 * Returns all RevenueSplitRules for the revenue topology admin UI.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    REVENUE_TOPOLOGY_MODULE,
  ) as unknown as RevenueTopologyModuleService;
  const rules = await svc.listRevenueSplitRules(
    {},
    { take: parseInt((req.query.limit as string) ?? "100") },
  );
  res.json({ rules, count: Array.isArray(rules) ? rules.length : 0 });
}

/**
 * POST /admin/custom/revenue-topology
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    REVENUE_TOPOLOGY_MODULE,
  ) as unknown as RevenueTopologyModuleService;
  const body = req.body as {
    label: string;
    node_id: string;
    parent_node_id?: string;
    split_type: "percentage" | "fixed" | "residual" | "levy";
    split_value: number;
    value_base?: "gross" | "net" | "settlement";
    ledger_account_type: string;
    ledger_account_id: string;
    priority?: number;
    applies_to_offer_types?: string[] | null;
    is_active?: boolean;
  };
  const rule = await svc.createRevenueSplitRules({
    label: body.label ?? body.node_id,
    node_id: body.node_id,
    parent_node_id: body.parent_node_id ?? null,
    split_type: body.split_type,
    split_value: body.split_value,
    value_base: body.value_base ?? "gross",
    ledger_account_type: body.ledger_account_type,
    ledger_account_id: body.ledger_account_id,
    priority: body.priority ?? 10,
    applies_to_offer_types: body.applies_to_offer_types ?? null,
    is_active: body.is_active ?? true,
  } as any);
  res.status(201).json(rule);
}
