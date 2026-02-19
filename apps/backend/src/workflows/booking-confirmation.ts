import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type BookingConfirmationInput = {
  serviceId: string
  customerId: string
  providerId: string
  startTime: string
  endTime: string
  tenantId: string
  notes?: string
}

const reserveSlotStep = createStep(
  "reserve-booking-slot-step",
  async (input: BookingConfirmationInput, { container }) => {
    const bookingModule = container.resolve("booking") as any
    const booking = await bookingModule.createBookings({
      service_id: input.serviceId,
      customer_id: input.customerId,
      provider_id: input.providerId,
      start_time: new Date(input.startTime),
      end_time: new Date(input.endTime),
      status: "reserved",
      notes: input.notes,
    })
    return new StepResponse({ booking }, { bookingId: booking.id })
  },
  async (compensationData: { bookingId: string }, { container }) => {
    if (!compensationData?.bookingId) return
    try {
      const bookingModule = container.resolve("booking") as any
      await bookingModule.deleteBookings(compensationData.bookingId)
    } catch (error) {
    }
  }
)

const confirmBookingStep = createStep(
  "confirm-booking-step",
  async (input: { bookingId: string }, { container }) => {
    const bookingModule = container.resolve("booking") as any
    const confirmed = await bookingModule.updateBookings({
      id: input.bookingId,
      status: "confirmed",
      confirmed_at: new Date(),
    })
    return new StepResponse({ booking: confirmed }, { bookingId: input.bookingId })
  },
  async (compensationData: { bookingId: string }, { container }) => {
    if (!compensationData?.bookingId) return
    try {
      const bookingModule = container.resolve("booking") as any
      await bookingModule.updateBookings({
        id: compensationData.bookingId,
        status: "reserved",
        confirmed_at: null,
      })
    } catch (error) {
    }
  }
)

const scheduleReminderStep = createStep(
  "schedule-booking-reminder-step",
  async (input: { bookingId: string; customerId: string; startTime: string }) => {
    const reminderTime = new Date(new Date(input.startTime).getTime() - 24 * 60 * 60 * 1000)
    return new StepResponse({ scheduled: true, reminderTime, bookingId: input.bookingId })
  }
)

export const bookingConfirmationWorkflow = createWorkflow(
  "booking-confirmation-workflow",
  (input: BookingConfirmationInput) => {
    const { booking } = reserveSlotStep(input)
    const confirmed = confirmBookingStep({ bookingId: booking.id })
    const reminder = scheduleReminderStep({ bookingId: booking.id, customerId: input.customerId, startTime: input.startTime })
    return new WorkflowResponse({ booking: confirmed.booking, reminder })
  }
)
