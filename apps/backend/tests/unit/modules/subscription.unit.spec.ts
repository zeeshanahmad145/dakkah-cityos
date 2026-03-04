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
        async listSubscriptions(_filter: any): Promise<any> {
          return [];
        }
        async retrieveSubscription(_id: string): Promise<any> {
          return null;
        }
        async createSubscriptions(_data: any): Promise<any> {
          return {};
        }
        async updateSubscriptions(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionPlans(_filter: any): Promise<any> {
          return [];
        }
        async retrieveSubscriptionPlan(_id: string): Promise<any> {
          return null;
        }
        async createSubscriptionItems(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionItems(_filter: any): Promise<any> {
          return [];
        }
        async deleteSubscriptionItems(_id: string): Promise<any> {
          return {};
        }
        async createSubscriptionEvents(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionEvents(_filter: any): Promise<any> {
          return [];
        }
        async createSubscriptionPauses(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionPauses(_filter: any): Promise<any> {
          return [];
        }
        async updateSubscriptionPauses(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionDiscounts(_filter: any): Promise<any> {
          return [];
        }
        async updateSubscriptionDiscounts(_data: any): Promise<any> {
          return {};
        }
        async createBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async retrieveBillingCycle(_id: string): Promise<any> {
          return null;
        }
        async updateBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async listBillingCycles(_filter: any): Promise<any> {
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

import SubscriptionModuleService from "../../../src/modules/subscription/service";

describe("SubscriptionModuleService", () => {
  let service: SubscriptionModuleService;

  beforeEach(() => {
    service = new SubscriptionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createSubscriptionFromPlan", () => {
    it("creates a subscription from a plan", async () => {
      vi.spyOn(service, "retrieveSubscriptionPlan").mockResolvedValue({
        id: "plan-1",
        name: "Pro Plan",
        price: 2999,
        trial_period_days: 0,
        billing_interval: "monthly",
        billing_interval_count: 1,
        currency_code: "usd",
      });
      const createSpy = jest
        .spyOn(service, "createSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "active",
        });
      vi.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.createSubscriptionFromPlan(
        "cust-1",
        "plan-1",
      );

      expect(result.status).toBe("active");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          status: "active",
          subtotal: 2999,
          total: 2999,
        }),
      );
    });

    it("creates a subscription with trial period", async () => {
      vi.spyOn(service, "retrieveSubscriptionPlan").mockResolvedValue({
        id: "plan-1",
        name: "Pro Plan",
        price: 2999,
        trial_period_days: 14,
        billing_interval: "monthly",
        billing_interval_count: 1,
        currency_code: "usd",
      });
      const createSpy = jest
        .spyOn(service, "createSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "draft",
        });
      vi.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.createSubscriptionFromPlan(
        "cust-1",
        "plan-1",
        { startTrial: true },
      );

      expect(result.status).toBe("draft");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "draft",
        }),
      );
    });
  });

  describe("cancelSubscription", () => {
    it("cancels a subscription immediately", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
        current_period_end: "2025-02-01",
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "canceled",
        });
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.cancelSubscription("sub-1", {
        cancelImmediately: true,
        reason: "Too expensive",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "canceled",
        }),
      );
    });

    it("cancels at period end by default", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
        current_period_end: "2025-02-01",
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "active",
        });
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.cancelSubscription("sub-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          end_date: "2025-02-01",
        }),
      );
    });

    it("throws when subscription is already canceled", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "canceled",
      });

      await expect(service.cancelSubscription("sub-1")).rejects.toThrow(
        "Subscription is already canceled or expired",
      );
    });
  });

  describe("pauseSubscription", () => {
    it("pauses an active subscription", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
      });
      vi.spyOn(service, "createSubscriptionPauses").mockResolvedValue({});
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "paused",
        });
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.pauseSubscription(
        "sub-1",
        "Going on vacation",
      );

      expect(result.status).toBe("paused");
    });

    it("throws when subscription is not active", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "paused",
      });

      await expect(service.pauseSubscription("sub-1")).rejects.toThrow(
        "Only active subscriptions can be paused",
      );
    });
  });

  describe("resumeSubscription", () => {
    it("resumes a paused subscription", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "paused",
      });
      vi.spyOn(service, "listSubscriptionPauses").mockResolvedValue([
        {
          id: "pause-1",
          paused_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ]);
      vi.spyOn(service, "updateSubscriptionPauses").mockResolvedValue({});
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({
          id: "sub-1",
          status: "active",
        });
      vi.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.resumeSubscription("sub-1");

      expect(result.status).toBe("active");
    });

    it("throws when subscription is not paused", async () => {
      vi.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
      });

      await expect(service.resumeSubscription("sub-1")).rejects.toThrow(
        "Only paused subscriptions can be resumed",
      );
    });
  });

  describe("calculatePeriodEnd", () => {
    it("calculates monthly period end", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "monthly", 1);
      expect(end.getMonth()).toBe(1);
    });

    it("calculates yearly period end", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "yearly", 1);
      expect(end.getFullYear()).toBe(2026);
    });

    it("calculates weekly period end", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "weekly", 2);
      expect(end.getDate()).toBe(29);
    });
  });
});
