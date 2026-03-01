import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  podQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/print-on-demand
 * Phase 5: query.graph() fetching products linked to PodProduct extensions.
 * POD items have virtual inventory; customization options stored in pod_product.
 */

const SEED_POD = [
  {
    id: "prod_pod_seed_001",
    title: "Custom T-Shirt",
    description: "High-quality cotton t-shirt with your custom design.",
    thumbnail: "/seed-images/pod/tshirt.jpg",
    pod_product: {
      template_url: "/templates/tshirt-front.svg",
      print_provider: "printful",
      customization_options: {
        colors: ["white", "black", "navy"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      base_cost: 1200,
    },
    metadata: { vertical: "print-on-demand" },
  },
  {
    id: "prod_pod_seed_002",
    title: "Custom Mug",
    description: "11oz ceramic mug with full-wrap print.",
    thumbnail: "/seed-images/pod/mug.jpg",
    pod_product: {
      template_url: "/templates/mug-wrap.svg",
      print_provider: "printify",
      customization_options: {
        wrap: "full",
        materials: ["ceramic", "polymer"],
      },
      base_cost: 600,
    },
    metadata: { vertical: "print-on-demand" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, podQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, print_provider } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "print-on-demand",
    };
    if (tenant_id) filters["pod_product.tenant_id"] = tenant_id;
    if (print_provider) filters["pod_product.print_provider"] = print_provider;
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
        "pod_product.id",
        "pod_product.template_url",
        "pod_product.print_provider",
        "pod_product.customization_options",
        "pod_product.base_cost",
      ],
      filters,
      pagination: { skip: offset, take: limit },
    });

    const items = products?.length > 0 ? products : SEED_POD;
    return res.json({
      items,
      count: metadata?.count ?? items.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[print-on-demand/route] ${msg}`);
    return res.json({
      items: SEED_POD,
      count: SEED_POD.length,
      limit,
      offset,
    });
  }
}
