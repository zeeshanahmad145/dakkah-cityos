import { vi } from "vitest";
const mockOrderService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  cancel: vi.fn(),
  createFulfillment: vi.fn(),
  createShipment: vi.fn(),
}

const mockCartService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  retrieve: vi.fn(),
  validateItems: vi.fn(),
  clear: vi.fn(),
}

const mockPaymentService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  validatePaymentMethod: vi.fn(),
  capturePayment: vi.fn(),
  refund: vi.fn(),
}

const mockInventoryService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  checkAvailability: vi.fn(),
  reserveStock: vi.fn(),
  restoreStock: vi.fn(),
}

const mockNotificationService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  send: vi.fn(),
}

const mockCommissionService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  calculate: vi.fn(),
}

interface CartItem {
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  vendor_id: string
}

interface Order {
  id: string
  status: string
  items: CartItem[]
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  payment_method: string
  vendor_orders?: VendorOrder[]
  fulfillments?: Fulfillment[]
  refund_amount?: number
  cancelled_items?: string[]
}

interface VendorOrder {
  vendor_id: string
  items: CartItem[]
  subtotal: number
  commission: number
  commission_rate: number
}

interface Fulfillment {
  id: string
  order_id: string
  vendor_id?: string
  tracking_number: string
  status: string
  items: string[]
}

function calculateOrderTotals(items: CartItem[], taxRate: number, shippingCost: number, discountAmount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const tax_total = Math.round(subtotal * taxRate * 100) / 100
  const discount_total = Math.min(discountAmount, subtotal)
  const total = subtotal + tax_total + shippingCost - discount_total
  return { subtotal, tax_total, shipping_total: shippingCost, discount_total, total }
}

function splitOrderByVendor(items: CartItem[]): Map<string, CartItem[]> {
  const vendorMap = new Map<string, CartItem[]>()
  for (const item of items) {
    const existing = vendorMap.get(item.vendor_id) || []
    existing.push(item)
    vendorMap.set(item.vendor_id, existing)
  }
  return vendorMap
}

function generateTrackingNumber(): string {
  const prefix = "TRK"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

async function createOrderFromCart(
  cartId: string,
  paymentMethod: string,
  discountCode: string | null,
  services: {
    cart: typeof mockCartService
    order: typeof mockOrderService
    payment: typeof mockPaymentService
    inventory: typeof mockInventoryService
    notification: typeof mockNotificationService
  }
): Promise<Order> {
  const cart = await services.cart.retrieve(cartId)
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error("Cart is empty")
  }

  const paymentValid = await services.payment.validatePaymentMethod(paymentMethod)
  if (!paymentValid) {
    throw new Error("Invalid payment method")
  }

  for (const item of cart.items) {
    const available = await services.inventory.checkAvailability(item.product_id, item.variant_id, item.quantity)
    if (!available) {
      throw new Error(`Insufficient stock for product ${item.product_id}`)
    }
  }

  let discountAmount = 0
  if (discountCode === "SAVE10") discountAmount = 10
  if (discountCode === "HALF50") discountAmount = cart.items.reduce((s: number, i: CartItem) => s + i.unit_price * i.quantity, 0) * 0.5

  const totals = calculateOrderTotals(cart.items, 0.08, 5.99, discountAmount)

  for (const item of cart.items) {
    await services.inventory.reserveStock(item.product_id, item.variant_id, item.quantity)
  }

  const order: Order = {
    id: `order_${Date.now()}`,
    status: "pending",
    items: cart.items,
    ...totals,
    payment_method: paymentMethod,
  }

  const created = await services.order.create(order)
  await services.cart.clear(cartId)
  await services.notification.send({ type: "order_confirmation", order_id: order.id })

  return created
}

async function fulfillOrder(
  orderId: string,
  services: {
    order: typeof mockOrderService
    notification: typeof mockNotificationService
  }
): Promise<Fulfillment> {
  const order = await services.order.retrieve(orderId)
  if (!order) throw new Error("Order not found")
  if (order.status === "cancelled") throw new Error("Cannot fulfill cancelled order")

  await services.order.update(orderId, { status: "processing" })

  const tracking_number = generateTrackingNumber()
  const fulfillment: Fulfillment = {
    id: `ful_${Date.now()}`,
    order_id: orderId,
    tracking_number,
    status: "shipped",
    items: order.items.map((i: CartItem) => i.product_id),
  }

  const created = await services.order.createFulfillment(fulfillment)
  await services.order.update(orderId, { status: "shipped" })
  await services.notification.send({ type: "fulfillment", order_id: orderId, tracking_number })

  return created
}

async function cancelOrder(
  orderId: string,
  itemIds: string[] | null,
  services: {
    order: typeof mockOrderService
    payment: typeof mockPaymentService
    inventory: typeof mockInventoryService
    notification: typeof mockNotificationService
  }
): Promise<Order> {
  const order = await services.order.retrieve(orderId)
  if (!order) throw new Error("Order not found")
  if (order.status === "shipped") throw new Error("Cannot cancel shipped order")

  if (itemIds && itemIds.length > 0 && itemIds.length < order.items.length) {
    const cancelledItems = order.items.filter((i: CartItem) => itemIds.includes(i.product_id))
    const refundAmount = cancelledItems.reduce((s: number, i: CartItem) => s + i.unit_price * i.quantity, 0)

    for (const item of cancelledItems) {
      await services.inventory.restoreStock(item.product_id, item.variant_id, item.quantity)
    }

    await services.payment.refund(order.payment_method, refundAmount)
    const updated = await services.order.update(orderId, {
      status: "partially_cancelled",
      cancelled_items: itemIds,
      refund_amount: refundAmount,
    })
    return updated
  }

  for (const item of order.items) {
    await services.inventory.restoreStock(item.product_id, item.variant_id, item.quantity)
  }

  await services.payment.refund(order.payment_method, order.total)
  const updated = await services.order.update(orderId, { status: "cancelled", refund_amount: order.total })
  await services.notification.send({ type: "order_cancelled", order_id: orderId })

  return updated
}

async function splitAndCreateVendorOrders(
  order: Order,
  commissionRate: number,
  services: {
    order: typeof mockOrderService
    commission: typeof mockCommissionService
  }
): Promise<VendorOrder[]> {
  const vendorMap = splitOrderByVendor(order.items)
  const vendorOrders: VendorOrder[] = []

  for (const [vendor_id, items] of vendorMap.entries()) {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    const commission = Math.round(subtotal * commissionRate * 100) / 100
    await services.commission.calculate(vendor_id, subtotal, commissionRate)
    vendorOrders.push({ vendor_id, items, subtotal, commission, commission_rate: commissionRate })
  }

  await services.order.update(order.id, { vendor_orders: vendorOrders })
  return vendorOrders
}

describe("Order Lifecycle", () => {
  beforeEach(() => vi.clearAllMocks())

  const sampleCartItems: CartItem[] = [
    { product_id: "prod_1", variant_id: "var_1", quantity: 2, unit_price: 25.0, vendor_id: "vendor_A" },
    { product_id: "prod_2", variant_id: "var_2", quantity: 1, unit_price: 50.0, vendor_id: "vendor_B" },
  ]

  const services = {
    cart: mockCartService,
    order: mockOrderService,
    payment: mockPaymentService,
    inventory: mockInventoryService,
    notification: mockNotificationService,
    commission: mockCommissionService,
  }

  describe("Order Creation Flow", () => {
    it("should create order from cart with valid items", async () => {
      mockCartService.retrieve.mockResolvedValue({ id: "cart_1", items: sampleCartItems })
      mockPaymentService.validatePaymentMethod.mockResolvedValue(true)
      mockInventoryService.checkAvailability.mockResolvedValue(true)
      mockInventoryService.reserveStock.mockResolvedValue(true)
      const createdOrder = { id: "order_1", status: "pending", items: sampleCartItems, total: 111.99 }
      mockOrderService.create.mockResolvedValue(createdOrder)

      const result = await createOrderFromCart("cart_1", "credit_card", null, services)

      expect(result).toEqual(createdOrder)
      expect(mockOrderService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending", items: sampleCartItems })
      )
      expect(mockCartService.clear).toHaveBeenCalledWith("cart_1")
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: "order_confirmation" })
      )
    })

    it("should validate stock availability before order creation", async () => {
      mockCartService.retrieve.mockResolvedValue({ id: "cart_1", items: sampleCartItems })
      mockPaymentService.validatePaymentMethod.mockResolvedValue(true)
      mockInventoryService.checkAvailability
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      await expect(createOrderFromCart("cart_1", "credit_card", null, services)).rejects.toThrow(
        "Insufficient stock for product prod_2"
      )
      expect(mockOrderService.create).not.toHaveBeenCalled()
    })

    it("should calculate order totals with taxes and shipping", () => {
      const totals = calculateOrderTotals(sampleCartItems, 0.08, 5.99, 0)

      expect(totals.subtotal).toBe(100)
      expect(totals.tax_total).toBe(8)
      expect(totals.shipping_total).toBe(5.99)
      expect(totals.discount_total).toBe(0)
      expect(totals.total).toBe(113.99)
    })

    it("should apply discount codes during checkout", async () => {
      mockCartService.retrieve.mockResolvedValue({ id: "cart_1", items: sampleCartItems })
      mockPaymentService.validatePaymentMethod.mockResolvedValue(true)
      mockInventoryService.checkAvailability.mockResolvedValue(true)
      mockInventoryService.reserveStock.mockResolvedValue(true)
      mockOrderService.create.mockImplementation((order: Order) => Promise.resolve(order))

      const result = await createOrderFromCart("cart_1", "credit_card", "SAVE10", services)

      expect(result.discount_total).toBe(10)
      expect(result.total).toBe(103.99)
    })

    it("should reject order with empty cart", async () => {
      mockCartService.retrieve.mockResolvedValue({ id: "cart_1", items: [] })

      await expect(createOrderFromCart("cart_1", "credit_card", null, services)).rejects.toThrow("Cart is empty")
      expect(mockOrderService.create).not.toHaveBeenCalled()
    })

    it("should reject order with invalid payment method", async () => {
      mockCartService.retrieve.mockResolvedValue({ id: "cart_1", items: sampleCartItems })
      mockPaymentService.validatePaymentMethod.mockResolvedValue(false)

      await expect(createOrderFromCart("cart_1", "invalid_method", null, services)).rejects.toThrow(
        "Invalid payment method"
      )
      expect(mockOrderService.create).not.toHaveBeenCalled()
    })
  })

  describe("Order Fulfillment Flow", () => {
    const pendingOrder = {
      id: "order_1",
      status: "pending",
      items: sampleCartItems,
      total: 113.99,
      payment_method: "credit_card",
    }

    it("should transition order from pending to processing", async () => {
      mockOrderService.retrieve.mockResolvedValue(pendingOrder)
      mockOrderService.update.mockResolvedValue({ ...pendingOrder, status: "processing" })
      mockOrderService.createFulfillment.mockImplementation((f: Fulfillment) => Promise.resolve(f))

      await fulfillOrder("order_1", services)

      expect(mockOrderService.update).toHaveBeenCalledWith("order_1", { status: "processing" })
    })

    it("should create shipment record on fulfillment", async () => {
      mockOrderService.retrieve.mockResolvedValue(pendingOrder)
      mockOrderService.update.mockResolvedValue({ ...pendingOrder, status: "shipped" })
      mockOrderService.createFulfillment.mockImplementation((f: Fulfillment) => Promise.resolve(f))

      const fulfillment = await fulfillOrder("order_1", services)

      expect(fulfillment).toEqual(
        expect.objectContaining({
          order_id: "order_1",
          status: "shipped",
          items: ["prod_1", "prod_2"],
        })
      )
      expect(mockOrderService.createFulfillment).toHaveBeenCalled()
    })

    it("should generate tracking number", async () => {
      mockOrderService.retrieve.mockResolvedValue(pendingOrder)
      mockOrderService.update.mockResolvedValue({ ...pendingOrder, status: "shipped" })
      mockOrderService.createFulfillment.mockImplementation((f: Fulfillment) => Promise.resolve(f))

      const fulfillment = await fulfillOrder("order_1", services)

      expect(fulfillment.tracking_number).toMatch(/^TRK-[A-Z0-9]+-[A-Z0-9]+$/)
    })

    it("should send fulfillment notification", async () => {
      mockOrderService.retrieve.mockResolvedValue(pendingOrder)
      mockOrderService.update.mockResolvedValue({ ...pendingOrder, status: "shipped" })
      mockOrderService.createFulfillment.mockImplementation((f: Fulfillment) => Promise.resolve(f))

      await fulfillOrder("order_1", services)

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: "fulfillment", order_id: "order_1" })
      )
    })

    it("should reject fulfillment for cancelled orders", async () => {
      mockOrderService.retrieve.mockResolvedValue({ ...pendingOrder, status: "cancelled" })

      await expect(fulfillOrder("order_1", services)).rejects.toThrow("Cannot fulfill cancelled order")
      expect(mockOrderService.createFulfillment).not.toHaveBeenCalled()
    })
  })

  describe("Order Cancellation Flow", () => {
    const activeOrder = {
      id: "order_1",
      status: "pending",
      items: sampleCartItems,
      subtotal: 100,
      tax_total: 8,
      shipping_total: 5.99,
      discount_total: 0,
      total: 113.99,
      payment_method: "credit_card",
    }

    it("should cancel pending order and restore stock", async () => {
      mockOrderService.retrieve.mockResolvedValue(activeOrder)
      mockPaymentService.refund.mockResolvedValue(true)
      mockInventoryService.restoreStock.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue({ ...activeOrder, status: "cancelled" })

      await cancelOrder("order_1", null, services)

      expect(mockInventoryService.restoreStock).toHaveBeenCalledTimes(2)
      expect(mockInventoryService.restoreStock).toHaveBeenCalledWith("prod_1", "var_1", 2)
      expect(mockInventoryService.restoreStock).toHaveBeenCalledWith("prod_2", "var_2", 1)
      expect(mockOrderService.update).toHaveBeenCalledWith("order_1", expect.objectContaining({ status: "cancelled" }))
    })

    it("should process refund on cancellation", async () => {
      mockOrderService.retrieve.mockResolvedValue(activeOrder)
      mockPaymentService.refund.mockResolvedValue(true)
      mockInventoryService.restoreStock.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue({ ...activeOrder, status: "cancelled", refund_amount: 113.99 })

      await cancelOrder("order_1", null, services)

      expect(mockPaymentService.refund).toHaveBeenCalledWith("credit_card", 113.99)
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: "order_cancelled", order_id: "order_1" })
      )
    })

    it("should reject cancellation for shipped orders", async () => {
      mockOrderService.retrieve.mockResolvedValue({ ...activeOrder, status: "shipped" })

      await expect(cancelOrder("order_1", null, services)).rejects.toThrow("Cannot cancel shipped order")
      expect(mockPaymentService.refund).not.toHaveBeenCalled()
    })

    it("should handle partial cancellation", async () => {
      mockOrderService.retrieve.mockResolvedValue(activeOrder)
      mockPaymentService.refund.mockResolvedValue(true)
      mockInventoryService.restoreStock.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue({
        ...activeOrder,
        status: "partially_cancelled",
        cancelled_items: ["prod_1"],
        refund_amount: 50,
      })

      await cancelOrder("order_1", ["prod_1"], services)

      expect(mockInventoryService.restoreStock).toHaveBeenCalledTimes(1)
      expect(mockInventoryService.restoreStock).toHaveBeenCalledWith("prod_1", "var_1", 2)
      expect(mockPaymentService.refund).toHaveBeenCalledWith("credit_card", 50)
      expect(mockOrderService.update).toHaveBeenCalledWith(
        "order_1",
        expect.objectContaining({ status: "partially_cancelled", cancelled_items: ["prod_1"] })
      )
    })
  })

  describe("Multi-vendor Order Split", () => {
    const multiVendorOrder: Order = {
      id: "order_mv_1",
      status: "pending",
      items: sampleCartItems,
      subtotal: 100,
      tax_total: 8,
      shipping_total: 5.99,
      discount_total: 0,
      total: 113.99,
      payment_method: "credit_card",
    }

    it("should split order by vendor", async () => {
      mockCommissionService.calculate.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue(multiVendorOrder)

      const vendorOrders = await splitAndCreateVendorOrders(multiVendorOrder, 0.1, services)

      expect(vendorOrders).toHaveLength(2)
      const vendorIds = vendorOrders.map((vo) => vo.vendor_id)
      expect(vendorIds).toContain("vendor_A")
      expect(vendorIds).toContain("vendor_B")

      const vendorAOrder = vendorOrders.find((vo) => vo.vendor_id === "vendor_A")!
      expect(vendorAOrder.items).toHaveLength(1)
      expect(vendorAOrder.items[0].product_id).toBe("prod_1")

      const vendorBOrder = vendorOrders.find((vo) => vo.vendor_id === "vendor_B")!
      expect(vendorBOrder.items).toHaveLength(1)
      expect(vendorBOrder.items[0].product_id).toBe("prod_2")
    })

    it("should calculate vendor commissions", async () => {
      mockCommissionService.calculate.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue(multiVendorOrder)

      const vendorOrders = await splitAndCreateVendorOrders(multiVendorOrder, 0.1, services)

      const vendorAOrder = vendorOrders.find((vo) => vo.vendor_id === "vendor_A")!
      expect(vendorAOrder.subtotal).toBe(50)
      expect(vendorAOrder.commission).toBe(5)
      expect(vendorAOrder.commission_rate).toBe(0.1)

      const vendorBOrder = vendorOrders.find((vo) => vo.vendor_id === "vendor_B")!
      expect(vendorBOrder.subtotal).toBe(50)
      expect(vendorBOrder.commission).toBe(5)

      expect(mockCommissionService.calculate).toHaveBeenCalledTimes(2)
    })

    it("should create separate fulfillments per vendor", async () => {
      mockCommissionService.calculate.mockResolvedValue(true)
      mockOrderService.update.mockResolvedValue(multiVendorOrder)

      const vendorOrders = await splitAndCreateVendorOrders(multiVendorOrder, 0.1, services)

      for (const vo of vendorOrders) {
        const fulfillment: Fulfillment = {
          id: `ful_${vo.vendor_id}`,
          order_id: multiVendorOrder.id,
          vendor_id: vo.vendor_id,
          tracking_number: generateTrackingNumber(),
          status: "pending",
          items: vo.items.map((i) => i.product_id),
        }
        await mockOrderService.createFulfillment(fulfillment)
      }

      expect(mockOrderService.createFulfillment).toHaveBeenCalledTimes(2)
      expect(mockOrderService.createFulfillment).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_id: "vendor_A", order_id: "order_mv_1" })
      )
      expect(mockOrderService.createFulfillment).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_id: "vendor_B", order_id: "order_mv_1" })
      )
    })
  })
})
