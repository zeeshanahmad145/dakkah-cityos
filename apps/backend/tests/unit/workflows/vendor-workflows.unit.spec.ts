import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn };
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
});

describe("Vendor Onboarding Workflow", () => {
  let submitApplicationStep: any;
  let verifyDocumentsStep: any;
  let setupVendorStoreStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/vendor-onboarding.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    submitApplicationStep = calls.find(
      (c: any) => c[0] === "submit-vendor-application-step",
    )?.[1];
    verifyDocumentsStep = calls.find(
      (c: any) => c[0] === "verify-vendor-documents-step",
    )?.[1];
    setupVendorStoreStep = calls.find(
      (c: any) => c[0] === "setup-vendor-store-step",
    )?.[1];
  });

  const validInput = {
    businessName: "Test Vendor",
    email: "vendor@test.com",
    contactPerson: "John Doe",
    taxId: "TAX123",
    category: "electronics",
    tenantId: "tenant_1",
  };

  it("should submit vendor application with onboarding status", async () => {
    const vendor = { id: "vendor_1", status: "onboarding" };
    const container = mockContainer({
      vendor: { createVendors: vi.fn().mockResolvedValue(vendor) },
    });
    const result = await submitApplicationStep(validInput, { container });
    expect(result.vendor.status).toBe("onboarding");
  });

  it("should verify vendor documents", async () => {
    const verified = {
      id: "vendor_1",
      verification_status: "documents_verified",
    };
    const container = mockContainer({
      vendor: { updateVendors: vi.fn().mockResolvedValue(verified) },
    });
    const result = await verifyDocumentsStep(
      { vendorId: "vendor_1" },
      { container },
    );
    expect(result.verified).toBe(true);
  });

  it("should setup vendor store", async () => {
    const store = { id: "store_1", vendor_id: "vendor_1" };
    const container = mockContainer({
      store: { createStores: vi.fn().mockResolvedValue(store) },
    });
    const result = await setupVendorStoreStep(
      { vendorId: "vendor_1", tenantId: "tenant_1" },
      { container },
    );
    expect(result.store.vendor_id).toBe("vendor_1");
  });
});

describe("KYC Verification Workflow", () => {
  let submitDocumentsStep: any;
  let verifyDocumentsStep: any;
  let scoreApplicantStep: any;
  let decideKycStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/kyc-verification.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    submitDocumentsStep = calls.find(
      (c: any) => c[0] === "submit-kyc-documents-step",
    )?.[1];
    verifyDocumentsStep = calls.find(
      (c: any) => c[0] === "verify-kyc-documents-step",
    )?.[1];
    scoreApplicantStep = calls.find(
      (c: any) => c[0] === "score-kyc-applicant-step",
    )?.[1];
    decideKycStep = calls.find(
      (c: any) => c[0] === "decide-kyc-outcome-step",
    )?.[1];
  });

  it("should submit KYC documents", async () => {
    const result = await submitDocumentsStep(
      {
        vendorId: "v1",
        documentType: "passport",
        documentId: "DOC1",
        documentUrl: "https://example.com/doc.jpg",
        fullName: "John",
        dateOfBirth: "1990-01-01",
        country: "US",
      },
      { container: mockContainer() },
    );
    expect(result.submission.status).toBe("submitted");
  });

  it("should verify documents as valid", async () => {
    const result = await verifyDocumentsStep(
      {
        vendorId: "v1",
        documentUrl: "https://example.com/doc.jpg",
        documentType: "passport",
        id_document: { type: "passport", number: "P123456" },
        proof_of_address: { type: "utility_bill" },
        business_registration: { registration_number: "BRN123" },
      },
      { container: mockContainer() },
    );
    expect(result.verification.document_valid).toBe(true);
    expect(result.verification.fraud_check).toBe("passed");
  });

  it("should score applicant as low risk when docs valid", async () => {
    const result = await scoreApplicantStep(
      {
        vendorId: "v1",
        verification: { document_valid: true, fraud_check: "passed" },
      },
      { container: mockContainer() },
    );
    expect(result.score).toBe(80);
    expect(result.riskLevel).toBe("low");
  });

  it("should score applicant as high risk when docs invalid", async () => {
    const result = await scoreApplicantStep(
      {
        vendorId: "v1",
        verification: {
          document_valid: false,
          fraud_check: "failed",
          reasons: [
            "ID document is missing",
            "Proof of address missing",
            "Business registration missing",
          ],
        },
      },
      { container: mockContainer() },
    );
    expect(result.score).toBe(0);
    expect(result.riskLevel).toBe("high");
  });

  it("should approve KYC for score >= 60", async () => {
    const result = await decideKycStep(
      { vendorId: "v1", score: 85, riskLevel: "low", status: "approved" },
      { container: mockContainer() },
    );
    expect(result.decision.approved).toBe(true);
  });

  it("should reject KYC for score < 60", async () => {
    const result = await decideKycStep(
      { vendorId: "v1", score: 30, riskLevel: "high", status: "rejected" },
      { container: mockContainer() },
    );
    expect(result.decision.approved).toBe(false);
  });
});

describe("Product Sync Workflow", () => {
  let fetchProductsStep: any;
  let transformProductsStep: any;
  let upsertProductsStep: any;
  let verifySyncStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/product-sync.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    fetchProductsStep = calls.find(
      (c: any) => c[0] === "fetch-source-products-step",
    )?.[1];
    transformProductsStep = calls.find(
      (c: any) => c[0] === "transform-products-step",
    )?.[1];
    upsertProductsStep = calls.find(
      (c: any) => c[0] === "upsert-synced-products-step",
    )?.[1];
    verifySyncStep = calls.find(
      (c: any) => c[0] === "verify-product-sync-step",
    )?.[1];
  });

  it("should fetch products from source", async () => {
    const products = [{ id: "p1", title: "Product 1" }];
    const container = mockContainer({
      product: { listProducts: vi.fn().mockResolvedValue(products) },
    });
    const result = await fetchProductsStep(
      { sourceSystem: "medusa", targetSystem: "erp", tenantId: "t1" },
      { container },
    );
    expect(result.count).toBe(1);
  });

  it("should transform products for target system", async () => {
    const products = [
      {
        id: "p1",
        title: "Prod",
        description: "desc",
        handle: "prod",
        status: "published",
      },
    ];
    const result = await transformProductsStep(
      { products, targetSystem: "erp" },
      { container: mockContainer() },
    );
    expect(result.transformed[0].target).toBe("erp");
    expect(result.transformed[0].external_id).toBe("p1");
  });

  it("should upsert synced products", async () => {
    const transformed = [{ external_id: "p1", title: "Prod" }];
    const container = mockContainer();
    const result = await upsertProductsStep(
      { transformed, targetSystem: "erp" },
      { container },
    );
    expect(result.syncResults[0].status).toBe("synced");
  });

  it("should verify sync with no failures", async () => {
    const syncResults = [{ status: "synced" }, { status: "synced" }];
    const result = await verifySyncStep(
      { syncResults },
      { container: mockContainer() },
    );
    expect(result.verified).toBe(true);
    expect(result.failedCount).toBe(0);
    expect(result.totalCount).toBe(2);
  });
});
