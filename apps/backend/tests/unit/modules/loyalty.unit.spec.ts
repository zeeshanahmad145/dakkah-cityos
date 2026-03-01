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
        async listLoyaltyPrograms(_filter: any): Promise<any> {
          return [];
        }
        async retrieveLoyaltyProgram(_id: string): Promise<any> {
          return null;
        }
        async listLoyaltyAccounts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveLoyaltyAccount(_id: string): Promise<any> {
          return null;
        }
        async createLoyaltyAccounts(_data: any): Promise<any> {
          return {};
        }
        async updateLoyaltyAccounts(_data: any): Promise<any> {
          return {};
        }
        async listPointTransactions(
          _filter: any,
          _options?: any,
        ): Promise<any> {
          return [];
        }
        async createPointTransactions(_data: any): Promise<any> {
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

import LoyaltyModuleService from "../../../src/modules/loyalty/service";

describe("LoyaltyModuleService", () => {
  let service: LoyaltyModuleService;

  beforeEach(() => {
    service = new LoyaltyModuleService();
    jest.clearAllMocks();
  });

  describe("earnPoints", () => {
    it("awards points to an active account", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 100,
        lifetime_points: 500,
        tenant_id: "t-1",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});
      const createTxSpy = jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx-1" });
      jest.spyOn(service, "calculateTier").mockResolvedValue("silver");

      const result = await service.earnPoints({
        accountId: "acc-1",
        points: 50,
      });

      expect(result).toEqual({ id: "tx-1" });
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          points_balance: 150,
          lifetime_points: 550,
        }),
      );
      expect(createTxSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "earn",
          points: 50,
          balance_after: 150,
        }),
      );
    });

    it("throws when account is not active", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "suspended",
      });

      await expect(
        service.earnPoints({ accountId: "acc-1", points: 50 }),
      ).rejects.toThrow("Loyalty account is not active");
    });
  });

  describe("redeemPoints", () => {
    it("redeems points from an active account", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 200,
        tenant_id: "t-1",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});
      const createTxSpy = jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx-2" });

      const result = await service.redeemPoints({
        accountId: "acc-1",
        points: 75,
      });

      expect(result).toEqual({ id: "tx-2" });
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          points_balance: 125,
        }),
      );
      expect(createTxSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "redeem",
          points: -75,
          balance_after: 125,
        }),
      );
    });

    it("throws when insufficient points", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 30,
      });

      await expect(
        service.redeemPoints({ accountId: "acc-1", points: 50 }),
      ).rejects.toThrow("Insufficient points balance");
    });

    it("throws when account is not active", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "frozen",
      });

      await expect(
        service.redeemPoints({ accountId: "acc-1", points: 10 }),
      ).rejects.toThrow("Loyalty account is not active");
    });
  });

  describe("calculateTier", () => {
    it("calculates correct tier based on lifetime points", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        lifetime_points: 5000,
        tier: "bronze",
        program_id: "prog-1",
      });
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        id: "prog-1",
        tiers: [
          { name: "bronze", min_points: 0 },
          { name: "silver", min_points: 1000 },
          { name: "gold", min_points: 5000 },
          { name: "platinum", min_points: 10000 },
        ],
      });
      jest.spyOn(service, "updateLoyaltyAccounts").mockResolvedValue({});

      const result = await service.calculateTier("acc-1");

      expect(result).toBe("gold");
    });

    it("returns current tier when no tiers configured", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        lifetime_points: 5000,
        tier: "member",
        program_id: "prog-1",
      });
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        id: "prog-1",
        tiers: null,
      });

      const result = await service.calculateTier("acc-1");

      expect(result).toBe("member");
    });
  });

  describe("calculatePoints", () => {
    it("calculates points for an order amount", async () => {
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        id: "prog-1",
        points_per_currency_unit: 2,
        multiplier: 1.5,
      });

      const result = await service.calculatePoints("prog-1", 100);

      expect(result).toBe(300);
    });

    it("throws when amount is zero or negative", async () => {
      await expect(service.calculatePoints("prog-1", 0)).rejects.toThrow(
        "Amount must be greater than zero",
      );
    });
  });

  describe("getBalance", () => {
    it("returns account balance details", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        points_balance: 250,
        lifetime_points: 1200,
        tier: "silver",
        tier_expires_at: "2025-12-31",
        status: "active",
      });

      const result = await service.getBalance("acc-1");

      expect(result).toEqual({
        points_balance: 250,
        lifetime_points: 1200,
        tier: "silver",
        tier_expires_at: "2025-12-31",
        status: "active",
      });
    });
  });
});
