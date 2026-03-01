jest.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: jest.fn((res, error, context) => {
    return res.status(500).json({ message: `${context} failed` });
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from "../../../src/api/store/features/route";

function makeMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

describe("GET /store/features", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: { authorization: "Bearer token_123" },
      query: {},
    };
    mockRes = makeMockRes();
  });

  it("returns default features when admin fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    await GET(mockReq, mockRes);
    const result = mockRes.json.mock.calls[0][0];
    expect(result.features).toBeDefined();
    expect(typeof result.features.marketplace).toBe("boolean");
    expect(typeof result.features.b2b).toBe("boolean");
    expect(typeof result.features.subscriptions).toBe("boolean");
    expect(typeof result.features.bookings).toBe("boolean");
    expect(typeof result.features.reviews).toBe("boolean");
  });

  it("returns features with correct structure", async () => {
    mockFetch.mockResolvedValue(null);
    await GET(mockReq, mockRes);
    const result = mockRes.json.mock.calls[0][0];
    expect(result.features).toHaveProperty("config");
    expect(result.features).toHaveProperty("homepage");
    expect(result.features).toHaveProperty("navigation");
    expect(result.features.homepage).toHaveProperty("sections");
    expect(result.features.navigation).toHaveProperty("header");
    expect(result.features.navigation).toHaveProperty("footer");
  });

  it("returns default navigation structure", async () => {
    mockFetch.mockResolvedValue(null);
    await GET(mockReq, mockRes);
    const nav = mockRes.json.mock.calls[0][0].features.navigation;
    expect(nav.header.showCategories).toBe(true);
    expect(nav.header.showVendors).toBe(false);
    expect(nav.footer.showCategories).toBe(true);
    expect(nav.footer.customSections).toEqual([]);
  });

  it("transforms admin features to public flags when fetch succeeds", async () => {
    const adminFeatures = {
      modules: {
        marketplace: {
          enabled: true,
          config: { allowVendorRegistration: true, showVendorPages: true },
        },
        b2b: {
          enabled: false,
          config: {
            allowCompanyRegistration: false,
            enableQuotes: false,
            enableInvoices: false,
          },
        },
        subscriptions: {
          enabled: true,
          config: {
            showOnProductPages: true,
            trialEnabled: true,
            trialDays: 14,
          },
        },
        bookings: { enabled: false, config: { showOnHomepage: false } },
        reviews: {
          enabled: true,
          config: { showOnProductPages: true, allowPhotos: true },
        },
        volumePricing: {
          enabled: false,
          config: { showOnProductPages: false, showSavingsPercentage: false },
        },
        wishlists: { enabled: true, config: {} },
        giftCards: { enabled: false, config: {} },
      },
      homepage: {
        sections: [{ id: "hero", type: "hero", enabled: true, config: {} }],
      },
      navigation: {
        header: {
          showCategories: true,
          showVendors: true,
          showServices: false,
          showB2BPortal: false,
          customLinks: [],
        },
        footer: {
          showCategories: true,
          showVendors: true,
          showServices: false,
          customSections: [],
        },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ features: adminFeatures }),
    });
    await GET(mockReq, mockRes);
    const features = mockRes.json.mock.calls[0][0].features;
    expect(features.marketplace).toBe(true);
    expect(features.b2b).toBe(false);
    expect(features.subscriptions).toBe(true);
    expect(features.config.marketplace).toEqual({
      allowRegistration: true,
      showVendorPages: true,
    });
    expect(features.config.subscriptions).toEqual({
      showOnProducts: true,
      trialEnabled: true,
      trialDays: 14,
    });
  });

  it("passes authorization header to admin fetch", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await GET(mockReq, mockRes);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/settings/features"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token_123" }),
      }),
    );
  });

  it("returns default homepage sections", async () => {
    mockFetch.mockResolvedValue(null);
    await GET(mockReq, mockRes);
    const sections = mockRes.json.mock.calls[0][0].features.homepage.sections;
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]).toHaveProperty("id");
    expect(sections[0]).toHaveProperty("type");
    expect(sections[0]).toHaveProperty("enabled");
  });

  it("defaults wishlists and reviews to enabled", async () => {
    mockFetch.mockResolvedValue(null);
    await GET(mockReq, mockRes);
    const features = mockRes.json.mock.calls[0][0].features;
    expect(features.reviews).toBe(true);
    expect(features.wishlists).toBe(true);
  });

  it("handles missing authorization header", async () => {
    mockReq.headers = {};
    mockFetch.mockResolvedValue({ ok: false });
    await GET(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalled();
    const features = mockRes.json.mock.calls[0][0].features;
    expect(features).toBeDefined();
  });
});
