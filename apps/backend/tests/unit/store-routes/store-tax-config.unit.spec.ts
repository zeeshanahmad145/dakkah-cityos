import { GET } from "../../../src/api/store/tax-config/route";

describe("GET /store/tax-config", () => {
  let mockReq: any;
  let mockRes: any;
  let mockTaxConfigService: any;

  beforeEach(() => {
    mockTaxConfigService = {
      listTaxRules: jest.fn().mockResolvedValue([]),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockTaxConfigService) },
      query: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("returns active tax rules", async () => {
    const rules = [{ id: "tax-1", rate: 0.1, country_code: "US" }];
    mockTaxConfigService.listTaxRules.mockResolvedValue(rules);

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: rules, count: 1 }),
    );
  });

  it("filters by country_code when provided", async () => {
    mockReq.query = { country_code: "AE" };

    await GET(mockReq, mockRes);

    expect(mockTaxConfigService.listTaxRules).toHaveBeenCalledWith(
      expect.objectContaining({ country_code: "AE", status: "active" }),
      expect.any(Object),
    );
  });

  it("filters by region when provided", async () => {
    mockReq.query = { region: "mena" };

    await GET(mockReq, mockRes);

    expect(mockTaxConfigService.listTaxRules).toHaveBeenCalledWith(
      expect.objectContaining({ region_code: "mena" }),
      expect.any(Object),
    );
  });

  it("filters by tenant_id when provided", async () => {
    mockReq.query = { tenant_id: "tenant-1" };

    await GET(mockReq, mockRes);

    expect(mockTaxConfigService.listTaxRules).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "tenant-1" }),
      expect.any(Object),
    );
  });

  it("orders by priority descending", async () => {
    await GET(mockReq, mockRes);

    expect(mockTaxConfigService.listTaxRules).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ order: { priority: "DESC" } }),
    );
  });

});
