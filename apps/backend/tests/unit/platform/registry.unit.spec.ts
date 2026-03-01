import {
  PLATFORM_SYSTEMS_REGISTRY,
  PLATFORM_CAPABILITIES,
  CONTEXT_HEADERS,
  HIERARCHY_LEVELS,
  DEFAULT_TENANT_SLUG,
  DEFAULT_TENANT_ID,
} from "../../../src/lib/platform/registry";

describe("registry", () => {
  describe("PLATFORM_SYSTEMS_REGISTRY", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(PLATFORM_SYSTEMS_REGISTRY)).toBe(true);
      expect(PLATFORM_SYSTEMS_REGISTRY.length).toBeGreaterThan(0);
    });

    it("each entry has required fields", () => {
      for (const system of PLATFORM_SYSTEMS_REGISTRY) {
        expect(system).toHaveProperty("id");
        expect(system).toHaveProperty("name");
        expect(system).toHaveProperty("type");
        expect(system).toHaveProperty("category");
        expect(system).toHaveProperty("status");
        expect(system).toHaveProperty("capabilities");
        expect(Array.isArray(system.capabilities)).toBe(true);
      }
    });

    it("contains expected core systems", () => {
      const ids = PLATFORM_SYSTEMS_REGISTRY.map((s) => s.id);
      expect(ids).toContain("cms-payload");
      expect(ids).toContain("commerce-medusa");
      expect(ids).toContain("infra-database");
    });

    it("has valid type values", () => {
      const validTypes = ["internal", "external", "stub"];
      for (const system of PLATFORM_SYSTEMS_REGISTRY) {
        expect(validTypes).toContain(system.type);
      }
    });

    it("has valid status values", () => {
      const validStatuses = ["active", "planned"];
      for (const system of PLATFORM_SYSTEMS_REGISTRY) {
        expect(validStatuses).toContain(system.status);
      }
    });

    it("has at least one active system", () => {
      const active = PLATFORM_SYSTEMS_REGISTRY.filter(
        (s) => s.status === "active",
      );
      expect(active.length).toBeGreaterThan(0);
    });

    it("has unique ids", () => {
      const ids = PLATFORM_SYSTEMS_REGISTRY.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("PLATFORM_CAPABILITIES", () => {
    it("has plugins section with official, community, and custom", () => {
      expect(PLATFORM_CAPABILITIES.plugins).toHaveProperty("official");
      expect(PLATFORM_CAPABILITIES.plugins).toHaveProperty("community");
      expect(PLATFORM_CAPABILITIES.plugins).toHaveProperty("custom");
      expect(Array.isArray(PLATFORM_CAPABILITIES.plugins.official)).toBe(true);
    });

    it("has features section with boolean flags", () => {
      expect(typeof PLATFORM_CAPABILITIES.features.twoFactorAuth).toBe(
        "boolean",
      );
      expect(typeof PLATFORM_CAPABILITIES.features.rbac).toBe("boolean");
      expect(typeof PLATFORM_CAPABILITIES.features.multiTenancy).toBe(
        "boolean",
      );
    });

    it("has endpoints with method and auth info", () => {
      const endpoints = PLATFORM_CAPABILITIES.endpoints;
      expect(Object.keys(endpoints).length).toBeGreaterThan(0);
      for (const endpoint of Object.values(endpoints)) {
        expect(endpoint).toHaveProperty("method");
        expect(endpoint).toHaveProperty("auth");
        expect(endpoint).toHaveProperty("purpose");
      }
    });

    it("localization config has expected locales", () => {
      const loc = PLATFORM_CAPABILITIES.features.localization;
      expect(loc.locales).toContain("en");
      expect(loc.defaultLocale).toBe("en");
    });
  });

  describe("CONTEXT_HEADERS", () => {
    it("contains correlation and tenant headers", () => {
      expect(CONTEXT_HEADERS).toContain("X-CityOS-Correlation-Id");
      expect(CONTEXT_HEADERS).toContain("X-CityOS-Tenant-Id");
    });

    it("has expected length", () => {
      expect(CONTEXT_HEADERS.length).toBe(8);
    });
  });

  describe("HIERARCHY_LEVELS", () => {
    it("contains all expected levels in order", () => {
      expect([...HIERARCHY_LEVELS]).toEqual([
        "CITY",
        "DISTRICT",
        "ZONE",
        "FACILITY",
        "ASSET",
      ]);
    });
  });

  describe("DEFAULT_TENANT constants", () => {
    it("has expected default slug", () => {
      expect(DEFAULT_TENANT_SLUG).toBe("dakkah");
    });

    it("has non-empty tenant id", () => {
      expect(DEFAULT_TENANT_ID).toBeTruthy();
      expect(typeof DEFAULT_TENANT_ID).toBe("string");
    });
  });
});
