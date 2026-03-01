jest.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: jest.fn((res, error, context) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not found") || message.includes("Not found")) {
      return res.status(404).json({ message: `${context}: not found` });
    }
    return res.status(500).json({ message: `${context} failed` });
  }),
}));

import { GET, POST } from "../../../src/api/admin/auctions/route";
import {
  GET as GET_ID,
  POST as POST_ID,
  DELETE as DELETE_ID,
} from "../../../src/api/admin/auctions/[id]/route";

function makeMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

describe("GET /admin/auctions", () => {
  let mockModule: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModule = { listAuctionListings: jest.fn().mockResolvedValue([]) };
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    };
    mockRes = makeMockRes();
  });

  it("returns auctions with pagination", async () => {
    const auctions = [{ id: "auc_1" }, { id: "auc_2" }];
    mockModule.listAuctionListings.mockResolvedValue(auctions);
    await GET(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      auctions,
      count: 2,
      limit: 20,
      offset: 0,
    });
  });

  it("applies tenant scoping", async () => {
    mockReq.cityosContext = { tenantId: "t1" };
    await GET(mockReq, mockRes);
    expect(mockModule.listAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t1" }),
      expect.any(Object),
    );
  });

  it("filters by status, seller_id, category_id", async () => {
    mockReq.query = { status: "active", seller_id: "s1", category_id: "cat_1" };
    await GET(mockReq, mockRes);
    expect(mockModule.listAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        seller_id: "s1",
        category_id: "cat_1",
      }),
      expect.any(Object),
    );
  });

  it("returns 500 on error", async () => {
    mockModule.listAuctionListings.mockRejectedValue(new Error("fail"));
    await GET(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("applies custom pagination", async () => {
    mockReq.query = { limit: "10", offset: "5" };
    await GET(mockReq, mockRes);
    expect(mockModule.listAuctionListings).toHaveBeenCalledWith(
      expect.any(Object),
      { skip: 5, take: 10 },
    );
  });
});

describe("POST /admin/auctions", () => {
  let mockModule: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModule = {
      createAuctionListings: jest.fn().mockResolvedValue({ id: "auc_new" }),
    };
    mockReq = {
      body: {
        title: "Rare Item",
        auction_type: "english",
        starting_price: 100,
        currency_code: "usd",
        bid_increment: 10,
        starts_at: "2025-01-01T10:00:00Z",
        ends_at: "2025-01-01T18:00:00Z",
        seller_id: "seller_1",
      },
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    };
    mockRes = makeMockRes();
  });

  it("creates auction with 201", async () => {
    await POST(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ auction: { id: "auc_new" } });
  });

  it("passes starts_at/ends_at correctly", async () => {
    await POST(mockReq, mockRes);
    expect(mockModule.createAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({
        starts_at: "2025-01-01T10:00:00Z",
        ends_at: "2025-01-01T18:00:00Z",
      }),
    );
  });

  it("returns 400 on missing title", async () => {
    mockReq.body = {
      starting_price: 100,
      starts_at: "x",
      ends_at: "y",
      seller_id: "s1",
    };
    await POST(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 on missing seller_id", async () => {
    mockReq.body = {
      title: "Item",
      starting_price: 100,
      starts_at: "x",
      ends_at: "y",
    };
    await POST(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 on extra fields (strict schema)", async () => {
    mockReq.body = {
      title: "Item",
      auction_type: "english",
      currency_code: "usd",
      bid_increment: 10,
      starting_price: 100,
      starts_at: "2025-01-01T10:00:00Z",
      ends_at: "2025-01-01T18:00:00Z",
      seller_id: "s1",
      unknown: "bad",
    };
    await POST(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("defaults tenant_id to 'default'", async () => {
    await POST(mockReq, mockRes);
    expect(mockModule.createAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "default" }),
    );
  });
});

describe("GET /admin/auctions/:id", () => {
  let mockModule: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModule = { listAuctionListings: jest.fn() };
    mockReq = {
      params: { id: "auc_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    };
    mockRes = makeMockRes();
  });

  it("returns auction by id", async () => {
    mockModule.listAuctionListings.mockResolvedValue([
      { id: "auc_1", title: "Item" },
    ]);
    await GET_ID(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      item: { id: "auc_1", title: "Item" },
    });
  });

  it("returns 404 when not found", async () => {
    mockModule.listAuctionListings.mockResolvedValue([]);
    await GET_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Not found" });
  });

  it("returns 500 on error", async () => {
    mockModule.listAuctionListings.mockRejectedValue(new Error("fail"));
    await GET_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("queries with correct id filter", async () => {
    mockModule.listAuctionListings.mockResolvedValue([{ id: "auc_1" }]);
    await GET_ID(mockReq, mockRes);
    expect(mockModule.listAuctionListings).toHaveBeenCalledWith(
      { id: "auc_1" },
      { take: 1 },
    );
  });
});

describe("POST /admin/auctions/:id (update)", () => {
  let mockModule: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModule = {
      updateAuctionListings: jest
        .fn()
        .mockResolvedValue({ id: "auc_1", title: "Updated" }),
    };
    mockReq = {
      params: { id: "auc_1" },
      body: { title: "Updated" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    };
    mockRes = makeMockRes();
  });

  it("updates auction successfully", async () => {
    await POST_ID(mockReq, mockRes);
    expect(mockModule.updateAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({ id: "auc_1", title: "Updated" }),
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      item: { id: "auc_1", title: "Updated" },
    });
  });

  it("returns 400 on invalid status enum", async () => {
    mockReq.body = { status: "invalid_status" };
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("returns 500 on service error", async () => {
    mockModule.updateAuctionListings.mockRejectedValue(new Error("fail"));
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("accepts valid status enum values", async () => {
    mockReq.body = { status: "active" };
    await POST_ID(mockReq, mockRes);
    expect(mockModule.updateAuctionListings).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });
});

describe("DELETE /admin/auctions/:id", () => {
  let mockModule: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModule = {
      deleteAuctionListings: jest.fn().mockResolvedValue(undefined),
    };
    mockReq = {
      params: { id: "auc_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    };
    mockRes = makeMockRes();
  });

  it("deletes auction and returns 204", async () => {
    await DELETE_ID(mockReq, mockRes);
    expect(mockModule.deleteAuctionListings).toHaveBeenCalledWith(["auc_1"]);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockModule.deleteAuctionListings.mockRejectedValue(new Error("fail"));
    await DELETE_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("passes id as array to delete method", async () => {
    mockReq.params.id = "auc_special";
    await DELETE_ID(mockReq, mockRes);
    expect(mockModule.deleteAuctionListings).toHaveBeenCalledWith([
      "auc_special",
    ]);
  });

  it("resolves auction module from scope", async () => {
    await DELETE_ID(mockReq, mockRes);
    expect(mockReq.scope.resolve).toHaveBeenCalledWith("auction");
  });
});
