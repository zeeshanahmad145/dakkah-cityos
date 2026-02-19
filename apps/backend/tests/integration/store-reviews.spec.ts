import { POST } from "../../src/api/store/reviews/route"
import { POST as markHelpful } from "../../src/api/store/reviews/[id]/helpful/route"

const mockJson = jest.fn()
const mockStatus = jest.fn(() => ({ json: mockJson }))

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  params: {},
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

describe("Store Reviews Endpoints", () => {
  describe("POST /store/reviews", () => {
    const validBody = {
      rating: 5,
      content: "Excellent product, highly recommend!",
      product_id: "prod_01",
      title: "Great quality",
    }

    it("should create a review for authenticated customer", async () => {
      const mockReview = { id: "rev_01", rating: 5, content: validBody.content }
      const req = createMockReq({
        body: validBody,
        review: { createReview: jest.fn().mockResolvedValue(mockReview) },
        query: {
          graph: jest.fn()
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [{ first_name: "Jane", last_name: "Doe", email: "jane@example.com" }] }),
        },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(201)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ review: mockReview }))
    })

    it("should return 401 when not authenticated", async () => {
      const req = createMockReq({ body: validBody, auth_context: {} }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should return 400 when neither product_id nor vendor_id is provided", async () => {
      const req = createMockReq({
        body: { rating: 5, content: "Good stuff" },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Product ID or Vendor ID is required" })
      )
    })

    it("should return 400 for invalid rating", async () => {
      const req = createMockReq({
        body: { ...validBody, rating: 0 },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation failed" }))
    })

    it("should return 400 when content is empty", async () => {
      const req = createMockReq({
        body: { ...validBody, content: "" },
      }) as any
      const res = createMockRes()

      await POST(req, res)
      expect(mockStatus).toHaveBeenCalledWith(400)
    })
  })

  describe("POST /store/reviews/:id/helpful", () => {
    it("should mark a review as helpful", async () => {
      const req = createMockReq({
        params: { id: "rev_01" },
        body: {},
        review: { markHelpful: jest.fn().mockResolvedValue(undefined) },
      }) as any
      const res = createMockRes()

      await markHelpful(req, res)
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it("should return 401 when not authenticated", async () => {
      const req = createMockReq({ params: { id: "rev_01" }, body: {}, auth_context: {} }) as any
      const res = createMockRes()

      await markHelpful(req, res)
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it("should handle service errors gracefully", async () => {
      const req = createMockReq({
        params: { id: "rev_01" },
        body: {},
        review: { markHelpful: jest.fn().mockRejectedValue(new Error("Review not found")) },
      }) as any
      const res = createMockRes()

      await markHelpful(req, res)
      expect(mockStatus).toHaveBeenCalledWith(500)
    })
  })
})
