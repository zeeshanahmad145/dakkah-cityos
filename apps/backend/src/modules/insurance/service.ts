import { MedusaService } from "@medusajs/framework/utils";
import InsurancePolicy from "./models/insurance-policy";
import InsuranceClaim from "./models/insurance-claim";

type PolicyRecord = {
  id: string;
  customer_id: string;
  product_id: string;
  plan_type: string;
  coverage_amount: number | string;
  premium: number | string;
  status: string;
  policy_number: string;
  start_date: Date | string;
  end_date: Date | string;
  cancellation_reason?: string | null;
  cancelled_at?: Date | null;
};

type ClaimRecord = {
  id: string;
  policy_id: string;
  description: string;
  claim_amount: number | string;
  status: string;
  claim_number: string;
  filed_at: Date;
  decision_notes?: string | null;
  decided_at?: Date | null;
  payout_amount?: number | string;
};

interface InsuranceServiceBase {
  createInsPolicys(data: Record<string, unknown>): Promise<PolicyRecord>;
  updateInsPolicys(
    data: { id: string } & Record<string, unknown>,
  ): Promise<PolicyRecord>;
  retrieveInsPolicy(id: string): Promise<PolicyRecord>;
  createInsClaims(data: Record<string, unknown>): Promise<ClaimRecord>;
  updateInsClaims(
    data: { id: string } & Record<string, unknown>,
  ): Promise<ClaimRecord>;
  retrieveInsClaim(id: string): Promise<ClaimRecord>;
  listInsClaims(filters: Record<string, unknown>): Promise<ClaimRecord[]>;
}

class InsuranceModuleService extends MedusaService({
  InsurancePolicy,
  InsuranceClaim,
}) {
  async createPolicy(data: {
    customerId: string;
    productId: string;
    planType: string;
    coverageAmount: number;
    premium: number;
    startDate: Date;
    metadata?: Record<string, unknown>;
  }): Promise<PolicyRecord> {
    if (data.coverageAmount <= 0) {
      throw new Error("Coverage amount must be greater than zero");
    }
    if (data.premium <= 0) {
      throw new Error("Premium must be greater than zero");
    }

    const endDate = new Date(data.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return (this as unknown as InsuranceServiceBase).createInsPolicys({
      customer_id: data.customerId,
      plan_type: data.planType,
      coverage_amount: data.coverageAmount,
      premium: data.premium,
      start_date: data.startDate,
      end_date: endDate,
      status: "active",
      policy_number: `POL-${Date.now().toString(36).toUpperCase()}`,
    });
  }

  async fileInsuranceClaim(
    policyId: string,
    description: string,
    claimAmount: number,
  ): Promise<ClaimRecord> {
    if (!description || !description.trim()) {
      throw new Error("Claim description is required");
    }
    if (claimAmount <= 0) {
      throw new Error("Claim amount must be greater than zero");
    }

    const svc = this as unknown as InsuranceServiceBase;
    const policy = await svc.retrieveInsPolicy(policyId);

    if (policy.status !== "active") {
      throw new Error("Policy is not active");
    }

    if (claimAmount > Number(policy.coverage_amount)) {
      throw new Error("Claim amount exceeds coverage limit");
    }

    return svc.createInsClaims({
      policy_id: policyId,
      description: description.trim(),
      claim_amount: claimAmount,
      status: "pending",
      claim_number: `CLM-${Date.now().toString(36).toUpperCase()}`,
      filed_at: new Date(),
    });
  }

  async processInsuranceClaim(
    claimId: string,
    decision: "approved" | "rejected",
    notes?: string,
  ): Promise<ClaimRecord> {
    const svc = this as unknown as InsuranceServiceBase;
    const claim = await svc.retrieveInsClaim(claimId);

    if (claim.status !== "pending" && claim.status !== "under_review") {
      throw new Error("Claim is not in a reviewable state");
    }

    return svc.updateInsClaims({
      id: claimId,
      status: decision,
      decision_notes: notes ?? null,
      decided_at: new Date(),
      payout_amount: decision === "approved" ? claim.claim_amount : 0,
    });
  }

  async cancelPolicy(policyId: string, reason?: string): Promise<PolicyRecord> {
    const svc = this as unknown as InsuranceServiceBase;
    const policy = await svc.retrieveInsPolicy(policyId);

    if (policy.status === "cancelled") {
      throw new Error("Policy is already cancelled");
    }

    return svc.updateInsPolicys({
      id: policyId,
      status: "cancelled",
      cancellation_reason: reason ?? null,
      cancelled_at: new Date(),
    });
  }

  async getPolicyDetails(policyId: string): Promise<
    PolicyRecord & {
      claims: ClaimRecord[];
      isExpired: boolean;
      totalClaimed: number;
      remainingCoverage: number;
    }
  > {
    const svc = this as unknown as InsuranceServiceBase;
    const policy = await svc.retrieveInsPolicy(policyId);
    const claimList = await svc.listInsClaims({ policy_id: policyId });

    const isExpired = new Date(policy.end_date) < new Date();

    return {
      ...policy,
      claims: claimList,
      isExpired,
      totalClaimed: claimList.reduce(
        (sum, c) => sum + Number(c.claim_amount ?? 0),
        0,
      ),
      remainingCoverage:
        Number(policy.coverage_amount) -
        claimList.reduce((sum, c) => sum + Number(c.payout_amount ?? 0), 0),
    };
  }
}

export default InsuranceModuleService;
