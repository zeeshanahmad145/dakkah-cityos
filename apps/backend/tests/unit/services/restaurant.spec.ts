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
        async retrieveRestaurant(_id: string): Promise<any> {
          return null;
        }
        async listMenuItems(_filter: any): Promise<any> {
          return [];
        }
        async retrieveMenuItem(_id: string): Promise<any> {
          return null;
        }
        async createKitchenOrders(_data: any): Promise<any> {
          return {};
        }
        async retrieveKitchenOrder(_id: string): Promise<any> {
          return null;
        }
        async updateKitchenOrders(_data: any): Promise<any> {
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

import RestaurantModuleService from "../../../src/modules/restaurant/service";

describe("RestaurantModuleService", () => {
  let service: RestaurantModuleService;

  beforeEach(() => {
    service = new RestaurantModuleService();
    jest.clearAllMocks();
  });

  describe("getMenuItems", () => {
    it("should return available menu items for a restaurant", async () => {
      jest.spyOn(service, "listMenuItems").mockResolvedValue([
        { id: "mi_01", name: "Burger", is_available: true },
        { id: "mi_02", name: "Fries", is_available: true },
      ]);

      const result = await service.getMenuItems("rest_01");
      expect(result).toHaveLength(2);
    });

    it("should filter by category when provided", async () => {
      const listSpy = jest
        .spyOn(service, "listMenuItems")
        .mockResolvedValue([{ id: "mi_01", name: "Burger", category: "main" }]);

      await service.getMenuItems("rest_01", "main");
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ category: "main", restaurant_id: "rest_01" }),
      );
    });

    it("should return empty array when no items available", async () => {
      jest.spyOn(service, "listMenuItems").mockResolvedValue([]);

      const result = await service.getMenuItems("rest_01");
      expect(result).toHaveLength(0);
    });
  });

  describe("placeOrder", () => {
    it("should create a kitchen order with total amount", async () => {
      jest
        .spyOn(service, "retrieveRestaurant")
        .mockResolvedValue({ id: "rest_01" });
      jest
        .spyOn(service, "retrieveMenuItem")
        .mockResolvedValueOnce({ id: "mi_01", price: 1500 })
        .mockResolvedValueOnce({ id: "mi_02", price: 500 });
      jest
        .spyOn(service, "createKitchenOrders")
        .mockImplementation(async (data: any) => ({
          id: "ord_01",
          ...data,
        }));

      const result = await service.placeOrder("rest_01", [
        { menuItemId: "mi_01", quantity: 2 },
        { menuItemId: "mi_02", quantity: 1 },
      ]);

      expect(result.total_amount).toBe(3500);
      expect(result.status).toBe("pending");
    });
  });

  describe("updateOrderStatus", () => {
    it("should transition from pending to confirmed", async () => {
      jest.spyOn(service, "retrieveKitchenOrder").mockResolvedValue({
        id: "ord_01",
        status: "pending",
      });
      jest.spyOn(service, "updateKitchenOrders").mockResolvedValue({
        id: "ord_01",
        status: "confirmed",
      });

      const result = await service.updateOrderStatus("ord_01", "confirmed");
      expect(result.status).toBe("confirmed");
    });

    it("should transition from confirmed to preparing", async () => {
      jest.spyOn(service, "retrieveKitchenOrder").mockResolvedValue({
        id: "ord_01",
        status: "confirmed",
      });
      jest.spyOn(service, "updateKitchenOrders").mockResolvedValue({
        id: "ord_01",
        status: "preparing",
      });

      const result = await service.updateOrderStatus("ord_01", "preparing");
      expect(result.status).toBe("preparing");
    });

    it("should reject invalid state transition", async () => {
      jest.spyOn(service, "retrieveKitchenOrder").mockResolvedValue({
        id: "ord_01",
        status: "pending",
      });

      await expect(
        service.updateOrderStatus("ord_01", "delivered"),
      ).rejects.toThrow("Cannot transition from pending to delivered");
    });

    it("should reject transition from preparing to cancelled", async () => {
      jest.spyOn(service, "retrieveKitchenOrder").mockResolvedValue({
        id: "ord_01",
        status: "preparing",
      });

      await expect(
        service.updateOrderStatus("ord_01", "cancelled"),
      ).rejects.toThrow("Cannot transition from preparing to cancelled");
    });

    it("should allow transition from preparing to ready", async () => {
      jest.spyOn(service, "retrieveKitchenOrder").mockResolvedValue({
        id: "ord_01",
        status: "preparing",
      });
      jest.spyOn(service, "updateKitchenOrders").mockResolvedValue({
        id: "ord_01",
        status: "ready",
      });

      const result = await service.updateOrderStatus("ord_01", "ready");
      expect(result.status).toBe("ready");
    });
  });

  describe("calculateDeliveryFee", () => {
    it("should return a delivery fee and estimated time", async () => {
      jest.spyOn(service, "retrieveRestaurant").mockResolvedValue({
        id: "rest_01",
        delivery_fee: 5,
      });

      const result = await service.calculateDeliveryFee(
        "rest_01",
        "456 Oak Ave",
      );
      expect(result.fee).toBe(5);
      expect(result.estimatedMinutes).toBe(30);
    });

    it("should use default delivery fee when not set", async () => {
      jest.spyOn(service, "retrieveRestaurant").mockResolvedValue({
        id: "rest_01",
      });

      const result = await service.calculateDeliveryFee(
        "rest_01",
        "789 Pine St",
      );
      expect(result.fee).toBe(5);
    });
  });
});
