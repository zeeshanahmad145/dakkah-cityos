import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Subscription Renewal Workflow
 * Fires X days before period end to renew subscription and charge customer.
 */
const renewPeriodStep = createStep(
  "renew-subscription-period",
  async ({ subscriptionId }: { subscriptionId: string }, { container }) => {
    const subscriptionService = container.resolve("subscription") as unknown as any;
    const updated =
      await subscriptionService.renewSubscriptionPeriod(subscriptionId);
    return new StepResponse({
      subscriptionId,
      newPeriodEnd: updated.current_period_end,
    });
  },
  // Compensation: log that renewal failed
  async ({ subscriptionId }: { subscriptionId: string }, { container }) => {
    const subscriptionService = container.resolve("subscription") as unknown as any;
    await subscriptionService.logSubscriptionEvent(
      subscriptionId,
      "renewal_failed",
      {
        reason: "Compensation triggered during renewal workflow",
      },
    );
  },
);

const chargeBillingCycleStep = createStep(
  "charge-billing-cycle",
  async ({ subscriptionId }: { subscriptionId: string }, { container }) => {
    const subscriptionService = container.resolve("subscription") as unknown as any;

    // Create next billing cycle
    const cycle =
      await subscriptionService.createBillingCycleForSubscription(
        subscriptionId,
      );

    // Trigger payment (stub — wire to Stripe payment intent)
    // In real impl: create Stripe PaymentIntent with off_session=true
    return new StepResponse({ billingCycleId: cycle.id, subscriptionId });
  },
);

export const subscriptionRenewalWorkflow = createWorkflow(
  "subscription-renewal",
  // @ts-ignore: workflow builder type
  (input: { subscriptionId: string }) => {
    const renewResult = renewPeriodStep(input);
    const chargeResult = chargeBillingCycleStep(input);
    return { renewResult, chargeResult };
  },
);
