jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Booking Confirmation Workflow – Integration", () => {
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

  describe("end-to-end booking workflow", () => {
    it("should reserve slot, confirm booking, and schedule reminder", async () => {
      const mockBooking = { id: "book_01", status: "reserved" }
      const mockConfirmed = { id: "book_01", status: "confirmed", confirmed_at: new Date() }
      const container = mockContainer({
        booking: {
          createBookings: jest.fn().mockResolvedValue(mockBooking),
          updateBookings: jest.fn().mockResolvedValue(mockConfirmed),
        },
      })

      const reserveResult = await reserveSlotStep(validInput, { container })
      expect(reserveResult.booking.id).toBe("book_01")
      expect(reserveResult.booking.status).toBe("reserved")

      const confirmResult = await confirmBookingStep({ bookingId: "book_01" }, { container })
      expect(confirmResult.booking.status).toBe("confirmed")

      const reminderResult = await scheduleReminderStep({
        bookingId: "book_01",
        customerId: "cust_01",
        startTime: validInput.startTime,
      })
      expect(reminderResult.scheduled).toBe(true)
      expect(reminderResult.bookingId).toBe("book_01")
    })

    it("should create booking with correct parameters", async () => {
      const createBookings = jest.fn().mockResolvedValue({ id: "book_02" })
      const container = mockContainer({ booking: { createBookings } })

      await reserveSlotStep(validInput, { container })
      expect(createBookings).toHaveBeenCalledWith({
        service_id: "svc_01",
        customer_id: "cust_01",
        provider_id: "prov_01",
        start_time: expect.any(Date),
        end_time: expect.any(Date),
        status: "reserved",
        notes: "First visit",
      })
    })

    it("should schedule reminder 24 hours before start time", async () => {
      const result = await scheduleReminderStep({
        bookingId: "book_01",
        customerId: "cust_01",
        startTime: "2026-03-15T10:00:00Z",
      })

      const expectedReminder = new Date("2026-03-14T10:00:00Z")
      expect(result.reminderTime.getTime()).toBe(expectedReminder.getTime())
    })
  })

  describe("step failure with compensation", () => {
    it("should compensate reservation when confirmation fails", async () => {
      const deleteBookings = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        booking: {
          createBookings: jest.fn().mockResolvedValue({ id: "book_01" }),
          updateBookings: jest.fn().mockRejectedValue(new Error("Confirmation service error")),
          deleteBookings,
        },
      })

      const reserveResult = await reserveSlotStep(validInput, { container })
      expect(reserveResult.__compensation).toEqual({ bookingId: "book_01" })

      await expect(
        confirmBookingStep({ bookingId: "book_01" }, { container })
      ).rejects.toThrow("Confirmation service error")

      await reserveSlotStep.compensate(reserveResult.__compensation, { container })
      expect(deleteBookings).toHaveBeenCalledWith("book_01")
    })

    it("should revert confirmation status during compensation", async () => {
      const updateBookings = jest.fn().mockResolvedValue({})
      const container = mockContainer({ booking: { updateBookings } })

      await confirmBookingStep.compensate({ bookingId: "book_01" }, { container })
      expect(updateBookings).toHaveBeenCalledWith({
        id: "book_01",
        status: "reserved",
        confirmed_at: null,
      })
    })

    it("should handle compensation gracefully when bookingId is missing", async () => {
      const container = mockContainer({ booking: { deleteBookings: jest.fn() } })
      await expect(reserveSlotStep.compensate(undefined, { container })).resolves.not.toThrow()
    })

    it("should handle compensation gracefully when delete fails", async () => {
      const container = mockContainer({
        booking: { deleteBookings: jest.fn().mockRejectedValue(new Error("Already deleted")) },
      })

      await expect(
        reserveSlotStep.compensate({ bookingId: "book_01" }, { container })
      ).resolves.not.toThrow()
    })
  })

  describe("state verification after compensation", () => {
    it("should leave no orphaned booking after reserve compensation", async () => {
      const deleteBookings = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({ booking: { deleteBookings } })

      await reserveSlotStep.compensate({ bookingId: "book_01" }, { container })
      expect(deleteBookings).toHaveBeenCalledWith("book_01")
    })

    it("should have compensation functions defined for compensable steps", () => {
      expect(reserveSlotStep.compensate).toBeDefined()
      expect(confirmBookingStep.compensate).toBeDefined()
    })

    it("should run reserve-slot compensation idempotently", async () => {
      const deleteBookings = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({ booking: { deleteBookings } })

      const compensationData = { bookingId: "book_01" }

      await reserveSlotStep.compensate(compensationData, { container })
      expect(deleteBookings).toHaveBeenCalledWith("book_01")

      await expect(reserveSlotStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(reserveSlotStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should run confirm-booking compensation idempotently", async () => {
      const updateBookings = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({ booking: { updateBookings } })

      const compensationData = { bookingId: "book_01" }

      await confirmBookingStep.compensate(compensationData, { container })
      expect(updateBookings).toHaveBeenCalledWith({
        id: "book_01",
        status: "reserved",
        confirmed_at: null,
      })

      await expect(confirmBookingStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(confirmBookingStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should revert booking to reserved state after confirm compensation", async () => {
      const updateBookings = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({ booking: { updateBookings } })

      await confirmBookingStep.compensate({ bookingId: "book_01" }, { container })
      expect(updateBookings).toHaveBeenCalledWith(
        expect.objectContaining({ id: "book_01", status: "reserved", confirmed_at: null })
      )
    })
  })
})
