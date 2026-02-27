import { useApprovalWorkflows } from "@/lib/hooks/use-approvals"
import type { ApprovalWorkflow } from "@/lib/types/approvals"

export function ApprovalWorkflowList() {
  const { data: workflows, isLoading } = useApprovalWorkflows()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No approval workflows configured</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contact your administrator to set up approval workflows.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  )
}

function WorkflowCard({ workflow }: { workflow: ApprovalWorkflow }) {
  const triggerLabels: Record<string, string> = {
    purchase_order: "Purchase Orders",
    quote: "Quotes",
    expense: "Expenses",
    vendor_onboarding: "Vendor Onboarding",
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{workflow.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${workflow.is_active ? "bg-ds-success text-ds-success" : "bg-ds-muted text-ds-foreground"}`}>
          {workflow.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      {workflow.description && (
        <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
      )}
      <div className="flex items-center gap-4 text-sm">
        <span className="bg-muted px-2 py-1 rounded">
          Trigger: {triggerLabels[workflow.trigger_type] || workflow.trigger_type}
        </span>
        <span className="text-muted-foreground">
          {workflow.steps?.length ?? 0} approval step{(workflow.steps?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>
      {(workflow.conditions?.length ?? 0) > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          {workflow.conditions?.length ?? 0} condition{(workflow.conditions?.length ?? 0) !== 1 ? "s" : ""} configured
        </div>
      )}
    </div>
  )
}
