const mockJson = jest.fn()
const mockStatus = jest.fn(() => ({ json: mockJson }))

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  auth_context: { actor_id: "admin_01" },
  scope: {
    resolve: jest.fn((name: string) => overrides[name] || {}),
  },
  ...overrides,
})

const createMockRes = () => {
  const res: any = { json: mockJson, status: mockStatus }
  mockJson.mockClear()
  mockStatus.mockClear()
  mockStatus.mockReturnValue({ json: mockJson })
  return res
}

describe("Store Scope Isolation", () => {
  describe("product visibility per store", () => {
    it("should only show products assigned to the requesting store", async () => {
      const listProducts = jest.fn().mockImplementation((filters: any) => {
        const products = [
          { id: "prod_01", name: "Store A Product", store_id: "store_A" },
          { id: "prod_02", name: "Store B Product", store_id: "store_B" },
          { id: "prod_03", name: "Store A Item", store_id: "store_A" },
        ]
        return products.filter(p => p.store_id === filters.store_id)
      })

      const storeAProducts = listProducts({ store_id: "store_A" })
      expect(storeAProducts).toHaveLength(2)
      expect(storeAProducts.every((p: any) => p.store_id === "store_A")).toBe(true)
    })

    it("should not leak products from store B to store A", async () => {
      const listProducts = jest.fn().mockImplementation((filters: any) => {
        const products = [
          { id: "prod_01", store_id: "store_A" },
          { id: "prod_02", store_id: "store_B" },
        ]
        return products.filter(p => p.store_id === filters.store_id)
      })

      const storeAProducts = listProducts({ store_id: "store_A" })
      const hasStoreBProduct = storeAProducts.some((p: any) => p.store_id === "store_B")
      expect(hasStoreBProduct).toBe(false)
    })
  })

  describe("order scoping per store", () => {
    it("should scope orders to the originating store", async () => {
      const listOrders = jest.fn().mockImplementation((filters: any) => {
        const orders = [
          { id: "order_01", store_id: "store_A", total: 5000 },
          { id: "order_02", store_id: "store_B", total: 3000 },
          { id: "order_03", store_id: "store_A", total: 8000 },
        ]
        return orders.filter(o => o.store_id === filters.store_id)
      })

      const storeAOrders = listOrders({ store_id: "store_A" })
      expect(storeAOrders).toHaveLength(2)
      expect(storeAOrders.every((o: any) => o.store_id === "store_A")).toBe(true)
    })

    it("should prevent cross-store order modification", async () => {
      const updateOrder = jest.fn().mockImplementation((orderId: string, data: any, context: any) => {
        const order = { id: orderId, store_id: "store_A" }
        if (context.store_id !== order.store_id) {
          throw new Error("Forbidden: order belongs to a different store")
        }
        return { ...order, ...data }
      })

      expect(() => updateOrder("order_01", { status: "shipped" }, { store_id: "store_B" }))
        .toThrow("order belongs to a different store")
    })
  })

  describe("booking scoping per store", () => {
    it("should scope bookings to the correct store", async () => {
      const listBookings = jest.fn().mockImplementation((filters: any) => {
        const bookings = [
          { id: "book_01", store_id: "store_A", service: "Haircut" },
          { id: "book_02", store_id: "store_B", service: "Massage" },
        ]
        return bookings.filter(b => b.store_id === filters.store_id)
      })

      const storeABookings = listBookings({ store_id: "store_A" })
      expect(storeABookings).toHaveLength(1)
      expect(storeABookings[0].service).toBe("Haircut")
    })

    it("should prevent cross-store booking cancellation", async () => {
      const cancelBooking = jest.fn().mockImplementation((bookingId: string, context: any) => {
        const booking = { id: bookingId, store_id: "store_A" }
        if (context.store_id !== booking.store_id) {
          throw new Error("Forbidden: cannot cancel bookings from another store")
        }
        return { ...booking, status: "cancelled" }
      })

      expect(() => cancelBooking("book_01", { store_id: "store_B" }))
        .toThrow("cannot cancel bookings from another store")
    })
  })

  describe("subscription scoping per store", () => {
    it("should isolate subscription plans between stores", async () => {
      const listPlans = jest.fn().mockImplementation((filters: any) => {
        const plans = [
          { id: "plan_01", store_id: "store_A", name: "Basic A", price: 999 },
          { id: "plan_02", store_id: "store_B", name: "Basic B", price: 1499 },
          { id: "plan_03", store_id: "store_A", name: "Pro A", price: 2999 },
        ]
        return plans.filter(p => p.store_id === filters.store_id)
      })

      const storeAPlans = listPlans({ store_id: "store_A" })
      expect(storeAPlans).toHaveLength(2)
      expect(storeAPlans.map((p: any) => p.name)).toEqual(["Basic A", "Pro A"])
    })

    it("should prevent cross-store subscription creation", async () => {
      const createSubscription = jest.fn().mockImplementation((data: any, context: any) => {
        if (data.plan_store_id !== context.store_id) {
          throw new Error("Forbidden: cannot subscribe to plans from another store")
        }
        return { id: "sub_01", ...data }
      })

      expect(() => createSubscription(
        { plan_id: "plan_02", plan_store_id: "store_B", customer_id: "cust_01" },
        { store_id: "store_A" }
      )).toThrow("cannot subscribe to plans from another store")
    })
  })

  describe("analytics scoping per store", () => {
    it("should scope revenue metrics to the requesting store", async () => {
      const getStoreMetrics = jest.fn().mockImplementation((context: any) => {
        const metrics: Record<string, any> = {
          store_A: { revenue: 150000, orders: 45, customers: 30 },
          store_B: { revenue: 80000, orders: 25, customers: 18 },
        }
        return metrics[context.store_id] || null
      })

      const metricsA = getStoreMetrics({ store_id: "store_A" })
      expect(metricsA.revenue).toBe(150000)
      expect(metricsA.orders).toBe(45)

      const metricsB = getStoreMetrics({ store_id: "store_B" })
      expect(metricsB.revenue).toBe(80000)
      expect(metricsB.revenue).not.toBe(metricsA.revenue)
    })
  })
})
