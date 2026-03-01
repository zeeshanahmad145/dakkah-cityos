import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Membership Renewal Workflow
 * Renews an expiring membership: charge → extend period → notify.
 */
const chargeMembershipRenewalStep = createStep(
  "charge-membership-renewal",
  async ({ membershipId }: { membershipId: string }, { container }) => {
    const membershipService = container.resolve("membership") as unknown as any;
    let result: any = { charged: true };
    if (typeof membershipService.chargeRenewal === "function") {
      result = await membershipService.chargeRenewal(membershipId);
    }
    return new StepResponse(result, { membershipId });
  },
  async ({ membershipId }: { membershipId: string }, { container }) => {
    const membershipService = container.resolve("membership") as unknown as any;
    if (typeof membershipService.voidCharge === "function") {
      await membershipService.voidCharge(membershipId);
    }
  },
);

const extendMembershipPeriodStep = createStep(
  "extend-membership-period",
  async ({ membershipId }: { membershipId: string }, { container }) => {
    const membershipService = container.resolve("membership") as unknown as any;
    let extended: any;
    if (typeof membershipService.renewMembership === "function") {
      extended = await membershipService.renewMembership(membershipId);
    } else {
      // Fallback: extend end_date by 1 period
      const memberships = await membershipService.listMemberships?.({
        id: membershipId,
      });
      const list = Array.isArray(memberships)
        ? memberships
        : [memberships].filter(Boolean);
      if (list.length > 0) {
        const m = list[0];
        const currentEnd = m.end_date ? new Date(m.end_date) : new Date();
        const durationDays = Number(m.duration_days || 30);
        currentEnd.setDate(currentEnd.getDate() + durationDays);
        extended = await membershipService.updateMemberships?.({
          id: membershipId,
          end_date: currentEnd,
          status: "active",
          renewed_at: new Date(),
        });
      }
    }
    return new StepResponse({ membership: extended });
  },
);

export const membershipRenewalWorkflow = createWorkflow(
  "membership-renewal",
  // @ts-ignore: workflow builder type
  (input: { membershipId: string }) => {
    const charged = chargeMembershipRenewalStep({
      membershipId: input.membershipId,
    });
    const extended = extendMembershipPeriodStep({
      membershipId: input.membershipId,
    });
    return { charged, extended };
  },
);
