import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveServiceProduct(_id: string): Promise<any> {
          return null;
        }
        async listBookings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveBooking(_id: string): Promise<any> {
          return null;
        }
        async createBookings(_data: any): Promise<any> {
          return {};
        }
        async updateBookings(_data: any): Promise<any> {
          return {};
        }
        async createBookingItems(_data: any): Promise<any> {
          return {};
        }
        async listAvailabilities(_filter: any): Promise<any> {
          return [];
        }
        async listAvailabilityExceptions(_filter: any): Promise<any> {
          return [];
        }
        async listBookingReminders(_filter: any): Promise<any> {
          return [];
        }
        async createBookingReminders(_data: any): Promise<any> {
          return {};
        }
        async updateBookingReminders(_data: any): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import BookingModuleService from "../../../src/modules/booking/service";

describe("Booking Lifecycle Integration", () => {
  let service: BookingModuleService;

  beforeEach(() => {
    service = new BookingModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  const mockServiceProduct = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

    id: "svc_01",
    name: "Haircut",
    duration_minutes: 60,
    location_type: "in_person",
    location_address: "123 Main St",
  };

  describe("create booking → pending status", () => {
    it("should create a booking with pending status", async () => {
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(true);
      jest
        .spyOn(service, "generateBookingNumber")
        .mockResolvedValue("BK-TEST-001");
      vi.spyOn(service, "createBookings").mockResolvedValue({
        id: "book_01",
        status: "pending",
        booking_number: "BK-TEST-001",
      });
      vi.spyOn(service, "createBookingItems").mockResolvedValue({});
      vi.spyOn(service, "scheduleReminders").mockResolvedValue(undefined);

      const result = await service.createBooking({
        serviceProductId: "svc_01",
        customerId: "cust_01",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        startTime: new Date("2026-03-15T10:00:00Z"),
      });

      expect(result.status).toBe("pending");
      expect(result.booking_number).toBe("BK-TEST-001");
    });

    it("should reject booking when slot is not available", async () => {
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(false);

      await expect(
        service.createBooking({
          serviceProductId: "svc_01",
          customerId: "cust_01",
          customerName: "Jane Doe",
          customerEmail: "jane@example.com",
          startTime: new Date("2026-03-15T10:00:00Z"),
        }),
      ).rejects.toThrow("Selected time slot is not available");
    });
  });

  describe("confirm booking → confirmed status", () => {
    it("should confirm a pending booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "pending",
      });
      vi.spyOn(service, "updateBookings").mockResolvedValue({
        id: "book_01",
        status: "confirmed",
      });

      const result = await service.confirmBooking("book_01");
      expect(result.status).toBe("confirmed");
    });

    it("should reject confirming a non-pending booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "confirmed",
      });

      await expect(service.confirmBooking("book_01")).rejects.toThrow(
        "Booking is not in pending status",
      );
    });
  });

  describe("check-in → checked_in status", () => {
    it("should check in a confirmed booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "confirmed",
      });
      vi.spyOn(service, "updateBookings").mockResolvedValue({
        id: "book_01",
        status: "checked_in",
      });

      const result = await service.checkInBooking("book_01");
      expect(result.status).toBe("checked_in");
    });

    it("should reject check-in for non-confirmed booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "pending",
      });

      await expect(service.checkInBooking("book_01")).rejects.toThrow(
        "Booking must be confirmed before check-in",
      );
    });
  });

  describe("complete → completed status", () => {
    it("should complete a checked-in booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "checked_in",
      });
      vi.spyOn(service, "updateBookings").mockResolvedValue({
        id: "book_01",
        status: "completed",
      });

      const result = await service.completeBooking("book_01");
      expect(result.status).toBe("completed");
    });

    it("should reject completing a cancelled booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "cancelled",
      });

      await expect(service.completeBooking("book_01")).rejects.toThrow(
        "Booking cannot be completed from current status",
      );
    });
  });

  describe("cancel booking with cancellation fee", () => {
    it("should cancel a pending booking with no fee", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "pending",
        start_time: futureDate.toISOString(),
        service_product_id: "svc_01",
      });
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        ...mockServiceProduct,
        cancellation_fee: 0,
      });
      vi.spyOn(service, "updateBookings").mockResolvedValue({
        id: "book_01",
        status: "cancelled",
        cancellation_fee: 0,
      });
      vi.spyOn(service, "cancelReminders").mockResolvedValue(undefined);

      const result = await service.cancelBooking(
        "book_01",
        "customer",
        "Changed plans",
      );
      expect(result.status).toBe("cancelled");
    });

    it("should reject cancelling a completed booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "completed",
      });

      await expect(
        service.cancelBooking("book_01", "customer"),
      ).rejects.toThrow("Booking cannot be cancelled");
    });

    it("should reject cancelling an already cancelled booking", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "cancelled",
      });

      await expect(
        service.cancelBooking("book_01", "customer"),
      ).rejects.toThrow("Booking cannot be cancelled");
    });
  });

  describe("reschedule booking", () => {
    it("should reschedule a booking to a new time slot", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "confirmed",
        service_product_id: "svc_01",
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        attendee_count: 1,
        reschedule_count: 0,
      });
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(true);
      jest
        .spyOn(service, "generateBookingNumber")
        .mockResolvedValue("BK-TEST-002");
      vi.spyOn(service, "createBookings").mockResolvedValue({
        id: "book_02",
        status: "pending",
      });
      vi.spyOn(service, "createBookingItems").mockResolvedValue({});
      vi.spyOn(service, "updateBookings").mockResolvedValue({});
      vi.spyOn(service, "scheduleReminders").mockResolvedValue(undefined);

      const result = await service.rescheduleBooking(
        "book_01",
        new Date("2026-03-16T10:00:00Z"),
        "customer",
      );
      expect(result.id).toBe("book_02");
    });

    it("should reject reschedule when new slot is unavailable", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "book_01",
        status: "confirmed",
        service_product_id: "svc_01",
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
      });
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(false);

      await expect(
        service.rescheduleBooking(
          "book_01",
          new Date("2026-03-16T10:00:00Z"),
          "customer",
        ),
      ).rejects.toThrow("Selected time slot is not available");
    });
  });

  describe("double-booking prevention", () => {
    it("should prevent overlapping bookings for the same slot", async () => {
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(false);

      await expect(
        service.createBooking({
          serviceProductId: "svc_01",
          customerId: "cust_02",
          customerName: "John Smith",
          customerEmail: "john@example.com",
          startTime: new Date("2026-03-15T10:00:00Z"),
        }),
      ).rejects.toThrow("Selected time slot is not available");
    });
  });

  describe("full lifecycle flow", () => {
    it("should progress through pending → confirmed → checked_in → completed", async () => {
      jest
        .spyOn(service, "retrieveServiceProduct")
        .mockResolvedValue(mockServiceProduct);
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(true);
      jest
        .spyOn(service, "generateBookingNumber")
        .mockResolvedValue("BK-FLOW-001");
      vi.spyOn(service, "createBookings").mockResolvedValue({
        id: "book_flow",
        status: "pending",
      });
      vi.spyOn(service, "createBookingItems").mockResolvedValue({});
      vi.spyOn(service, "scheduleReminders").mockResolvedValue(undefined);

      const created = await service.createBooking({
        serviceProductId: "svc_01",
        customerId: "cust_01",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        startTime: new Date("2026-03-15T10:00:00Z"),
      });
      expect(created.status).toBe("pending");

      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "book_flow", status: "pending" });
      jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({ id: "book_flow", status: "confirmed" });
      const confirmed = await service.confirmBooking("book_flow");
      expect(confirmed.status).toBe("confirmed");

      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "book_flow", status: "confirmed" });
      jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({ id: "book_flow", status: "checked_in" });
      const checkedIn = await service.checkInBooking("book_flow");
      expect(checkedIn.status).toBe("checked_in");

      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "book_flow", status: "checked_in" });
      jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({ id: "book_flow", status: "completed" });
      const completed = await service.completeBooking("book_flow");
      expect(completed.status).toBe("completed");
    });
  });
});
