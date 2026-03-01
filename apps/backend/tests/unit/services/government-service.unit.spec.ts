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
        async listServiceRequests(_filter: any): Promise<any> {
          return [];
        }
        async retrieveServiceRequest(_id: string): Promise<any> {
          return null;
        }
        async createServiceRequests(_data: any): Promise<any> {
          return {};
        }
        async updateServiceRequests(_data: any): Promise<any> {
          return {};
        }
        async listPermits(_filter: any): Promise<any> {
          return [];
        }
        async retrievePermit(_id: string): Promise<any> {
          return null;
        }
        async createPermits(_data: any): Promise<any> {
          return {};
        }
        async updatePermits(_data: any): Promise<any> {
          return {};
        }
        async listMunicipalLicenses(_filter: any): Promise<any> {
          return [];
        }
        async listFines(_filter: any): Promise<any> {
          return [];
        }
        async listCitizenProfiles(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCitizenProfile(_id: string): Promise<any> {
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

import GovernmentModuleService from "../../../src/modules/government/service";

describe("GovernmentModuleService", () => {
  let service: GovernmentModuleService;

  beforeEach(() => {
    service = new GovernmentModuleService();
    jest.clearAllMocks();
  });

  describe("issuePermit", () => {
    it("issues a permit for an approved application", async () => {
      jest.spyOn(service, "retrieveServiceRequest").mockResolvedValue({
        id: "app-1",
        status: "resolved",
        citizen_id: "citizen-1",
      });
      const createPermitSpy = jest
        .spyOn(service, "createPermits")
        .mockResolvedValue({ id: "permit-1" });

      const result = await service.issuePermit("app-1", {
        permitType: "building",
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2026-01-01"),
      });

      expect(createPermitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          permit_type: "building",
          status: "active",
          citizen_id: "citizen-1",
        }),
      );
    });

    it("throws when application is not approved", async () => {
      jest.spyOn(service, "retrieveServiceRequest").mockResolvedValue({
        id: "app-1",
        status: "submitted",
      });

      await expect(
        service.issuePermit("app-1", {
          permitType: "building",
          validFrom: new Date("2025-01-01"),
          validUntil: new Date("2026-01-01"),
        }),
      ).rejects.toThrow("Permit can only be issued for approved applications");
    });

    it("throws when validFrom is after validUntil", async () => {
      jest.spyOn(service, "retrieveServiceRequest").mockResolvedValue({
        id: "app-1",
        status: "resolved",
      });

      await expect(
        service.issuePermit("app-1", {
          permitType: "building",
          validFrom: new Date("2026-06-01"),
          validUntil: new Date("2025-01-01"),
        }),
      ).rejects.toThrow("Valid-from date must be before valid-until date");
    });
  });

  describe("renewPermit", () => {
    it("renews an active permit extending by one year", async () => {
      jest.spyOn(service, "retrievePermit").mockResolvedValue({
        id: "permit-1",
        status: "active",
        valid_until: new Date("2026-06-01"),
      });
      const updatePermitSpy = jest
        .spyOn(service, "updatePermits")
        .mockResolvedValue({ id: "permit-1", status: "active" });

      await service.renewPermit("permit-1");

      expect(updatePermitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "permit-1",
          status: "active",
        }),
      );
    });

    it("renews an expired permit", async () => {
      jest.spyOn(service, "retrievePermit").mockResolvedValue({
        id: "permit-1",
        status: "expired",
        valid_until: new Date("2024-01-01"),
      });
      const updatePermitSpy = jest
        .spyOn(service, "updatePermits")
        .mockResolvedValue({ id: "permit-1" });

      await service.renewPermit("permit-1");

      expect(updatePermitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    it("throws when permit status is not active or expired", async () => {
      jest.spyOn(service, "retrievePermit").mockResolvedValue({
        id: "permit-1",
        status: "revoked",
      });

      await expect(service.renewPermit("permit-1")).rejects.toThrow(
        "Only active or expired permits can be renewed",
      );
    });
  });

  describe("getApplicationStatus", () => {
    it("builds timeline for a resolved application with permits", async () => {
      jest.spyOn(service, "retrieveServiceRequest").mockResolvedValue({
        id: "app-1",
        status: "resolved",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-15"),
      });
      jest
        .spyOn(service, "listPermits")
        .mockResolvedValue([
          { id: "permit-1", issued_at: new Date("2025-01-20") },
        ]);

      const result = await service.getApplicationStatus("app-1");

      expect(result.applicationId).toBe("app-1");
      expect(result.status).toBe("resolved");
      expect(result.permits).toHaveLength(1);
      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[0].event).toBe("submitted");
      expect(result.timeline[1].event).toBe("approved");
      expect(result.timeline[2].event).toBe("permit_issued");
    });

    it("builds timeline for a submitted application with no permits", async () => {
      jest.spyOn(service, "retrieveServiceRequest").mockResolvedValue({
        id: "app-2",
        status: "submitted",
        created_at: new Date("2025-02-01"),
      });
      jest.spyOn(service, "listPermits").mockResolvedValue([]);

      const result = await service.getApplicationStatus("app-2");

      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].event).toBe("submitted");
    });
  });
});
