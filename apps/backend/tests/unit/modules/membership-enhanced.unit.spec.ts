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
    Module: (_config: any) => ({}),
  };
});

import MembershipModuleService from "../../../src/modules/membership/service";

describe("MembershipModuleService – Enhanced", () => {
  let service: MembershipModuleService;

  beforeEach(() => {
    service = new MembershipModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("enrollMember", () => {
    it("enrolls a customer in a membership successfully", async () => {
      vi.spyOn(service, "listMemberships").mockResolvedValue([]);
      jest
        .spyOn(service, "retrieveMembershipTier")
        .mockResolvedValue({ id: "tier-1" });
      const createSpy = jest
        .spyOn(service, "createMemberships")
        .mockResolvedValue({ id: "mem-1" });

      const result = await service.enrollMember("cust-1", "tier-1", "tenant-1");

      expect(result).toEqual({ id: "mem-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          status: "active",
          auto_renew: true,
        }),
      );
    });

    it("throws when customer already has active membership", async () => {
      jest
        .spyOn(service, "listMemberships")
        .mockResolvedValue([{ id: "mem-existing" }]);

      await expect(
        service.enrollMember("cust-1", "tier-1", "tenant-1"),
      ).rejects.toThrow("Customer already has an active membership");
    });

    it("throws when customer ID is missing", async () => {
      await expect(
        service.enrollMember("", "tier-1", "tenant-1"),
      ).rejects.toThrow("Customer ID and tier ID are required");
    });

    it("throws when tier ID is missing", async () => {
      await expect(
        service.enrollMember("cust-1", "", "tenant-1"),
      ).rejects.toThrow("Customer ID and tier ID are required");
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
        expect.objectContaining({ status: "cancelled", auto_renew: false }),
      );
    });

    it("throws when membership is not active", async () => {
      jest
        .spyOn(service, "retrieveMembership")
        .mockResolvedValue({ id: "mem-1", status: "expired" });

      await expect(service.cancelMembership("mem-1")).rejects.toThrow(
        "Only active memberships can be cancelled",
      );
    });
  });

  describe("renewMembership", () => {
    it("renews an active membership extending end date", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      vi.spyOn(service, "retrieveMembership").mockResolvedValue({
        id: "mem-1",
        status: "active",
        expires_at: futureDate.toISOString(),
      });
      const updateSpy = jest
        .spyOn(service, "updateMemberships")
        .mockResolvedValue({});

      await service.renewMembership("mem-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    it("throws when membership status is cancelled", async () => {
      jest
        .spyOn(service, "retrieveMembership")
        .mockResolvedValue({ id: "mem-1", status: "cancelled" });

      await expect(service.renewMembership("mem-1")).rejects.toThrow(
        "Membership cannot be renewed from current status",
      );
    });
  });
});
