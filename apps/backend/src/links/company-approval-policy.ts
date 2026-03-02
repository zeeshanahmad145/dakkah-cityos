import { defineLink } from "@medusajs/framework/utils";
import CompanyModule from "../modules/company";
import ApprovalWorkflowModule from "../modules/approval-workflow";

// Links a Company to the ApprovalPolicy that governs its B2B approval thresholds.
// Allows: "what approval rules apply to this company's orders/quotes?"
export default defineLink(
  CompanyModule.linkable.company,
  ApprovalWorkflowModule.linkable.wfApprovalPolicy,
);
