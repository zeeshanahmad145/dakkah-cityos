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
        async listTenants(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTenant(_id: string): Promise<any> {
          return null;
        }
        async createTenants(_data: any): Promise<any> {
          return {};
        }
        async updateTenants(_data: any): Promise<any> {
          return {};
        }
        async listTenantBillings(_filter: any): Promise<any> {
          return [];
        }
        async createTenantBillings(_data: any): Promise<any> {
          return {};
        }
        async updateTenantBillings(_data: any): Promise<any> {
          return {};
        }
        async listTenantUsageRecords(_filter: any): Promise<any> {
          return [];
        }
        async createTenantUsageRecords(_data: any): Promise<any> {
          return {};
        }
        async createTenantInvoices(_data: any): Promise<any> {
          return {};
        }
        async listTenantSettings(_filter: any): Promise<any> {
          return [];
        }
        async createTenantSettings(_data: any): Promise<any> {
          return {};
        }
        async updateTenantSettingss(_data: any): Promise<any> {
          return {};
        }
        async listTenantUsers(_filter: any): Promise<any> {
          return [];
        }
        async createTenantUsers(_data: any): Promise<any> {
          return {};
        }
        async updateTenantUsers(_data: any): Promise<any> {
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

import TenantModuleService from "../../../src/modules/tenant/service";

describe("TenantModuleService", () => {
  let service: TenantModuleService;

  beforeEach(() => {
    service = new TenantModuleService();
    jest.clearAllMocks();
  });

  describe("retrieveTenantBySlug", () => {
    it("returns tenant matching slug", async () => {
      jest
        .spyOn(service, "listTenants")
        .mockResolvedValue([{ id: "t1", slug: "my-store", status: "active" }]);

      const result = await service.retrieveTenantBySlug("my-store");
      expect(result).toEqual({ id: "t1", slug: "my-store", status: "active" });
    });

    it("returns null when no tenant found", async () => {
      jest.spyOn(service, "listTenants").mockResolvedValue([]);

      const result = await service.retrieveTenantBySlug("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("retrieveTenantByDomain", () => {
    it("returns tenant matching domain", async () => {
      jest
        .spyOn(service, "listTenants")
        .mockResolvedValue([
          { id: "t1", domain: "store.com", status: "active" },
        ]);

      const result = await service.retrieveTenantByDomain("store.com");
      expect(result).toEqual({
        id: "t1",
        domain: "store.com",
        status: "active",
      });
    });

    it("returns null when no tenant found", async () => {
      jest.spyOn(service, "listTenants").mockResolvedValue([]);

      const result = await service.retrieveTenantByDomain("unknown.com");
      expect(result).toBeNull();
    });
  });

  describe("retrieveTenantByHandle", () => {
    it("returns tenant matching handle", async () => {
      jest
        .spyOn(service, "listTenants")
        .mockResolvedValue([
          { id: "t1", handle: "my-handle", status: "active" },
        ]);

      const result = await service.retrieveTenantByHandle("my-handle");
      expect(result).toEqual({
        id: "t1",
        handle: "my-handle",
        status: "active",
      });
    });
  });

  describe("resolveTenant", () => {
    it("resolves by slug first", async () => {
      jest
        .spyOn(service, "retrieveTenantBySlug")
        .mockResolvedValue({ id: "t1" });

      const result = await service.resolveTenant({
        slug: "test",
        domain: "test.com",
      });
      expect(result).toEqual({ id: "t1" });
    });

    it("falls back to domain when slug not found", async () => {
      jest.spyOn(service, "retrieveTenantBySlug").mockResolvedValue(null);
      jest
        .spyOn(service, "retrieveTenantByDomain")
        .mockResolvedValue({ id: "t2" });

      const result = await service.resolveTenant({
        slug: "missing",
        domain: "test.com",
      });
      expect(result).toEqual({ id: "t2" });
    });

    it("falls back to handle when slug and domain not found", async () => {
      jest.spyOn(service, "retrieveTenantBySlug").mockResolvedValue(null);
      jest.spyOn(service, "retrieveTenantByDomain").mockResolvedValue(null);
      jest
        .spyOn(service, "retrieveTenantByHandle")
        .mockResolvedValue({ id: "t3" });

      const result = await service.resolveTenant({
        slug: "x",
        domain: "x.com",
        handle: "my-handle",
      });
      expect(result).toEqual({ id: "t3" });
    });

    it("returns null when no match found", async () => {
      const result = await service.resolveTenant({});
      expect(result).toBeNull();
    });
  });

  describe("getTenantWithGovernance", () => {
    it("returns tenant with governance fields", async () => {
      jest.spyOn(service, "retrieveTenant").mockResolvedValue({
        id: "t1",
        name: "Test",
        country_id: "SA",
        governance_authority_id: "gov-1",
        residency_zone: "MENA",
      });

      const result = await service.getTenantWithGovernance("t1");
      expect(result.governance).toEqual({
        country_id: "SA",
        governance_authority_id: "gov-1",
        residency_zone: "MENA",
      });
    });

    it("returns null when tenant not found", async () => {
      jest.spyOn(service, "retrieveTenant").mockResolvedValue(null);

      const result = await service.getTenantWithGovernance("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("activateTenant", () => {
    it("sets tenant status to active", async () => {
      const spy = jest.spyOn(service, "updateTenants").mockResolvedValue({});

      await service.activateTenant("t1");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "t1",
          status: "active",
          trial_ends_at: null,
        }),
      );
    });
  });

  describe("suspendTenant", () => {
    it("suspends tenant with reason", async () => {
      const spy = jest.spyOn(service, "updateTenants").mockResolvedValue({});

      await service.suspendTenant("t1", "Non-payment");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "suspended",
          metadata: { suspension_reason: "Non-payment" },
        }),
      );
    });
  });

  describe("createTenantWithSetup", () => {
    it("creates tenant with settings, billing, and admin user", async () => {
      const createTenantSpy = jest
        .spyOn(service, "createTenants")
        .mockResolvedValue({ id: "t1" });
      const createSettingsSpy = jest
        .spyOn(service, "createTenantSettings")
        .mockResolvedValue({});
      const createBillingSpy = jest
        .spyOn(service, "createTenantBillings")
        .mockResolvedValue({});
      const createUserSpy = jest
        .spyOn(service, "createTenantUsers")
        .mockResolvedValue({});

      const result = await service.createTenantWithSetup({
        name: "New Store",
        handle: "new-store",
        slug: "new-store",
        email: "admin@store.com",
        ownerId: "user-1",
        trialDays: 30,
      });

      expect(result.id).toBe("t1");
      expect(createTenantSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Store",
          status: "trial",
        }),
      );
      expect(createSettingsSpy).toHaveBeenCalled();
      expect(createBillingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_status: "trialing",
        }),
      );
      expect(createUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          role: "tenant-admin",
          role_level: 90,
        }),
      );
    });

    it("uses default values when optional fields are not provided", async () => {
      const createSpy = jest
        .spyOn(service, "createTenants")
        .mockResolvedValue({ id: "t1" });
      jest.spyOn(service, "createTenantSettings").mockResolvedValue({});
      jest.spyOn(service, "createTenantBillings").mockResolvedValue({});
      jest.spyOn(service, "createTenantUsers").mockResolvedValue({});

      await service.createTenantWithSetup({
        name: "Store",
        handle: "store",
        slug: "store",
        email: "a@b.com",
        ownerId: "u1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: "basic",
          default_locale: "en",
          timezone: "UTC",
          default_currency: "usd",
        }),
      );
    });
  });

  describe("getTenantBilling", () => {
    it("returns billing record", async () => {
      jest
        .spyOn(service, "listTenantBillings")
        .mockResolvedValue([{ id: "b1" }]);

      const result = await service.getTenantBilling("t1");
      expect(result).toEqual({ id: "b1" });
    });

    it("returns null when no billing", async () => {
      jest.spyOn(service, "listTenantBillings").mockResolvedValue([]);

      const result = await service.getTenantBilling("t1");
      expect(result).toBeNull();
    });
  });

  describe("updateSubscription", () => {
    it("updates billing with new plan", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue({ id: "b1" });
      const spy = jest
        .spyOn(service, "updateTenantBillings")
        .mockResolvedValue({});

      await service.updateSubscription(
        "t1",
        "plan-1",
        "Pro Plan",
        "monthly",
        4999,
      );

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: "plan-1",
          plan_name: "Pro Plan",
          subscription_status: "active",
          base_price: 4999,
        }),
      );
    });

    it("throws when billing not found", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue(null);

      await expect(
        service.updateSubscription("t1", "plan-1", "Pro", "monthly", 100),
      ).rejects.toThrow("Billing not found");
    });
  });

  describe("recordUsage", () => {
    it("records usage and updates billing totals", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue({
        id: "b1",
        usage_price_per_unit: 5,
        current_usage: 10,
        current_usage_cost: 50,
        current_period_start: new Date(),
        current_period_end: new Date(),
      });
      const createSpy = jest
        .spyOn(service, "createTenantUsageRecords")
        .mockResolvedValue({ id: "ur-1" });
      const updateSpy = jest
        .spyOn(service, "updateTenantBillings")
        .mockResolvedValue({});

      await service.recordUsage("t1", "api_calls", 100);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 100,
          total_cost: 500,
        }),
      );
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          current_usage: 110,
          current_usage_cost: 550,
        }),
      );
    });

    it("throws when billing not found", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue(null);

      await expect(service.recordUsage("t1", "api_calls", 100)).rejects.toThrow(
        "Billing not found",
      );
    });
  });

  describe("getUsageSummary", () => {
    it("returns summarized usage by type", async () => {
      jest.spyOn(service, "listTenantUsageRecords").mockResolvedValue([
        {
          usage_type: "api_calls",
          quantity: 50,
          total_cost: 250,
          recorded_at: "2025-01-15",
        },
        {
          usage_type: "api_calls",
          quantity: 30,
          total_cost: 150,
          recorded_at: "2025-01-20",
        },
        {
          usage_type: "storage",
          quantity: 10,
          total_cost: 100,
          recorded_at: "2025-01-10",
        },
      ]);

      const result = await service.getUsageSummary(
        "t1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result.api_calls).toEqual({ quantity: 80, cost: 400 });
      expect(result.storage).toEqual({ quantity: 10, cost: 100 });
    });

    it("returns empty summary when no records", async () => {
      jest.spyOn(service, "listTenantUsageRecords").mockResolvedValue([]);

      const result = await service.getUsageSummary(
        "t1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );
      expect(result).toEqual({});
    });
  });

  describe("generateInvoice", () => {
    it("generates invoice with base price and usage", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue({
        id: "b1",
        base_price: 5000,
        plan_name: "Pro",
        plan_type: "monthly",
        usage_price_per_unit: 5,
        currency_code: "usd",
        current_period_start: new Date("2025-01-01"),
        current_period_end: new Date("2025-01-31"),
      });
      jest
        .spyOn(service, "retrieveTenant")
        .mockResolvedValue({ id: "t1", handle: "mystore" });
      jest.spyOn(service, "getUsageSummary").mockResolvedValue({
        api_calls: { quantity: 100, cost: 500 },
      });
      const createSpy = jest
        .spyOn(service, "createTenantInvoices")
        .mockResolvedValue({ id: "inv-1" });

      await service.generateInvoice("t1");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t1",
          base_amount: 5000,
          usage_amount: 500,
          total_amount: 5500,
          status: "open",
        }),
      );
    });

    it("throws when billing not found", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue(null);

      await expect(service.generateInvoice("t1")).rejects.toThrow(
        "Billing not found",
      );
    });
  });

  describe("hasPermission", () => {
    it("returns true for super-admin", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([
        {
          role: "super-admin",
          permissions: {},
        },
      ]);

      const result = await service.hasPermission("t1", "u1", "orders", "read");
      expect(result).toBe(true);
    });

    it("returns true for tenant-admin on non-transfer actions", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([
        {
          role: "tenant-admin",
          permissions: {},
        },
      ]);

      const result = await service.hasPermission("t1", "u1", "orders", "write");
      expect(result).toBe(true);
    });

    it("returns false for tenant-admin on transfer_ownership", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([
        {
          role: "tenant-admin",
          permissions: {},
        },
      ]);

      const result = await service.hasPermission(
        "t1",
        "u1",
        "settings",
        "transfer_ownership",
      );
      expect(result).toBe(false);
    });

    it("returns false when user not found", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([]);

      const result = await service.hasPermission("t1", "u1", "orders", "read");
      expect(result).toBe(false);
    });

    it("returns true when user has specific permission", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([
        {
          role: "viewer",
          permissions: { orders: ["read"] },
        },
      ]);

      const result = await service.hasPermission("t1", "u1", "orders", "read");
      expect(result).toBe(true);
    });

    it("returns true when user has wildcard permission", async () => {
      jest.spyOn(service, "listTenantUsers").mockResolvedValue([
        {
          role: "viewer",
          permissions: { orders: ["*"] },
        },
      ]);

      const result = await service.hasPermission(
        "t1",
        "u1",
        "orders",
        "delete",
      );
      expect(result).toBe(true);
    });
  });

  describe("checkTenantLimits", () => {
    it("returns within limits when billing not found", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue(null);

      const result = await service.checkTenantLimits("t1");
      expect(result.withinLimits).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("reports order limit violation", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue({
        max_orders_per_month: 100,
        current_usage: 150,
      });

      const result = await service.checkTenantLimits("t1");
      expect(result.withinLimits).toBe(false);
      expect(result.violations).toContain("max_orders_per_month");
    });

    it("reports team member limit violation", async () => {
      jest.spyOn(service, "getTenantBilling").mockResolvedValue({
        max_team_members: 5,
        current_usage: 0,
      });
      jest
        .spyOn(service, "getTenantTeam")
        .mockResolvedValue([{}, {}, {}, {}, {}, {}]);

      const result = await service.checkTenantLimits("t1");
      expect(result.violations).toContain("max_team_members");
    });
  });
});
