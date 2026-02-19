jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Booking Confirmation Workflow", () => {
  let reserveSlotStep: any
  let confirmBookingStep: any
  let scheduleReminderStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/booking-confirmation.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    reserveSlotStep = calls.find((c: any) => c[0] === "reserve-booking-slot-step")?.[1]
    confirmBookingStep = calls.find((c: any) => c[0] === "confirm-booking-step")?.[1]
    scheduleReminderStep = calls.find((c: any) => c[0] === "schedule-booking-reminder-step")?.[1]
  })

  const validInput = {
    serviceId: "svc_01",
    customerId: "cust_01",
    providerId: "prov_01",
    startTime: "2026-03-15T10:00:00Z",
    endTime: "2026-03-15T11:00:00Z",
    tenantId: "tenant_01",
    notes: "First visit",
  }

  describe("reserveSlotStep", () => {
    it("should create a booking with reserved status", async () => {
      const mockBooking = { id: "book_01", status: "reserved" }
      const container = mockContainer({
        booking: { createBookings: jest.fn().mockResolvedValue(mockBooking) },
      })
      const result = await reserveSlotStep(validInput, { container })
      expect(result.booking).toEqual(mockBooking)
    })

    it("should pass all booking fields correctly", async () => {
      const createBookings = jest.fn().mockResolvedValue({ id: "book_01" })
      const container = mockContainer({ booking: { createBookings } })
      await reserveSlotStep(validInput, { container })
      expect(createBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          service_id: "svc_01",
          customer_id: "cust_01",
          provider_id: "prov_01",
          status: "reserved",
          notes: "First visit",
        })
      )
    })

    it("should propagate booking creation errors", async () => {
      const container = mockContainer({
        booking: { createBookings: jest.fn().mockRejectedValue(new Error("Slot unavailable")) },
      })
      await expect(reserveSlotStep(validInput, { container })).rejects.toThrow("Slot unavailable")
    })
  })

  describe("confirmBookingStep", () => {
    it("should update booking status to confirmed", async () => {
      const mockConfirmed = { id: "book_01", status: "confirmed" }
      const container = mockContainer({
        booking: { updateBookings: jest.fn().mockResolvedValue(mockConfirmed) },
      })
      const result = await confirmBookingStep({ bookingId: "book_01" }, { container })
      expect(result.booking).toEqual(mockConfirmed)
    })

    it("should set confirmed_at timestamp", async () => {
      const updateBookings = jest.fn().mockResolvedValue({ id: "book_01" })
      const container = mockContainer({ booking: { updateBookings } })
      await confirmBookingStep({ bookingId: "book_01" }, { container })
      expect(updateBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "book_01",
          status: "confirmed",
          confirmed_at: expect.any(Date),
        })
      )
    })
  })

  describe("scheduleReminderStep", () => {
    it("should schedule a reminder 24 hours before start time", async () => {
      const result = await scheduleReminderStep({
        bookingId: "book_01",
        customerId: "cust_01",
        startTime: "2026-03-15T10:00:00Z",
      })
      expect(result.scheduled).toBe(true)
      const expectedReminder = new Date(new Date("2026-03-15T10:00:00Z").getTime() - 24 * 60 * 60 * 1000)
      expect(result.reminderTime).toEqual(expectedReminder)
    })

    it("should include the booking ID in reminder response", async () => {
      const result = await scheduleReminderStep({
        bookingId: "book_02",
        customerId: "cust_01",
        startTime: "2026-03-20T14:00:00Z",
      })
      expect(result.bookingId).toBe("book_02")
    })
  })
})
