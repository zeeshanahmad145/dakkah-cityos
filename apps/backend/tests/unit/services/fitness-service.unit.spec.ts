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
        async listGymMemberships(_filter: any): Promise<any> {
          return [];
        }
        async retrieveGymMembership(_id: string): Promise<any> {
          return null;
        }
        async createGymMemberships(_data: any): Promise<any> {
          return {};
        }
        async updateGymMemberships(_data: any): Promise<any> {
          return {};
        }
        async listClassSchedules(_filter: any): Promise<any> {
          return [];
        }
        async retrieveClassSchedule(_id: string): Promise<any> {
          return null;
        }
        async listClassBookings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveClassBooking(_id: string): Promise<any> {
          return null;
        }
        async createClassBookings(_data: any): Promise<any> {
          return {};
        }
        async updateClassBookings(_data: any): Promise<any> {
          return {};
        }
        async listTrainerProfiles(_filter: any): Promise<any> {
          return [];
        }
        async listWellnessPlans(_filter: any): Promise<any> {
          return [];
        }
        async createWellnessPlans(_data: any): Promise<any> {
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

import FitnessModuleService from "../../../src/modules/fitness/service";

describe("FitnessModuleService", () => {
  let service: FitnessModuleService;

  beforeEach(() => {
    service = new FitnessModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createMembership", () => {
    it("creates a membership with correct end date", async () => {
      const createSpy = jest
        .spyOn(service, "createGymMemberships")
        .mockResolvedValue({ id: "mem-1" });

      await service.createMembership("member-1", {
        membershipType: "premium",
        startDate: new Date("2025-01-01"),
        durationMonths: 3,
        monthlyFee: 99.99,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "member-1",
          membership_type: "premium",
          status: "active",
        }),
      );
      const callArgs = createSpy.mock.calls[0][0];
      const endDate = new Date(callArgs.end_date);
      const expectedMonth = (new Date().getMonth() + 3) % 12;
      expect(endDate.getMonth()).toBe(expectedMonth);
    });

    it("throws when plan type is missing", async () => {
      await expect(
        service.createMembership("member-1", {
          membershipType: "",
          startDate: new Date(),
          durationMonths: 3,
          monthlyFee: 50,
        }),
      ).rejects.toThrow("Membership type is required");
    });
  });

  describe("checkMembershipStatus", () => {
    it("returns active for a valid membership", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      vi.spyOn(service, "listGymMemberships").mockResolvedValue([
        {
          id: "mem-1",
          status: "active",
          end_date: futureDate.toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await service.checkMembershipStatus("member-1");

      expect(result.active).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(0);
    });

    it("returns expired for a past membership", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      vi.spyOn(service, "listGymMemberships").mockResolvedValue([
        {
          id: "mem-1",
          status: "active",
          end_date: pastDate.toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await service.checkMembershipStatus("member-1");

      expect(result.active).toBe(false);
      expect(result.expired).toBe(true);
    });

    it("returns inactive when no memberships exist", async () => {
      vi.spyOn(service, "listGymMemberships").mockResolvedValue([]);

      const result = await service.checkMembershipStatus("member-1");

      expect(result.active).toBe(false);
      expect(result.membership).toBeNull();
    });
  });

  describe("getClassAvailability", () => {
    it("returns correct availability counts", async () => {
      vi.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "class-1",
        max_capacity: 20,
      });
      vi.spyOn(service, "listClassBookings").mockResolvedValue([
        { id: "b1", status: "booked" },
        { id: "b2", status: "booked" },
        { id: "b3", status: "checked_in" },
      ]);

      const result = await service.getClassAvailability("class-1");

      expect(result.capacity).toBe(20);
      expect(result.booked).toBe(3);
      expect(result.available).toBe(17);
      expect(result.isFull).toBe(false);
    });

    it("reports full when at capacity", async () => {
      vi.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "class-1",
        max_capacity: 2,
      });
      vi.spyOn(service, "listClassBookings").mockResolvedValue([
        { id: "b1", status: "booked" },
        { id: "b2", status: "booked" },
      ]);

      const result = await service.getClassAvailability("class-1");

      expect(result.available).toBe(0);
      expect(result.isFull).toBe(true);
    });

    it("defaults to capacity of 20 when not specified", async () => {
      vi.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "class-1",
      });
      vi.spyOn(service, "listClassBookings").mockResolvedValue([]);

      const result = await service.getClassAvailability("class-1");

      expect(result.capacity).toBe(20);
    });
  });

  describe("recordWorkout", () => {
    it("records a workout for an active member", async () => {
      jest
        .spyOn(service, "checkMembershipStatus")
        .mockResolvedValue({ active: true });
      const createSpy = jest
        .spyOn(service, "createWellnessPlans")
        .mockResolvedValue({ id: "w-1" });

      await service.recordWorkout("member-1", {
        exerciseType: "cardio",
        duration: 45,
        caloriesBurned: 300,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "member-1",
          plan_type: "workout_log",
          status: "active",
          metadata: expect.objectContaining({
            exercise_type: "cardio",
            duration_minutes: 45,
            calories_burned: 300,
          }),
        }),
      );
    });

    it("throws when exercise type is missing", async () => {
      await expect(
        service.recordWorkout("member-1", {
          exerciseType: "",
          duration: 45,
        }),
      ).rejects.toThrow("Exercise type is required");
    });

    it("throws when duration is zero or negative", async () => {
      await expect(
        service.recordWorkout("member-1", {
          exerciseType: "cardio",
          duration: 0,
        }),
      ).rejects.toThrow("Duration must be greater than zero");
    });
  });
});
