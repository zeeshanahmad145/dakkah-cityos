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
        async listGigListings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveGigListing(_id: string): Promise<any> {
          return null;
        }
        async createGigListings(_data: any): Promise<any> {
          return {};
        }
        async updateGigListings(_data: any): Promise<any> {
          return {};
        }
        async listProposals(_filter: any): Promise<any> {
          return [];
        }
        async retrieveProposal(_id: string): Promise<any> {
          return null;
        }
        async createProposals(_data: any): Promise<any> {
          return {};
        }
        async updateProposals(_data: any): Promise<any> {
          return {};
        }
        async listFreelanceContracts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveFreelanceContract(_id: string): Promise<any> {
          return null;
        }
        async createFreelanceContracts(_data: any): Promise<any> {
          return {};
        }
        async updateFreelanceContracts(_data: any): Promise<any> {
          return {};
        }
        async listMilestones(_filter: any): Promise<any> {
          return [];
        }
        async retrieveMilestone(_id: string): Promise<any> {
          return null;
        }
        async createMilestones(_data: any): Promise<any> {
          return {};
        }
        async updateMilestones(_data: any): Promise<any> {
          return {};
        }
        async listTimeLogs(_filter: any): Promise<any> {
          return [];
        }
        async createTimeLogs(_data: any): Promise<any> {
          return {};
        }
        async listFreelanceDisputes(_filter: any): Promise<any> {
          return [];
        }
        async createFreelanceDisputes(_data: any): Promise<any> {
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

import FreelanceModuleService from "../../../src/modules/freelance/service";

describe("FreelanceModuleService", () => {
  let service: FreelanceModuleService;

  beforeEach(() => {
    service = new FreelanceModuleService();
    jest.clearAllMocks();
  });

  describe("completeContract", () => {
    it("completes a contract when all milestones are approved", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "active",
        gig_listing_id: "gig-1",
      });
      jest.spyOn(service, "listMilestones").mockResolvedValue([
        { id: "m1", status: "approved" },
        { id: "m2", status: "paid" },
      ]);
      const updateContractSpy = jest
        .spyOn(service, "updateFreelanceContracts")
        .mockResolvedValue({ id: "contract-1", status: "completed" });
      jest.spyOn(service, "updateGigListings").mockResolvedValue({});

      const result = await service.completeContract("contract-1");

      expect(updateContractSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" }),
      );
    });

    it("throws when contract is not active", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "completed",
      });

      await expect(service.completeContract("contract-1")).rejects.toThrow(
        "Contract must be active to mark as completed",
      );
    });

    it("throws when milestones are incomplete", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "active",
        gig_listing_id: "gig-1",
      });
      jest.spyOn(service, "listMilestones").mockResolvedValue([
        { id: "m1", status: "approved" },
        { id: "m2", status: "submitted" },
      ]);

      await expect(service.completeContract("contract-1")).rejects.toThrow(
        "Cannot complete contract: 1 milestone(s) are not yet approved",
      );
    });
  });

  describe("raiseDispute", () => {
    it("raises a dispute on an active contract", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "active",
      });
      const createDisputeSpy = jest
        .spyOn(service, "createFreelanceDisputes")
        .mockResolvedValue({ id: "dispute-1", status: "open" });
      jest.spyOn(service, "updateFreelanceContracts").mockResolvedValue({});

      const result = await service.raiseDispute("contract-1", {
        raisedBy: "user-1",
        reason: "Quality issue",
      });

      expect(createDisputeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contract_id: "contract-1",
          raised_by: "user-1",
          reason: "Quality issue",
          status: "open",
        }),
      );
    });

    it("throws when contract is not active or completed", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "disputed",
      });

      await expect(
        service.raiseDispute("contract-1", {
          raisedBy: "user-1",
          reason: "Issue",
        }),
      ).rejects.toThrow(
        "Disputes can only be raised on active or completed contracts",
      );
    });

    it("throws when reason or raisedBy is missing", async () => {
      await expect(
        service.raiseDispute("contract-1", { raisedBy: "", reason: "Issue" }),
      ).rejects.toThrow("Dispute requires a reason and the party raising it");
    });
  });

  describe("logTime", () => {
    it("logs time on an active contract for the assigned freelancer", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "active",
        freelancer_id: "freelancer-1",
      });
      const createTimeLogSpy = jest
        .spyOn(service, "createTimeLogs")
        .mockResolvedValue({ id: "tl-1" });

      await service.logTime("contract-1", {
        freelancerId: "freelancer-1",
        hours: 5,
        description: "Backend development",
      });

      expect(createTimeLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contract_id: "contract-1",
          hours: 5,
        }),
      );
    });

    it("throws when hours are not positive", async () => {
      await expect(
        service.logTime("contract-1", {
          freelancerId: "freelancer-1",
          hours: 0,
          description: "Work",
        }),
      ).rejects.toThrow("Hours must be a positive number");
    });

    it("throws when contract is not active", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "completed",
        freelancer_id: "freelancer-1",
      });

      await expect(
        service.logTime("contract-1", {
          freelancerId: "freelancer-1",
          hours: 3,
          description: "Work",
        }),
      ).rejects.toThrow("Can only log time on active contracts");
    });

    it("throws when freelancer is not assigned to contract", async () => {
      jest.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "contract-1",
        status: "active",
        freelancer_id: "freelancer-1",
      });

      await expect(
        service.logTime("contract-1", {
          freelancerId: "freelancer-2",
          hours: 3,
          description: "Work",
        }),
      ).rejects.toThrow(
        "Only the assigned freelancer can log time on this contract",
      );
    });
  });

  describe("getFreelancerStats", () => {
    it("aggregates freelancer statistics correctly", async () => {
      jest.spyOn(service, "listFreelanceContracts").mockResolvedValue([
        { id: "c1", status: "completed", rate: 1000, rating: 4.5 },
        { id: "c2", status: "completed", rate: 2000, rating: 5 },
        { id: "c3", status: "active", rate: 1500 },
      ]);
      jest.spyOn(service, "listTimeLogs").mockResolvedValue([
        { id: "tl1", hours: 10 },
        { id: "tl2", hours: 20 },
      ]);

      const stats = await service.getFreelancerStats("freelancer-1");

      expect(stats.completedContracts).toBe(2);
      expect(stats.activeContracts).toBe(1);
      expect(stats.totalEarned).toBe(3000);
      expect(stats.averageRating).toBe(4.75);
      expect(stats.totalHoursLogged).toBe(30);
    });

    it("returns zero averageRating when no ratings exist", async () => {
      jest
        .spyOn(service, "listFreelanceContracts")
        .mockResolvedValue([{ id: "c1", status: "completed", rate: 500 }]);
      jest.spyOn(service, "listTimeLogs").mockResolvedValue([]);

      const stats = await service.getFreelancerStats("freelancer-1");

      expect(stats.averageRating).toBe(0);
      expect(stats.totalHoursLogged).toBe(0);
    });
  });
});
