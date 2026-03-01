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
        async listEventOutboxes(_filter: any, _config?: any): Promise<any> {
          return [];
        }
        async retrieveEventOutbox(_id: string): Promise<any> {
          return null;
        }
        async createEventOutboxs(_data: any): Promise<any> {
          return {};
        }
        async updateEventOutboxs(_data: any): Promise<any> {
          return {};
        }
        async deleteEventOutboxs(_id: string): Promise<any> {
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

import EventModuleService from "../../../src/modules/events/service";

describe("EventModuleService", () => {
  let service: EventModuleService;

  beforeEach(() => {
    service = new EventModuleService();
    jest.clearAllMocks();
  });

  describe("retryFailedEvents", () => {
    it("retries events under the retry limit", async () => {
      jest.spyOn(service, "listEventOutboxes").mockResolvedValue([
        { id: "e1", retry_count: 1, status: "failed" },
        { id: "e2", retry_count: 0, status: "failed" },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateEventOutboxs")
        .mockResolvedValue({ id: "e1" });

      const result = await service.retryFailedEvents(undefined, 3);

      expect(result.retried).toBe(2);
      expect(result.skipped).toBe(0);
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending", error: null }),
      );
    });

    it("skips events at or over the retry limit", async () => {
      jest.spyOn(service, "listEventOutboxes").mockResolvedValue([
        { id: "e1", retry_count: 3, status: "failed" },
        { id: "e2", retry_count: 5, status: "failed" },
        { id: "e3", retry_count: 1, status: "failed" },
      ]);
      jest.spyOn(service, "updateEventOutboxs").mockResolvedValue({ id: "e3" });

      const result = await service.retryFailedEvents(undefined, 3);

      expect(result.retried).toBe(1);
      expect(result.skipped).toBe(2);
      expect(result.skippedEvents).toHaveLength(2);
    });

    it("filters by tenantId when provided", async () => {
      const listSpy = jest
        .spyOn(service, "listEventOutboxes")
        .mockResolvedValue([]);

      await service.retryFailedEvents("tenant-1");

      expect(listSpy).toHaveBeenCalledWith({
        status: "failed",
        tenant_id: "tenant-1",
      });
    });
  });

  describe("purgeOldEvents", () => {
    it("deletes published events older than the cutoff", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      jest.spyOn(service, "listEventOutboxes").mockResolvedValue([
        { id: "e1", status: "published", published_at: oldDate.toISOString() },
        {
          id: "e2",
          status: "published",
          published_at: recentDate.toISOString(),
        },
      ]);
      const deleteSpy = jest
        .spyOn(service, "deleteEventOutboxs")
        .mockResolvedValue({});

      const result = await service.purgeOldEvents(30);

      expect(result.purged).toBe(1);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith("e1");
    });

    it("throws when olderThanDays is less than 1", async () => {
      await expect(service.purgeOldEvents(0)).rejects.toThrow(
        "olderThanDays must be at least 1",
      );
    });
  });

  describe("getEventStats", () => {
    it("returns aggregated stats by status and event type", async () => {
      jest.spyOn(service, "listEventOutboxes").mockResolvedValue([
        { id: "e1", status: "pending", event_type: "order.created" },
        { id: "e2", status: "published", event_type: "order.created" },
        { id: "e3", status: "failed", event_type: "payment.failed" },
        { id: "e4", status: "pending", event_type: "payment.failed" },
      ]);

      const result = await service.getEventStats("tenant-1");

      expect(result.tenantId).toBe("tenant-1");
      expect(result.total).toBe(4);
      expect(result.byStatus.pending).toBe(2);
      expect(result.byStatus.published).toBe(1);
      expect(result.byStatus.failed).toBe(1);
      expect(result.byEventType["order.created"]).toBe(2);
      expect(result.byEventType["payment.failed"]).toBe(2);
    });

    it("returns zeros when no events exist", async () => {
      jest.spyOn(service, "listEventOutboxes").mockResolvedValue([]);

      const result = await service.getEventStats("tenant-1");

      expect(result.total).toBe(0);
      expect(result.byStatus.pending).toBe(0);
    });
  });

  describe("batchPublish", () => {
    it("publishes multiple events", async () => {
      jest.spyOn(service, "updateEventOutboxs").mockResolvedValue({ id: "e1" });

      const result = await service.batchPublish(["e1", "e2", "e3"]);

      expect(result.published).toBe(3);
      expect(result.failed).toBe(0);
    });

    it("throws when no event IDs provided", async () => {
      await expect(service.batchPublish([])).rejects.toThrow(
        "No event IDs provided",
      );
    });

    it("captures errors for individual events", async () => {
      jest
        .spyOn(service, "updateEventOutboxs")
        .mockResolvedValueOnce({ id: "e1" })
        .mockRejectedValueOnce(new Error("Not found"));

      const result = await service.batchPublish(["e1", "e2"]);

      expect(result.published).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0].eventId).toBe("e2");
    });
  });
});
