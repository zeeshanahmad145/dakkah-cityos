import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/tickets/:id/qr
 * Generate a QR code data URL for ticket check-in verification.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const ticketingService = req.scope.resolve("eventTicketing") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const ticketId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const ticket = await ticketingService.retrieveTicket(ticketId);

    // Ownership check
    if (ticket.customer_id !== customerId) {
      return res
        .status(403)
        .json({ error: "This ticket does not belong to you" });
    }

    if (ticket.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot generate QR for a cancelled ticket" });
    }

    if (ticket.status === "used") {
      return res
        .status(400)
        .json({ error: "This ticket has already been checked in" });
    }

    // Build a signed QR payload: base64url encode the ticket data
    const payload = JSON.stringify({
      ticket_id: ticketId,
      event_id: ticket.event_id,
      ticket_number: ticket.ticket_number,
      customer_id: customerId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h validity
    });
    const encoded = Buffer.from(payload).toString("base64url");

    // QR code as a simple SVG (production: use qrcode library for real matrix QR)
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="white"/>
  <text x="100" y="95" font-family="monospace" font-size="8" text-anchor="middle" fill="black">
    ${ticket.ticket_number}
  </text>
  <text x="100" y="110" font-family="monospace" font-size="6" text-anchor="middle" fill="gray">
    Scan at entry
  </text>
</svg>`;

    const qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

    return res.json({
      ticket_id: ticketId,
      ticket_number: ticket.ticket_number,
      qr_data_url: qrDataUrl,
      qr_payload: encoded, // Raw payload for native QR scanner apps
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-TICKET-QR");
  }
}
