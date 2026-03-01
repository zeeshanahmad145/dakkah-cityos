jest.mock("@medusajs/framework/utils", () => {
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
        async listBookings(_filter: any, _options?: any): Promise<any> {
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
        async retrieveServiceProduct(_id: string): Promise<any> {
          return null;
        }
        async listAvailabilities(_filter: any): Promise<any> {
          return [];
        }
        async listAvailabilityExceptions(_filter: any): Promise<any> {
          return [];
        }
        async createBookingItems(_data: any): Promise<any> {
          return {};
        }
        async createBookingReminders(_data: any): Promise<any> {
          return {};
        }
        async listBookingReminders(_filter: any): Promise<any> {
          return [];
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
    service = new BookingModuleService();
    jest.clearAllMocks();
  });

  describe("createBooking", () => {
    it("creates a booking when slot is available", async () => {
      jest.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        duration_minutes: 60,
        location_type: "in_person",
        location_address: "123 Main St",
      });
      jest.spyOn(service, "isSlotAvailable").mockResolvedValue(true);
      jest
        .spyOn(service, "generateBookingNumber")
        .mockResolvedValue("BK-TEST-1234");
      const createSpy = jest
        .spyOn(service, "createBookings")
        .mockResolvedValue({ id: "bk-1", booking_number: "BK-TEST-1234" });
      jest.spyOn(service, "createBookingItems").mockResolvedValue({});
      jest.spyOn(service, "scheduleReminders").mockResolvedValue(undefined);

      const result = await service.createBooking({
        serviceProductId: "svc-1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        startTime: new Date("2025-06-01T10:00:00Z"),
      });

      expect(result).toEqual({ id: "bk-1", booking_number: "BK-TEST-1234" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_number: "BK-TEST-1234",
          customer_name: "John Doe",
          status: "pending",
        }),
      );
    });

    it("throws when slot is not available", async () => {
      jest.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        duration_minutes: 60,
      });
      jest.spyOn(service, "isSlotAvailable").mockResolvedValue(false);

      await expect(
        service.createBooking({
          serviceProductId: "svc-1",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          startTime: new Date("2025-06-01T10:00:00Z"),
        }),
      ).rejects.toThrow("Selected time slot is not available");
    });
  });

  describe("cancelBooking", () => {
    it("cancels a pending booking", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "pending",
        service_product_id: "svc-1",
        start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        total: 10000,
      });
      jest.spyOn(service, "retrieveServiceProduct").mockResolvedValue({
        id: "svc-1",
        cancellation_policy_hours: 24,
      });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({
          id: "bk-1",
          status: "cancelled",
        });
      jest.spyOn(service, "cancelReminders").mockResolvedValue(undefined);

      const result = await service.cancelBooking(
        "bk-1",
        "customer",
        "Changed plans",
      );

      expect(result.status).toBe("cancelled");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancelled_by: "customer",
          cancellation_reason: "Changed plans",
        }),
      );
    });

    it("throws when booking is already completed", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "completed",
      });

      await expect(service.cancelBooking("bk-1", "customer")).rejects.toThrow(
        "Booking cannot be cancelled",
      );
    });

    it("throws when booking is already cancelled", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "cancelled",
      });

      await expect(service.cancelBooking("bk-1", "admin")).rejects.toThrow(
        "Booking cannot be cancelled",
      );
    });
  });

  describe("confirmBooking", () => {
    it("confirms a pending booking", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "pending",
      });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({
          id: "bk-1",
          status: "confirmed",
        });

      const result = await service.confirmBooking("bk-1");

      expect(result.status).toBe("confirmed");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "confirmed",
        }),
      );
    });

    it("throws when booking is not pending", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "confirmed",
      });

      await expect(service.confirmBooking("bk-1")).rejects.toThrow(
        "Booking is not in pending status",
      );
    });
  });

  describe("completeBooking", () => {
    it("completes a confirmed booking", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "confirmed",
      });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({
          id: "bk-1",
          status: "completed",
        });

      const result = await service.completeBooking("bk-1", "Great session");

      expect(result.status).toBe("completed");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          provider_notes: "Great session",
        }),
      );
    });

    it("throws when booking cannot be completed from current status", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "cancelled",
      });

      await expect(service.completeBooking("bk-1")).rejects.toThrow(
        "Booking cannot be completed from current status",
      );
    });
  });

  describe("markNoShow", () => {
    it("marks a confirmed booking as no-show", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "confirmed",
      });
      const updateSpy = jest
        .spyOn(service, "updateBookings")
        .mockResolvedValue({
          id: "bk-1",
          status: "no_show",
        });

      const result = await service.markNoShow("bk-1");

      expect(result.status).toBe("no_show");
    });

    it("throws when booking is not confirmed", async () => {
      jest.spyOn(service, "retrieveBooking").mockResolvedValue({
        id: "bk-1",
        status: "pending",
      });

      await expect(service.markNoShow("bk-1")).rejects.toThrow(
        "Only confirmed bookings can be marked as no-show",
      );
    });
  });
});
