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
        async retrievePropertyListing(_id: string): Promise<any> { return null }
        async updatePropertyListings(_data: any): Promise<any> { return {} }
        async listViewingAppointments(_filter: any): Promise<any> { return [] }
        async createViewingAppointments(_data: any): Promise<any> { return {} }
        async createPropertyValuations(_data: any): Promise<any> { return {} }
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

import RealEstateModuleService from "../../../src/modules/real-estate/service"

describe("RealEstateModuleService", () => {
  let service: RealEstateModuleService

  beforeEach(() => {
    service = new RealEstateModuleService()
    jest.clearAllMocks()
  })

  describe("publishProperty", () => {
    it("should publish a property with a price", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "draft", price: 250000,
      })
      jest.spyOn(service, "updatePropertyListings" as any).mockResolvedValue({
        id: "prop_01", status: "published",
      })

      const result = await service.publishProperty("prop_01")
      expect(result.status).toBe("published")
    })

    it("should reject publishing without a price", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "draft", price: null, rent_price: null,
      })

      await expect(service.publishProperty("prop_01")).rejects.toThrow(
        "Property must have a price before publishing"
      )
    })

    it("should reject publishing an already published property", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "published", price: 250000,
      })

      await expect(service.publishProperty("prop_01")).rejects.toThrow(
        "Property is already published"
      )
    })
  })

  describe("scheduleViewing", () => {
    it("should schedule a viewing for a published property", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "published",
      })
      jest.spyOn(service, "listViewingAppointments" as any).mockResolvedValue([])
      jest.spyOn(service, "createViewingAppointments" as any).mockResolvedValue({
        id: "view_01", property_listing_id: "prop_01", status: "scheduled",
      })

      const result = await service.scheduleViewing("prop_01", "viewer_01", futureDate)
      expect(result.status).toBe("scheduled")
    })

    it("should reject viewing for non-published property", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "draft",
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await expect(service.scheduleViewing("prop_01", "viewer_01", futureDate)).rejects.toThrow(
        "Property is not available for viewings"
      )
    })

    it("should reject duplicate viewing for same viewer", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "published",
      })
      jest.spyOn(service, "listViewingAppointments" as any).mockResolvedValue([
        { id: "view_01", viewer_id: "viewer_01", status: "scheduled" },
      ])

      await expect(service.scheduleViewing("prop_01", "viewer_01", futureDate)).rejects.toThrow(
        "You already have a scheduled viewing for this property"
      )
    })

    it("should reject viewing with past date", async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      await expect(service.scheduleViewing("prop_01", "viewer_01", pastDate)).rejects.toThrow(
        "Viewing date must be in the future"
      )
    })
  })

  describe("makeOffer", () => {
    it("should create an offer on a published property", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "published", price: 250000,
      })
      jest.spyOn(service, "createPropertyValuations" as any).mockResolvedValue({
        id: "offer_01", offered_amount: 240000,
      })

      const result = await service.makeOffer("prop_01", "buyer_01", 240000)
      expect(result.offered_amount).toBe(240000)
    })

    it("should reject offer with zero amount", async () => {
      await expect(service.makeOffer("prop_01", "buyer_01", 0)).rejects.toThrow(
        "Offer amount must be greater than zero"
      )
    })

    it("should reject offer on non-published property", async () => {
      jest.spyOn(service, "retrievePropertyListing" as any).mockResolvedValue({
        id: "prop_01", status: "draft",
      })

      await expect(service.makeOffer("prop_01", "buyer_01", 240000)).rejects.toThrow(
        "Property is not accepting offers"
      )
    })
  })
})
