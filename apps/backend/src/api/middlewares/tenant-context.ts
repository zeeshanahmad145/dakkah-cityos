import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { createLogger } from "../../lib/logger";

const logger = createLogger("middlewares-tenant-context");

/** Minimal typed shape for tenant records returned by MedusaService */
interface TenantRecord {
  id: string;
  handle: string;
  country_id: string;
  scope_type: "theme" | "city";
  scope_id: string;
  category_id: string;
  subcategory_id?: string;
  status: string;
  tenant_id?: string;
}

/** Minimal typed shape for store records */
interface StoreRecord {
  id: string;
  handle: string;
  sales_channel_id?: string;
  tenant_id?: string;
}

interface ITenantModuleService {
  retrieveTenantByDomain(domain: string): Promise<TenantRecord | null>;
  retrieveStoreByDomain?: (domain: string) => Promise<StoreRecord | null>;
  retrieveTenantBySubdomain(sub: string): Promise<TenantRecord | null>;
  retrieveTenants(id: string): Promise<TenantRecord>;
}

interface IStoreModuleService {
  retrieveStoreByDomain(domain: string): Promise<StoreRecord | null>;
  retrieveStoreBySubdomain(sub: string): Promise<StoreRecord | null>;
  retrieveStoreBySalesChannel(id: string): Promise<StoreRecord | null>;
}

interface ISalesChannelService {
  listSalesChannels(
    filters: Record<string, unknown>,
  ): Promise<Array<{ id: string }>>;
}

/**
 * Tenant Context Interface
 * Attached to req.context for all tenant-scoped operations
 */
export interface TenantContext {
  tenant_id: string;
  tenant_handle: string;
  store_id?: string;
  store_handle?: string;
  sales_channel_id?: string;
  country_id: string;
  scope_type: "theme" | "city";
  scope_id: string;
  category_id: string;
  subcategory_id?: string;
  vendor_id?: string;
  vendor_handle?: string;
}

declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    tenantContext?: TenantContext;
    /** Set by adminContextMiddleware */
    cityosContext?: {
      tenantId: string;
      storeId?: string | null;
      locale: string;
      vendorId?: string;
    };
    /** Set by governance-permission middleware */
    governance_policies?: Record<string, unknown>;
    /** Auth helper properties set by auth middlewares */
    auth?: Record<string, any>;
    /** Set by vendor auth middleware — the authenticated vendor id */
    vendor_id?: string;
    /** Set by request-logger middleware */
    __requestId?: string;
    __startTime?: number;
    /** Alias for tenant_id used in some middleware */
    tenant_id?: string;
  }
}

/**
 * Detect Tenant Middleware
 * Resolves tenant context from:
 * 1. Custom domain (highest priority)
 * 2. Subdomain
 * 3. Publishable API key (fallback)
 *
 * Attaches TenantContext to req.tenantContext
 */
export async function detectTenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const tenantModuleService = req.scope.resolve(
      "tenantModuleService",
    ) as unknown as ITenantModuleService;
    const storeModuleService = req.scope.resolve(
      "storeModuleService",
    ) as unknown as IStoreModuleService;
    const salesChannelService = req.scope.resolve(
      Modules.SALES_CHANNEL,
    ) as unknown as ISalesChannelService;

    // Get hostname from request
    const hostname = req.get("host") || "";
    const parts = hostname.split(".");

    let tenant: TenantRecord | null = null;
    let store: StoreRecord | null = null;

    // Strategy 1: Try custom domain first (exact match)
    if (hostname && !hostname.includes("localhost")) {
      tenant = await tenantModuleService.retrieveTenantByDomain(hostname);
      if (tenant) {
        // Check if store also has this domain
        store = await storeModuleService.retrieveStoreByDomain(hostname);
      }
    }

    // Strategy 2: Try subdomain (format: {subdomain}.{domain}.{tld})
    if (!tenant && parts.length >= 3) {
      const subdomain = parts[0];

      // First check if it's a store subdomain
      store = await storeModuleService.retrieveStoreBySubdomain(subdomain);
      if (store) {
        tenant = await tenantModuleService.retrieveTenants(store.tenant_id);
      } else {
        // Otherwise check tenant subdomain
        tenant = await tenantModuleService.retrieveTenantBySubdomain(subdomain);
      }
    }

    // Strategy 3: Try publishable API key
    if (!tenant) {
      const publishableKey = req.get("x-publishable-api-key");
      if (publishableKey) {
        try {
          // Get sales channel from publishable key
          const sales_channels = await salesChannelService.listSalesChannels(
            {},
          );

          if (sales_channels && sales_channels.length > 0) {
            const salesChannel = sales_channels[0];

            // Get store by sales channel
            store = await storeModuleService.retrieveStoreBySalesChannel(
              salesChannel.id,
            );
            if (store) {
              tenant = await tenantModuleService.retrieveTenants(
                store.tenant_id,
              );
            }
          }
        } catch (error) {
          // Log but don't fail - will handle missing tenant below
          logger.error("Error resolving tenant from publishable key:", error);
        }
      }
    }

    // If no tenant found, continue without tenant context
    // (Some routes like health checks don't need tenant context)
    if (!tenant) {
      return next();
    }

    // Verify tenant is active
    if (tenant.status === "suspended") {
      return res.status(403).json({
        error: "Tenant Suspended",
        message: "This tenant account is currently suspended.",
      });
    }

    if (tenant.status === "inactive") {
      return res.status(403).json({
        error: "Tenant Inactive",
        message: "This tenant account is not active.",
      });
    }

    // Build tenant context
    const tenantContext: TenantContext = {
      tenant_id: tenant.id,
      tenant_handle: tenant.handle,
      country_id: tenant.country_id,
      scope_type: tenant.scope_type,
      scope_id: tenant.scope_id,
      category_id: tenant.category_id,
      subcategory_id: tenant.subcategory_id,
    };

    // Add store context if available
    if (store) {
      tenantContext.store_id = store.id;
      tenantContext.store_handle = store.handle;
      tenantContext.sales_channel_id = store.sales_channel_id;
    }

    // Check for vendor context (from user session or JWT)
    const authUser = req.auth?.user;
    if (authUser?.vendor_id) {
      tenantContext.vendor_id = authUser.vendor_id;
      tenantContext.vendor_handle = authUser.vendor_handle;
    }

    // Attach to request
    req.tenantContext = tenantContext;

    next();
  } catch (error) {
    logger.error("Tenant detection middleware error:", error);
    res.status(500).json({
      error: "Tenant Resolution Error",
      message: "Failed to resolve tenant context",
    });
  }
}

/**
 * Require Tenant Middleware
 * Enforces that tenant context must be present
 * Use on routes that absolutely require tenant context
 */
export function requireTenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (!req.tenantContext) {
    return res.status(400).json({
      error: "Tenant Required",
      message:
        "This endpoint requires tenant context. Provide a valid domain, subdomain, or publishable API key.",
    });
  }
  next();
}

/**
 * Inject Tenant Context to Container
 * Makes tenant context available to services and workflows
 */
export function injectTenantContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (req.tenantContext) {
    // Add to container for use in services
    req.scope.register({
      tenantContext: {
        resolve: () => req.tenantContext,
      },
    });
  }
  next();
}
