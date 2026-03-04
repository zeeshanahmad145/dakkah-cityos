import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => ({ run: vi.fn(), config, fn })),
  createStep: vi.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: class { constructor(data, comp) { Object.assign(this, data); this.__compensation = comp; } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Vendor Onboarding Workflow", () => {
  let submitApplicationStep: any
  let verifyDocumentsStep: any
  let setupVendorStoreStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/vendor-onboarding.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
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
      const mockVendor = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "vendor_01", name: "Acme Corp", status: "onboarding" }
      const container = mockContainer({
        vendor: { createVendors: vi.fn().mockResolvedValue(mockVendor) },
      })
      const result = await submitApplicationStep(validInput, { container })
      expect(result.vendor).toEqual(mockVendor)
      expect(result.vendor.status).toBe("onboarding")
    })

    it("should pass correct vendor creation params", async () => {
      const createVendors = vi.fn().mockResolvedValue({ id: "vendor_01" })
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
        vendor: { createVendors: vi.fn().mockRejectedValue(new Error("Duplicate vendor")) },
      })
      await expect(submitApplicationStep(validInput, { container })).rejects.toThrow("Duplicate vendor")
    })
  })

  describe("verifyDocumentsStep", () => {
    it("should update vendor verification status to documents_verified", async () => {
      const updateVendors = vi.fn().mockResolvedValue({ id: "vendor_01", verification_status: "documents_verified" })
      const container = mockContainer({ vendor: { updateVendors } })
      const result = await verifyDocumentsStep({ vendorId: "vendor_01" }, { container })
      expect(result.verified).toBe(true)
    })

    it("should call updateVendors with correct params", async () => {
      const updateVendors = vi.fn().mockResolvedValue({})
      const container = mockContainer({ vendor: { updateVendors } })
      await verifyDocumentsStep({ vendorId: "vendor_01" }, { container })
      expect(updateVendors).toHaveBeenCalledWith({
        id: "vendor_01",
        verification_status: "documents_verified",
      })
    })

    it("should propagate verification errors", async () => {
      const container = mockContainer({
        vendor: { updateVendors: vi.fn().mockRejectedValue(new Error("Verification failed")) },
      })
      await expect(verifyDocumentsStep({ vendorId: "vendor_01" }, { container })).rejects.toThrow("Verification failed")
    })
  })

  describe("setupVendorStoreStep", () => {
    it("should create a store for the vendor", async () => {
      const mockStore = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "store_01", vendor_id: "vendor_01" }
      const container = mockContainer({
        store: { createStores: vi.fn().mockResolvedValue(mockStore) },
      })
      const result = await setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      expect(result.store).toEqual(mockStore)
    })

    it("should pass vendor and tenant IDs to store creation", async () => {
      const createStores = vi.fn().mockResolvedValue({ id: "store_01" })
      const container = mockContainer({ store: { createStores } })
      await setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      expect(createStores).toHaveBeenCalledWith({
        vendor_id: "vendor_01",
        tenant_id: "tenant_01",
      })
    })

    it("should propagate store creation errors", async () => {
      const container = mockContainer({
        store: { createStores: vi.fn().mockRejectedValue(new Error("Store limit reached")) },
      })
      await expect(
        setupVendorStoreStep({ vendorId: "vendor_01", tenantId: "tenant_01" }, { container })
      ).rejects.toThrow("Store limit reached")
    })
  })
})
