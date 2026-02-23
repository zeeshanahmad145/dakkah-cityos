jest.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: jest.fn((res, error, context) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("not found")) {
      return res.status(404).json({ message: `${context}: not found` })
    }
    return res.status(500).json({ message: `${context} failed` })
  }),
}))

import { GET, POST } from "../../../src/api/admin/commissions/route"
import { GET as GET_TIERS, POST as POST_TIERS } from "../../../src/api/admin/commissions/tiers/route"
import { GET as GET_PENDING, POST as POST_PENDING } from "../../../src/api/admin/commissions/pending/route"
import { GET as GET_TRANSACTIONS } from "../../../src/api/admin/commissions/transactions/route"

function makeMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  return res
}

describe("GET /admin/commissions", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { listCommissionRules: jest.fn().mockResolvedValue([]) }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("returns commission rules with pagination", async () => {
    const rules = [{ id: "cr_1" }]
    mockModule.listCommissionRules.mockResolvedValue(rules)
    await GET(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ rules, count: 1, limit: 20, offset: 0 })
  })

  it("applies tenant scoping", async () => {
    mockReq.cityosContext = { tenantId: "t1" }
    await GET(mockReq, mockRes)
    expect(mockModule.listCommissionRules).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t1" }),
      expect.any(Object)
    )
  })

  it("filters by type, is_active, vendor_id", async () => {
    mockReq.query = { type: "percentage", is_active: "true", vendor_id: "v1" }
    await GET(mockReq, mockRes)
    const filters = mockModule.listCommissionRules.mock.calls[0][0]
    expect(filters.commission_type).toBe("percentage")
    expect(filters.status).toBe("active")
    expect(filters.vendor_id).toBe("v1")
  })

  it("returns 500 on error", async () => {
    mockModule.listCommissionRules.mockRejectedValue(new Error("fail"))
    await GET(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/commissions", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { createCommissionRules: jest.fn().mockResolvedValue({ id: "cr_new" }) }
    mockReq = {
      body: { name: "Default", type: "percentage", rate: 10 },
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("creates commission rule with 201", async () => {
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({ rule: { id: "cr_new" } })
  })

  it("returns 400 on missing required fields", async () => {
    mockReq.body = { name: "Test" }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 on invalid type enum", async () => {
    mockReq.body = { name: "Test", type: "invalid", rate: 10 }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("maps percentage type correctly", async () => {
    mockReq.body = { name: "Pct", type: "percentage", rate: 15 }
    await POST(mockReq, mockRes)
    expect(mockModule.createCommissionRules).toHaveBeenCalledWith(
      expect.objectContaining({ commission_type: "percentage", commission_percentage: 15 })
    )
  })

  it("maps flat type correctly", async () => {
    mockReq.body = { name: "Flat", type: "flat", rate: 5 }
    await POST(mockReq, mockRes)
    expect(mockModule.createCommissionRules).toHaveBeenCalledWith(
      expect.objectContaining({ commission_type: "flat", commission_flat_amount: 5 })
    )
  })
})

describe("GET /admin/commissions/tiers", () => {
  let mockQuery: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockQuery) },
    }
    mockRes = makeMockRes()
  })

  it("returns tiers list", async () => {
    const tiers = [{ id: "tier_1", name: "Bronze", rate: 5 }]
    mockQuery.graph.mockResolvedValue({ data: tiers })
    await GET_TIERS(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ tiers })
  })

  it("returns 500 on error", async () => {
    mockQuery.graph.mockRejectedValue(new Error("fail"))
    await GET_TIERS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("queries commission_tier entity", async () => {
    await GET_TIERS(mockReq, mockRes)
    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "commission_tier" })
    )
  })

  it("returns empty array when no tiers exist", async () => {
    mockQuery.graph.mockResolvedValue({ data: [] })
    await GET_TIERS(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ tiers: [] })
  })
})

describe("POST /admin/commissions/tiers", () => {
  let mockQuery: any
  let mockCommissionService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) }
    mockCommissionService = { createCommissionTiers: jest.fn().mockResolvedValue({ id: "tier_new" }) }
    mockReq = {
      body: { name: "Gold", min_revenue: 1000, max_revenue: 5000, rate: 10 },
      scope: {
        resolve: jest.fn((dep: string) => {
          if (dep === "query") return mockQuery
          return mockCommissionService
        }),
      },
    }
    mockRes = makeMockRes()
  })

  it("creates tier with 201", async () => {
    await POST_TIERS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({ tier: { id: "tier_new" } })
  })

  it("returns 400 on missing required fields", async () => {
    mockReq.body = { name: "Test" }
    await POST_TIERS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 on overlapping revenue ranges", async () => {
    mockQuery.graph.mockResolvedValue({
      data: [{ id: "existing", min_revenue: 500, max_revenue: 2000 }],
    })
    await POST_TIERS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Revenue range overlaps with existing tier" })
  })

  it("returns 400 when rate exceeds 100", async () => {
    mockReq.body = { name: "Bad", min_revenue: 0, rate: 150 }
    await POST_TIERS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })
})

describe("GET /admin/commissions/pending", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { listCommissionTransactions: jest.fn().mockResolvedValue([]) }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("returns pending transactions with total_unpaid", async () => {
    const txns = [
      { id: "t1", commission_amount: 100 },
      { id: "t2", commission_amount: 200 },
    ]
    mockModule.listCommissionTransactions.mockResolvedValue(txns)
    await GET_PENDING(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({
      transactions: txns,
      count: 2,
      total_unpaid: 300,
    })
  })

  it("filters by vendor_id", async () => {
    mockReq.query = { vendor_id: "v1" }
    await GET_PENDING(mockReq, mockRes)
    expect(mockModule.listCommissionTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ vendor_id: "v1" }),
      expect.any(Object)
    )
  })

  it("always includes unpaid/pending status filters", async () => {
    await GET_PENDING(mockReq, mockRes)
    expect(mockModule.listCommissionTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ payout_status: "unpaid", status: "pending" }),
      expect.any(Object)
    )
  })

  it("returns 500 on error", async () => {
    mockModule.listCommissionTransactions.mockRejectedValue(new Error("fail"))
    await GET_PENDING(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/commissions/pending (bulk settle)", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { processCommissionPayout: jest.fn().mockResolvedValue({ processed_count: 2 }) }
    mockReq = {
      body: { transaction_ids: ["t1", "t2"] },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("settles transactions successfully", async () => {
    await POST_PENDING(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Settled 2 commission transactions" })
    )
  })

  it("returns 400 when transaction_ids is empty", async () => {
    mockReq.body = { transaction_ids: [] }
    await POST_PENDING(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when transaction_ids is missing", async () => {
    mockReq.body = {}
    await POST_PENDING(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 500 on service error", async () => {
    mockModule.processCommissionPayout.mockRejectedValue(new Error("fail"))
    await POST_PENDING(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("GET /admin/commissions/transactions", () => {
  let mockQuery: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [] }),
    }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockQuery) },
    }
    mockRes = makeMockRes()
  })

  it("returns transactions with vendor names and summary", async () => {
    mockQuery.graph
      .mockResolvedValueOnce({ data: [{ id: "p1", vendor_id: "v1", amount: "100", status: "completed" }] })
      .mockResolvedValueOnce({ data: [{ id: "v1", store_name: "Shop A" }] })
      .mockResolvedValueOnce({ data: [{ id: "p1", amount: "100", status: "completed" }] })
    await GET_TRANSACTIONS(mockReq, mockRes)
    const result = mockRes.json.mock.calls[0][0]
    expect(result.transactions[0].vendor_name).toBe("Shop A")
    expect(result.summary).toBeDefined()
  })

  it("filters by vendor_id", async () => {
    mockReq.query = { vendor_id: "v1" }
    mockQuery.graph.mockResolvedValue({ data: [] })
    await GET_TRANSACTIONS(mockReq, mockRes)
    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ vendor_id: "v1" }),
      })
    )
  })

  it("filters by status", async () => {
    mockReq.query = { status: "pending" }
    mockQuery.graph.mockResolvedValue({ data: [] })
    await GET_TRANSACTIONS(mockReq, mockRes)
    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ status: "pending" }),
      })
    )
  })

  it("returns 500 on error", async () => {
    mockQuery.graph.mockRejectedValue(new Error("fail"))
    await GET_TRANSACTIONS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})
