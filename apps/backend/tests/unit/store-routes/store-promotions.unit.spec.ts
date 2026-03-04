import { GET } from "../../../src/api/store/promotions/route";

describe("GET /store/promotions", () => {
  let mockReq: any;
  let mockRes: any;
  let mockPromotionService: any;

  beforeEach(() => {
    mockPromotionService = {
      listGiftCardExts: jest.fn().mockResolvedValue([]),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockPromotionService) },
      query: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("returns active promotions", async () => {
    const promos = [{ id: "promo-1", title: "Summer Sale" }];
    mockPromotionService.listGiftCardExts.mockResolvedValue(promos);

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: promos, count: 1 }),
    );
  });

  it("filters by category when provided", async () => {
    mockReq.query = { category: "electronics" };

    await GET(mockReq, mockRes);

    expect(mockPromotionService.listGiftCardExts).toHaveBeenCalledWith(
      expect.objectContaining({ category: "electronics", is_active: true }),
      expect.any(Object),
    );
  });

  it("filters by tenant_id when provided", async () => {
    mockReq.query = { tenant_id: "tenant-1" };

    await GET(mockReq, mockRes);

    expect(mockPromotionService.listGiftCardExts).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant-1" }),
      expect.any(Object),
    );
  });

  it("applies pagination parameters", async () => {
    mockReq.query = { limit: "10", offset: "5" };

    await GET(mockReq, mockRes);

    expect(mockPromotionService.listGiftCardExts).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ take: 10, skip: 5 }),
    );
  });

  it("uses default pagination", async () => {
    await GET(mockReq, mockRes);

    expect(mockPromotionService.listGiftCardExts).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        take: 20,
        skip: 0,
        order: { created_at: "DESC" },
      }),
    );
  });

  it("only returns non-expired promotions", async () => {
    await GET(mockReq, mockRes);

    expect(mockPromotionService.listGiftCardExts).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: expect.objectContaining({ $gte: expect.any(Date) }),
      }),
      expect.any(Object),
    );
  });

});
