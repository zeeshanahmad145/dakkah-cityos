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

describe("Wallet Operations Integration", () => {
  let service: WalletModuleService;

  beforeEach(() => {
    service = new WalletModuleService();
    jest.clearAllMocks();
  });

  describe("credit wallet", () => {
    it("should increase wallet balance on credit", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "active",
        currency: "usd",
      });
      jest.spyOn(service, "updateWallets").mockResolvedValue({});
      jest.spyOn(service, "createWalletTransactions").mockResolvedValue({
        id: "tx_01",
        type: "credit",
        amount: 500,
        balance_after: 1500,
      });

      const result = await service.creditWallet("wal_01", 500, "Refund");
      expect(result.amount).toBe(500);
      expect(result.balance_after).toBe(1500);
    });

    it("should reject zero amount credit", async () => {
      await expect(service.creditWallet("wal_01", 0)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
    });

    it("should reject negative amount credit", async () => {
      await expect(service.creditWallet("wal_01", -100)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
    });

    it("should reject credit on inactive wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "frozen",
      });
      await expect(service.creditWallet("wal_01", 500)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("debit wallet", () => {
    it("should decrease wallet balance on debit", async () => {
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

      const result = await service.debitWallet("wal_01", 300, "Purchase");
      expect(result.balance_after).toBe(700);
    });

    it("should throw error on insufficient balance", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 100,
        status: "active",
      });

      await expect(service.debitWallet("wal_01", 500)).rejects.toThrow(
        "Insufficient wallet balance",
      );
    });

    it("should reject debit on frozen wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "frozen",
      });
      await expect(service.debitWallet("wal_01", 100)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("transfer between wallets", () => {
    it("should debit source and credit destination with matching amounts", async () => {
      const retrieveSpy = jest.spyOn(service, "retrieveWallet");
      retrieveSpy.mockResolvedValueOnce({
        id: "wal_01",
        balance: 1000,
        status: "active",
      });
      retrieveSpy.mockResolvedValueOnce({
        id: "wal_02",
        balance: 500,
        status: "active",
      });

      jest.spyOn(service, "debitWallet").mockResolvedValue({
        id: "tx_d",
        type: "debit",
        amount: -200,
        balance_after: 800,
      });
      jest.spyOn(service, "creditWallet").mockResolvedValue({
        id: "tx_c",
        type: "credit",
        amount: 200,
        balance_after: 700,
      });

      const result = await service.transferBetweenWallets(
        "wal_01",
        "wal_02",
        200,
      );
      expect(result.amount).toBe(200);
      expect(result.debitTransaction).toBeDefined();
      expect(result.creditTransaction).toBeDefined();
    });

    it("should reject transfer with zero amount", async () => {
      await expect(
        service.transferBetweenWallets("wal_01", "wal_02", 0),
      ).rejects.toThrow("Transfer amount must be greater than zero");
    });

    it("should reject transfer from inactive source wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValueOnce({
        id: "wal_01",
        balance: 1000,
        status: "frozen",
      });
      jest.spyOn(service, "retrieveWallet").mockResolvedValueOnce({
        id: "wal_02",
        balance: 500,
        status: "active",
      });

      await expect(
        service.transferBetweenWallets("wal_01", "wal_02", 200),
      ).rejects.toThrow("Source wallet is not active");
    });

    it("should reject transfer with insufficient source balance", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValueOnce({
        id: "wal_01",
        balance: 100,
        status: "active",
      });
      jest.spyOn(service, "retrieveWallet").mockResolvedValueOnce({
        id: "wal_02",
        balance: 500,
        status: "active",
      });

      await expect(
        service.transferBetweenWallets("wal_01", "wal_02", 500),
      ).rejects.toThrow("Insufficient balance in source wallet");
    });
  });

  describe("freeze wallet", () => {
    it("should freeze an active wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "active",
      });
      jest.spyOn(service, "updateWallets").mockResolvedValue({
        id: "wal_01",
        status: "frozen",
      });

      const result = await service.freezeWallet(
        "wal_01",
        "Suspicious activity",
      );
      expect(result.status).toBe("frozen");
    });

    it("should reject freezing an already frozen wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1000,
        status: "frozen",
      });

      await expect(service.freezeWallet("wal_01")).rejects.toThrow(
        "Wallet is already frozen",
      );
    });
  });

  describe("statement generation", () => {
    it("should return transactions with running balance for date range", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 1500,
        status: "active",
      });
      jest.spyOn(service, "listWalletTransactions").mockResolvedValue([
        {
          id: "tx_01",
          type: "credit",
          amount: 1000,
          balance_after: 1000,
          created_at: "2026-03-01T10:00:00Z",
        },
        {
          id: "tx_02",
          type: "debit",
          amount: -200,
          balance_after: 800,
          created_at: "2026-03-05T10:00:00Z",
        },
        {
          id: "tx_03",
          type: "credit",
          amount: 700,
          balance_after: 1500,
          created_at: "2026-03-10T10:00:00Z",
        },
      ]);

      const result = await service.getStatement(
        "wal_01",
        new Date("2026-03-01"),
        new Date("2026-03-31"),
      );

      expect(result.walletId).toBe("wal_01");
      expect(result.transactions.length).toBe(3);
      expect(result.closingBalance).toBe(1500);
    });

    it("should handle empty transaction list", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_01",
        balance: 0,
        status: "active",
      });
      jest.spyOn(service, "listWalletTransactions").mockResolvedValue([]);

      const result = await service.getStatement(
        "wal_01",
        new Date("2026-03-01"),
        new Date("2026-03-31"),
      );

      expect(result.transactions).toEqual([]);
      expect(result.openingBalance).toBe(0);
    });
  });
});
