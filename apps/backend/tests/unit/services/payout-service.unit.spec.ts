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
        async createPayouts(_data: any): Promise<any> {
          return null;
        }
        async createPayoutTransactionLinks(_data: any): Promise<any> {
          return [];
        }
        async retrievePayout(_id: string): Promise<any> {
          return null;
        }
        async updatePayouts(_data: any): Promise<any> {
          return null;
        }
        async listPayouts(_f: any): Promise<any> {
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

const mockStripe = {
  transfers: { create: jest.fn() },
  accounts: {
    create: jest.fn(),
    createLoginLink: jest.fn(),
    retrieve: jest.fn(),
  },
  accountLinks: { create: jest.fn() },
};

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

import PayoutModuleService from "../../../src/modules/payout/service";

describe("PayoutModuleService", () => {
  let service: PayoutModuleService;

  beforeEach(() => {
    service = new PayoutModuleService();
  });

  describe("createVendorPayout", () => {
    it("creates a payout with correct net amount", async () => {
      const createSpy = jest
        .spyOn(service, "createPayouts")
        .mockResolvedValue({ id: "po-1" });
      jest.spyOn(service, "createPayoutTransactionLinks").mockResolvedValue([]);

      const result = await service.createVendorPayout({
        vendorId: "v-1",
        tenantId: "t-1",
        periodStart: new Date("2025-01-01"),
        periodEnd: new Date("2025-01-31"),
        transactionIds: ["tx-1", "tx-2"],
        grossAmount: 10000,
        commissionAmount: 1500,
        platformFeeAmount: 200,
        adjustmentAmount: 100,
        paymentMethod: "stripe_connect",
      });

      expect(result).toEqual({ id: "po-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: 8400,
          transaction_count: 2,
          status: "processing",
        }),
      );
    });

    it("sets status to pending when scheduledFor is provided", async () => {
      const createSpy = jest
        .spyOn(service, "createPayouts")
        .mockResolvedValue({ id: "po-1" });
      jest.spyOn(service, "createPayoutTransactionLinks").mockResolvedValue([]);

      await service.createVendorPayout({
        vendorId: "v-1",
        tenantId: "t-1",
        periodStart: new Date(),
        periodEnd: new Date(),
        transactionIds: ["tx-1"],
        grossAmount: 5000,
        commissionAmount: 500,
        paymentMethod: "stripe_connect",
        scheduledFor: new Date("2025-02-01"),
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
    });

    it("creates transaction links for each transaction", async () => {
      jest.spyOn(service, "createPayouts").mockResolvedValue({ id: "po-1" });
      const linkSpy = jest
        .spyOn(service, "createPayoutTransactionLinks")
        .mockResolvedValue([]);

      await service.createVendorPayout({
        vendorId: "v-1",
        tenantId: "t-1",
        periodStart: new Date(),
        periodEnd: new Date(),
        transactionIds: ["tx-1", "tx-2", "tx-3"],
        grossAmount: 3000,
        commissionAmount: 300,
        paymentMethod: "bank_transfer",
      });

      expect(linkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            payout_id: "po-1",
            commission_transaction_id: "tx-1",
          }),
          expect.objectContaining({
            payout_id: "po-1",
            commission_transaction_id: "tx-2",
          }),
          expect.objectContaining({
            payout_id: "po-1",
            commission_transaction_id: "tx-3",
          }),
        ]),
      );
    });

    it("defaults platformFeeAmount and adjustmentAmount to 0", async () => {
      const createSpy = jest
        .spyOn(service, "createPayouts")
        .mockResolvedValue({ id: "po-1" });
      jest.spyOn(service, "createPayoutTransactionLinks").mockResolvedValue([]);

      await service.createVendorPayout({
        vendorId: "v-1",
        tenantId: "t-1",
        periodStart: new Date(),
        periodEnd: new Date(),
        transactionIds: ["tx-1"],
        grossAmount: 5000,
        commissionAmount: 500,
        paymentMethod: "stripe_connect",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: 4500,
          platform_fee_amount: 0,
          adjustment_amount: 0,
        }),
      );
    });
  });

  describe("retryFailedPayout", () => {
    it("retries a failed payout", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValueOnce({ id: "po-1", status: "failed", retry_count: 1 })
        .mockResolvedValueOnce({
          id: "po-1",
          status: "pending",
          net_amount: 1000,
          payout_number: "PO-2025-001",
          vendor_id: "v-1",
        });
      jest.spyOn(service, "updatePayouts").mockResolvedValue({});
      mockStripe.transfers.create.mockResolvedValue({ id: "tr-1" });

      const result = await service.retryFailedPayout("po-1", "acct_123");

      expect(result).toBeDefined();
    });

    it("throws when payout is not in failed status", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "completed" });

      await expect(
        service.retryFailedPayout("po-1", "acct_123"),
      ).rejects.toThrow("Payout po-1 is not in failed status");
    });

    it("throws when max retries exceeded", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "failed", retry_count: 3 });

      await expect(
        service.retryFailedPayout("po-1", "acct_123"),
      ).rejects.toThrow("Payout po-1 has exceeded maximum retry attempts");
    });
  });

  describe("cancelPayout", () => {
    it("cancels a pending payout", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "pending" });
      const updateSpy = jest
        .spyOn(service, "updatePayouts")
        .mockResolvedValue({ id: "po-1", status: "cancelled" });

      await service.cancelPayout("po-1", "No longer needed");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          failure_reason: "No longer needed",
        }),
      );
    });

    it("cancels an on_hold payout", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "on_hold" });
      jest
        .spyOn(service, "updatePayouts")
        .mockResolvedValue({ id: "po-1", status: "cancelled" });

      await expect(
        service.cancelPayout("po-1", "reason"),
      ).resolves.toBeDefined();
    });

    it("throws when payout is in non-cancellable status", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "completed" });

      await expect(service.cancelPayout("po-1", "reason")).rejects.toThrow(
        "Cannot cancel payout in completed status",
      );
    });

    it("throws when payout is processing", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "processing" });

      await expect(service.cancelPayout("po-1", "reason")).rejects.toThrow(
        "Cannot cancel payout in processing status",
      );
    });
  });

  describe("holdPayout", () => {
    it("puts a pending payout on hold", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "pending" });
      const updateSpy = jest
        .spyOn(service, "updatePayouts")
        .mockResolvedValue({ id: "po-1", status: "on_hold" });

      await service.holdPayout("po-1", "Under review");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "on_hold",
          notes: "On hold: Under review",
        }),
      );
    });

    it("throws when payout is not pending", async () => {
      jest
        .spyOn(service, "retrievePayout")
        .mockResolvedValue({ id: "po-1", status: "processing" });

      await expect(service.holdPayout("po-1", "review")).rejects.toThrow(
        "Can only hold pending payouts",
      );
    });
  });

  describe("processStripeConnectPayout", () => {
    it("processes payout via Stripe and updates status", async () => {
      jest.spyOn(service, "retrievePayout").mockResolvedValue({
        id: "po-1",
        net_amount: 1000,
        payout_number: "PO-2025-001",
        vendor_id: "v-1",
        period_start: new Date(),
        period_end: new Date(),
      });
      const updateSpy = jest
        .spyOn(service, "updatePayouts")
        .mockResolvedValue({});
      mockStripe.transfers.create.mockResolvedValue({ id: "tr-stripe-1" });

      await service.processStripeConnectPayout("po-1", "acct_123");

      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100000,
          currency: "usd",
          destination: "acct_123",
        }),
      );
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          stripe_transfer_id: "tr-stripe-1",
        }),
      );
    });

    it("updates payout to failed on Stripe error", async () => {
      jest.spyOn(service, "retrievePayout").mockResolvedValue({
        id: "po-1",
        net_amount: 1000,
        payout_number: "PO-2025-001",
        vendor_id: "v-1",
        retry_count: 0,
      });
      const updateSpy = jest
        .spyOn(service, "updatePayouts")
        .mockResolvedValue({});
      mockStripe.transfers.create.mockRejectedValue(
        new Error("Insufficient funds"),
      );

      await expect(
        service.processStripeConnectPayout("po-1", "acct_123"),
      ).rejects.toThrow("Insufficient funds");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          stripe_failure_message: "Insufficient funds",
        }),
      );
    });

    it("throws when no stripe account ID provided", async () => {
      jest.spyOn(service, "retrievePayout").mockResolvedValue({ id: "po-1" });

      await expect(
        service.processStripeConnectPayout("po-1", ""),
      ).rejects.toThrow("No Stripe account ID provided");
    });
  });
});
