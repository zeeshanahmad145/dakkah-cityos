import { MedusaService } from "@medusajs/framework/utils"
import {
  ServiceProduct,
  ServiceProvider,
  Availability,
  AvailabilityException,
  Booking,
  BookingItem,
  BookingReminder,
} from "./models"

/**
 * Booking Module Service
 * 
 * Manages service bookings, availability, providers, and scheduling.
 */
class BookingModuleService extends MedusaService({
  ServiceProduct,
  ServiceProvider,
  Availability,
  AvailabilityException,
  Booking,
  BookingItem,
  BookingReminder,
}) {
  // ============ Explicitly declare auto-generated methods for TS compiler ============
  
  // Availabilities
  declare listAvailabilities: any;
  declare createAvailabilities: any;
  declare updateAvailabilities: any;
  declare deleteAvailabilities: any;
  
  // Availability Exceptions
  declare listAvailabilityExceptions: any;
  declare createAvailabilityExceptions: any;
  declare updateAvailabilityExceptions: any;
  declare deleteAvailabilityExceptions: any;

  // Bookings
  declare listBookings: any;
  declare retrieveBooking: any;
  declare createBookings: any;
  declare updateBookings: any;
  declare deleteBookings: any;

  // Booking Items
  declare createBookingItems: any;

  // Booking Reminders
  declare listBookingReminders: any;
  declare createBookingReminders: any;
  declare updateBookingReminders: any;

  // Service Products
  declare retrieveServiceProduct: any;

  // ============ Booking Number Generation ============

  /**
   * Generate unique booking number
   */
  async generateBookingNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}-${random}`;
  }

  // ============ Availability Calculation ============

  /**
   * Get available slots for a service on a date
   */
  async getAvailableSlots(
    serviceProductId: string,
    date: Date,
    providerId?: string
  ): Promise<Array<{ start: Date; end: Date; providerId?: string }>> {
    const service = await this.retrieveServiceProduct(serviceProductId);
    const slots: Array<{ start: Date; end: Date; providerId?: string }> = [];

    // Get providers for this service
    let providerIds: string[] = [];
    if (providerId) {
      providerIds = [providerId];
    } else if (service.assigned_providers && Array.isArray(service.assigned_providers)) {
      providerIds = service.assigned_providers as string[];
    }

    // Get availability for each provider or service
    for (const pid of providerIds.length ? providerIds : [null]) {
      const availability = await this.getAvailabilityForDate(
        pid ? "provider" : "service",
        pid || serviceProductId,
        date
      );

      if (!availability) continue;

      // Generate time slots
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = days[date.getDay()];
      const schedule = availability.weekly_schedule?.[dayOfWeek] || [];

      for (const period of schedule) {
        const [startHour, startMin] = period.start.split(':').map(Number);
        const [endHour, endMin] = period.end.split(':').map(Number);

        const slotStart = new Date(date);
        slotStart.setHours(startHour, startMin, 0, 0);

        const periodEnd = new Date(date);
        periodEnd.setHours(endHour, endMin, 0, 0);

        // Generate slots based on service duration
        const slotDuration = service.duration_minutes + 
          (service.buffer_before_minutes || 0) + 
          (service.buffer_after_minutes || 0);

        let currentSlot = new Date(slotStart);
        while (currentSlot.getTime() + (slotDuration * 60 * 1000) <= periodEnd.getTime()) {
          const slotEnd = new Date(currentSlot.getTime() + (service.duration_minutes * 60 * 1000));
          
          // Check if slot is available (no existing bookings)
          const isAvailable = await this.isSlotAvailable(
            serviceProductId,
            currentSlot,
            slotEnd,
            pid ?? undefined
          );

          if (isAvailable) {
            slots.push({
              start: new Date(currentSlot),
              end: slotEnd,
              providerId: pid || undefined,
            });
          }

          // Move to next slot
          currentSlot = new Date(currentSlot.getTime() + (slotDuration * 60 * 1000));
        }
      }
    }

    // Check exceptions
    const filteredSlots = await this.filterSlotsWithExceptions(slots, date);

    return filteredSlots;
  }

  /**
   * Get availability for a specific date
   */
  async getAvailabilityForDate(
    ownerType: string,
    ownerId: string,
    date: Date
  ): Promise<any | null> {
    const availabilities = await this.listAvailabilities({
      owner_type: ownerType,
      owner_id: ownerId,
      is_active: true,
    }) as any;

    const list = Array.isArray(availabilities) ? availabilities : [availabilities].filter(Boolean);
    
    // Find applicable availability
    for (const avail of list) {
      if (avail.effective_from && new Date(avail.effective_from) > date) continue;
      if (avail.effective_to && new Date(avail.effective_to) < date) continue;
      return avail;
    }

    return list[0] || null;
  }

  /**
   * Filter slots with exceptions
   */
  async filterSlotsWithExceptions(
    slots: Array<{ start: Date; end: Date; providerId?: string }>,
    date: Date
  ): Promise<Array<{ start: Date; end: Date; providerId?: string }>> {
    // Get all exceptions for the date
    const exceptions = await this.listAvailabilityExceptions({}) as any;
    const exceptionList = Array.isArray(exceptions) ? exceptions : [exceptions].filter(Boolean);

    const dateExceptions = exceptionList.filter((exc: any) => {
      const excStart = new Date(exc.start_date);
      const excEnd = new Date(exc.end_date);
      return date >= excStart && date <= excEnd;
    });

    if (dateExceptions.length === 0) return slots;

    return slots.filter(slot => {
      for (const exc of dateExceptions) {
        if (exc.exception_type === "blocked" || exc.exception_type === "time_off") {
          if (exc.all_day) return false;
          
          const excStart = new Date(exc.start_date);
          const excEnd = new Date(exc.end_date);
          
          if (slot.start >= excStart && slot.start < excEnd) return false;
          if (slot.end > excStart && slot.end <= excEnd) return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if a specific slot is available
   */
  async isSlotAvailable(
    serviceProductId: string,
    startTime: Date,
    endTime: Date,
    providerId?: string
  ): Promise<boolean> {
    const service = await this.retrieveServiceProduct(serviceProductId);
    
    // Check if within booking window
    const now = new Date();
    const minAdvanceMs = (service.min_advance_booking_hours || 0) * 60 * 60 * 1000;
    const maxAdvanceMs = (service.max_advance_booking_days || 60) * 24 * 60 * 60 * 1000;

    if (startTime.getTime() - now.getTime() < minAdvanceMs) return false;
    if (startTime.getTime() - now.getTime() > maxAdvanceMs) return false;

    // Check existing bookings
    const bookings = await this.listBookings({
      service_product_id: serviceProductId,
      status: ["pending", "confirmed", "checked_in", "in_progress"],
    }) as any;

    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean);

    for (const booking of bookingList) {
      if (providerId && booking.provider_id !== providerId) continue;

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      // Check for overlap
      if (startTime < bookingEnd && endTime > bookingStart) {
        // Check capacity
        if (booking.attendee_count >= service.max_capacity) {
          return false;
        }
      }
    }

    return true;
  }

  // ============ Booking Management ============

  /**
   * Create a booking
   */
  async createBooking(data: {
    serviceProductId: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    providerId?: string;
    startTime: Date;
    attendeeCount?: number;
    customerNotes?: string;
    tenantId?: string;
  }): Promise<any> {
    const service = await this.retrieveServiceProduct(data.serviceProductId);
    
    // Calculate end time
    const endTime = new Date(data.startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes);

    // Verify availability
    const isAvailable = await this.isSlotAvailable(
      data.serviceProductId,
      data.startTime,
      endTime,
      data.providerId
    );

    if (!isAvailable) {
      throw new Error("Selected time slot is not available");
    }

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create booking
    const booking = await this.createBookings({
      booking_number: bookingNumber,
      tenant_id: data.tenantId,
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      service_product_id: data.serviceProductId,
      provider_id: data.providerId,
      start_time: data.startTime,
      end_time: endTime,
      timezone: "UTC",
      attendee_count: data.attendeeCount || 1,
      location_type: service.location_type,
      location_address: service.location_address,
      customer_notes: data.customerNotes,
      status: "pending",
    });

    // Create booking item
    await this.createBookingItems({
      booking_id: booking.id,
      service_product_id: data.serviceProductId,
      title: "Service",
      duration_minutes: service.duration_minutes,
      quantity: data.attendeeCount || 1,
      unit_price: 0, // Will be set from product price
      subtotal: 0,
      total: 0,
    });

    // Schedule reminders
    await this.scheduleReminders(booking.id, data.startTime, data.customerEmail);

    return booking;
  }

  /**
   * Confirm booking
   */
  async confirmBooking(bookingId: string): Promise<any> {
    const booking = await this.retrieveBooking(bookingId);
    
    if (booking.status !== "pending") {
      throw new Error("Booking is not in pending status");
    }

    const updated = await this.updateBookings({
      id: bookingId,
      status: "confirmed",
      confirmed_at: new Date(),
    });

    return updated;
  }

  /**
   * Check in customer
   */
  async checkInBooking(bookingId: string): Promise<any> {
    const booking = await this.retrieveBooking(bookingId);
    
    if (booking.status !== "confirmed") {
      throw new Error("Booking must be confirmed before check-in");
    }

    return await this.updateBookings({
      id: bookingId,
      status: "checked_in",
      checked_in_at: new Date(),
    });
  }

  /**
   * Complete booking
   */
  async completeBooking(bookingId: string, notes?: string): Promise<any> {
    const booking = await this.retrieveBooking(bookingId);
    
    if (!["confirmed", "checked_in", "in_progress"].includes(booking.status)) {
      throw new Error("Booking cannot be completed from current status");
    }

    return await this.updateBookings({
      id: bookingId,
      status: "completed",
      completed_at: new Date(),
      provider_notes: notes,
    });
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: "customer" | "provider" | "admin",
    reason?: string
  ): Promise<any> {
    const booking = await this.retrieveBooking(bookingId);
    
    if (["completed", "cancelled"].includes(booking.status)) {
      throw new Error("Booking cannot be cancelled");
    }

    const service = await this.retrieveServiceProduct(booking.service_product_id);
    
    // Calculate cancellation fee
    let cancellationFee = 0;
    const hoursUntilBooking = 
      (new Date(booking.start_time).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilBooking < (service.cancellation_policy_hours || 24)) {
      // Late cancellation - may incur fee
      cancellationFee = Number(booking.total) * 0.5; // 50% fee example
    }

    const updated = await this.updateBookings({
      id: bookingId,
      status: "cancelled",
      cancelled_at: new Date(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
      cancellation_fee: cancellationFee,
    });

    // Cancel scheduled reminders
    await this.cancelReminders(bookingId);

    return updated;
  }

  /**
   * Reschedule booking
   */
  async rescheduleBooking(
    bookingId: string,
    newStartTime: Date,
    newProviderId?: string
  ): Promise<any> {
    const originalBooking = await this.retrieveBooking(bookingId);
    
    if (["completed", "cancelled"].includes(originalBooking.status)) {
      throw new Error("Booking cannot be rescheduled");
    }

    const service = await this.retrieveServiceProduct(originalBooking.service_product_id);
    
    // Calculate new end time
    const newEndTime = new Date(newStartTime);
    newEndTime.setMinutes(newEndTime.getMinutes() + service.duration_minutes);

    // Verify availability
    const isAvailable = await this.isSlotAvailable(
      originalBooking.service_product_id,
      newStartTime,
      newEndTime,
      newProviderId ?? originalBooking.provider_id ?? undefined
    );

    if (!isAvailable) {
      throw new Error("Selected time slot is not available");
    }

    // Create new booking
    const newBooking = await this.createBooking({
      serviceProductId: originalBooking.service_product_id,
      customerId: originalBooking.customer_id ?? undefined,
      customerName: originalBooking.customer_name,
      customerEmail: originalBooking.customer_email,
      customerPhone: originalBooking.customer_phone ?? undefined,
      providerId: newProviderId ?? originalBooking.provider_id ?? undefined,
      startTime: newStartTime,
      attendeeCount: originalBooking.attendee_count,
      customerNotes: originalBooking.customer_notes ?? undefined,
      tenantId: originalBooking.tenant_id ?? undefined,
    });

    // Update original booking
    await this.updateBookings({
      id: bookingId,
      status: "rescheduled",
      rescheduled_to_id: newBooking.id,
    });

    // Update new booking
    await this.updateBookings({
      id: newBooking.id,
      rescheduled_from_id: bookingId,
      reschedule_count: (originalBooking.reschedule_count || 0) + 1,
    });

    return newBooking;
  }

  /**
   * Mark as no-show
   */
  async markNoShow(bookingId: string): Promise<any> {
    const booking = await this.retrieveBooking(bookingId);
    
    if (booking.status !== "confirmed") {
      throw new Error("Only confirmed bookings can be marked as no-show");
    }

    return await this.updateBookings({
      id: bookingId,
      status: "no_show",
    });
  }

  // ============ Reminders ============

  /**
   * Schedule reminders for a booking
   */
  async scheduleReminders(
    bookingId: string,
    startTime: Date,
    customerEmail: string
  ): Promise<void> {
    const reminderTimes = [
      { minutes: 1440, type: "email" }, // 24 hours before
      { minutes: 60, type: "email" },   // 1 hour before
    ];

    for (const reminder of reminderTimes) {
      const scheduledFor = new Date(startTime);
      scheduledFor.setMinutes(scheduledFor.getMinutes() - reminder.minutes);

      // Only schedule if in the future
      if (scheduledFor > new Date()) {
        await this.createBookingReminders({
          booking_id: bookingId,
          reminder_type: reminder.type,
          send_before_minutes: reminder.minutes,
          scheduled_for: scheduledFor,
          recipient_email: customerEmail,
          status: "scheduled",
        });
      }
    }
  }

  /**
   * Cancel reminders for a booking
   */
  async cancelReminders(bookingId: string): Promise<void> {
    const reminders = await this.listBookingReminders({
      booking_id: bookingId,
      status: "scheduled",
    }) as any;

    const reminderList = Array.isArray(reminders) ? reminders : [reminders].filter(Boolean);

    for (const reminder of reminderList) {
      await this.updateBookingReminders({
        id: reminder.id,
        status: "cancelled",
      });
    }
  }

  /**
   * Get pending reminders to send
   */
  async getPendingReminders(beforeDate: Date): Promise<any[]> {
    const reminders = await this.listBookingReminders({
      status: "scheduled",
    }) as any;

    const reminderList = Array.isArray(reminders) ? reminders : [reminders].filter(Boolean);
    
    return reminderList.filter((r: any) => new Date(r.scheduled_for) <= beforeDate);
  }

  // ============ Provider Management ============

  /**
   * Get provider schedule for date range
   */
  async getProviderSchedule(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const bookings = await this.listBookings({
      provider_id: providerId,
      status: ["pending", "confirmed", "checked_in", "in_progress"],
    }) as any;

    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean);

    return bookingList.filter((b: any) => {
      const bookingStart = new Date(b.start_time);
      return bookingStart >= startDate && bookingStart <= endDate;
    });
  }

  /**
   * Get provider statistics
   */
  async getProviderStatistics(
    providerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any> {
    const bookings = await this.listBookings({
      provider_id: providerId,
    }) as any;

    const bookingList = (Array.isArray(bookings) ? bookings : [bookings].filter(Boolean))
      .filter((b: any) => {
        const bookingStart = new Date(b.start_time);
        return bookingStart >= periodStart && bookingStart <= periodEnd;
      });

    const completed = bookingList.filter((b: any) => b.status === "completed").length;
    const cancelled = bookingList.filter((b: any) => b.status === "cancelled").length;
    const noShows = bookingList.filter((b: any) => b.status === "no_show").length;

    return {
      totalBookings: bookingList.length,
      completedBookings: completed,
      cancelledBookings: cancelled,
      noShows,
      completionRate: bookingList.length > 0 ? (completed / bookingList.length) * 100 : 0,
      cancellationRate: bookingList.length > 0 ? (cancelled / bookingList.length) * 100 : 0,
    };
  }

  // ============ Queries ============

  /**
   * Get customer bookings
   */
  async getCustomerBookings(customerId: string): Promise<any[]> {
    const bookings = await this.listBookings({ customer_id: customerId }) as any;
    return Array.isArray(bookings) ? bookings : [bookings].filter(Boolean);
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(tenantId?: string): Promise<any[]> {
    const filters: any = {
      status: ["pending", "confirmed"],
    };
    if (tenantId) filters.tenant_id = tenantId;

    const bookings = await this.listBookings(filters) as any;
    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean);

    const now = new Date();
    return bookingList
      .filter((b: any) => new Date(b.start_time) > now)
      .sort((a: any, b: any) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }
}

export default BookingModuleService
