import { MedusaService } from "@medusajs/framework/utils";
import WarrantyPlan from "./models/warranty-plan";
import WarrantyClaim from "./models/warranty-claim";
import RepairOrder from "./models/repair-order";
import SparePart from "./models/spare-part";
import ServiceCenter from "./models/service-center";

class WarrantyModuleService extends MedusaService({
  WarrantyPlan,
  WarrantyClaim,
  RepairOrder,
  SparePart,
  ServiceCenter,
}) {
  /**
   * Register a warranty for a product purchased by a customer.
   */
  async registerWarranty(
    productId: string,
    customerId: string,
    purchaseDate: Date,
  ): Promise<any> {
    const plans = await this.listWarrantyPlans({
      product_id: productId,
    }) as any;
    const planList = Array.isArray(plans) ? plans : [plans].filter(Boolean);
    if (planList.length === 0) {
      throw new Error("No warranty plan found for this product");
    }
    const plan = planList[0];
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(
      expiryDate.getMonth() + Number(plan.duration_months || 12),
    );
    const warranty = await this.createWarrantyClaims({
      plan_id: plan.id,
      product_id: productId,
      customer_id: customerId,
      purchase_date: purchaseDate,
      expiry_date: expiryDate,
      status: "registered",
      registered_at: new Date(),
    } as any);
    return warranty;
  }

  /**
   * File a warranty claim for an issue with a warranted product.
   */
  async fileClaim(warrantyId: string, issue: string): Promise<any> {
    const coverage = await this.checkCoverage(warrantyId);
    if (!coverage.covered) {
      throw new Error(coverage.reason || "Warranty does not cover this claim");
    }
    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}`;
    const claim = await this.updateWarrantyClaims({
      id: warrantyId,
      status: "claimed",
      claim_number: claimNumber,
      issue_description: issue,
      claimed_at: new Date(),
    } as any);
    return claim;
  }

  /**
   * Check if a warranty is still valid and provides coverage.
   */
  async checkCoverage(
    warrantyId: string,
  ): Promise<{ covered: boolean; expiryDate?: Date; reason?: string }> {
    const warranty = await this.retrieveWarrantyClaim(warrantyId) as any;
    // @ts-ignore - WarrantyClaim status doesn't include expired or voided states
    if (warranty.status === "expired" || warranty.status === "voided") {
      return { covered: false, reason: "Warranty is no longer active" };
    }
    // @ts-ignore - WarrantyClaim doesn't have expiry_date property
    const expiryDate = new Date(warranty.expiry_date);
    if (expiryDate < new Date()) {
      return { covered: false, expiryDate, reason: "Warranty has expired" };
    }
    return { covered: true, expiryDate };
  }

  /**
   * Process a decision on a warranty claim (approve, reject, or escalate).
   */
  async processClaimDecision(
    claimId: string,
    decision: "approved" | "rejected" | "escalated",
  ): Promise<any> {
    const claim = await this.retrieveWarrantyClaim(claimId) as any;
    // @ts-ignore - WarrantyClaim status doesn't include claimed or under_review states
    if (claim.status !== "claimed" && claim.status !== "under_review") {
      throw new Error("Claim is not in a reviewable state");
    }
    const updated = await this.updateWarrantyClaims({
      id: claimId,
      status: decision,
      decision,
      decided_at: new Date(),
    } as any);
    if (decision === "approved") {
      await this.createRepairOrders({
        warranty_claim_id: claimId,
        status: "pending",
        created_at: new Date(),
      } as any);
    }
    return updated;
  }

  async extendWarranty(
    warrantyId: string,
    additionalMonths: number,
    fee: number,
  ): Promise<any> {
    if (additionalMonths <= 0) {
      throw new Error("Additional months must be a positive number");
    }

    if (fee < 0) {
      throw new Error("Fee cannot be negative");
    }

    const warranty = await this.retrieveWarrantyClaim(warrantyId) as any;

    if (warranty.status === "voided" || warranty.status === "claimed") {
      throw new Error("Cannot extend a voided or already-claimed warranty");
    }

    const currentExpiry = new Date(warranty.expiry_date);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    const updated = await this.updateWarrantyClaims({
      id: warrantyId,
      expiry_date: newExpiry,
      status: "registered",
      extension_fee: fee,
      extended_at: new Date(),
    } as any);

    return updated;
  }

  async getWarrantyHistory(customerId: string): Promise<any[]> {
    const warranties = await this.listWarrantyClaims({
      customer_id: customerId,
    }) as any;
    const warrantyList = Array.isArray(warranties)
      ? warranties
      : [warranties].filter(Boolean);

    const now = new Date();
    return warrantyList.map((w: any) => {
      const expiryDate = new Date(w.expiry_date);
      let computedStatus = w.status;
      if (w.status === "registered" && expiryDate < now) {
        computedStatus = "expired";
      }

      return {
        id: w.id,
        productId: w.product_id,
        planId: w.plan_id,
        purchaseDate: w.purchase_date,
        expiryDate: w.expiry_date,
        status: computedStatus,
        claimNumber: w.claim_number || null,
        registeredAt: w.registered_at,
      };
    });
  }

  async scheduleRepair(
    claimId: string,
    data: {
      scheduledDate: Date;
      repairType: string;
      technicianNotes?: string;
    },
  ): Promise<any> {
    if (!data.repairType) {
      throw new Error("Repair type is required");
    }

    if (new Date(data.scheduledDate) <= new Date()) {
      throw new Error("Scheduled date must be in the future");
    }

    const claim = await this.retrieveWarrantyClaim(claimId) as any;

    if (claim.status !== "approved") {
      throw new Error("Repairs can only be scheduled for approved claims");
    }

    const repairOrders = await this.listRepairOrders({
      warranty_claim_id: claimId,
    }) as any;
    const repairList = Array.isArray(repairOrders)
      ? repairOrders
      : [repairOrders].filter(Boolean);

    if (repairList.length > 0) {
      const updated = await this.updateRepairOrders({
        id: repairList[0].id,
        scheduled_date: data.scheduledDate,
        repair_type: data.repairType,
        technician_notes: data.technicianNotes || null,
        status: "scheduled",
      } as any);
      return updated;
    }

    const repairOrder = await this.createRepairOrders({
      warranty_claim_id: claimId,
      scheduled_date: data.scheduledDate,
      repair_type: data.repairType,
      technician_notes: data.technicianNotes || null,
      status: "scheduled",
      created_at: new Date(),
    } as any);

    return repairOrder;
  }
}

export default WarrantyModuleService;
