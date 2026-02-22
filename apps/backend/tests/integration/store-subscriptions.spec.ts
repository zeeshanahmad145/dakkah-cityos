import { GET } from "../../src/api/store/subscriptions/route"

const mockJson = jest.fn()
const mockStatus = jest.fn(() => ({ json: mockJson }))

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
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

describe("Store Subscriptions Endpoints", () => {
  describe("GET /store/subscriptions", () => {
    it("should return subscriptions for authenticated customer", async () => {
      const mockItems = [
        { id: "sub_01", status: "active", customer_id: "cust_01" },
        { id: "sub_02", status: "paused", customer_id: "cust_01" },
      ]
      const req = createMockReq({
        subscription: {
          listAndCountSubscriptions: jest.fn().mockResolvedValue([mockItems, 2]),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ items: mockItems, count: 2 })
      )
    })

    it("should apply query filters for status", async () => {
      const listAndCountSubscriptions = jest.fn().mockResolvedValue([[], 0])
      const req = createMockReq({
        query: { status: "active", limit: "10", offset: "5" },
        subscription: { listAndCountSubscriptions },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(listAndCountSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active", customer_id: "cust_01" }),
        expect.objectContaining({ skip: 5, take: 10 })
      )
    })

    it("should return empty array when no subscriptions exist", async () => {
      const req = createMockReq({
        subscription: {
          listAndCountSubscriptions: jest.fn().mockResolvedValue([[], 0]),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ items: [], count: 0 })
      )
    })

    it("should handle unauthenticated requests by omitting customer filter", async () => {
      const listAndCountSubscriptions = jest.fn().mockResolvedValue([[], 0])
      const req = createMockReq({
        auth_context: {},
        subscription: { listAndCountSubscriptions },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(listAndCountSubscriptions).toHaveBeenCalledWith(
        expect.not.objectContaining({ customer_id: expect.anything() }),
        expect.anything()
      )
    })

    it("should handle service errors gracefully", async () => {
      const req = createMockReq({
        subscription: {
          listAndCountSubscriptions: jest.fn().mockRejectedValue(new Error("DB error")),
          listSubscriptions: jest.fn().mockRejectedValue(new Error("DB error")),
        },
      }) as any
      const res = createMockRes()

      await GET(req, res)
      expect(mockStatus).toHaveBeenCalledWith(500)
    })
  })
})
