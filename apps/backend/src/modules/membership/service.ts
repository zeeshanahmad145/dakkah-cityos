import { MedusaService } from "@medusajs/framework/utils";
import MembershipTier from "./models/membership-tier";
import Membership from "./models/membership";
import PointsLedger from "./models/points-ledger";
import Reward from "./models/reward";
import Redemption from "./models/redemption";

class MembershipModuleService extends MedusaService({
  MembershipTier,
  Membership,
  PointsLedger,
  Reward,
  Redemption,
}) {
  /** Enroll a customer in a membership plan */
  async enrollMember(
    customerId: string,
    tierId: string,
    tenantId: string,
  ): Promise<any> {
    if (!customerId || !tierId) {
      throw new Error("Customer ID and tier ID are required");
    }

    const existing = await this.listMemberships({
      customer_id: customerId,
      status: "active",
    }) as any;
    const list = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (list.length > 0) {
      throw new Error("Customer already has an active membership");
    }

    const tier = await this.retrieveMembershipTier(tierId) as any;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    return await this.createMemberships({
      customer_id: customerId,
      tier_id: tierId,
      tenant_id: tenantId,
      status: "active",
      start_date: startDate,
      end_date: endDate,
      auto_renew: true,
    } as any);
  }

  /** Cancel an active membership */
  async cancelMembership(membershipId: string): Promise<any> {
    const membership = await this.retrieveMembership(membershipId) as any;

    if (membership.status !== "active") {
      throw new Error("Only active memberships can be cancelled");
    }

    return await this.updateMemberships({
      id: membershipId,
      status: "cancelled",
      auto_renew: false,
      cancelled_at: new Date(),
    } as any);
  }

  /** Check if a membership grants access to a specific feature */
  async checkAccess(membershipId: string, feature: string): Promise<boolean> {
    const membership = await this.retrieveMembership(membershipId) as any;

    if (membership.status !== "active") return false;
    if (new Date(membership.expires_at) < new Date()) return false;

    const tier = await this.retrieveMembershipTier(membership.tier_id) as any;
    const benefits = tier.benefits as string[] | null;

    if (!benefits || !Array.isArray(benefits)) return false;

    return benefits.includes(feature) || benefits.includes("all");
  }

  /** Renew an existing membership for another term */
  async renewMembership(membershipId: string): Promise<any> {
    const membership = await this.retrieveMembership(membershipId) as any;

    if (!["active", "expired"].includes(membership.status)) {
      throw new Error("Membership cannot be renewed from current status");
    }

    const newEndDate = new Date(membership.expires_at);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    if (newEndDate < new Date()) {
      newEndDate.setTime(new Date().getTime());
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    return await this.updateMemberships({
      id: membershipId,
      status: "active",
      end_date: newEndDate,
      renewed_at: new Date(),
    } as any);
  }
}

export default MembershipModuleService;
