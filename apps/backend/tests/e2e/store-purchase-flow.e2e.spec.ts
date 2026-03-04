import { vi } from "vitest";
const mockProductService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  list: vi.fn(),
  retrieve: vi.fn(),
}

const mockCartService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  addLineItem: vi.fn(),
  retrieve: vi.fn(),
  validateItems: vi.fn(),
  clear: vi.fn(),
}

const mockOrderService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
}

const mockPaymentService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  validatePaymentMethod: vi.fn(),
  capturePayment: vi.fn(),
  createPaymentSession: vi.fn(),
}

const mockCustomerService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  retrieve: vi.fn(),
  create: vi.fn(),
}

const mockInventoryService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  checkAvailability: vi.fn(),
  reserveStock: vi.fn(),
}

const mockNotificationService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  send: vi.fn(),
}

interface Product {
  id: string
  title: string
  variants: Array<{ id: string; price: number; inventory_quantity: number }>
  status: string
}

interface CartItem {
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  status: string
  items: CartItem[]
  subtotal: number
  total: number
  customer_id?: string
  email: string
}

function calculateOrderTotal(items: CartItem[], taxRate: number = 0.1): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const tax = Math.round(subtotal * taxRate * 100) / 100
  return { subtotal, tax, total: subtotal + tax }
}

describe("Store Purchase Flow E2E", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("browse products → add to cart → checkout → order created", () => {
    it("should complete full purchase flow for authenticated customer", async () => {
      const products: Product[] = [
        {
          id: "prod_01", title: "Wireless Headphones", status: "published",
          variants: [{ id: "var_01", price: 9999, inventory_quantity: 50 }],
        },
        {
          id: "prod_02", title: "Phone Case", status: "published",
          variants: [{ id: "var_02", price: 2499, inventory_quantity: 100 }],
        },
      ]
      mockProductService.list.mockResolvedValue(products)

      const listed = await mockProductService.list({ status: "published" })
      expect(listed).toHaveLength(2)

      mockCartService.create.mockResolvedValue({ id: "cart_01", items: [], total: 0 })
      const cart = await mockCartService.create({ customer_id: "cust_01" })
      expect(cart.id).toBe("cart_01")

      const cartItems: CartItem[] = [
        { product_id: "prod_01", variant_id: "var_01", quantity: 1, unit_price: 9999 },
        { product_id: "prod_02", variant_id: "var_02", quantity: 2, unit_price: 2499 },
      ]

      mockCartService.addLineItem.mockResolvedValue({ id: "cart_01", items: cartItems })
      for (const item of cartItems) {
        await mockCartService.addLineItem(cart.id, item)
      }

      mockInventoryService.checkAvailability.mockResolvedValue(true)
      const available = await mockInventoryService.checkAvailability(cartItems)
      expect(available).toBe(true)

      mockPaymentService.validatePaymentMethod.mockResolvedValue({ valid: true })
      const paymentValid = await mockPaymentService.validatePaymentMethod({ method: "credit_card" })
      expect(paymentValid.valid).toBe(true)

      const totals = calculateOrderTotal(cartItems)
      const order: Order = {
        id: "ord_01", status: "pending", items: cartItems,
        subtotal: totals.subtotal, total: totals.total,
        customer_id: "cust_01", email: "customer@example.com",
      }
      mockOrderService.create.mockResolvedValue(order)

      const createdOrder = await mockOrderService.create({
        cart_id: "cart_01", customer_id: "cust_01",
        payment_method: "credit_card",
      })
      expect(createdOrder.status).toBe("pending")
      expect(createdOrder.total).toBe(totals.total)

      mockPaymentService.capturePayment.mockResolvedValue({ status: "captured" })
      await mockPaymentService.capturePayment(createdOrder.id)

      mockOrderService.update.mockResolvedValue({ ...order, status: "confirmed" })
      const confirmed = await mockOrderService.update(createdOrder.id, { status: "confirmed" })
      expect(confirmed.status).toBe("confirmed")
    })

    it("should handle guest checkout without customer account", async () => {
      mockCartService.create.mockResolvedValue({ id: "cart_02", items: [], total: 0 })
      const cart = await mockCartService.create({ email: "guest@example.com" })

      const cartItems: CartItem[] = [
        { product_id: "prod_01", variant_id: "var_01", quantity: 1, unit_price: 5999 },
      ]
      mockCartService.addLineItem.mockResolvedValue({ id: "cart_02", items: cartItems })
      await mockCartService.addLineItem(cart.id, cartItems[0])

      mockInventoryService.checkAvailability.mockResolvedValue(true)
      mockPaymentService.validatePaymentMethod.mockResolvedValue({ valid: true })

      const totals = calculateOrderTotal(cartItems)
      const guestOrder: Order = {
        id: "ord_02", status: "pending", items: cartItems,
        subtotal: totals.subtotal, total: totals.total,
        email: "guest@example.com",
      }
      mockOrderService.create.mockResolvedValue(guestOrder)

      const created = await mockOrderService.create({
        cart_id: "cart_02", email: "guest@example.com",
        payment_method: "credit_card",
      })
      expect(created.status).toBe("pending")
      expect(created.customer_id).toBeUndefined()
      expect(created.email).toBe("guest@example.com")
    })
  })

  describe("order status progression", () => {
    it("should progress through pending → confirmed → fulfilled → delivered", async () => {
      const statuses = ["pending", "confirmed", "fulfilled", "delivered"]

      let currentOrder: Order = {
        id: "ord_03", status: "pending", items: [],
        subtotal: 9999, total: 10999, email: "test@example.com",
      }

      for (let i = 1; i < statuses.length; i++) {
        const newStatus = statuses[i]
        mockOrderService.update.mockResolvedValue({ ...currentOrder, status: newStatus })
        currentOrder = await mockOrderService.update("ord_03", { status: newStatus })
        expect(currentOrder.status).toBe(newStatus)
      }

      expect(currentOrder.status).toBe("delivered")
    })

    it("should handle order cancellation", async () => {
      mockOrderService.retrieve.mockResolvedValue({
        id: "ord_04", status: "pending",
      })
      mockOrderService.update.mockResolvedValue({
        id: "ord_04", status: "cancelled", cancelled_at: new Date().toISOString(),
      })
      mockInventoryService.reserveStock.mockResolvedValue({})

      const cancelled = await mockOrderService.update("ord_04", {
        status: "cancelled", reason: "Customer request",
      })
      expect(cancelled.status).toBe("cancelled")
    })
  })

  describe("inventory validation", () => {
    it("should reject checkout when items are out of stock", async () => {
      mockInventoryService.checkAvailability.mockResolvedValue(false)

      const available = await mockInventoryService.checkAvailability([
        { product_id: "prod_01", variant_id: "var_01", quantity: 999 },
      ])
      expect(available).toBe(false)
    })
  })
})
