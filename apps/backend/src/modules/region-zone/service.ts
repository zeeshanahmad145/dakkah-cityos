import { MedusaService } from "@medusajs/framework/utils";
import RegionZoneMapping from "./models/region-zone-mapping";

class RegionZoneModuleService extends MedusaService({
  RegionZoneMapping,
}) {
  async getRegionsForZone(residencyZone: string) {
    const mappings = await this.listRegionZoneMappings({
      residency_zone: residencyZone,
    }) as any;
    return Array.isArray(mappings) ? mappings : [mappings].filter(Boolean);
  }

  async getZoneForRegion(medusaRegionId: string) {
    const mappings = await this.listRegionZoneMappings({
      medusa_region_id: medusaRegionId,
    }) as any;
    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);
    return list[0] || null;
  }

  async createMapping(data: {
    residency_zone: string;
    medusa_region_id: string;
    country_codes?: string[];
    policies_override?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    return await this.createRegionZoneMappings({
      residency_zone: data.residency_zone,
      medusa_region_id: data.medusa_region_id,
      country_codes: data.country_codes || null,
      policies_override: data.policies_override || null,
      metadata: data.metadata || null,
    } as any);
  }

  async getZonesByRegion(regionCode: string) {
    const mapping = await this.getZoneForRegion(regionCode);
    if (!mapping) {
      return null;
    }
    return {
      regionId: mapping.medusa_region_id,
      zone: mapping.residency_zone,
      countries: mapping.country_codes || [],
      metadata: mapping.metadata || {},
    };
  }

  async getActiveZones() {
    const mappings = await this.listRegionZoneMappings({}) as any;
    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);

    const zoneMap = new Map<string, any>();
    list.forEach((mapping: any) => {
      const zone = mapping.residency_zone;
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, {
          zone,
          regions: [],
          totalCountries: 0,
        });
      }
      const zoneData = zoneMap.get(zone);
      zoneData.regions.push(mapping.medusa_region_id);
      if (mapping.country_codes) {
        zoneData.totalCountries += mapping.country_codes.length;
      }
    });

    return Array.from(zoneMap.values());
  }

  async validateZoneAccess(
    tenantId: string,
    zoneCode: string,
  ): Promise<boolean> {
    try {
      const mappings = await this.listRegionZoneMappings({
        residency_zone: zoneCode,
      }) as any;

      const list = Array.isArray(mappings)
        ? mappings
        : [mappings].filter(Boolean);

      if (list.length === 0) {
        return false;
      }

      const hasValidMetadata = list.some((mapping: any) => {
        if (!mapping.metadata) {
          return false;
        }
        const tenantAccess = mapping.metadata.tenant_access || [];
        return (
          tenantAccess.includes(tenantId) ||
          mapping.metadata.public_access === true
        );
      });

      return hasValidMetadata || list.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getResidencyRequirements(zoneCode: string) {
    const mappings = await this.listRegionZoneMappings({
      residency_zone: zoneCode,
    }) as any;

    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);

    if (list.length === 0) {
      return null;
    }

    const firstMapping = list[0];
    return {
      zone: zoneCode,
      regions: list.map((m: any) => m.medusa_region_id),
      countries: [...new Set(list.flatMap((m: any) => m.country_codes || []))],
      policies: firstMapping.policies_override || {},
      complianceRequirements: {
        dataLocalization: true,
        encryptionRequired: true,
        retentionPolicy: this.getRetentionPolicyForZone(zoneCode),
      },
    };
  }

  async resolveZoneForCountry(countryCode: string) {
    const mappings = await this.listRegionZoneMappings({}) as any;
    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);

    const matching = list.find((mapping: any) => {
      if (!mapping.country_codes) {
        return false;
      }
      return (mapping.country_codes as string[]).includes(
        countryCode.toUpperCase(),
      );
    });

    if (!matching) {
      return null;
    }

    return {
      countryCode,
      zone: matching.residency_zone,
      region: matching.medusa_region_id,
      policies: matching.policies_override || {},
    };
  }

  private getRetentionPolicyForZone(zoneCode: string): string {
    const policies: Record<string, string> = {
      GCC: "3 years",
      EU: "7 years (GDPR compliant)",
      MENA: "5 years",
      APAC: "3 years",
      AMERICAS: "2 years",
      GLOBAL: "2 years",
    };
    return policies[zoneCode] || "3 years";
  }
}

export default RegionZoneModuleService;
