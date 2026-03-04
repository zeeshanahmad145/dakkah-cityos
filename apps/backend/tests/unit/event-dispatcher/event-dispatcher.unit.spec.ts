import { vi } from "vitest";
vi.mock("../../../src/lib/temporal-client", () => ({
  startCanonicalWorkflow: vi.fn(),
}));

jest.mock("../../../src/integrations/node-hierarchy-sync", () => ({
  NodeHierarchySyncService: jest.fn().mockImplementation(() => ({
    syncSingleNode: jest.fn().mockResolvedValue(undefined),
    deleteNodeFromSystems: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { startCanonicalWorkflow } from "../../../src/lib/temporal-client";
import {
  getWorkflowForEvent,
  getAllMappedEvents,
  dispatchEventToTemporal,
  processOutboxEvents,
  dispatchCrossSystemEvent,
} from "../../../src/lib/event-dispatcher";

const mockStartWorkflow = startCanonicalWorkflow as jest.Mock;

describe("event-dispatcher", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getWorkflowForEvent", () => {
    it("returns correct workflow mapping for a known event", () => {
      expect(getWorkflowForEvent("order.placed")).toEqual(
        expect.objectContaining({
          workflowFn: "one_time_goods",
          taskQueue: "uce-commerce-financial",
        }),
      );
    });

    it("returns null for an unknown event", () => {
      expect(getWorkflowForEvent("unknown.event")).toBeNull();
    });

    it('maps "governance.policy.changed" to "usage_metering"', () => {
      expect(getWorkflowForEvent("governance.policy.changed")).toEqual(
        expect.objectContaining({
          workflowFn: "usage_metering",
          taskQueue: "uce-commerce-recurring",
        }),
      );
    });

    it("returns correct workflow for vendor.created", () => {
      expect(getWorkflowForEvent("vendor.created")).toEqual(
        expect.objectContaining({
          workflowFn: "vendor_onboarding",
          taskQueue: "uce-commerce-fulfilment",
        }),
      );
    });

    it("returns correct workflow for product.updated", () => {
      expect(getWorkflowForEvent("product.updated")).toEqual(
        expect.objectContaining({
          workflowFn: "usage_metering",
          taskQueue: "uce-commerce-recurring",
        }),
      );
    });
  });

  describe("getAllMappedEvents", () => {
    it("returns an array of all event keys", () => {
      const events = getAllMappedEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('contains "governance.policy.changed"', () => {
      expect(getAllMappedEvents()).toContain("governance.policy.changed");
    });

    it('contains "order.placed"', () => {
      expect(getAllMappedEvents()).toContain("order.placed");
    });

    it("contains node and tenant events", () => {
      const events = getAllMappedEvents();
      expect(events).toContain("node.created");
      expect(events).toContain("tenant.provisioned");
    });
  });

  describe("dispatchEventToTemporal", () => {
    it("successfully dispatches and returns dispatched true with runId", async () => {
      mockStartWorkflow.mockResolvedValue({ workflowId: "run-123" });

      const result = await dispatchEventToTemporal("order.placed", {
        id: "order-1",
      });

      expect(result).toEqual({ dispatched: true, runId: "run-123" });
      expect(mockStartWorkflow).toHaveBeenCalledWith(
        "one_time_goods",
        { id: "order-1", _eventType: "order.placed", _nodeContext: undefined },
        "order-1",
        "uce-commerce-financial",
      );
    });

    it("passes nodeContext to startWorkflow", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "run-456" });
      const ctx = { tenantId: "t1", nodeId: "n1" };

      await dispatchEventToTemporal("order.placed", { id: "o1" }, ctx);

      expect(mockStartWorkflow).toHaveBeenCalledWith(
        "one_time_goods",
        { id: "o1", _eventType: "order.placed", _nodeContext: ctx },
        "o1",
        "uce-commerce-financial",
      );
    });

    it("returns dispatched false for unmapped event", async () => {
      const result = await dispatchEventToTemporal("unmapped.event", {});

      expect(result.dispatched).toBe(false);
      expect(result.error).toContain("No workflow mapped");
      expect(mockStartWorkflow).not.toHaveBeenCalled();
    });

    it("catches startWorkflow errors and returns dispatched false with error", async () => {
      mockStartWorkflow.mockRejectedValue(
        new Error("Temporal connection failed"),
      );

      const result = await dispatchEventToTemporal("order.placed", {
        id: "o1",
      });

      expect(result).toEqual({
        dispatched: false,
        error: "Temporal connection failed",
      });
    });
  });

  describe("processOutboxEvents", () => {
    function makeContainer(events: any[], overrides: Record<string, any> = {}) {
      return {
        resolve: jest.fn().mockReturnValue({
          listPendingEvents: jest.fn().mockResolvedValue(events),
          buildEnvelope: jest.fn().mockImplementation((e: any) => ({
            payload: e.payload || {},
          })),
          markPublished: jest.fn().mockResolvedValue(undefined),
          markFailed: jest.fn().mockResolvedValue(undefined),
          ...overrides,
        }),
      };
    }

    it("processes pending events successfully", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "run-1" });
      const events = [
        {
          id: "evt-1",
          event_type: "order.placed",
          payload: { id: "order-1" },
          tenant_id: "t1",
          node_id: "n1",
          correlation_id: "c1",
          channel: "web",
        },
      ];
      const container = makeContainer(events);

      const result = await processOutboxEvents(container);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      const svc = container.resolve.mock.results[0].value;
      expect(svc.markPublished).toHaveBeenCalledWith("evt-1");
    });

    it("skips events with no workflow mapping", async () => {
      const events = [
        { id: "evt-2", event_type: "unknown.event", payload: {} },
      ];
      const container = makeContainer(events);

      const result = await processOutboxEvents(container);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockStartWorkflow).not.toHaveBeenCalled();
    });

    it("handles errors in individual event processing", async () => {
      mockStartWorkflow.mockRejectedValue(new Error("workflow fail"));
      const events = [
        {
          id: "evt-3",
          event_type: "order.placed",
          payload: { id: "o1" },
          tenant_id: "t1",
        },
      ];
      const container = makeContainer(events);

      const result = await processOutboxEvents(container);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("evt-3");
      const svc = container.resolve.mock.results[0].value;
      expect(svc.markFailed).toHaveBeenCalledWith("evt-3", "workflow fail");
    });

    it("handles error getting pending events", async () => {
      const container = {
        resolve: jest.fn().mockReturnValue({
          listPendingEvents: jest.fn().mockRejectedValue(new Error("DB down")),
          buildEnvelope: jest.fn(),
          markPublished: jest.fn(),
          markFailed: jest.fn(),
        }),
      };

      const result = await processOutboxEvents(container);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Outbox processing error");
    });
  });

  describe("dispatchCrossSystemEvent", () => {
    const mockContainer = {
      resolve: jest.fn().mockReturnValue({
        createEvent: jest.fn().mockResolvedValue(undefined),
      }),
    };

    it("dispatches to Temporal and returns temporal=true, integrations=[temporal]", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "r1" });

      const result = await dispatchCrossSystemEvent(
        "governance.policy.changed",
        { tenant_id: "tenant-1" },
        mockContainer,
      );

      expect(result.temporal).toBe(true);
      expect(result.integrations).toEqual(["temporal"]);
    });

    it("dispatches various event types to Temporal", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "r1" });

      const result = await dispatchCrossSystemEvent(
        "product.updated",
        { id: "prod-1" },
        mockContainer,
      );

      expect(result.temporal).toBe(true);
      expect(result.integrations).toEqual(["temporal"]);
    });

    it("uses nodeContext when provided", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "r1" });
      const ctx = { tenantId: "ctx-tenant" };

      const result = await dispatchCrossSystemEvent(
        "governance.policy.changed",
        {},
        mockContainer,
        ctx,
      );

      expect(result.temporal).toBe(true);
      expect(result.integrations).toEqual(["temporal"]);
      expect(mockStartWorkflow).toHaveBeenCalledWith(
        "usage_metering",
        { _eventType: "governance.policy.changed", _nodeContext: ctx },
        expect.any(String),
        "uce-commerce-recurring",
      );
    });

    it("falls back to outbox when no Temporal workflow mapping exists", async () => {
      mockStartWorkflow.mockResolvedValue(undefined); // No workflow mapped returns dispatched=false

      const result = await dispatchCrossSystemEvent(
        "unknown.event",
        { id: "unknown" },
        mockContainer,
      );

      expect(result.temporal).toBe(false);
      expect(result.integrations).toEqual(["outbox"]);
      const svc = mockContainer.resolve.mock.results[0].value;
      expect(svc.createEvent).toHaveBeenCalled();
    });

    it("handles outbox creation failure gracefully", async () => {
      mockStartWorkflow.mockReturnValue({
        dispatched: false,
        error: "No workflow mapped",
      });
      mockContainer.resolve.mockReturnValue({
        createEvent: jest.fn().mockRejectedValue(new Error("outbox fail")),
      });

      const result = await dispatchCrossSystemEvent(
        "xyz.unknown",
        {},
        mockContainer,
      );

      expect(result.temporal).toBe(false);
      expect(result.integrations).toEqual([]);
    });

    it("returns temporal=true with empty integrations for unmapped event with Temporal workflow", async () => {
      mockStartWorkflow.mockResolvedValue({ runId: "r1" });

      const result = await dispatchCrossSystemEvent(
        "subscription.created",
        { id: "sub-1" },
        mockContainer,
      );

      expect(result.temporal).toBe(true);
      expect(result.integrations).toEqual(["temporal"]);
    });
  });
});
