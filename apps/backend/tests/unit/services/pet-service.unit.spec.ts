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
        async listPetProfiles(_filter: any): Promise<any> {
          return [];
        }
        async retrievePetProfile(_id: string): Promise<any> {
          return null;
        }
        async createPetProfiles(_data: any): Promise<any> {
          return {};
        }
        async updatePetProfiles(_data: any): Promise<any> {
          return {};
        }
        async listGroomingBookings(_filter: any): Promise<any> {
          return [];
        }
        async createGroomingBookings(_data: any): Promise<any> {
          return {};
        }
        async listVetAppointments(_filter: any): Promise<any> {
          return [];
        }
        async createVetAppointments(_data: any): Promise<any> {
          return {};
        }
        async listPetProducts(_filter: any): Promise<any> {
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

import PetServiceModuleService from "../../../src/modules/pet-service/service";

describe("PetServiceModuleService", () => {
  let service: PetServiceModuleService;

  beforeEach(() => {
    service = new PetServiceModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("addPetProfile", () => {
    it("creates a pet profile successfully", async () => {
      const createSpy = jest
        .spyOn(service, "createPetProfiles")
        .mockResolvedValue({ id: "pet-1", name: "Buddy" });

      const result = await service.addPetProfile("owner-1", {
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
      });

      expect(result.id).toBe("pet-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ species: "dog", status: "active" }),
      );
    });

    it("throws when name or species is missing", async () => {
      await expect(
        service.addPetProfile("owner-1", { name: "", species: "dog" }),
      ).rejects.toThrow("Pet name and species are required");
    });

    it("throws when species is invalid", async () => {
      await expect(
        service.addPetProfile("owner-1", { name: "Rex", species: "dinosaur" }),
      ).rejects.toThrow("Invalid species");
    });
  });

  describe("getServiceHistory", () => {
    it("returns sorted service history", async () => {
      jest
        .spyOn(service, "retrievePetProfile")
        .mockResolvedValue({ id: "pet-1" });
      vi.spyOn(service, "listGroomingBookings").mockResolvedValue([
        { id: "g1", scheduled_date: "2025-01-01" },
        { id: "g2", scheduled_date: "2025-02-01" },
      ]);
      jest
        .spyOn(service, "listVetAppointments")
        .mockResolvedValue([{ id: "v1", appointment_date: "2025-01-15" }]);

      const result = await service.getServiceHistory("pet-1");

      expect(result.totalServices).toBe(3);
      expect(result.groomings[0].id).toBe("g2");
    });
  });

  describe("calculateServiceCost", () => {
    it("calculates grooming cost for large dog", async () => {
      const result = await service.calculateServiceCost(
        "grooming",
        "large",
        60,
      );

      expect(result.basePrice).toBe(40);
      expect(result.sizeMultiplier).toBe(1.6);
      expect(result.totalCost).toBe(64);
    });

    it("applies duration multiplier for longer sessions", async () => {
      const result = await service.calculateServiceCost(
        "bathing",
        "small",
        120,
      );

      expect(result.basePrice).toBe(25);
      expect(result.durationMultiplier).toBe(2);
      expect(result.totalCost).toBe(50);
    });

    it("uses default values for unknown service and size", async () => {
      const result = await service.calculateServiceCost(
        "unknown_service",
        "unknown_size",
        60,
      );

      expect(result.basePrice).toBe(30);
      expect(result.sizeMultiplier).toBe(1.0);
      expect(result.totalCost).toBe(30);
    });
  });
});
