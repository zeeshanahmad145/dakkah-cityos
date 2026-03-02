import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import ApprovalWorkflowModule from "../modules/approval-workflow";

// Links an Order to an approval workflow request initiated for it.
// Allows: "what approval is pending for this order?"
export default defineLink(
  OrderModule.linkable.order,
  ApprovalWorkflowModule.linkable.wfApprovalRequest,
);
