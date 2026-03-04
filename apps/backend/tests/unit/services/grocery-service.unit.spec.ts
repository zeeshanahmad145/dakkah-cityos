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
        async listFreshProducts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveFreshProduct(_id: string): Promise<any> {
          return null;
        }
        async listBatchTrackings(_filter: any): Promise<any> {
          return [];
        }
        async createBatchTrackings(_data: any): Promise<any> {
          return {};
        }
        async updateBatchTrackings(_data: any): Promise<any> {
          return {};
        }
        async listSubstitutionRules(_filter: any): Promise<any> {
          return [];
        }
        async listDeliverySlots(_filter: any): Promise<any> {
          return [];
        }
        async retrieveDeliverySlot(_id: string): Promise<any> {
          return null;
        }
        async createDeliverySlots(_data: any): Promise<any> {
          return {};
        }
        async updateDeliverySlots(_data: any): Promise<any> {
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

import GroceryModuleService from "../../../src/modules/grocery/service";

describe("GroceryModuleService", () => {
  let service: GroceryModuleService;

  beforeEach(() => {
    service = new GroceryModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createDeliverySlot", () => {
    it("creates a delivery slot with valid data", async () => {
      const createSpy = jest
        .spyOn(service, "createDeliverySlots")
        .mockResolvedValue({ id: "slot-1" });

      const result = await service.createDeliverySlot({
        date: new Date("2025-03-01"),
        startTime: "09:00",
        endTime: "12:00",
        maxOrders: 10,
        zoneId: "zone-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: "09:00",
          end_time: "12:00",
          max_orders: 10,
          capacity_remaining: 10,
          status: "available",
        }),
      );
    });

    it("throws when start or end time is missing", async () => {
      await expect(
        service.createDeliverySlot({
          date: new Date("2025-03-01"),
          startTime: "",
          endTime: "12:00",
          maxOrders: 10,
          zoneId: "zone-1",
        }),
      ).rejects.toThrow("Start time and end time are required");
    });

    it("throws when maxOrders is not positive", async () => {
      await expect(
        service.createDeliverySlot({
          date: new Date("2025-03-01"),
          startTime: "09:00",
          endTime: "12:00",
          maxOrders: 0,
          zoneId: "zone-1",
        }),
      ).rejects.toThrow("Max orders must be a positive number");
    });
  });

  describe("bookDeliverySlot", () => {
    it("books a slot and decrements capacity", async () => {
      vi.spyOn(service, "retrieveDeliverySlot").mockResolvedValue({
        id: "slot-1",
        status: "available",
        capacity_remaining: 5,
        slot_date: "2025-03-01",
        start_time: "09:00",
        end_time: "12:00",
      });
      const updateSpy = jest
        .spyOn(service, "updateDeliverySlots")
        .mockResolvedValue({});

      const result = await service.bookDeliverySlot("slot-1", "order-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          capacity_remaining: 4,
          status: "available",
        }),
      );
      expect(result.confirmed).toBe(true);
      expect(result.orderId).toBe("order-1");
    });

    it("marks slot as full when last capacity is used", async () => {
      vi.spyOn(service, "retrieveDeliverySlot").mockResolvedValue({
        id: "slot-1",
        status: "available",
        capacity_remaining: 1,
        slot_date: "2025-03-01",
        start_time: "09:00",
        end_time: "12:00",
      });
      const updateSpy = jest
        .spyOn(service, "updateDeliverySlots")
        .mockResolvedValue({});

      await service.bookDeliverySlot("slot-1", "order-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          capacity_remaining: 0,
          status: "full",
        }),
      );
    });

    it("throws when slot is not available", async () => {
      vi.spyOn(service, "retrieveDeliverySlot").mockResolvedValue({
        id: "slot-1",
        status: "full",
        capacity_remaining: 0,
      });

      await expect(
        service.bookDeliverySlot("slot-1", "order-1"),
      ).rejects.toThrow("This delivery slot is no longer available");
    });

    it("throws when slot is fully booked (capacity 0 but status available)", async () => {
      vi.spyOn(service, "retrieveDeliverySlot").mockResolvedValue({
        id: "slot-1",
        status: "available",
        capacity_remaining: 0,
      });

      await expect(
        service.bookDeliverySlot("slot-1", "order-1"),
      ).rejects.toThrow("This delivery slot is fully booked");
    });
  });

  describe("getAvailableSlots", () => {
    it("filters slots by zone, date, and availability", async () => {
      const targetDate = new Date("2025-03-01");
      vi.spyOn(service, "listDeliverySlots").mockResolvedValue([
        {
          id: "s1",
          slot_date: targetDate,
          status: "available",
          capacity_remaining: 5,
        },
        {
          id: "s2",
          slot_date: new Date("2025-03-02"),
          status: "available",
          capacity_remaining: 3,
        },
        {
          id: "s3",
          slot_date: targetDate,
          status: "full",
          capacity_remaining: 0,
        },
      ]);

      const result = await service.getAvailableSlots("zone-1", "2025-03-01");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("s1");
    });
  });

  describe("updateInventoryFreshness", () => {
    it("creates a new batch when none exists", async () => {
      jest
        .spyOn(service, "retrieveFreshProduct")
        .mockResolvedValue({ id: "prod-1" });
      vi.spyOn(service, "listBatchTrackings").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createBatchTrackings")
        .mockResolvedValue({ id: "batch-1" });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await service.updateInventoryFreshness("prod-1", futureDate, "BATCH-001");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: "prod-1",
          batch_number: "BATCH-001",
        }),
      );
    });

    it("updates existing batch when found", async () => {
      jest
        .spyOn(service, "retrieveFreshProduct")
        .mockResolvedValue({ id: "prod-1" });
      jest
        .spyOn(service, "listBatchTrackings")
        .mockResolvedValue([{ id: "batch-1" }]);
      const updateSpy = jest
        .spyOn(service, "updateBatchTrackings")
        .mockResolvedValue({ id: "batch-1" });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await service.updateInventoryFreshness("prod-1", futureDate, "BATCH-001");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "batch-1" }),
      );
    });

    it("throws when batch number is missing", async () => {
      await expect(
        service.updateInventoryFreshness("prod-1", new Date(), ""),
      ).rejects.toThrow("Batch number is required");
    });

    it("throws when expiry date is in the past", async () => {
      await expect(
        service.updateInventoryFreshness(
          "prod-1",
          new Date("2020-01-01"),
          "BATCH-001",
        ),
      ).rejects.toThrow("Expiry date must be in the future");
    });
  });
});
