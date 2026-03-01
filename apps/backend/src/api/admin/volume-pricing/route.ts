// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

const createVolumePricingSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    applies_to: z.string(),
    target_id: z.string().optional(),
    pricing_type: z.string(),
    company_id: z.string().optional(),
    company_tier: z.string().optional(),
    priority: z.number().optional(),
    status: z.string().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    tiers: z.array(
      z
        .object({
          min_quantity: z.number(),
          max_quantity: z.number().optional(),
          discount_percentage: z.number().optional(),
          discount_amount: z.number().optional(),
          fixed_price: z.number().optional(),
          currency_code: z.string().optional(),
        })
        .passthrough(),
    ),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

// GET /admin/volume-pricing - List all volume pricing rules
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

    const { status, applies_to, company_id } = req.query;

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (applies_to) filters.applies_to = applies_to;
    if (company_id) filters.company_id = company_id;

    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: [
        "id",
        "name",
        "description",
        "applies_to",
        "target_id",
        "pricing_type",
        "company_id",
        "company_tier",
        "priority",
        "status",
        "starts_at",
        "ends_at",
        "metadata",
        "created_at",
        "updated_at",
      ],
      filters,
    });

    // Fetch tiers for each rule
    const enrichedRules = await Promise.all(
      rules.map(async (rule: Record<string, unknown>) => {
        const { data: tiers } = await query.graph({
          entity: "volume_pricing_tier",
          fields: [
            "id",
            "volume_pricing_id",
            "min_quantity",
            "max_quantity",
            "discount_percentage",
            "discount_amount",
            "fixed_price",
            "currency_code",
          ],
          filters: { volume_pricing_id: rule.id },
        });

        // Fetch target info if applicable
        let target = null;
        if (rule.target_id) {
          if (rule.applies_to === "product") {
            const { data: products } = await query.graph({
              entity: "product",
              fields: ["id", "title", "thumbnail"],
              filters: { id: rule.target_id },
            });
            target = products[0] || null;
          } else if (rule.applies_to === "collection") {
            const { data: collections } = await query.graph({
              entity: "product_collection",
              fields: ["id", "title"],
              filters: { id: rule.target_id },
            });
            target = collections[0] || null;
          } else if (rule.applies_to === "category") {
            const { data: categories } = await query.graph({
              entity: "product_category",
              fields: ["id", "name"],
              filters: { id: rule.target_id },
            });
            target = categories[0] || null;
          }
        }

        return { ...rule, tiers, target };
      }),
    );

    res.json({ rules: enrichedRules });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin volume-pricing");
  }
}

// POST /admin/volume-pricing - Create a new volume pricing rule
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const volumePricingModule = req.scope.resolve("volumePricing") as unknown as any;

    const parsed = createVolumePricingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const {
      name,
      description,
      applies_to,
      target_id,
      pricing_type,
      company_id,
      company_tier,
      priority,
      status,
      starts_at,
      ends_at,
      tiers,
      metadata,
    } = parsed.data;

    // Create the rule
    const rule = await volumePricingModule.createVolumePricings({
      name,
      description,
      applies_to,
      target_id,
      pricing_type,
      company_id,
      company_tier,
      priority: priority || 0,
      status: status || "active",
      starts_at: starts_at ? new Date(starts_at) : null,
      ends_at: ends_at ? new Date(ends_at) : null,
      tenant_id:
        (req.query.tenant_id as string) ||
        req.tenant_id ||
        "01KGZ2JRYX607FWMMYQNQRKVWS",
      metadata,
    });

    // Create tiers
    const createdTiers = await Promise.all(
      tiers.map((tier) =>
        volumePricingModule.createVolumePricingTiers({
          volume_pricing_id: rule.id,
          ...tier,
        }),
      ),
    );

    res.status(201).json({ rule: { ...rule, tiers: createdTiers } });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin volume-pricing");
  }
}
