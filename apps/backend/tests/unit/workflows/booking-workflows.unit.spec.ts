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

describe("Booking Confirmation Workflow", () => {
  let reserveSlotStep: any
  let confirmBookingStep: any
  let scheduleReminderStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/booking-confirmation.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    reserveSlotStep = calls.find((c: any) => c[0] === "reserve-booking-slot-step")?.[1]
    confirmBookingStep = calls.find((c: any) => c[0] === "confirm-booking-step")?.[1]
    scheduleReminderStep = calls.find((c: any) => c[0] === "schedule-booking-reminder-step")?.[1]
  })

  const validInput = {
    serviceId: "svc_1",
    customerId: "cust_1",
    providerId: "prov_1",
    startTime: "2026-03-01T10:00:00Z",
    endTime: "2026-03-01T11:00:00Z",
    tenantId: "tenant_1",
  }

  it("should reserve a booking slot", async () => {
    const booking = { id: "book_1", status: "reserved" }
    const container = mockContainer({ booking: { createBookings: vi.fn().mockResolvedValue(booking) } })
    const result = await reserveSlotStep(validInput, { container })
    expect(result.booking.status).toBe("reserved")
  })

  it("should confirm a booking", async () => {
    const confirmed = { id: "book_1", status: "confirmed" }
    const container = mockContainer({ booking: { updateBookings: vi.fn().mockResolvedValue(confirmed) } })
    const result = await confirmBookingStep({ bookingId: "book_1" }, { container })
    expect(result.booking.status).toBe("confirmed")
  })

  it("should schedule a reminder 24h before", async () => {
    const result = await scheduleReminderStep({
      bookingId: "book_1",
      customerId: "cust_1",
      startTime: "2026-03-01T10:00:00Z",
    })
    expect(result.scheduled).toBe(true)
    expect(result.reminderTime).toBeInstanceOf(Date)
    expect(result.reminderTime.getTime()).toBeLessThan(new Date("2026-03-01T10:00:00Z").getTime())
  })

  it("should handle optional notes field", async () => {
    const inputWithNotes = { ...validInput, notes: "Please arrive early" }
    const booking = { id: "book_2", status: "reserved", notes: "Please arrive early" }
    const container = mockContainer({ booking: { createBookings: vi.fn().mockResolvedValue(booking) } })
    const result = await reserveSlotStep(inputWithNotes, { container })
    expect(result.booking).toBeDefined()
  })
})

describe("Event Ticketing Workflow", () => {
  let selectTicketsStep: any
  let reserveTicketsStep: any
  let processTicketPaymentStep: any
  let issueTicketsStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/event-ticketing.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    selectTicketsStep = calls.find((c: any) => c[0] === "select-event-tickets-step")?.[1]
    reserveTicketsStep = calls.find((c: any) => c[0] === "reserve-event-tickets-step")?.[1]
    processTicketPaymentStep = calls.find((c: any) => c[0] === "process-ticket-payment-step")?.[1]
    issueTicketsStep = calls.find((c: any) => c[0] === "issue-event-tickets-step")?.[1]
  })

  const validInput = {
    eventId: "evt_1",
    customerId: "cust_1",
    ticketType: "vip",
    quantity: 3,
  }

  it("should check ticket availability", async () => {
    const container = mockContainer({ eventTicketing: { checkAvailability: vi.fn().mockResolvedValue({ available: true }) } })
    const result = await selectTicketsStep(validInput, { container })
    expect(result.availability.available).toBe(true)
  })

  it("should throw when tickets not available", async () => {
    const container = mockContainer({ eventTicketing: { checkAvailability: vi.fn().mockResolvedValue({ available: false }) } })
    await expect(selectTicketsStep(validInput, { container })).rejects.toThrow("Tickets not available")
  })

  it("should reserve tickets with expiration", async () => {
    const reservation = { id: "res_1" }
    const container = mockContainer({ eventTicketing: { createReservation: vi.fn().mockResolvedValue(reservation) } })
    const result = await reserveTicketsStep(validInput, { container })
    expect(result.reservation.id).toBe("res_1")
  })

  it("should process ticket payment", async () => {
    const result = await processTicketPaymentStep({ reservationId: "res_1", customerId: "cust_1", amount: 150 }, { container: mockContainer() })
    expect(result.payment.status).toBe("captured")
    expect(result.payment.amount).toBe(150)
  })

  it("should issue correct number of tickets", async () => {
    const result = await issueTicketsStep({ reservationId: "res_1", eventId: "evt_1", quantity: 3 })
    expect(result.tickets).toHaveLength(3)
    expect(result.tickets[0].status).toBe("issued")
    expect(result.tickets[0].event_id).toBe("evt_1")
  })
})
