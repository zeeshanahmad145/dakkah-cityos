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
        async retrieveClassSchedule(_id: string): Promise<any> {
          return null;
        }
        async listClassBookings(_filter: any): Promise<any> {
          return [];
        }
        async createClassBookings(_data: any): Promise<any> {
          return {};
        }
        async retrieveClassBooking(_id: string): Promise<any> {
          return null;
        }
        async updateClassBookings(_data: any): Promise<any> {
          return {};
        }
        async retrieveGymMembership(_id: string): Promise<any> {
          return null;
        }
        async listGymMemberships(_filter: any): Promise<any> {
          return [];
        }
        async createGymMemberships(_data: any): Promise<any> {
          return {};
        }
        async listClassSchedules(_filter: any): Promise<any> {
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

import FitnessModuleService from "../../../src/modules/fitness/service";

describe("FitnessModuleService", () => {
  let service: FitnessModuleService;

  beforeEach(() => {
    service = new FitnessModuleService();
    jest.clearAllMocks();
  });

  describe("bookClass", () => {
    it("should book a class with available capacity", async () => {
      jest.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "cls_01",
        max_capacity: 20,
        status: "scheduled",
      });
      jest.spyOn(service, "retrieveGymMembership").mockResolvedValue({
        id: "mem_01",
        status: "active",
      });
      jest
        .spyOn(service, "listClassBookings")
        .mockResolvedValue(Array(10).fill({ status: "confirmed" }));
      jest.spyOn(service, "createClassBookings").mockResolvedValue({
        id: "cb_01",
        class_schedule_id: "cls_01",
        member_id: "mem_01",
        status: "booked",
      });

      const result = await service.bookClass("cls_01", "mem_01");
      expect(result.status).toBe("booked");
    });

    it("should reject booking when class is fully booked", async () => {
      jest.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "cls_01",
        max_capacity: 5,
        status: "scheduled",
      });
      jest.spyOn(service, "retrieveGymMembership").mockResolvedValue({
        id: "mem_01",
        status: "active",
      });
      jest
        .spyOn(service, "listClassBookings")
        .mockResolvedValue(Array(5).fill({ status: "booked" }));

      await expect(service.bookClass("cls_01", "mem_01")).rejects.toThrow(
        "Class is fully booked",
      );
    });

    it("should not allow double-booking", async () => {
      jest.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "cls_01",
        max_capacity: 20,
      });
      jest
        .spyOn(service, "listClassBookings")
        .mockResolvedValue([{ customer_id: "mem_01", status: "booked" }]);

      await expect(service.bookClass("cls_01", "mem_01")).rejects.toThrow(
        "You have already booked this class",
      );
    });
  });

  describe("cancelBooking", () => {
    it("should cancel a confirmed booking", async () => {
      jest.spyOn(service, "retrieveClassBooking").mockResolvedValue({
        id: "cb_01",
        status: "confirmed",
        class_schedule_id: "cls_01",
      });
      jest.spyOn(service, "updateClassBookings").mockResolvedValue({
        id: "cb_01",
        status: "cancelled",
      });

      const result = await service.cancelBooking("cb_01");
      expect(result.status).toBe("cancelled");
    });

    it("should reject cancelling an already cancelled booking", async () => {
      jest.spyOn(service, "retrieveClassBooking").mockResolvedValue({
        id: "cb_01",
        status: "cancelled",
      });

      await expect(service.cancelBooking("cb_01")).rejects.toThrow(
        "Booking is already cancelled",
      );
    });
  });

  describe("getClassAvailability", () => {
    it("should return availability with remaining spots", async () => {
      jest.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "cls_01",
        max_capacity: 20,
      });
      jest
        .spyOn(service, "listClassBookings")
        .mockResolvedValue(Array(15).fill({ status: "booked" }));

      const result = await service.getClassAvailability("cls_01");
      expect(result.capacity).toBe(20);
      expect(result.booked).toBe(15);
      expect(result.available).toBe(5);
    });

    it("should show zero availability when full", async () => {
      jest.spyOn(service, "retrieveClassSchedule").mockResolvedValue({
        id: "cls_01",
        max_capacity: 5,
      });
      jest
        .spyOn(service, "listClassBookings")
        .mockResolvedValue(Array(5).fill({ status: "booked" }));

      const result = await service.getClassAvailability("cls_01");
      expect(result.available).toBe(0);
      expect(result.isFull).toBe(true);
    });
  });

  describe("createMembership", () => {
    it("should create a membership with valid data", async () => {
      jest.spyOn(service, "createGymMemberships").mockResolvedValue({
        id: "mem_01",
        status: "active",
      });

      const result = await service.createMembership("user_01", {
        membershipType: "premium",
        monthlyFee: 9999,
      });
      expect(result.status).toBe("active");
    });

    it("should reject membership with empty membershipType", async () => {
      await expect(
        service.createMembership("user_01", {
          membershipType: "",
          monthlyFee: 2999,
        }),
      ).rejects.toThrow("Membership type is required");
    });
  });
});
