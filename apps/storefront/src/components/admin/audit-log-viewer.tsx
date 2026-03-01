import { useState } from "react"
import { useAuditLogs } from "@/lib/hooks/use-tenant-admin"
import { Input } from "@/components/ui/input"
import type { AuditLog, AuditLogFilters } from "@/lib/types/tenant-admin"

export function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditLogFilters>({})
  const { data, isLoading } = useAuditLogs(filters)

  const logs = data?.logs || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded p-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Audit Logs ({data?.count || 0})</h2>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Filter by action..."
          value={filters.action || ""}
          onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
          className="w-48"
        />
        <Input
          placeholder="Entity type..."
          value={filters.entity_type || ""}
          onChange={(e) => setFilters({ ...filters, entity_type: e.target.value || undefined })}
          className="w-48"
        />
        <select
          value={filters.data_classification || ""}
          onChange={(e) => setFilters({ ...filters, data_classification: e.target.value || undefined })}
          className="border rounded px-3 py-2"
        >
          <option value="">All classifications</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="confidential">Confidential</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      <div className="border rounded-lg divide-y">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No audit logs found</div>
        ) : (
          logs.map((log: AuditLog) => (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{log.action}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{log.entity_type}</span>
                  <ClassificationBadge classification={log.data_classification} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at!).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>{log.actor_email || log.actor_id}</span>
                <span className="mx-1">on</span>
                <span className="font-mono text-xs">{log.entity_id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ClassificationBadge({ classification }: { classification: string }) {
  const styles: Record<string, string> = {
    public: "bg-ds-success text-ds-success",
    internal: "bg-ds-info text-ds-info",
    confidential: "bg-ds-warning text-ds-warning",
    restricted: "bg-ds-destructive text-ds-destructive",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[classification] || "bg-ds-muted"}`}>
      {classification}
    </span>
  )
}
