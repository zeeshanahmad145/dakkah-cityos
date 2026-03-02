import { model } from "@medusajs/framework/utils";

// Note: DML entity names kept without wf_ prefix since linkable is derived from
// MedusaService() JS object key names, not the DML entity string name.
// The GraphQL collision with core ApprovalRequest is handled by Medusa's module namespacing.
const ApprovalRequest = model.define("wf_approval_request", {
  id: model.id().primaryKey(),
  entity_type: model.text(),
  entity_id: model.text(),
  tenant_id: model.text().nullable(),
  requestor_id: model.text(),
  current_step: model.number().default(0),
  status: model.text().default("pending"),
  approved_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  expires_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

const ApprovalStep = model.define("wf_approval_step", {
  id: model.id().primaryKey(),
  request_id: model.text(),
  step_index: model.number(),
  approver_id: model.text().nullable(),
  approver_role: model.text(),
  decision: model.text().default("pending"),
  decided_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});

const ApprovalPolicy = model.define("wf_approval_policy", {
  id: model.id().primaryKey(),
  tenant_id: model.text().nullable(),
  entity_type: model.text(),
  steps: model.json(),
  escalation_after_hours: model.number().default(24),
  auto_approve_below_amount: model.number().nullable(),
  is_active: model.boolean().default(true),
});

export { ApprovalRequest, ApprovalStep, ApprovalPolicy };
