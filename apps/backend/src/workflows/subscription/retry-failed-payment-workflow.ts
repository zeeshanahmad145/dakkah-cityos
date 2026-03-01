import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

interface RetryFailedPaymentInput {
  subscription_id: string;
}

// Step 1: Check subscription and retry eligibility
const checkRetryEligibilityStep = createStep(
  "check-retry-eligibility",
  async (input: RetryFailedPaymentInput, { container }) => {
    const subscriptionModule = container.resolve("subscription") as unknown as any;

    const subscription = await subscriptionModule.retrieveSubscription(
      input.subscription_id,
    );

    if (!subscription) {
      throw new Error(`Subscription ${input.subscription_id} not found`);
    }

    if (subscription.status !== "past_due") {
      throw new Error(
        `Subscription ${input.subscription_id} is not in past_due status`,
      );
    }

    if (subscription.retry_count >= (subscription.max_retry_attempts || 3)) {
      throw new Error(
        `Subscription ${input.subscription_id} has exceeded max retry attempts`,
      );
    }

    return new StepResponse({ subscription });
  },
);

// Step 2: Attempt payment retry
const retryPaymentStep = createStep(
  "retry-payment",
  async (
    { subscription }: { subscription: Record<string, unknown> },
    { container },
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

    // Find the most recent failed billing cycle
    const { data: failedCycles } = await query.graph({
      entity: "billing_cycle",
      fields: ["*"],
      filters: {
        subscription_id: subscription.id as string,
        status: "failed",
      },
      pagination: {
        order: { created_at: "DESC" },
        take: 1,
      },
    });

    if (!failedCycles?.[0]) {
      throw new Error(
        `No failed billing cycle found for subscription ${subscription.id}`,
      );
    }

    const cycle = failedCycles[0] as Record<string, unknown>;

    // Attempt to process the billing cycle again
    // This would call the payment provider
    try {
      // Simulate payment retry
      // const paymentModule = container.resolve("payment") as unknown as any;
      // const result = await paymentModule.retryPayment({
      //   payment_method_id: subscription.payment_method_id,
      //   amount: cycle.total,
      //   currency: subscription.currency_code,
      // });

      const success = Math.random() > 0.3; // 70% success rate simulation

      if (!success) {
        throw new Error("Payment failed");
      }

      return new StepResponse({ success: true, cycle });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error";
      return new StepResponse({ success: false, error: errorMessage, cycle });
    }
  },
);

// Step 3: Update subscription based on retry result
const updateSubscriptionStatusStep = createStep(
  "update-subscription-status",
  async (
    {
      subscription,
      retryResult,
    }: {
      subscription: Record<string, unknown>;
      retryResult: Record<string, unknown>;
    },
    { container },
  ) => {
    const subscriptionModule = container.resolve("subscription") as unknown as any;

    const previousStatus = subscription.status as string;
    const previousRetryCount = (subscription.retry_count as number) || 0;
    const previousNextRetryAt = subscription.next_retry_at;

    if (retryResult.success) {
      const cycle = retryResult.cycle as Record<string, unknown>;
      const previousCycleStatus = cycle.status;

      await subscriptionModule.updateBillingCycles({
        id: cycle.id,
        status: "completed",
        completed_at: new Date(),
      });

      await subscriptionModule.updateSubscriptions({
        id: subscription.id,
        status: "active",
        retry_count: 0,
        last_retry_at: new Date(),
        next_retry_at: null,
      });

      return new StepResponse(
        { status: "active", message: "Payment retry successful" },
        {
          subscriptionId: subscription.id as string,
          previousStatus,
          previousRetryCount,
          previousNextRetryAt,
          cycleId: cycle.id as string,
          previousCycleStatus,
        },
      );
    } else {
      const newRetryCount = ((subscription.retry_count as number) || 0) + 1;
      const maxRetryAttempts = (subscription.max_retry_attempts as number) || 3;
      const maxReached = newRetryCount >= maxRetryAttempts;

      const retryDelays = [1, 3, 7];
      const nextRetryDelay = retryDelays[newRetryCount - 1] || 7;
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + nextRetryDelay);

      await subscriptionModule.updateSubscriptions({
        id: subscription.id,
        status: maxReached ? "canceled" : "past_due",
        retry_count: newRetryCount,
        last_retry_at: new Date(),
        next_retry_at: maxReached ? null : nextRetryDate,
        canceled_at: maxReached ? new Date() : null,
      });

      return new StepResponse(
        {
          status: maxReached ? "canceled" : "past_due",
          message: maxReached
            ? "Max retry attempts reached, subscription canceled"
            : `Payment retry failed, will retry on ${nextRetryDate.toISOString()}`,
        },
        {
          subscriptionId: subscription.id as string,
          previousStatus,
          previousRetryCount,
          previousNextRetryAt,
        },
      );
    }
  },
  async (
    compensationData: {
      subscriptionId: string;
      previousStatus: string;
      previousRetryCount: number;
      previousNextRetryAt: any;
      cycleId?: string;
      previousCycleStatus?: string;
    },
    { container },
  ) => {
    if (!compensationData?.subscriptionId) return;
    try {
      const subscriptionModule = container.resolve("subscription") as unknown as any;
      await subscriptionModule.updateSubscriptions({
        id: compensationData.subscriptionId,
        status: compensationData.previousStatus,
        retry_count: compensationData.previousRetryCount,
        next_retry_at: compensationData.previousNextRetryAt,
        canceled_at: null,
      });
      if (compensationData.cycleId && compensationData.previousCycleStatus) {
        await subscriptionModule.updateBillingCycles({
          id: compensationData.cycleId,
          status: compensationData.previousCycleStatus,
          completed_at: null,
        });
      }
    } catch (error) {}
  },
);

// Step 4: Send dunning notification
const sendDunningNotificationStep = createStep(
  "send-dunning-notification",
  async (
    {
      subscription,
      result,
    }: {
      subscription: Record<string, unknown>;
      result: Record<string, unknown>;
    },
    { container },
  ) => {
    // Send email notification to customer
    // const notificationService = container.resolve("notification") as unknown as any;

    const message =
      result.status === "canceled"
        ? "Your subscription has been canceled due to payment failure"
        : result.status === "active"
          ? "Your payment was successful and subscription is now active"
          : "Your payment failed, we will retry soon";

    // await notificationService.send({
    //   to: subscription.customer_email,
    //   template: "subscription-dunning",
    //   data: {
    //     subscription_id: subscription.id,
    //     status: result.status,
    //     message,
    //   },
    // });

    return new StepResponse({ notificationSent: true });
  },
);

export const retryFailedPaymentWorkflow = createWorkflow(
  "retry-failed-payment",
  (input: RetryFailedPaymentInput) => {
    // Check eligibility
    const { subscription } = checkRetryEligibilityStep(input);

    // Retry payment
    const retryResult = retryPaymentStep({ subscription });

    // Update status
    const result = updateSubscriptionStatusStep({ subscription, retryResult });

    // Send notification
    sendDunningNotificationStep({ subscription, result });

    return new WorkflowResponse(result);
  },
);
