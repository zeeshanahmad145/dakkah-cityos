import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type TicketSelection = {
  ticket_type_id: string;
  quantity: number;
};

type EventTicketingInput = {
  eventId: string;
  customerId: string;
  ticketType: string;
  quantity: number;
  seatPreferences?: string[];
  tickets?: TicketSelection[];
};

const selectTicketsStep = createStep(
  "select-event-tickets-step",
  async (input: EventTicketingInput, { container }) => {
    const eventModule = container.resolve("eventTicketing") as unknown as any;
    const availability = await eventModule.checkAvailability({
      event_id: input.eventId,
      ticket_type: input.ticketType,
      quantity: input.quantity,
    });
    if (!availability.available) throw new Error("Tickets not available");

    let ticketTypes: any[] = [];
    try {
      if (eventModule.listTicketTypes) {
        ticketTypes = await eventModule.listTicketTypes({
          event_id: input.eventId,
        });
      }
    } catch (error) {
      ticketTypes = [];
    }

    return new StepResponse({ availability, ticketTypes });
  },
);

const reserveTicketsStep = createStep(
  "reserve-event-tickets-step",
  async (input: EventTicketingInput, { container }) => {
    const eventModule = container.resolve("eventTicketing") as unknown as any;
    const reservation = await eventModule.createReservation({
      event_id: input.eventId,
      customer_id: input.customerId,
      ticket_type: input.ticketType,
      quantity: input.quantity,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });
    return new StepResponse({ reservation }, { reservationId: reservation.id });
  },
  async (compensationData: { reservationId: string }, { container }) => {
    if (!compensationData?.reservationId) return;
    try {
      const eventModule = container.resolve("eventTicketing") as unknown as any;
      await eventModule.cancelReservation(compensationData.reservationId);
    } catch (error) {}
  },
);

const calculateTicketAmountStep = createStep(
  "calculate-ticket-amount-step",
  async (input: {
    tickets?: TicketSelection[];
    ticketTypes: any[];
    ticketType: string;
    quantity: number;
    availability: any;
  }) => {
    let totalAmount = 0;

    if (
      input.tickets &&
      input.tickets.length > 0 &&
      input.ticketTypes.length > 0
    ) {
      totalAmount = input.tickets.reduce((sum: number, t: TicketSelection) => {
        const ticketType = input.ticketTypes.find(
          (tt: any) => tt.id === t.ticket_type_id,
        );
        return sum + (ticketType?.price || 0) * t.quantity;
      }, 0);
    } else if (input.ticketTypes.length > 0) {
      const matchingType = input.ticketTypes.find(
        (tt: any) =>
          tt.id === input.ticketType ||
          tt.name === input.ticketType ||
          tt.type === input.ticketType,
      );
      totalAmount = (matchingType?.price || 0) * input.quantity;
    } else if (input.availability?.price) {
      totalAmount = input.availability.price * input.quantity;
    }

    if (totalAmount <= 0) {
      throw new Error(
        "Unable to calculate ticket amount: no valid pricing found",
      );
    }

    return new StepResponse({ totalAmount });
  },
);

const processTicketPaymentStep = createStep(
  "process-ticket-payment-step",
  async (
    input: { reservationId: string; customerId: string; amount: number },
    { container },
  ) => {
    const payment = {
      reservation_id: input.reservationId,
      customer_id: input.customerId,
      amount: input.amount,
      status: "captured",
      paid_at: new Date(),
    };
    return new StepResponse({ payment });
  },
);

const issueTicketsStep = createStep(
  "issue-event-tickets-step",
  async (input: {
    reservationId: string;
    eventId: string;
    quantity: number;
  }) => {
    const tickets = Array.from({ length: input.quantity }, (_, i) => ({
      ticket_number: `TKT-${input.eventId}-${Date.now()}-${i + 1}`,
      event_id: input.eventId,
      status: "issued",
      issued_at: new Date(),
    }));
    return new StepResponse({ tickets });
  },
);

export const eventTicketingWorkflow = createWorkflow(
  "event-ticketing-workflow",
  (input: EventTicketingInput) => {
    const { availability, ticketTypes } = selectTicketsStep(input);
    const { reservation } = reserveTicketsStep(input);
    const { totalAmount } = calculateTicketAmountStep({
      tickets: input.tickets,
      ticketTypes,
      ticketType: input.ticketType,
      quantity: input.quantity,
      availability,
    });
    const { payment } = processTicketPaymentStep({
      reservationId: reservation.id,
      customerId: input.customerId,
      amount: totalAmount,
    });
    const { tickets } = issueTicketsStep({
      reservationId: reservation.id,
      eventId: input.eventId,
      quantity: input.quantity,
    });
    return new WorkflowResponse({ reservation, payment, tickets });
  },
);
