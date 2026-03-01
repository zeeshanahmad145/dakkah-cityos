import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Dunning Management Workflow
 * Retry sequence: Day 1 → Day 3 → Day 7 → Cancel
 * Triggered when a billing cycle payment fails.
 */
const retryBillingStep = createStep(
  "retry-billing",
  async (
    {
      billingCycleId,
      attemptNumber,
    }: { billingCycleId: string; attemptNumber: number },
    { container },
  ) => {
    const subscriptionService = container.resolve("subscription") as unknown as any;

    // Simulate payment retry (integrate with Stripe in real impl)
    const paymentSucceeded = false; // Placeholder — wire to actual payment provider

    if (paymentSucceeded) {
      await subscriptionService.processBillingCycle(billingCycleId);
      return new StepResponse({ status: "recovered", billingCycleId });
    } else {
      const failureReason = `Retry attempt ${attemptNumber} failed`;
      await subscriptionService.handleFailedBilling(
        billingCycleId,
        failureReason,
      );
      return new StepResponse({
        status: "failed",
        billingCycleId,
        attemptNumber,
      });
    }
  },
);

const cancelSubscriptionOnDunningExhausted = createStep(
  "cancel-on-dunning-exhausted",
  async (
    {
      subscriptionId,
      billingCycleId,
    }: { subscriptionId: string; billingCycleId: string },
    { container },
  ) => {
    const subscriptionService = container.resolve("subscription") as unknown as any;

    await subscriptionService.cancelSubscription(subscriptionId, {
      cancelImmediately: true,
      reason: "Payment failed after dunning sequence exhausted",
    });

    await subscriptionService.logSubscriptionEvent(subscriptionId, "churned", {
      billing_cycle_id: billingCycleId,
      reason: "dunning_exhausted",
    });

    return new StepResponse({ subscriptionId, status: "churned" });
  },
);

export const dunningManagementWorkflow = createWorkflow(
  "dunning-management",
  // @ts-ignore: workflow builder type
  (input: {
    billingCycleId: string;
    subscriptionId: string;
    attemptNumber: number;
  }) => {
    const retryResult = retryBillingStep({
      billingCycleId: input.billingCycleId,
      attemptNumber: input.attemptNumber,
    });

    // After 3 failed attempts (days 1, 3, 7) — cancel
    if (input.attemptNumber >= 3) {
      const cancelResult = cancelSubscriptionOnDunningExhausted({
        subscriptionId: input.subscriptionId,
        billingCycleId: input.billingCycleId,
      });
      return { retryResult, cancelResult };
    }

    return { retryResult };
  },
);
