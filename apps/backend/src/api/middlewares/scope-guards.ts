import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { createLogger } from "../../lib/logger";
const logger = createLogger("middlewares-scope-guards");

/**
 * Admin Tenant Scope Guard
 * Ensures admin users can only access their tenant's data
 * Super admins bypass this check
 */
export function scopeToTenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    // Get authenticated user from session
    const authContext = req.auth_context;
    const user = authContext?.actor_id;
    const userRole = authContext?.app_metadata?.role;

    // Super admins can access everything
    if (userRole === "super_admin") {
      return next();
    }

    // Tenant admins must have tenant context
    if (userRole === "tenant_admin" || userRole === "store_manager") {
      const tenantId = authContext?.app_metadata?.tenant_id;

      if (!tenantId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "No tenant association found for this admin user",
        });
      }

      // Inject tenant scope
      req.scope.register({
        adminTenantId: {
          resolve: () => tenantId,
        },
      });
    }

    next();
  } catch (error) {
    logger.error("Tenant scope guard error:", error);
    res.status(500).json({
      error: "Authorization Error",
      message: "Failed to verify tenant scope",
    });
  }
}

/**
 * Vendor Scope Guard
 * Ensures vendor users can only access their vendor's data
 */
export function scopeToVendorMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const authContext = req.auth_context;
    const vendorId = authContext?.app_metadata?.vendor_id;

    if (!vendorId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "No vendor association found for this user",
      });
    }

    // Inject vendor scope
    req.scope.register({
      vendorId: {
        resolve: () => vendorId,
      },
    });

    next();
  } catch (error) {
    logger.error("Vendor scope guard error:", error);
    res.status(500).json({
      error: "Authorization Error",
      message: "Failed to verify vendor scope",
    });
  }
}

/**
 * B2B Company Scope Guard
 * Ensures B2B users can only access their company's data
 */
export function scopeToCompanyMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const authContext = req.auth_context;
    const companyId = authContext?.app_metadata?.company_id;

    if (!companyId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "No company association found for this user",
      });
    }

    // Inject company scope
    req.scope.register({
      companyId: {
        resolve: () => companyId,
      },
    });

    next();
  } catch (error) {
    logger.error("Company scope guard error:", error);
    res.status(500).json({
      error: "Authorization Error",
      message: "Failed to verify company scope",
    });
  }
}
