import { GET } from "../../../src/api/store/audit/route";

describe("GET /store/audit", () => {
  let mockReq: any;
  let mockRes: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockAuditService = {
      searchAuditLogs: jest.fn().mockResolvedValue([]),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockAuditService) },
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
  });

  it("returns audit logs for authenticated customer", async () => {
    const logs = [
      {
        id: "log-1",
        action: "order.created",
        resource_type: "order",
        resource_id: "ord-1",
        created_at: "2025-01-01",
        metadata: {},
      },
    ];
    mockAuditService.searchAuditLogs.mockResolvedValue(logs);

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        audit_logs: expect.arrayContaining([
          expect.objectContaining({ id: "log-1", action: "order.created" }),
        ]),
        count: 1,
      }),
    );
  });

  it("filters by action when provided", async () => {
    mockReq.query = { action: "order.created" };

    await GET(mockReq, mockRes);

    expect(mockAuditService.searchAuditLogs).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        action: "order.created",
        actorId: "customer-1",
      }),
    );
  });

  it("applies pagination with defaults", async () => {
    const logs = Array.from({ length: 30 }, (_, i) => ({
      id: `log-${i}`,
      action: "test",
      resource_type: "test",
      resource_id: `r-${i}`,
      created_at: "2025-01-01",
      metadata: {},
    }));
    mockAuditService.searchAuditLogs.mockResolvedValue(logs);

    await GET(mockReq, mockRes);

    const response = mockRes.json.mock.calls[0][0];
    expect(response.audit_logs).toHaveLength(20);
    expect(response.limit).toBe(20);
    expect(response.offset).toBe(0);
  });

  it("caps limit at 50", async () => {
    mockReq.query = { limit: "100" };
    const logs = Array.from({ length: 60 }, (_, i) => ({
      id: `log-${i}`,
      action: "test",
      resource_type: "test",
      resource_id: `r-${i}`,
      created_at: "2025-01-01",
      metadata: {},
    }));
    mockAuditService.searchAuditLogs.mockResolvedValue(logs);

    await GET(mockReq, mockRes);

    const response = mockRes.json.mock.calls[0][0];
    expect(response.limit).toBe(50);
  });

  it("returns 500 when service throws", async () => {
    mockAuditService.searchAuditLogs.mockRejectedValue(
      new Error("Search failed"),
    );

    await GET(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Search failed" }),
    );
  });
});
