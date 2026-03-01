jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listAuditLogs(_filter: any): Promise<any> {
          return [];
        }
        async createAuditLogs(_data: any): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import AuditModuleService from "../../../src/modules/audit/service";

describe("AuditModuleService", () => {
  let service: AuditModuleService;

  beforeEach(() => {
    service = new AuditModuleService();
    jest.clearAllMocks();
  });

  describe("logAction", () => {
    it("creates an audit log entry", async () => {
      const createSpy = jest
        .spyOn(service, "createAuditLogs")
        .mockResolvedValue({ id: "log-1" });

      const result = await service.logAction({
        tenantId: "t1",
        action: "create",
        resourceType: "product",
        resourceId: "prod-1",
        actorId: "user-1",
        actorRole: "admin",
      });

      expect(result).toEqual({ id: "log-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t1",
          action: "create",
          resource_type: "product",
          resource_id: "prod-1",
          actor_id: "user-1",
          actor_role: "admin",
        }),
      );
    });

    it("uses default data classification when not provided", async () => {
      const createSpy = jest
        .spyOn(service, "createAuditLogs")
        .mockResolvedValue({ id: "log-1" });

      await service.logAction({
        tenantId: "t1",
        action: "update",
        resourceType: "order",
        resourceId: "ord-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data_classification: "internal",
          actor_id: null,
        }),
      );
    });

    it("stores previous and new values for change tracking", async () => {
      const createSpy = jest
        .spyOn(service, "createAuditLogs")
        .mockResolvedValue({ id: "log-1" });

      await service.logAction({
        tenantId: "t1",
        action: "update",
        resourceType: "product",
        resourceId: "prod-1",
        previousValues: { price: 100 },
        newValues: { price: 200 },
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          previous_values: { price: 100 },
          new_values: { price: 200 },
        }),
      );
    });
  });

  describe("getAuditTrail", () => {
    it("returns logs filtered by tenant", async () => {
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        {
          id: "log-1",
          tenant_id: "t1",
          action: "create",
          created_at: "2025-01-15T00:00:00Z",
        },
        {
          id: "log-2",
          tenant_id: "t1",
          action: "update",
          created_at: "2025-01-16T00:00:00Z",
        },
      ]);

      const result = await service.getAuditTrail("t1");

      expect(result).toHaveLength(2);
    });

    it("filters by resource type", async () => {
      const listSpy = jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([]);

      await service.getAuditTrail("t1", { resourceType: "product" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t1",
          resource_type: "product",
        }),
      );
    });

    it("filters by date range", async () => {
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        { id: "log-1", created_at: "2025-01-10T00:00:00Z" },
        { id: "log-2", created_at: "2025-01-15T00:00:00Z" },
        { id: "log-3", created_at: "2025-02-01T00:00:00Z" },
      ]);

      const result = await service.getAuditTrail("t1", {
        from: new Date("2025-01-01"),
        to: new Date("2025-01-31"),
      });

      expect(result).toHaveLength(2);
    });

    it("filters by actor ID", async () => {
      const listSpy = jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([]);

      await service.getAuditTrail("t1", { actorId: "user-1" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: "user-1",
        }),
      );
    });

    it("filters by data classification", async () => {
      const listSpy = jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([]);

      await service.getAuditTrail("t1", { dataClassification: "confidential" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data_classification: "confidential",
        }),
      );
    });
  });

  describe("getResourceHistory", () => {
    it("returns audit logs for a specific resource", async () => {
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        { id: "log-1", resource_type: "product", resource_id: "prod-1" },
        { id: "log-2", resource_type: "product", resource_id: "prod-1" },
      ]);

      const result = await service.getResourceHistory(
        "t1",
        "product",
        "prod-1",
      );

      expect(result).toHaveLength(2);
    });

    it("returns empty array when no history exists", async () => {
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([]);

      const result = await service.getResourceHistory(
        "t1",
        "product",
        "nonexistent",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getAuditSummary", () => {
    it("returns summary with event counts and top actors", async () => {
      const now = new Date();
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        {
          id: "l1",
          action: "create",
          actor_id: "u1",
          created_at: now.toISOString(),
        },
        {
          id: "l2",
          action: "update",
          actor_id: "u1",
          created_at: now.toISOString(),
        },
        {
          id: "l3",
          action: "create",
          actor_id: "u2",
          created_at: now.toISOString(),
        },
      ]);

      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);
      const result = await service.getAuditSummary("t1", { start, end });

      expect(result.totalEvents).toBe(3);
      expect(result.eventsByType["create"]).toBe(2);
      expect(result.topActors[0].actorId).toBe("u1");
    });

    it("flags high delete volume", async () => {
      const now = new Date();
      const deleteLogs = Array.from({ length: 15 }, (_, i) => ({
        id: `l${i}`,
        action: "delete",
        actor_id: "u1",
        created_at: now.toISOString(),
      }));
      jest.spyOn(service, "listAuditLogs").mockResolvedValue(deleteLogs);

      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);
      const result = await service.getAuditSummary("t1", { start, end });

      const deleteFlag = result.riskFlags.find(
        (f) => f.type === "high_delete_volume",
      );
      expect(deleteFlag).toBeDefined();
      expect(deleteFlag!.severity).toBe("high");
    });

    it("returns zero events for empty date range", async () => {
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([]);

      const result = await service.getAuditSummary("t1", {
        start: new Date(),
        end: new Date(),
      });
      expect(result.totalEvents).toBe(0);
    });
  });

  describe("searchAuditLogs", () => {
    it("filters logs by actor and action", async () => {
      const listSpy = jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([]);

      await service.searchAuditLogs("t1", { actorId: "u1", action: "create" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: "u1",
          action: "create",
        }),
      );
    });

    it("filters by entity type", async () => {
      const listSpy = jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([]);

      await service.searchAuditLogs("t1", { entityType: "product" });

      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: "product",
        }),
      );
    });

    it("filters by date range", async () => {
      const now = new Date();
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        { id: "l1", created_at: now.toISOString() },
        { id: "l2", created_at: new Date("2020-01-01").toISOString() },
      ]);

      const result = await service.searchAuditLogs("t1", {
        dateRange: {
          start: new Date(now.getTime() - 86400000),
          end: new Date(now.getTime() + 86400000),
        },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("flagSuspiciousActivity", () => {
    it("flags high frequency actors", async () => {
      const now = new Date();
      const logs = Array.from({ length: 55 }, (_, i) => ({
        id: `l${i}`,
        action: "update",
        actor_id: "u1",
        created_at: new Date(now.getTime() - 3600000).toISOString(),
      }));
      jest.spyOn(service, "listAuditLogs").mockResolvedValue(logs);

      const result = await service.flagSuspiciousActivity("t1");

      const flag = result.flags.find((f) => f.type === "high_frequency");
      expect(flag).toBeDefined();
      expect(flag!.actorId).toBe("u1");
    });

    it("flags bulk delete operations", async () => {
      const now = new Date();
      const logs = Array.from({ length: 8 }, (_, i) => ({
        id: `l${i}`,
        action: "delete",
        actor_id: "u1",
        created_at: new Date(now.getTime() - 3600000).toISOString(),
      }));
      jest.spyOn(service, "listAuditLogs").mockResolvedValue(logs);

      const result = await service.flagSuspiciousActivity("t1");

      const flag = result.flags.find((f) => f.type === "bulk_delete");
      expect(flag).toBeDefined();
      expect(flag!.severity).toBe("high");
    });

    it("returns zero flags when activity is normal", async () => {
      const now = new Date();
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        {
          id: "l1",
          action: "read",
          actor_id: "u1",
          created_at: new Date(now.getTime() - 3600000).toISOString(),
        },
      ]);

      const result = await service.flagSuspiciousActivity("t1");
      expect(result.flagsFound).toBe(0);
    });
  });

  describe("exportAuditReport", () => {
    it("generates JSON report with summary and logs", async () => {
      const now = new Date();
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        {
          id: "l1",
          action: "create",
          actor_id: "u1",
          resource_type: "product",
          resource_id: "p1",
          created_at: now.toISOString(),
        },
      ]);

      const result = await service.exportAuditReport("t1", "json");

      expect(result.tenantId).toBe("t1");
      expect(result.format).toBe("json");
      expect(result.summary).toBeDefined();
    });

    it("generates CSV report with csv content", async () => {
      const now = new Date();
      jest.spyOn(service, "listAuditLogs").mockResolvedValue([
        {
          id: "l1",
          action: "create",
          actor_id: "u1",
          resource_type: "product",
          resource_id: "p1",
          created_at: now.toISOString(),
        },
      ]);

      const result = await service.exportAuditReport("t1", "csv");

      expect(result.csvContent).toBeDefined();
      expect(result.csvContent).toContain("id,action");
    });
  });
});
