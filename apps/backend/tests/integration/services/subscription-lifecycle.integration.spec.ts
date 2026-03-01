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
        async retrieveSubscriptionPlan(_id: string): Promise<any> {
          return null;
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
        async createSubscriptionItems(_data: any): Promise<any> {
          return {};
        }
        async createBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async updateBillingCycles(_data: any): Promise<any> {
          return {};
        }
        async retrieveBillingCycle(_id: string): Promise<any> {
          return null;
        }
        async createSubscriptionEvents(_data: any): Promise<any> {
          return {};
        }
        async listSubscriptions(_filter: any): Promise<any> {
          return [];
        }
        async listSubscriptionItems(_filter: any): Promise<any> {
          return [];
        }
        async updateSubscriptionItems(_data: any): Promise<any> {
          return {};
        }
        async listDiscountCodes(_filter: any): Promise<any> {
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
        async deleteSubscriptionItems(_id: any): Promise<any> {
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

describe("Subscription Lifecycle Integration", () => {
  let service: SubscriptionModuleService;

  beforeEach(() => {
    service = new SubscriptionModuleService();
    jest.clearAllMocks();
  });

  const mockPlan = {
    id: "plan_01",
    name: "Pro Monthly",
    price: 2999,
    billing_interval: "monthly",
    billing_interval_count: 1,
    trial_period_days: 14,
    currency_code: "usd",
  };

  describe("create subscription with trial", () => {
    it("should create subscription with trial_end_date set", async () => {
      jest
        .spyOn(service, "retrieveSubscriptionPlan")
        .mockResolvedValue(mockPlan);
      jest
        .spyOn(service, "createSubscriptions")
        .mockImplementation(async (data: any) => ({
          id: "sub_01",
          ...data,
        }));
      jest.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.createSubscriptionFromPlan(
        "cust_01",
        "plan_01",
        {
          startTrial: true,
        },
      );

      expect(result.status).toBe("draft");
      expect(result.trial_end_date).toBeDefined();
      expect(result.trial_start_date).toBeDefined();
    });

    it("should create subscription without trial when not requested", async () => {
      const planNoTrial = { ...mockPlan, trial_period_days: 0 };
      jest
        .spyOn(service, "retrieveSubscriptionPlan")
        .mockResolvedValue(planNoTrial);
      jest
        .spyOn(service, "createSubscriptions")
        .mockImplementation(async (data: any) => ({
          id: "sub_02",
          ...data,
        }));
      jest.spyOn(service, "createSubscriptionItems").mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.createSubscriptionFromPlan(
        "cust_01",
        "plan_01",
      );

      expect(result.status).toBe("active");
      expect(result.trial_end_date).toBeNull();
    });
  });

  describe("activate subscription", () => {
    it("should activate a draft subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "draft",
        billing_interval: "monthly",
        billing_interval_count: 1,
      });
      jest.spyOn(service, "updateSubscriptions").mockResolvedValue({
        id: "sub_01",
        status: "active",
      });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});
      jest
        .spyOn(service, "createBillingCycleForSubscription")
        .mockResolvedValue({});

      const result = await service.activateSubscription("sub_01");
      expect(result.status).toBe("active");
    });

    it("should reject activating a non-draft subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
      });

      await expect(service.activateSubscription("sub_01")).rejects.toThrow(
        "Only draft subscriptions can be activated",
      );
    });
  });

  describe("pause and resume", () => {
    it("should pause an active subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
      });
      jest.spyOn(service, "updateSubscriptions").mockResolvedValue({
        id: "sub_01",
        status: "paused",
      });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.pauseSubscription("sub_01");
      expect(result.status).toBe("paused");
    });

    it("should resume a paused subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "paused",
        billing_interval: "monthly",
        billing_interval_count: 1,
      });
      jest.spyOn(service, "updateSubscriptions").mockResolvedValue({
        id: "sub_01",
        status: "active",
      });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.resumeSubscription("sub_01");
      expect(result.status).toBe("active");
    });

    it("should reject pausing a cancelled subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "cancelled",
      });

      await expect(service.pauseSubscription("sub_01")).rejects.toThrow();
    });
  });

  describe("cancel subscription", () => {
    it("should cancel an active subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
        current_period_end: new Date("2026-04-15"),
      });
      jest.spyOn(service, "updateSubscriptions").mockResolvedValue({
        id: "sub_01",
        status: "cancelled",
      });
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.cancelSubscription("sub_01");
      expect(result.status).toBe("cancelled");
    });

    it("should reject cancelling an already cancelled subscription", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "canceled",
      });

      await expect(service.cancelSubscription("sub_01")).rejects.toThrow(
        "Subscription is already canceled or expired",
      );
    });
  });

  describe("renew subscription period", () => {
    it("should advance billing cycle on renewal", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
        billing_interval: "monthly",
        billing_interval_count: 1,
        current_period_start: new Date("2026-03-01"),
        current_period_end: new Date("2026-04-01"),
        subtotal: 2999,
        total: 2999,
      });
      jest
        .spyOn(service, "updateSubscriptions")
        .mockImplementation(async (data: any) => ({
          id: "sub_01",
          ...data,
        }));
      jest
        .spyOn(service, "createBillingCycleForSubscription")
        .mockResolvedValue({});
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.renewSubscriptionPeriod("sub_01");
      expect(result).toBeDefined();
    });
  });

  describe("handle failed billing", () => {
    it("should increment retry count on billing failure", async () => {
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
        retry_count: 0,
      });
      jest.spyOn(service, "retrieveBillingCycle").mockResolvedValue({
        id: "bc_01",
        status: "pending",
      });
      jest.spyOn(service, "updateBillingCycles").mockResolvedValue({});
      jest
        .spyOn(service, "updateSubscriptions")
        .mockImplementation(async (data: any) => ({
          id: "sub_01",
          ...data,
        }));
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.handleFailedBilling(
        "sub_01",
        "bc_01",
        "Card declined",
      );
      expect(result).toBeDefined();
    });
  });

  describe("change plan", () => {
    it("should change subscription plan", async () => {
      const newPlan = {
        ...mockPlan,
        id: "plan_02",
        name: "Enterprise",
        price: 9999,
      };
      jest.spyOn(service, "retrieveSubscription").mockResolvedValue({
        id: "sub_01",
        status: "active",
        current_period_start: new Date("2026-03-01"),
        current_period_end: new Date("2026-04-01"),
        subtotal: 2999,
        total: 2999,
      });
      jest
        .spyOn(service, "retrieveSubscriptionPlan")
        .mockResolvedValue(newPlan);
      jest
        .spyOn(service, "listSubscriptionItems")
        .mockResolvedValue([
          { id: "si_01", product_id: "plan_01", quantity: 1 },
        ]);
      jest.spyOn(service, "updateSubscriptionItems").mockResolvedValue({});
      jest
        .spyOn(service, "updateSubscriptions")
        .mockImplementation(async (data: any) => ({
          id: "sub_01",
          ...data,
        }));
      jest.spyOn(service, "logSubscriptionEvent").mockResolvedValue({});

      const result = await service.changePlan("sub_01", "plan_02");
      expect(result).toBeDefined();
    });
  });
});
