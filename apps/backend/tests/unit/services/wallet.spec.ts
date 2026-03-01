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
        async retrieveWallet(_id: string): Promise<any> {
          return null;
        }
        async listWallets(_filter: any): Promise<any> {
          return [];
        }
        async createWallets(_data: any): Promise<any> {
          return {};
        }
        async updateWallets(_data: any): Promise<any> {
          return {};
        }
        async createWalletTransactions(_data: any): Promise<any> {
          return {};
        }
        async listWalletTransactions(_filter: any, _opts?: any): Promise<any> {
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

import WalletModuleService from "../../../src/modules/wallet/service";

describe("WalletModuleService", () => {
  let service: WalletModuleService;

  beforeEach(() => {
    service = new WalletModuleService();
    jest.clearAllMocks();
  });

  describe("creditWallet", () => {
    it("should credit wallet and return transaction", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 500,
        status: "active",
      });
      jest.spyOn(service, "updateWallets").mockResolvedValue({});
      jest.spyOn(service, "createWalletTransactions").mockResolvedValue({
        id: "tx_01",
        type: "credit",
        amount: 200,
        balance_after: 700,
      });

      const result = await service.creditWallet("wal_01", 200);
      expect(result.balance_after).toBe(700);
    });

    it("should reject zero credit", async () => {
      await expect(service.creditWallet("wal_01", 0)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
    });

    it("should reject credit on inactive wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 500,
        status: "frozen",
      });
      await expect(service.creditWallet("wal_01", 100)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("debitWallet", () => {
    it("should debit wallet successfully", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "active",
      });
      jest.spyOn(service, "updateWallets").mockResolvedValue({});
      jest.spyOn(service, "createWalletTransactions").mockResolvedValue({
        id: "tx_02",
        type: "debit",
        amount: -300,
        balance_after: 700,
      });

      const result = await service.debitWallet("wal_01", 300);
      expect(result.balance_after).toBe(700);
    });

    it("should throw on insufficient balance", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 100,
        status: "active",
      });

      await expect(service.debitWallet("wal_01", 500)).rejects.toThrow(
        "Insufficient wallet balance",
      );
    });

    it("should reject zero debit", async () => {
      await expect(service.debitWallet("wal_01", 0)).rejects.toThrow(
        "Debit amount must be greater than zero",
      );
    });
  });

  describe("transferBetweenWallets", () => {
    it("should transfer between active wallets", async () => {
      const retrieveSpy = jest.spyOn(service, "retrieveWallet");
      retrieveSpy.mockResolvedValueOnce({
        id: "wal_01",
        balance: 1000,
        status: "active",
      });
      retrieveSpy.mockResolvedValueOnce({
        id: "wal_02",
        balance: 200,
        status: "active",
      });
      jest.spyOn(service, "debitWallet").mockResolvedValue({ id: "tx_d" });
      jest.spyOn(service, "creditWallet").mockResolvedValue({ id: "tx_c" });

      const result = await service.transferBetweenWallets(
        "wal_01",
        "wal_02",
        300,
      );
      expect(result.amount).toBe(300);
    });

    it("should reject transfer with zero amount", async () => {
      await expect(
        service.transferBetweenWallets("wal_01", "wal_02", 0),
      ).rejects.toThrow("Transfer amount must be greater than zero");
    });

    it("should reject transfer from frozen wallet", async () => {
      jest
        .spyOn(service, "retrieveWallet")
        .mockResolvedValueOnce({
          id: "wal_01",
          balance: 1000,
          status: "frozen",
        })
        .mockResolvedValueOnce({
          id: "wal_02",
          balance: 200,
          status: "active",
        });

      await expect(
        service.transferBetweenWallets("wal_01", "wal_02", 100),
      ).rejects.toThrow("Source wallet is not active");
    });
  });

  describe("freezeWallet", () => {
    it("should freeze an active wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        status: "active",
      });
      jest.spyOn(service, "updateWallets").mockResolvedValue({
        id: "wal_01",
        status: "frozen",
      });

      const result = await service.freezeWallet("wal_01");
      expect(result.status).toBe("frozen");
    });

    it("should reject freezing already frozen wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        status: "frozen",
      });

      await expect(service.freezeWallet("wal_01")).rejects.toThrow(
        "Wallet is already frozen",
      );
    });
  });

  describe("getBalance", () => {
    it("should return balance info", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1500,
        currency: "usd",
        status: "active",
      });

      const result = await service.getBalance("wal_01");
      expect(result.balance).toBe(1500);
      expect(result.currency).toBe("usd");
      expect(result.status).toBe("active");
    });
  });
});
