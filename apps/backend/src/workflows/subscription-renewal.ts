import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type SubscriptionRenewalInput = {
  subscriptionId: string;
  customerId: string;
  planId: string;
  amount: number;
  currency: string;
};

const checkSubscriptionStep = createStep(
  "check-subscription-status-step",
  async (input: SubscriptionRenewalInput, { container }) => {
    const subscriptionModule = container.resolve("subscription") as unknown as any;
    const subscription = await subscriptionModule.retrieveSubscription(
      input.subscriptionId,
    );
    if (subscription.status !== "active")
      throw new Error("Subscription is not active");
    return new StepResponse({ subscription });
  },
);

const chargeRenewalStep = createStep(
  "charge-renewal-step",
  async (input: SubscriptionRenewalInput, { container }) => {
    const paymentModule = container.resolve("payment") as unknown as any;
    const payment = await paymentModule.capturePayment({
      customer_id: input.customerId,
      amount: input.amount,
      currency: input.currency,
    });
    return new StepResponse(
      { payment },
      {
        paymentId: payment.id,
        amount: input.amount,
        customerId: input.customerId,
      },
    );
  },
  async (
    compensationData:
      | { paymentId: string; amount: number; customerId: string }
      | undefined,
    { container },
  ) => {
    if (!compensationData?.paymentId) return;
    try {
      const paymentModule = container.resolve("payment") as unknown as any;
      await paymentModule.refundPayment({
        payment_id: compensationData.paymentId,
        amount: compensationData.amount,
      });
    } catch (error) {}
  },
);

const updateSubscriptionStep = createStep(
  "update-subscription-period-step",
  async (input: { subscriptionId: string }, { container }) => {
    const subscriptionModule = container.resolve("subscription") as unknown as any;
    const existing = await subscriptionModule.retrieveSubscription(
      input.subscriptionId,
    );
    const updated = await subscriptionModule.updateSubscriptions({
      id: input.subscriptionId,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      last_billed_at: new Date(),
    });
    return new StepResponse(
      { subscription: updated },
      {
        subscriptionId: input.subscriptionId,
        previousPeriodStart: existing.current_period_start,
        previousPeriodEnd: existing.current_period_end,
        previousLastBilledAt: existing.last_billed_at,
      },
    );
  },
  async (
    compensationData:
      | {
          subscriptionId: string;
          previousPeriodStart: any;
          previousPeriodEnd: any;
          previousLastBilledAt: any;
        }
      | undefined,
    { container },
  ) => {
    if (!compensationData?.subscriptionId) return;
    try {
      const subscriptionModule = container.resolve("subscription") as unknown as any;
      await subscriptionModule.updateSubscriptions({
        id: compensationData.subscriptionId,
        current_period_start: compensationData.previousPeriodStart,
        current_period_end: compensationData.previousPeriodEnd,
        last_billed_at: compensationData.previousLastBilledAt,
      });
    } catch (error) {}
  },
);

export const subscriptionRenewalWorkflow = createWorkflow(
  "subscription-renewal-workflow",
  (input: SubscriptionRenewalInput) => {
    const { subscription } = checkSubscriptionStep(input);
    const { payment } = chargeRenewalStep(input);
    const updated = updateSubscriptionStep({
      subscriptionId: input.subscriptionId,
    });
    return new WorkflowResponse({
      subscription: updated.subscription,
      payment,
    });
  },
);
