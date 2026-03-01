import { MedusaService } from "@medusajs/framework/utils";
import Persona from "./models/persona";
import { PersonaAssignment } from "./models/persona-assignment";

const SCOPE_PRIORITY: Record<string, number> = {
  session: 500,
  surface: 400,
  membership: 300,
  "user-default": 200,
  "tenant-default": 100,
};

const GEO_SCOPE_ORDER = ["facility", "zone", "district", "city", "global"];
const DATA_CLASSIFICATION_ORDER = [
  "public",
  "internal",
  "confidential",
  "restricted",
];

class PersonaModuleService extends MedusaService({
  Persona,
  PersonaAssignment,
}) {
  async resolvePersona(
    tenantId: string,
    userId: string,
    sessionContext?: { sessionId?: string; surface?: string; scope?: string },
  ) {
    const assignments = (await this.listPersonaAssignments({
      tenant_id: tenantId,
      status: "active",
    })) as unknown as Record<string, unknown>[];

    const now = new Date();

    const filtered = (
      Array.isArray(assignments) ? assignments : [assignments].filter(Boolean)
    )
      .filter((a: any) => {
        if (a.starts_at && new Date(a.starts_at) > now) return false;
        if (a.ends_at && new Date(a.ends_at) < now) return false;
        return true;
      })
      .filter((a: any) => {
        if (a.scope === "tenant-default") return true;
        if (a.scope === "user-default" && a.user_id === userId) return true;
        if (a.scope === "membership" && a.user_id === userId) return true;
        if (
          a.scope === "surface" &&
          sessionContext?.surface &&
          a.scope_reference === sessionContext.surface
        )
          return true;
        if (
          a.scope === "session" &&
          sessionContext?.sessionId &&
          a.scope_reference === sessionContext.sessionId
        )
          return true;
        return false;
      });

    if (filtered.length === 0) return null;

    const ranked = filtered.map((a: any) => ({
      ...a,
      effectivePriority: (SCOPE_PRIORITY[a.scope] || 0) + (a.priority || 0),
    }));

    ranked.sort((a: any, b: any) => b.effectivePriority - a.effectivePriority);

    const winner = ranked[0];
    const persona = (await this.retrievePersona(winner.persona_id)) as any;

    return persona;
  }

  mergePersonaConstraints(personas: any[]) {
    const defaults = {
      kidSafe: false,
      readOnly: false,
      geoScope: "global" as string,
      maxDataClassification: "restricted" as string,
    };

    if (!personas || personas.length === 0) return defaults;

    let kidSafe = false;
    let readOnly = false;
    let narrowestGeoIndex = GEO_SCOPE_ORDER.length - 1;
    let lowestClassIndex = DATA_CLASSIFICATION_ORDER.length - 1;

    for (const persona of personas) {
      const constraints = persona.constraints;
      if (!constraints) continue;

      if (constraints.kid_safe || constraints.kidSafe) kidSafe = true;
      if (constraints.read_only || constraints.readOnly) readOnly = true;

      const geoScope = constraints.geo_scope || constraints.geoScope;
      if (geoScope) {
        const geoIndex = GEO_SCOPE_ORDER.indexOf(geoScope);
        if (geoIndex !== -1 && geoIndex < narrowestGeoIndex) {
          narrowestGeoIndex = geoIndex;
        }
      }

      const maxClass =
        constraints.max_data_classification ||
        constraints.maxDataClassification;
      if (maxClass) {
        const classIndex = DATA_CLASSIFICATION_ORDER.indexOf(maxClass);
        if (classIndex !== -1 && classIndex < lowestClassIndex) {
          lowestClassIndex = classIndex;
        }
      }
    }

    return {
      kidSafe,
      readOnly,
      geoScope: GEO_SCOPE_ORDER[narrowestGeoIndex],
      maxDataClassification: DATA_CLASSIFICATION_ORDER[lowestClassIndex],
    };
  }

  async getPersonasForTenant(tenantId: string) {
    const personas = (await this.listPersonas({ tenant_id: tenantId })) as any;
    return Array.isArray(personas) ? personas : [personas].filter(Boolean);
  }

  async assignPersona(data: {
    tenantId: string;
    personaId: string;
    userId?: string;
    scope: string;
    scopeReference?: string;
    priority?: number;
  }) {
    return await this.createPersonaAssignments({
      tenant_id: data.tenantId,
      persona_id: data.personaId,
      user_id: data.userId || null,
      scope: data.scope,
      scope_reference: data.scopeReference || null,
      priority: data.priority || 0,
      status: "active",
    } as any);
  }

  async getPersonaCapabilities(personaId: string): Promise<{
    persona: any;
    capabilities: string[];
    constraints: Record<string, any>;
  }> {
    const persona = (await this.retrievePersona(personaId)) as any;
    const capabilities: string[] = [];

    const config = (persona.config || persona.capabilities || {}) as Record<
      string,
      any
    >;
    if (config.permissions) {
      capabilities.push(
        ...(Array.isArray(config.permissions) ? config.permissions : []),
      );
    }
    if (config.features) {
      capabilities.push(
        ...(Array.isArray(config.features) ? config.features : []),
      );
    }
    if (config.actions) {
      capabilities.push(
        ...(Array.isArray(config.actions) ? config.actions : []),
      );
    }

    const constraints = persona.constraints || {};
    if (constraints.read_only || constraints.readOnly) {
      capabilities.push("read");
    } else {
      capabilities.push("read", "write");
    }
    if (constraints.kid_safe || constraints.kidSafe) {
      capabilities.push("kid_safe_content");
    }

    return {
      persona,
      capabilities: [...new Set(capabilities)],
      constraints,
    };
  }

  async validatePersonaAssignment(
    userId: string,
    personaId: string,
  ): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    if (!userId || !personaId) {
      return { eligible: false, reason: "User ID and persona ID are required" };
    }

    try {
      (await this.retrievePersona(personaId)) as any;
    } catch {
      return { eligible: false, reason: "Persona not found" };
    }

    const existingAssignments = (await this.listPersonaAssignments({
      user_id: userId,
      persona_id: personaId,
      status: "active",
    })) as any;
    const assignmentList = Array.isArray(existingAssignments)
      ? existingAssignments
      : [existingAssignments].filter(Boolean);
    if (assignmentList.length > 0) {
      return {
        eligible: false,
        reason: "User already has this persona assigned",
      };
    }

    const allUserAssignments = (await this.listPersonaAssignments({
      user_id: userId,
      status: "active",
    })) as any;
    const userAssignmentList = Array.isArray(allUserAssignments)
      ? allUserAssignments
      : [allUserAssignments].filter(Boolean);
    const maxAssignments = 10;
    if (userAssignmentList.length >= maxAssignments) {
      return {
        eligible: false,
        reason: `User has reached the maximum of ${maxAssignments} active persona assignments`,
      };
    }

    return { eligible: true };
  }

  async resolvePersonaPrecedence(
    customerId: string,
    tenantId: string,
  ): Promise<{
    customerId: string;
    tenantId: string;
    activeAssignments: any[];
    effectivePersona: any | null;
    precedenceOrder: Array<{
      scope: string;
      priority: number;
      personaId: string;
    }>;
  }> {
    const assignments = (await this.listPersonaAssignments({
      tenant_id: tenantId,
      user_id: customerId,
      status: "active",
    })) as any;
    const assignmentList = Array.isArray(assignments)
      ? assignments
      : [assignments].filter(Boolean);

    const now = new Date();
    const active = assignmentList.filter((a: any) => {
      if (a.starts_at && new Date(a.starts_at) > now) return false;
      if (a.ends_at && new Date(a.ends_at) < now) return false;
      return true;
    });

    const ranked = active.map((a: any) => ({
      ...a,
      effectivePriority: (SCOPE_PRIORITY[a.scope] || 0) + (a.priority || 0),
    }));

    ranked.sort((a: any, b: any) => b.effectivePriority - a.effectivePriority);

    const precedenceOrder = ranked.map((a: any) => ({
      scope: a.scope,
      priority: a.effectivePriority,
      personaId: a.persona_id,
    }));

    let effectivePersona = null;
    if (ranked.length > 0) {
      try {
        effectivePersona = (await this.retrievePersona(
          ranked[0].persona_id,
        )) as any;
      } catch {
        effectivePersona = null;
      }
    }

    return {
      customerId,
      tenantId,
      activeAssignments: active,
      effectivePersona,
      precedenceOrder,
    };
  }

  async getPersonaRecommendations(personaId: string): Promise<{
    personaId: string;
    personaName: string;
    recommendations: Array<{
      type: string;
      category: string;
      reason: string;
      score: number;
    }>;
    constraints: Record<string, any>;
  }> {
    const persona = (await this.retrievePersona(personaId)) as any;
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const constraints = persona.constraints || {};
    const config = (persona.config || persona.capabilities || {}) as Record<
      string,
      any
    >;
    const recommendations: Array<{
      type: string;
      category: string;
      reason: string;
      score: number;
    }> = [];

    const preferences = config.preferences || config.interests || {};
    const categories = Array.isArray(preferences)
      ? preferences
      : Object.keys(preferences);

    for (const category of categories) {
      const score =
        typeof preferences[category] === "number" ? preferences[category] : 0.5;
      recommendations.push({
        type: "product",
        category: String(category),
        reason: `Matches persona preference for ${category}`,
        score: Number(score),
      });
    }

    if (constraints.kid_safe || constraints.kidSafe) {
      recommendations.push({
        type: "content",
        category: "family_friendly",
        reason: "Kid-safe persona requires family-friendly content",
        score: 1.0,
      });
    }

    const geoScope = constraints.geo_scope || constraints.geoScope;
    if (geoScope && geoScope !== "global") {
      recommendations.push({
        type: "content",
        category: "local",
        reason: `Geo-scoped persona prefers local content (${geoScope})`,
        score: 0.8,
      });
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      personaId,
      personaName: persona.name || persona.label || personaId,
      recommendations,
      constraints,
    };
  }

  async mergePersonaProfiles(
    primaryId: string,
    secondaryId: string,
  ): Promise<{
    mergedPersona: any;
    primaryId: string;
    secondaryId: string;
    mergedConstraints: Record<string, any>;
  }> {
    const primary = (await this.retrievePersona(primaryId)) as any;
    const secondary = (await this.retrievePersona(secondaryId)) as any;

    if (!primary) throw new Error(`Primary persona ${primaryId} not found`);
    if (!secondary)
      throw new Error(`Secondary persona ${secondaryId} not found`);

    const mergedConstraints = this.mergePersonaConstraints([
      primary,
      secondary,
    ]);

    const primaryConfig = (primary.config ||
      primary.capabilities ||
      {}) as Record<string, any>;
    const secondaryConfig = (secondary.config ||
      secondary.capabilities ||
      {}) as Record<string, any>;

    const mergedConfig: Record<string, any> = { ...primaryConfig };

    for (const key of Object.keys(secondaryConfig)) {
      if (!(key in mergedConfig)) {
        mergedConfig[key] = secondaryConfig[key];
      } else if (
        Array.isArray(mergedConfig[key]) &&
        Array.isArray(secondaryConfig[key])
      ) {
        mergedConfig[key] = [
          ...new Set([...mergedConfig[key], ...secondaryConfig[key]]),
        ];
      } else if (
        typeof mergedConfig[key] === "number" &&
        typeof secondaryConfig[key] === "number"
      ) {
        mergedConfig[key] = Math.max(mergedConfig[key], secondaryConfig[key]);
      }
    }

    const mergedPersona = await this.updatePersonas({
      id: primaryId,
      config: mergedConfig,
      constraints: {
        kid_safe: mergedConstraints.kidSafe,
        read_only: mergedConstraints.readOnly,
        geo_scope: mergedConstraints.geoScope,
        max_data_classification: mergedConstraints.maxDataClassification,
      },
      metadata: {
        ...(primary.metadata || {}),
        merged_from: secondaryId,
        merged_at: new Date().toISOString(),
      },
    } as any);

    return {
      mergedPersona,
      primaryId,
      secondaryId,
      mergedConstraints,
    };
  }
}

export default PersonaModuleService;
