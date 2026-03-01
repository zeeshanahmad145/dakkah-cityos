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
        async createWallets(_data: any): Promise<any> {
          return {};
        }
        async updateWallets(_data: any): Promise<any> {
          return {};
        }
        async retrieveWallet(_id: string): Promise<any> {
          return null;
        }
        async listWallets(_filter?: any): Promise<any> {
          return [];
        }
        async createWalletTransactions(_data: any): Promise<any> {
          return {};
        }
        async listWalletTransactions(_filter?: any, _opts?: any): Promise<any> {
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

  describe("createWallet", () => {
    it("creates a wallet for a new customer", async () => {
      jest.spyOn(service, "listWallets").mockResolvedValue([]);

      const createSpy = jest.spyOn(service, "createWallets").mockResolvedValue({
        id: "wal_1",
        customer_id: "cust_1",
        currency: "usd",
        balance: 0,
        status: "active",
      });

      const result = await service.createWallet("cust_1", "usd");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust_1",
          currency: "usd",
          balance: 0,
          status: "active",
        }),
      );
      expect(result.id).toBe("wal_1");
    });

    it("defaults currency to usd", async () => {
      jest.spyOn(service, "listWallets").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createWallets")
        .mockResolvedValue({ id: "wal_1" });

      await service.createWallet("cust_1");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ currency: "usd" }),
      );
    });

    it("throws when wallet already exists for customer and currency", async () => {
      jest
        .spyOn(service, "listWallets")
        .mockResolvedValue([{ id: "wal_existing" }]);

      await expect(service.createWallet("cust_1", "usd")).rejects.toThrow(
        "Wallet already exists for this customer and currency",
      );
    });
  });

  describe("creditWallet", () => {
    it("credits wallet and creates transaction", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 100,
        status: "active",
      });

      const updateSpy = jest
        .spyOn(service, "updateWallets")
        .mockResolvedValue({});
      const txSpy = jest
        .spyOn(service, "createWalletTransactions")
        .mockResolvedValue({
          id: "tx_1",
          type: "credit",
          amount: 50,
          balance_after: 150,
        });

      const result = await service.creditWallet("wal_1", 50, "Refund");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "wal_1", balance: 150 }),
      );
      expect(txSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "credit",
          amount: 50,
          balance_after: 150,
        }),
      );
    });

    it("throws when credit amount is zero or negative", async () => {
      await expect(service.creditWallet("wal_1", 0)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
      await expect(service.creditWallet("wal_1", -10)).rejects.toThrow(
        "Credit amount must be greater than zero",
      );
    });

    it("throws when wallet is not active", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 100,
        status: "frozen",
      });

      await expect(service.creditWallet("wal_1", 50)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("debitWallet", () => {
    it("debits wallet and creates transaction", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 200,
        status: "active",
      });

      const updateSpy = jest
        .spyOn(service, "updateWallets")
        .mockResolvedValue({});
      const txSpy = jest
        .spyOn(service, "createWalletTransactions")
        .mockResolvedValue({
          id: "tx_1",
          type: "debit",
          amount: -75,
          balance_after: 125,
        });

      const result = await service.debitWallet("wal_1", 75, "Purchase");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "wal_1", balance: 125 }),
      );
      expect(txSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "debit",
          amount: -75,
          balance_after: 125,
        }),
      );
    });

    it("throws when insufficient balance", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 50,
        status: "active",
      });

      await expect(service.debitWallet("wal_1", 100)).rejects.toThrow(
        "Insufficient wallet balance",
      );
    });

    it("throws when debit amount is zero or negative", async () => {
      await expect(service.debitWallet("wal_1", 0)).rejects.toThrow(
        "Debit amount must be greater than zero",
      );
    });

    it("throws when wallet is not active", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 200,
        status: "frozen",
      });

      await expect(service.debitWallet("wal_1", 50)).rejects.toThrow(
        "Wallet is not active",
      );
    });
  });

  describe("freezeWallet", () => {
    it("freezes an active wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        status: "active",
      });

      const updateSpy = jest.spyOn(service, "updateWallets").mockResolvedValue({
        id: "wal_1",
        status: "frozen",
      });

      const result = await service.freezeWallet("wal_1", "Suspicious activity");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "wal_1",
          status: "frozen",
          freeze_reason: "Suspicious activity",
        }),
      );
    });

    it("throws when wallet is already frozen", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        status: "frozen",
      });

      await expect(service.freezeWallet("wal_1")).rejects.toThrow(
        "Wallet is already frozen",
      );
    });
  });

  describe("transferBetweenWallets", () => {
    it("transfers funds between two active wallets", async () => {
      jest
        .spyOn(service, "retrieveWallet")
        .mockResolvedValueOnce({
          id: "wal_from",
          balance: 500,
          status: "active",
        })
        .mockResolvedValueOnce({
          id: "wal_to",
          balance: 100,
          status: "active",
        });

      jest.spyOn(service, "debitWallet").mockResolvedValue({ id: "tx_debit" });
      jest
        .spyOn(service, "creditWallet")
        .mockResolvedValue({ id: "tx_credit" });

      const result = await service.transferBetweenWallets(
        "wal_from",
        "wal_to",
        200,
      );

      expect(result.amount).toBe(200);
      expect(service.debitWallet).toHaveBeenCalledWith(
        "wal_from",
        200,
        expect.any(String),
        undefined,
      );
      expect(service.creditWallet).toHaveBeenCalledWith(
        "wal_to",
        200,
        expect.any(String),
        undefined,
      );
    });

    it("throws when transfer amount is zero or negative", async () => {
      await expect(
        service.transferBetweenWallets("wal_from", "wal_to", 0),
      ).rejects.toThrow("Transfer amount must be greater than zero");
    });

    it("throws when source wallet has insufficient balance", async () => {
      jest
        .spyOn(service, "retrieveWallet")
        .mockResolvedValueOnce({
          id: "wal_from",
          balance: 50,
          status: "active",
        })
        .mockResolvedValueOnce({
          id: "wal_to",
          balance: 100,
          status: "active",
        });

      await expect(
        service.transferBetweenWallets("wal_from", "wal_to", 200),
      ).rejects.toThrow("Insufficient balance in source wallet");
    });
  });

  describe("getTransactionHistory", () => {
    it("returns transaction history with default options", async () => {
      jest.spyOn(service, "listWalletTransactions").mockResolvedValue([
        { id: "tx_1", type: "credit", amount: 100 },
        { id: "tx_2", type: "debit", amount: -50 },
      ]);

      const result = await service.getTransactionHistory("wal_1");

      expect(result).toHaveLength(2);
      expect(service.listWalletTransactions).toHaveBeenCalledWith(
        { wallet_id: "wal_1" },
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });

    it("applies custom limit and offset", async () => {
      jest.spyOn(service, "listWalletTransactions").mockResolvedValue([]);

      await service.getTransactionHistory("wal_1", { limit: 5, offset: 10 });

      expect(service.listWalletTransactions).toHaveBeenCalledWith(
        { wallet_id: "wal_1" },
        expect.objectContaining({ take: 5, skip: 10 }),
      );
    });
  });

  describe("getBalance", () => {
    it("returns balance info for a wallet", async () => {
      jest.spyOn(service, "retrieveWallet").mockResolvedValue({
        id: "wal_1",
        balance: 250,
        currency: "usd",
        status: "active",
      });

      const result = await service.getBalance("wal_1");

      expect(result.balance).toBe(250);
      expect(result.currency).toBe("usd");
      expect(result.status).toBe("active");
    });
  });
});
