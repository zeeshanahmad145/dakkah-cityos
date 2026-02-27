import { useApprovalRequest, useApproveRequest, useRejectRequest } from "@/lib/hooks/use-approvals"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import type { ApprovalAction } from "@/lib/types/approvals"

interface ApprovalRequestDetailProps {
  requestId: string
}

export function ApprovalRequestDetail({ requestId }: ApprovalRequestDetailProps) {
  const { data: request, isLoading } = useApprovalRequest(requestId)
  const approveMutation = useApproveRequest()
  const rejectMutation = useRejectRequest()
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3"></div><div className="h-48 bg-muted rounded"></div></div>
  }

  if (!request) {
    return <div className="text-center py-12 text-muted-foreground">Approval request not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Approval Request</h1>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Type</p>
          <p className="font-medium">{request.entity_type.replace("_", " ")}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Requested By</p>
          <p className="font-medium">{request.requested_by_name || request.requested_by}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Current Step</p>
          <p className="font-medium">{request.current_step}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Created</p>
          <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {(request.actions?.length ?? 0) > 0 && (
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="font-semibold">Action History</h2>
          </div>
          <div className="divide-y">
            {(request.actions || []).map((action: ApprovalAction) => (
              <div key={action.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ActionBadge action={action.action} />
                    <span className="font-medium">{action.actor_name || action.actor_id}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(action.acted_at).toLocaleString()}
                  </span>
                </div>
                {action.comment && (
                  <p className="text-sm text-muted-foreground mt-2">{action.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {request.status === "pending" && (
        <div className="flex gap-3">
          <Button
            onClick={() => approveMutation.mutate({ requestId: request.id })}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? "Approving..." : "Approve"}
          </Button>
          {showReject ? (
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  rejectMutation.mutate({ requestId: request.id, reason: rejectReason })
                  setShowReject(false)
                }}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                Confirm Reject
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowReject(true)}>
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ds-warning text-ds-warning",
    approved: "bg-ds-success text-ds-success",
    rejected: "bg-ds-destructive text-ds-destructive",
    cancelled: "bg-ds-muted text-ds-foreground",
    expired: "bg-ds-warning/15 text-ds-warning",
  }
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || "bg-ds-muted"}`}>{status}</span>
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    approve: "bg-ds-success text-ds-success",
    reject: "bg-ds-destructive text-ds-destructive",
    request_changes: "bg-ds-warning text-ds-warning",
    escalate: "bg-ds-info text-ds-info",
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[action] || "bg-ds-muted"}`}>{action}</span>
}
