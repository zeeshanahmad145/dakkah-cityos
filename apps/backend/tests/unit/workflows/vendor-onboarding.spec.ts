jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Vendor Onboarding Workflow", () => {
  let submitApplicationStep: any
  let verifyDocumentsStep: any
  let setupVendorStoreStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/vendor-onboarding.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    submitApplicationStep = calls.find((c: any) => c[0] === "submit-vendor-application-step")?.[1]
    verifyDocumentsStep = calls.find((c: any) => c[0] === "verify-vendor-documents-step")?.[1]
    setupVendorStoreStep = calls.find((c: any) => c[0] === "setup-vendor-store-step")?.[1]
  })

  const validInput = {
    businessName: "Acme Corp",
    email: "vendor@acme.com",
    contactPerson: "John Doe",
    taxId: "TAX-123456",
    category: "electronics",
    tenantId: "tenant_01",
  }

  describe("submitApplicationStep", () => {
    it("should create a vendor with onboarding status", async () => {
      const mockVendor = { id: "vendor_01", name: "Acme Corp", status: "onboarding" }
      const container = mockContainer({
        vendor: { createVendors: jest.fn().mockResolvedValue(mockVendor) },
      })
      const result = await submitApplicationStep(validInput, { container })
      expect(result.vendor).toEqual(mockVendor)
      expect(result.vendor.status).toBe("onboarding")
    })

    it("should pass correct vendor creation params", async () => {
      const createVendors = jest.fn().mockResolvedValue({ id: "vendor_01" })
      const container = mockContainer({ vendor: { createVendors } })
      await submitApplicationStep(validInput, { container })
      expect(createVendors).toHaveBeenCalledWith({
        name: "Acme Corp",
        email: "vendor@acme.com",
        contact_person: "John Doe",
        tax_id: "TAX-123456",
        status: "onboarding",
        verification_status: "pending",
      })
    })

    it("should propagate vendor creation errors", async () => {
      const container = mockContainer({
        vendor: { createVendors: jest.fn().mockRejectedValue(new Error("Duplicate vendor")) },
      })
      await expect(submitApplicationStep(validInput, { container })).rejects.toThrow("Duplicate vendor")
    })
  })

  describe("verifyDocumentsStep", () => {
    it("should update vendor verification status to documents_verified", async () => {
      const updateVendors = jest.fn().mockResolvedValue({ id: "vendor_01", verification_status: "documents_verified" })
      const container = mockContainer({ vendor: { updateVendors } })
      const result = await verifyDocumentsStep({ vendorId: "vendor_01" }, { container })
      expect(result.verified).toBe(true)
    })

    it("should call updateVendors with correct params", async () => {
      const updateVendors = jest.fn().mockResolvedValue({})
      const container = mockContainer({ vendor: { updateVendors } })
      await verifyDocumentsStep({ vendorId: "vendor_01" }, { container })
      expect(updateVendors).toHaveBeenCalledWith({
        id: "vendor_01",
        verification_status: "documents_verified",
      })
    })

    it("should propagate verification errors", async () => {
      const container = mockContainer({
        vendor: { updateVendors: jest.fn().mockRejectedValue(new Error("Verification failed")) },
      })
      await expect(verifyDocumentsStep({ vendorId: "vendor_01" }, { container })).rejects.toThrow("Verification failed")
    })
  })

  describe("setupVendorStoreStep", () => {
    it("should create a store for the vendor", async () => {
      const mockStore = { id: "store_01", vendor_id: "vendor_01" }
      const container = mockContainer({
        store: { createStores: jest.fn().mockResolvedValue(mockStore) },
      })
      const result = await setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      expect(result.store).toEqual(mockStore)
    })

    it("should pass vendor and tenant IDs to store creation", async () => {
      const createStores = jest.fn().mockResolvedValue({ id: "store_01" })
      const container = mockContainer({ store: { createStores } })
      await setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      expect(createStores).toHaveBeenCalledWith({
        vendor_id: "vendor_01",
        tenant_id: "tenant_01",
      })
    })

    it("should propagate store creation errors", async () => {
      const container = mockContainer({
        store: { createStores: jest.fn().mockRejectedValue(new Error("Store limit reached")) },
      })
      await expect(
        setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      ).rejects.toThrow("Store limit reached")
    })
  })
})
