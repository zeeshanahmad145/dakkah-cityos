import {
  GET as getSubscription,
  POST as updateSubscription,
} from "../../../src/api/admin/subscriptions/[id]/route";
import { POST as pauseSubscription } from "../../../src/api/admin/subscriptions/[id]/pause/route";
import { POST as resumeSubscription } from "../../../src/api/admin/subscriptions/[id]/resume/route";
import { POST as changePlan } from "../../../src/api/admin/subscriptions/[id]/change-plan/route";
import { GET as getSubscriptionEvents } from "../../../src/api/admin/subscriptions/[id]/events/route";
import {
  GET as listSubscriptionPlans,
  POST as createSubscriptionPlan,
} from "../../../src/api/admin/subscription-plans/route";

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Subscription Detail Routes", () => {
  describe("GET /admin/subscriptions/:id", () => {
    it("should return subscription by id", async () => {
      const sub = { id: "sub_1", status: "active", tenant_id: "ten_1" };
      const mockService = {
        listSubscriptions: jest.fn().mockResolvedValue([sub]),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "sub_1" },
        body: {},
        tenant: { id: "ten_1" },
      };
      const res = createRes();
      await getSubscription(req, res);
      expect(res.json).toHaveBeenCalledWith({ subscription: sub });
    });

    it("should return 403 without tenant context", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: { id: "sub_1" },
        body: {},
      };
      const res = createRes();
      await getSubscription(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 404 if subscription not found", async () => {
      const mockService = {
        listSubscriptions: jest.fn().mockResolvedValue([]),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "sub_missing" },
        body: {},
        tenant: { id: "ten_1" },
      };
      const res = createRes();
      await getSubscription(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("POST /admin/subscriptions/:id (update)", () => {
    it("should return 403 without tenant context", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: { id: "sub_1" },
        body: { status: "active" },
      };
      const res = createRes();
      await updateSubscription(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

describe("Admin Subscription Pause Route", () => {
  it("should pause an active subscription", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "sub_1", status: "active" }] }),
    };
    const mockService = {
      updateSubscriptions: jest
        .fn()
        .mockResolvedValue({ id: "sub_1", status: "paused" }),
    };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "subscriptionModuleService" ? mockService : mockQuery,
        ),
      },
      query: {},
      params: { id: "sub_1" },
      body: { reason: "Customer request" },
    };
    const res = createRes();
    await pauseSubscription(req, res);
    expect(mockService.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paused" }),
    );
  });

  it("should return 404 for non-existent subscription", async () => {
    const mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_missing" },
      body: {},
    };
    const res = createRes();
    await pauseSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should reject pausing non-active subscription", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "sub_1", status: "paused" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_1" },
      body: {},
    };
    const res = createRes();
    await pauseSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Subscription Resume Route", () => {
  it("should resume a paused subscription", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "sub_1", status: "paused" }] }),
    };
    const mockService = {
      updateSubscriptions: jest
        .fn()
        .mockResolvedValue({ id: "sub_1", status: "active" }),
    };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "subscriptionModuleService" ? mockService : mockQuery,
        ),
      },
      query: {},
      params: { id: "sub_1" },
      body: {},
    };
    const res = createRes();
    await resumeSubscription(req, res);
    expect(mockService.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });

  it("should reject resuming non-paused subscription", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "sub_1", status: "active" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_1" },
      body: {},
    };
    const res = createRes();
    await resumeSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Subscription Change Plan Route", () => {
  it("should return 404 for non-existent subscription", async () => {
    const mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_missing" },
      body: { new_plan_id: "plan_2" },
    };
    const res = createRes();
    await changePlan(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Subscription Events Route", () => {
  it("should return subscription event timeline", async () => {
    const sub = {
      id: "sub_1",
      status: "active",
      created_at: "2025-01-01",
      metadata: {},
    };
    const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [sub] }) };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_1" },
      body: {},
    };
    const res = createRes();
    await getSubscriptionEvents(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 for non-existent subscription", async () => {
    const mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "sub_missing" },
      body: {},
    };
    const res = createRes();
    await getSubscriptionEvents(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Subscription Plans Routes", () => {
  describe("GET /admin/subscription-plans", () => {
    it("should list all subscription plans", async () => {
      const plans = [{ id: "plan_1", name: "Basic", price: 10 }];
      const mockQuery = { graph: jest.fn().mockResolvedValue({ data: plans }) };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      };
      const res = createRes();
      await listSubscriptionPlans(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({ entity: "subscription_plan" }),
      );
      expect(res.json).toHaveBeenCalledWith({ plans });
    });
  });
});
