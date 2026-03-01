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
        async listUtilityAccounts(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveUtilityAccount(_id: string): Promise<any> {
          return null;
        }
        async createUtilityAccounts(_data: any): Promise<any> {
          return {};
        }
        async listMeterReadings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveMeterReading(_id: string): Promise<any> {
          return null;
        }
        async listUtilityBills(_filter: any): Promise<any> {
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
  };
});

import UtilitiesModuleService from "../../../src/modules/utilities/service";

describe("UtilitiesModuleService", () => {
  let service: UtilitiesModuleService;

  beforeEach(() => {
    service = new UtilitiesModuleService();
    jest.clearAllMocks();
  });

  describe("getActiveAccounts", () => {
    it("returns active accounts for a tenant", async () => {
      const accounts = [
        { id: "acc-1", utility_type: "electricity", status: "active" },
        { id: "acc-2", utility_type: "water", status: "active" },
      ];
      jest.spyOn(service, "listUtilityAccounts").mockResolvedValue(accounts);

      const result = await service.getActiveAccounts("tenant-1");

      expect(result).toHaveLength(2);
    });

    it("filters by utility type when provided", async () => {
      const listSpy = jest
        .spyOn(service, "listUtilityAccounts")
        .mockResolvedValue([]);

      await service.getActiveAccounts("tenant-1", { utilityType: "gas" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ utility_type: "gas" }),
        expect.anything(),
      );
    });
  });

  describe("calculateUsageCharges", () => {
    it("calculates charges from meter readings", async () => {
      jest
        .spyOn(service, "retrieveUtilityAccount")
        .mockResolvedValue({ id: "acc-1" });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([
        { reading_value: 100, reading_date: "2025-01-01", unit: "kWh" },
        { reading_value: 200, reading_date: "2025-01-15", unit: "kWh" },
        { reading_value: 350, reading_date: "2025-02-01", unit: "kWh" },
      ]);

      const result = await service.calculateUsageCharges(
        "acc-1",
        new Date("2025-01-01"),
        new Date("2025-02-01"),
      );

      expect(result.consumption).toBe(250);
      expect(result.charges).toBe(250 * 5.0);
    });

    it("returns zero charges when no readings exist", async () => {
      jest
        .spyOn(service, "retrieveUtilityAccount")
        .mockResolvedValue({ id: "acc-1" });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([]);

      const result = await service.calculateUsageCharges(
        "acc-1",
        new Date("2025-01-01"),
        new Date("2025-02-01"),
      );

      expect(result.consumption).toBe(0);
      expect(result.charges).toBe(0);
    });

    it("uses custom rate when provided", async () => {
      jest
        .spyOn(service, "retrieveUtilityAccount")
        .mockResolvedValue({ id: "acc-1" });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([
        { reading_value: 100, reading_date: "2025-01-01", unit: "kWh" },
        { reading_value: 200, reading_date: "2025-02-01", unit: "kWh" },
      ]);

      const result = await service.calculateUsageCharges(
        "acc-1",
        new Date("2025-01-01"),
        new Date("2025-02-01"),
        10.0,
      );

      expect(result.charges).toBe(100 * 10.0);
      expect(result.ratePerUnit).toBe(10.0);
    });
  });

  describe("generateBill", () => {
    it("generates a bill for a billing period", async () => {
      jest.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        tenant_id: "tenant-1",
        provider_name: "PowerCo",
      });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([
        { reading_value: 100, reading_date: "2025-01-01", unit: "kWh" },
        { reading_value: 200, reading_date: "2025-01-31", unit: "kWh" },
      ]);
      const createSpy = jest
        .spyOn(service, "createUtilityBills")
        .mockResolvedValue({ id: "bill-1" });

      await service.generateBill("acc-1", "2025-01-2025-01");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: "acc-1",
          status: "generated",
          currency_code: "USD",
        }),
      );
    });
  });

  describe("processPayment", () => {
    it("marks bill as paid when full amount is paid", async () => {
      jest.spyOn(service, "retrieveUtilityBill").mockResolvedValue({
        id: "bill-1",
        amount: "500",
        status: "generated",
        tenant_id: "t1",
        account_id: "a1",
        currency_code: "USD",
      });
      const updateSpy = jest
        .spyOn(service, "updateUtilityBills")
        .mockResolvedValue({});
      jest.spyOn(service, "createUsageRecords").mockResolvedValue({});

      const result = await service.processPayment("bill-1", 500);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "paid" }),
      );
      expect(result.remaining).toBe(0);
    });

    it("throws when payment exceeds bill amount", async () => {
      jest.spyOn(service, "retrieveUtilityBill").mockResolvedValue({
        id: "bill-1",
        amount: "500",
      });

      await expect(service.processPayment("bill-1", 600)).rejects.toThrow(
        "Payment amount exceeds bill amount",
      );
    });
  });

  describe("getUsageSummary", () => {
    it("returns usage summary for an account", async () => {
      jest.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "ACC001",
        utility_type: "electricity",
        provider_name: "PowerCo",
        status: "active",
      });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([
        { reading_value: 100, reading_date: "2025-01-01", unit: "kWh" },
        { reading_value: 600, reading_date: "2025-06-01", unit: "kWh" },
      ]);
      jest.spyOn(service, "listUtilityBills").mockResolvedValue([
        { amount: "250", status: "paid" },
        { amount: "300", status: "generated" },
      ]);

      const result = await service.getUsageSummary("acc-1", 6);

      expect(result.consumption.total).toBe(500);
      expect(result.charges.total).toBe(550);
      expect(result.charges.paid).toBe(250);
      expect(result.charges.pending).toBe(300);
    });

    it("handles empty readings and bills", async () => {
      jest.spyOn(service, "retrieveUtilityAccount").mockResolvedValue({
        id: "acc-1",
        account_number: "ACC001",
        utility_type: "electricity",
        provider_name: "PowerCo",
        status: "active",
      });
      jest.spyOn(service, "listMeterReadings").mockResolvedValue([]);
      jest.spyOn(service, "listUtilityBills").mockResolvedValue([]);

      const result = await service.getUsageSummary("acc-1");

      expect(result.consumption.total).toBe(0);
      expect(result.charges.total).toBe(0);
      expect(result.readingCount).toBe(0);
      expect(result.billCount).toBe(0);
    });
  });
});
