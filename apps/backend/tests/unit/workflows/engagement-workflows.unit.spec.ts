jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => {
    return { run: jest.fn(), config, fn };
  }),
  createStep: jest.fn((_name, fn) => fn),
  StepResponse: jest.fn((data) => data),
  WorkflowResponse: jest.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
});

describe("Loyalty Reward Workflow", () => {
  let calculatePointsStep: any;
  let creditPointsStep: any;
  let notifyRewardStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/loyalty-reward.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    calculatePointsStep = calls.find(
      (c: any) => c[0] === "calculate-loyalty-points-step",
    )?.[1];
    creditPointsStep = calls.find(
      (c: any) => c[0] === "credit-loyalty-points-step",
    )?.[1];
    notifyRewardStep = calls.find(
      (c: any) => c[0] === "notify-loyalty-reward-step",
    )?.[1];
  });

  it("should calculate points with default multiplier", async () => {
    const result = await calculatePointsStep({
      customerId: "c1",
      orderId: "o1",
      orderTotal: 150,
      tenantId: "t1",
    });
    expect(result.points).toBe(150);
  });

  it("should calculate points with custom multiplier", async () => {
    const result = await calculatePointsStep({
      customerId: "c1",
      orderId: "o1",
      orderTotal: 150,
      tenantId: "t1",
      pointsMultiplier: 2,
    });
    expect(result.points).toBe(300);
  });

  it("should credit loyalty points", async () => {
    const tx = { id: "lt_1" };
    const container = mockContainer({
      loyalty: { createLoyaltyTransactions: jest.fn().mockResolvedValue(tx) },
    });
    const result = await creditPointsStep(
      { customerId: "c1", points: 100, orderId: "o1" },
      { container },
    );
    expect(result.transaction).toEqual(tx);
  });

  it("should send reward notification", async () => {
    const result = await notifyRewardStep({ customerId: "c1", points: 100 });
    expect(result.notified).toBe(true);
  });
});

describe("Subscription Renewal Workflow", () => {
  let checkSubscriptionStep: any;
  let chargeRenewalStep: any;
  let updateSubscriptionStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/subscription-renewal.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    checkSubscriptionStep = calls.find(
      (c: any) => c[0] === "check-subscription-status-step",
    )?.[1];
    chargeRenewalStep = calls.find(
      (c: any) => c[0] === "charge-renewal-step",
    )?.[1];
    updateSubscriptionStep = calls.find(
      (c: any) => c[0] === "update-subscription-period-step",
    )?.[1];
  });

  it("should check active subscription status", async () => {
    const sub = { id: "sub_1", status: "active" };
    const container = mockContainer({
      subscription: { retrieveSubscription: jest.fn().mockResolvedValue(sub) },
    });
    const result = await checkSubscriptionStep(
      {
        subscriptionId: "sub_1",
        customerId: "c1",
        planId: "p1",
        amount: 29,
        currency: "usd",
      },
      { container },
    );
    expect(result.subscription.status).toBe("active");
  });

  it("should throw if subscription not active", async () => {
    const sub = { id: "sub_1", status: "canceled" };
    const container = mockContainer({
      subscription: { retrieveSubscription: jest.fn().mockResolvedValue(sub) },
    });
    await expect(
      checkSubscriptionStep(
        {
          subscriptionId: "sub_1",
          customerId: "c1",
          planId: "p1",
          amount: 29,
          currency: "usd",
        },
        { container },
      ),
    ).rejects.toThrow("Subscription is not active");
  });

  it("should charge renewal payment", async () => {
    const payment = { id: "pay_1" };
    const container = mockContainer({
      payment: { capturePayment: jest.fn().mockResolvedValue(payment) },
    });
    const result = await chargeRenewalStep(
      {
        subscriptionId: "sub_1",
        customerId: "c1",
        planId: "p1",
        amount: 29,
        currency: "usd",
      },
      { container },
    );
    expect(result.payment).toEqual(payment);
  });

  it("should update subscription period", async () => {
    const updated = { id: "sub_1" };
    const existing = {
      current_period_start: new Date(),
      current_period_end: new Date(),
      last_billed_at: new Date(),
    };
    const container = mockContainer({
      subscription: {
        updateSubscriptions: jest.fn().mockResolvedValue(updated),
        retrieveSubscription: jest.fn().mockResolvedValue(existing),
      },
    });
    const result = await updateSubscriptionStep(
      { subscriptionId: "sub_1" },
      { container },
    );
    expect(result.subscription).toEqual(updated);
  });
});

describe("Auction Lifecycle Workflow", () => {
  let createAuctionStep: any;
  let openAuctionStep: any;
  let closeAuctionStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/auction-lifecycle.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    createAuctionStep = calls.find(
      (c: any) => c[0] === "create-auction-step",
    )?.[1];
    openAuctionStep = calls.find((c: any) => c[0] === "open-auction-step")?.[1];
    closeAuctionStep = calls.find(
      (c: any) => c[0] === "close-auction-step",
    )?.[1];
  });

  it("should create an auction in draft status", async () => {
    const auction = { id: "auc_1", status: "draft" };
    const container = mockContainer({
      auction: { createAuctions: jest.fn().mockResolvedValue(auction) },
    });
    const result = await createAuctionStep(
      {
        productId: "p1",
        vendorId: "v1",
        startingPrice: 50,
        startTime: "2026-01-01T00:00:00Z",
        endTime: "2026-01-02T00:00:00Z",
        tenantId: "t1",
      },
      { container },
    );
    expect(result.auction.status).toBe("draft");
  });

  it("should open an auction to active status", async () => {
    const opened = { id: "auc_1", status: "active" };
    const container = mockContainer({
      auction: { updateAuctions: jest.fn().mockResolvedValue(opened) },
    });
    const result = await openAuctionStep({ auctionId: "auc_1" }, { container });
    expect(result.auction.status).toBe("active");
  });

  it("should close an auction", async () => {
    const closed = { id: "auc_1", status: "closed" };
    const container = mockContainer({
      auction: { updateAuctions: jest.fn().mockResolvedValue(closed) },
    });
    const result = await closeAuctionStep(
      { auctionId: "auc_1" },
      { container },
    );
    expect(result.auction.status).toBe("closed");
  });
});

describe("Campaign Activation Workflow", () => {
  let createCampaignStep: any;
  let scheduleCampaignStep: any;
  let activateCampaignStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/campaign-activation.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    createCampaignStep = calls.find(
      (c: any) => c[0] === "create-campaign-step",
    )?.[1];
    scheduleCampaignStep = calls.find(
      (c: any) => c[0] === "schedule-campaign-step",
    )?.[1];
    activateCampaignStep = calls.find(
      (c: any) => c[0] === "activate-campaign-step",
    )?.[1];
  });

  it("should create a campaign in draft status", async () => {
    const result = await createCampaignStep({
      name: "Summer Sale",
      type: "promotion",
      tenantId: "t1",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      targetAudience: ["all"],
      budget: 5000,
    });
    expect(result.campaign.status).toBe("draft");
    expect(result.campaign.name).toBe("Summer Sale");
  });

  it("should schedule a campaign", async () => {
    const campaign = { name: "Sale", status: "draft" };
    const result = await scheduleCampaignStep({
      campaign,
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(result.campaign.status).toBe("scheduled");
  });

  it("should activate a campaign with promotions", async () => {
    const campaign = { name: "Sale", status: "scheduled" };
    const result = await activateCampaignStep({
      campaign,
      promotionIds: ["promo_1"],
    });
    expect(result.campaign.status).toBe("active");
    expect(result.campaign.promotion_ids).toEqual(["promo_1"]);
  });

  it("should activate with empty promotions when none provided", async () => {
    const campaign = { name: "Sale", status: "scheduled" };
    const result = await activateCampaignStep({ campaign });
    expect(result.campaign.promotion_ids).toEqual([]);
  });
});

describe("Trade-In Evaluation Workflow", () => {
  let submitTradeInStep: any;
  let inspectItemStep: any;
  let priceItemStep: any;
  let generateOfferStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/trade-in-evaluation.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    submitTradeInStep = calls.find(
      (c: any) => c[0] === "submit-trade-in-step",
    )?.[1];
    inspectItemStep = calls.find(
      (c: any) => c[0] === "inspect-trade-in-item-step",
    )?.[1];
    priceItemStep = calls.find(
      (c: any) => c[0] === "price-trade-in-item-step",
    )?.[1];
    generateOfferStep = calls.find(
      (c: any) => c[0] === "generate-trade-in-offer-step",
    )?.[1];
  });

  it("should submit a trade-in", async () => {
    const result = await submitTradeInStep({
      customerId: "c1",
      productCategory: "phone",
      brand: "Apple",
      model: "iPhone 14",
      condition: "good",
      description: "Minor scratches",
    });
    expect(result.submission.status).toBe("submitted");
    expect(result.submission.brand).toBe("Apple");
  });

  it("should inspect item with excellent condition", async () => {
    const result = await inspectItemStep({
      submission: {},
      condition: "excellent",
    });
    expect(result.inspection.condition_grade).toBe(0.9);
  });

  it("should inspect item with poor condition", async () => {
    const result = await inspectItemStep({ submission: {}, condition: "poor" });
    expect(result.inspection.condition_grade).toBe(0.3);
  });

  it("should price item based on condition grade", async () => {
    const result = await priceItemStep({
      brand: "Apple",
      model: "iPhone 14",
      inspection: { condition_grade: 0.7 },
    });
    expect(result.offerPrice).toBe(70);
    expect(result.basePrice).toBe(100);
  });

  it("should generate trade-in offer", async () => {
    const result = await generateOfferStep({
      customerId: "c1",
      offerPrice: 70,
      brand: "Apple",
      model: "iPhone 14",
    });
    expect(result.offer.status).toBe("pending_acceptance");
    expect(result.offer.offer_amount).toBe(70);
    expect(result.offer.item).toBe("Apple iPhone 14");
  });
});
