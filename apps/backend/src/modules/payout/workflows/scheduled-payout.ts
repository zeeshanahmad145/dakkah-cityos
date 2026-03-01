import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Scheduled Payout Workflow
 * Runs daily/weekly batch to process all pending vendor payouts via Stripe Connect.
 */
const aggregatePendingPayoutsStep = createStep(
  "aggregate-pending-payouts",
  async (
    { vendorId, tenantId }: { vendorId?: string; tenantId: string },
    { container },
  ) => {
    const payoutService = container.resolve("payout") as unknown as any;

    const filters: Record<string, unknown> = { status: "pending", tenant_id: tenantId };
    if (vendorId) filters.vendor_id = vendorId;

    const payouts = await payoutService.listPayouts(filters);
    const payoutList = Array.isArray(payouts)
      ? payouts
      : [payouts].filter(Boolean);

    return new StepResponse({ payouts: payoutList, count: payoutList.length });
  },
);

const processPayoutBatchStep = createStep(
  "process-payout-batch",
  async (
    {
      payouts,
    }: { payouts: Array<{ id: string; vendor_id: string; metadata?: any }> },
    { container },
  ) => {
    const payoutService = container.resolve("payout") as unknown as any;
    const results: Array<{ payoutId: string; status: string }> = [];

    for (const payout of payouts) {
      const stripeAccountId = payout.metadata?.stripe_account_id;
      if (!stripeAccountId) {
        results.push({
          payoutId: payout.id,
          status: "skipped_no_stripe_account",
        });
        continue;
      }

      try {
        await payoutService.processStripeConnectPayout(
          payout.id,
          stripeAccountId,
        );
        results.push({ payoutId: payout.id, status: "completed" });
      } catch (err: any) {
        results.push({ payoutId: payout.id, status: "failed" });
      }
    }

    return new StepResponse({ results });
  },
);

export const scheduledPayoutWorkflow = createWorkflow(
  "scheduled-payout",
  // @ts-ignore: workflow builder type
  (input: { tenantId: string; vendorId?: string }) => {
    const aggregated = aggregatePendingPayoutsStep(input);
    const processed = processPayoutBatchStep({
      payouts: aggregated.payouts,
    });
    return { aggregated, processed };
  },
);
