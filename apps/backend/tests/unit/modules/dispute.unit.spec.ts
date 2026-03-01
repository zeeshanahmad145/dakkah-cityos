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
        async listDisputes(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveDispute(_id: string): Promise<any> {
          return null;
        }
        async createDisputes(_data: any): Promise<any> {
          return {};
        }
        async updateDisputes(_data: any): Promise<any> {
          return {};
        }
        async listDisputeMessages(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async createDisputeMessages(_data: any): Promise<any> {
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

import DisputeModuleService from "../../../src/modules/dispute/service";

describe("DisputeModuleService", () => {
  let service: DisputeModuleService;

  beforeEach(() => {
    service = new DisputeModuleService();
    jest.clearAllMocks();
  });

  describe("openDispute", () => {
    it("opens a dispute successfully when no active dispute exists", async () => {
      jest.spyOn(service, "listDisputes").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createDisputes")
        .mockResolvedValue({ id: "disp-1" });
      const msgSpy = jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({ id: "msg-1" });

      const result = await service.openDispute({
        orderId: "order-1",
        customerId: "cust-1",
        tenantId: "tenant-1",
        type: "product_quality",
        description: "Item arrived damaged",
      });

      expect(result).toEqual({ id: "disp-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: "order-1",
          customer_id: "cust-1",
          status: "open",
          priority: "medium",
        }),
      );
      expect(msgSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_type: "customer",
          content: "Item arrived damaged",
        }),
      );
    });

    it("throws when an active dispute already exists for the order", async () => {
      jest
        .spyOn(service, "listDisputes")
        .mockResolvedValue([{ id: "disp-existing", status: "open" }]);

      await expect(
        service.openDispute({
          orderId: "order-1",
          customerId: "cust-1",
          tenantId: "tenant-1",
          type: "product_quality",
          description: "Duplicate",
        }),
      ).rejects.toThrow("An active dispute already exists for this order");
    });
  });

  describe("resolveDispute", () => {
    it("resolves a dispute with resolution and refund amount", async () => {
      jest
        .spyOn(service, "retrieveDispute")
        .mockResolvedValueOnce({ id: "disp-1", status: "under_review" })
        .mockResolvedValueOnce({
          id: "disp-1",
          status: "resolved",
          resolution: "Full refund issued",
        });
      const updateSpy = jest
        .spyOn(service, "updateDisputes")
        .mockResolvedValue({});
      const msgSpy = jest
        .spyOn(service, "createDisputeMessages")
        .mockResolvedValue({});

      const result = await service.resolveDispute(
        "disp-1",
        "Full refund issued",
        5000,
      );

      expect(result.status).toBe("resolved");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "resolved",
          resolution: "Full refund issued",
          resolution_amount: 5000,
        }),
      );
      expect(msgSpy).toHaveBeenCalled();
    });

    it("throws when resolution description is empty", async () => {
      await expect(service.resolveDispute("disp-1", "", 0)).rejects.toThrow(
        "Resolution description is required",
      );
    });

    it("throws when dispute is already resolved", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "resolved",
      });

      await expect(
        service.resolveDispute("disp-1", "Test resolution"),
      ).rejects.toThrow("Dispute is already resolved or closed");
    });

    it("throws when refund amount is negative", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "open",
      });

      await expect(
        service.resolveDispute("disp-1", "Partial refund", -100),
      ).rejects.toThrow("Refund amount cannot be negative");
    });
  });

  describe("escalateDispute", () => {
    it("escalates a dispute to a valid escalation type", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "under_review",
      });
      const updateSpy = jest
        .spyOn(service, "updateDisputes")
        .mockResolvedValue({});
      jest.spyOn(service, "createDisputeMessages").mockResolvedValue({});
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "escalated",
        priority: "urgent",
      });

      const result = await service.escalateDispute(
        "disp-1",
        "manager",
        "Customer unsatisfied",
      );

      expect(result.status).toBe("escalated");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "escalated",
          priority: "urgent",
          metadata: expect.objectContaining({
            escalation_type: "manager",
          }),
        }),
      );
    });

    it("throws when escalation type is missing", async () => {
      await expect(
        service.escalateDispute("disp-1", "", "notes"),
      ).rejects.toThrow("Escalation type must be one of:");
    });

    it("throws when escalation type is invalid", async () => {
      await expect(
        service.escalateDispute("disp-1", "invalid_type", "notes"),
      ).rejects.toThrow("Escalation type must be one of:");
    });

    it("throws when dispute is already resolved", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "resolved",
      });

      await expect(
        service.escalateDispute("disp-1", "manager", "notes"),
      ).rejects.toThrow("Cannot escalate a resolved or closed dispute");
    });
  });

  describe("getDisputeTimeline", () => {
    it("returns dispute timeline with events and messages", async () => {
      jest.spyOn(service, "retrieveDispute").mockResolvedValue({
        id: "disp-1",
        status: "escalated",
        priority: "urgent",
        created_at: "2025-01-01T00:00:00Z",
        escalated_at: "2025-01-02T00:00:00Z",
      });
      jest.spyOn(service, "getMessages").mockResolvedValue([
        {
          id: "msg-1",
          sender_type: "customer",
          content: "Help needed",
          created_at: "2025-01-01T01:00:00Z",
        },
      ]);

      const result = await service.getDisputeTimeline("disp-1");

      expect(result.dispute.id).toBe("disp-1");
      expect(result.messages).toHaveLength(1);
      expect(result.events.length).toBeGreaterThanOrEqual(2);
    });
  });
});
