jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain, nullable: () => chain, default: () => chain,
      unique: () => chain, searchable: () => chain, index: () => chain,
    }
    return chain
  }
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async createInsPolicys(_data: any): Promise<any> { return {} }
        async updateInsPolicys(_data: any): Promise<any> { return {} }
        async retrieveInsPolicy(_id: string): Promise<any> { return null }
        async createInsClaims(_data: any): Promise<any> { return {} }
        async updateInsClaims(_data: any): Promise<any> { return {} }
        async retrieveInsClaim(_id: string): Promise<any> { return null }
        async listInsClaims(_filter: any): Promise<any> { return [] }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable, text: chainable, number: chainable, json: chainable,
      enum: () => chainable(), boolean: chainable, dateTime: chainable,
      bigNumber: chainable, float: chainable, array: chainable,
      hasOne: () => chainable(), hasMany: () => chainable(),
      belongsTo: () => chainable(), manyToMany: () => chainable(),
    },
  }
})

import InsuranceModuleService from "../../../src/modules/insurance/service"

describe("InsuranceModuleService", () => {
  let service: InsuranceModuleService

  beforeEach(() => {
    service = new InsuranceModuleService()
    jest.clearAllMocks()
  })

  describe("calculatePremium", () => {
    it("should calculate premium for basic coverage", async () => {
      const result = await service.calculatePremium({
        coverageType: "basic",
        coverageAmount: 100000,
        durationMonths: 12,
      })
      expect(result.basePremium).toBe(2000)
      expect(result.monthlyPremium).toBeGreaterThan(0)
      expect(result.totalPremium).toBe(2000)
    })

    it("should calculate higher premium for comprehensive coverage", async () => {
      const basic = await service.calculatePremium({
        coverageType: "basic", coverageAmount: 100000, durationMonths: 12,
      })
      const comprehensive = await service.calculatePremium({
        coverageType: "comprehensive", coverageAmount: 100000, durationMonths: 12,
      })
      expect(comprehensive.totalPremium).toBeGreaterThan(basic.totalPremium)
    })

    it("should scale premium with risk factors", async () => {
      const lowRisk = await service.calculatePremium({
        coverageType: "basic", coverageAmount: 100000, durationMonths: 12,
      })
      const highRisk = await service.calculatePremium({
        coverageType: "basic", coverageAmount: 100000, durationMonths: 12,
        riskFactors: { age: 65, highRiskArea: true },
      })
      expect(highRisk.totalPremium).toBeGreaterThan(lowRisk.totalPremium)
      expect(highRisk.riskAdjustment).toBeGreaterThan(0)
    })

    it("should reject zero coverage amount", async () => {
      await expect(service.calculatePremium({
        coverageType: "basic", coverageAmount: 0, durationMonths: 12,
      })).rejects.toThrow("Coverage amount must be greater than zero")
    })

    it("should reject zero duration", async () => {
      await expect(service.calculatePremium({
        coverageType: "basic", coverageAmount: 100000, durationMonths: 0,
      })).rejects.toThrow("Duration must be greater than zero")
    })
  })

  describe("processClaimAdjudication", () => {
    it("should approve a valid claim on an active policy", async () => {
      jest.spyOn(service, "retrieveInsClaim" as any).mockResolvedValue({
        id: "clm_01", status: "pending", claim_amount: 50000, policy_id: "pol_01",
      })
      jest.spyOn(service, "retrieveInsPolicy" as any).mockResolvedValue({
        id: "pol_01", status: "active", coverage_amount: 100000,
        start_date: new Date("2025-01-01"), end_date: new Date("2027-01-01"),
      })
      jest.spyOn(service, "listInsClaims" as any).mockResolvedValue([])
      jest.spyOn(service, "updateInsClaims" as any).mockResolvedValue({})

      const result = await service.processClaimAdjudication("clm_01")
      expect(result.decision).toBe("approved")
      expect(result.approvedAmount).toBeGreaterThan(0)
    })

    it("should deny claim on expired policy", async () => {
      jest.spyOn(service, "retrieveInsClaim" as any).mockResolvedValue({
        id: "clm_02", status: "pending", claim_amount: 5000, policy_id: "pol_02",
      })
      jest.spyOn(service, "retrieveInsPolicy" as any).mockResolvedValue({
        id: "pol_02", status: "active", coverage_amount: 100000,
        start_date: new Date("2023-01-01"), end_date: new Date("2024-01-01"),
      })
      jest.spyOn(service, "updateInsClaims" as any).mockResolvedValue({})

      const result = await service.processClaimAdjudication("clm_02")
      expect(result.decision).toBe("denied")
      expect(result.reason).toContain("expired")
    })

    it("should reject claim not in reviewable state", async () => {
      jest.spyOn(service, "retrieveInsClaim" as any).mockResolvedValue({
        id: "clm_03", status: "approved", claim_amount: 5000, policy_id: "pol_01",
      })

      await expect(service.processClaimAdjudication("clm_03")).rejects.toThrow(
        "Claim is not in a reviewable state"
      )
    })
  })

  describe("cancelPolicy", () => {
    it("should cancel an active policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy" as any).mockResolvedValue({
        id: "pol_01", status: "active", premium: 1200,
        start_date: new Date("2026-01-01"), end_date: new Date("2027-01-01"),
      })
      jest.spyOn(service, "updateInsPolicys" as any).mockResolvedValue({
        id: "pol_01", status: "cancelled",
      })

      const result = await service.cancelPolicy("pol_01", "Customer request")
      expect(result.status).toBe("cancelled")
    })

    it("should reject cancelling an already cancelled policy", async () => {
      jest.spyOn(service, "retrieveInsPolicy" as any).mockResolvedValue({
        id: "pol_01", status: "cancelled",
      })

      await expect(service.cancelPolicy("pol_01")).rejects.toThrow("Policy is already cancelled")
    })
  })

  describe("createPolicy", () => {
    it("should reject policy with zero coverage", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_01", productId: "prod_01", planType: "basic",
          coverageAmount: 0, premium: 100, startDate: new Date(),
        })
      ).rejects.toThrow("Coverage amount must be greater than zero")
    })

    it("should reject policy with negative premium", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_01", productId: "prod_01", planType: "basic",
          coverageAmount: 50000, premium: -100, startDate: new Date(),
        })
      ).rejects.toThrow("Premium must be greater than zero")
    })
  })
})
