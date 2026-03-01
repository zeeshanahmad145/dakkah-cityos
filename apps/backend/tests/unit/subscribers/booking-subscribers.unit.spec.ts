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

import bookingCancelledHandler from "../../../src/subscribers/booking-cancelled";
import { config as cancelledConfig } from "../../../src/subscribers/booking-cancelled";
import bookingCheckedInHandler from "../../../src/subscribers/booking-checked-in";
import { config as checkedInConfig } from "../../../src/subscribers/booking-checked-in";
import bookingCompletedHandler from "../../../src/subscribers/booking-completed";
import { config as completedConfig } from "../../../src/subscribers/booking-completed";
import bookingConfirmedHandler from "../../../src/subscribers/booking-confirmed";
import { config as confirmedConfig } from "../../../src/subscribers/booking-confirmed";
import bookingCreatedHandler from "../../../src/subscribers/booking-created";
import { config as createdConfig } from "../../../src/subscribers/booking-created";

const mockCreateNotifications = jest.fn();
const mockRetrieveBooking = jest.fn();

function makeContainer() {
  return {
    resolve: jest.fn((dep: string) => {
      if (dep === "notification")
        return { createNotifications: mockCreateNotifications };
      if (dep === "booking") return { retrieveBooking: mockRetrieveBooking };
      return {};
    }),
  };
}

function makeArgs(data: any) {
  return { event: { data }, container: makeContainer() };
}

const fullBooking = {
  id: "booking_1",
  customer: { email: "test@test.com", first_name: "John" },
  service: { title: "Haircut", location: "123 Main St", handle: "haircut" },
  start_time: "2025-01-01T10:00:00Z",
  end_time: "2025-01-01T11:00:00Z",
  metadata: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRetrieveBooking.mockResolvedValue(fullBooking);
});

describe("booking-cancelled subscriber", () => {
  it("exports correct event config", () => {
    expect(cancelledConfig.event).toBe("booking.cancelled");
  });

  it("sends email and admin notification on cancellation", async () => {
    await bookingCancelledHandler(
      makeArgs({ id: "booking_1", reason: "conflict" }),
    );

    expect(mockRetrieveBooking).toHaveBeenCalledWith("booking_1");
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "booking-cancelled",
        to: "test@test.com",
      }),
    );
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui", channel: "feed" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveBooking.mockRejectedValue(new Error("DB error"));
    await expect(
      bookingCancelledHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("booking-checked-in subscriber", () => {
  it("exports correct event config", () => {
    expect(checkedInConfig.event).toBe("booking.checked_in");
  });

  it("sends admin notification on check-in", async () => {
    await bookingCheckedInHandler(makeArgs({ id: "booking_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "admin-ui" }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveBooking.mockRejectedValue(new Error("fail"));
    await expect(
      bookingCheckedInHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("booking-completed subscriber", () => {
  it("exports correct event config", () => {
    expect(completedConfig.event).toBe("booking.completed");
  });

  it("sends email notification with review URL", async () => {
    await bookingCompletedHandler(makeArgs({ id: "booking_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "booking-completed",
        to: "test@test.com",
        data: expect.objectContaining({
          review_url: expect.stringContaining("/review"),
        }),
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveBooking.mockRejectedValue(new Error("fail"));
    await expect(
      bookingCompletedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("booking-confirmed subscriber", () => {
  it("exports correct event config", () => {
    expect(confirmedConfig.event).toBe("booking.confirmed");
  });

  it("sends email and admin notification on confirmation", async () => {
    await bookingConfirmedHandler(makeArgs({ id: "booking_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "booking-confirmed",
        to: "test@test.com",
      }),
    );
  });

  it("handles errors gracefully", async () => {
    mockRetrieveBooking.mockRejectedValue(new Error("fail"));
    await expect(
      bookingConfirmedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});

describe("booking-created subscriber", () => {
  it("exports correct event config", () => {
    expect(createdConfig.event).toBe("booking.created");
  });

  it("sends email and admin notification on creation", async () => {
    await bookingCreatedHandler(makeArgs({ id: "booking_1" }));
    expect(mockCreateNotifications).toHaveBeenCalledTimes(2);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking-confirmation" }),
    );
  });

  it("returns early when booking not found", async () => {
    mockRetrieveBooking.mockResolvedValue(null);
    await bookingCreatedHandler(makeArgs({ id: "missing" }));
    expect(mockCreateNotifications).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockRetrieveBooking.mockRejectedValue(new Error("fail"));
    await expect(
      bookingCreatedHandler(makeArgs({ id: "x" })),
    ).resolves.toBeUndefined();
  });
});
