import { MedusaService } from "@medusajs/framework/utils";
import GovernanceAuthority from "./models/governance-authority";

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

class GovernanceModuleService extends MedusaService({
  GovernanceAuthority,
}) {
  async buildAuthorityChain(authorityId: string) {
    const chain: any[] = [];
    let currentId: string | null = authorityId;

    while (currentId) {
      const authority = await this.retrieveGovernanceAuthority(currentId) as any;
      if (!authority) break;

      chain.unshift(authority);
      currentId = authority.parent_authority_id || null;
    }

    return chain;
  }

  async resolveEffectivePolicies(tenantId: string) {
    let mergedPolicies: Record<string, any> = {};

    const authorities = await this.listGovernanceAuthorities({
      tenant_id: tenantId,
    }) as any;
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    const regionAuthority = authorityList.find((a: any) => a.type === "region");
    if (regionAuthority && regionAuthority.policies) {
      mergedPolicies = deepMerge(mergedPolicies, regionAuthority.policies);
    }

    const countryAuthority = authorityList.find(
      (a: any) => a.type === "country",
    );
    if (countryAuthority && countryAuthority.policies) {
      mergedPolicies = deepMerge(mergedPolicies, countryAuthority.policies);
    }

    const authorityEntries = authorityList
      .filter((a: any) => a.type === "authority")
      .sort(
        (a: any, b: any) =>
          (a.jurisdiction_level || 0) - (b.jurisdiction_level || 0),
      );

    for (const authority of authorityEntries) {
      if (authority.policies) {
        mergedPolicies = deepMerge(mergedPolicies, authority.policies);
      }
    }

    return mergedPolicies;
  }

  async getCommercePolicy(tenantId: string) {
    const effectivePolicies = await this.resolveEffectivePolicies(tenantId);
    return effectivePolicies.commerce || {};
  }

  async createPolicy(data: {
    authorityId: string;
    name: string;
    policyType: string;
    rules: Record<string, any>;
    effectiveDate: Date;
  }): Promise<any> {
    if (!data.name || !data.name.trim()) {
      throw new Error("Policy name is required");
    }
    if (!data.rules || Object.keys(data.rules).length === 0) {
      throw new Error("Policy rules cannot be empty");
    }
    const effectiveDate = new Date(data.effectiveDate);
    if (effectiveDate < new Date()) {
      throw new Error("Effective date must be in the future");
    }

    const authority = await this.retrieveGovernanceAuthority(data.authorityId) as any;
    const existingPolicies = authority.policies || {};
    const updatedPolicies = deepMerge(existingPolicies, {
      [data.policyType]: {
        [data.name]: {
          rules: data.rules,
          effective_date: effectiveDate.toISOString(),
          created_at: new Date().toISOString(),
          status: "active",
        },
      },
    });

    return await this.updateGovernanceAuthorities({
      id: data.authorityId,
      policies: updatedPolicies,
    } as any);
  }

  async evaluateCompliance(
    entityId: string,
    policyId: string,
  ): Promise<{
    compliant: boolean;
    violations: Array<{ rule: string; expected: any; actual: any }>;
    evaluatedAt: Date;
  }> {
    const authorities = await this.listGovernanceAuthorities({}) as any;
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    let policyRules: Record<string, any> | null = null;
    let policyName = "";

    for (const authority of authorityList) {
      const policies = authority.policies || {};
      for (const pType of Object.keys(policies)) {
        for (const pName of Object.keys(policies[pType])) {
          if (pName === policyId || `${pType}.${pName}` === policyId) {
            policyRules = policies[pType][pName].rules || {};
            policyName = pName;
            break;
          }
        }
        if (policyRules) break;
      }
      if (policyRules) break;
    }

    if (!policyRules) {
      throw new Error(`Policy "${policyId}" not found`);
    }

    const violations: Array<{ rule: string; expected: any; actual: any }> = [];
    for (const [rule, expected] of Object.entries(policyRules)) {
      if (typeof expected === "boolean" && !expected) {
        violations.push({ rule, expected, actual: "not_verified" });
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      evaluatedAt: new Date(),
    };
  }

  async getAuthorityChain(nodeId: string): Promise<{
    chain: any[];
    mergedPolicies: Record<string, any>;
  }> {
    const chain = await this.buildAuthorityChain(nodeId);
    let mergedPolicies: Record<string, any> = {};

    for (const authority of chain) {
      if (authority.policies) {
        mergedPolicies = deepMerge(mergedPolicies, authority.policies);
      }
    }

    return { chain, mergedPolicies };
  }

  async auditPolicyChanges(policyId: string): Promise<{
    policyId: string;
    history: Array<{
      version: number;
      changedAt: string;
      changes: Record<string, any>;
    }>;
  }> {
    const authorities = await this.listGovernanceAuthorities({}) as any;
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    const history: Array<{
      version: number;
      changedAt: string;
      changes: Record<string, any>;
    }> = [];
    let version = 0;

    for (const authority of authorityList) {
      const policies = authority.policies || {};
      for (const pType of Object.keys(policies)) {
        for (const pName of Object.keys(policies[pType])) {
          if (pName === policyId || `${pType}.${pName}` === policyId) {
            const policy = policies[pType][pName];
            version++;
            history.push({
              version,
              changedAt:
                policy.created_at ||
                authority.updated_at ||
                authority.created_at ||
                new Date().toISOString(),
              changes: {
                authority_id: authority.id,
                authority_type: authority.type,
                rules: policy.rules || {},
                status: policy.status || "active",
                effective_date: policy.effective_date || null,
              },
            });
          }
        }
      }
    }

    if (history.length === 0) {
      throw new Error(`No policy changes found for "${policyId}"`);
    }

    return { policyId, history };
  }

  async evaluatePolicyChain(
    nodeId: string,
    policyType: string,
  ): Promise<{
    effectivePolicy: Record<string, any>;
    chain: Array<{
      authorityId: string;
      authorityType: string;
      policies: Record<string, any>;
    }>;
    policyType: string;
  }> {
    const chain = await this.buildAuthorityChain(nodeId);
    let effectivePolicy: Record<string, any> = {};
    const policyChain: Array<{
      authorityId: string;
      authorityType: string;
      policies: Record<string, any>;
    }> = [];

    for (const authority of chain) {
      const policies = authority.policies || {};
      const typePolicies = policies[policyType] || {};

      if (Object.keys(typePolicies).length > 0) {
        effectivePolicy = deepMerge(effectivePolicy, typePolicies);
        policyChain.push({
          authorityId: authority.id,
          authorityType: authority.type,
          policies: typePolicies,
        });
      }
    }

    return {
      effectivePolicy,
      chain: policyChain,
      policyType,
    };
  }

  async checkComplianceStatus(tenantId: string): Promise<{
    tenantId: string;
    compliant: boolean;
    totalPolicies: number;
    violations: Array<{
      policyName: string;
      policyType: string;
      authorityId: string;
      reason: string;
    }>;
    checkedAt: Date;
  }> {
    const authorities = await this.listGovernanceAuthorities({
      tenant_id: tenantId,
    }) as any;
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    const violations: Array<{
      policyName: string;
      policyType: string;
      authorityId: string;
      reason: string;
    }> = [];
    let totalPolicies = 0;

    for (const authority of authorityList) {
      const policies = authority.policies || {};
      for (const pType of Object.keys(policies)) {
        for (const pName of Object.keys(policies[pType])) {
          totalPolicies++;
          const policy = policies[pType][pName];

          if (
            policy.status === "violated" ||
            policy.status === "non_compliant"
          ) {
            violations.push({
              policyName: pName,
              policyType: pType,
              authorityId: authority.id,
              reason: `Policy status is ${policy.status}`,
            });
            continue;
          }

          if (
            policy.effective_date &&
            new Date(policy.effective_date) > new Date()
          ) {
            continue;
          }

          const rules = policy.rules || {};
          for (const [rule, expected] of Object.entries(rules)) {
            if (typeof expected === "boolean" && !expected) {
              violations.push({
                policyName: pName,
                policyType: pType,
                authorityId: authority.id,
                reason: `Rule "${rule}" is not satisfied`,
              });
            }
          }
        }
      }
    }

    return {
      tenantId,
      compliant: violations.length === 0,
      totalPolicies,
      violations,
      checkedAt: new Date(),
    };
  }

  async getPolicyAuditTrail(policyId: string): Promise<{
    policyId: string;
    trail: Array<{
      version: number;
      authorityId: string;
      authorityType: string;
      changedAt: string;
      status: string;
      rules: Record<string, any>;
      effectiveDate: string | null;
    }>;
  }> {
    const authorities = await this.listGovernanceAuthorities({}) as any;
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    const trail: Array<{
      version: number;
      authorityId: string;
      authorityType: string;
      changedAt: string;
      status: string;
      rules: Record<string, any>;
      effectiveDate: string | null;
    }> = [];
    let version = 0;

    for (const authority of authorityList) {
      const policies = authority.policies || {};
      for (const pType of Object.keys(policies)) {
        for (const pName of Object.keys(policies[pType])) {
          if (pName === policyId || `${pType}.${pName}` === policyId) {
            const policy = policies[pType][pName];
            version++;
            trail.push({
              version,
              authorityId: authority.id,
              authorityType: authority.type,
              changedAt:
                policy.created_at ||
                authority.updated_at ||
                authority.created_at ||
                new Date().toISOString(),
              status: policy.status || "active",
              rules: policy.rules || {},
              effectiveDate: policy.effective_date || null,
            });
          }
        }
      }
    }

    if (trail.length === 0) {
      throw new Error(`No audit trail found for policy "${policyId}"`);
    }

    trail.sort(
      (a, b) =>
        new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    );

    return { policyId, trail };
  }
}

export default GovernanceModuleService;
