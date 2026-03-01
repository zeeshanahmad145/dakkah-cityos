import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type KycVerificationInput = {
  vendorId: string;
  documentType: string;
  documentId: string;
  documentUrl: string;
  fullName: string;
  dateOfBirth: string;
  country: string;
  id_document?: {
    type?: string;
    number?: string;
    expiry?: string;
    size?: number;
  };
  proof_of_address?: { type?: string; issued_date?: string; size?: number };
  business_registration?: {
    registration_number?: string;
    registration_date?: string;
    size?: number;
  };
  business_start_date?: string;
};

const VALID_DOC_TYPES = ["passport", "national_id", "drivers_license"];
const VALID_ADDRESS_TYPES = ["utility_bill", "bank_statement", "tax_document"];
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;

const submitDocumentsStep = createStep(
  "submit-kyc-documents-step",
  async (input: KycVerificationInput, { container }) => {
    const submission = {
      vendor_id: input.vendorId,
      document_type: input.documentType,
      document_id: input.documentId,
      status: "submitted",
      submitted_at: new Date(),
    };
    return new StepResponse(
      { submission },
      { vendorId: input.vendorId, documentId: input.documentId },
    );
  },
  async (
    compensationData: { vendorId: string; documentId: string } | undefined,
  ) => {
    if (!compensationData?.vendorId) return;
    try {
    } catch (error) {}
  },
);

const verifyDocumentsStep = createStep(
  "verify-kyc-documents-step",
  async (input: {
    vendorId: string;
    documentUrl: string;
    documentType: string;
    id_document?: any;
    proof_of_address?: any;
    business_registration?: any;
  }) => {
    const reasons: string[] = [];

    if (
      !input.id_document ||
      !input.id_document.type ||
      !input.id_document.number
    ) {
      reasons.push(
        "ID document is missing or incomplete (type and number required)",
      );
    } else {
      if (!VALID_DOC_TYPES.includes(input.id_document.type)) {
        reasons.push(
          `Invalid ID document type '${input.id_document.type}'. Must be one of: ${VALID_DOC_TYPES.join(", ")}`,
        );
      }
      if (
        input.id_document.size &&
        input.id_document.size > MAX_DOC_SIZE_BYTES
      ) {
        reasons.push("ID document exceeds maximum file size of 10MB");
      }
      if (
        input.id_document.expiry &&
        new Date(input.id_document.expiry) < new Date()
      ) {
        reasons.push("ID document has expired");
      }
    }

    if (!input.proof_of_address || !input.proof_of_address.type) {
      reasons.push("Proof of address document is missing or incomplete");
    } else {
      if (!VALID_ADDRESS_TYPES.includes(input.proof_of_address.type)) {
        reasons.push(
          `Invalid proof of address type '${input.proof_of_address.type}'. Must be one of: ${VALID_ADDRESS_TYPES.join(", ")}`,
        );
      }
      if (
        input.proof_of_address.size &&
        input.proof_of_address.size > MAX_DOC_SIZE_BYTES
      ) {
        reasons.push(
          "Proof of address document exceeds maximum file size of 10MB",
        );
      }
      if (input.proof_of_address.issued_date) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (new Date(input.proof_of_address.issued_date) < sixMonthsAgo) {
          reasons.push("Proof of address document is older than 6 months");
        }
      }
    }

    if (
      !input.business_registration ||
      !input.business_registration.registration_number
    ) {
      reasons.push(
        "Business registration document is missing or incomplete (registration number required)",
      );
    } else {
      if (
        input.business_registration.size &&
        input.business_registration.size > MAX_DOC_SIZE_BYTES
      ) {
        reasons.push(
          "Business registration document exceeds maximum file size of 10MB",
        );
      }
    }

    const document_valid = reasons.length === 0;

    const verification = {
      vendor_id: input.vendorId,
      document_valid,
      reasons,
      fraud_check: document_valid ? "passed" : "failed",
      verified_at: new Date(),
    };
    return new StepResponse({ verification });
  },
);

const scoreApplicantStep = createStep(
  "score-kyc-applicant-step",
  async (input: {
    vendorId: string;
    verification: any;
    business_start_date?: string;
  }) => {
    let score = 0;

    const hasIdDoc =
      input.verification.document_valid ||
      !input.verification.reasons?.some((r: string) =>
        r.toLowerCase().includes("id document"),
      );
    const hasAddress =
      input.verification.document_valid ||
      !input.verification.reasons?.some((r: string) =>
        r.toLowerCase().includes("proof of address"),
      );
    const hasBusiness =
      input.verification.document_valid ||
      !input.verification.reasons?.some((r: string) =>
        r.toLowerCase().includes("business registration"),
      );

    let docCount = 0;
    if (hasIdDoc) docCount++;
    if (hasAddress) docCount++;
    if (hasBusiness) docCount++;
    score += Math.round((docCount / 3) * 30);

    if (input.business_start_date) {
      const businessAge =
        (Date.now() - new Date(input.business_start_date).getTime()) /
        (1000 * 60 * 60 * 24 * 365);
      if (businessAge >= 5) score += 20;
      else if (businessAge >= 2) score += 15;
      else if (businessAge >= 1) score += 10;
      else score += 5;
    }

    if (hasIdDoc && input.verification.fraud_check === "passed") {
      score += 30;
    } else if (hasIdDoc) {
      score += 15;
    }

    if (hasAddress) {
      score += 20;
    }

    let riskLevel: string;
    let status: string;
    if (score >= 70) {
      riskLevel = "low";
      status = "approved";
    } else if (score >= 50) {
      riskLevel = "medium";
      status = "manual_review";
    } else {
      riskLevel = "high";
      status = "rejected";
    }

    return new StepResponse({ score, riskLevel, status });
  },
);

const decideKycStep = createStep(
  "decide-kyc-outcome-step",
  async (
    input: {
      vendorId: string;
      score: number;
      riskLevel: string;
      status: string;
    },
    { container },
  ) => {
    const approved = input.status === "approved";
    const decision = {
      vendor_id: input.vendorId,
      approved,
      status: input.status,
      score: input.score,
      risk_level: input.riskLevel,
      decided_at: new Date(),
    };

    if (input.status === "rejected") {
      try {
        const vendorModule = container.resolve("vendor") as unknown as any;
        if (vendorModule.updateVendors) {
          await vendorModule.updateVendors({
            id: input.vendorId,
            status: "rejected",
            rejection_reason: `KYC verification failed with score ${input.score}/100 (risk level: ${input.riskLevel})`,
          });
        }
      } catch (error) {}
    }

    return new StepResponse(
      { decision },
      { vendorId: input.vendorId, previousStatus: "submitted" },
    );
  },
  async (
    compensationData: { vendorId: string; previousStatus: string } | undefined,
  ) => {
    if (!compensationData?.vendorId) return;
    try {
    } catch (error) {}
  },
);

export const kycVerificationWorkflow = createWorkflow(
  "kyc-verification-workflow",
  (input: KycVerificationInput) => {
    const { submission } = submitDocumentsStep(input);
    const { verification } = verifyDocumentsStep({
      vendorId: input.vendorId,
      documentUrl: input.documentUrl,
      documentType: input.documentType,
      id_document: input.id_document,
      proof_of_address: input.proof_of_address,
      business_registration: input.business_registration,
    });
    const { score, riskLevel, status } = scoreApplicantStep({
      vendorId: input.vendorId,
      verification,
      business_start_date: input.business_start_date,
    });
    const { decision } = decideKycStep({
      vendorId: input.vendorId,
      score,
      riskLevel,
      status,
    });
    return new WorkflowResponse({ submission, decision });
  },
);
