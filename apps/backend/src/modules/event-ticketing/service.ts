import { MedusaService } from "@medusajs/framework/utils"
import Event from "./models/event"
import TicketType from "./models/ticket-type"
import Ticket from "./models/ticket"
import Venue from "./models/venue"
import SeatMap from "./models/seat-map"
import CheckIn from "./models/check-in"

class EventTicketingModuleService extends MedusaService({
  Event,
  TicketType,
  Ticket,
  Venue,
  SeatMap,
  CheckIn,
}) {
  /** Reserve tickets for an event */
  async reserveTickets(eventId: string, quantity: number, ticketTypeId: string, customerId?: string): Promise<any[]> {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero")
    }

    const event = await this.retrieveEvent(eventId) as any
    if (event.status !== "published" && event.status !== "active") {
      throw new Error("Event is not available for ticket sales")
    }

    if (new Date(event.start_date) < new Date()) {
      throw new Error("Event has already started")
    }

    const capacity = await this.getEventCapacity(eventId)
    if (capacity.available < quantity) {
      throw new Error(`Only ${capacity.available} tickets available`)
    }

    const tickets: any[] = []
    for (let i = 0; i < quantity; i++) {
      const ticketCode = `TK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      const ticket = await (this as any).createTickets({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        customer_id: customerId || null,
        ticket_code: ticketCode,
        status: "reserved",
        reserved_at: new Date(),
      })
      tickets.push(ticket)
    }

    return tickets
  }

  /** Issue a reserved ticket (confirm purchase) */
  async issueTicket(ticketId: string): Promise<any> {
    const ticket = await this.retrieveTicket(ticketId) as any

    if (ticket.status !== "reserved") {
      throw new Error("Only reserved tickets can be issued")
    }

    return await (this as any).updateTickets({
      id: ticketId,
      status: "issued",
      issued_at: new Date(),
    })
  }

  /** Cancel a ticket and release capacity */
  async cancelTicket(ticketId: string, reason?: string): Promise<any> {
    const ticket = await this.retrieveTicket(ticketId) as any

    if (["cancelled", "used"].includes(ticket.status)) {
      throw new Error("Ticket cannot be cancelled")
    }

    return await (this as any).updateTickets({
      id: ticketId,
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: reason || null,
    })
  }

  async purchaseTicket(eventId: string, data: {
    customerId: string
    ticketTierId: string
    quantity: number
    seatPreference?: string
  }): Promise<any> {
    if (!data.customerId || !data.ticketTierId || !data.quantity) {
      throw new Error("Customer ID, ticket tier ID, and quantity are required")
    }
    if (data.quantity <= 0 || data.quantity > 10) {
      throw new Error("Quantity must be between 1 and 10")
    }

    const tickets = await this.reserveTickets(eventId, data.quantity, data.ticketTierId, data.customerId)

    for (const ticket of tickets) {
      await (this as any).updateTickets({
        id: ticket.id,
        status: "issued",
        issued_at: new Date(),
        seat_preference: data.seatPreference || null,
      })
    }

    return {
      eventId,
      customerId: data.customerId,
      tickets,
      quantity: data.quantity,
      purchasedAt: new Date(),
    }
  }

  async checkIn(ticketId: string): Promise<any> {
    const ticket = await this.retrieveTicket(ticketId) as any

    if (ticket.status === "used") {
      throw new Error("Ticket has already been used")
    }
    if (ticket.status === "cancelled") {
      throw new Error("Ticket has been cancelled")
    }
    if (ticket.status !== "issued" && ticket.status !== "reserved") {
      throw new Error("Ticket is not valid for check-in")
    }

    await (this as any).updateTickets({
      id: ticketId,
      status: "used",
      checked_in_at: new Date(),
    })

    await (this as any).createCheckIns({
      ticket_id: ticketId,
      event_id: ticket.event_id,
      checked_in_at: new Date(),
    })

    return await this.retrieveTicket(ticketId)
  }

  async getEventDashboard(eventId: string): Promise<{
    event: any
    capacity: { total: number; sold: number; reserved: number; available: number }
    revenue: number
    checkInRate: number
    ticketBreakdown: Record<string, number>
  }> {
    const event = await this.retrieveEvent(eventId) as any
    const capacity = await this.getEventCapacity(eventId)

    const tickets = await this.listTickets({ event_id: eventId }) as any
    const ticketList = Array.isArray(tickets) ? tickets : [tickets].filter(Boolean)

    let revenue = 0
    const ticketBreakdown: Record<string, number> = {}
    let checkedIn = 0

    for (const ticket of ticketList) {
      if (ticket.status !== "cancelled") {
        revenue += Number(ticket.price || 0)
      }
      const status = ticket.status || "unknown"
      ticketBreakdown[status] = (ticketBreakdown[status] || 0) + 1
      if (ticket.status === "used") {
        checkedIn++
      }
    }

    const issuedAndUsed = (ticketBreakdown["issued"] || 0) + (ticketBreakdown["used"] || 0)
    const checkInRate = issuedAndUsed > 0 ? Math.round((checkedIn / issuedAndUsed) * 10000) / 100 : 0

    return {
      event,
      capacity,
      revenue,
      checkInRate,
      ticketBreakdown,
    }
  }

  async transferTicket(ticketId: string, newOwnerId: string): Promise<any> {
    if (!ticketId || !newOwnerId) {
      throw new Error("Ticket ID and new owner ID are required")
    }
    const ticket = await this.retrieveTicket(ticketId) as any

    if (ticket.status === "used") {
      throw new Error("Used tickets cannot be transferred")
    }
    if (ticket.status === "cancelled") {
      throw new Error("Cancelled tickets cannot be transferred")
    }

    const event = await this.retrieveEvent(ticket.event_id) as any
    if (new Date(event.start_date) < new Date()) {
      throw new Error("Cannot transfer tickets for events that have already started")
    }

    const previousOwner = ticket.customer_id
    await (this as any).updateTickets({
      id: ticketId,
      customer_id: newOwnerId,
      transferred_at: new Date(),
      transferred_from: previousOwner,
    })

    return await this.retrieveTicket(ticketId)
  }

  async selectSeat(eventId: string, seatId: string, customerId: string): Promise<any> {
    if (!eventId || !seatId || !customerId) {
      throw new Error("Event ID, seat ID, and customer ID are required")
    }

    const event = await this.retrieveEvent(eventId) as any
    if (event.status !== "published" && event.status !== "active") {
      throw new Error("Event is not available for seat selection")
    }

    const existingTickets = await this.listTickets({ event_id: eventId, seat_id: seatId }) as any
    const ticketList = Array.isArray(existingTickets) ? existingTickets : [existingTickets].filter(Boolean)
    const conflicting = ticketList.filter((t: any) => t.status === "reserved" || t.status === "issued" || t.status === "used")

    if (conflicting.length > 0) {
      throw new Error("Seat is already reserved or sold")
    }

    const ticketCode = `TK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const ticket = await (this as any).createTickets({
      event_id: eventId,
      customer_id: customerId,
      seat_id: seatId,
      ticket_code: ticketCode,
      status: "reserved",
      reserved_at: new Date(),
    })

    return ticket
  }

  async processRefund(ticketId: string, reason?: string): Promise<{
    ticketId: string
    refundType: string
    refundPercentage: number
    reason: string
  }> {
    const ticket = await this.retrieveTicket(ticketId) as any

    if (ticket.status === "cancelled" || ticket.status === "used") {
      throw new Error("Ticket cannot be refunded")
    }

    const event = await this.retrieveEvent(ticket.event_id) as any
    const eventDate = new Date(event.start_date)
    const now = new Date()
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let refundType: string
    let refundPercentage: number

    if (hoursUntilEvent > 72) {
      refundType = "full"
      refundPercentage = 100
    } else if (hoursUntilEvent > 24) {
      refundType = "partial"
      refundPercentage = 50
    } else {
      refundType = "none"
      refundPercentage = 0
    }

    await (this as any).updateTickets({
      id: ticketId,
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: reason || "Refund requested",
      refund_type: refundType,
      refund_percentage: refundPercentage,
    })

    return { ticketId, refundType, refundPercentage, reason: reason || "Refund requested" }
  }

  async joinWaitlist(eventId: string, ticketTypeId: string, customerId: string): Promise<any> {
    if (!eventId || !ticketTypeId || !customerId) {
      throw new Error("Event ID, ticket type ID, and customer ID are required")
    }

    const event = await this.retrieveEvent(eventId) as any
    if (event.status !== "published" && event.status !== "active") {
      throw new Error("Event is not available")
    }

    const capacity = await this.getEventCapacity(eventId)
    if (capacity.available > 0) {
      throw new Error("Tickets are still available - no need to join waitlist")
    }

    const ticketCode = `WL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const waitlistEntry = await (this as any).createTickets({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      customer_id: customerId,
      ticket_code: ticketCode,
      status: "waitlisted",
      waitlisted_at: new Date(),
    })

    return waitlistEntry
  }

  /** Get event capacity and availability */
  async getEventCapacity(eventId: string): Promise<{ total: number; sold: number; reserved: number; available: number }> {
    const event = await this.retrieveEvent(eventId) as any
    const totalCapacity = Number(event.capacity || event.max_capacity || 0)

    const tickets = await this.listTickets({ event_id: eventId }) as any
    const ticketList = Array.isArray(tickets) ? tickets : [tickets].filter(Boolean)

    const sold = ticketList.filter((t: any) => t.status === "issued" || t.status === "used").length
    const reserved = ticketList.filter((t: any) => t.status === "reserved").length
    const available = Math.max(0, totalCapacity - sold - reserved)

    return { total: totalCapacity, sold, reserved, available }
  }
}

export default EventTicketingModuleService
