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
        async listMemberships(_filter: any): Promise<any> {
          return [];
        }
        async retrieveMembership(_id: string): Promise<any> {
          return null;
        }
        async createMemberships(_data: any): Promise<any> {
          return {};
        }
        async updateMemberships(_data: any): Promise<any> {
          return {};
        }
        async retrieveMembershipTier(_id: string): Promise<any> {
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

import MembershipModuleService from "../../../src/modules/membership/service";

describe("MembershipModuleService", () => {
  let service: MembershipModuleService;

  beforeEach(() => {
    service = new MembershipModuleService();
    jest.clearAllMocks();
  });

  describe("enrollMember", () => {
    it("enrolls a customer in a membership tier", async () => {
      jest.spyOn(service, "listMemberships").mockResolvedValue([]);
      jest
        .spyOn(service, "retrieveMembershipTier")
        .mockResolvedValue({ id: "tier-1", name: "Gold" });
      const createSpy = jest
        .spyOn(service, "createMemberships")
        .mockResolvedValue({ id: "mem-1" });

      const result = await service.enrollMember("cust-1", "tier-1", "t1");

      expect(result).toEqual({ id: "mem-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          tier_id: "tier-1",
          tenant_id: "t1",
          status: "active",
          auto_renew: true,
        }),
      );
    });

    it("throws when customer already has active membership", async () => {
      jest
        .spyOn(service, "listMemberships")
        .mockResolvedValue([{ id: "mem-1", status: "active" }]);

      await expect(
        service.enrollMember("cust-1", "tier-1", "t1"),
      ).rejects.toThrow("Customer already has an active membership");
    });

    it("throws when customer ID is missing", async () => {
      await expect(service.enrollMember("", "tier-1", "t1")).rejects.toThrow(
        "Customer ID and tier ID are required",
      );
    });

    it("throws when tier ID is missing", async () => {
      await expect(service.enrollMember("cust-1", "", "t1")).rejects.toThrow(
        "Customer ID and tier ID are required",
      );
    });
  });

  describe("cancelMembership", () => {
    it("cancels an active membership", async () => {
      jest
        .spyOn(service, "retrieveMembership")
        .mockResolvedValue({ id: "mem-1", status: "active" });
      const updateSpy = jest
        .spyOn(service, "updateMemberships")
        .mockResolvedValue({});

      await service.cancelMembership("mem-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mem-1",
          status: "cancelled",
          auto_renew: false,
        }),
      );
    });

    it("throws when membership is not active", async () => {
      jest
        .spyOn(service, "retrieveMembership")
        .mockResolvedValue({ id: "mem-1", status: "cancelled" });

      await expect(service.cancelMembership("mem-1")).rejects.toThrow(
        "Only active memberships can be cancelled",
      );
    });
  });

  describe("checkAccess", () => {
    it("returns true when tier includes the feature", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "active",
        tier_id: "tier-1",
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });
      jest.spyOn(service, "retrieveMembershipTier").mockResolvedValue({
        id: "tier-1",
        benefits: ["free_shipping", "priority_support"],
      });

      const result = await service.checkAccess("mem-1", "free_shipping");
      expect(result).toBe(true);
    });

    it("returns true when tier has 'all' benefit", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "active",
        tier_id: "tier-1",
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });
      jest.spyOn(service, "retrieveMembershipTier").mockResolvedValue({
        id: "tier-1",
        benefits: ["all"],
      });

      const result = await service.checkAccess("mem-1", "any_feature");
      expect(result).toBe(true);
    });

    it("returns false when membership is not active", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "cancelled",
        tier_id: "tier-1",
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });

      const result = await service.checkAccess("mem-1", "free_shipping");
      expect(result).toBe(false);
    });

    it("returns false when membership is expired", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "active",
        tier_id: "tier-1",
        expires_at: "2020-01-01",
      });

      const result = await service.checkAccess("mem-1", "free_shipping");
      expect(result).toBe(false);
    });
  });

  describe("renewMembership", () => {
    it("renews an active membership", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "active",
        expires_at: futureDate.toISOString(),
      });
      const updateSpy = jest
        .spyOn(service, "updateMemberships")
        .mockResolvedValue({});

      await service.renewMembership("mem-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mem-1",
          status: "active",
        }),
      );
    });

    it("renews an expired membership", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "expired",
        expires_at: "2020-01-01",
      });
      const updateSpy = jest
        .spyOn(service, "updateMemberships")
        .mockResolvedValue({});

      await service.renewMembership("mem-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mem-1",
          status: "active",
        }),
      );
    });

    it("throws when membership status prevents renewal", async () => {
      jest.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "cancelled",
        expires_at: "2020-01-01",
      });

      await expect(service.renewMembership("mem-1")).rejects.toThrow(
        "Membership cannot be renewed from current status",
      );
    });
  });
});
