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
        async retrieveParkingZone(_id: string): Promise<any> { return null }
        async listParkingSessions(_filter: any): Promise<any> { return [] }
        async createParkingSessions(_data: any): Promise<any> { return {} }
        async retrieveParkingSession(_id: string): Promise<any> { return null }
        async updateParkingSessions(_data: any): Promise<any> { return {} }
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

import ParkingModuleService from "../../../src/modules/parking/service"

describe("ParkingModuleService", () => {
  let service: ParkingModuleService

  beforeEach(() => {
    service = new ParkingModuleService()
    jest.clearAllMocks()
  })

  describe("calculateParkingFee", () => {
    it("should calculate hourly fee for short duration", async () => {
      const entry = new Date("2026-03-15T08:00:00Z")
      const exit = new Date("2026-03-15T10:00:00Z")

      const result = await service.calculateParkingFee(entry, exit, "hourly")
      expect(result.totalFee).toBeGreaterThan(0)
      expect(result.durationHours).toBe(2)
    })

    it("should calculate daily rate for long duration", async () => {
      const entry = new Date("2026-03-15T08:00:00Z")
      const exit = new Date("2026-03-16T08:00:00Z")

      const result = await service.calculateParkingFee(entry, exit, "daily")
      expect(result.totalFee).toBeGreaterThan(0)
      expect(result.durationHours).toBe(24)
    })

    it("should reject zero duration (same entry/exit time)", async () => {
      const entry = new Date("2026-03-15T08:00:00Z")

      await expect(service.calculateParkingFee(entry, entry, "hourly")).rejects.toThrow(
        "Exit time must be after entry time"
      )
    })

    it("should calculate partial hour fee rounded up", async () => {
      const entry = new Date("2026-03-15T08:00:00Z")
      const exit = new Date("2026-03-15T08:30:00Z")

      const result = await service.calculateParkingFee(entry, exit, "hourly")
      expect(result.durationHours).toBe(1)
      expect(result.totalFee).toBe(5)
    })
  })

  describe("reserveSpotAdvanced", () => {
    it("should reserve a spot in an available zone", async () => {
      jest.spyOn(service, "retrieveParkingZone" as any).mockResolvedValue({
        id: "zone_01", status: "active", total_spots: 50, hourly_rate: 5,
      })
      jest.spyOn(service, "listParkingSessions" as any).mockResolvedValue(
        Array(10).fill({ status: "active" })
      )
      jest.spyOn(service, "createParkingSessions" as any).mockResolvedValue({
        id: "ses_01", zone_id: "zone_01", status: "active",
      })

      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      const result = await service.reserveSpotAdvanced("zone_01", "car", futureDate, 2)
      expect(result).toBeDefined()
    })

    it("should reject when no spots available", async () => {
      jest.spyOn(service, "retrieveParkingZone" as any).mockResolvedValue({
        id: "zone_01", status: "active", total_spots: 5, hourly_rate: 5,
      })
      jest.spyOn(service, "listParkingSessions" as any).mockResolvedValue(
        Array(5).fill({ status: "active" })
      )

      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      await expect(
        service.reserveSpotAdvanced("zone_01", "car", futureDate, 2)
      ).rejects.toThrow("No available parking spots in this lot")
    })

    it("should reject zero duration", async () => {
      await expect(
        service.reserveSpotAdvanced("zone_01", "car", new Date(), 0)
      ).rejects.toThrow("Duration must be greater than zero")
    })
  })

  describe("calculateFee", () => {
    it("should return hourly rate and total for a zone", async () => {
      jest.spyOn(service, "retrieveParkingZone" as any).mockResolvedValue({
        id: "zone_01", hourly_rate: 5,
      })

      const result = await service.calculateFee("zone_01", 3)
      expect(result.hourlyRate).toBe(5)
      expect(result.totalFee).toBe(15)
    })

    it("should use default rate when not set", async () => {
      jest.spyOn(service, "retrieveParkingZone" as any).mockResolvedValue({
        id: "zone_01",
      })

      const result = await service.calculateFee("zone_01", 2)
      expect(result.hourlyRate).toBe(5)
      expect(result.totalFee).toBe(10)
    })
  })
})
