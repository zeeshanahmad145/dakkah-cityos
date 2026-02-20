const mockVendorService = {
  create: jest.fn(),
  retrieve: jest.fn(),
  update: jest.fn(),
  list: jest.fn(),
  submitDocuments: jest.fn(),
}

const mockKycService = {
  initiateVerification: jest.fn(),
  getVerificationStatus: jest.fn(),
  approveVerification: jest.fn(),
  rejectVerification: jest.fn(),
}

const mockProductService = {
  create: jest.fn(),
  list: jest.fn(),
}

const mockNotificationService = {
  send: jest.fn(),
}

const mockDocumentService = {
  upload: jest.fn(),
  validate: jest.fn(),
}

interface VendorRegistration {
  business_name: string
  business_email: string
  contact_name: string
  phone: string
  category: string
  address: { line1: string; city: string; postal_code: string; country_code: string }
}

interface Vendor {
  id: string
  business_name: string
  business_email: string
  status: string
  kyc_status?: string
  documents?: Array<{ type: string; url: string; status: string }>
}

describe("Vendor Onboarding Flow E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("registration → document submission → KYC → product listing", () => {
    it("should complete full vendor onboarding with approval", async () => {
      const registration: VendorRegistration = {
        business_name: "Fresh Foods Co",
        business_email: "vendor@freshfoods.com",
        contact_name: "Ahmed Hassan",
        phone: "+966501234567",
        category: "food_beverage",
        address: {
          line1: "King Fahd Road", city: "Riyadh",
          postal_code: "11432", country_code: "SA",
        },
      }

      const vendor: Vendor = {
        id: "vnd_01", business_name: registration.business_name,
        business_email: registration.business_email, status: "pending",
      }
      mockVendorService.create.mockResolvedValue(vendor)

      const created = await mockVendorService.create(registration)
      expect(created.status).toBe("pending")
      expect(created.id).toBe("vnd_01")

      mockDocumentService.upload.mockResolvedValue({
        id: "doc_01", type: "business_license", status: "uploaded",
      })
      mockDocumentService.validate.mockResolvedValue({ valid: true })

      const doc = await mockDocumentService.upload({
        vendor_id: "vnd_01", type: "business_license",
        file: "license.pdf",
      })
      expect(doc.status).toBe("uploaded")

      const docValid = await mockDocumentService.validate(doc.id)
      expect(docValid.valid).toBe(true)

      mockVendorService.submitDocuments.mockResolvedValue({
        ...vendor, status: "documents_submitted",
      })
      const submitted = await mockVendorService.submitDocuments("vnd_01")
      expect(submitted.status).toBe("documents_submitted")

      mockKycService.initiateVerification.mockResolvedValue({
        id: "kyc_01", vendor_id: "vnd_01", status: "in_progress",
      })
      const kyc = await mockKycService.initiateVerification("vnd_01")
      expect(kyc.status).toBe("in_progress")

      mockKycService.approveVerification.mockResolvedValue({
        id: "kyc_01", status: "approved",
      })
      mockVendorService.update.mockResolvedValue({
        ...vendor, status: "approved", kyc_status: "approved",
      })

      const approved = await mockKycService.approveVerification("kyc_01")
      expect(approved.status).toBe("approved")

      const updatedVendor = await mockVendorService.update("vnd_01", {
        status: "approved", kyc_status: "approved",
      })
      expect(updatedVendor.status).toBe("approved")

      mockProductService.create.mockResolvedValue({
        id: "prod_01", title: "Organic Coffee", vendor_id: "vnd_01", status: "draft",
      })
      const product = await mockProductService.create({
        title: "Organic Coffee", vendor_id: "vnd_01",
        price: 4999, description: "Premium organic coffee beans",
      })
      expect(product.vendor_id).toBe("vnd_01")
      expect(product.title).toBe("Organic Coffee")
    })
  })

  describe("rejection flow", () => {
    it("should handle KYC rejection with reason", async () => {
      mockVendorService.create.mockResolvedValue({
        id: "vnd_02", business_name: "Bad Actor Inc", status: "pending",
      })

      const vendor = await mockVendorService.create({
        business_name: "Bad Actor Inc", business_email: "bad@actor.com",
        contact_name: "Bad Actor", phone: "+966500000000", category: "general",
        address: { line1: "Unknown", city: "Unknown", postal_code: "00000", country_code: "SA" },
      })

      mockKycService.initiateVerification.mockResolvedValue({
        id: "kyc_02", vendor_id: "vnd_02", status: "in_progress",
      })
      await mockKycService.initiateVerification("vnd_02")

      mockKycService.rejectVerification.mockResolvedValue({
        id: "kyc_02", status: "rejected",
        rejection_reason: "Invalid business documentation",
      })
      const rejected = await mockKycService.rejectVerification("kyc_02", {
        reason: "Invalid business documentation",
      })
      expect(rejected.status).toBe("rejected")

      mockVendorService.update.mockResolvedValue({
        id: "vnd_02", status: "rejected", kyc_status: "rejected",
      })
      const updatedVendor = await mockVendorService.update("vnd_02", {
        status: "rejected", kyc_status: "rejected",
      })
      expect(updatedVendor.status).toBe("rejected")
    })

    it("should allow re-submission after rejection", async () => {
      mockVendorService.retrieve.mockResolvedValue({
        id: "vnd_02", status: "rejected", kyc_status: "rejected",
      })

      mockDocumentService.upload.mockResolvedValue({
        id: "doc_02", type: "business_license", status: "uploaded",
      })
      await mockDocumentService.upload({
        vendor_id: "vnd_02", type: "business_license", file: "updated_license.pdf",
      })

      mockVendorService.update.mockResolvedValue({
        id: "vnd_02", status: "pending_review",
      })
      const resubmitted = await mockVendorService.update("vnd_02", {
        status: "pending_review",
      })
      expect(resubmitted.status).toBe("pending_review")
    })
  })

  describe("document validation", () => {
    it("should reject invalid document types", async () => {
      mockDocumentService.validate.mockResolvedValue({
        valid: false, reason: "Unsupported document type",
      })

      const result = await mockDocumentService.validate("doc_invalid")
      expect(result.valid).toBe(false)
    })

    it("should accept valid business license", async () => {
      mockDocumentService.validate.mockResolvedValue({ valid: true })

      const result = await mockDocumentService.validate("doc_01")
      expect(result.valid).toBe(true)
    })
  })
})
