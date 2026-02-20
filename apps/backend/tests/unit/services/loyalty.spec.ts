jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain, nullable: () => chain, default: () => chain, unique: () => chain,
    }
    return chain
  }
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveLoyaltyAccount(_id: string): Promise<any> { return null }
        async updateLoyaltyAccounts(_data: any): Promise<any> { return null }
        async createPointTransactions(_data: any): Promise<any> { return null }
        async retrieveLoyaltyProgram(_id: string): Promise<any> { return null }
        async listPointTransactions(_f: any, _o?: any): Promise<any> { return [] }
        async listLoyaltyAccounts(_f: any): Promise<any> { return [] }
        async createLoyaltyAccounts(_data: any): Promise<any> { return null }
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

import LoyaltyModuleService from "../../../src/modules/loyalty/service"

describe("LoyaltyModuleService", () => {
  let service: LoyaltyModuleService

  beforeEach(() => {
    service = new LoyaltyModuleService()
    jest.clearAllMocks()
  })

  describe("earnPoints", () => {
    it("should add points to active account", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount" as any).mockResolvedValue({
        id: "acc_01", status: "active", points_balance: 100, lifetime_points: 500,
        tenant_id: "t1", program_id: "p1",
      })
      jest.spyOn(service, "updateLoyaltyAccounts" as any).mockResolvedValue({})
      jest.spyOn(service, "createPointTransactions" as any).mockResolvedValue({ id: "tx_01" })
      jest.spyOn(service, "calculateTier" as any).mockResolvedValue("silver")

      const result = await service.earnPoints({ accountId: "acc_01", points: 50 })
      expect(result).toEqual({ id: "tx_01" })
    })

    it("should throw when account is not active", async () => {
      jest.spyOn(service, "retrieveLoyaltyAccount" as any).mockResolvedValue({
        id: "acc_01", status: "suspended", points_balance: 100, lifetime_points: 500,
      })

      await expect(service.earnPoints({ accountId: "acc_01", points: 50 })).rejects.toThrow()
    })
  })

  describe("checkTierUpgrade", () => {
    it("should upgrade tier when earned points in period exceed threshold", async () => {
      jest.spyOn(service, "listLoyaltyAccounts" as any).mockResolvedValue([
        {
          id: "acc_01", customer_id: "cust_01", lifetime_points: 5000,
          tier: "silver", program_id: "prog_01",
        },
      ])
      jest.spyOn(service, "retrieveLoyaltyProgram" as any).mockResolvedValue({
        id: "prog_01",
        tiers: [
          { name: "bronze", min_points: 0 },
          { name: "silver", min_points: 1000 },
          { name: "gold", min_points: 5000 },
          { name: "platinum", min_points: 10000 },
        ],
      })
      jest.spyOn(service, "listPointTransactions" as any).mockResolvedValue([
        { id: "tx_01", type: "earn", points: 3000, created_at: new Date().toISOString() },
        { id: "tx_02", type: "earn", points: 2500, created_at: new Date().toISOString() },
      ])
      jest.spyOn(service, "updateLoyaltyAccounts" as any).mockResolvedValue({})

      const result = await service.checkTierUpgrade("cust_01")
      expect(result.upgraded).toBe(true)
      expect(result.newTier).toBe("gold")
    })

    it("should not upgrade when points below next tier threshold", async () => {
      jest.spyOn(service, "listLoyaltyAccounts" as any).mockResolvedValue([
        {
          id: "acc_01", customer_id: "cust_01", lifetime_points: 800,
          tier: "bronze", program_id: "prog_01",
        },
      ])
      jest.spyOn(service, "retrieveLoyaltyProgram" as any).mockResolvedValue({
        id: "prog_01",
        tiers: [
          { name: "bronze", min_points: 0 },
          { name: "silver", min_points: 1000 },
        ],
      })
      jest.spyOn(service, "listPointTransactions" as any).mockResolvedValue([
        { id: "tx_01", type: "earn", points: 800, created_at: new Date().toISOString() },
      ])

      const result = await service.checkTierUpgrade("cust_01")
      expect(result.upgraded).toBe(false)
    })

    it("should throw when no loyalty accounts found", async () => {
      jest.spyOn(service, "listLoyaltyAccounts" as any).mockResolvedValue([])

      await expect(service.checkTierUpgrade("cust_unknown")).rejects.toThrow(
        "No loyalty account found for this customer"
      )
    })
  })

  describe("processReferralBonus", () => {
    it("should award bonus points to both referrer and referred", async () => {
      const listSpy = jest.spyOn(service, "listLoyaltyAccounts" as any)
      listSpy.mockResolvedValueOnce([{
        id: "acc_ref", customer_id: "cust_ref", points_balance: 100,
        lifetime_points: 100, status: "active", program_id: "prog_01",
      }])
      listSpy.mockResolvedValueOnce([{
        id: "acc_new", customer_id: "cust_new", points_balance: 0,
        lifetime_points: 0, status: "active", program_id: "prog_01",
      }])
      jest.spyOn(service, "earnPoints" as any).mockResolvedValue({ id: "tx_ref" })

      const result = await service.processReferralBonus("cust_ref", "cust_new")
      expect(result).toBeDefined()
      expect(result.bonusPoints).toBe(500)
    })

    it("should throw when referrer has no loyalty account", async () => {
      jest.spyOn(service, "listLoyaltyAccounts" as any).mockResolvedValue([])

      await expect(service.processReferralBonus("cust_ref", "cust_new")).rejects.toThrow(
        "Referrer does not have a loyalty account"
      )
    })
  })
})
