import { MedusaService } from "@medusajs/framework/utils";
import {
  ApprovalRequest,
  ApprovalStep,
  ApprovalPolicy,
} from "./models/approval-request";

class ApprovalWorkflowModuleService extends MedusaService({
  ApprovalRequest,
  ApprovalStep,
  ApprovalPolicy,
}) {
  /**
   * Initiate an approval chain for an entity.
   * Returns the request (and optionally auto-approves if below threshold).
   */
  async initiateApproval(params: {
    entityType: string;
    entityId: string;
    requestorId: string;
    tenantId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }): Promise<{ request: any; autoApproved: boolean }> {
    const policies = (await this.listApprovalPolicies({
      entity_type: params.entityType,
      tenant_id: params.tenantId ?? null,
      is_active: true,
    })) as any[];

    const policy = policies[0];

    // Auto-approve logic
    if (
      policy?.auto_approve_below_amount &&
      params.amount &&
      params.amount < policy.auto_approve_below_amount
    ) {
      const request = await this.createApprovalRequests({
        entity_type: params.entityType,
        entity_id: params.entityId,
        requestor_id: params.requestorId,
        tenant_id: params.tenantId ?? null,
        status: "approved",
        approved_at: new Date(),
        metadata: params.metadata ?? null,
      } as any);
      return { request, autoApproved: true };
    }

    const steps: any[] = policy?.steps ?? [
      { approver_role: "ops_lead", escalation_after_hours: 24 },
    ];

    const expiresAt = policy?.escalation_after_hours
      ? new Date(Date.now() + policy.escalation_after_hours * 3600000)
      : null;

    const request = await this.createApprovalRequests({
      entity_type: params.entityType,
      entity_id: params.entityId,
      requestor_id: params.requestorId,
      tenant_id: params.tenantId ?? null,
      current_step: 0,
      status: "pending",
      expires_at: expiresAt,
      metadata: params.metadata ?? null,
    } as any);

    // Create step records
    await Promise.all(
      steps.map((s: any, i: number) =>
        this.createApprovalSteps({
          request_id: request.id,
          step_index: i,
          approver_role: s.approver_role,
          decision: "pending",
        } as any),
      ),
    );

    return { request, autoApproved: false };
  }

  /**
   * Record a decision on the current step and advance or complete the chain.
   */
  async recordDecision(
    requestId: string,
    approverId: string,
    decision: "approved" | "rejected",
    notes?: string,
  ): Promise<any> {
    const request = (await this.retrieveApprovalRequest(requestId)) as any;
    const steps = (await this.listApprovalSteps({
      request_id: requestId,
      step_index: request.current_step,
    })) as any[];
    const step = steps[0];
    if (!step) throw new Error("Approval step not found");

    await this.updateApprovalSteps({
      id: step.id,
      decision,
      decided_at: new Date(),
      approver_id: approverId,
      notes: notes ?? null,
    } as any);

    if (decision === "rejected") {
      await this.updateApprovalRequests({
        id: requestId,
        status: "rejected",
        rejected_at: new Date(),
      } as any);
      return { status: "rejected" };
    }

    // Check if there are more steps
    const allSteps = (await this.listApprovalSteps({
      request_id: requestId,
    })) as any[];
    const nextStep = allSteps.find(
      (s: any) => s.step_index === request.current_step + 1,
    );

    if (nextStep) {
      await this.updateApprovalRequests({
        id: requestId,
        current_step: request.current_step + 1,
      } as any);
      return { status: "pending_next_step" };
    }

    await this.updateApprovalRequests({
      id: requestId,
      status: "approved",
      approved_at: new Date(),
    } as any);
    return { status: "approved" };
  }
}

export default ApprovalWorkflowModuleService;
