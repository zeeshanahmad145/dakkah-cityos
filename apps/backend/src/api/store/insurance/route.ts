import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  insuranceQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/insurance
 * Phase 5: query.graph() fetching products linked to InsurancePlan extensions.
 * Policy purchase goes through normal Medusa cart/checkout; subscriber activates InsurancePolicy.
 */

const SEED_DATA = [
  {
    id: "prod_ins_seed_001",
    title: "Comprehensive Health Insurance — Family Plan",
    description:
      "Full inpatient, outpatient, dental and optical coverage for up to 6 family members.",
    thumbnail: "/seed-images/insurance/health-family.jpg",
    ins_plan: {
      plan_type: "health",
      coverage_type: "comprehensive",
      coverage_amount: 500000,
      max_members: 6,
      deductible: 500,
      network_type: "national",
    },
    metadata: { vertical: "insurance" },
  },
  {
    id: "prod_ins_seed_002",
    title: "Third-Party Liability Auto Insurance",
    description: "Mandatory TPL coverage meeting Saudi traffic regulations.",
    thumbnail: "/seed-images/insurance/auto-tpl.jpg",
    ins_plan: {
      plan_type: "auto",
      coverage_type: "tpl",
      coverage_amount: 100000,
      max_members: 1,
      deductible: 0,
      network_type: null,
    },
    metadata: { vertical: "insurance" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, insuranceQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, plan_type, coverage_type } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "insurance",
    };
    if (tenant_id) filters["ins_plan.tenant_id"] = tenant_id;
    if (plan_type) filters["ins_plan.plan_type"] = plan_type;
    if (coverage_type) filters["ins_plan.coverage_type"] = coverage_type;
    if (search) filters.title = { $ilike: `%${search}%` };

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "handle",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "ins_plan.id",
        "ins_plan.plan_type",
        "ins_plan.coverage_type",
        "ins_plan.coverage_amount",
        "ins_plan.max_members",
        "ins_plan.deductible",
        "ins_plan.network_type",
        "ins_plan.waiting_period_days",
        "ins_plan.features",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const plans = products?.length > 0 ? products : SEED_DATA;
    return res.json({
      plans,
      items: plans,
      count: metadata?.count ?? plans.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[insurance/route] ${msg}`);
    return res.json({
      plans: SEED_DATA,
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit,
      offset,
    });
  }
}
