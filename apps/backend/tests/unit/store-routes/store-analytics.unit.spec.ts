import { GET } from "../../../src/api/store/analytics/route";

describe("GET /store/analytics", () => {
  let mockReq: any;
  let mockRes: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    mockAnalyticsService = {
      listAnalyticsEvents: jest.fn().mockResolvedValue([]),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockAnalyticsService) },
      auth_context: { actor_id: "customer-1" },
      query: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("returns 401 when no auth context", async () => {
    mockReq.auth_context = undefined;
    await GET(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
  });

  it("returns 401 when actor_id is missing", async () => {
    mockReq.auth_context = { actor_id: null };
    await GET(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it("returns analytics events for authenticated customer", async () => {
    const events = [
      { id: "evt-1", event_type: "page_view", created_at: "2025-01-01" },
      { id: "evt-2", event_type: "purchase", created_at: "2025-01-02" },
    ];
    mockAnalyticsService.listAnalyticsEvents.mockResolvedValue(events);

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      items: events,
      count: 2,
      limit: 20,
      offset: 0,
    });
  });

  it("passes event_type filter when provided", async () => {
    mockReq.query = { event_type: "purchase" };
    mockAnalyticsService.listAnalyticsEvents.mockResolvedValue([]);

    await GET(mockReq, mockRes);

    expect(mockAnalyticsService.listAnalyticsEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: "customer-1",
        event_type: "purchase",
      }),
      expect.any(Object),
    );
  });

  it("applies pagination parameters", async () => {
    mockReq.query = { limit: "5", offset: "10" };
    mockAnalyticsService.listAnalyticsEvents.mockResolvedValue([]);

    await GET(mockReq, mockRes);

    expect(mockAnalyticsService.listAnalyticsEvents).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ take: 5, skip: 10 }),
    );
  });

  it("uses default pagination when not provided", async () => {
    await GET(mockReq, mockRes);

    expect(mockAnalyticsService.listAnalyticsEvents).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ take: 20, skip: 0 }),
    );
  });

  it("wraps non-array response in array", async () => {
    mockAnalyticsService.listAnalyticsEvents.mockResolvedValue({ id: "evt-1" });

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: [{ id: "evt-1" }], count: 1 }),
    );
  });

});
