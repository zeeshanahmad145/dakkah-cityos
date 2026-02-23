jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    }
    return chain
  }

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async createInsPolicys(_data: any): Promise<any> { return {} }
        async updateInsPolicys(_data: any): Promise<any> { return {} }
        async retrieveInsPolicy(_id: string): Promise<any> { return null }
        async listInsPolicys(_filter?: any): Promise<any> { return [] }
        async createInsClaims(_data: any): Promise<any> { return {} }
        async updateInsClaims(_data: any): Promise<any> { return {} }
        async retrieveInsClaim(_id: string): Promise<any> { return null }
        async listInsClaims(_filter?: any): Promise<any> { return [] }
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

  describe("createPolicy", () => {
    it("creates a policy with valid data and sets end date 1 year from start", async () => {
      const createSpy = jest.spyOn(service as any, "createInsPolicys").mockResolvedValue({
        id: "pol_1",
        customer_id: "cust_1",
        status: "active",
        coverage_amount: 10000,
        premium: 500,
      })

      const result = await service.createPolicy({
        customerId: "cust_1",
        productId: "prod_1",
        planType: "comprehensive",
        coverageAmount: 10000,
        premium: 500,
        startDate: new Date("2025-01-01"),
      })

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust_1",
          status: "active",
          coverage_amount: 10000,
        })
      )
      const callArg = createSpy.mock.calls[0][0]
      expect(new Date(callArg.end_date).getFullYear()).toBe(2026)
    })

    it("throws when coverage amount is zero or negative", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_1",
          productId: "prod_1",
          planType: "basic",
          coverageAmount: 0,
          premium: 100,
          startDate: new Date(),
        })
      ).rejects.toThrow("Coverage amount must be greater than zero")
    })

    it("throws when premium is zero or negative", async () => {
      await expect(
        service.createPolicy({
          customerId: "cust_1",
          productId: "prod_1",
          planType: "basic",
          coverageAmount: 5000,
          premium: -10,
          startDate: new Date(),
        })
      ).rejects.toThrow("Premium must be greater than zero")
    })

    it("generates a unique policy number starting with POL-", async () => {
      const createSpy = jest.spyOn(service as any, "createInsPolicys").mockResolvedValue({ id: "pol_1" })

      await service.createPolicy({
        customerId: "cust_1",
        productId: "prod_1",
        planType: "basic",
        coverageAmount: 5000,
        premium: 200,
        startDate: new Date(),
      })

      const callArg = createSpy.mock.calls[0][0]
      expect(callArg.policy_number).toMatch(/^POL-/)
    })
  })

  describe("fileInsuranceClaim", () => {
    it("files a claim on an active policy", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "active",
        coverage_amount: 10000,
      })

      const createClaimSpy = jest.spyOn(service as any, "createInsClaims").mockResolvedValue({
        id: "clm_1",
        policy_id: "pol_1",
        status: "pending",
        claim_amount: 2000,
      })

      const result = await service.fileInsuranceClaim("pol_1", "Water damage", 2000)

      expect(createClaimSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          policy_id: "pol_1",
          description: "Water damage",
          claim_amount: 2000,
          status: "pending",
        })
      )
    })

    it("throws when policy is not active", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "cancelled",
        coverage_amount: 10000,
      })

      await expect(
        service.fileInsuranceClaim("pol_1", "Damage", 1000)
      ).rejects.toThrow("Policy is not active")
    })

    it("throws when claim amount exceeds coverage limit", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "active",
        coverage_amount: 5000,
      })

      await expect(
        service.fileInsuranceClaim("pol_1", "Major damage", 6000)
      ).rejects.toThrow("Claim amount exceeds coverage limit")
    })

    it("throws when claim description is empty", async () => {
      await expect(
        service.fileInsuranceClaim("pol_1", "   ", 1000)
      ).rejects.toThrow("Claim description is required")
    })

    it("throws when claim amount is zero or negative", async () => {
      await expect(
        service.fileInsuranceClaim("pol_1", "Damage", 0)
      ).rejects.toThrow("Claim amount must be greater than zero")
    })
  })

  describe("processInsuranceClaim", () => {
    it("approves a pending claim with payout equal to claim amount", async () => {
      jest.spyOn(service as any, "retrieveInsClaim").mockResolvedValue({
        id: "clm_1",
        status: "pending",
        claim_amount: 3000,
      })

      const updateSpy = jest.spyOn(service as any, "updateInsClaims").mockResolvedValue({
        id: "clm_1",
        status: "approved",
        payout_amount: 3000,
      })

      const result = await service.processInsuranceClaim("clm_1", "approved", "Verified damage")

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "approved",
          payout_amount: 3000,
          decision_notes: "Verified damage",
        })
      )
    })

    it("rejects a claim with zero payout", async () => {
      jest.spyOn(service as any, "retrieveInsClaim").mockResolvedValue({
        id: "clm_1",
        status: "pending",
        claim_amount: 3000,
      })

      const updateSpy = jest.spyOn(service as any, "updateInsClaims").mockResolvedValue({
        id: "clm_1",
        status: "rejected",
        payout_amount: 0,
      })

      await service.processInsuranceClaim("clm_1", "rejected", "Fraud suspected")

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "rejected",
          payout_amount: 0,
        })
      )
    })

    it("throws when claim is not in a reviewable state", async () => {
      jest.spyOn(service as any, "retrieveInsClaim").mockResolvedValue({
        id: "clm_1",
        status: "approved",
      })

      await expect(
        service.processInsuranceClaim("clm_1", "rejected")
      ).rejects.toThrow("Claim is not in a reviewable state")
    })
  })

  describe("cancelPolicy", () => {
    it("cancels an active policy with reason", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "active",
      })

      const updateSpy = jest.spyOn(service as any, "updateInsPolicys").mockResolvedValue({
        id: "pol_1",
        status: "cancelled",
        cancellation_reason: "No longer needed",
      })

      const result = await service.cancelPolicy("pol_1", "No longer needed")

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancellation_reason: "No longer needed",
        })
      )
    })

    it("throws when policy is already cancelled", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "cancelled",
      })

      await expect(service.cancelPolicy("pol_1")).rejects.toThrow("Policy is already cancelled")
    })
  })

  describe("getPolicyDetails", () => {
    it("returns policy details with claims and remaining coverage", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "active",
        coverage_amount: 10000,
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })

      jest.spyOn(service as any, "listInsClaims").mockResolvedValue([
        { id: "clm_1", claim_amount: 2000, payout_amount: 2000 },
        { id: "clm_2", claim_amount: 1000, payout_amount: 1000 },
      ])

      const result = await service.getPolicyDetails("pol_1")

      expect(result.claims).toHaveLength(2)
      expect(result.totalClaimed).toBe(3000)
      expect(result.remainingCoverage).toBe(7000)
      expect(result.isExpired).toBe(false)
    })

    it("marks expired policies correctly", async () => {
      jest.spyOn(service as any, "retrieveInsPolicy").mockResolvedValue({
        id: "pol_1",
        status: "active",
        coverage_amount: 5000,
        end_date: new Date("2020-01-01"),
      })

      jest.spyOn(service as any, "listInsClaims").mockResolvedValue([])

      const result = await service.getPolicyDetails("pol_1")

      expect(result.isExpired).toBe(true)
      expect(result.remainingCoverage).toBe(5000)
    })
  })
})
