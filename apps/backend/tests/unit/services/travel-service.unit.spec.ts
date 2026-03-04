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
        async listTravelProperties(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTravelProperty(_id: string): Promise<any> {
          return null;
        }
        async listRoomTypes(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRoomType(_id: string): Promise<any> {
          return null;
        }
        async listRooms(_filter: any): Promise<any> {
          return [];
        }
        async listTravelReservations(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTravelReservation(_id: string): Promise<any> {
          return null;
        }
        async createTravelReservations(_data: any): Promise<any> {
          return {};
        }
        async updateTravelReservations(_data: any): Promise<any> {
          return {};
        }
        async listAmenities(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAmenity(_id: string): Promise<any> {
          return null;
        }
        async listGuestProfiles(_filter: any): Promise<any> {
          return [];
        }
        async retrieveGuestProfile(_id: string): Promise<any> {
          return null;
        }
        async listRatePlans(_filter: any): Promise<any> {
          return [];
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

import TravelModuleService from "../../../src/modules/travel/service";

describe("TravelModuleService", () => {
  let service: TravelModuleService;

  beforeEach(() => {
    service = new TravelModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createBooking", () => {
    it("creates a booking with valid data", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        max_occupancy: 4,
        base_price: 100,
      });
      jest
        .spyOn(service, "listRooms")
        .mockResolvedValue([{ id: "room-1", status: "available" }]);
      vi.spyOn(service, "listAmenities").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createTravelReservations")
        .mockResolvedValue({ id: "res-1", status: "confirmed" });

      const result = await service.createBooking("rt-1", {
        customerId: "cust-1",
        travelers: 2,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-05"),
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "confirmed",
          travelers: 2,
        }),
      );
    });

    it("throws when travelers exceed max occupancy", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        max_occupancy: 2,
      });

      await expect(
        service.createBooking("rt-1", {
          customerId: "cust-1",
          travelers: 5,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2025-06-05"),
        }),
      ).rejects.toThrow("Package supports maximum 2 travelers");
    });

    it("throws when start date is after end date", async () => {
      await expect(
        service.createBooking("rt-1", {
          customerId: "cust-1",
          travelers: 2,
          startDate: new Date("2025-06-10"),
          endDate: new Date("2025-06-05"),
        }),
      ).rejects.toThrow("Start date must be before end date");
    });

    it("throws when travelers is zero or negative", async () => {
      await expect(
        service.createBooking("rt-1", {
          customerId: "cust-1",
          travelers: 0,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2025-06-05"),
        }),
      ).rejects.toThrow("Number of travelers must be at least 1");
    });
  });

  describe("cancelBooking", () => {
    it("cancels with 100% refund when check-in is far away", async () => {
      const futureCheckIn = new Date();
      futureCheckIn.setDate(futureCheckIn.getDate() + 30);
      vi.spyOn(service, "retrieveTravelReservation").mockResolvedValue({
        id: "res-1",
        status: "confirmed",
        check_in: futureCheckIn,
        total_price: 500,
      });
      jest
        .spyOn(service, "updateTravelReservations")
        .mockResolvedValue({ id: "res-1", status: "cancelled" });

      const result = await service.cancelBooking("res-1", "Plans changed");

      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmount).toBe(500);
    });

    it("cancels with 50% refund when check-in is within 3 days", async () => {
      const soonCheckIn = new Date();
      soonCheckIn.setDate(soonCheckIn.getDate() + 2);
      vi.spyOn(service, "retrieveTravelReservation").mockResolvedValue({
        id: "res-1",
        status: "confirmed",
        check_in: soonCheckIn,
        total_price: 400,
      });
      vi.spyOn(service, "updateTravelReservations").mockResolvedValue({});

      const result = await service.cancelBooking("res-1");

      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmount).toBe(200);
    });

    it("throws when booking is already cancelled", async () => {
      vi.spyOn(service, "retrieveTravelReservation").mockResolvedValue({
        id: "res-1",
        status: "cancelled",
      });

      await expect(service.cancelBooking("res-1")).rejects.toThrow(
        "Booking is already cancelled",
      );
    });

    it("throws when booking is checked out", async () => {
      vi.spyOn(service, "retrieveTravelReservation").mockResolvedValue({
        id: "res-1",
        status: "checked_out",
      });

      await expect(service.cancelBooking("res-1")).rejects.toThrow(
        "Cannot cancel a completed booking",
      );
    });
  });

  describe("getItinerary", () => {
    it("returns full itinerary with property and amenities", async () => {
      vi.spyOn(service, "retrieveTravelReservation").mockResolvedValue({
        id: "res-1",
        room_type_id: "rt-1",
        guest_id: "guest-1",
        status: "confirmed",
        check_in: new Date("2025-06-01"),
        check_out: new Date("2025-06-05"),
        travelers: 2,
        total_price: 800,
        special_requests: "Late checkout",
      });
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        name: "Deluxe Suite",
        description: "Luxury room",
        max_occupancy: 4,
        property_id: "prop-1",
      });
      vi.spyOn(service, "retrieveTravelProperty").mockResolvedValue({
        id: "prop-1",
        name: "Grand Hotel",
        location: "Paris",
        description: "5-star hotel",
      });
      jest
        .spyOn(service, "listAmenities")
        .mockResolvedValue([
          { name: "WiFi", description: "Free WiFi", price: 0 },
        ]);
      jest
        .spyOn(service, "retrieveGuestProfile")
        .mockResolvedValue({ id: "guest-1", name: "John" });

      const result = await service.getItinerary("res-1");

      expect(result.bookingId).toBe("res-1");
      expect(result.property.name).toBe("Grand Hotel");
      expect(result.roomType.name).toBe("Deluxe Suite");
      expect(result.amenities).toHaveLength(1);
    });
  });

  describe("calculatePackagePrice", () => {
    it("calculates price with no discount for small groups", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        base_price: 100,
      });

      const result = await service.calculatePackagePrice("rt-1", 2);

      expect(result.basePrice).toBe(200);
      expect(result.extrasCost).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(200);
    });

    it("applies 5% discount for 3+ travelers", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        base_price: 100,
      });

      const result = await service.calculatePackagePrice("rt-1", 3);

      expect(result.basePrice).toBe(300);
      expect(result.discount).toBe(15);
      expect(result.total).toBe(285);
    });

    it("applies 10% discount for 5+ travelers", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        base_price: 100,
      });

      const result = await service.calculatePackagePrice("rt-1", 5);

      expect(result.basePrice).toBe(500);
      expect(result.discount).toBe(50);
      expect(result.total).toBe(450);
    });

    it("includes extras cost with per-traveler pricing", async () => {
      vi.spyOn(service, "retrieveRoomType").mockResolvedValue({
        id: "rt-1",
        base_price: 100,
      });
      vi.spyOn(service, "retrieveAmenity").mockResolvedValue({
        id: "a1",
        price: 20,
      });

      const result = await service.calculatePackagePrice("rt-1", 2, ["a1"]);

      expect(result.extrasCost).toBe(40);
      expect(result.total).toBe(240);
    });
  });
});
