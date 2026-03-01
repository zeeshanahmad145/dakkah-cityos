import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { NodeHierarchySyncService } from "../../../../../integrations/node-hierarchy-sync/index"
import { createLogger } from "../../../../../lib/logger"
import { handleApiError } from "../../../../../lib/api-error-handler"
import { appConfig } from "../../../../../lib/config"
const logger = createLogger("api:admin/integrations")

const nodeHierarchySyncSchema = z.object({
  tenant_id: z.string().min(1),
  mode: z.enum(["temporal", "direct"]).optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = nodeHierarchySyncSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { tenant_id, mode } = parsed.data

    const syncMode = mode || (appConfig.temporal.isConfigured ? "temporal" : "direct")

    if (syncMode === "temporal" && appConfig.temporal.isConfigured) {
      logger.info(`[NodeHierarchySync] Dispatching hierarchy sync to Temporal for tenant: ${tenant_id}`)

      const { startWorkflow } = require("../../../../../lib/temporal-client")
      const result = await startWorkflow("xsystem.scheduled-hierarchy-reconciliation", {
        tenant_id,
        triggered_by: "admin",
        timestamp: new Date().toISOString(),
      }, {
        tenantId: tenant_id,
        source: "admin-hierarchy-sync",
      })

      return res.json({
        triggered: true,
        mode: "temporal",
        tenant_id,
        workflow_run_id: result.runId,
      })
    }

    logger.info(`[NodeHierarchySync] Running direct hierarchy sync for tenant: ${tenant_id}`)
    const syncService = new NodeHierarchySyncService(req.scope)
    const result = await syncService.syncFullHierarchy(tenant_id)

    return res.json({
      triggered: true,
      mode: "direct",
      tenant_id,
      result,
    })
  } catch (error: unknown) {
    logger.error(`[NodeHierarchySync] in hierarchy sync: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC-NODE-HIERARCHY")}
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenant_id = req.query.tenant_id as string

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id query parameter is required" })
    }

    const nodeHierarchyService = new NodeHierarchySyncService(req.scope)
    const hierarchy = await nodeHierarchyService.getHierarchyTree(tenant_id)

    return res.json({
      tenant_id,
      hierarchy,
    })
  } catch (error: unknown) {
    logger.error(`[NodeHierarchySync] fetching hierarchy: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC-NODE-HIERARCHY")}
}

