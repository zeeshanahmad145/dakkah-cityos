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
        async listParkingZones(_filter: any): Promise<any> {
          return [];
        }
        async retrieveParkingZone(_id: string): Promise<any> {
          return null;
        }
        async listParkingSessions(_filter: any): Promise<any> {
          return [];
        }
        async retrieveParkingSession(_id: string): Promise<any> {
          return null;
        }
        async createParkingSessions(_data: any): Promise<any> {
          return {};
        }
        async updateParkingSessions(_data: any): Promise<any> {
          return {};
        }
        async listShuttleRoutes(_filter: any): Promise<any> {
          return [];
        }
        async listRideRequests(_filter: any): Promise<any> {
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

import ParkingModuleService from "../../../src/modules/parking/service";

describe("ParkingModuleService", () => {
  let service: ParkingModuleService;

  beforeEach(() => {
    service = new ParkingModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("checkIn", () => {
    it("checks in a reserved session", async () => {
      jest
        .spyOn(service, "retrieveParkingSession")
        .mockResolvedValue({ id: "s1", status: "reserved" });
      const updateSpy = jest
        .spyOn(service, "updateParkingSessions")
        .mockResolvedValue({ id: "s1", status: "active" });

      await service.checkIn("s1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    it("throws when session is already completed", async () => {
      jest
        .spyOn(service, "retrieveParkingSession")
        .mockResolvedValue({ id: "s1", status: "completed" });

      await expect(service.checkIn("s1")).rejects.toThrow(
        "This session has already been completed",
      );
    });

    it("throws when already checked in", async () => {
      vi.spyOn(service, "retrieveParkingSession").mockResolvedValue({
        id: "s1",
        status: "active",
        checked_in_at: new Date(),
      });

      await expect(service.checkIn("s1")).rejects.toThrow("Already checked in");
    });
  });

  describe("checkOut", () => {
    it("calculates fee based on duration", async () => {
      const startTime = new Date(Date.now() - 2.9 * 60 * 60 * 1000);
      vi.spyOn(service, "retrieveParkingSession").mockResolvedValue({
        id: "s1",
        status: "active",
        checked_in_at: startTime,
        zone_id: "z1",
      });
      jest
        .spyOn(service, "retrieveParkingZone")
        .mockResolvedValue({ id: "z1", hourly_rate: 10 });
      vi.spyOn(service, "updateParkingSessions").mockResolvedValue({});

      const result = await service.checkOut("s1");

      expect(result.sessionId).toBe("s1");
      expect(result.duration).toBe(3);
      expect(result.fee).toBe(30);
    });

    it("throws when session is already completed", async () => {
      jest
        .spyOn(service, "retrieveParkingSession")
        .mockResolvedValue({ id: "s1", status: "completed" });

      await expect(service.checkOut("s1")).rejects.toThrow(
        "This session has already been completed",
      );
    });

    it("throws when session is not active", async () => {
      jest
        .spyOn(service, "retrieveParkingSession")
        .mockResolvedValue({ id: "s1", status: "reserved" });

      await expect(service.checkOut("s1")).rejects.toThrow(
        "Session must be active to check out",
      );
    });
  });

  describe("getAvailableSpots", () => {
    it("returns available spots count", async () => {
      jest
        .spyOn(service, "retrieveParkingZone")
        .mockResolvedValue({ id: "z1", total_spots: 100 });
      jest
        .spyOn(service, "listParkingSessions")
        .mockResolvedValue([{ id: "s1" }, { id: "s2" }, { id: "s3" }]);

      const result = await service.getAvailableSpots("z1");

      expect(result.totalSpots).toBe(100);
      expect(result.occupiedSpots).toBe(3);
      expect(result.availableSpots).toBe(97);
    });
  });

  describe("calculateDynamicFee", () => {
    it("applies vehicle multiplier to base rate", async () => {
      jest
        .spyOn(service, "retrieveParkingZone")
        .mockResolvedValue({ id: "z1", hourly_rate: 10 });

      const result = await service.calculateDynamicFee("z1", 120, "suv");

      expect(result.hourlyRate).toBe(10);
      expect(result.vehicleMultiplier).toBe(1.3);
      expect(result.totalFee).toBe(26);
    });

    it("uses default multiplier for unknown vehicle type", async () => {
      jest
        .spyOn(service, "retrieveParkingZone")
        .mockResolvedValue({ id: "z1", hourly_rate: 5 });

      const result = await service.calculateDynamicFee("z1", 60, "unknown");

      expect(result.vehicleMultiplier).toBe(1.0);
      expect(result.totalFee).toBe(5);
    });

    it("rounds up to minimum 1 hour", async () => {
      jest
        .spyOn(service, "retrieveParkingZone")
        .mockResolvedValue({ id: "z1", hourly_rate: 8 });

      const result = await service.calculateDynamicFee("z1", 15, "motorcycle");

      expect(result.vehicleMultiplier).toBe(0.5);
      expect(result.totalFee).toBe(4);
    });
  });
});
