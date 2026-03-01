import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { createLogger } from "../../lib/logger";
const logger = createLogger("middlewares-node-context");

export interface NodeContextData {
  tenantId: string;
  tenantSlug: string;
  locale: string;
  channel: string;
  nodeId?: string;
  nodeType?: string;
  userId?: string;
  personaId?: string;
  residencyZone?: string;
}

declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    nodeContext?: NodeContextData;
  }
}

export async function nodeContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const tenantSlug =
    (req.headers["x-tenant-slug"] as string) ||
    (req.query?.tenant_slug as string);
  const locale =
    (req.headers["x-locale"] as string) ||
    (req.query?.locale as string) ||
    "en";
  const channel =
    (req.headers["x-channel"] as string) ||
    (req.query?.channel as string) ||
    "web";
  const nodeId =
    (req.headers["x-node-id"] as string) || (req.query?.node_id as string);
  const personaId =
    (req.headers["x-persona-id"] as string) ||
    (req.query?.persona_id as string);

  if (!tenantSlug) {
    return next();
  }

  try {
    const tenantModule = req.scope.resolve("tenant") as unknown as any;
    const tenant = await tenantModule.retrieveTenantBySlug(tenantSlug);

    if (!tenant) {
      return next();
    }

    let nodeType: string | undefined;
    if (nodeId) {
      try {
        const nodeModule = req.scope.resolve("node") as unknown as any;
        const node = await nodeModule.retrieveNode(nodeId);
        nodeType = node?.type;
      } catch (e) {}
    }

    req.nodeContext = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      locale,
      channel,
      nodeId,
      nodeType,
      userId: req.auth_context?.actor_id,
      personaId,
      residencyZone: tenant.residency_zone,
    };
  } catch (error) {
    logger.error("NodeContext middleware error:", error);
  }

  return next();
}
