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
        async retrievePetProfile(_id: string): Promise<any> { return null }
        async listPetProfiles(_filter: any): Promise<any> { return [] }
        async createGroomingBookings(_data: any): Promise<any> { return {} }
        async listGroomingBookings(_filter: any): Promise<any> { return [] }
        async createVetAppointments(_data: any): Promise<any> { return {} }
        async listVetAppointments(_filter: any): Promise<any> { return [] }
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

import PetServiceModuleService from "../../../src/modules/pet-service/service"

describe("PetServiceModuleService", () => {
  let service: PetServiceModuleService

  beforeEach(() => {
    service = new PetServiceModuleService()
    jest.clearAllMocks()
  })

  describe("bookPetService", () => {
    it("should book a grooming service for a pet", async () => {
      jest.spyOn(service, "retrievePetProfile" as any).mockResolvedValue({
        id: "pet_01", name: "Max", species: "dog", owner_id: "owner_01",
      })
      jest.spyOn(service, "createGroomingBookings" as any).mockResolvedValue({
        id: "sb_01", pet_id: "pet_01", service_type: "grooming", status: "scheduled",
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const result = await service.bookPetService("pet_01", "grooming", futureDate)
      expect(result.status).toBe("scheduled")
    })

    it("should book boarding for pet with valid vaccinations", async () => {
      jest.spyOn(service, "retrievePetProfile" as any).mockResolvedValue({
        id: "pet_01", name: "Max", species: "dog", owner_id: "owner_01",
      })
      const futureVax = new Date()
      futureVax.setFullYear(futureVax.getFullYear() + 1)
      jest.spyOn(service, "trackVaccinations" as any).mockResolvedValue([
        { vaccineName: "Rabies", nextDue: futureVax.toISOString() },
      ])
      jest.spyOn(service, "createGroomingBookings" as any).mockResolvedValue({
        id: "sb_01", pet_id: "pet_01", service_type: "boarding", status: "scheduled",
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const result = await service.bookPetService("pet_01", "boarding", futureDate)
      expect(result.status).toBe("scheduled")
    })

    it("should reject boarding for pet with expired vaccinations", async () => {
      jest.spyOn(service, "retrievePetProfile" as any).mockResolvedValue({
        id: "pet_01", name: "Max", species: "dog",
      })
      jest.spyOn(service, "trackVaccinations" as any).mockResolvedValue([
        { vaccineName: "Rabies", nextDue: new Date("2024-01-01").toISOString() },
      ])

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await expect(service.bookPetService("pet_01", "boarding", futureDate)).rejects.toThrow(
        "Pet must have up-to-date vaccinations for boarding services"
      )
    })

    it("should reject boarding for pet with no vaccinations", async () => {
      jest.spyOn(service, "retrievePetProfile" as any).mockResolvedValue({
        id: "pet_02", name: "Buddy", species: "dog",
      })
      jest.spyOn(service, "trackVaccinations" as any).mockResolvedValue([])

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await expect(service.bookPetService("pet_02", "boarding", futureDate)).rejects.toThrow(
        "Pet must have up-to-date vaccinations for boarding services"
      )
    })

    it("should reject booking without required fields", async () => {
      await expect(service.bookPetService("", "grooming", new Date())).rejects.toThrow(
        "Pet ID and service type are required"
      )
    })
  })

  describe("updateVaccinationRecord", () => {
    it("should create a vaccination record", async () => {
      jest.spyOn(service, "retrievePetProfile" as any).mockResolvedValue({
        id: "pet_01", name: "Max", species: "dog", owner_id: "owner_01",
      })
      jest.spyOn(service, "createVetAppointments" as any).mockResolvedValue({
        id: "vac_01", pet_id: "pet_01", treatment: "Rabies",
        status: "completed",
      })

      const result = await service.updateVaccinationRecord("pet_01", {
        vaccineName: "Rabies",
        dateAdministered: new Date(),
        expiryDate: new Date("2027-03-15"),
        veterinarian: "Dr. Vet",
      })
      expect(result.treatment).toBe("Rabies")
    })

    it("should reject record without vaccine name", async () => {
      await expect(service.updateVaccinationRecord("pet_01", {
        vaccineName: "",
        dateAdministered: new Date(),
      })).rejects.toThrow("Vaccine name and date administered are required")
    })
  })

  describe("calculateServiceCost", () => {
    it("should calculate grooming cost for small dog", async () => {
      const result = await service.calculateServiceCost("grooming", "small", 1)
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.serviceType).toBe("grooming")
    })

    it("should increase cost for larger pets", async () => {
      const small = await service.calculateServiceCost("grooming", "small", 1)
      const large = await service.calculateServiceCost("grooming", "large", 1)
      expect(large.totalCost).toBeGreaterThan(small.totalCost)
    })
  })
})
