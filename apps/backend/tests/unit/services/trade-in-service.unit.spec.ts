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
        async createTradeInRequests(_data: any): Promise<any> {
          return {};
        }
        async updateTradeInRequests(_data: any): Promise<any> {
          return {};
        }
        async retrieveTradeInRequest(_id: string): Promise<any> {
          return null;
        }
        async listTradeInRequests(_filter?: any): Promise<any> {
          return [];
        }
        async createTradeInOffers(_data: any): Promise<any> {
          return {};
        }
        async updateTradeInOffers(_data: any): Promise<any> {
          return {};
        }
        async retrieveTradeInOffer(_id: string): Promise<any> {
          return null;
        }
        async listTradeInOffers(_filter?: any): Promise<any> {
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
    },
  };
});

import TradeInService from "../../../src/modules/trade-in/service";

describe("TradeInService", () => {
  let service: TradeInService;

  beforeEach(() => {
    service = new TradeInService();
    jest.clearAllMocks();
  });

  describe("createTradeInRequests", () => {
    it("creates a trade-in request with valid data", async () => {
      const requestData = {
        customer_id: "cust_1",
        product_id: "prod_1",
        condition: "good",
        description: "Lightly used item",
        photos: ["/img1.jpg"],
        status: "pending_evaluation",
        trade_in_number: "TI-001",
      };

      const createSpy = jest
        .spyOn(service, "createTradeInRequests")
        .mockResolvedValue({
          id: "tir_1",
          ...requestData,
        });

      const result = await service.createTradeInRequests(requestData);

      expect(createSpy).toHaveBeenCalledWith(requestData);
      expect(result.id).toBe("tir_1");
      expect(result.status).toBe("pending_evaluation");
    });

    it("defaults status to pending_evaluation", async () => {
      const createSpy = jest
        .spyOn(service, "createTradeInRequests")
        .mockResolvedValue({
          id: "tir_2",
          status: "pending_evaluation",
        });

      const result = await service.createTradeInRequests({
        customer_id: "cust_1",
        product_id: "prod_1",
        condition: "fair",
        description: "Some scratches",
        trade_in_number: "TI-002",
      });

      expect(result.status).toBe("pending_evaluation");
    });
  });

  describe("item evaluation scoring", () => {
    it("updates request with evaluation data for excellent condition", async () => {
      jest.spyOn(service, "retrieveTradeInRequest").mockResolvedValue({
        id: "tir_1",
        condition: "excellent",
        status: "pending_evaluation",
        market_value: 500,
      });

      const updateSpy = jest
        .spyOn(service, "updateTradeInRequests")
        .mockResolvedValue({
          id: "tir_1",
          status: "evaluated",
          estimated_value: 450,
          condition_rating: 95,
          evaluation_notes: "Near mint condition",
          evaluated_at: new Date(),
        });

      const request = await service.retrieveTradeInRequest("tir_1");
      expect(request.condition).toBe("excellent");

      const conditionMultipliers: Record<string, number> = {
        excellent: 0.9,
        good: 0.7,
        fair: 0.5,
        poor: 0.3,
      };
      const estimatedValue = Math.round(
        Number(request.market_value) * conditionMultipliers[request.condition],
      );

      const updated = await service.updateTradeInRequests({
        id: "tir_1",
        status: "evaluated",
        estimated_value: estimatedValue,
        condition_rating: 95,
        evaluation_notes: "Near mint condition",
        evaluated_at: new Date(),
      });

      expect(estimatedValue).toBe(450);
      expect(updated.status).toBe("evaluated");
    });

    it("calculates lower value for poor condition items", async () => {
      jest.spyOn(service, "retrieveTradeInRequest").mockResolvedValue({
        id: "tir_2",
        condition: "poor",
        status: "pending_evaluation",
        market_value: 500,
      });

      const request = await service.retrieveTradeInRequest("tir_2");
      const conditionMultipliers: Record<string, number> = {
        excellent: 0.9,
        good: 0.7,
        fair: 0.5,
        poor: 0.3,
      };
      const estimatedValue = Math.round(
        Number(request.market_value) * conditionMultipliers[request.condition],
      );

      expect(estimatedValue).toBe(150);
    });
  });

  describe("offer creation", () => {
    it("creates an offer for an evaluated request", async () => {
      jest.spyOn(service, "retrieveTradeInRequest").mockResolvedValue({
        id: "tir_1",
        status: "evaluated",
        estimated_value: 300,
      });

      const createOfferSpy = jest
        .spyOn(service, "createTradeInOffers")
        .mockResolvedValue({
          id: "tio_1",
          request_id: "tir_1",
          offer_amount: 280,
          credit_type: "store_credit",
          status: "pending",
          expires_at: new Date("2025-12-31"),
        });

      const request = await service.retrieveTradeInRequest("tir_1");
      expect(request.status).toBe("evaluated");

      const offer = await service.createTradeInOffers({
        request_id: "tir_1",
        offer_amount: 280,
        credit_type: "store_credit",
        status: "pending",
        expires_at: new Date("2025-12-31"),
      });

      expect(offer.status).toBe("pending");
      expect(offer.offer_amount).toBe(280);
    });
  });

  describe("offer acceptance", () => {
    it("accepts an offer and updates request to approved", async () => {
      jest.spyOn(service, "retrieveTradeInOffer").mockResolvedValue({
        id: "tio_1",
        request_id: "tir_1",
        status: "pending",
        offer_amount: 280,
      });

      const updateOfferSpy = jest
        .spyOn(service, "updateTradeInOffers")
        .mockResolvedValue({
          id: "tio_1",
          status: "accepted",
          accepted_at: new Date(),
        });

      const updateRequestSpy = jest
        .spyOn(service, "updateTradeInRequests")
        .mockResolvedValue({
          id: "tir_1",
          status: "approved",
          final_value: 280,
          credit_amount: 280,
          approved_at: new Date(),
        });

      const offer = await service.retrieveTradeInOffer("tio_1");
      expect(offer.status).toBe("pending");

      await service.updateTradeInOffers({
        id: "tio_1",
        status: "accepted",
        accepted_at: new Date(),
      });

      const updatedRequest = await service.updateTradeInRequests({
        id: "tir_1",
        status: "approved",
        final_value: offer.offer_amount,
        credit_amount: offer.offer_amount,
        approved_at: new Date(),
      });

      expect(updatedRequest.status).toBe("approved");
      expect(updatedRequest.credit_amount).toBe(280);
    });
  });

  describe("offer rejection", () => {
    it("rejects an offer with a reason", async () => {
      jest.spyOn(service, "retrieveTradeInOffer").mockResolvedValue({
        id: "tio_1",
        request_id: "tir_1",
        status: "pending",
      });

      const updateOfferSpy = jest
        .spyOn(service, "updateTradeInOffers")
        .mockResolvedValue({
          id: "tio_1",
          status: "rejected",
          rejection_reason: "Price too low",
          rejected_at: new Date(),
        });

      const updated = await service.updateTradeInOffers({
        id: "tio_1",
        status: "rejected",
        rejection_reason: "Price too low",
        rejected_at: new Date(),
      });

      expect(updated.status).toBe("rejected");
      expect(updated.rejection_reason).toBe("Price too low");
    });

    it("cannot accept an already rejected offer", async () => {
      jest.spyOn(service, "retrieveTradeInOffer").mockResolvedValue({
        id: "tio_1",
        status: "rejected",
      });

      const offer = await service.retrieveTradeInOffer("tio_1");
      expect(offer.status).toBe("rejected");
      expect(offer.status).not.toBe("pending");
    });
  });

  describe("listing and filtering", () => {
    it("lists trade-in requests by customer", async () => {
      jest.spyOn(service, "listTradeInRequests").mockResolvedValue([
        { id: "tir_1", customer_id: "cust_1", status: "pending_evaluation" },
        { id: "tir_2", customer_id: "cust_1", status: "evaluated" },
      ]);

      const results = await service.listTradeInRequests({
        customer_id: "cust_1",
      });
      expect(results).toHaveLength(2);
      expect(results[0].customer_id).toBe("cust_1");
    });

    it("returns empty list when no requests found", async () => {
      jest.spyOn(service, "listTradeInRequests").mockResolvedValue([]);

      const results = await service.listTradeInRequests({
        customer_id: "nonexistent",
      });
      expect(results).toHaveLength(0);
    });
  });
});
