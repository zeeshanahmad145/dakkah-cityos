import { vi } from "vitest";
const mockQuery = vi.fn();
const mockPool = {
  baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
  __joinerConfig: vi.fn(),
  listInsuranceClaims: vi.fn().mockResolvedValue([]),
  updateInsuranceClaims: vi.fn().mockResolvedValue([]),
  deleteInsuranceClaims: vi.fn().mockResolvedValue([]),
  listInsurancePolicies: vi.fn().mockResolvedValue([]),
  countInsurancePolicies: vi.fn().mockResolvedValue([]),
  generateQuoteNumber: vi.fn().mockResolvedValue([]),
  listCommissions: vi.fn().mockResolvedValue([]),
  createCommissions: vi.fn().mockResolvedValue([]),
  createCommissionTiers: vi.fn().mockResolvedValue([]),
  updateSubscriptions: vi.fn().mockResolvedValue([]),
  markHelpful: vi.fn().mockResolvedValue([]),
  listCompanyUsers: vi.fn().mockResolvedValue([]),
  updateVendors: vi.fn().mockResolvedValue([]),
  updatePayouts: vi.fn().mockResolvedValue([]),
  updateTenantUsers: vi.fn().mockResolvedValue([]),
  updateBookings: vi.fn().mockResolvedValue([]),
  listClassSchedules: vi.fn().mockResolvedValue([]),
  listTrainerProfiles: vi.fn().mockResolvedValue([]),
  listCourses: vi.fn().mockResolvedValue([]),
  query: mockQuery,
};

vi.mock("pg", () => ({
  Pool: class {
    constructor() {
      return mockPool;
    }
  },
}));

vi.mock("crypto", () => {
  return {
    randomUUID: vi.fn(() => "test-uuid-1234"),
    createHash: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => "test-hash"),
      })),
    })),
    default: {
      randomUUID: vi.fn(() => "test-uuid-1234"),
    },
  };
});

import { DurableSyncTracker } from "../../../src/lib/platform/sync-tracker";

describe("DurableSyncTracker", () => {
  let tracker: DurableSyncTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    tracker = new DurableSyncTracker();
  });

  describe("recordSync", () => {
    it("inserts a sync entry and returns it", async () => {
      const syncEntry = {
        id: "test-uuid-1234",
        system: "stripe",
        entity_type: "order",
        entity_id: "ord_123",
        direction: "outbound",
        status: "pending",
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [syncEntry] });

      const result = await tracker.recordSync({
        system: "stripe",
        entity_type: "order",
        entity_id: "ord_123",
        direction: "outbound",
        tenant_id: "tenant-1",
      });

      expect(result).toEqual(syncEntry);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("uses provided correlation_id if given", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: "1" }] });

      await tracker.recordSync({
        system: "stripe",
        entity_type: "order",
        entity_id: "ord_1",
        direction: "inbound",
        correlation_id: "custom-corr-id",
        tenant_id: "t1",
      });

      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[1]).toContain("custom-corr-id");
    });
  });

  describe("updateStatus", () => {
    it("updates status and returns entry", async () => {
      const updated = { id: "1", status: "completed" };
      // mock 1: ensure table exists
      // mock 2: return updated
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [updated] });

      const result = await tracker.updateStatus("1", "completed");
      expect(result).toEqual(updated);
    });

    it("returns null when entry not found", async () => {
      // mock 1: ensure table
      // mock 2: update
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await tracker.updateStatus(
        "nonexistent",
        "failed",
        "some error",
      );
      expect(result).toBeNull();
    });
  });

  describe("getFailedSyncs", () => {
    it("returns failed sync entries", async () => {
      const entries = [
        { id: "1", status: "failed" },
        { id: "2", status: "failed" },
      ];
      // mock 1: ensure table
      // mock 2: select query
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: entries });

      const result = await tracker.getFailedSyncs();
      expect(result).toHaveLength(2);
    });

    it("filters by system when provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await tracker.getFailedSyncs("stripe", 10);
      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain("system = $1");
      expect(queryCall[1]).toContain("stripe");
    });
  });

  describe("retryFailed", () => {
    it("resets status to pending and increments retry count", async () => {
      const retried = { id: "1", status: "pending", retry_count: 2 };
      // mock 1: ensure table
      // mock 2: retry update
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [retried] });

      const result = await tracker.retryFailed("1");
      expect(result).toEqual(retried);
    });

    it("returns null when entry not found or not failed", async () => {
      // mock 1: ensure table
      // mock 2: retry result (empty)
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await tracker.retryFailed("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getPendingCount", () => {
    it("returns count of pending entries", async () => {
      // mock 1: ensure table
      // mock 2: get pending count
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "5" }] });

      const result = await tracker.getPendingCount();
      expect(result).toBe(5);
    });

    it("filters by system when provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "2" }] });

      const result = await tracker.getPendingCount("erpnext");
      expect(result).toBe(2);
      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain("system = $1");
    });
  });

  describe("getSyncHistory", () => {
    it("returns sync history without filters", async () => {
      const entries = [{ id: "1" }, { id: "2" }];
      // mock 1: ensure table
      // mock 2: get sync history
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: entries });

      const result = await tracker.getSyncHistory();
      expect(result).toHaveLength(2);
    });

    it("applies all filters when provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await tracker.getSyncHistory({
        system: "stripe",
        entityType: "order",
        tenantId: "t1",
        dateRange: { from: new Date("2026-01-01"), to: new Date("2026-02-01") },
      });

      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain("system = $1");
      expect(queryCall[0]).toContain("entity_type = $2");
      expect(queryCall[0]).toContain("tenant_id = $3");
      expect(queryCall[0]).toContain("created_at >= $4");
      expect(queryCall[0]).toContain("created_at <= $5");
    });
  });

  describe("cleanupOldEntries", () => {
    it("deletes old completed entries and returns count", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 10 });

      const result = await tracker.cleanupOldEntries(30);
      expect(result).toBe(10);
    });

    it("returns 0 when no entries to clean", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 0 });

      const result = await tracker.cleanupOldEntries(7);
      expect(result).toBe(0);
    });
  });
});
