import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn }
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("KYC Verification Workflow", () => {
  let submitDocumentsStep: any
  let verifyDocumentsStep: any
  let scoreApplicantStep: any
  let decideKycStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/kyc-verification.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    submitDocumentsStep = calls.find((c: any) => c[0] === "submit-kyc-documents-step")?.[1]
    verifyDocumentsStep = calls.find((c: any) => c[0] === "verify-kyc-documents-step")?.[1]
    scoreApplicantStep = calls.find((c: any) => c[0] === "score-kyc-applicant-step")?.[1]
    decideKycStep = calls.find((c: any) => c[0] === "decide-kyc-outcome-step")?.[1]
  })

  describe("submitDocumentsStep", () => {
    it("should create a submission record with status submitted", async () => {
      const input = {
        vendorId: "vendor_1",
        documentType: "passport",
        documentId: "doc_1",
        documentUrl: "https://example.com/doc.pdf",
        fullName: "John Doe",
        dateOfBirth: "1990-01-01",
        country: "US",
      }
      const result = await submitDocumentsStep(input, { container: mockContainer() })
      expect(result.submission.vendor_id).toBe("vendor_1")
      expect(result.submission.status).toBe("submitted")
      expect(result.submission.document_type).toBe("passport")
      expect(result.submission.submitted_at).toBeInstanceOf(Date)
    })
  })

  describe("verifyDocumentsStep", () => {
    it("should pass verification with all valid documents", async () => {
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        id_document: { type: "passport", number: "ABC123", expiry: "2030-01-01" },
        proof_of_address: { type: "utility_bill", issued_date: new Date().toISOString() },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(true)
      expect(result.verification.reasons).toHaveLength(0)
      expect(result.verification.fraud_check).toBe("passed")
    })

    it("should fail when ID document is missing", async () => {
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        proof_of_address: { type: "utility_bill" },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(false)
      expect(result.verification.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("ID document")])
      )
    })

    it("should fail for invalid document type", async () => {
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        id_document: { type: "invalid_type", number: "ABC123" },
        proof_of_address: { type: "utility_bill" },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(false)
      expect(result.verification.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("Invalid ID document type")])
      )
    })

    it("should fail for expired ID document", async () => {
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        id_document: { type: "passport", number: "ABC123", expiry: "2020-01-01" },
        proof_of_address: { type: "utility_bill" },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(false)
      expect(result.verification.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("expired")])
      )
    })

    it("should fail for oversized documents", async () => {
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        id_document: { type: "passport", number: "ABC123", size: 20 * 1024 * 1024 },
        proof_of_address: { type: "utility_bill" },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(false)
      expect(result.verification.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("10MB")])
      )
    })

    it("should fail for proof of address older than 6 months", async () => {
      const oldDate = new Date()
      oldDate.setMonth(oldDate.getMonth() - 8)
      const input = {
        vendorId: "vendor_1",
        documentUrl: "https://example.com/doc.pdf",
        documentType: "passport",
        id_document: { type: "passport", number: "ABC123" },
        proof_of_address: { type: "utility_bill", issued_date: oldDate.toISOString() },
        business_registration: { registration_number: "BRN-001" },
      }
      const result = await verifyDocumentsStep(input)
      expect(result.verification.document_valid).toBe(false)
      expect(result.verification.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("older than 6 months")])
      )
    })
  })

  describe("scoreApplicantStep", () => {
    it("should score high (approved) for fully valid verification with established business", async () => {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 6)
      const result = await scoreApplicantStep({
        vendorId: "vendor_1",
        verification: { document_valid: true, fraud_check: "passed", reasons: [] },
        business_start_date: fiveYearsAgo.toISOString(),
      })
      expect(result.score).toBeGreaterThanOrEqual(70)
      expect(result.riskLevel).toBe("low")
      expect(result.status).toBe("approved")
    })

    it("should score medium (manual_review) for partially valid verification", async () => {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const result = await scoreApplicantStep({
        vendorId: "vendor_1",
        verification: {
          document_valid: false,
          fraud_check: "failed",
          reasons: ["Business registration document is missing or incomplete (registration number required)"],
        },
        business_start_date: oneYearAgo.toISOString(),
      })
      expect(result.score).toBeGreaterThanOrEqual(50)
      expect(result.score).toBeLessThan(70)
      expect(result.riskLevel).toBe("medium")
      expect(result.status).toBe("manual_review")
    })

    it("should score low (rejected) for invalid verification with no business history", async () => {
      const result = await scoreApplicantStep({
        vendorId: "vendor_1",
        verification: {
          document_valid: false,
          fraud_check: "failed",
          reasons: [
            "ID document is missing or incomplete",
            "Proof of address document is missing",
            "Business registration document is missing",
          ],
        },
      })
      expect(result.score).toBeLessThan(50)
      expect(result.riskLevel).toBe("high")
      expect(result.status).toBe("rejected")
    })

    it("should award higher score for older businesses", async () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 3)
      const sixYearsAgo = new Date()
      sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6)
      const baseVerification = { document_valid: true, fraud_check: "passed", reasons: [] }

      const resultYoung = await scoreApplicantStep({
        vendorId: "v1",
        verification: baseVerification,
        business_start_date: twoYearsAgo.toISOString(),
      })
      const resultOld = await scoreApplicantStep({
        vendorId: "v2",
        verification: baseVerification,
        business_start_date: sixYearsAgo.toISOString(),
      })
      expect(resultOld.score).toBeGreaterThan(resultYoung.score)
    })
  })

  describe("decideKycStep", () => {
    it("should approve vendor with approved status", async () => {
      const container = mockContainer()
      const result = await decideKycStep(
        { vendorId: "vendor_1", score: 85, riskLevel: "low", status: "approved" },
        { container }
      )
      expect(result.decision.approved).toBe(true)
      expect(result.decision.status).toBe("approved")
      expect(result.decision.score).toBe(85)
    })

    it("should not approve vendor with manual_review status", async () => {
      const container = mockContainer()
      const result = await decideKycStep(
        { vendorId: "vendor_1", score: 60, riskLevel: "medium", status: "manual_review" },
        { container }
      )
      expect(result.decision.approved).toBe(false)
      expect(result.decision.status).toBe("manual_review")
    })

    it("should reject and update vendor status on rejected", async () => {
      const updateVendors = vi.fn()
      const container = mockContainer({ vendor: { updateVendors } })
      const result = await decideKycStep(
        { vendorId: "vendor_1", score: 30, riskLevel: "high", status: "rejected" },
        { container }
      )
      expect(result.decision.approved).toBe(false)
      expect(result.decision.status).toBe("rejected")
      expect(updateVendors).toHaveBeenCalledWith(
        expect.objectContaining({ id: "vendor_1", status: "rejected" })
      )
    })

    it("should include decided_at timestamp", async () => {
      const container = mockContainer()
      const result = await decideKycStep(
        { vendorId: "vendor_1", score: 75, riskLevel: "low", status: "approved" },
        { container }
      )
      expect(result.decision.decided_at).toBeInstanceOf(Date)
    })
  })
})
