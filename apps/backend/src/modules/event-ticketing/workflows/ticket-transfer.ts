import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

// ─── Steps ────────────────────────────────────────────────────────────────────

const validateTicketForTransfer = createStep(
  "validate-ticket-for-transfer",
  async (input: { ticketId: string; newOwnerId: string }, { container }) => {
    const ticketingService = container.resolve("event-ticketing") as unknown as any;
    const capacity = await ticketingService
      .getEventCapacity(input.ticketId)
      .catch(() => null);
    return new StepResponse({
      ticketId: input.ticketId,
      valid: true,
      capacity,
    });
  },
);

const transferTicketOwnership = createStep(
  "transfer-ticket-ownership",
  async (input: { ticketId: string; newOwnerId: string }, { container }) => {
    const ticketingService = container.resolve("event-ticketing") as unknown as any;
    const ticket = await ticketingService.transferTicket(
      input.ticketId,
      input.newOwnerId,
    );
    return new StepResponse(ticket, {
      previousOwnerId: ticket.transferred_from,
      ticketId: input.ticketId,
    });
  },
  async (
    {
      previousOwnerId,
      ticketId,
    }: { previousOwnerId: string; ticketId: string },
    { container },
  ) => {
    if (previousOwnerId) {
      const ticketingService = container.resolve("event-ticketing") as unknown as any;
      await ticketingService
        .transferTicket(ticketId, previousOwnerId)
        .catch(() => null);
    }
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const ticketTransferWorkflow = createWorkflow(
  "ticket-transfer",
  // @ts-ignore: workflow builder return type
  (input: { ticketId: string; newOwnerId: string }) => {
    const validation = validateTicketForTransfer(input);
    const transfer = transferTicketOwnership(input);
    return { validation, transfer };
  },
);
