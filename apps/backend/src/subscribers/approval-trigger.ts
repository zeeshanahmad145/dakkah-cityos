import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { APPROVAL_WORKFLOW_MODULE } from "../modules/approval-workflow";
import type ApprovalWorkflowModuleService from "../modules/approval-workflow/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:approval-trigger");

const ENTITY_TYPE_MAP: Record<string, string> = {
  "quote.submitted": "quote",
  "order.po_created": "purchase_order",
  "company.credit_increase_requested": "credit_increase",
  "order.refund_requested": "refund",
  "vendor.onboarding_completed": "vendor_onboarding",
};

export default async function approvalTrigger({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  tenant_id?: string;
  amount?: number;
  requestor_id?: string;
}>) {
  const approvalService: ApprovalWorkflowModuleService = container.resolve(
    APPROVAL_WORKFLOW_MODULE,
  );
  const entityType = ENTITY_TYPE_MAP[event.name];
  if (!entityType) return;

  try {
    const { request, autoApproved } = await approvalService.initiateApproval({
      entityType,
      entityId: event.data.id,
      requestorId:
        event.data.requestor_id ?? event.data.customer_id ?? "system",
      tenantId: event.data.tenant_id,
      amount: event.data.amount,
    });

    if (autoApproved) {
      logger.info(
        `${entityType} ${event.data.id} auto-approved (below threshold)`,
      );
    } else {
      logger.info(
        `Approval chain started for ${entityType} ${event.data.id} (request: ${request.id})`,
      );
    }
  } catch (err) {
    logger.error(`Approval trigger error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: Object.keys(ENTITY_TYPE_MAP),
};
