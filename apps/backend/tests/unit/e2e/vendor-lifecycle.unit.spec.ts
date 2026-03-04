import { vi } from "vitest";
const mockVendorService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  findByEmail: vi.fn(),
}

const mockProductService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  list: vi.fn(),
  count: vi.fn(),
  validate: vi.fn(),
}

const mockPaymentService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  createPayout: vi.fn(),
  getBalance: vi.fn(),
}

const mockNotificationService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  send: vi.fn(),
}

const mockImageService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  upload: vi.fn(),
  validate: vi.fn(),
}

interface VendorRegistration {
  business_name: string
  business_email: string
  contact_name: string
  phone: string
  description: string
  category: string
  address: {
    line1: string
    city: string
    postal_code: string
    country_code: string
  }
}

interface Vendor {
  id: string
  business_name: string
  business_email: string
  contact_name: string
  phone: string
  description: string
  category: string
  status: "pending" | "approved" | "rejected" | "suspended"
  tier: "basic" | "professional" | "enterprise"
  settings?: VendorSettings
  created_at: string
  rejection_reason?: string
}

interface VendorSettings {
  max_products: number
  commission_rate: number
  payout_schedule: string
  notifications_enabled: boolean
}

interface Product {
  id: string
  vendor_id: string
  title: string
  description: string
  price: number
  currency_code: string
  status: string
  images?: string[]
}

interface PayoutRecord {
  id: string
  vendor_id: string
  amount: number
  commission_deducted: number
  net_amount: number
  status: string
  scheduled_at: string
}

const TIER_PRODUCT_LIMITS: Record<string, number> = {
  basic: 50,
  professional: 500,
  enterprise: 10000,
}

const MINIMUM_PAYOUT_THRESHOLD = 25.0
const PLATFORM_COMMISSION_RATE = 0.1

async function registerVendor(
  data: VendorRegistration,
  services: {
    vendor: typeof mockVendorService
    notification: typeof mockNotificationService
  }
): Promise<Vendor> {
  if (!data.business_name || !data.business_email || !data.contact_name) {
    throw new Error("Missing required business information")
  }

  const existing = await services.vendor.findByEmail(data.business_email)
  if (existing) {
    throw new Error("Business email already registered")
  }

  const vendor: Vendor = {
    id: `vendor_${Date.now()}`,
    ...data,
    status: "pending",
    tier: "basic",
    created_at: new Date().toISOString(),
  }

  const created = await services.vendor.create(vendor)
  await services.notification.send({
    type: "vendor_verification",
    vendor_id: vendor.id,
    email: data.business_email,
  })

  return created
}

async function approveVendor(
  vendorId: string,
  services: {
    vendor: typeof mockVendorService
    notification: typeof mockNotificationService
  }
): Promise<Vendor> {
  const vendor = await services.vendor.retrieve(vendorId)
  if (!vendor) throw new Error("Vendor not found")

  const defaultSettings: VendorSettings = {
    max_products: TIER_PRODUCT_LIMITS[vendor.tier] || 50,
    commission_rate: PLATFORM_COMMISSION_RATE,
    payout_schedule: "weekly",
    notifications_enabled: true,
  }

  const updated = await services.vendor.update(vendorId, {
    status: "approved",
    settings: defaultSettings,
  })

  await services.notification.send({
    type: "vendor_approved",
    vendor_id: vendorId,
    email: vendor.business_email,
  })

  return updated
}

async function rejectVendor(
  vendorId: string,
  reason: string,
  services: {
    vendor: typeof mockVendorService
    notification: typeof mockNotificationService
  }
): Promise<Vendor> {
  const vendor = await services.vendor.retrieve(vendorId)
  if (!vendor) throw new Error("Vendor not found")

  const updated = await services.vendor.update(vendorId, {
    status: "rejected",
    rejection_reason: reason,
  })

  await services.notification.send({
    type: "vendor_rejected",
    vendor_id: vendorId,
    email: vendor.business_email,
    reason,
  })

  return updated
}

async function createVendorProduct(
  vendorId: string,
  productData: Omit<Product, "id" | "vendor_id" | "status">,
  services: {
    vendor: typeof mockVendorService
    product: typeof mockProductService
    image: typeof mockImageService
  }
): Promise<Product> {
  const vendor = await services.vendor.retrieve(vendorId)
  if (!vendor) throw new Error("Vendor not found")

  if (!productData.title || !productData.price || productData.price <= 0) {
    throw new Error("Invalid product data")
  }

  const currentCount = await services.product.count(vendorId)
  const limit = TIER_PRODUCT_LIMITS[vendor.tier] || 50
  if (currentCount >= limit) {
    throw new Error(`Product limit reached for ${vendor.tier} tier (${limit})`)
  }

  let imageUrls: string[] = []
  if (productData.images && productData.images.length > 0) {
    for (const image of productData.images) {
      const valid = await services.image.validate(image)
      if (!valid) throw new Error(`Invalid image: ${image}`)
      const uploaded = await services.image.upload(image)
      imageUrls.push(uploaded)
    }
  }

  const product: Product = {
    id: `prod_${Date.now()}`,
    vendor_id: vendorId,
    ...productData,
    images: imageUrls.length > 0 ? imageUrls : undefined,
    status: "draft",
  }

  return await services.product.create(product)
}

interface CompletedOrder {
  id: string
  vendor_id: string
  total: number
  status: string
  completed_at: string
}

async function calculateAndCreatePayout(
  vendorId: string,
  completedOrders: CompletedOrder[],
  services: {
    vendor: typeof mockVendorService
    payment: typeof mockPaymentService
  }
): Promise<PayoutRecord | null> {
  const vendor = await services.vendor.retrieve(vendorId)
  if (!vendor) throw new Error("Vendor not found")

  const commissionRate = vendor.settings?.commission_rate || PLATFORM_COMMISSION_RATE
  const grossEarnings = completedOrders.reduce((sum: number, o: CompletedOrder) => sum + o.total, 0)
  const commissionDeducted = Math.round(grossEarnings * commissionRate * 100) / 100
  const netAmount = Math.round((grossEarnings - commissionDeducted) * 100) / 100

  if (netAmount < MINIMUM_PAYOUT_THRESHOLD) {
    return null
  }

  const payout: PayoutRecord = {
    id: `payout_${Date.now()}`,
    vendor_id: vendorId,
    amount: grossEarnings,
    commission_deducted: commissionDeducted,
    net_amount: netAmount,
    status: "scheduled",
    scheduled_at: new Date().toISOString(),
  }

  await services.payment.createPayout(payout)
  return payout
}

async function processScheduledPayouts(
  payouts: PayoutRecord[],
  services: {
    payment: typeof mockPaymentService
    notification: typeof mockNotificationService
  }
): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  for (const payout of payouts) {
    try {
      await services.payment.createPayout({ ...payout, status: "processing" })
      await services.notification.send({
        type: "payout_processed",
        vendor_id: payout.vendor_id,
        amount: payout.net_amount,
      })
      processed++
    } catch {
      failed++
    }
  }

  return { processed, failed }
}

describe("Vendor Lifecycle", () => {
  beforeEach(() => vi.clearAllMocks())

  const services = {
    vendor: mockVendorService,
    product: mockProductService,
    payment: mockPaymentService,
    notification: mockNotificationService,
    image: mockImageService,
  }

  const sampleRegistration: VendorRegistration = {
    business_name: "Acme Supplies",
    business_email: "vendor@acme.com",
    contact_name: "John Doe",
    phone: "+1234567890",
    description: "Quality supplies for all needs",
    category: "general",
    address: {
      line1: "123 Commerce St",
      city: "Portland",
      postal_code: "97201",
      country_code: "US",
    },
  }

  describe("Vendor Registration", () => {
    it("should register new vendor with valid data", async () => {
      mockVendorService.findByEmail.mockResolvedValue(null)
      const created = { id: "vendor_1", ...sampleRegistration, status: "pending", tier: "basic" }
      mockVendorService.create.mockResolvedValue(created)

      const result = await registerVendor(sampleRegistration, services)

      expect(result).toEqual(created)
      expect(mockVendorService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          business_name: "Acme Supplies",
          business_email: "vendor@acme.com",
          status: "pending",
          tier: "basic",
        })
      )
    })

    it("should reject duplicate business email", async () => {
      mockVendorService.findByEmail.mockResolvedValue({ id: "vendor_existing", business_email: "vendor@acme.com" })

      await expect(registerVendor(sampleRegistration, services)).rejects.toThrow(
        "Business email already registered"
      )
      expect(mockVendorService.create).not.toHaveBeenCalled()
    })

    it("should validate required business information", async () => {
      const invalidData = { ...sampleRegistration, business_name: "", business_email: "" }

      await expect(registerVendor(invalidData as VendorRegistration, services)).rejects.toThrow(
        "Missing required business information"
      )
      expect(mockVendorService.create).not.toHaveBeenCalled()
    })

    it("should set initial vendor status to pending", async () => {
      mockVendorService.findByEmail.mockResolvedValue(null)
      mockVendorService.create.mockImplementation((v: Vendor) => Promise.resolve(v))

      const result = await registerVendor(sampleRegistration, services)

      expect(result.status).toBe("pending")
    })

    it("should send verification email on registration", async () => {
      mockVendorService.findByEmail.mockResolvedValue(null)
      mockVendorService.create.mockImplementation((v: Vendor) => Promise.resolve(v))

      await registerVendor(sampleRegistration, services)

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "vendor_verification",
          email: "vendor@acme.com",
        })
      )
    })
  })

  describe("Vendor Approval Flow", () => {
    const pendingVendor: Vendor = {
      id: "vendor_1",
      business_name: "Acme Supplies",
      business_email: "vendor@acme.com",
      contact_name: "John Doe",
      phone: "+1234567890",
      description: "Quality supplies",
      category: "general",
      status: "pending",
      tier: "basic",
      created_at: "2026-01-01T00:00:00.000Z",
    }

    it("should approve vendor and activate account", async () => {
      mockVendorService.retrieve.mockResolvedValue(pendingVendor)
      const approved = { ...pendingVendor, status: "approved", settings: { max_products: 50 } }
      mockVendorService.update.mockResolvedValue(approved)

      const result = await approveVendor("vendor_1", services)

      expect(result.status).toBe("approved")
      expect(mockVendorService.update).toHaveBeenCalledWith(
        "vendor_1",
        expect.objectContaining({ status: "approved" })
      )
    })

    it("should reject vendor with reason", async () => {
      mockVendorService.retrieve.mockResolvedValue(pendingVendor)
      const rejected = { ...pendingVendor, status: "rejected", rejection_reason: "Incomplete documentation" }
      mockVendorService.update.mockResolvedValue(rejected)

      const result = await rejectVendor("vendor_1", "Incomplete documentation", services)

      expect(result.status).toBe("rejected")
      expect(result.rejection_reason).toBe("Incomplete documentation")
      expect(mockVendorService.update).toHaveBeenCalledWith(
        "vendor_1",
        expect.objectContaining({ status: "rejected", rejection_reason: "Incomplete documentation" })
      )
    })

    it("should notify vendor of approval status", async () => {
      mockVendorService.retrieve.mockResolvedValue(pendingVendor)
      mockVendorService.update.mockResolvedValue({ ...pendingVendor, status: "approved" })

      await approveVendor("vendor_1", services)

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "vendor_approved",
          vendor_id: "vendor_1",
          email: "vendor@acme.com",
        })
      )
    })

    it("should create default vendor settings on approval", async () => {
      mockVendorService.retrieve.mockResolvedValue(pendingVendor)
      mockVendorService.update.mockImplementation((_id: string, data: any) =>
        Promise.resolve({ ...pendingVendor, ...data })
      )

      const result = await approveVendor("vendor_1", services)

      expect(mockVendorService.update).toHaveBeenCalledWith(
        "vendor_1",
        expect.objectContaining({
          settings: expect.objectContaining({
            max_products: 50,
            commission_rate: 0.1,
            payout_schedule: "weekly",
            notifications_enabled: true,
          }),
        })
      )
      expect(result.settings).toBeDefined()
    })
  })

  describe("Vendor Product Management", () => {
    const approvedVendor: Vendor = {
      id: "vendor_1",
      business_name: "Acme Supplies",
      business_email: "vendor@acme.com",
      contact_name: "John Doe",
      phone: "+1234567890",
      description: "Quality supplies",
      category: "general",
      status: "approved",
      tier: "basic",
      created_at: "2026-01-01T00:00:00.000Z",
      settings: {
        max_products: 50,
        commission_rate: 0.1,
        payout_schedule: "weekly",
        notifications_enabled: true,
      },
    }

    it("should allow vendor to create product", async () => {
      mockVendorService.retrieve.mockResolvedValue(approvedVendor)
      mockProductService.count.mockResolvedValue(10)
      const productData = { title: "Widget", description: "A fine widget", price: 19.99, currency_code: "usd" }
      const created = { id: "prod_1", vendor_id: "vendor_1", ...productData, status: "draft" }
      mockProductService.create.mockResolvedValue(created)

      const result = await createVendorProduct("vendor_1", productData, services)

      expect(result).toEqual(created)
      expect(mockProductService.create).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_id: "vendor_1", title: "Widget", status: "draft" })
      )
    })

    it("should enforce product limits per vendor tier", async () => {
      mockVendorService.retrieve.mockResolvedValue(approvedVendor)
      mockProductService.count.mockResolvedValue(50)

      const productData = { title: "Extra Widget", description: "Too many", price: 9.99, currency_code: "usd" }

      await expect(createVendorProduct("vendor_1", productData, services)).rejects.toThrow(
        "Product limit reached for basic tier (50)"
      )
      expect(mockProductService.create).not.toHaveBeenCalled()
    })

    it("should validate product data before creation", async () => {
      mockVendorService.retrieve.mockResolvedValue(approvedVendor)

      const invalidProduct = { title: "", description: "No title", price: -5, currency_code: "usd" }

      await expect(createVendorProduct("vendor_1", invalidProduct, services)).rejects.toThrow(
        "Invalid product data"
      )
      expect(mockProductService.create).not.toHaveBeenCalled()
    })

    it("should handle product image uploads", async () => {
      mockVendorService.retrieve.mockResolvedValue(approvedVendor)
      mockProductService.count.mockResolvedValue(5)
      mockImageService.validate.mockResolvedValue(true)
      mockImageService.upload
        .mockResolvedValueOnce("https://cdn.example.com/img1.jpg")
        .mockResolvedValueOnce("https://cdn.example.com/img2.jpg")

      const productData = {
        title: "Photo Widget",
        description: "With images",
        price: 29.99,
        currency_code: "usd",
        images: ["file1.jpg", "file2.jpg"],
      }
      mockProductService.create.mockImplementation((p: Product) => Promise.resolve(p))

      const result = await createVendorProduct("vendor_1", productData, services)

      expect(mockImageService.validate).toHaveBeenCalledTimes(2)
      expect(mockImageService.upload).toHaveBeenCalledTimes(2)
      expect(result.images).toEqual(["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"])
    })
  })

  describe("Vendor Payout Flow", () => {
    const vendorWithSettings: Vendor = {
      id: "vendor_1",
      business_name: "Acme Supplies",
      business_email: "vendor@acme.com",
      contact_name: "John Doe",
      phone: "+1234567890",
      description: "Quality supplies",
      category: "general",
      status: "approved",
      tier: "basic",
      created_at: "2026-01-01T00:00:00.000Z",
      settings: {
        max_products: 50,
        commission_rate: 0.1,
        payout_schedule: "weekly",
        notifications_enabled: true,
      },
    }

    const completedOrders: CompletedOrder[] = [
      { id: "order_1", vendor_id: "vendor_1", total: 100, status: "completed", completed_at: "2026-02-01" },
      { id: "order_2", vendor_id: "vendor_1", total: 200, status: "completed", completed_at: "2026-02-05" },
      { id: "order_3", vendor_id: "vendor_1", total: 50, status: "completed", completed_at: "2026-02-10" },
    ]

    it("should calculate vendor earnings from completed orders", async () => {
      mockVendorService.retrieve.mockResolvedValue(vendorWithSettings)
      mockPaymentService.createPayout.mockResolvedValue(true)

      const payout = await calculateAndCreatePayout("vendor_1", completedOrders, services)

      expect(payout).not.toBeNull()
      expect(payout!.amount).toBe(350)
    })

    it("should deduct platform commission", async () => {
      mockVendorService.retrieve.mockResolvedValue(vendorWithSettings)
      mockPaymentService.createPayout.mockResolvedValue(true)

      const payout = await calculateAndCreatePayout("vendor_1", completedOrders, services)

      expect(payout!.commission_deducted).toBe(35)
      expect(payout!.net_amount).toBe(315)
    })

    it("should create payout record", async () => {
      mockVendorService.retrieve.mockResolvedValue(vendorWithSettings)
      mockPaymentService.createPayout.mockResolvedValue(true)

      const payout = await calculateAndCreatePayout("vendor_1", completedOrders, services)

      expect(payout).toEqual(
        expect.objectContaining({
          vendor_id: "vendor_1",
          amount: 350,
          commission_deducted: 35,
          net_amount: 315,
          status: "scheduled",
        })
      )
      expect(mockPaymentService.createPayout).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_id: "vendor_1", status: "scheduled" })
      )
    })

    it("should handle minimum payout threshold", async () => {
      mockVendorService.retrieve.mockResolvedValue(vendorWithSettings)

      const smallOrders: CompletedOrder[] = [
        { id: "order_small", vendor_id: "vendor_1", total: 20, status: "completed", completed_at: "2026-02-01" },
      ]

      const payout = await calculateAndCreatePayout("vendor_1", smallOrders, services)

      expect(payout).toBeNull()
      expect(mockPaymentService.createPayout).not.toHaveBeenCalled()
    })

    it("should process scheduled payouts", async () => {
      const scheduledPayouts: PayoutRecord[] = [
        { id: "payout_1", vendor_id: "vendor_1", amount: 350, commission_deducted: 35, net_amount: 315, status: "scheduled", scheduled_at: "2026-02-14" },
        { id: "payout_2", vendor_id: "vendor_2", amount: 200, commission_deducted: 20, net_amount: 180, status: "scheduled", scheduled_at: "2026-02-14" },
      ]

      mockPaymentService.createPayout.mockResolvedValue(true)
      mockNotificationService.send.mockResolvedValue(true)

      const result = await processScheduledPayouts(scheduledPayouts, services)

      expect(result.processed).toBe(2)
      expect(result.failed).toBe(0)
      expect(mockPaymentService.createPayout).toHaveBeenCalledTimes(2)
      expect(mockNotificationService.send).toHaveBeenCalledTimes(2)
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: "payout_processed", vendor_id: "vendor_1", amount: 315 })
      )
    })
  })
})
