import { vi } from "vitest";
vi.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: vi.fn((res, error, context) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("not found") || message.includes("Not found")) {
      return res.status(404).json({ message: `${context}: not found` })
    }
    if (message.includes("forbidden") || message.includes("Forbidden")) {
      return res.status(403).json({ message: "Forbidden" })
    }
    return res.status(500).json({ message: `${context} failed` })
  }),
}))

import { GET, POST } from "../../../src/api/admin/bookings/route"
import {
  GET as GET_ID,
  PUT as PUT_ID,
} from "../../../src/api/admin/bookings/[id]/route"

function makeMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return res
}

describe("GET /admin/bookings", () => {
  let mockBookingModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockBookingModule = {
      listBookings: vi.fn().mockResolvedValue([]),
    }
    mockReq = {
      query: {},
      scope: { resolve: vi.fn().mockReturnValue(mockBookingModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("returns bookings with default pagination", async () => {
    const bookings = [{ id: "book_1" }, { id: "book_2" }]
    mockBookingModule.listBookings.mockResolvedValue(bookings)

    await GET(mockReq, mockRes)

    expect(mockRes.json).toHaveBeenCalledWith({
      bookings,
      count: 2,
      limit: 20,
      offset: 0,
    })
  })

  it("applies tenant scoping from cityosContext", async () => {
    mockReq.cityosContext = { tenantId: "tenant_abc" }
    mockBookingModule.listBookings.mockResolvedValue([])

    await GET(mockReq, mockRes)

    expect(mockBookingModule.listBookings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant_abc" }),
      expect.any(Object)
    )
  })

  it("skips tenant filter when tenantId is default", async () => {
    mockReq.cityosContext = { tenantId: "default" }
    mockBookingModule.listBookings.mockResolvedValue([])

    await GET(mockReq, mockRes)

    const filters = mockBookingModule.listBookings.mock.calls[0][0]
    expect(filters.tenant_id).toBeUndefined()
  })

  it("filters by status, customer_id, provider_id", async () => {
    mockReq.query = { status: "confirmed", customer_id: "cust_1", provider_id: "prov_1" }
    mockBookingModule.listBookings.mockResolvedValue([])

    await GET(mockReq, mockRes)

    expect(mockBookingModule.listBookings).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
        customer_id: "cust_1",
        provider_id: "prov_1",
      }),
      expect.any(Object)
    )
  })

  it("respects limit and offset query params", async () => {
    mockReq.query = { limit: "5", offset: "10" }
    mockBookingModule.listBookings.mockResolvedValue([])

    await GET(mockReq, mockRes)

    expect(mockBookingModule.listBookings).toHaveBeenCalledWith(
      expect.any(Object),
      { skip: 10, take: 5 }
    )
  })

  it("returns 500 on internal error", async () => {
    mockBookingModule.listBookings.mockRejectedValue(new Error("DB failure"))

    await GET(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/bookings", () => {
  let mockBookingModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockBookingModule = {
      createBookings: vi.fn().mockResolvedValue({ id: "book_new" }),
    }
    mockReq = {
      body: {
        customer_id: "cust_1",
        service_product_id: "svc_1",
        start_time: "2025-01-01T10:00:00Z",
        end_time: "2025-01-01T11:00:00Z",
      },
      query: {},
      scope: { resolve: vi.fn().mockReturnValue(mockBookingModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("creates a booking and returns 201", async () => {
    await POST(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({ booking: { id: "book_new" } })
  })

  it("returns 400 on validation error (missing customer_id)", async () => {
    mockReq.body = { service_product_id: "svc_1", start_time: "x", end_time: "y" }

    await POST(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation failed" })
    )
  })

  it("returns 400 on extra fields (strict schema)", async () => {
    mockReq.body = {
      customer_id: "cust_1",
      service_product_id: "svc_1",
      start_time: "2025-01-01T10:00:00Z",
      end_time: "2025-01-01T11:00:00Z",
      invalid_field: "bad",
    }

    await POST(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("assigns tenant_id from cityosContext", async () => {
    mockReq.cityosContext = { tenantId: "tenant_xyz" }

    await POST(mockReq, mockRes)

    expect(mockBookingModule.createBookings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant_xyz" })
    )
  })

  it("defaults tenant_id to 'default' when no context", async () => {
    await POST(mockReq, mockRes)

    expect(mockBookingModule.createBookings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "default" })
    )
  })

  it("returns 500 on service error", async () => {
    mockBookingModule.createBookings.mockRejectedValue(new Error("Service crash"))

    await POST(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("GET /admin/bookings/:id", () => {
  let mockQuery: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {
      graph: vi.fn().mockResolvedValue({ data: [{ id: "book_1", status: "confirmed" }] }),
    }
    mockReq = {
      params: { id: "book_1" },
      scope: { resolve: vi.fn().mockReturnValue(mockQuery) },
    }
    mockRes = makeMockRes()
  })

  it("returns booking by id", async () => {
    await GET_ID(mockReq, mockRes)

    expect(mockRes.json).toHaveBeenCalledWith({
      booking: { id: "book_1", status: "confirmed" },
    })
  })

  it("returns 404 when booking not found", async () => {
    mockQuery.graph.mockResolvedValue({ data: [undefined] })

    await GET_ID(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Booking not found" })
  })

  it("returns 500 on query error", async () => {
    mockQuery.graph.mockRejectedValue(new Error("Graph error"))

    await GET_ID(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("passes correct id filter to graph query", async () => {
    mockReq.params.id = "book_special"

    await GET_ID(mockReq, mockRes)

    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({ filters: { id: "book_special" } })
    )
  })
})

describe("PUT /admin/bookings/:id", () => {
  let mockBookingService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockBookingService = {
      updateBookings: vi.fn().mockResolvedValue({ id: "book_1", status: "confirmed" }),
    }
    mockReq = {
      params: { id: "book_1" },
      body: { status: "confirmed" },
      scope: { resolve: vi.fn().mockReturnValue(mockBookingService) },
    }
    mockRes = makeMockRes()
  })

  it("updates booking successfully", async () => {
    await PUT_ID(mockReq, mockRes)

    expect(mockBookingService.updateBookings).toHaveBeenCalledWith(
      expect.objectContaining({ id: "book_1", status: "confirmed" })
    )
    expect(mockRes.json).toHaveBeenCalledWith({
      booking: { id: "book_1", status: "confirmed" },
    })
  })

  it("returns 400 on validation error", async () => {
    mockReq.body = { status: 12345 }

    await PUT_ID(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation failed" })
    )
  })

  it("returns 500 on service error", async () => {
    mockBookingService.updateBookings.mockRejectedValue(new Error("Update failed"))

    await PUT_ID(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("accepts partial updates with passthrough schema", async () => {
    mockReq.body = { notes: "Updated note", customer_name: "Jane" }

    await PUT_ID(mockReq, mockRes)

    expect(mockBookingService.updateBookings).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Updated note", customer_name: "Jane" })
    )
  })
})
