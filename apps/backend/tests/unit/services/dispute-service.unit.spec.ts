jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listDisputes(_f: any, _o?: any): Promise<any> {
          return [];
        }
        async createDisputes(_data: any): Promise<any> {
          return null;
        }
        async createDisputeMessages(_data: any): Promise<any> {
          return null;
        }
        async retrieveDispute(_id: string): Promise<any> {
          return null;
        }
        async updateDisputes(_data: any): Promise<any> {
          return null;
        }
        async listDisputeMessages(_f: any, _o?: any): Promise<any> {
          return [];
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

import DisputeModuleService from "../../../src/modules/dispute/service";

describe("DisputeModuleService", () => {
  let service: DisputeModuleService;

  beforeEach(() => {
    service = new DisputeModuleService();
  });

  describe("openDispute", () => {
    it("creates a dispute when no active dispute exists", async () => {
      jest.spyOn(service, "listDisputes").mockResolvedValue([]);
      const createDisputeSpy = jest
        .spyOn(service, "createDisputes")
        .mockResolvedValue({ id: "d-1", status: "open" });
      jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "m-1" });

      const result = await service.openDispute({
        orderId: "o-1",
        customerId: "c-1",
        tenantId: "t-1",
        type: "refund",
        description: "Product damaged",
      });

      expect(result).toEqual({ id: "d-1", status: "open" });
      expect(createDisputeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: "o-1",
          status: "open",
          priority: "medium",
        }),
      );
    });

    it("throws when an active dispute already exists", async () => {
      jest
        .spyOn(service, "listDisputes")
        .mockResolvedValue([{ id: "d-existing", status: "open" }]);

      await expect(
        service.openDispute({
          orderId: "o-1",
          customerId: "c-1",
          tenantId: "t-1",
          type: "refund",
          description: "Issue",
        }),
      ).rejects.toThrow("An active dispute already exists for this order");
    });

    it("creates an initial message with the description", async () => {
      jest.spyOn(service, "listDisputes").mockResolvedValue([]);
      jest.spyOn(service, "createDisputes").mockResolvedValue({ id: "d-1" });
      const msgSpy = jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "m-1" });

      await service.openDispute({
        orderId: "o-1",
        customerId: "c-1",
        tenantId: "t-1",
        type: "refund",
        description: "Product damaged",
      });

      expect(msgSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dispute_id: "d-1",
          sender_type: "customer",
          content: "Product damaged",
        }),
      );
    });

    it("uses provided priority when specified", async () => {
      jest.spyOn(service, "listDisputes").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createDisputes")
        .mockResolvedValue({ id: "d-1" });
      jest.spyOn(service, "createDisputeMessages").mockResolvedValue({});

      await service.openDispute({
        orderId: "o-1",
        customerId: "c-1",
        tenantId: "t-1",
        type: "refund",
        description: "Urgent",
        priority: "high",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "high" }),
      );
    });
  });

  describe("addMessage", () => {
    it("adds a message to an open dispute", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "open" });
      const createSpy = jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "m-2" });
      jest.spyOn(service, "updateDisputes").mockResolvedValue({});

      const result = await service.addMessage({
        disputeId: "d-1",
        senderType: "customer",
        senderId: "c-1",
        content: "More info",
      });

      expect(result).toEqual({ id: "m-2" });
    });

    it("rejects messages on resolved disputes", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "resolved" });

      await expect(
        service.addMessage({
          disputeId: "d-1",
          senderType: "customer",
          senderId: "c-1",
          content: "Hello",
        }),
      ).rejects.toThrow("Cannot add messages to a resolved or closed dispute");
    });

    it("rejects messages on closed disputes", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "closed" });

      await expect(
        service.addMessage({
          disputeId: "d-1",
          senderType: "admin",
          senderId: "a-1",
          content: "Note",
        }),
      ).rejects.toThrow("Cannot add messages to a resolved or closed dispute");
    });

    it("updates status to under_review when admin sends message on open dispute", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "open" });
      jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "m-3" });
      const updateSpy = jest
        .spyOn(service, "updateDisputes")
        .mockResolvedValue({});

      await service.addMessage({
        disputeId: "d-1",
        senderType: "admin",
        senderId: "a-1",
        content: "Reviewing",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "under_review" }),
      );
    });

    it("updates status when customer responds to awaiting_customer", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "awaiting_customer" });
      jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "m-4" });
      const updateSpy = jest
        .spyOn(service, "updateDisputes")
        .mockResolvedValue({});

      await service.addMessage({
        disputeId: "d-1",
        senderType: "customer",
        senderId: "c-1",
        content: "Here is info",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "under_review" }),
      );
    });
  });

  describe("escalate", () => {
    it("escalates an open dispute", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValueOnce({ id: "d-1", status: "open" })
        .mockResolvedValueOnce({ id: "d-1", status: "escalated" });
      const updateSpy = jest
        .spyOn(service, "updateDisputes")
        .mockResolvedValue({});

      const result = await service.escalate("d-1", "Customer unsatisfied");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "escalated",
          priority: "urgent",
        }),
      );
      expect(result).toEqual({ id: "d-1", status: "escalated" });
    });

    it("throws when dispute is already resolved", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "resolved" });

      await expect(service.escalate("d-1")).rejects.toThrow(
        "Dispute cannot be escalated from current status",
      );
    });

    it("throws when dispute is already escalated", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "escalated" });

      await expect(service.escalate("d-1")).rejects.toThrow(
        "Dispute cannot be escalated from current status",
      );
    });

    it("creates a system message when reason is provided", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "open" });
      jest.spyOn(service, "updateDisputes").mockResolvedValue({});
      const msgSpy = jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({});

      await service.escalate("d-1", "High value order");

      expect(msgSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_type: "system",
          content: "Dispute escalated: High value order",
          is_internal: true,
        }),
      );
    });
  });

  describe("resolve", () => {
    it("resolves a dispute with resolution details", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValueOnce({ id: "d-1", status: "under_review" })
        .mockResolvedValueOnce({ id: "d-1", status: "resolved" });
      jest.spyOn(service, "updateDisputes").mockResolvedValue({});

      const result = await service.resolve({
        disputeId: "d-1",
        resolution: "full_refund",
        resolvedBy: "admin-1",
      });

      expect(result).toEqual({ id: "d-1", status: "resolved" });
    });

    it("throws when dispute is already resolved", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValue({ id: "d-1", status: "resolved" });

      await expect(
        service.resolve({
          disputeId: "d-1",
          resolution: "refund",
          resolvedBy: "admin-1",
        }),
      ).rejects.toThrow("Dispute is already resolved or closed");
    });
  });

  describe("getDisputeTimeline", () => {
    it("returns timeline with events sorted by timestamp", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "d-1",
        status: "escalated",
        priority: "high",
        created_at: "2025-01-01T00:00:00Z",
        escalated_at: "2025-01-02T00:00:00Z",
        resolved_at: null,
      });
      jest
        .spyOn(service, "listDisputeMessages")
        .mockResolvedValue([
          {
            id: "m-1",
            sender_type: "customer",
            content: "Help",
            created_at: "2025-01-01T01:00:00Z",
          },
        ]);

      const result = await service.getDisputeTimeline("d-1");

      expect(result.events).toHaveLength(3);
      expect(result.events[0].type).toBe("opened");
      expect(result.events[1].type).toBe("message");
      expect(result.events[2].type).toBe("escalated");
    });
  });
});
