import { vi } from "vitest";
vi.mock("../../../src/lib/platform/registry", () => ({
  PLATFORM_SYSTEMS_REGISTRY: [
    { id: "sys-1", name: "System 1", type: "internal", status: "active" },
    { id: "sys-2", name: "System 2", type: "external", status: "active" },
    { id: "sys-3", name: "System 3", type: "internal", status: "planned" },
  ],
}))

import {
  buildNodeHierarchy,
  buildGovernanceChain,
  formatTenantResponse,
  getSystemsSummary,
} from "../../../src/lib/platform/helpers"

describe("helpers", () => {
  describe("buildNodeHierarchy", () => {
    it("returns empty array for empty input", () => {
      expect(buildNodeHierarchy([])).toEqual([])
    })

    it("builds flat list when no parents", () => {
      const nodes = [
        { id: "1", name: "City", type: "CITY", slug: "city", status: "active" },
        { id: "2", name: "District", type: "DISTRICT", slug: "district", status: "active" },
      ]
      const result = buildNodeHierarchy(nodes)
      expect(result).toHaveLength(2)
      expect(result[0].children).toEqual([])
      expect(result[1].children).toEqual([])
    })

    it("nests children under parent nodes", () => {
      const nodes = [
        { id: "1", name: "City", type: "CITY", slug: "city" },
        { id: "2", name: "District", type: "DISTRICT", slug: "district", parent_id: "1" },
      ]
      const result = buildNodeHierarchy(nodes)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("1")
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].id).toBe("2")
    })

    it("treats node with missing parent_id in map as root", () => {
      const nodes = [
        { id: "1", name: "Orphan", type: "ZONE", slug: "orphan", parent_id: "nonexistent" },
      ]
      const result = buildNodeHierarchy(nodes)
      expect(result).toHaveLength(1)
      expect(result[0].parent).toBe("nonexistent")
    })

    it("maps location to coordinates and code defaults to null", () => {
      const nodes = [
        { id: "1", name: "N", type: "CITY", slug: "n", location: { lat: 1, lng: 2 } },
      ]
      const result = buildNodeHierarchy(nodes)
      expect(result[0].coordinates).toEqual({ lat: 1, lng: 2 })
      expect(result[0].code).toBeNull()
    })

    it("defaults status to active when not provided", () => {
      const nodes = [{ id: "1", name: "N", type: "CITY", slug: "n" }]
      const result = buildNodeHierarchy(nodes)
      expect(result[0].status).toBe("active")
    })

    it("builds deep hierarchy with three levels", () => {
      const nodes = [
        { id: "1", name: "City", type: "CITY", slug: "city" },
        { id: "2", name: "District", type: "DISTRICT", slug: "d", parent_id: "1" },
        { id: "3", name: "Zone", type: "ZONE", slug: "z", parent_id: "2" },
      ]
      const result = buildNodeHierarchy(nodes)
      expect(result).toHaveLength(1)
      expect(result[0].children[0].children[0].id).toBe("3")
    })
  })

  describe("buildGovernanceChain", () => {
    it("returns nulls when no region or country authorities", () => {
      const result = buildGovernanceChain([], { tax: 0.1 })
      expect(result.region).toBeNull()
      expect(result.country).toBeNull()
      expect(result.authorities).toEqual([])
      expect(result.policies).toEqual({ tax: 0.1 })
    })

    it("maps region authority correctly", () => {
      const authorities = [
        { id: "r1", name: "GCC", type: "region", code: "GCC", residency_zone: "GCC_EU" },
      ]
      const result = buildGovernanceChain(authorities, {})
      expect(result.region).toEqual({
        id: "r1",
        name: "GCC",
        code: "GCC",
        residencyZone: "GCC_EU",
      })
    })

    it("falls back to slug when code is missing", () => {
      const authorities = [
        { id: "r1", name: "Region", type: "region", slug: "region-slug" },
      ]
      const result = buildGovernanceChain(authorities, {})
      expect(result.region!.code).toBe("region-slug")
    })

    it("maps country authority with metadata settings", () => {
      const authorities = [
        { id: "c1", name: "UAE", type: "country", code: "AE", metadata: { vat: true } },
      ]
      const result = buildGovernanceChain(authorities, {})
      expect(result.country).toEqual({
        id: "c1",
        name: "UAE",
        code: "AE",
        settings: { vat: true },
      })
    })

    it("defaults residencyZone to GLOBAL", () => {
      const authorities = [{ id: "r1", name: "R", type: "region", code: "R" }]
      const result = buildGovernanceChain(authorities, {})
      expect(result.region!.residencyZone).toBe("GLOBAL")
    })

    it("defaults policies to empty object when null", () => {
      const result = buildGovernanceChain([], null)
      expect(result.policies).toEqual({})
    })

    it("maps authority type entries with jurisdiction", () => {
      const authorities = [
        { id: "a1", name: "Auth", type: "authority", code: "A1", metadata: { jurisdiction: { level: 1 } } },
      ]
      const result = buildGovernanceChain(authorities, {})
      expect(result.authorities).toHaveLength(1)
      expect(result.authorities[0].jurisdiction).toEqual({ level: 1 })
    })
  })

  describe("formatTenantResponse", () => {
    it("formats a complete tenant", () => {
      const tenant = {
        id: "t1",
        name: "Dakkah",
        slug: "dakkah",
        domain: "dakkah.com",
        residency_zone: "GCC_EU",
        status: "active",
        default_locale: "ar",
        supported_locales: ["ar", "en"],
        timezone: "Asia/Dubai",
        default_currency: "AED",
        metadata: { description: "Dakkah city" },
      }
      const result = formatTenantResponse(tenant)
      expect(result.id).toBe("t1")
      expect(result.domain).toBe("dakkah.com")
      expect(result.residencyZone).toBe("GCC_EU")
      expect(result.settings.defaultLocale).toBe("ar")
      expect(result.settings.currency).toBe("AED")
      expect(result.description).toBe("Dakkah city")
    })

    it("applies defaults for missing fields", () => {
      const tenant = { id: "t1", name: "Test", slug: "test" }
      const result = formatTenantResponse(tenant)
      expect(result.domain).toBe("test.cityos.dev")
      expect(result.residencyZone).toBe("GLOBAL")
      expect(result.status).toBe("active")
      expect(result.settings.defaultLocale).toBe("en")
      expect(result.settings.timezone).toBe("UTC")
      expect(result.settings.currency).toBe("USD")
      expect(result.description).toBe("Test tenant")
    })

    it("wraps supported_locales as objects", () => {
      const tenant = { id: "t1", name: "T", slug: "t", supported_locales: ["fr", "de"] }
      const result = formatTenantResponse(tenant)
      expect(result.settings.supportedLocales).toEqual([{ locale: "fr" }, { locale: "de" }])
    })
  })

  describe("getSystemsSummary", () => {
    it("returns correct counts from mocked registry", () => {
      const result = getSystemsSummary()
      expect(result.total).toBe(3)
      expect(result.active).toBe(2)
      expect(result.external).toBe(1)
      expect(result.registry).toHaveLength(3)
    })
  })
})
