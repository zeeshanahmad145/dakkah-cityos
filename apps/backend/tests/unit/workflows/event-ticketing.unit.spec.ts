import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn }
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Event Ticketing Workflow", () => {
  let selectTicketsStep: any
  let reserveTicketsStep: any
  let calculateTicketAmountStep: any
  let processTicketPaymentStep: any
  let issueTicketsStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/event-ticketing.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    selectTicketsStep = calls.find((c: any) => c[0] === "select-event-tickets-step")?.[1]
    reserveTicketsStep = calls.find((c: any) => c[0] === "reserve-event-tickets-step")?.[1]
    calculateTicketAmountStep = calls.find((c: any) => c[0] === "calculate-ticket-amount-step")?.[1]
    processTicketPaymentStep = calls.find((c: any) => c[0] === "process-ticket-payment-step")?.[1]
    issueTicketsStep = calls.find((c: any) => c[0] === "issue-event-tickets-step")?.[1]
  })

  describe("selectTicketsStep", () => {
    it("should check availability and return ticket types", async () => {
      const ticketTypes = [{ id: "tt_1", name: "VIP", price: 100 }]
      const container = mockContainer({
        eventTicketing: {
          checkAvailability: vi.fn().mockResolvedValue({ available: true }),
          listTicketTypes: vi.fn().mockResolvedValue(ticketTypes),
        },
      })
      const result = await selectTicketsStep(
        { eventId: "evt_1", customerId: "cust_1", ticketType: "VIP", quantity: 2 },
        { container }
      )
      expect(result.availability.available).toBe(true)
      expect(result.ticketTypes).toHaveLength(1)
    })

    it("should throw when tickets are not available", async () => {
      const container = mockContainer({
        eventTicketing: {
          checkAvailability: vi.fn().mockResolvedValue({ available: false }),
        },
      })
      await expect(
        selectTicketsStep(
          { eventId: "evt_1", customerId: "cust_1", ticketType: "VIP", quantity: 2 },
          { container }
        )
      ).rejects.toThrow("Tickets not available")
    })

    it("should handle missing listTicketTypes gracefully", async () => {
      const container = mockContainer({
        eventTicketing: {
          checkAvailability: vi.fn().mockResolvedValue({ available: true }),
        },
      })
      const result = await selectTicketsStep(
        { eventId: "evt_1", customerId: "cust_1", ticketType: "GA", quantity: 1 },
        { container }
      )
      expect(result.ticketTypes).toEqual([])
    })
  })

  describe("calculateTicketAmountStep", () => {
    it("should calculate amount from ticket selections and ticket types", async () => {
      const tickets = [
        { ticket_type_id: "tt_1", quantity: 2 },
        { ticket_type_id: "tt_2", quantity: 1 },
      ]
      const ticketTypes = [
        { id: "tt_1", price: 50 },
        { id: "tt_2", price: 100 },
      ]
      const result = await calculateTicketAmountStep({
        tickets,
        ticketTypes,
        ticketType: "GA",
        quantity: 3,
        availability: {},
      })
      expect(result.totalAmount).toBe(200)
    })

    it("should calculate amount from matching ticket type by name", async () => {
      const ticketTypes = [{ id: "tt_1", name: "VIP", price: 75 }]
      const result = await calculateTicketAmountStep({
        ticketTypes,
        ticketType: "VIP",
        quantity: 4,
        availability: {},
      })
      expect(result.totalAmount).toBe(300)
    })

    it("should fall back to availability price when no ticket types", async () => {
      const result = await calculateTicketAmountStep({
        ticketTypes: [],
        ticketType: "GA",
        quantity: 3,
        availability: { price: 25 },
      })
      expect(result.totalAmount).toBe(75)
    })

    it("should throw when unable to calculate a valid amount", async () => {
      await expect(
        calculateTicketAmountStep({
          ticketTypes: [],
          ticketType: "GA",
          quantity: 2,
          availability: {},
        })
      ).rejects.toThrow("Unable to calculate ticket amount")
    })
  })

  describe("processTicketPaymentStep", () => {
    it("should create a captured payment record", async () => {
      const result = await processTicketPaymentStep(
        { reservationId: "res_1", customerId: "cust_1", amount: 200 },
        { container: mockContainer() }
      )
      expect(result.payment.status).toBe("captured")
      expect(result.payment.amount).toBe(200)
      expect(result.payment.paid_at).toBeInstanceOf(Date)
    })
  })

  describe("issueTicketsStep", () => {
    it("should issue the correct number of tickets", async () => {
      const result = await issueTicketsStep({ reservationId: "res_1", eventId: "evt_1", quantity: 3 })
      expect(result.tickets).toHaveLength(3)
      result.tickets.forEach((ticket: any) => {
        expect(ticket.event_id).toBe("evt_1")
        expect(ticket.status).toBe("issued")
        expect(ticket.ticket_number).toContain("TKT-evt_1-")
      })
    })

    it("should generate unique ticket numbers", async () => {
      const result = await issueTicketsStep({ reservationId: "res_1", eventId: "evt_1", quantity: 5 })
      const numbers = result.tickets.map((t: any) => t.ticket_number)
      expect(new Set(numbers).size).toBe(5)
    })
  })
})
