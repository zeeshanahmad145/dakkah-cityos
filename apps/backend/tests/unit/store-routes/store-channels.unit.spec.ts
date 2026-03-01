import { GET } from "../../../src/api/store/channels/route";

describe("GET /store/channels", () => {
  let mockReq: any;
  let mockRes: any;
  let mockChannelService: any;

  beforeEach(() => {
    mockChannelService = {
      listSalesChannelMappings: jest.fn().mockResolvedValue([]),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockChannelService) },
      query: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("returns active channels", async () => {
    const channels = [{ id: "ch-1", name: "Online Store" }];
    mockChannelService.listSalesChannelMappings.mockResolvedValue(channels);

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: channels, count: 1 }),
    );
  });

  it("filters by channel_type when provided", async () => {
    mockReq.query = { channel_type: "marketplace" };

    await GET(mockReq, mockRes);

    expect(mockChannelService.listSalesChannelMappings).toHaveBeenCalledWith(
      expect.objectContaining({ channel_type: "marketplace", is_active: true }),
      expect.any(Object),
    );
  });

  it("filters by tenant_id when provided", async () => {
    mockReq.query = { tenant_id: "tenant-1" };

    await GET(mockReq, mockRes);

    expect(mockChannelService.listSalesChannelMappings).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant-1" }),
      expect.any(Object),
    );
  });

  it("applies pagination parameters", async () => {
    mockReq.query = { limit: "10", offset: "5" };

    await GET(mockReq, mockRes);

    expect(mockChannelService.listSalesChannelMappings).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ take: 10, skip: 5 }),
    );
  });

  it("wraps non-array result in array", async () => {
    mockChannelService.listSalesChannelMappings.mockResolvedValue({
      id: "ch-1",
    });

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: [{ id: "ch-1" }], count: 1 }),
    );
  });

  it("returns 500 when service throws", async () => {
    mockChannelService.listSalesChannelMappings.mockRejectedValue(
      new Error("DB down"),
    );

    await GET(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
