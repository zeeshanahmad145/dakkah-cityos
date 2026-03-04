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

describe("BookingModuleService", () => {
  let service: BookingModuleService;

  beforeEach(() => {
    service = new BookingModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("generateBookingNumber", () => {
    it("generates a booking number with BK- prefix", async () => {
      const result = await service.generateBookingNumber();
      expect(result).toMatch(/^BK-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it("generates unique booking numbers", async () => {
      const num1 = await service.generateBookingNumber();
      const num2 = await service.generateBookingNumber();
      expect(num1).not.toBe(num2);
    });
  });

  describe("getAvailabilityForDate", () => {
    it("returns availability matching date range", async () => {
      const avail = {
        id: "av-1",
        effective_from: "2025-01-01",
        effective_to: "2025-12-31",
        weekly_schedule: {},
      };
      vi.spyOn(service, "listAvailabilities").mockResolvedValue([avail]);

      const result = await service.getAvailabilityForDate(
        "service",
        "svc-1",
        new Date("2025-06-15"),
      );
      expect(result).toEqual(avail);
    });

    it("returns null when no availability found", async () => {
      vi.spyOn(service, "listAvailabilities").mockResolvedValue([]);

      const result = await service.getAvailabilityForDate(
        "service",
        "svc-1",
        new Date("2025-06-15"),
      );
      expect(result).toBeNull();
    });

    it("falls back to first availability when date filters skip all", async () => {
      vi.spyOn(service, "listAvailabilities").mockResolvedValue([
        {
          id: "av-1",
          effective_from: "2026-01-01",
          effective_to: "2026-12-31",
        },
      ]);

      const result = await service.getAvailabilityForDate(
        "service",
        "svc-1",
        new Date("2025-06-15"),
      );
      expect(result).toEqual({
        id: "av-1",
        effective_from: "2026-01-01",
        effective_to: "2026-12-31",
      });
    });
  });

  describe("filterSlotsWithExceptions", () => {
    it("returns all slots when no exceptions", async () => {
      vi.spyOn(service, "listAvailabilityExceptions").mockResolvedValue([]);

      const slots = [
        {
          start: new Date("2025-06-15T09:00:00"),
          end: new Date("2025-06-15T10:00:00"),
        },
      ];
      const result = await service.filterSlotsWithExceptions(
        slots,
        new Date("2025-06-15"),
      );
      expect(result).toHaveLength(1);
    });

    it("removes slots blocked by all_day exception", async () => {
      vi.spyOn(service, "listAvailabilityExceptions").mockResolvedValue([
        {
          start_date: "2025-06-15T00:00:00",
          end_date: "2025-06-15T23:59:59",
          exception_type: "blocked",
          all_day: true,
        },
      ]);

      const slots = [
        {
          start: new Date("2025-06-15T09:00:00"),
          end: new Date("2025-06-15T10:00:00"),
        },
      ];
      const result = await service.filterSlotsWithExceptions(
        slots,
        new Date("2025-06-15"),
      );
      expect(result).toHaveLength(0);
    });

    it("filters slots within time_off exception range", async () => {
      const dateStr = "2025-06-15";

      vi.spyOn(service, "listAvailabilityExceptions").mockResolvedValue([
        {
          start_date: `${dateStr}T09:00:00Z`,
          end_date: `${dateStr}T12:00:00Z`,
          exception_type: "time_off",
          all_day: false,
        },
      ]);

      const slotInRange = {
        start: new Date(`${dateStr}T10:00:00Z`),
        end: new Date(`${dateStr}T11:00:00Z`),
      };
      const slotOutRange = {
        start: new Date(`${dateStr}T13:00:00Z`),
        end: new Date(`${dateStr}T14:00:00Z`),
      };

      const date = new Date(`${dateStr}T10:00:00Z`);
      const result = await service.filterSlotsWithExceptions(
        [slotInRange, slotOutRange],
        date,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(slotOutRange);
    });
  });

  describe("isSlotAvailable", () => {
    it("returns true when slot is available", async () => {
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        min_advance_booking_hours: 0,
        max_advance_booking_days: 60,
        max_capacity: 10,
      });
      vi.spyOn(service, "listBookings").mockResolvedValue([]);

      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);
      const result = await service.isSlotAvailable(
        "svc-1",
        futureStart,
        futureEnd,
      );
      expect(result).toBe(true);
    });

    it("returns false when slot is too soon", async () => {
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        min_advance_booking_hours: 24,
        max_advance_booking_days: 60,
        max_capacity: 10,
      });

      const soonStart = new Date(Date.now() + 60 * 60 * 1000);
      const soonEnd = new Date(soonStart.getTime() + 60 * 60 * 1000);
      const result = await service.isSlotAvailable("svc-1", soonStart, soonEnd);
      expect(result).toBe(false);
    });

    it("returns false when capacity is full", async () => {
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        min_advance_booking_hours: 0,
        max_advance_booking_days: 60,
        max_capacity: 1,
      });

      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);

      vi.spyOn(service, "listBookings").mockResolvedValue([
        {
          start_time: futureStart.toISOString(),
          end_time: futureEnd.toISOString(),
          attendee_count: 1,
        },
      ]);

      const result = await service.isSlotAvailable(
        "svc-1",
        futureStart,
        futureEnd,
      );
      expect(result).toBe(false);
    });
  });

  describe("createBooking", () => {
    it("creates a booking with calculated end time", async () => {
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        duration_minutes: 60,
        location_type: "in_person",
        location_address: "123 Main",
        min_advance_booking_hours: 0,
        max_advance_booking_days: 60,
        max_capacity: 10,
      });
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(true);
      jest
        .spyOn(service, "generateBookingNumber")
        .mockResolvedValue("BK-TEST-1234");
      const createSpy = jest
        .spyOn(service, "createBookings")
        .mockResolvedValue({ id: "bk-1" });
      vi.spyOn(service, "createBookingItems").mockResolvedValue({});
      vi.spyOn(service, "scheduleReminders").mockResolvedValue(undefined);

      const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await service.createBooking({
        serviceProductId: "svc-1",
        customerName: "John",
        customerEmail: "john@test.com",
        startTime,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_number: "BK-TEST-1234",
          status: "pending",
        }),
      );
    });

    it("throws when slot is not available", async () => {
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        duration_minutes: 60,
        min_advance_booking_hours: 0,
        max_advance_booking_days: 60,
        max_capacity: 10,
      });
      vi.spyOn(service, "isSlotAvailable").mockResolvedValue(false);

      await expect(
        service.createBooking({
          serviceProductId: "svc-1",
          customerName: "John",
          customerEmail: "john@test.com",
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
      ).rejects.toThrow("not available");
    });
  });

  describe("confirmBooking", () => {
    it("confirms a pending booking", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "pending" });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({ id: "bk-1", status: "confirmed" });

      await service.confirmBooking("bk-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "confirmed" }),
      );
    });

    it("throws when booking is not pending", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "confirmed" });

      await expect(service.confirmBooking("bk-1")).rejects.toThrow(
        "not in pending status",
      );
    });
  });

  describe("checkInBooking", () => {
    it("checks in a confirmed booking", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "confirmed" });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({});

      await service.checkInBooking("bk-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "checked_in" }),
      );
    });

    it("throws when booking is not confirmed", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "pending" });

      await expect(service.checkInBooking("bk-1")).rejects.toThrow(
        "must be confirmed",
      );
    });
  });

  describe("completeBooking", () => {
    it("completes a checked_in booking", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "checked_in" });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({});

      await service.completeBooking("bk-1", "Great session");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          provider_notes: "Great session",
        }),
      );
    });

    it("throws when booking cannot be completed", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "cancelled" });

      await expect(service.completeBooking("bk-1")).rejects.toThrow(
        "cannot be completed",
      );
    });
  });

  describe("cancelBooking", () => {
    it("cancels a booking and cancels reminders", async () => {
      vi.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "confirmed",
        service_product_id: "svc-1",
        start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        total: 5000,
      });
      vi.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        cancellation_policy_hours: 24,
      });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({});
      const cancelSpy = jest
        .spyOn(service, "cancelReminders")
        .mockResolvedValue(undefined);

      await service.cancelBooking("bk-1", "customer", "changed plans");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" }),
      );
      expect(cancelSpy).toHaveBeenCalledWith("bk-1");
    });

    it("throws when booking is already completed", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "completed" });

      await expect(service.cancelBooking("bk-1", "customer")).rejects.toThrow(
        "cannot be cancelled",
      );
    });
  });

  describe("markNoShow", () => {
    it("marks a confirmed booking as no_show", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "confirmed" });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({});

      await service.markNoShow("bk-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "no_show" }),
      );
    });

    it("throws when booking is not confirmed", async () => {
      jest
        .spyOn(service, "retrieveBooking")
        .mockResolvedValue({ id: "bk-1", status: "pending" });

      await expect(service.markNoShow("bk-1")).rejects.toThrow(
        "Only confirmed bookings",
      );
    });
  });

  describe("cancelReminders", () => {
    it("cancels all scheduled reminders for a booking", async () => {
      vi.spyOn(service, "listBookingReminders").mockResolvedValue([
        { id: "rem-1", status: "scheduled" },
        { id: "rem-2", status: "scheduled" },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateBookingReminders")
        .mockResolvedValue({});

      await service.cancelReminders("bk-1");

      expect(updateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("getPendingReminders", () => {
    it("returns reminders scheduled before given date", async () => {
      vi.spyOn(service, "listBookingReminders").mockResolvedValue([
        { id: "rem-1", scheduled_for: "2025-01-01T10:00:00" },
        { id: "rem-2", scheduled_for: "2025-03-01T10:00:00" },
      ]);

      const result = await service.getPendingReminders(new Date("2025-02-01"));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rem-1");
    });
  });

  describe("getProviderStatistics", () => {
    it("calculates provider statistics correctly", async () => {
      const periodStart = new Date("2025-01-01");
      const periodEnd = new Date("2025-01-31");

      vi.spyOn(service, "listBookings").mockResolvedValue([
        { id: "b1", status: "completed", start_time: "2025-01-10T10:00:00" },
        { id: "b2", status: "cancelled", start_time: "2025-01-15T10:00:00" },
        { id: "b3", status: "no_show", start_time: "2025-01-20T10:00:00" },
        { id: "b4", status: "completed", start_time: "2025-01-25T10:00:00" },
      ]);

      const result = await service.getProviderStatistics(
        "prov-1",
        periodStart,
        periodEnd,
      );

      expect(result.totalBookings).toBe(4);
      expect(result.completedBookings).toBe(2);
      expect(result.cancelledBookings).toBe(1);
      expect(result.noShows).toBe(1);
      expect(result.completionRate).toBe(50);
    });

    it("returns zero rates when no bookings", async () => {
      vi.spyOn(service, "listBookings").mockResolvedValue([]);

      const result = await service.getProviderStatistics(
        "prov-1",
        new Date(),
        new Date(),
      );
      expect(result.completionRate).toBe(0);
      expect(result.cancellationRate).toBe(0);
    });
  });

  describe("getCustomerBookings", () => {
    it("returns bookings for customer", async () => {
      jest
        .spyOn(service, "listBookings")
        .mockResolvedValue([{ id: "b1" }, { id: "b2" }]);

      const result = await service.getCustomerBookings("cust-1");
      expect(result).toHaveLength(2);
    });
  });

  describe("getUpcomingBookings", () => {
    it("returns future bookings sorted by start time", async () => {
      const future1 = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const future2 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

      vi.spyOn(service, "listBookings").mockResolvedValue([
        { id: "b1", start_time: future1.toISOString() },
        { id: "b2", start_time: future2.toISOString() },
        { id: "b3", start_time: past.toISOString() },
      ]);

      const result = await service.getUpcomingBookings();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("b2");
    });
  });
});
