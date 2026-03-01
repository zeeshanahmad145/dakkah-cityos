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
        async listEvents(_filter: any): Promise<any> {
          return [];
        }
        async retrieveEvent(_id: string): Promise<any> {
          return null;
        }
        async listTicketTypes(_filter: any): Promise<any> {
          return [];
        }
        async listTickets(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTicket(_id: string): Promise<any> {
          return null;
        }
        async createTickets(_data: any): Promise<any> {
          return {};
        }
        async updateTickets(_data: any): Promise<any> {
          return {};
        }
        async listVenues(_filter: any): Promise<any> {
          return [];
        }
        async listSeatMaps(_filter: any): Promise<any> {
          return [];
        }
        async listCheckIns(_filter: any): Promise<any> {
          return [];
        }
        async createCheckIns(_data: any): Promise<any> {
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

import EventTicketingModuleService from "../../../src/modules/event-ticketing/service";

describe("EventTicketingModuleService", () => {
  let service: EventTicketingModuleService;

  beforeEach(() => {
    service = new EventTicketingModuleService();
    jest.clearAllMocks();
  });

  describe("purchaseTicket", () => {
    it("purchases tickets successfully", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      jest.spyOn(service, "retrieveEvent").mockResolvedValue({
        id: "e1",
        status: "published",
        start_date: futureDate,
        capacity: 100,
      });
      jest.spyOn(service, "listTickets").mockResolvedValue([]);
      jest.spyOn(service, "createTickets").mockResolvedValue({ id: "tk-1" });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.purchaseTicket("e1", {
        customerId: "c1",
        ticketTierId: "tt-1",
        quantity: 2,
      });

      expect(result.eventId).toBe("e1");
      expect(result.quantity).toBe(2);
    });

    it("throws when quantity exceeds limit", async () => {
      await expect(
        service.purchaseTicket("e1", {
          customerId: "c1",
          ticketTierId: "tt-1",
          quantity: 15,
        }),
      ).rejects.toThrow("Quantity must be between 1 and 10");
    });

    it("throws when required fields are missing", async () => {
      await expect(
        service.purchaseTicket("e1", {
          customerId: "",
          ticketTierId: "tt-1",
          quantity: 1,
        }),
      ).rejects.toThrow(
        "Customer ID, ticket tier ID, and quantity are required",
      );
    });
  });

  describe("checkIn", () => {
    it("checks in an issued ticket", async () => {
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValueOnce({ id: "tk-1", status: "issued", event_id: "e1" })
        .mockResolvedValueOnce({ id: "tk-1", status: "used" });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});
      jest.spyOn(service, "createCheckIns").mockResolvedValue({});

      const result = await service.checkIn("tk-1");

      expect(result.status).toBe("used");
    });

    it("throws when ticket has already been used", async () => {
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValue({ id: "tk-1", status: "used" });

      await expect(service.checkIn("tk-1")).rejects.toThrow(
        "Ticket has already been used",
      );
    });

    it("throws when ticket is cancelled", async () => {
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValue({ id: "tk-1", status: "cancelled" });

      await expect(service.checkIn("tk-1")).rejects.toThrow(
        "Ticket has been cancelled",
      );
    });
  });

  describe("getEventDashboard", () => {
    it("returns event dashboard metrics", async () => {
      jest
        .spyOn(service, "retrieveEvent")
        .mockResolvedValue({ id: "e1", capacity: 200 });
      jest.spyOn(service, "listTickets").mockResolvedValue([
        { status: "issued", price: 50 },
        { status: "used", price: 50 },
        { status: "cancelled", price: 50 },
        { status: "reserved", price: 30 },
      ]);

      const result = await service.getEventDashboard("e1");

      expect(result.capacity.sold).toBe(2);
      expect(result.capacity.reserved).toBe(1);
      expect(result.revenue).toBe(130);
      expect(result.ticketBreakdown).toEqual({
        issued: 1,
        used: 1,
        cancelled: 1,
        reserved: 1,
      });
    });
  });

  describe("transferTicket", () => {
    it("transfers ticket to new owner", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValueOnce({
          id: "tk-1",
          status: "issued",
          customer_id: "c1",
          event_id: "e1",
        })
        .mockResolvedValueOnce({
          id: "tk-1",
          status: "issued",
          customer_id: "c2",
        });
      jest
        .spyOn(service, "retrieveEvent")
        .mockResolvedValue({ id: "e1", start_date: futureDate });
      jest.spyOn(service, "updateTickets").mockResolvedValue({});

      const result = await service.transferTicket("tk-1", "c2");

      expect(result.customer_id).toBe("c2");
    });

    it("throws when ticket is used", async () => {
      jest
        .spyOn(service, "retrieveTicket")
        .mockResolvedValue({ id: "tk-1", status: "used" });

      await expect(service.transferTicket("tk-1", "c2")).rejects.toThrow(
        "Used tickets cannot be transferred",
      );
    });
  });
});
