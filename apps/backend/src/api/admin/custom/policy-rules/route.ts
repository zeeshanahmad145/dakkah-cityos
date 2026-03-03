import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { POLICY_ENGINE_MODULE } from "../../../../modules/policy-engine";
import type PolicyEngineModuleService from "../../../../modules/policy-engine/service";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:policy-rules");

/**
 * GET /admin/custom/policy-rules
 *
 * Returns all PolicyRule records for the admin policy-engine UI.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    POLICY_ENGINE_MODULE,
  ) as unknown as PolicyEngineModuleService;
  const limit = parseInt((req.query.limit as string) ?? "100");
  const rules = await svc.listPolicyRules({ is_active: true }, { take: limit });
  res.json({
    policy_rules: rules,
    count: Array.isArray(rules) ? rules.length : 0,
  });
}

/**
 * POST /admin/custom/policy-rules
 *
 * Creates a new policy rule via the PolicyEngineModuleService.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    POLICY_ENGINE_MODULE,
  ) as unknown as PolicyEngineModuleService;
  const body = req.body as {
    rule_name: string;
    rule_type: string;
    priority: number;
    condition_dsl: Record<string, unknown>;
    action: string;
    explanation?: string;
    is_active?: boolean;
  };
  const rule = await svc.createPolicyRules({
    rule_name: body.rule_name,
    rule_type: body.rule_type as any,
    priority: body.priority ?? 50,
    condition_dsl: body.condition_dsl,
    action: body.action as any,
    action_payload: {},
    explanation: body.explanation ?? "",
    is_active: body.is_active ?? true,
    scope_offer_types: null,
    scope_actor_types: null,
    scope_jurisdictions: null,
  } as any);
  res.status(201).json(rule);
}
