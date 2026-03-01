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
        async listSubscriptionPlans(_filter: any): Promise<any> {
          return [];
        }
        async retrieveSubscriptionPlan(_id: string): Promise<any> {
          return null;
        }
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
        async listSubscriptionItems(_filter: any): Promise<any> {
          return [];
        }
        async createSubscriptionItems(_data: any): Promise<any> {
          return {};
        }
        async deleteSubscriptionItems(_id: string): Promise<any> {
          return {};
        }
        async listBillingCycles(_filter: any): Promise<any> {
          return [];
        }
        async retrieveBillingCycle(_id: string): Promise<any> {
          return null;
        }
        async createBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async updateBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionDiscounts(_filter: any): Promise<any> {
          return [];
        }
        async updateSubscriptionDiscounts(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionEvents(_filter: any): Promise<any> {
          return [];
        }
        async createSubscriptionEvents(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptionPauses(_filter: any): Promise<any> {
          return [];
        }
        async createSubscriptionPauses(_data: any): Promise<any> {
          return {};
        }
        async updateSubscriptionPauses(_data: any): Promise<any> {
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

import SubscriptionModuleService from "../../../src/modules/subscription/service";

describe("SubscriptionModuleService", () => {
  let service: SubscriptionModuleService;

  beforeEach(() => {
    service = new SubscriptionModuleService();
    jest.clearAllMocks();
  });

  describe("getActivePlans", () => {
    it("returns active plans sorted by sort_order", async () => {
      jest.spyOn(service, "listSubscriptionPlans").mockResolvedValue([
        { id: "p2", status: "active", sort_order: 2 },
        { id: "p1", status: "active", sort_order: 1 },
      ]);

      const result = await service.getActivePlans();
      expect(result[0].id).toBe("p1");
      expect(result[1].id).toBe("p2");
    });

    it("filters by tenantId when provided", async () => {
      const spy = jest
        .spyOn(service, "listSubscriptionPlans")
        .mockResolvedValue([]);

      await service.getActivePlans("tenant-1");
      expect(spy).toHaveBeenCalledWith({
        status: "active",
        tenant_id: "tenant-1",
      });
    });

    it("handles non-array response", async () => {
      jest
        .spyOn(service, "listSubscriptionPlans")
        .mockResolvedValue({ id: "p1", sort_order: 0 });

      const result = await service.getActivePlans();
      expect(result).toHaveLength(1);
    });
  });

  describe("getPlanByHandle", () => {
    it("returns plan matching handle", async () => {
      jest
        .spyOn(service, "listSubscriptionPlans")
        .mockResolvedValue([{ id: "p1", handle: "basic" }]);

      const result = await service.getPlanByHandle("basic");
      expect(result).toEqual({ id: "p1", handle: "basic" });
    });

    it("returns null when no plan found", async () => {
      jest.spyOn(service, "listSubscriptionPlans").mockResolvedValue([]);

      const result = await service.getPlanByHandle("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("calculatePeriodEnd", () => {
    it("calculates daily interval", () => {
      const start = new Date("2025-01-01");
      const end = service.calculatePeriodEnd(start, "daily", 3);
      expect(end.getDate()).toBe(4);
    });

    it("calculates weekly interval", () => {
      const start = new Date("2025-01-01");
      const end = service.calculatePeriodEnd(start, "weekly", 2);
      expect(end.getDate()).toBe(15);
    });

    it("calculates monthly interval", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "monthly", 1);
      expect(end.getMonth()).toBe(1);
    });

    it("calculates quarterly interval", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "quarterly", 1);
      expect(end.getMonth()).toBe(3);
    });

    it("calculates yearly interval", () => {
      const start = new Date("2025-01-15");
      const end = service.calculatePeriodEnd(start, "yearly", 1);
      expect(end.getFullYear()).toBe(2026);
    });
  });

  describe("createSubscriptionFromPlan", () => {
    it("creates subscription with trial when startTrial is true", async () => {
      const plan = {
        id: "plan-1",
        name: "Pro",
        price: 2999,
        trial_period_days: 14,
        billing_interval: "monthly",
        billing_interval_count: 1,
        currency_code: "usd",
      };
      jest.spyOn(service, "retrieveSubscriptionPlan").mockResolvedValue(plan);
      const createSpy = jest
        .spyOn(service, "createSubscriptions")
        .mockResolvedValue({ id: "sub-1" });
      jest.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.createSubscriptionFromPlan(
        "cust-1",
        "plan-1",
        { startTrial: true },
      );

      expect(result.id).toBe("sub-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "draft" }),
      );
    });

    it("creates active subscription without trial", async () => {
      const plan = {
        id: "plan-1",
        name: "Pro",
        price: 2999,
        trial_period_days: 0,
        billing_interval: "monthly",
        billing_interval_count: 1,
        currency_code: "usd",
      };
      jest.spyOn(service, "retrieveSubscriptionPlan").mockResolvedValue(plan);
      const createSpy = jest
        .spyOn(service, "createSubscriptions")
        .mockResolvedValue({ id: "sub-1" });
      jest.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.createSubscriptionFromPlan("cust-1", "plan-1");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    it("applies discount code when provided", async () => {
      const plan = {
        id: "plan-1",
        name: "Pro",
        price: 2999,
        trial_period_days: 0,
        billing_interval: "monthly",
        billing_interval_count: 1,
        currency_code: "usd",
      };
      jest.spyOn(service, "retrieveSubscriptionPlan").mockResolvedValue(plan);
      jest
        .spyOn(service, "createSubscriptions")
        .mockResolvedValue({ id: "sub-1" });
      jest.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      const discountSpy = jest
        .spyOn(service, "applyDiscountToSubscription")
        .mockResolvedValue({});

      await service.createSubscriptionFromPlan("cust-1", "plan-1", {
        discountCode: "SAVE10",
      });

      expect(discountSpy).toHaveBeenCalledWith("sub-1", "SAVE10");
    });
  });

  describe("activateSubscription", () => {
    it("activates a draft subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "draft",
        billing_interval: "monthly",
        billing_interval_count: 1,
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({ id: "sub-1", status: "active" });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      jest
        .spyOn(service, "createBillingCycleForSubscription")
        .mockResolvedValue({});

      const result = await service.activateSubscription("sub-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
      expect(result.status).toBe("active");
    });

    it("throws when subscription is not draft", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "active" });

      await expect(service.activateSubscription("sub-1")).rejects.toThrow(
        "Only draft subscriptions can be activated",
      );
    });
  });

  describe("pauseSubscription", () => {
    it("pauses an active subscription", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "active" });
      jest.spyOn(service, "createSubscriptionPauses").mockResolvedValue({});
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({ id: "sub-1", status: "paused" });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.pauseSubscription("sub-1", "vacation");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "paused" }),
      );
    });

    it("throws when subscription is not active", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "paused" });

      await expect(service.pauseSubscription("sub-1")).rejects.toThrow(
        "Only active subscriptions can be paused",
      );
    });
  });

  describe("resumeSubscription", () => {
    it("resumes a paused subscription", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "paused" });
      jest.spyOn(service, "listSubscriptionPauses").mockResolvedValue([]);
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({ id: "sub-1", status: "active" });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.resumeSubscription("sub-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    it("throws when subscription is not paused", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "active" });

      await expect(service.resumeSubscription("sub-1")).rejects.toThrow(
        "Only paused subscriptions can be resumed",
      );
    });
  });

  describe("cancelSubscription", () => {
    it("cancels immediately when cancelImmediately is true", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
        current_period_end: new Date("2025-02-01"),
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.cancelSubscription("sub-1", {
        cancelImmediately: true,
        reason: "too expensive",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "canceled" }),
      );
    });

    it("cancels at period end by default", async () => {
      const periodEnd = new Date("2025-02-01");
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        status: "active",
        current_period_end: periodEnd,
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.cancelSubscription("sub-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active", end_date: periodEnd }),
      );
    });

    it("throws when already canceled", async () => {
      jest
        .spyOn(service, "retrieveSubscription")
        .mockResolvedValue({ id: "sub-1", status: "canceled" });

      await expect(service.cancelSubscription("sub-1")).rejects.toThrow(
        "already canceled or expired",
      );
    });
  });

  describe("processBillingCycle", () => {
    it("processes an upcoming billing cycle", async () => {
      jest.spyOn(service, "retrieveBillingCycle").mockResolvedValue({
        id: "bc-1",
        status: "upcoming",
        subscription_id: "sub-1",
        total: 2999,
      });
      jest.spyOn(service, "updateBillingCycles").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      jest.spyOn(service, "renewSubscriptionPeriod").mockResolvedValue({});

      await service.processBillingCycle("bc-1");

      expect(service.updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" }),
      );
    });

    it("throws when billing cycle is not upcoming", async () => {
      jest
        .spyOn(service, "retrieveBillingCycle")
        .mockResolvedValue({ id: "bc-1", status: "completed" });

      await expect(service.processBillingCycle("bc-1")).rejects.toThrow(
        "not in upcoming status",
      );
    });
  });

  describe("handleFailedBilling", () => {
    it("marks subscription as past_due when max retries reached", async () => {
      jest.spyOn(service, "retrieveBillingCycle").mockResolvedValue({
        id: "bc-1",
        subscription_id: "sub-1",
        attempt_count: 2,
      });
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        max_retry_attempts: 3,
      });
      jest.spyOn(service, "updateBillingCycles").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      const updateSub = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({});

      await service.handleFailedBilling("bc-1", "card declined");

      expect(updateSub).toHaveBeenCalledWith(
        expect.objectContaining({ status: "past_due" }),
      );
    });

    it("keeps billing cycle as upcoming when retries remain", async () => {
      jest.spyOn(service, "retrieveBillingCycle").mockResolvedValue({
        id: "bc-1",
        subscription_id: "sub-1",
        attempt_count: 0,
      });
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        max_retry_attempts: 3,
      });
      const updateCycle = jest
        .spyOn(service, "updateBillingCycles")
        .mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      await service.handleFailedBilling("bc-1", "card declined");

      expect(updateCycle).toHaveBeenCalledWith(
        expect.objectContaining({ status: "upcoming" }),
      );
    });
  });

  describe("renewSubscriptionPeriod", () => {
    it("renews the subscription period", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        current_period_end: new Date("2025-01-31"),
        billing_interval: "monthly",
        billing_interval_count: 1,
      });
      const updateSpy = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      jest
        .spyOn(service, "createBillingCycleForSubscription")
        .mockResolvedValue({});

      await service.renewSubscriptionPeriod("sub-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ retry_count: 0 }),
      );
    });

    it("throws when no current period end", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        current_period_end: null,
      });

      await expect(service.renewSubscriptionPeriod("sub-1")).rejects.toThrow(
        "no current period end date",
      );
    });
  });

  describe("applyDiscountToSubscription", () => {
    it("applies a percentage discount", async () => {
      jest.spyOn(service, "listSubscriptionDiscounts").mockResolvedValue([
        {
          id: "d1",
          code: "SAVE10",
          discount_type: "percentage",
          discount_value: 10,
          is_active: true,
          max_redemptions: null,
          current_redemptions: 0,
        },
      ]);
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub-1",
        subtotal: 10000,
        metadata: {},
      });
      const updateSub = jest
        .spyOn(service, "updateSubscriptions")
        .mockResolvedValue({});
      jest.spyOn(service, "updateSubscriptionDiscounts").mockResolvedValue({});

      await service.applyDiscountToSubscription("sub-1", "SAVE10");

      expect(updateSub).toHaveBeenCalledWith(
        expect.objectContaining({ total: 9000 }),
      );
    });

    it("throws when discount code is invalid", async () => {
      jest.spyOn(service, "listSubscriptionDiscounts").mockResolvedValue([]);

      await expect(
        service.applyDiscountToSubscription("sub-1", "INVALID"),
      ).rejects.toThrow("Invalid discount code");
    });

    it("throws when discount has reached max redemptions", async () => {
      jest.spyOn(service, "listSubscriptionDiscounts").mockResolvedValue([
        {
          id: "d1",
          max_redemptions: 5,
          current_redemptions: 5,
        },
      ]);

      await expect(
        service.applyDiscountToSubscription("sub-1", "CODE"),
      ).rejects.toThrow("maximum redemptions");
    });
  });

  describe("getCustomerSubscriptions", () => {
    it("returns customer subscriptions", async () => {
      jest
        .spyOn(service, "listSubscriptions")
        .mockResolvedValue([{ id: "sub-1" }, { id: "sub-2" }]);

      const result = await service.getCustomerSubscriptions("cust-1");
      expect(result).toHaveLength(2);
    });
  });

  describe("getSubscriptionsDueForBilling", () => {
    it("returns billing cycles due before date", async () => {
      const pastDate = new Date("2025-01-01");
      const futureDate = new Date("2025-03-01");
      jest.spyOn(service, "listBillingCycles").mockResolvedValue([
        { id: "bc-1", billing_date: pastDate },
        { id: "bc-2", billing_date: futureDate },
      ]);

      const result = await service.getSubscriptionsDueForBilling(
        new Date("2025-02-01"),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("bc-1");
    });
  });
});
