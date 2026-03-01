import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

/**
 * GET  /store/tickets  — list customer's purchased tickets
 * POST /store/tickets  — purchase a ticket
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const ticketingService = req.scope.resolve("eventTicketing") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;

    const tickets = await ticketingService.listTickets(
      { customer_id: customerId },
      {
        skip: Number(offset),
        take: Number(limit),
      },
    );
    const list = Array.isArray(tickets) ? tickets : [tickets].filter(Boolean);

    return res.json({
      tickets: list,
      count: list.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-TICKETS-LIST");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const ticketingService = req.scope.resolve("eventTicketing") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      event_id,
      ticket_type_id,
      quantity = 1,
      seat_id,
    } = req.body as {
      event_id: string;
      ticket_type_id: string;
      quantity?: number;
      seat_id?: string;
    };

    if (!event_id || !ticket_type_id) {
      return res
        .status(400)
        .json({ error: "event_id and ticket_type_id are required" });
    }

    // Create tickets (one per quantity)
    const created = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = await ticketingService.createTickets({
        event_id,
        ticket_type_id,
        customer_id: customerId,
        seat_id: seat_id ?? null,
        status: "active",
        ticket_number: `TKT-${Date.now().toString(36).toUpperCase()}-${i}`,
        purchased_at: new Date(),
      });
      created.push(ticket);
    }

    return res.status(201).json({
      tickets: created,
      message: `${quantity} ticket(s) purchased successfully`,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-TICKETS-CREATE");
  }
}
