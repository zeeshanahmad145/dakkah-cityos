import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Quote Approval Workflow
 * Handles the B2B quote approval chain: draft → submitted → approved/rejected → converted to order.
 */
const requestApprovalStep = createStep(
  "request-quote-approval",
  async (
    { quoteId, requestedBy }: { quoteId: string; requestedBy: string },
    { container },
  ) => {
    const quoteService = container.resolve("quote") as unknown as any;

    await quoteService.updateQuotes({
      id: quoteId,
      status: "pending_approval",
      submitted_by: requestedBy,
      submitted_at: new Date(),
    });

    return new StepResponse({ quoteId, status: "pending_approval" });
  },
  async ({ quoteId }: { quoteId: string }, { container }) => {
    const quoteService = container.resolve("quote") as unknown as any;
    await quoteService.updateQuotes({ id: quoteId, status: "draft" });
  },
);

const approveQuoteStep = createStep(
  "approve-quote",
  async (
    {
      quoteId,
      approvedBy,
      notes,
    }: { quoteId: string; approvedBy: string; notes?: string },
    { container },
  ) => {
    const quoteService = container.resolve("quote") as unknown as any;

    await quoteService.updateQuotes({
      id: quoteId,
      status: "accepted",
      approved_by: approvedBy,
      approved_at: new Date(),
      internal_notes: notes,
    });

    return new StepResponse({ quoteId, status: "accepted" });
  },
);

const rejectQuoteStep = createStep(
  "reject-quote",
  async (
    {
      quoteId,
      rejectedBy,
      reason,
    }: { quoteId: string; rejectedBy: string; reason?: string },
    { container },
  ) => {
    const quoteService = container.resolve("quote") as unknown as any;

    await quoteService.updateQuotes({
      id: quoteId,
      status: "rejected",
      rejected_by: rejectedBy,
      rejected_at: new Date(),
      rejection_reason: reason,
    });

    return new StepResponse({ quoteId, status: "rejected" });
  },
);

export const quoteApprovalWorkflow = createWorkflow(
  "quote-approval",
  // @ts-ignore: workflow builder type
  (input: {
    action: "request" | "approve" | "reject";
    quoteId: string;
    actorId: string;
    notes?: string;
  }) => {
    if (input.action === "request") {
      return requestApprovalStep({
        quoteId: input.quoteId,
        requestedBy: input.actorId,
      });
    }
    if (input.action === "approve") {
      return approveQuoteStep({
        quoteId: input.quoteId,
        approvedBy: input.actorId,
        notes: input.notes,
      });
    }
    return rejectQuoteStep({
      quoteId: input.quoteId,
      rejectedBy: input.actorId,
      reason: input.notes,
    });
  },
);
