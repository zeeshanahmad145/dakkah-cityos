import type { TenantContext } from "../api/middlewares/tenant-context"

/**
 * Tenant Scoping Utilities
 * Helpers for enforcing tenant isolation in queries and operations
 */

/**
 * Build tenant filter for product queries
 * Ensures products are filtered by tenant + sales channel
 */
export function buildTenantProductFilter(tenantContext: TenantContext, additionalFilters: any = {}) {
  const filters: Record<string, unknown> = {
    ...additionalFilters,
  }

  // Add tenant metadata filter
  if (tenantContext.tenant_id) {
    filters["metadata.tenant_id"] = tenantContext.tenant_id
  }

  // Add store filter if available
  if (tenantContext.store_id) {
    filters["metadata.store_id"] = tenantContext.store_id
  }

  // Add sales channel filter
  if (tenantContext.sales_channel_id) {
    filters.sales_channels = {
      id: tenantContext.sales_channel_id,
    }
  }

  return filters
}

/**
 * Build tenant filter for order queries
 */
export function buildTenantOrderFilter(tenantContext: TenantContext, additionalFilters: any = {}) {
  const filters: Record<string, unknown> = {
    ...additionalFilters,
  }

  // Add sales channel filter
  if (tenantContext.sales_channel_id) {
    filters.sales_channel_id = tenantContext.sales_channel_id
  }

  // Add tenant metadata filter
  if (tenantContext.tenant_id) {
    filters["metadata.tenant_id"] = tenantContext.tenant_id
  }

  return filters
}

/**
 * Build tenant filter for cart queries
 */
export function buildTenantCartFilter(tenantContext: TenantContext, additionalFilters: any = {}) {
  const filters: Record<string, unknown> = {
    ...additionalFilters,
  }

  // Add sales channel filter
  if (tenantContext.sales_channel_id) {
    filters.sales_channel_id = tenantContext.sales_channel_id
  }

  return filters
}

/**
 * Add tenant metadata to entity
 * Call this when creating products, orders, etc.
 */
export function addTenantMetadata(tenantContext: TenantContext, existingMetadata: any = {}) {
  return {
    ...existingMetadata,
    tenant_id: tenantContext.tenant_id,
    store_id: tenantContext.store_id,
    sales_channel_id: tenantContext.sales_channel_id,
    country_id: tenantContext.country_id,
    scope_type: tenantContext.scope_type,
    scope_id: tenantContext.scope_id,
    category_id: tenantContext.category_id,
    subcategory_id: tenantContext.subcategory_id,
  }
}

/**
 * Validate tenant access to resource
 * Throws error if resource doesn't belong to tenant
 */
export function validateTenantAccess(
  resource: any,
  tenantContext: TenantContext,
  resourceType: string = "resource"
) {
  // Check direct tenant_id field
  if (resource.tenant_id && resource.tenant_id !== tenantContext.tenant_id) {
    throw new Error(
      `Access denied: ${resourceType} does not belong to your tenant`
    )
  }

  // Check metadata.tenant_id
  if (resource.metadata?.tenant_id && resource.metadata.tenant_id !== tenantContext.tenant_id) {
    throw new Error(
      `Access denied: ${resourceType} does not belong to your tenant`
    )
  }

  // Check sales channel
  if (tenantContext.sales_channel_id && resource.sales_channel_id) {
    if (resource.sales_channel_id !== tenantContext.sales_channel_id) {
      throw new Error(
        `Access denied: ${resourceType} does not belong to your sales channel`
      )
    }
  }

  return true
}

/**
 * Validate store access to resource
 * More restrictive than tenant validation
 */
export function validateStoreAccess(
  resource: any,
  tenantContext: TenantContext,
  resourceType: string = "resource"
) {
  if (!tenantContext.store_id) {
    throw new Error("Store context required for this operation")
  }

  // Check direct store_id field
  if (resource.store_id && resource.store_id !== tenantContext.store_id) {
    throw new Error(
      `Access denied: ${resourceType} does not belong to your store`
    )
  }

  // Check metadata.store_id
  if (resource.metadata?.store_id && resource.metadata.store_id !== tenantContext.store_id) {
    throw new Error(
      `Access denied: ${resourceType} does not belong to your store`
    )
  }

  // Also validate tenant access
  return validateTenantAccess(resource, tenantContext, resourceType)
}

/**
 * Build CityOS hierarchy filter
 * For filtering across the full hierarchy
 */
export function buildHierarchyFilter(tenantContext: TenantContext) {
  return {
    country_id: tenantContext.country_id,
    scope_type: tenantContext.scope_type,
    scope_id: tenantContext.scope_id,
    category_id: tenantContext.category_id,
    ...(tenantContext.subcategory_id && { subcategory_id: tenantContext.subcategory_id }),
  }
}

/**
 * Get tenant-scoped cache key
 * For caching tenant-specific data
 */
export function getTenantCacheKey(tenantContext: TenantContext, key: string) {
  return `tenant:${tenantContext.tenant_id}:${key}`
}

/**
 * Get store-scoped cache key
 */
export function getStoreCacheKey(tenantContext: TenantContext, key: string) {
  if (!tenantContext.store_id) {
    return getTenantCacheKey(tenantContext, key)
  }
  return `store:${tenantContext.store_id}:${key}`
}
