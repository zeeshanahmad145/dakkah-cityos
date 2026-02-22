import { GET, POST } from "../../src/api/store/bookings/route"

const mockJson = jest.fn()
const mockStatus = jest.fn(() => ({ json: mockJson }))

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  auth_context: { actor_id: "cust_01" },
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

describe("Store Bookings Endpoints", () => {
  describe("GET /store/bookings", () => {
    it("should return bookings for authenticated customer", async () => {
      const mockBookings = [{ id: "book_01", status: "confirmed" }]
      const req = createMockReq({
        booking: {
          listBookings: jest.fn().mockResolvedValue(mockBookings),
          retrieveServiceProduct: jest.fn().mockResolvedValue({ id: "svc_01", name: "Haircut" }),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ bookings: expect.any(Array), count: 1 })
      )
    })

    it("should return 401 when not authenticated", async () => {
      const req = createMockReq({ auth_context: {} }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication required" }))
    })

    it("should filter by status when provided", async () => {
      const listBookings = jest.fn().mockResolvedValue([])
      const req = createMockReq({
        query: { status: "confirmed" },
        booking: { listBookings, retrieveServiceProduct: jest.fn() },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: "cust_01", status: "confirmed" }),
        expect.anything()
      )
    })
  })

  describe("POST /store/bookings", () => {
    const validBody = {
      service_id: "svc_01",
      start_time: "2026-03-15T10:00:00Z",
      customer_email: "test@example.com",
      customer_name: "Jane Doe",
    }

    it("should create a booking successfully", async () => {
      const mockBooking = { id: "book_01", service_product_id: "svc_01" }
      const req = createMockReq({
        body: validBody,
        booking: {
          createBooking: jest.fn().mockResolvedValue(mockBooking),
          retrieveServiceProduct: jest.fn().mockResolvedValue({ id: "svc_01" }),
        },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(201)
    })

    it("should return 401 when not authenticated", async () => {
      const req = createMockReq({ body: validBody, auth_context: {} }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should return 400 for invalid body", async () => {
      const req = createMockReq({ body: { service_id: "" } }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation failed" }))
    })

    it("should return 400 when customer_email is missing", async () => {
      const req = createMockReq({
        body: { service_id: "svc_01", start_time: "2026-03-15T10:00:00Z" },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
    })
  })
})
