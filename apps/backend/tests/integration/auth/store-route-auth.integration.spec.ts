import { GET, POST } from "../../../src/api/store/bookings/route"

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
      const req = createMockReq({
        booking: { listBookings: jest.fn().mockResolvedValue([]) },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should allow authenticated customer to access bookings", async () => {
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        booking: {
          listBookings: jest.fn().mockResolvedValue([{ id: "book_01" }]),
          retrieveServiceProduct: jest.fn().mockResolvedValue({ id: "svc_01" }),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ bookings: expect.any(Array) }))
    })
  })

  describe("POST /store/bookings", () => {
    it("should return 401 for unauthenticated POST to /store/bookings", async () => {
      const req = createMockReq({
        body: {
          service_id: "svc_01",
          start_time: "2026-03-15T10:00:00Z",
          customer_email: "test@example.com",
          customer_name: "Jane Doe",
        },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should allow authenticated customer to create a booking", async () => {
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: {
          service_id: "svc_01",
          start_time: "2026-03-15T10:00:00Z",
          customer_email: "test@example.com",
          customer_name: "Jane Doe",
        },
        booking: {
          createBooking: jest.fn().mockResolvedValue({ id: "book_01" }),
          retrieveServiceProduct: jest.fn().mockResolvedValue({ id: "svc_01" }),
        },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(201)
    })
  })

  describe("protected store routes – authentication required", () => {
    it("should reject unauthenticated access with empty auth_context", async () => {
      const req = createMockReq({ auth_context: {} }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Authentication") }))
    })

    it("should reject unauthenticated access with null actor_id", async () => {
      const req = createMockReq({ auth_context: { actor_id: null } }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should reject unauthenticated access with undefined actor_id", async () => {
      const req = createMockReq({ auth_context: { actor_id: undefined } }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should accept valid customer authentication token", async () => {
      const req = createMockReq({
        auth_context: { actor_id: "cust_valid_01" },
        booking: {
          listBookings: jest.fn().mockResolvedValue([]),
          retrieveServiceProduct: jest.fn().mockResolvedValue({ id: "svc_01" }),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).not.toHaveBeenCalledWith(401)
    })
  })

  describe("request validation on protected routes", () => {
    it("should return 400 for booking with missing required fields", async () => {
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: { service_id: "" },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
    })

    it("should return 400 for booking without customer_email", async () => {
      const req = createMockReq({
        auth_context: { actor_id: "cust_01" },
        body: { service_id: "svc_01", start_time: "2026-03-15T10:00:00Z" },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
    })
  })
})
