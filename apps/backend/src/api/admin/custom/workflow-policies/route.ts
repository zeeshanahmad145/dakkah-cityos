import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:admin:workflow-policies");

/**
 * GET /admin/custom/workflow-policies
 * Returns all WorkflowPolicy records for the governance admin page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const approvalService = req.scope.resolve("approvalWorkflow") as any;
    const policies =
      (await approvalService.listWorkflowPolicies?.(
        {},
        { order: { workflow_name: "ASC" } as any },
      )) ?? [];
    res.json({ policies, count: policies.length });
  } catch (err: any) {
    logger.error("WorkflowPolicy list error:", err.message);
    // Return empty if WorkflowPolicy model not yet migrated
    res.json({
      policies: [],
      count: 0,
      message: "Run Prisma migrate to activate WorkflowPolicy",
    });
  }
}

/**
 * POST /admin/custom/workflow-policies
 * Creates or updates a workflow governance policy.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const approvalService = req.scope.resolve("approvalWorkflow") as any;
  const body = req.body as {
    workflow_name?: string;
    permitted_launchers?: string[];
    override_requires_approval?: boolean;
    rollback_strategy?: string;
    audit_all_transitions?: boolean;
    default_timeout_minutes?: number;
    escalation_after_minutes?: number;
    escalation_target?: string;
  };

  if (!body.workflow_name) {
    return res.status(400).json({ message: "workflow_name is required" });
  }

  // Deactivate previous version if exists
  const existing = (await approvalService.listWorkflowPolicies?.({
    workflow_name: body.workflow_name,
    is_active_version: true,
  })) as any[];
  let supersedes_id: string | null = null;
  let next_version = 1;

  if (existing?.length > 0) {
    supersedes_id = existing[0].id;
    next_version = (existing[0].version ?? 1) + 1;
    await approvalService.updateWorkflowPolicies?.({
      id: supersedes_id,
      is_active_version: false,
    } as any);
  }

  const policy = await approvalService.createWorkflowPolicies?.({
    workflow_name: body.workflow_name,
    version: next_version,
    is_active_version: true,
    supersedes_id,
    permitted_launchers: body.permitted_launchers ?? ["system"],
    override_requires_approval: body.override_requires_approval ?? false,
    override_approval_chain: null,
    audit_all_transitions: body.audit_all_transitions ?? true,
    audit_retention_days: 365,
    rollback_strategy: body.rollback_strategy ?? "graceful",
    default_timeout_minutes: body.default_timeout_minutes ?? 4320,
    escalation_after_minutes: body.escalation_after_minutes ?? 1440,
    escalation_target: body.escalation_target ?? "admin",
    tenant_id: null,
    metadata: null,
  } as any);

  res.status(201).json(policy);
}
