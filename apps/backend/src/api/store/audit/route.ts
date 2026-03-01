// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auditService = req.scope.resolve("audit") as unknown as any
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const {
    limit = "20",
    offset = "0",
    action,
  } = req.query as {
    limit?: string
    offset?: string
    action?: string
  }

  try {
    const filters: Record<string, any> = {
      actorId: customerId,
    }

    if (action) {
      filters.action = action
    }

    const logs = await auditService.searchAuditLogs("", filters)
    const logList = Array.isArray(logs) ? logs : [logs].filter(Boolean)

    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50)
    const parsedOffset = parseInt(offset, 10) || 0

    const paginatedLogs = logList.slice(parsedOffset, parsedOffset + parsedLimit)

    res.json({
      audit_logs: paginatedLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        created_at: log.created_at,
        metadata: log.metadata,
      })),
      count: logList.length,
      limit: parsedLimit,
      offset: parsedOffset,
    })
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-AUDIT")}
}

