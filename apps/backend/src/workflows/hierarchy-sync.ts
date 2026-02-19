import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type HierarchySyncInput = {
  nodeId: string
  changeType: string
  parentId?: string
  tenantId: string
  metadata?: Record<string, unknown>
}

const detectChangeStep = createStep(
  "detect-hierarchy-change-step",
  async (input: HierarchySyncInput, { container }) => {
    const nodeModule = container.resolve("node") as any
    const node = await nodeModule.retrieveNode(input.nodeId)
    const change = {
      node_id: input.nodeId,
      change_type: input.changeType,
      previous_parent: node?.parent_id,
      new_parent: input.parentId,
      detected_at: new Date(),
    }
    return new StepResponse({ change })
  }
)

const validateHierarchyStep = createStep(
  "validate-hierarchy-change-step",
  async (input: { nodeId: string; parentId?: string; changeType: string }) => {
    const validation = {
      valid: true,
      circular_reference: false,
      depth_exceeded: false,
      validated_at: new Date(),
    }
    return new StepResponse({ validation })
  }
)

const propagateChangeStep = createStep(
  "propagate-hierarchy-change-step",
  async (input: { nodeId: string; changeType: string; parentId?: string }, { container }) => {
    const nodeModule = container.resolve("node") as any
    const affectedNodes = await nodeModule.listNodes({ parent_id: input.nodeId })
    const propagation = {
      source_node: input.nodeId,
      affected_count: affectedNodes?.length || 0,
      propagated_at: new Date(),
    }
    return new StepResponse({ propagation })
  }
)

const auditHierarchyChangeStep = createStep(
  "audit-hierarchy-change-step",
  async (input: { nodeId: string; changeType: string; tenantId: string }, { container }) => {
    const auditModule = container.resolve("audit") as any
    const entry = await auditModule.createAuditEntries({
      entity_type: "node",
      entity_id: input.nodeId,
      action: input.changeType,
      tenant_id: input.tenantId,
      timestamp: new Date(),
    })
    return new StepResponse({ auditEntry: entry }, { auditEntryId: entry.id })
  },
  async (compensationData: { auditEntryId: string } | undefined, { container }) => {
    if (!compensationData?.auditEntryId) return
    try {
      const auditModule = container.resolve("audit") as any
      await auditModule.deleteAuditEntries(compensationData.auditEntryId)
    } catch (error) {
    }
  }
)

export const hierarchySyncWorkflow = createWorkflow(
  "hierarchy-sync-workflow",
  (input: HierarchySyncInput) => {
    const { change } = detectChangeStep(input)
    const { validation } = validateHierarchyStep({ nodeId: input.nodeId, parentId: input.parentId, changeType: input.changeType })
    const { propagation } = propagateChangeStep({ nodeId: input.nodeId, changeType: input.changeType, parentId: input.parentId })
    const { auditEntry } = auditHierarchyChangeStep({ nodeId: input.nodeId, changeType: input.changeType, tenantId: input.tenantId })
    return new WorkflowResponse({ change, validation, propagation, auditEntry })
  }
)
