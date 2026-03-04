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
        async listPersonas(_filter: any): Promise<any> {
          return [];
        }
        async retrievePersona(_id: string): Promise<any> {
          return null;
        }
        async createPersonas(_data: any): Promise<any> {
          return {};
        }
        async updatePersonas(_data: any): Promise<any> {
          return {};
        }
        async listPersonaAssignments(_filter: any): Promise<any> {
          return [];
        }
        async createPersonaAssignments(_data: any): Promise<any> {
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

import PersonaModuleService from "../../../src/modules/persona/service";

describe("PersonaModuleService", () => {
  let service: PersonaModuleService;

  beforeEach(() => {
    service = new PersonaModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("resolvePersona", () => {
    it("returns the highest priority persona for a user", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([
        {
          id: "a1",
          scope: "tenant-default",
          persona_id: "p1",
          priority: 0,
          status: "active",
        },
        {
          id: "a2",
          scope: "user-default",
          persona_id: "p2",
          user_id: "user-1",
          priority: 0,
          status: "active",
        },
      ]);
      jest
        .spyOn(service, "retrievePersona")
        .mockResolvedValue({ id: "p2", name: "User Persona" });

      const result = await service.resolvePersona("tenant-1", "user-1");

      expect(result).toEqual({ id: "p2", name: "User Persona" });
    });

    it("returns null when no assignments exist", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([]);

      const result = await service.resolvePersona("tenant-1", "user-1");

      expect(result).toBeNull();
    });

    it("filters out expired assignments", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([
        {
          id: "a1",
          scope: "user-default",
          persona_id: "p1",
          user_id: "user-1",
          priority: 0,
          status: "active",
          ends_at: "2020-01-01",
        },
      ]);

      const result = await service.resolvePersona("tenant-1", "user-1");

      expect(result).toBeNull();
    });

    it("session scope takes precedence over user-default", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([
        {
          id: "a1",
          scope: "user-default",
          persona_id: "p1",
          user_id: "user-1",
          priority: 0,
          status: "active",
        },
        {
          id: "a2",
          scope: "session",
          persona_id: "p2",
          scope_reference: "sess-1",
          priority: 0,
          status: "active",
        },
      ]);
      jest
        .spyOn(service, "retrievePersona")
        .mockResolvedValue({ id: "p2", name: "Session Persona" });

      const result = await service.resolvePersona("tenant-1", "user-1", {
        sessionId: "sess-1",
      });

      expect(result).toEqual({ id: "p2", name: "Session Persona" });
    });
  });

  describe("mergePersonaConstraints", () => {
    it("returns defaults when no personas provided", () => {
      const result = service.mergePersonaConstraints([]);

      expect(result).toEqual({
        kidSafe: false,
        readOnly: false,
        geoScope: "global",
        maxDataClassification: "restricted",
      });
    });

    it("merges kid_safe flag across personas", () => {
      const result = service.mergePersonaConstraints([
        { constraints: { kid_safe: false } },
        { constraints: { kid_safe: true } },
      ]);

      expect(result.kidSafe).toBe(true);
    });

    it("picks narrowest geo scope", () => {
      const result = service.mergePersonaConstraints([
        { constraints: { geo_scope: "city" } },
        { constraints: { geo_scope: "zone" } },
      ]);

      expect(result.geoScope).toBe("zone");
    });

    it("picks lowest data classification", () => {
      const result = service.mergePersonaConstraints([
        { constraints: { max_data_classification: "restricted" } },
        { constraints: { max_data_classification: "internal" } },
      ]);

      expect(result.maxDataClassification).toBe("internal");
    });
  });

  describe("assignPersona", () => {
    it("creates a persona assignment", async () => {
      const createSpy = jest
        .spyOn(service, "createPersonaAssignments")
        .mockResolvedValue({ id: "assign-1" });

      const result = await service.assignPersona({
        tenantId: "tenant-1",
        personaId: "persona-1",
        userId: "user-1",
        scope: "user-default",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "tenant-1",
          persona_id: "persona-1",
          scope: "user-default",
          status: "active",
        }),
      );
    });
  });

  describe("getPersonaCapabilities", () => {
    it("includes read and write for non-read-only persona", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p1",
        config: { permissions: ["view_dashboard"], features: ["analytics"] },
        constraints: {},
      });

      const result = await service.getPersonaCapabilities("p1");

      expect(result.capabilities).toContain("read");
      expect(result.capabilities).toContain("write");
      expect(result.capabilities).toContain("view_dashboard");
    });

    it("includes only read for read-only persona", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p1",
        config: {},
        constraints: { read_only: true },
      });

      const result = await service.getPersonaCapabilities("p1");

      expect(result.capabilities).toContain("read");
      expect(result.capabilities).not.toContain("write");
    });
  });

  describe("validatePersonaAssignment", () => {
    it("returns not eligible when user ID is missing", async () => {
      const result = await service.validatePersonaAssignment("", "p1");

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("User ID and persona ID are required");
    });

    it("returns not eligible when user already has the persona", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({ id: "p1" });
      jest
        .spyOn(service, "listPersonaAssignments")
        .mockResolvedValueOnce([{ id: "a1", status: "active" }]);

      const result = await service.validatePersonaAssignment("user-1", "p1");

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("User already has this persona assigned");
    });

    it("returns eligible for valid assignment", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({ id: "p1" });
      jest
        .spyOn(service, "listPersonaAssignments")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.validatePersonaAssignment("user-1", "p1");

      expect(result.eligible).toBe(true);
    });
  });

  describe("resolvePersonaPrecedence", () => {
    it("returns effective persona based on scope priority", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([
        {
          id: "a1",
          scope: "tenant-default",
          priority: 0,
          persona_id: "p1",
          user_id: "u1",
          status: "active",
        },
        {
          id: "a2",
          scope: "session",
          priority: 0,
          persona_id: "p2",
          user_id: "u1",
          status: "active",
          scope_reference: "sess-1",
        },
      ]);
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p2",
        name: "Session Persona",
      });

      const result = await service.resolvePersonaPrecedence("u1", "t-1");
      expect(result.effectivePersona!.id).toBe("p2");
      expect(result.precedenceOrder[0].scope).toBe("session");
    });

    it("returns null effective persona when no assignments exist", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([]);

      const result = await service.resolvePersonaPrecedence("u1", "t-1");
      expect(result.effectivePersona).toBeNull();
      expect(result.precedenceOrder).toHaveLength(0);
    });

    it("filters expired assignments", async () => {
      vi.spyOn(service, "listPersonaAssignments").mockResolvedValue([
        {
          id: "a1",
          scope: "user-default",
          priority: 0,
          persona_id: "p1",
          user_id: "u1",
          status: "active",
          ends_at: new Date("2020-01-01").toISOString(),
        },
      ]);

      const result = await service.resolvePersonaPrecedence("u1", "t-1");
      expect(result.effectivePersona).toBeNull();
    });
  });

  describe("getPersonaRecommendations", () => {
    it("returns recommendations based on persona preferences", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p1",
        name: "Shopper",
        config: { preferences: { electronics: 0.9, books: 0.7 } },
        constraints: {},
      });

      const result = await service.getPersonaRecommendations("p1");
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
      expect(result.recommendations[0].score).toBeGreaterThanOrEqual(
        result.recommendations[1].score,
      );
    });

    it("adds kid-safe recommendation for kid-safe persona", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p1",
        name: "Child",
        config: {},
        constraints: { kid_safe: true },
      });

      const result = await service.getPersonaRecommendations("p1");
      const kidSafe = result.recommendations.find(
        (r) => r.category === "family_friendly",
      );
      expect(kidSafe).toBeDefined();
      expect(kidSafe!.score).toBe(1.0);
    });

    it("adds local content recommendation for geo-scoped persona", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue({
        id: "p1",
        name: "Local",
        config: {},
        constraints: { geo_scope: "city" },
      });

      const result = await service.getPersonaRecommendations("p1");
      const local = result.recommendations.find((r) => r.category === "local");
      expect(local).toBeDefined();
    });
  });

  describe("mergePersonaProfiles", () => {
    it("merges two persona profiles and returns merged constraints", async () => {
      jest
        .spyOn(service, "retrievePersona")
        .mockResolvedValueOnce({
          id: "p1",
          name: "Primary",
          config: { features: ["search"], level: 3 },
          constraints: { kid_safe: false, read_only: false, geo_scope: "city" },
          metadata: {},
        })
        .mockResolvedValueOnce({
          id: "p2",
          name: "Secondary",
          config: { features: ["filter"], level: 5 },
          constraints: {
            kid_safe: true,
            read_only: false,
            geo_scope: "global",
          },
          metadata: {},
        });
      vi.spyOn(service, "updatePersonas").mockResolvedValue({ id: "p1" });

      const result = await service.mergePersonaProfiles("p1", "p2");
      expect(result.mergedConstraints.kidSafe).toBe(true);
      expect(result.mergedConstraints.geoScope).toBe("city");
      expect(result.primaryId).toBe("p1");
    });

    it("throws when primary persona not found", async () => {
      vi.spyOn(service, "retrievePersona").mockResolvedValue(null);

      await expect(service.mergePersonaProfiles("p1", "p2")).rejects.toThrow(
        "Primary persona p1 not found",
      );
    });
  });
});
