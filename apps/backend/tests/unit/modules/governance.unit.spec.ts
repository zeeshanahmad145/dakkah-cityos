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
        async listGovernanceAuthorities(
          _filter: any,
          _options?: any,
        ): Promise<any> {
          return [];
        }
        async retrieveGovernanceAuthority(_id: string): Promise<any> {
          return null;
        }
        async createGovernanceAuthoritys(_data: any): Promise<any> {
          return {};
        }
        async updateGovernanceAuthoritys(_data: any): Promise<any> {
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

import GovernanceModuleService from "../../../src/modules/governance/service";

describe("GovernanceModuleService", () => {
  let service: GovernanceModuleService;

  beforeEach(() => {
    service = new GovernanceModuleService();
    jest.clearAllMocks();
  });

  describe("evaluatePolicyChain", () => {
    it("returns effective policy merged from authority chain", async () => {
      jest.spyOn(service, "retrieveGovernanceAuthority").mockResolvedValueOnce({
        id: "auth-1",
        type: "region",
        parent_authority_id: null,
        policies: {
          commerce: { tax: { rules: { rate: 10 }, status: "active" } },
        },
      });

      const result = await service.evaluatePolicyChain("auth-1", "commerce");
      expect(result.policyType).toBe("commerce");
      expect(result.effectivePolicy).toHaveProperty("tax");
    });

    it("returns empty policy when no policies match type", async () => {
      jest.spyOn(service, "retrieveGovernanceAuthority").mockResolvedValueOnce({
        id: "auth-1",
        type: "region",
        parent_authority_id: null,
        policies: { shipping: {} },
      });

      const result = await service.evaluatePolicyChain("auth-1", "commerce");
      expect(Object.keys(result.effectivePolicy)).toHaveLength(0);
      expect(result.chain).toHaveLength(0);
    });

    it("merges policies from parent to child in chain", async () => {
      jest
        .spyOn(service, "retrieveGovernanceAuthority")
        .mockResolvedValueOnce({
          id: "auth-2",
          type: "country",
          parent_authority_id: "auth-1",
          policies: {
            commerce: { local_tax: { rules: { rate: 5 }, status: "active" } },
          },
        })
        .mockResolvedValueOnce({
          id: "auth-1",
          type: "region",
          parent_authority_id: null,
          policies: {
            commerce: { global_tax: { rules: { rate: 10 }, status: "active" } },
          },
        });

      const result = await service.evaluatePolicyChain("auth-2", "commerce");
      expect(result.chain).toHaveLength(2);
      expect(result.effectivePolicy).toHaveProperty("global_tax");
      expect(result.effectivePolicy).toHaveProperty("local_tax");
    });
  });

  describe("checkComplianceStatus", () => {
    it("returns compliant when all policies are satisfied", async () => {
      jest.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "auth-1",
          type: "region",
          policies: {
            commerce: {
              tax_policy: { rules: { has_tax_id: true }, status: "active" },
            },
          },
        },
      ]);

      const result = await service.checkComplianceStatus("t-1");
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("returns violations for non-compliant policies", async () => {
      jest.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "auth-1",
          type: "region",
          policies: {
            commerce: {
              bad_policy: {
                rules: { data_encrypted: false },
                status: "active",
              },
            },
          },
        },
      ]);

      const result = await service.checkComplianceStatus("t-1");
      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("returns compliant when no authorities exist", async () => {
      jest.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([]);

      const result = await service.checkComplianceStatus("t-1");
      expect(result.compliant).toBe(true);
      expect(result.totalPolicies).toBe(0);
    });
  });

  describe("getPolicyAuditTrail", () => {
    it("returns audit trail for existing policy", async () => {
      jest.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([
        {
          id: "auth-1",
          type: "region",
          created_at: "2025-01-01T00:00:00Z",
          policies: {
            commerce: {
              tax_policy: {
                rules: { rate: 10 },
                status: "active",
                created_at: "2025-01-01T00:00:00Z",
              },
            },
          },
        },
      ]);

      const result = await service.getPolicyAuditTrail("tax_policy");
      expect(result.policyId).toBe("tax_policy");
      expect(result.trail).toHaveLength(1);
      expect(result.trail[0].version).toBe(1);
    });

    it("throws when policy is not found", async () => {
      jest.spyOn(service, "listGovernanceAuthorities").mockResolvedValue([]);

      await expect(service.getPolicyAuditTrail("nonexistent")).rejects.toThrow(
        "No audit trail found",
      );
    });
  });
});
