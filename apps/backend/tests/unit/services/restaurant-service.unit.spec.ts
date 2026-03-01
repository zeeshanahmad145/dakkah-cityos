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
        async listRestaurants(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRestaurant(_id: string): Promise<any> {
          return null;
        }
        async listMenuItems(_filter: any): Promise<any> {
          return [];
        }
        async retrieveMenuItem(_id: string): Promise<any> {
          return null;
        }
        async updateMenuItems(_data: any): Promise<any> {
          return {};
        }
        async listTableReservations(_filter: any): Promise<any> {
          return [];
        }
        async createTableReservations(_data: any): Promise<any> {
          return {};
        }
        async listKitchenOrders(_filter: any): Promise<any> {
          return [];
        }
        async retrieveKitchenOrder(_id: string): Promise<any> {
          return null;
        }
        async createKitchenOrders(_data: any): Promise<any> {
          return {};
        }
        async updateKitchenOrders(_data: any): Promise<any> {
          return {};
        }
        async listMenus(_filter: any): Promise<any> {
          return [];
        }
        async listModifierGroups(_filter: any): Promise<any> {
          return [];
        }
        async listModifiers(_filter: any): Promise<any> {
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

import RestaurantModuleService from "../../../src/modules/restaurant/service";

describe("RestaurantModuleService", () => {
  let service: RestaurantModuleService;

  beforeEach(() => {
    service = new RestaurantModuleService();
    jest.clearAllMocks();
  });

  describe("createReservation", () => {
    it("creates a reservation successfully", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveRestaurant")
        .mockResolvedValue({ id: "r1", seating_capacity: 100 });
      jest.spyOn(service, "listTableReservations").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createTableReservations")
        .mockResolvedValue({ id: "res-1" });

      const result = await service.createReservation("r1", {
        customerId: "c1",
        partySize: 4,
        date: futureDate,
        time: "19:00",
      });

      expect(result.id).toBe("res-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "confirmed" }),
      );
    });

    it("throws when restaurant is at full capacity", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveRestaurant")
        .mockResolvedValue({ id: "r1", seating_capacity: 10 });
      jest
        .spyOn(service, "listTableReservations")
        .mockResolvedValue([{ party_size: 8, reservation_date: futureDate }]);

      await expect(
        service.createReservation("r1", {
          customerId: "c1",
          partySize: 5,
          date: futureDate,
          time: "19:00",
        }),
      ).rejects.toThrow("Restaurant is at full capacity for this date");
    });

    it("throws when party size is invalid", async () => {
      await expect(
        service.createReservation("r1", {
          customerId: "c1",
          partySize: 51,
          date: new Date(Date.now() + 86400000),
          time: "19:00",
        }),
      ).rejects.toThrow("Party size must be between 1 and 50");
    });

    it("throws when date is in the past", async () => {
      await expect(
        service.createReservation("r1", {
          customerId: "c1",
          partySize: 4,
          date: new Date("2020-01-01"),
          time: "19:00",
        }),
      ).rejects.toThrow("Reservation date must be in the future");
    });
  });

  describe("updateMenuPricing", () => {
    it("updates menu item price", async () => {
      jest
        .spyOn(service, "retrieveMenuItem")
        .mockResolvedValue({ id: "mi-1", price: 15 });
      const updateSpy = jest
        .spyOn(service, "updateMenuItems")
        .mockResolvedValue({ id: "mi-1", price: 20 });

      await service.updateMenuPricing("mi-1", 20);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ price: 20, previous_price: 15 }),
      );
    });

    it("throws when price is zero or negative", async () => {
      await expect(service.updateMenuPricing("mi-1", 0)).rejects.toThrow(
        "Price must be greater than zero",
      );
    });

    it("throws when price exceeds maximum", async () => {
      await expect(service.updateMenuPricing("mi-1", 15000)).rejects.toThrow(
        "Price exceeds maximum allowed value",
      );
    });
  });

  describe("getRevenueReport", () => {
    it("calculates revenue report correctly", async () => {
      jest.spyOn(service, "retrieveRestaurant").mockResolvedValue({ id: "r1" });
      jest.spyOn(service, "listKitchenOrders").mockResolvedValue([
        { total_amount: 100, placed_at: "2025-01-15", status: "delivered" },
        { total_amount: 200, placed_at: "2025-01-20", status: "delivered" },
        { total_amount: 50, placed_at: "2025-01-25", status: "cancelled" },
        { total_amount: 150, placed_at: "2025-03-01", status: "delivered" },
      ]);

      const result = await service.getRevenueReport(
        "r1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result.totalRevenue).toBe(300);
      expect(result.orderCount).toBe(2);
      expect(result.averageOrderValue).toBe(150);
    });
  });
});
