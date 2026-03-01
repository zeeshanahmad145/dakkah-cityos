jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveLoyaltyAccount(_id: string): Promise<any> {
          return null;
        }
        async updateLoyaltyAccounts(_data: any): Promise<any> {
          return null;
        }
        async createPointTransactions(_data: any): Promise<any> {
          return null;
        }
        async retrieveLoyaltyProgram(_id: string): Promise<any> {
          return null;
        }
        async listPointTransactions(_f: any, _o?: any): Promise<any> {
          return [];
        }
        async listLoyaltyAccounts(_f: any): Promise<any> {
          return [];
        }
        async createLoyaltyAccounts(_data: any): Promise<any> {
          return null;
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
  });

  describe("earnPoints", () => {
    it("adds points to an active account", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 100,
        lifetime_points: 500,
        tenant_id: "t1",
        program_id: "p1",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});
      const createSpy = jest
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
          id: "acc-1",
          points_balance: 150,
          lifetime_points: 550,
        }),
      );
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: "acc-1",
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
        points_balance: 100,
        lifetime_points: 500,
      });

      await expect(
        service.earnPoints({ accountId: "acc-1", points: 50 }),
      ).rejects.toThrow("Loyalty account is not active");
    });

    it("calls calculateTier after earning points", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 0,
        lifetime_points: 0,
        tenant_id: "t1",
      });
      jest.spyOn(service, "updateLoyaltyAccounts").mockResolvedValue({});
      jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx-1" });
      const tierSpy = jest
        .spyOn(service, "calculateTier")
        .mockResolvedValue(null);

      await service.earnPoints({ accountId: "acc-1", points: 10 });

      expect(tierSpy).toHaveBeenCalledWith("acc-1");
    });
  });

  describe("redeemPoints", () => {
    it("deducts points from an active account", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 200,
        lifetime_points: 500,
        tenant_id: "t1",
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});
      jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx-2" });

      const result = await service.redeemPoints({
        accountId: "acc-1",
        points: 80,
      });

      expect(result).toEqual({ id: "tx-2" });
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "acc-1",
          points_balance: 120,
        }),
      );
    });

    it("throws when account is not active", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "frozen",
        points_balance: 200,
      });

      await expect(
        service.redeemPoints({ accountId: "acc-1", points: 50 }),
      ).rejects.toThrow("Loyalty account is not active");
    });

    it("throws when insufficient balance", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 30,
      });

      await expect(
        service.redeemPoints({ accountId: "acc-1", points: 50 }),
      ).rejects.toThrow("Insufficient points balance");
    });

    it("creates a redeem transaction with negative points", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        status: "active",
        points_balance: 100,
        tenant_id: "t1",
      });
      jest.spyOn(service, "updateLoyaltyAccounts").mockResolvedValue({});
      const createSpy = jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx-3" });

      await service.redeemPoints({ accountId: "acc-1", points: 40 });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "redeem",
          points: -40,
          balance_after: 60,
        }),
      );
    });
  });

  describe("getBalance", () => {
    it("returns account balance info", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        points_balance: 250,
        lifetime_points: 1000,
        tier: "gold",
        tier_expires_at: "2025-12-31",
        status: "active",
      });

      const result = await service.getBalance("acc-1");

      expect(result).toEqual({
        points_balance: 250,
        lifetime_points: 1000,
        tier: "gold",
        tier_expires_at: "2025-12-31",
        status: "active",
      });
    });
  });

  describe("getTransactionHistory", () => {
    it("returns transactions with default pagination", async () => {
      const mockTxs = [{ id: "tx-1" }, { id: "tx-2" }];
      jest.spyOn(service, "listPointTransactions").mockResolvedValue(mockTxs);

      const result = await service.getTransactionHistory("acc-1");

      expect(result).toEqual(mockTxs);
    });

    it("filters by type when provided", async () => {
      const listSpy = jest
        .spyOn(service, "listPointTransactions")
        .mockResolvedValue([]);

      await service.getTransactionHistory("acc-1", { type: "earn" });

      expect(listSpy).toHaveBeenCalledWith(
        { account_id: "acc-1", type: "earn" },
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });
  });

  describe("calculateTier", () => {
    it("upgrades tier based on lifetime points", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        lifetime_points: 5000,
        tier: "bronze",
        program_id: "p1",
      });
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        tiers: [
          { name: "bronze", min_points: 100 },
          { name: "silver", min_points: 1000 },
          { name: "gold", min_points: 5000 },
        ],
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});

      const result = await service.calculateTier("acc-1");

      expect(result).toBe("gold");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ tier: "gold" }),
      );
    });

    it("returns current tier when program has no tiers", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        lifetime_points: 100,
        tier: "basic",
        program_id: "p1",
      });
      jest
        .spyOn(service, "retrieveLoyaltyProgram")
        .mockResolvedValue({ tiers: null });

      const result = await service.calculateTier("acc-1");

      expect(result).toBe("basic");
    });

    it("does not update when tier has not changed", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc-1",
        lifetime_points: 500,
        tier: "bronze",
        program_id: "p1",
      });
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        tiers: [{ name: "bronze", min_points: 100 }],
      });
      const updateSpy = jest
        .spyOn(service, "updateLoyaltyAccounts")
        .mockResolvedValue({});

      await service.calculateTier("acc-1");

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe("calculatePoints", () => {
    it("calculates points based on amount and program rules", async () => {
      jest.spyOn(service, "retrieveLoyaltyProgram").mockResolvedValue({
        points_per_currency_unit: 2,
        multiplier: 1.5,
      });

      const result = await service.calculatePoints("p1", 100);

      expect(result).toBe(300);
    });

    it("throws when amount is zero or negative", async () => {
      await expect(service.calculatePoints("p1", 0)).rejects.toThrow(
        "Amount must be greater than zero",
      );
      await expect(service.calculatePoints("p1", -10)).rejects.toThrow(
        "Amount must be greater than zero",
      );
    });
  });

  describe("getOrCreateAccount", () => {
    it("returns existing account if found", async () => {
      const existing = { id: "acc-1", program_id: "p1", customer_id: "c1" };
      jest.spyOn(service, "listLoyaltyAccounts").mockResolvedValue([existing]);

      const result = await service.getOrCreateAccount("p1", "c1", "t1");

      expect(result).toEqual(existing);
    });

    it("creates new account if none exists", async () => {
      jest.spyOn(service, "listLoyaltyAccounts").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createLoyaltyAccounts")
        .mockResolvedValue({ id: "acc-new" });

      const result = await service.getOrCreateAccount("p1", "c1", "t1");

      expect(result).toEqual({ id: "acc-new" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          program_id: "p1",
          customer_id: "c1",
          tenant_id: "t1",
          points_balance: 0,
          lifetime_points: 0,
          status: "active",
        }),
      );
    });
  });
});
