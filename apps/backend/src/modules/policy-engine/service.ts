import { MedusaService } from "@medusajs/framework/utils";
import { PolicyRule } from "./models/policy-rule";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:policy-engine");

type PolicyContext = {
  customer?: { id?: string; credentials?: string[]; type?: string };
  offer?: {
    id?: string;
    offer_type?: string;
    base_price?: number;
    source_module?: string;
  };
  cart?: { item_count?: number; coupon_applied?: boolean; total?: number };
  context?: { ip_country?: string; jurisdiction?: string; node_id?: string };
  actor?: { type?: string; id?: string };
};

type PolicyDecision = {
  allowed: boolean;
  action: string;
  action_payload: Record<string, unknown> | null;
  rule_id: string | null;
  rule_name: string | null;
  explanation: string;
};

type PolicyEvalResult = {
  granted: boolean;
  decisions: PolicyDecision[];
  reasoning_chain: Array<{
    rule_name: string;
    matched: boolean;
    action: string;
    explanation: string;
  }>;
  modified_price?: number;
  levies?: Array<{ label: string; pct: number; amount: number }>;
  required_credentials?: string[];
};

class PolicyEngineModuleService extends MedusaService({ PolicyRule }) {
  /**
   * Evaluate all active policy rules for a given offer + actor + context.
   * Rules are evaluated in priority order (lower priority number = first).
   * First blocking rule terminates evaluation.
   * Non-blocking rules (pricing modifiers, levies) accumulate.
   */
  async evaluate(
    offerOrContext: PolicyContext,
    options: { dryRun?: boolean; jurisdictionOverride?: string } = {},
  ): Promise<PolicyEvalResult> {
    const ctx = offerOrContext;

    // Load all active rules sorted by priority
    const rules = (
      (await this.listPolicyRules({ is_active: true })) as any[]
    ).sort((a: any, b: any) => (a.priority ?? 50) - (b.priority ?? 50));

    const decisions: PolicyDecision[] = [];
    const reasoning_chain: PolicyEvalResult["reasoning_chain"] = [];
    let modifiedPrice = ctx.offer?.base_price;
    const levies: Array<{ label: string; pct: number; amount: number }> = [];
    const requiredCredentials: string[] = [];

    for (const rule of rules) {
      // Scope filter
      if (!this._ruleAppliesTo(rule, ctx)) continue;

      const matched = this._evalCondition(rule.condition_dsl, ctx);
      reasoning_chain.push({
        rule_name: rule.rule_name,
        matched,
        action: matched ? rule.action : "skipped",
        explanation: matched
          ? (rule.explanation ?? rule.rule_name)
          : `condition not met`,
      });

      if (!matched) continue;

      const decision: PolicyDecision = {
        allowed: !["block"].includes(rule.action),
        action: rule.action,
        action_payload: rule.action_payload ?? null,
        rule_id: rule.id,
        rule_name: rule.rule_name,
        explanation: rule.explanation ?? rule.rule_name,
      };
      decisions.push(decision);

      // Hard block — stop evaluation
      if (rule.action === "block") {
        logger.info(
          `Policy BLOCK: ${rule.rule_name} blocked offer ${ctx.offer?.id ?? ""}`,
        );
        return {
          granted: false,
          decisions,
          reasoning_chain,
          required_credentials: requiredCredentials,
        };
      }

      // Accumulate pricing modification
      if (rule.action === "modify_price" && modifiedPrice !== undefined) {
        const payload = (rule.action_payload as any) ?? {};
        if (payload.discount_pct)
          modifiedPrice = modifiedPrice * (1 - payload.discount_pct / 100);
        if (payload.fixed_price) modifiedPrice = payload.fixed_price;
      }

      // Accumulate levy
      if (rule.action === "add_levy" && modifiedPrice !== undefined) {
        const payload = (rule.action_payload as any) ?? {};
        if (payload.levy_pct) {
          levies.push({
            label: payload.levy_label ?? "levy",
            pct: payload.levy_pct,
            amount: modifiedPrice * (payload.levy_pct / 100),
          });
        }
      }

      // Credential requirement
      if (rule.action === "require_credential") {
        const payload = (rule.action_payload as any) ?? {};
        if (payload.credential_required)
          requiredCredentials.push(payload.credential_required);
      }
    }

    return {
      granted: true,
      decisions,
      reasoning_chain,
      modified_price: modifiedPrice,
      levies: levies.length > 0 ? levies : undefined,
      required_credentials:
        requiredCredentials.length > 0 ? requiredCredentials : undefined,
    };
  }

  /**
   * Dry-run evaluation with full reasoning chain — for pricing explain API.
   */
  async explain(ctx: PolicyContext): Promise<PolicyEvalResult> {
    return this.evaluate(ctx, { dryRun: true });
  }

  /**
   * Check if a rule's scope filters match the current context.
   */
  private _ruleAppliesTo(rule: any, ctx: PolicyContext): boolean {
    const offerTypes: string[] | null = rule.applies_to_offer_types;
    const actorTypes: string[] | null = rule.applies_to_actor_types;
    const jurisdictions: string[] | null = rule.applies_to_jurisdictions;

    if (
      offerTypes &&
      ctx.offer?.offer_type &&
      !offerTypes.includes(ctx.offer.offer_type)
    )
      return false;
    if (actorTypes && ctx.actor?.type && !actorTypes.includes(ctx.actor.type))
      return false;
    if (
      jurisdictions &&
      ctx.context?.jurisdiction &&
      !jurisdictions.includes(ctx.context.jurisdiction)
    )
      return false;
    return true;
  }

  /**
   * Evaluate a JSON DSL condition node against the context.
   * Supports: "and" | "or" | leaf { field, op, value }
   */
  private _evalCondition(dsl: any, ctx: PolicyContext): boolean {
    if (!dsl) return true;
    if (dsl.and)
      return (dsl.and as any[]).every((node: any) =>
        this._evalCondition(node, ctx),
      );
    if (dsl.or)
      return (dsl.or as any[]).some((node: any) =>
        this._evalCondition(node, ctx),
      );

    const { field, op, value } = dsl as {
      field: string;
      op: string;
      value: unknown;
    };
    const actual = this._resolveField(field, ctx);

    switch (op) {
      case "equals":
        return actual === value;
      case "not_equals":
        return actual !== value;
      case "gt":
        return typeof actual === "number" && actual > (value as number);
      case "lt":
        return typeof actual === "number" && actual < (value as number);
      case "gte":
        return typeof actual === "number" && actual >= (value as number);
      case "lte":
        return typeof actual === "number" && actual <= (value as number);
      case "contains":
        return Array.isArray(actual)
          ? actual.includes(value)
          : String(actual ?? "").includes(String(value));
      case "not_contains":
        return Array.isArray(actual)
          ? !actual.includes(value)
          : !String(actual ?? "").includes(String(value));
      case "in":
        return Array.isArray(value) && value.includes(actual);
      case "not_in":
        return Array.isArray(value) && !value.includes(actual);
      case "exists":
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }

  /** Resolve a dot-notation field path against the context. */
  private _resolveField(field: string, ctx: PolicyContext): unknown {
    const parts = field.split(".");
    let cur: any = ctx;
    for (const part of parts) {
      if (cur == null) return undefined;
      cur = cur[part];
    }
    return cur;
  }
}

export default PolicyEngineModuleService;
