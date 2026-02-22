import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"
import {
  DEFAULT_TENANT_SLUG,
  PLATFORM_CAPABILITIES,
  CONTEXT_HEADERS,
  HIERARCHY_LEVELS,
  buildNodeHierarchy,
  buildGovernanceChain,
  formatTenantResponse,
  getSystemsSummary,
} from "../../../lib/platform/index"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tenantSlug = (req.query?.tenant || req.query?.tenantId || req.headers["x-cityos-tenant-id"] || DEFAULT_TENANT_SLUG) as string
  const nodeId = (req.query?.node || req.query?.nodeId || req.headers["x-cityos-node-id"]) as string | undefined

  try {
    const tenantModule = req.scope.resolve("tenant") as any
    let nodeModule: any = null
    let governanceModule: any = null
    try { nodeModule = req.scope.resolve("node") } catch { }
    try { governanceModule = req.scope.resolve("governance") } catch { }

    let tenant: any = null
    let isDefaultTenant = false

    try {
      const rawResult = await tenantModule.listTenants({})
      console.log("[PLATFORM-CONTEXT] listTenants({}) raw type:", typeof rawResult, "isArray:", Array.isArray(rawResult))
      if (Array.isArray(rawResult)) {
        console.log("[PLATFORM-CONTEXT] listTenants count:", rawResult.length, "first:", rawResult[0]?.slug, rawResult[0]?.status)
        if (rawResult.length > 0 && Array.isArray(rawResult[0])) {
          console.log("[PLATFORM-CONTEXT] listTenants returns tuple! inner:", rawResult[0].length)
        }
      }

      const rawBySlug = await tenantModule.listTenants({ slug: tenantSlug })
      console.log("[PLATFORM-CONTEXT] listTenants({slug:'" + tenantSlug + "'}) raw type:", typeof rawBySlug, "isArray:", Array.isArray(rawBySlug))
      if (Array.isArray(rawBySlug)) {
        console.log("[PLATFORM-CONTEXT] bySlug count:", rawBySlug.length, "first:", rawBySlug[0]?.slug)
      } else {
        console.log("[PLATFORM-CONTEXT] bySlug value:", JSON.stringify(rawBySlug)?.substring(0, 200))
      }
    } catch (debugErr: any) {
      console.error("[PLATFORM-CONTEXT] debug error:", debugErr?.message)
    }

    try {
      tenant = await tenantModule.resolveTenant({ slug: tenantSlug })
    } catch (resolveErr: any) {
      console.error("[PLATFORM-CONTEXT] resolveTenant error:", resolveErr?.message || resolveErr)
    }

    if (!tenant) {
      try {
        const allTenants = await tenantModule.listTenants({}) as any
        let list: any[]
        if (Array.isArray(allTenants) && allTenants.length > 0 && Array.isArray(allTenants[0])) {
          list = allTenants[0]
        } else if (Array.isArray(allTenants)) {
          list = allTenants
        } else {
          list = [allTenants].filter(Boolean)
        }
        tenant = list.find((t: any) => t.slug === tenantSlug && (t.status === "active" || t.status === "trial")) || null
        if (tenant) {
          isDefaultTenant = tenantSlug === DEFAULT_TENANT_SLUG
        }
      } catch (listErr: any) {
        console.error("[PLATFORM-CONTEXT] listTenants fallback error:", listErr?.message || listErr)
      }
    }

    if (!tenant) {
      isDefaultTenant = true
      try {
        const allTenants = await tenantModule.listTenants({}) as any
        let list: any[]
        if (Array.isArray(allTenants) && allTenants.length > 0 && Array.isArray(allTenants[0])) {
          list = allTenants[0]
        } else if (Array.isArray(allTenants)) {
          list = allTenants
        } else {
          list = [allTenants].filter(Boolean)
        }
        tenant = list.find((t: any) => t.slug === DEFAULT_TENANT_SLUG && (t.status === "active" || t.status === "trial")) || null
      } catch {}
    }

    if (!tenant) {
      return res.status(503).json({ success: false, message: "Platform tenant unavailable" })
    }

    if (tenantSlug === DEFAULT_TENANT_SLUG) {
      isDefaultTenant = true
    }

    let nodeHierarchy: any[] = []
    if (nodeModule) {
      try {
        const filters: any = {}
        if (nodeId) filters.parent_id = nodeId
        const flatNodes = await nodeModule.listNodesByTenant(tenant.id, filters)
        nodeHierarchy = buildNodeHierarchy(flatNodes)
      } catch {
        nodeHierarchy = []
      }
    }

    let governanceChain: any = { region: null, country: null, authorities: [], policies: {} }
    if (governanceModule) {
      try {
        const effectivePolicies = await governanceModule.resolveEffectivePolicies(tenant.id)
        let authorities: any[] = []
        try {
          const rawAuthorities = await governanceModule.listGovernanceAuthorities({ tenant_id: tenant.id })
          authorities = Array.isArray(rawAuthorities) ? rawAuthorities : [rawAuthorities].filter(Boolean)
        } catch {
          authorities = []
        }
        governanceChain = buildGovernanceChain(authorities, effectivePolicies)
      } catch {
      }
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")

    return res.json({
      success: true,
      data: {
        tenant: formatTenantResponse(tenant),
        nodeHierarchy,
        governanceChain,
        capabilities: PLATFORM_CAPABILITIES,
        systems: getSystemsSummary(),
        contextHeaders: [...CONTEXT_HEADERS],
        hierarchyLevels: [...HIERARCHY_LEVELS],
        resolvedAt: new Date().toISOString(),
        isDefaultTenant,
      },
    })
  } catch (error: any) {
return handleApiError(res, error, "PLATFORM-CONTEXT")}
}

