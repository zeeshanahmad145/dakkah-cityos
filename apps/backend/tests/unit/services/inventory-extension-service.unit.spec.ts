import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listReservationHolds(_filter: any): Promise<any> {
          return [];
        }
        async retrieveReservationHold(_id: string): Promise<any> {
          return null;
        }
        async createReservationHolds(_data: any): Promise<any> {
          return {};
        }
        async updateReservationHolds(_data: any): Promise<any> {
          return {};
        }
        async listStockAlerts(_filter: any): Promise<any> {
          return [];
        }
        async createStockAlerts(_data: any): Promise<any> {
          return {};
        }
        async updateStockAlerts(_data: any): Promise<any> {
          return {};
        }
        async listWarehouseTransfers(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWarehouseTransfer(_id: string): Promise<any> {
          return null;
        }
        async createWarehouseTransfers(_data: any): Promise<any> {
          return {};
        }
        async updateWarehouseTransfers(_data: any): Promise<any> {
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

import InventoryExtensionModuleService from "../../../src/modules/inventory-extension/service";

describe("InventoryExtensionModuleService", () => {
  let service: InventoryExtensionModuleService;

  beforeEach(() => {
    service = new InventoryExtensionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createReservation", () => {
    it("creates a reservation with active status", async () => {
      const created = { id: "res_1", status: "active", quantity: 5 };
      vi.spyOn(service, "createReservationHolds").mockResolvedValue(created);

      const result = await service.createReservation({
        tenant_id: "t1",
        variant_id: "v1",
        quantity: 5,
        reason: "cart",
      });
      expect(result).toEqual(created);
    });
  });

  describe("releaseReservation", () => {
    it("releases an active reservation", async () => {
      jest
        .spyOn(service, "retrieveReservationHold")
        .mockResolvedValueOnce({ id: "res_1", status: "active" })
        .mockResolvedValueOnce({ id: "res_1", status: "released" });
      vi.spyOn(service, "updateReservationHolds").mockResolvedValue({});

      const result = await service.releaseReservation("res_1");
      expect(result.status).toBe("released");
    });

    it("throws when reservation is not active", async () => {
      jest
        .spyOn(service, "retrieveReservationHold")
        .mockResolvedValue({ id: "res_1", status: "released" });

      await expect(service.releaseReservation("res_1")).rejects.toThrow(
        "Reservation is not active",
      );
    });
  });

  describe("expireReservations", () => {
    it("expires reservations past their expiry date", async () => {
      const pastDate = new Date(Date.now() - 100000);
      vi.spyOn(service, "listReservationHolds").mockResolvedValue([
        { id: "res_1", status: "active", expires_at: pastDate },
        {
          id: "res_2",
          status: "active",
          expires_at: new Date(Date.now() + 100000),
        },
      ]);
      vi.spyOn(service, "updateReservationHolds").mockResolvedValue({});

      const result = await service.expireReservations();
      expect(result.expired_count).toBe(1);
      expect(result.expired_ids).toEqual(["res_1"]);
    });

    it("returns zero when no expired reservations", async () => {
      vi.spyOn(service, "listReservationHolds").mockResolvedValue([]);

      const result = await service.expireReservations();
      expect(result.expired_count).toBe(0);
    });
  });

  describe("checkStockAlerts", () => {
    it("creates out_of_stock alert when quantity is zero", async () => {
      vi.spyOn(service, "listStockAlerts").mockResolvedValue([]);
      const newAlert = { id: "alert_1", alert_type: "out_of_stock" };
      vi.spyOn(service, "createStockAlerts").mockResolvedValue(newAlert);

      const result = await service.checkStockAlerts("t1", "v1", 0);
      expect(result).toHaveLength(1);
      expect(result[0].alert_type).toBe("out_of_stock");
    });

    it("does not create duplicate out_of_stock alert", async () => {
      jest
        .spyOn(service, "listStockAlerts")
        .mockResolvedValue([{ id: "alert_1", alert_type: "out_of_stock" }]);
      vi.spyOn(service, "updateStockAlerts").mockResolvedValue({});

      const result = await service.checkStockAlerts("t1", "v1", 0);
      expect(result).toHaveLength(0);
    });

    it("updates existing alerts with current quantity", async () => {
      const updateSpy = jest
        .spyOn(service, "updateStockAlerts")
        .mockResolvedValue({});
      jest
        .spyOn(service, "listStockAlerts")
        .mockResolvedValue([{ id: "alert_1", alert_type: "low_stock" }]);

      await service.checkStockAlerts("t1", "v1", 5);
      expect(updateSpy).toHaveBeenCalledWith({
        id: "alert_1",
        current_quantity: 5,
      });
    });
  });

  describe("getActiveAlerts", () => {
    it("returns unresolved alerts by default", async () => {
      const alerts = [{ id: "a1", is_resolved: false }];
      vi.spyOn(service, "listStockAlerts").mockResolvedValue(alerts);

      const result = await service.getActiveAlerts("t1");
      expect(result).toEqual(alerts);
    });

    it("filters by alert type", async () => {
      const listSpy = jest
        .spyOn(service, "listStockAlerts")
        .mockResolvedValue([]);

      await service.getActiveAlerts("t1", { alertType: "out_of_stock" });
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ alert_type: "out_of_stock" }),
      );
    });
  });

  describe("updateTransferStatus", () => {
    it("sets shipped_at when status is in_transit", async () => {
      jest
        .spyOn(service, "retrieveWarehouseTransfer")
        .mockResolvedValue({ id: "t1", status: "pending" });
      const updateSpy = jest
        .spyOn(service, "updateWarehouseTransfers")
        .mockResolvedValue({});

      await service.updateTransferStatus("t1", "in_transit");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "in_transit",
          shipped_at: expect.any(Date),
        }),
      );
    });

    it("sets received_at when status is received", async () => {
      jest
        .spyOn(service, "retrieveWarehouseTransfer")
        .mockResolvedValue({ id: "t1", status: "in_transit" });
      const updateSpy = jest
        .spyOn(service, "updateWarehouseTransfers")
        .mockResolvedValue({});

      await service.updateTransferStatus("t1", "received");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "received",
          received_at: expect.any(Date),
        }),
      );
    });
  });
});
