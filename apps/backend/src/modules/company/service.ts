import { MedusaService } from "@medusajs/framework/utils";
import Company from "./models/company";
import CompanyUser from "./models/company-user";
import { PurchaseOrder } from "./models/purchase-order";
import { PurchaseOrderItem } from "./models/purchase-order-item";
import { PaymentTerms } from "./models/payment-terms";
import { TaxExemption } from "./models/tax-exemption";
import {
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalAction,
} from "./models/approval-workflow";

/**
 * Company Service
 *
 * Manages B2B company accounts, purchase orders, payment terms, tax exemptions, and approval workflows.
 */
class CompanyModuleService extends MedusaService({
  Company,
  CompanyUser,
  PurchaseOrder,
  PurchaseOrderItem,
  PaymentTerms,
  TaxExemption,
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalAction,
}) {
  /**
   * Check if company has available credit
   */
  async hasAvailableCredit(
    companyId: string,
    amount: bigint,
  ): Promise<boolean> {
    const company = (await this.retrieveCompany(companyId)) as any;
    const available =
      BigInt(company.credit_limit || 0) - BigInt(company.credit_used || 0);
    return available >= amount;
  }

  /**
   * Reserve credit for an order
   */
  async reserveCredit(companyId: string, amount: bigint): Promise<void> {
    const company = (await this.retrieveCompany(companyId)) as any;
    const available =
      BigInt(company.credit_limit || 0) - BigInt(company.credit_used || 0);

    if (available < amount) {
      throw new Error(
        `Insufficient credit. Available: ${available}, Required: ${amount}`,
      );
    }

    await this.updateCompanies({
      id: companyId,
      credit_used: (BigInt(company.credit_used || 0) + amount).toString(),
    } as any);
  }

  /**
   * Release reserved credit (order cancelled/refunded)
   */
  async releaseCredit(companyId: string, amount: bigint): Promise<void> {
    const company = (await this.retrieveCompany(companyId)) as any;
    const newUsed = BigInt(company.credit_used || 0) - amount;

    await this.updateCompanies({
      id: companyId,
      credit_used: (newUsed > 0n ? newUsed : 0n).toString(),
    } as any);
  }

  /**
   * Check if user can approve an order amount
   */
  async canUserApprove(
    companyUserId: string,
    amount: bigint,
  ): Promise<boolean> {
    const companyUser = (await this.retrieveCompanyUser(companyUserId)) as any;

    // Admins and approvers can approve
    if (!["admin", "approver"].includes(companyUser.role)) {
      return false;
    }

    // Check approval limit
    if (companyUser.approval_limit) {
      return amount <= BigInt(companyUser.approval_limit);
    }

    // No limit set = can approve any amount
    return true;
  }

  /**
   * Check if user has spending limit available
   */
  async hasSpendingLimitAvailable(
    companyUserId: string,
    amount: bigint,
  ): Promise<boolean> {
    const companyUser = (await this.retrieveCompanyUser(companyUserId)) as any;

    // No limit = always available
    if (!companyUser.spending_limit) {
      return true;
    }

    // Check period spend
    const limit = BigInt(companyUser.spending_limit);
    const spent = BigInt(companyUser.current_period_spend || 0);

    return limit - spent >= amount;
  }

  /**
   * Record user spending
   */
  async recordSpending(companyUserId: string, amount: bigint): Promise<void> {
    const companyUser = (await this.retrieveCompanyUser(companyUserId)) as any;

    await this.updateCompanyUsers({
      id: companyUserId,
      current_period_spend: (
        BigInt(companyUser.current_period_spend || 0) + amount
      ).toString(),
    } as any);
  }

  /**
   * Get company users by role
   */
  async getCompanyUsersByRole(companyId: string, role: string) {
    return (await this.listCompanyUsers({
      company_id: companyId,
      role,
      status: "active",
    })) as any;
  }

  /**
   * Get potential approvers for an amount
   */
  async getPotentialApprovers(companyId: string, amount: bigint) {
    const users = (await this.listCompanyUsers({
      company_id: companyId,
      role: ["admin", "approver"],
      status: "active",
    })) as unknown as Record<string, unknown>[];

    const usersArray = Array.isArray(users) ? users : [users].filter(Boolean);

    return usersArray.filter((user: any) => {
      if (!user.approval_limit) return true;
      return BigInt(user.approval_limit) >= amount;
    });
  }

  // ============ Purchase Order Methods ============

  /**
   * Generate unique PO number
   */
  async generatePONumber(companyId: string): Promise<string> {
    const company = (await this.retrieveCompany(companyId)) as any;
    const prefix = company.name?.substring(0, 3).toUpperCase() || "PO";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create purchase order with items
   */
  async createPurchaseOrderWithItems(poData: any, items: any[]): Promise<any> {
    const poNumber = await this.generatePONumber(poData.company_id);

    const purchaseOrder = await this.createPurchaseOrders({
      ...poData,
      po_number: poNumber,
      issue_date: new Date(),
    } as any);

    const createdItems = await Promise.all(
      items.map((item) =>
        this.createPurchaseOrderItems({
          ...item,
          purchase_order_id: purchaseOrder.id,
          subtotal: item.unit_price * item.quantity,
          total: item.unit_price * item.quantity + (item.tax_amount || 0),
        } as any),
      ),
    );

    // Calculate totals
    const subtotal = createdItems.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal),
      0,
    );
    const taxTotal = createdItems.reduce(
      (sum: number, item: any) => sum + Number(item.tax_amount || 0),
      0,
    );

    await this.updatePurchaseOrders({
      id: purchaseOrder.id,
      subtotal,
      tax_total: taxTotal,
      total: subtotal + taxTotal + Number(poData.shipping_total || 0),
    } as any);

    return { ...purchaseOrder, items: createdItems };
  }

  /**
   * Submit PO for approval
   */
  async submitPOForApproval(poId: string): Promise<any> {
    const po = (await this.retrievePurchaseOrder(poId)) as any;

    if (po.status !== "draft") {
      throw new Error("Only draft POs can be submitted for approval");
    }

    // Find applicable workflow
    const workflows = (await this.listApprovalWorkflows({
      company_id: po.company_id,
      workflow_type: "purchase_order",
      is_active: true,
    })) as any;

    const workflowList = Array.isArray(workflows)
      ? workflows
      : [workflows].filter(Boolean);

    if (workflowList.length === 0 || !po.requires_approval) {
      // No workflow, auto-approve
      return await this.updatePurchaseOrders({
        id: poId,
        status: "approved",
        approved_at: new Date(),
      } as any);
    }

    // Create approval request
    const workflow = workflowList[0];
    await this.createApprovalRequests({
      workflow_id: workflow.id,
      company_id: po.company_id,
      tenant_id: po.tenant_id,
      entity_type: "purchase_order",
      entity_id: poId,
      requested_by_id: po.customer_id,
      requested_at: new Date(),
      amount: po.total,
      currency_code: po.currency_code,
      request_data: po,
    } as any);

    return await this.updatePurchaseOrders({
      id: poId,
      status: "pending_approval",
    } as any);
  }

  // ============ Payment Terms Methods ============

  /**
   * Calculate payment due date based on terms
   */
  calculateDueDate(terms: any, invoiceDate: Date = new Date()): Date {
    const date = new Date(invoiceDate);

    switch (terms.terms_type) {
      case "due_on_receipt":
        return date;

      case "net_days":
        date.setDate(date.getDate() + (terms.net_days || 30));
        return date;

      case "end_of_month":
        date.setMonth(date.getMonth() + 1, 0);
        return date;

      case "end_of_next_month":
        date.setMonth(date.getMonth() + 2, 0);
        return date;

      default:
        date.setDate(date.getDate() + 30);
        return date;
    }
  }

  /**
   * Calculate early payment discount
   */
  calculateEarlyPaymentDiscount(
    terms: any,
    amount: number,
    paymentDate: Date,
    invoiceDate: Date,
  ): number {
    if (
      !terms.early_payment_discount_percent ||
      !terms.early_payment_discount_days
    ) {
      return 0;
    }

    const daysSinceInvoice = Math.floor(
      (paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceInvoice <= terms.early_payment_discount_days) {
      return amount * (Number(terms.early_payment_discount_percent) / 100);
    }

    return 0;
  }

  /**
   * Get default payment terms for company
   */
  async getCompanyPaymentTerms(
    companyId: string,
    tenantId?: string,
  ): Promise<any> {
    const company = (await this.retrieveCompany(companyId)) as any;

    // Find terms matching company tier
    const terms = (await this.listPaymentTerms({
      tenant_id: tenantId,
      is_active: true,
    })) as any;

    const termsList = Array.isArray(terms) ? terms : [terms].filter(Boolean);

    // Find tier-specific or default
    const tierTerms = termsList.find((t: any) =>
      t.company_tiers?.includes(company.tier),
    );

    if (tierTerms) return tierTerms;

    // Return default
    return termsList.find((t: any) => t.is_default);
  }

  // ============ Tax Exemption Methods ============

  /**
   * Validate tax exemption certificate
   */
  async validateTaxExemption(exemptionId: string): Promise<boolean> {
    const exemption = (await this.retrieveTaxExemption(exemptionId)) as any;

    if (exemption.status !== "verified") {
      return false;
    }

    if (
      exemption.expiration_date &&
      new Date(exemption.expiration_date) < new Date()
    ) {
      // Mark as expired
      await this.updateTaxExemptions({
        id: exemptionId,
        status: "expired",
      } as any);
      return false;
    }

    return true;
  }

  /**
   * Get applicable tax exemption for order
   */
  async getApplicableTaxExemption(
    companyId: string,
    regionId?: string,
    categoryIds?: string[],
  ): Promise<any | null> {
    const exemptions = (await this.listTaxExemptions({
      company_id: companyId,
      status: "verified",
    })) as any;

    const exemptionList = Array.isArray(exemptions)
      ? exemptions
      : [exemptions].filter(Boolean);

    for (const exemption of exemptionList) {
      // Check expiration
      if (
        exemption.expiration_date &&
        new Date(exemption.expiration_date) < new Date()
      ) {
        continue;
      }

      // Check region applicability
      if (exemption.applicable_regions?.length && regionId) {
        if (!exemption.applicable_regions.includes(regionId)) {
          continue;
        }
      }

      // Check category applicability
      if (exemption.applicable_categories?.length && categoryIds?.length) {
        const hasMatch = categoryIds.some((id) =>
          exemption.applicable_categories.includes(id),
        );
        if (!hasMatch) continue;
      }

      // Update usage
      await this.updateTaxExemptions({
        id: exemption.id,
        last_used_at: new Date(),
        usage_count: (exemption.usage_count || 0) + 1,
      } as any);

      return exemption;
    }

    return null;
  }

  // ============ Approval Workflow Methods ============

  /**
   * Process approval action
   */
  async processApprovalAction(
    requestId: string,
    userId: string,
    action: "approve" | "reject" | "request_changes",
    comments?: string,
  ): Promise<any> {
    const request = (await this.retrieveApprovalRequest(requestId)) as any;
    const workflow = (await this.retrieveApprovalWorkflow(
      request.workflow_id,
    )) as any;

    const steps = workflow.steps || [];
    const currentStep = steps[request.current_step - 1];

    // Record action
    await this.createApprovalActions({
      approval_request_id: requestId,
      step_number: request.current_step,
      step_name: currentStep?.name,
      action,
      action_by_id: userId,
      action_at: new Date(),
      comments,
    } as any);

    if (action === "reject") {
      // Update request status
      await this.updateApprovalRequests({
        id: requestId,
        status: "rejected",
        resolved_at: new Date(),
        resolution_notes: comments,
      } as any);

      // Update entity
      if (request.entity_type === "purchase_order") {
        await this.updatePurchaseOrders({
          id: request.entity_id,
          status: "rejected",
          rejected_by_id: userId,
          rejected_at: new Date(),
          rejection_reason: comments,
        } as any);
      }

      return { status: "rejected" };
    }

    if (action === "approve") {
      // Check if more steps
      if (request.current_step < steps.length) {
        await this.updateApprovalRequests({
          id: requestId,
          current_step: request.current_step + 1,
          status: "in_progress",
        } as any);
        return { status: "in_progress", next_step: request.current_step + 1 };
      }

      // All steps complete
      await this.updateApprovalRequests({
        id: requestId,
        status: "approved",
        resolved_at: new Date(),
      } as any);

      // Update entity
      if (request.entity_type === "purchase_order") {
        await this.updatePurchaseOrders({
          id: request.entity_id,
          status: "approved",
          approved_by_id: userId,
          approved_at: new Date(),
          approval_notes: comments,
        } as any);
      }

      return { status: "approved" };
    }

    return { status: "pending" };
  }
}

export default CompanyModuleService;
