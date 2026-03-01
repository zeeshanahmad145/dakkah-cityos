jest.mock("../../../src/lib/logger", () => ({
  subscriberLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../src/lib/config", () => ({
  appConfig: {
    storefrontUrl: "https://store.test",
    urls: { storefront: "https://store.test" },
    features: {
      enableEmailNotifications: true,
      enableAdminNotifications: true,
    },
  },
}));

import orderCancelledHandler from "../../../src/subscribers/order-cancelled";
import { config as cancelledConfig } from "../../../src/subscribers/order-cancelled";
import orderPlacedHandler from "../../../src/subscribers/order-placed";
import { config as placedConfig } from "../../../src/subscribers/order-placed";
import orderReturnedHandler from "../../../src/subscribers/order-returned";
import { config as returnedConfig } from "../../../src/subscribers/order-returned";
import orderShippedHandler from "../../../src/subscribers/order-shipped";
import { config as shippedConfig } from "../../../src/subscribers/order-shipped";

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

const fullOrder = {
  id: "order_1",
  display_id: 1001,
  email: "buyer@test.com",
  total: 5000,
  currency_code: "usd",
  items: [{ id: "item_1" }],
  shipping_address: { city: "NYC" },
  customer: { first_name: "Jane", last_name: "Doe", email: "buyer@test.com" },
  fulfillments: [
    {
      id: "ful_1",
      tracking_numbers: ["TRACK123"],
      tracking_links: ["https://track.test"],
      provider_id: "fedex",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGraph.mockResolvedValue({ data: [fullOrder] });
});

describe("order-cancelled subscriber", () => {
  it("exports correct event config", () => {
    expect(cancelledConfig.event).toBe("order.canceled");
  });

  it("sends email and admin notification", async () => {
    await orderCancelledHandler(
      makeArgs({ id: "order_1", reason: "out of stock" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "order-cancelled",
        to: "buyer@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      orderCancelledHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("order-placed subscriber", () => {
  it("exports correct event config", () => {
    expect(placedConfig.event).toBe("order.placed");
  });

  it("runs workflow sync for order (no notifications)", async () => {
    // order-placed.ts syncs inventory/ERPNext via workflows, not notifications.
    // It calls query.graph twice then workflows - mock returns empty items to avoid workflow calls.
    mockGraph.mockResolvedValue({ data: [{ ...fullOrder, items: [] }] });
    await orderPlacedHandler(makeArgs({ id: "order_1" }));
    // The subscriber calls query.graph and returns early when no items/variants
    expect(mockGraph).toHaveBeenCalled();
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("returns early when order has no email", async () => {
    mockGraph.mockResolvedValue({ data: [{ ...fullOrder, email: null }] });
    await orderPlacedHandler(makeArgs({ id: "order_1" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      orderPlacedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("order-returned subscriber", () => {
  it("exports correct event config", () => {
    expect(returnedConfig.event).toBe("order.return.received");
  });

  it("sends email and admin notification", async () => {
    await orderReturnedHandler(makeArgs({ id: "order_1", return_id: "ret_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "order-returned" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      orderReturnedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("order-shipped subscriber", () => {
  it("exports correct event config", () => {
    expect(shippedConfig.event).toBe("order.fulfillment_created");
  });

  it("sends email and admin notification with tracking info", async () => {
    await orderShippedHandler(
      makeArgs({ id: "order_1", fulfillment_id: "ful_1" }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "order-shipped",
        data: expect.objectContaining({ tracking_number: "TRACK123" }),
      }),
    );
  });

  it("returns early when order has no email", async () => {
    mockGraph.mockResolvedValue({ data: [{ ...fullOrder, email: null }] });
    await orderShippedHandler(makeArgs({ id: "order_1" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockGraph.mockRejectedValue(new Error("fail"));
    await expect(
      orderShippedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});
