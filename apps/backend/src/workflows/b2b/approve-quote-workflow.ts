// @ts-nocheck
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { logger } from "../../lib/logger";
import { config } from "../../lib/config";

interface ApproveQuoteInput {
  quote_id: string;
  approved_by: string;
  custom_discount_percentage?: number;
  custom_discount_amount?: string;
  discount_reason?: string;
  valid_days?: number;
}

// Step 1: Validate quote status
const validateQuoteStep = createStep(
  "validate-quote",
  async (input: ApproveQuoteInput, { container }) => {
    const quoteService = container.resolve("quote") as Record<string, unknown>;
    const quote = await (
      quoteService as {
        retrieveQuote: (id: string) => Promise<Record<string, unknown>>;
      }
    ).retrieveQuote(input.quote_id);

    if (!["submitted", "under_review"].includes(quote.status as string)) {
      throw new Error(`Cannot approve quote with status: ${quote.status}`);
    }

    return new StepResponse({ quote, input }, null);
  },
);

// Step 2: Apply custom discount if provided
const applyDiscountStep = createStep(
  "apply-discount",
  async (
    {
      input,
      quote,
    }: { input: ApproveQuoteInput; quote: Record<string, unknown> },
    { container },
  ) => {
    if (input.custom_discount_percentage || input.custom_discount_amount) {
      const quoteService = container.resolve("quote") as Record<
        string,
        unknown
      >;

      await (
        quoteService as {
          applyCustomDiscount: (
            id: string,
            pct?: number,
            amt?: bigint,
            reason?: string,
          ) => Promise<void>;
        }
      ).applyCustomDiscount(
        input.quote_id,
        input.custom_discount_percentage,
        input.custom_discount_amount
          ? BigInt(input.custom_discount_amount)
          : undefined,
        input.discount_reason,
      );
    }
    return new StepResponse(
      { discountApplied: true },
      {
        quoteId: input.quote_id,
        hadDiscount: !!(
          input.custom_discount_percentage || input.custom_discount_amount
        ),
      },
    );
  },
  async (
    compensationData: { quoteId: string; hadDiscount: boolean },
    { container },
  ) => {
    if (!compensationData?.quoteId || !compensationData.hadDiscount) return;
    try {
      const quoteService = container.resolve("quote") as unknown as any;
      await quoteService.applyCustomDiscount(
        compensationData.quoteId,
        undefined,
        undefined,
        undefined,
      );
    } catch (error) {}
  },
);

// Step 3: Update quote status
const updateQuoteStatusStep = createStep(
  "update-quote-status",
  async (
    {
      input,
      quote,
    }: { input: ApproveQuoteInput; quote: Record<string, unknown> },
    { container },
  ) => {
    const previousStatus = quote.status as string;
    const quoteService = container.resolve("quote") as Record<string, unknown>;

    const validUntil = input.valid_days
      ? new Date(Date.now() + input.valid_days * 24 * 60 * 60 * 1000)
      : null;

    const approvedQuote = await (
      quoteService as {
        updateQuotes: (
          data: Record<string, unknown>,
        ) => Promise<Record<string, unknown>>;
      }
    ).updateQuotes({
      id: input.quote_id,
      status: "approved",
      reviewed_by: input.approved_by,
      reviewed_at: new Date(),
      valid_from: new Date(),
      valid_until: validUntil,
    });

    return new StepResponse(
      { approvedQuote },
      { quoteId: input.quote_id, previousStatus },
    );
  },
  async (
    compensationData: { quoteId: string; previousStatus: string },
    { container },
  ) => {
    if (!compensationData?.quoteId) return;
    try {
      const quoteService = container.resolve("quote") as unknown as any;
      await quoteService.updateQuotes({
        id: compensationData.quoteId,
        status: compensationData.previousStatus,
        reviewed_by: null,
        reviewed_at: null,
        valid_from: null,
        valid_until: null,
      });
    } catch (error) {}
  },
);

// Step 4: Send notification
const sendNotificationStep = createStep(
  "send-notification",
  async (
    { approvedQuote }: { approvedQuote: Record<string, unknown> },
    { container },
  ) => {
    try {
      // Attempt to use notification module if available
      const notificationService = container.resolve("notification") as Record<
        string,
        unknown
      > | null;

      if (
        notificationService &&
        typeof (notificationService as { send?: unknown }).send === "function"
      ) {
        await (
          notificationService as {
            send: (data: Record<string, unknown>) => Promise<void>;
          }
        ).send({
          to: approvedQuote.customer_email as string,
          channel: "email",
          template: "quote-approved",
          data: {
            quote_number: approvedQuote.quote_number,
            quote_id: approvedQuote.id,
            valid_until: approvedQuote.valid_until,
            total: approvedQuote.total,
            storefront_url: config.storefrontUrl,
          },
        });
        logger.info(
          "quote-approved-notification",
          `Notification sent for quote ${approvedQuote.quote_number}`,
        );
      } else {
        // Fallback: emit event for subscriber to handle
        const eventBus = container.resolve("event_bus") as {
          emit: (event: string, data: Record<string, unknown>) => Promise<void>;
        };
        await eventBus.emit("quote.approved", {
          id: approvedQuote.id,
          quote_number: approvedQuote.quote_number,
          customer_email: approvedQuote.customer_email,
        });
        logger.info(
          "quote-approved-event",
          `Quote approved event emitted for ${approvedQuote.quote_number}`,
        );
      }

      return new StepResponse({ notificationSent: true }, null);
    } catch (error) {
      // Log error but don't fail the workflow - notification is not critical
      logger.error(
        "quote-notification-failed",
        `Failed to send notification for quote ${approvedQuote.quote_number}`,
        { error },
      );
      return new StepResponse(
        { notificationSent: false, error: (error as Error).message },
        null,
      );
    }
  },
  async (compensationData: null) => {
    return;
  },
);

/**
 * Approve Quote Workflow
 *
 * Sales team approves a quote request with optional custom pricing.
 * Sets validity period and notifies customer.
 */
export const approveQuoteWorkflow = createWorkflow(
  "approve-quote",
  (input: ApproveQuoteInput) => {
    // 1. Validate quote status
    const { quote } = validateQuoteStep(input);

    // 2. Apply custom discount if provided
    applyDiscountStep({ input, quote });

    // 3. Update quote status
    const { approvedQuote } = updateQuoteStatusStep({ input, quote });

    // 4. Send notification
    sendNotificationStep({ approvedQuote });

    return new WorkflowResponse({ quote: approvedQuote });
  },
);
