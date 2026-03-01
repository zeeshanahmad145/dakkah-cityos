jest.mock("../../../src/lib/logger", () => ({
  subscriberLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../src/lib/config", () => ({
  appConfig: {
    storefrontUrl: "https://store.test",
    urls: { storefront: "https://store.test" },
    emails: { support: "support@test.com" },
    features: {
      enableEmailNotifications: true,
      enableAdminNotifications: true,
    },
  },
}));

import vendorApprovedHandler from "../../../src/subscribers/vendor-approved";
import { config as approvedConfig } from "../../../src/subscribers/vendor-approved";
import vendorSuspendedHandler from "../../../src/subscribers/vendor-suspended";
import { config as suspendedConfig } from "../../../src/subscribers/vendor-suspended";

const mockCreateNotifications = jest.fn();
const mockGraph = jest.fn();

function makeContainer() {
  return {
    resolve: jest.fn((dep: string) => {
      if (dep === "notification")
        return { createNotifications: mockCreateNotifications };
      if (dep === "query") return { graph: mockGraph };
      if (dep === "logger")
        return { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
      return {};
    }),
  };
}

function makeArgs(data: any) {
  return { event: { data }, container: makeContainer() };
}

const fullVendor = {
  id: "vendor_1",
  name: "Cool Store",
  contact_email: "vendor@test.com",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGraph.mockResolvedValue({ data: [fullVendor] });
});

describe("vendor-approved subscriber", () => {
  it("exports correct event config", () => {
    expect(approvedConfig.event).toBe("vendor.approved");
  });

  it("sends email and admin notification", async () => {
    await vendorApprovedHandler(makeArgs({ id: "vendor_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "vendor-approved",
        to: "vendor@test.com",
      }),
    );
  });

  it("returns early when vendor not found", async () => {
    mockGraph.mockResolvedValue({ data: [] });
    await vendorApprovedHandler(makeArgs({ id: "missing" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      vendorApprovedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("vendor-suspended subscriber", () => {
  it("exports correct event config", () => {
    expect(suspendedConfig.event).toBe("vendor.suspended");
  });

  it("sends email and admin notification with reason", async () => {
    await vendorSuspendedHandler(makeArgs({ id: "vendor_1", reason: "fraud" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "vendor-suspended",
        to: "vendor@test.com",
        data: expect.objectContaining({ reason: "fraud" }),
      }),
    );
  });

  it("skips email when vendor has no contact_email", async () => {
    mockGraph.mockResolvedValue({
      data: [{ ...fullVendor, contact_email: null }],
    });
    await vendorSuspendedHandler(makeArgs({ id: "vendor_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(1);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      vendorSuspendedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});
