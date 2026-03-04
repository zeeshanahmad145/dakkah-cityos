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
        async listUtilityAccounts(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveUtilityAccount(_id: string): Promise<any> {
          return null;
        }
        async createUtilityAccounts(_data: any): Promise<any> {
          return {};
        }
        async listUtilityBills(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveUtilityBill(_id: string): Promise<any> {
          return null;
        }
        async createUtilityBills(_data: any): Promise<any> {
          return {};
        }
        async updateUtilityBills(_data: any): Promise<any> {
          return {};
        }
        async listMeterReadings(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async createMeterReadings(_data: any): Promise<any> {
          return {};
        }
        async listUsageRecords(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async createUsageRecords(_data: any): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import UtilitiesModuleService from "../../../src/modules/utilities/service";

describe("UtilitiesModuleService – Enhanced", () => {
  let service: UtilitiesModuleService;

  beforeEach(() => {
    service = new UtilitiesModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getActiveAccounts", () => {
    it("returns active accounts for a tenant", async () => {
      vi.spyOn(service, "listUtilityAccounts").mockResolvedValue([
        { id: "acc-1", status: "active" },
        { id: "acc-2", status: "active" },
      ]);

      const result = await service.getActiveAccounts("t-1");
      expect(result).toHaveLength(2);
    });

    it("filters by utility type when provided", async () => {
      const spy = jest
        .spyOn(service, "listUtilityAccounts")
        .mockResolvedValue([]);

      await service.getActiveAccounts("t-1", { utilityType: "electricity" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ utility_type: "electricity" }),
        expect.anything(),
      );
    });

    it("returns empty array when no accounts exist", async () => {
      vi.spyOn(service, "listUtilityAccounts").mockResolvedValue([]);

      const result = await service.getActiveAccounts("t-1");
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateUsageCharges", () => {
    it("calculates charges based on meter readings", async () => {
      jest
        .spyOn(service, "retrieveUtilityAccount")
        .mockResolvedValue({ id: "acc-1" });
      vi.spyOn(service, "listMeterReadings").mockResolvedValue([
        { reading_value: 100, reading_date: "2025-01-01", unit: "kWh" },
        { reading_value: 200, reading_date: "2025-01-15", unit: "kWh" },
        { reading_value: 350, reading_date: "2025-01-31", unit: "kWh" },
      ]);

      const result = await service.calculateUsageCharges(
        "acc-1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        10,
      );

      expect(result.consumption).toBe(250);
      expect(result.charges).toBe(2500);
      expect(result.ratePerUnit).toBe(10);
    });

    it("returns zero charges when no readings exist", async () => {
      jest
        .spyOn(service, "retrieveUtilityAccount")
        .mockResolvedValue({ id: "acc-1" });
      vi.spyOn(service, "listMeterReadings").mockResolvedValue([]);

      const result = await service.calculateUsageCharges(
        "acc-1",
        new Date(),
        new Date(),
      );
      expect(result.consumption).toBe(0);
      expect(result.charges).toBe(0);
    });
  });

  describe("generateBillingSummary", () => {
    it("generates billing summary for a given month", async () => {
      vi.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "AN-001",
      });
      vi.spyOn(service, "listUtilityBills").mockResolvedValue([
        { id: "b-1", amount: 150, status: "paid" },
        { id: "b-2", amount: 200, status: "generated" },
      ]);

      const result = await service.generateBillingSummary("acc-1", 2025, 6);
      expect(result.billCount).toBe(2);
      expect(result.totalAmount).toBe(350);
      expect(result.totalPaid).toBe(150);
      expect(result.totalPending).toBe(200);
    });

    it("returns zero totals when no bills exist", async () => {
      vi.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "AN-001",
      });
      vi.spyOn(service, "listUtilityBills").mockResolvedValue([]);

      const result = await service.generateBillingSummary("acc-1", 2025, 1);
      expect(result.billCount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe("detectAnomalousUsage", () => {
    it("detects anomalous usage when recent consumption exceeds threshold", async () => {
      vi.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "AN-001",
      });
      jest
        .spyOn(service, "listMeterReadings")
        .mockResolvedValueOnce([
          {
            reading_value: 100,
            reading_date: new Date(Date.now() - 80 * 86400000).toISOString(),
          },
          {
            reading_value: 200,
            reading_date: new Date(Date.now() - 40 * 86400000).toISOString(),
          },
        ])
        .mockResolvedValueOnce([
          {
            reading_value: 200,
            reading_date: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          { reading_value: 500, reading_date: new Date().toISOString() },
        ]);

      const result = await service.detectAnomalousUsage("acc-1", 2.0);
      expect(result.isAnomalous).toBe(true);
      expect(result.recentConsumption).toBe(300);
    });

    it("returns not anomalous when usage is within threshold", async () => {
      vi.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "AN-001",
      });
      jest
        .spyOn(service, "listMeterReadings")
        .mockResolvedValueOnce([
          {
            reading_value: 100,
            reading_date: new Date(Date.now() - 80 * 86400000).toISOString(),
          },
          {
            reading_value: 200,
            reading_date: new Date(Date.now() - 40 * 86400000).toISOString(),
          },
        ])
        .mockResolvedValueOnce([
          {
            reading_value: 200,
            reading_date: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          { reading_value: 230, reading_date: new Date().toISOString() },
        ]);

      const result = await service.detectAnomalousUsage("acc-1", 2.0);
      expect(result.isAnomalous).toBe(false);
    });
  });

  describe("getServiceOutages", () => {
    it("detects outages from reading gaps with no consumption change", async () => {
      jest
        .spyOn(service, "listUtilityAccounts")
        .mockResolvedValue([
          {
            id: "acc-1",
            account_number: "AN-001",
            utility_type: "electricity",
          },
        ]);
      vi.spyOn(service, "listMeterReadings").mockResolvedValue([
        {
          reading_value: 500,
          reading_date: new Date("2025-01-01").toISOString(),
        },
        {
          reading_value: 500,
          reading_date: new Date("2025-01-05").toISOString(),
        },
      ]);

      const result = await service.getServiceOutages(
        "t-1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result.outageCount).toBe(1);
      expect(result.outages[0].durationHours).toBeGreaterThan(48);
    });

    it("returns zero outages when readings are normal", async () => {
      jest
        .spyOn(service, "listUtilityAccounts")
        .mockResolvedValue([
          {
            id: "acc-1",
            account_number: "AN-001",
            utility_type: "electricity",
          },
        ]);
      vi.spyOn(service, "listMeterReadings").mockResolvedValue([
        {
          reading_value: 500,
          reading_date: new Date("2025-01-01").toISOString(),
        },
        {
          reading_value: 550,
          reading_date: new Date("2025-01-02").toISOString(),
        },
      ]);

      const result = await service.getServiceOutages(
        "t-1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );
      expect(result.outageCount).toBe(0);
    });
  });
});
