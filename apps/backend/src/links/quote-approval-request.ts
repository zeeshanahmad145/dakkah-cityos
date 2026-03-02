import { defineLink } from "@medusajs/framework/utils";
import QuoteModule from "../modules/quote";
import ApprovalWorkflowModule from "../modules/approval-workflow";

// Links a Quote to an approval workflow request.
// Allows: "what approval is pending for this quote?"
export default defineLink(
  QuoteModule.linkable.quote,
  ApprovalWorkflowModule.linkable.wfApprovalRequest,
);
