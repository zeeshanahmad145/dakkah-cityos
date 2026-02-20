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
        async createLegalCases(_data: any): Promise<any> { return {} }
        async retrieveLegalCase(_id: string): Promise<any> { return null }
        async updateLegalCases(_data: any): Promise<any> { return {} }
        async listLegalCases(_filter: any): Promise<any> { return [] }
        async createRetainerAgreements(_data: any): Promise<any> { return {} }
        async listLegalConsultations(_filter: any): Promise<any> { return [] }
        async retrieveAttorneyProfile(_id: string): Promise<any> { return null }
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

import LegalModuleService from "../../../src/modules/legal/service"

describe("LegalModuleService", () => {
  let service: LegalModuleService

  beforeEach(() => {
    service = new LegalModuleService()
    jest.clearAllMocks()
  })

  describe("createCase", () => {
    it("should create a case with a generated case number", async () => {
      jest.spyOn(service, "createLegalCases" as any).mockImplementation(async (data: any) => ({
        id: "case_01", ...data,
      }))

      const result = await service.createCase("client_01", "civil")
      expect(result.case_number).toBeDefined()
      expect(result.case_number).toMatch(/^CASE-/)
      expect(result.status).toBe("open")
    })

    it("should generate unique case numbers", async () => {
      jest.spyOn(service, "createLegalCases" as any).mockImplementation(async (data: any) => ({
        id: `case_${Date.now()}`, ...data,
      }))

      const case1 = await service.createCase("client_01", "civil")
      await new Promise(resolve => setTimeout(resolve, 5))
      const case2 = await service.createCase("client_02", "criminal")
      expect(case1.case_number).not.toBe(case2.case_number)
    })

    it("should set initial status to open", async () => {
      jest.spyOn(service, "createLegalCases" as any).mockImplementation(async (data: any) => ({
        id: "case_01", ...data,
      }))

      const result = await service.createCase("client_01", "family")
      expect(result.status).toBe("open")
    })
  })

  describe("updateCaseStatus", () => {
    it("should transition from open to in_progress", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "open",
      })
      jest.spyOn(service, "updateLegalCases" as any).mockResolvedValue({
        id: "case_01", status: "in_progress",
      })

      const result = await service.updateCaseStatus("case_01", "in_progress")
      expect(result.status).toBe("in_progress")
    })

    it("should reject invalid transition from closed to open", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "closed",
      })

      await expect(service.updateCaseStatus("case_01", "open")).rejects.toThrow(
        "Closed cases can only be reopened"
      )
    })

    it("should allow reopening a closed case", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "closed",
      })
      jest.spyOn(service, "updateLegalCases" as any).mockResolvedValue({
        id: "case_01", status: "reopened",
      })

      const result = await service.updateCaseStatus("case_01", "reopened")
      expect(result.status).toBe("reopened")
    })
  })

  describe("addDocument", () => {
    it("should add a document to an open case", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "open",
      })
      jest.spyOn(service, "createRetainerAgreements" as any).mockResolvedValue({
        id: "doc_01", case_id: "case_01", title: "Contract Agreement",
      })

      const result = await service.addDocument("case_01", {
        title: "Contract Agreement",
        documentType: "contract",
        fileUrl: "https://storage.example.com/doc.pdf",
        uploadedBy: "attorney_01",
      })
      expect(result.title).toBe("Contract Agreement")
    })

    it("should reject adding document to closed case", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "closed",
      })

      await expect(service.addDocument("case_01", {
        title: "Late Doc",
        documentType: "contract",
        fileUrl: "https://storage.example.com/doc.pdf",
        uploadedBy: "attorney_01",
      })).rejects.toThrow("Cannot add documents to a closed case")
    })

    it("should reject document without title", async () => {
      await expect(service.addDocument("case_01", {
        title: "",
        documentType: "contract",
        fileUrl: "https://storage.example.com/doc.pdf",
        uploadedBy: "attorney_01",
      })).rejects.toThrow("Document title and file URL are required")
    })
  })

  describe("getBillingSummary", () => {
    it("should return billing summary for a case", async () => {
      jest.spyOn(service, "retrieveLegalCase" as any).mockResolvedValue({
        id: "case_01", status: "in_progress", hourly_rate: 250,
      })
      jest.spyOn(service, "listLegalConsultations" as any).mockResolvedValue([
        { duration_hours: 2, type: "consultation" },
        { duration_hours: 3, type: "filing" },
      ])

      const result = await service.getBillingSummary("case_01")
      expect(result.totalHours).toBe(5)
      expect(result.totalBillable).toBe(1250)
    })
  })
})
