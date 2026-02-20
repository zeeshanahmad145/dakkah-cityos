import { GET, POST } from "../../../src/api/store/bookings/route.js"

const mockJson = jest.fn()
const mockStatus = jest.fn(() => ({ json: mockJson }))

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  auth_context: {},
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

describe("Store Route Auth Boundaries", () => {
  describe("GET /store/bookings", () => {
    it("should return 401 for unauthenticated GET to /store/bookings", async () => {
      const listBookings = jest.fn()
      const req = createMockReq({
        booking: { listBookings },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication required" }))
      expect(listBookings).not.toHaveBeenCalled()
    })

    it("should allow authenticated customer to access bookings", async () => {
      const listBookings = jest.fn().mockResolvedValue([{ id: "book_01", service_product_id: "svc_01" }])
      const retrieveServiceProduct = jest.fn().mockResolvedValue({ id: "svc_01", name: "Haircut" })
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        booking: { listBookings, retrieveServiceProduct },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        bookings: expect.arrayContaining([
          expect.objectContaining({ id: "book_01", service: expect.objectContaining({ id: "svc_01" }) }),
        ]),
        count: 1,
      }))
      expect(listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: "cust_01" }),
        expect.anything()
      )
      expect(req.scope.resolve).toHaveBeenCalledWith("booking")
    })
  })

  describe("POST /store/bookings", () => {
    it("should return 401 for unauthenticated POST to /store/bookings", async () => {
      const createBooking = jest.fn()
      const req = createMockReq({
        body: {
          service_id: "svc_01",
          start_time: "2026-03-15T10:00:00Z",
          customer_email: "test@example.com",
          customer_name: "Jane Doe",
        },
        booking: { createBooking },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication required" }))
      expect(createBooking).not.toHaveBeenCalled()
    })

    it("should allow authenticated customer to create a booking", async () => {
      const createBooking = jest.fn().mockResolvedValue({ id: "book_01", service_product_id: "svc_01" })
      const retrieveServiceProduct = jest.fn().mockResolvedValue({ id: "svc_01", name: "Haircut" })
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: {
          service_id: "svc_01",
          start_time: "2026-03-15T10:00:00Z",
          customer_email: "test@example.com",
          customer_name: "Jane Doe",
        },
        booking: { createBooking, retrieveServiceProduct },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(201)
      expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({
        serviceProductId: "svc_01",
        customerId: "cust_01",
        customerEmail: "test@example.com",
        customerName: "Jane Doe",
      }))
      expect(req.scope.resolve).toHaveBeenCalledWith("booking")
    })
  })

  describe("protected store routes – authentication required", () => {
    it("should reject unauthenticated access with empty auth_context", async () => {
      const listBookings = jest.fn()
      const req = createMockReq({ auth_context: {}, booking: { listBookings } }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Authentication") }))
      expect(listBookings).not.toHaveBeenCalled()
    })

    it("should reject unauthenticated access with null actor_id", async () => {
      const listBookings = jest.fn()
      const req = createMockReq({ auth_context: { actor_id: null }, booking: { listBookings } }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(listBookings).not.toHaveBeenCalled()
    })

    it("should reject unauthenticated access with undefined actor_id", async () => {
      const listBookings = jest.fn()
      const req = createMockReq({ auth_context: { actor_id: undefined }, booking: { listBookings } }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(listBookings).not.toHaveBeenCalled()
    })

    it("should accept valid customer authentication token", async () => {
      const listBookings = jest.fn().mockResolvedValue([])
      const retrieveServiceProduct = jest.fn().mockResolvedValue({ id: "svc_01" })
      const req = createMockReq({
        auth_context: { actor_id: "cust_valid_01" },
        booking: { listBookings, retrieveServiceProduct },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).not.toHaveBeenCalledWith(401)
      expect(listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: "cust_valid_01" }),
        expect.anything()
      )
    })

    it("should ensure auth check runs before any service calls on POST", async () => {
      const createBooking = jest.fn()
      const resolveOrder: string[] = []
      const req = createMockReq({
        body: {
          service_id: "svc_01",
          start_time: "2026-03-15T10:00:00Z",
          customer_email: "test@example.com",
        },
        booking: { createBooking },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(createBooking).not.toHaveBeenCalled()
    })
  })

  describe("request validation on protected routes", () => {
    it("should return 400 for booking with missing required fields", async () => {
      const createBooking = jest.fn()
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: { service_id: "" },
        booking: { createBooking },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation failed" }))
      expect(createBooking).not.toHaveBeenCalled()
    })

    it("should return 400 for booking without customer_email", async () => {
      const createBooking = jest.fn()
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: { service_id: "svc_01", start_time: "2026-03-15T10:00:00Z" },
        booking: { createBooking },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(createBooking).not.toHaveBeenCalled()
    })

    it("should validate that auth passes before validation runs", async () => {
      const createBooking = jest.fn()
      const req = createMockReq({
        body: {},
        booking: { createBooking },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockStatus).not.toHaveBeenCalledWith(400)
      expect(createBooking).not.toHaveBeenCalled()
    })
  })
})
