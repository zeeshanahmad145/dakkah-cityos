import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type KycVerificationInput = {
  vendorId: string
  documentType: string
  documentId: string
  documentUrl: string
  fullName: string
  dateOfBirth: string
  country: string
}

const submitDocumentsStep = createStep(
  "submit-kyc-documents-step",
  async (input: KycVerificationInput, { container }) => {
    const submission = {
      vendor_id: input.vendorId,
      document_type: input.documentType,
      document_id: input.documentId,
      status: "submitted",
      submitted_at: new Date(),
    }
    return new StepResponse({ submission }, { vendorId: input.vendorId, documentId: input.documentId })
  },
  async (compensationData: { vendorId: string; documentId: string } | undefined) => {
    if (!compensationData?.vendorId) return
    try {
    } catch (error) {
    }
  }
)

const verifyDocumentsStep = createStep(
  "verify-kyc-documents-step",
  async (input: { vendorId: string; documentUrl: string; documentType: string }) => {
    const verification = {
      vendor_id: input.vendorId,
      document_valid: true,
      fraud_check: "passed",
      verified_at: new Date(),
    }
    return new StepResponse({ verification })
  }
)

const scoreApplicantStep = createStep(
  "score-kyc-applicant-step",
  async (input: { vendorId: string; verification: any }) => {
    const score = input.verification.document_valid ? 85 : 30
    const riskLevel = score >= 70 ? "low" : score >= 40 ? "medium" : "high"
    return new StepResponse({ score, riskLevel })
  }
)

const decideKycStep = createStep(
  "decide-kyc-outcome-step",
  async (input: { vendorId: string; score: number; riskLevel: string }, { container }) => {
    const approved = input.score >= 60
    const decision = {
      vendor_id: input.vendorId,
      approved,
      score: input.score,
      risk_level: input.riskLevel,
      decided_at: new Date(),
    }
    return new StepResponse({ decision }, { vendorId: input.vendorId, previousStatus: "submitted" })
  },
  async (compensationData: { vendorId: string; previousStatus: string } | undefined) => {
    if (!compensationData?.vendorId) return
    try {
    } catch (error) {
    }
  }
)

export const kycVerificationWorkflow = createWorkflow(
  "kyc-verification-workflow",
  (input: KycVerificationInput) => {
    const { submission } = submitDocumentsStep(input)
    const { verification } = verifyDocumentsStep({ vendorId: input.vendorId, documentUrl: input.documentUrl, documentType: input.documentType })
    const { score, riskLevel } = scoreApplicantStep({ vendorId: input.vendorId, verification })
    const { decision } = decideKycStep({ vendorId: input.vendorId, score, riskLevel })
    return new WorkflowResponse({ submission, decision })
  }
)
