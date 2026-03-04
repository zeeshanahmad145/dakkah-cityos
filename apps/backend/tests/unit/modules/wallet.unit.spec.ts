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
        async listWallets(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWallet(_id: string): Promise<any> {
          return null;
        }
        async createWallets(_data: any): Promise<any> {
          return {};
        }
        async updateWallets(_data: any): Promise<any> {
          return {};
        }
        async listWalletTransactions(
          _filter: any,
          _options?: any,
        ): Promise<any> {
          return [];
        }
        async createWalletTransactions(_data: any): Promise<any> {
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

import WalletModuleService from "../../../src/modules/wallet/service";

describe("WalletModuleService", () => {
  let service: WalletModuleService;

  beforeEach(() => {
    service = new WalletModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createWallet", () => {
    it("creates a new wallet for a customer", async () => {
      vi.spyOn(service, "listWallets").mockResolvedValue([]);
      const createSpy = vi.spyOn(service, "createWallets").mockResolvedValue({
        id: "wal-1",
        customer_id: "cust-1",
        balance: 0,
        status: "active",
      });

      const result = await service.createWallet("cust-1", "usd");

      expect(result.status).toBe("active");
      expect(result.balance).toBe(0);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          currency: "usd",
          balance: 0,
          status: "active",
        }),
      );
    });

    it("throws when wallet already exists for customer and currency", async () => {
      jest
        .spyOn(service, "listWallets")
        .mockResolvedValue([{ id: "wal-existing" }]);

      await expect(service.createWallet("cust-1", "usd")).rejects.toThrow(
        "Wallet already exists for this customer and currency",
      );
    });
  });

  describe("creditWallet", () => {
    it("credits wallet and creates transaction", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 5000,
        status: "active",
      });
      const updateSpy = jest
        .spyOn(service, "updateWallets")
        .mockResolvedValue({});
      const txSpy = jest
        .spyOn(service, "createWalletTransactions")
        .mockResolvedValue({
          id: "tx-1",
          type: "credit",
          amount: 2000,
          balance_after: 7000,
        });

      const result = await service.creditWallet(
        "wal-1",
        2000,
        "Refund",
        "order-1",
      );

      expect(result.balance_after).toBe(7000);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 7000,
        }),
      );
      expect(txSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "credit",
          amount: 2000,
          balance_after: 7000,
        }),
      );
    });

    it("throws when credit amount is zero", async () => {
      await expect(service.creditWallet("wal-1", 0)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
    });

    it("throws when wallet is not active", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 5000,
        status: "frozen",
      });

      await expect(service.creditWallet("wal-1", 1000)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("debitWallet", () => {
    it("debits wallet and creates transaction", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 5000,
        status: "active",
      });
      const updateSpy = jest
        .spyOn(service, "updateWallets")
        .mockResolvedValue({});
      const txSpy = jest
        .spyOn(service, "createWalletTransactions")
        .mockResolvedValue({
          id: "tx-2",
          type: "debit",
          amount: -1500,
          balance_after: 3500,
        });

      const result = await service.debitWallet("wal-1", 1500, "Purchase");

      expect(result.balance_after).toBe(3500);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 3500,
        }),
      );
      expect(txSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "debit",
          amount: -1500,
        }),
      );
    });

    it("throws when debit amount is zero", async () => {
      await expect(service.debitWallet("wal-1", 0)).rejects.toThrow(
        "Debit amount must be greater than zero",
      );
    });

    it("throws when insufficient balance", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 500,
        status: "active",
      });

      await expect(service.debitWallet("wal-1", 1000)).rejects.toThrow(
        "Insufficient wallet balance",
      );
    });

    it("throws when wallet is not active", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 5000,
        status: "frozen",
      });

      await expect(service.debitWallet("wal-1", 100)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("getBalance", () => {
    it("returns wallet balance details", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        balance: 7500,
        currency: "usd",
        status: "active",
      });

      const result = await service.getBalance("wal-1");

      expect(result).toEqual({
        balance: 7500,
        currency: "usd",
        status: "active",
      });
    });
  });

  describe("freezeWallet", () => {
    it("freezes an active wallet", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        status: "active",
      });
      const updateSpy = vi.spyOn(service, "updateWallets").mockResolvedValue({
        id: "wal-1",
        status: "frozen",
      });

      const result = await service.freezeWallet("wal-1", "Suspicious activity");

      expect(result.status).toBe("frozen");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "frozen",
          freeze_reason: "Suspicious activity",
        }),
      );
    });

    it("throws when wallet is already frozen", async () => {
      vi.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal-1",
        status: "frozen",
      });

      await expect(service.freezeWallet("wal-1")).rejects.toThrow(
        "Wallet is already frozen",
      );
    });
  });
});
