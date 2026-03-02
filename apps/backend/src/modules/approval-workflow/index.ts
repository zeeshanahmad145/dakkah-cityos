import ApprovalWorkflowModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const APPROVAL_WORKFLOW_MODULE = "approvalWorkflow";
export { ApprovalWorkflowModuleService };

export default Module(APPROVAL_WORKFLOW_MODULE, {
  service: ApprovalWorkflowModuleService,
});
