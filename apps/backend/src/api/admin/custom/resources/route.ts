import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { RESOURCE_MODULE } from "../../../../modules/resource";
import type ResourceModuleService from "../../../../modules/resource/service";

/**
 * GET /admin/custom/resources
 *
 * Returns all Resource records for the capacity management admin UI.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    RESOURCE_MODULE,
  ) as unknown as ResourceModuleService;
  const limit = parseInt((req.query.limit as string) ?? "100");
  const resources = await svc.listResources(
    {},
    { take: limit, order: { created_at: "DESC" } as any },
  );
  res.json({
    resources,
    count: Array.isArray(resources) ? resources.length : 0,
  });
}

/**
 * POST /admin/custom/resources
 *
 * Creates a resource directly using createResources (for admin-registered capacity).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    RESOURCE_MODULE,
  ) as unknown as ResourceModuleService;
  const body = req.body as {
    resource_type?: string;
    capacity_model?: string;
    ownership_model?: string;
    transferability?: string;
    availability_engine?: string;
    total_capacity?: number;
    source_module?: string;
    source_id?: string;
    tenant_id?: string;
    vendor_id?: string;
    is_active?: boolean;
  };
  const resource = await (svc as any).createResources({
    resource_type: body.resource_type ?? "pool",
    capacity_model: body.capacity_model ?? "fixed",
    ownership_model: body.ownership_model ?? "owned",
    transferability: body.transferability ?? "restricted",
    availability_engine: body.availability_engine ?? "manual",
    total_capacity: body.total_capacity ?? null,
    available_capacity: body.total_capacity ?? null,
    source_module: body.source_module ?? "admin",
    source_id: body.source_id ?? `admin_${Date.now()}`,
    tenant_id: body.tenant_id ?? null,
    vendor_id: body.vendor_id ?? null,
    is_active: body.is_active ?? true,
    metadata: null,
  });
  res.status(201).json(resource);
}
