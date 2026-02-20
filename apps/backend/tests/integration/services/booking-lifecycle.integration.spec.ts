jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    }
    return chain
  }

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveServiceProduct(_id: string): Promise<any> { return null }
        async listBookings(_filter: any): Promise<any> { return [] }
        async retrieveBooking(_id: string): Promise<any> { return null }
        async createBookings(_data: any): Promise<any> { return {} }
        async updateBookings(_data: any): Promise<any> { return {} }
        async createBookingItems(_data: any): Promise<any> { return {} }
        async listAvailabilities(_filter: any): Promise<any> { return [] }
        async listAvailabilityExceptions(_filter: any): Promise<any> { return [] }
        async listBookingReminders(_filter: any): Promise<any> { return [] }
        async createBookingReminders(_data: any): Promise<any> { return {} }
        async updateBookingReminders(_data: any): Promise<any> { return {} }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable, text: chainable, number: chainable, json: chainable,
      enum: () => chainable(), boolean: chainable, dateTime: chainable,
      bigNumber: chainable, float: chainable, array: chainable,
      hasOne: () => chainable(), hasMany: () => chainable(),
      belongsTo: () => chainable(), manyToMany: () => chainable(),
    },
  }
})

import BookingModuleService from "../../../src/modules/booking/service"

describe("Booking Lifecycle Integration", () => {
  let service: BookingModuleService

  beforeEach(() => {
    service = new BookingModuleService()
    jest.clearAllMocks()
  })

  const mockServiceProduct = {
    id: "svc_01",
    name: "Haircut",
    duration_minutes: 60,
    location_type: "in_person",
    location_address: "123 Main St",
  }

  describe("create booking → pending status", () => {
    it("should create a booking with pending status", async () => {
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(true)
      jest.spyOn(service, "generateBookingNumber" as any).mockResolvedValue("BK-TEST-001")
      jest.spyOn(service, "createBookings" as any).mockResolvedValue({
        id: "book_01", status: "pending", booking_number: "BK-TEST-001",
      })
      jest.spyOn(service, "createBookingItems" as any).mockResolvedValue({})
      jest.spyOn(service, "scheduleReminders" as any).mockResolvedValue(undefined)

      const result = await service.createBooking({
        serviceProductId: "svc_01",
        customerId: "cust_01",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        startTime: new Date("2026-03-15T10:00:00Z"),
      })

      expect(result.status).toBe("pending")
      expect(result.booking_number).toBe("BK-TEST-001")
    })

    it("should reject booking when slot is not available", async () => {
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(false)

      await expect(
        service.createBooking({
          serviceProductId: "svc_01",
          customerId: "cust_01",
          customerName: "Jane Doe",
          customerEmail: "jane@example.com",
          startTime: new Date("2026-03-15T10:00:00Z"),
        })
      ).rejects.toThrow("Selected time slot is not available")
    })
  })

  describe("confirm booking → confirmed status", () => {
    it("should confirm a pending booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "pending",
      })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({
        id: "book_01", status: "confirmed",
      })

      const result = await service.confirmBooking("book_01")
      expect(result.status).toBe("confirmed")
    })

    it("should reject confirming a non-pending booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "confirmed",
      })

      await expect(service.confirmBooking("book_01")).rejects.toThrow("Booking is not in pending status")
    })
  })

  describe("check-in → checked_in status", () => {
    it("should check in a confirmed booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "confirmed",
      })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({
        id: "book_01", status: "checked_in",
      })

      const result = await service.checkInBooking("book_01")
      expect(result.status).toBe("checked_in")
    })

    it("should reject check-in for non-confirmed booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "pending",
      })

      await expect(service.checkInBooking("book_01")).rejects.toThrow("Booking must be confirmed before check-in")
    })
  })

  describe("complete → completed status", () => {
    it("should complete a checked-in booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "checked_in",
      })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({
        id: "book_01", status: "completed",
      })

      const result = await service.completeBooking("book_01")
      expect(result.status).toBe("completed")
    })

    it("should reject completing a cancelled booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "cancelled",
      })

      await expect(service.completeBooking("book_01")).rejects.toThrow("Booking cannot be completed from current status")
    })
  })

  describe("cancel booking with cancellation fee", () => {
    it("should cancel a pending booking with no fee", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "pending", start_time: futureDate.toISOString(),
        service_product_id: "svc_01",
      })
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue({
        ...mockServiceProduct, cancellation_fee: 0,
      })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({
        id: "book_01", status: "cancelled", cancellation_fee: 0,
      })
      jest.spyOn(service, "cancelReminders" as any).mockResolvedValue(undefined)

      const result = await service.cancelBooking("book_01", "customer", "Changed plans")
      expect(result.status).toBe("cancelled")
    })

    it("should reject cancelling a completed booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "completed",
      })

      await expect(service.cancelBooking("book_01", "customer")).rejects.toThrow("Booking cannot be cancelled")
    })

    it("should reject cancelling an already cancelled booking", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "cancelled",
      })

      await expect(service.cancelBooking("book_01", "customer")).rejects.toThrow("Booking cannot be cancelled")
    })
  })

  describe("reschedule booking", () => {
    it("should reschedule a booking to a new time slot", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "confirmed", service_product_id: "svc_01",
        customer_name: "Jane Doe", customer_email: "jane@example.com",
        attendee_count: 1, reschedule_count: 0,
      })
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(true)
      jest.spyOn(service, "generateBookingNumber" as any).mockResolvedValue("BK-TEST-002")
      jest.spyOn(service, "createBookings" as any).mockResolvedValue({
        id: "book_02", status: "pending",
      })
      jest.spyOn(service, "createBookingItems" as any).mockResolvedValue({})
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({})
      jest.spyOn(service, "scheduleReminders" as any).mockResolvedValue(undefined)

      const result = await service.rescheduleBooking(
        "book_01",
        new Date("2026-03-16T10:00:00Z"),
        "customer"
      )
      expect(result.id).toBe("book_02")
    })

    it("should reject reschedule when new slot is unavailable", async () => {
      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({
        id: "book_01", status: "confirmed", service_product_id: "svc_01",
        customer_name: "Jane Doe", customer_email: "jane@example.com",
      })
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(false)

      await expect(
        service.rescheduleBooking("book_01", new Date("2026-03-16T10:00:00Z"), "customer")
      ).rejects.toThrow("Selected time slot is not available")
    })
  })

  describe("double-booking prevention", () => {
    it("should prevent overlapping bookings for the same slot", async () => {
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(false)

      await expect(
        service.createBooking({
          serviceProductId: "svc_01",
          customerId: "cust_02",
          customerName: "John Smith",
          customerEmail: "john@example.com",
          startTime: new Date("2026-03-15T10:00:00Z"),
        })
      ).rejects.toThrow("Selected time slot is not available")
    })
  })

  describe("full lifecycle flow", () => {
    it("should progress through pending → confirmed → checked_in → completed", async () => {
      jest.spyOn(service, "retrieveServiceProduct" as any).mockResolvedValue(mockServiceProduct)
      jest.spyOn(service, "isSlotAvailable" as any).mockResolvedValue(true)
      jest.spyOn(service, "generateBookingNumber" as any).mockResolvedValue("BK-FLOW-001")
      jest.spyOn(service, "createBookings" as any).mockResolvedValue({
        id: "book_flow", status: "pending",
      })
      jest.spyOn(service, "createBookingItems" as any).mockResolvedValue({})
      jest.spyOn(service, "scheduleReminders" as any).mockResolvedValue(undefined)

      const created = await service.createBooking({
        serviceProductId: "svc_01",
        customerId: "cust_01",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        startTime: new Date("2026-03-15T10:00:00Z"),
      })
      expect(created.status).toBe("pending")

      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({ id: "book_flow", status: "pending" })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({ id: "book_flow", status: "confirmed" })
      const confirmed = await service.confirmBooking("book_flow")
      expect(confirmed.status).toBe("confirmed")

      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({ id: "book_flow", status: "confirmed" })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({ id: "book_flow", status: "checked_in" })
      const checkedIn = await service.checkInBooking("book_flow")
      expect(checkedIn.status).toBe("checked_in")

      jest.spyOn(service, "retrieveBooking" as any).mockResolvedValue({ id: "book_flow", status: "checked_in" })
      jest.spyOn(service, "updateBookings" as any).mockResolvedValue({ id: "book_flow", status: "completed" })
      const completed = await service.completeBooking("book_flow")
      expect(completed.status).toBe("completed")
    })
  })
})
