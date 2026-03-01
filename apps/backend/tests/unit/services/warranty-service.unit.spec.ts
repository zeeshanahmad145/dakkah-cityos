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
        async listWarrantyPlans(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWarrantyPlan(_id: string): Promise<any> {
          return null;
        }
        async listWarrantyClaims(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWarrantyClaim(_id: string): Promise<any> {
          return null;
        }
        async createWarrantyClaims(_data: any): Promise<any> {
          return {};
        }
        async updateWarrantyClaims(_data: any): Promise<any> {
          return {};
        }
        async listRepairOrders(_filter: any): Promise<any> {
          return [];
        }
        async createRepairOrders(_data: any): Promise<any> {
          return {};
        }
        async updateRepairOrders(_data: any): Promise<any> {
          return {};
        }
        async listSpareParts(_filter: any): Promise<any> {
          return [];
        }
        async listServiceCenters(_filter: any): Promise<any> {
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

import WarrantyModuleService from "../../../src/modules/warranty/service";

describe("WarrantyModuleService", () => {
  let service: WarrantyModuleService;

  beforeEach(() => {
    service = new WarrantyModuleService();
    jest.clearAllMocks();
  });

  describe("extendWarranty", () => {
    it("extends warranty expiry by the given months", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "w-1",
        status: "registered",
        expiry_date: new Date("2025-06-01"),
      });
      const updateSpy = jest
        .spyOn(service, "updateWarrantyClaims")
        .mockResolvedValue({ id: "w-1" });

      await service.extendWarranty("w-1", 6, 50);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "w-1",
          status: "registered",
          extension_fee: 50,
        }),
      );
      const callArgs = updateSpy.mock.calls[0][0];
      const newExpiry = new Date(callArgs.expiry_date);
      expect(newExpiry.getMonth()).toBe(new Date("2025-12-01").getMonth());
    });

    it("throws when additional months is not positive", async () => {
      await expect(service.extendWarranty("w-1", 0, 50)).rejects.toThrow(
        "Additional months must be a positive number",
      );
    });

    it("throws when fee is negative", async () => {
      await expect(service.extendWarranty("w-1", 6, -10)).rejects.toThrow(
        "Fee cannot be negative",
      );
    });

    it("throws when warranty is voided", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "w-1",
        status: "voided",
        expiry_date: new Date("2025-06-01"),
      });

      await expect(service.extendWarranty("w-1", 6, 50)).rejects.toThrow(
        "Cannot extend a voided or already-claimed warranty",
      );
    });

    it("throws when warranty is already claimed", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "w-1",
        status: "claimed",
        expiry_date: new Date("2025-06-01"),
      });

      await expect(service.extendWarranty("w-1", 6, 50)).rejects.toThrow(
        "Cannot extend a voided or already-claimed warranty",
      );
    });
  });

  describe("getWarrantyHistory", () => {
    it("returns warranties with computed expired status", async () => {
      const pastDate = new Date("2020-01-01");
      const futureDate = new Date("2030-01-01");
      jest.spyOn(service, "listWarrantyClaims").mockResolvedValue([
        {
          id: "w-1",
          product_id: "p1",
          plan_id: "plan-1",
          purchase_date: new Date("2019-01-01"),
          expiry_date: pastDate,
          status: "registered",
          registered_at: new Date("2019-01-01"),
        },
        {
          id: "w-2",
          product_id: "p2",
          plan_id: "plan-2",
          purchase_date: new Date("2025-01-01"),
          expiry_date: futureDate,
          status: "registered",
          claim_number: null,
          registered_at: new Date("2025-01-01"),
        },
      ]);

      const result = await service.getWarrantyHistory("cust-1");

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("expired");
      expect(result[1].status).toBe("registered");
    });

    it("preserves non-registered statuses without overriding", async () => {
      jest.spyOn(service, "listWarrantyClaims").mockResolvedValue([
        {
          id: "w-1",
          product_id: "p1",
          plan_id: "plan-1",
          purchase_date: new Date("2019-01-01"),
          expiry_date: new Date("2020-01-01"),
          status: "claimed",
          claim_number: "CLM-123",
          registered_at: new Date("2019-01-01"),
        },
      ]);

      const result = await service.getWarrantyHistory("cust-1");

      expect(result[0].status).toBe("claimed");
      expect(result[0].claimNumber).toBe("CLM-123");
    });
  });

  describe("scheduleRepair", () => {
    it("schedules a repair for an approved claim with existing repair order", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "claim-1",
        status: "approved",
      });
      jest
        .spyOn(service, "listRepairOrders")
        .mockResolvedValue([{ id: "ro-1", warranty_claim_id: "claim-1" }]);
      const updateSpy = jest
        .spyOn(service, "updateRepairOrders")
        .mockResolvedValue({ id: "ro-1", status: "scheduled" });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await service.scheduleRepair("claim-1", {
        scheduledDate: futureDate,
        repairType: "replacement",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "ro-1",
          repair_type: "replacement",
          status: "scheduled",
        }),
      );
    });

    it("creates a new repair order when none exists", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "claim-1",
        status: "approved",
      });
      jest.spyOn(service, "listRepairOrders").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createRepairOrders")
        .mockResolvedValue({ id: "ro-new" });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await service.scheduleRepair("claim-1", {
        scheduledDate: futureDate,
        repairType: "fix",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          warranty_claim_id: "claim-1",
          repair_type: "fix",
          status: "scheduled",
        }),
      );
    });

    it("throws when claim is not approved", async () => {
      jest.spyOn(service, "retrieveWarrantyClaim").mockResolvedValue({
        id: "claim-1",
        status: "registered",
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await expect(
        service.scheduleRepair("claim-1", {
          scheduledDate: futureDate,
          repairType: "fix",
        }),
      ).rejects.toThrow("Repairs can only be scheduled for approved claims");
    });

    it("throws when repair type is missing", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await expect(
        service.scheduleRepair("claim-1", {
          scheduledDate: futureDate,
          repairType: "",
        }),
      ).rejects.toThrow("Repair type is required");
    });

    it("throws when scheduled date is in the past", async () => {
      await expect(
        service.scheduleRepair("claim-1", {
          scheduledDate: new Date("2020-01-01"),
          repairType: "fix",
        }),
      ).rejects.toThrow("Scheduled date must be in the future");
    });
  });
});
