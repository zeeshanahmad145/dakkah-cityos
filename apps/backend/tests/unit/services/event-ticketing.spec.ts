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
        async retrieveTicket(_id: string): Promise<any> {
          return null;
        }
        async updateTickets(_data: any): Promise<any> {
          return {};
        }
        async createTickets(_data: any): Promise<any> {
          return {};
        }
        async listTickets(_filter: any): Promise<any> {
          return [];
        }
        async retrieveEvent(_id: string): Promise<any> {
          return null;
        }
        async updateEvents(_data: any): Promise<any> {
          return {};
        }
        async createCheckIns(_data: any): Promise<any> {
          return {};
        }
        async createWaitlistEntries(_data: any): Promise<any> {
          return {};
        }
        async listWaitlistEntries(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTicketType(_id: string): Promise<any> {
          return null;
        }
        async listTicketTypes(_filter: any): Promise<any> {
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

import EventTicketingModuleService from "../../../src/modules/event-ticketing/service";

describe("EventTicketingModuleService", () => {
  let service: EventTicketingModuleService;

  beforeEach(() => {
    service = new EventTicketingModuleService();
    jest.clearAllMocks();
  });

  describe("selectSeat", () => {
    it("should reserve an available seat", async () => {
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        status: "published",
      });
      jest.spyOn(service, "listTickets").mockResolvedValue([]);
      jest.spyOn(service, "createTickets").mockResolvedValue({
        id: "tkt_01",
        seat_id: "seat_A1",
        customer_id: "cust_01",
        status: "reserved",
      });

      const result = await service.selectSeat("evt_01", "seat_A1", "cust_01");
      expect(result.status).toBe("reserved");
    });

    it("should reject seat that is already reserved", async () => {
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        status: "published",
      });
      jest
        .spyOn(service, "listTickets")
        .mockResolvedValue([
          { id: "tkt_01", seat_id: "seat_A1", status: "reserved" },
        ]);

      await expect(
        service.selectSeat("evt_01", "seat_A1", "cust_02"),
      ).rejects.toThrow("Seat is already reserved or sold");
    });

    it("should reject when event is not published", async () => {
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        status: "draft",
      });

      await expect(
        service.selectSeat("evt_01", "seat_A1", "cust_01"),
      ).rejects.toThrow("Event is not available for seat selection");
    });
  });

  describe("processRefund", () => {
    it("should process full refund when more than 72h before event", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_01",
        status: "issued",
        event_id: "evt_01",
        price: 10000,
      });
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        start_date: futureDate.toISOString(),
      });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.processRefund("tkt_01");
      expect(result.refundPercentage).toBe(100);
      expect(result.refundType).toBe("full");
    });

    it("should apply partial refund within 24-72h window", async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 48);

      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_02",
        status: "issued",
        event_id: "evt_01",
        price: 10000,
      });
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        start_date: futureDate.toISOString(),
      });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.processRefund("tkt_02");
      expect(result.refundPercentage).toBe(50);
      expect(result.refundType).toBe("partial");
    });

    it("should deny refund less than 24h before event", async () => {
      const nearDate = new Date();
      nearDate.setHours(nearDate.getHours() + 12);

      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_03",
        status: "issued",
        event_id: "evt_01",
        price: 10000,
      });
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        start_date: nearDate.toISOString(),
      });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.processRefund("tkt_03");
      expect(result.refundPercentage).toBe(0);
      expect(result.refundType).toBe("none");
    });

    it("should reject refund for cancelled ticket", async () => {
      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_04",
        status: "cancelled",
      });

      await expect(service.processRefund("tkt_04")).rejects.toThrow(
        "Ticket cannot be refunded",
      );
    });
  });

  describe("transferTicket", () => {
    it("should transfer ownership of a ticket", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValueOnce({
          id: "tkt_01",
          status: "issued",
          customer_id: "cust_01",
          event_id: "evt_01",
        })
        .mockResolvedValueOnce({
          id: "tkt_01",
          customer_id: "cust_02",
        });
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        start_date: futureDate.toISOString(),
      });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.transferTicket("tkt_01", "cust_02");
      expect(result.customer_id).toBe("cust_02");
    });

    it("should reject transfer of cancelled ticket", async () => {
      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_01",
        status: "cancelled",
      });

      await expect(service.transferTicket("tkt_01", "cust_02")).rejects.toThrow(
        "Cancelled tickets cannot be transferred",
      );
    });

    it("should reject transfer of used ticket", async () => {
      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_01",
        status: "used",
      });

      await expect(service.transferTicket("tkt_01", "cust_02")).rejects.toThrow(
        "Used tickets cannot be transferred",
      );
    });
  });

  describe("checkIn", () => {
    it("should check in an issued ticket", async () => {
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValueOnce({
          id: "tkt_01",
          status: "issued",
          event_id: "evt_01",
        })
        .mockResolvedValueOnce({ id: "tkt_01", status: "used" });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});
      jest.spyOn(service, "createCheckIns").mockResolvedValue({});

      const result = await service.checkIn("tkt_01");
      expect(result.status).toBe("used");
    });

    it("should reject check-in on already used ticket", async () => {
      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_01",
        status: "used",
      });

      await expect(service.checkIn("tkt_01")).rejects.toThrow(
        "Ticket has already been used",
      );
    });

    it("should reject check-in on cancelled ticket", async () => {
      jest.spyOn(service, "retrieveTicket").mockResolvedValue({
        id: "tkt_01",
        status: "cancelled",
      });

      await expect(service.checkIn("tkt_01")).rejects.toThrow(
        "Ticket has been cancelled",
      );
    });
  });

  describe("joinWaitlist", () => {
    it("should add customer to waitlist when no capacity", async () => {
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "evt_01",
        status: "published",
      });
      jest.spyOn(service, "getEventCapacity").mockResolvedValue({
        total: 100,
        sold: 100,
        reserved: 0,
        available: 0,
      });
      jest.spyOn(service, "listWaitlistEntries").mockResolvedValue([]);
      jest.spyOn(service, "createWaitlistEntries").mockResolvedValue({
        id: "wl_01",
        customer_id: "cust_01",
        position: 1,
      });

      const result = await service.joinWaitlist("evt_01", "tt_01", "cust_01");
      expect(result).toBeDefined();
    });
  });
});
