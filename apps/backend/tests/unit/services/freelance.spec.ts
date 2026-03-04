import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
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
        async retrieveGigListing(_id: string): Promise<any> {
          return null;
        }
        async listProposals(_filter: any): Promise<any> {
          return [];
        }
        async createProposals(_data: any): Promise<any> {
          return {};
        }
        async retrieveProposal(_id: string): Promise<any> {
          return null;
        }
        async updateProposals(_data: any): Promise<any> {
          return {};
        }
        async retrieveFreelanceContract(_id: string): Promise<any> {
          return null;
        }
        async updateFreelanceContracts(_data: any): Promise<any> {
          return {};
        }
        async createFreelanceContracts(_data: any): Promise<any> {
          return {};
        }
        async retrieveMilestone(_id: string): Promise<any> {
          return null;
        }
        async updateMilestones(_data: any): Promise<any> {
          return {};
        }
        async createMilestones(_data: any): Promise<any> {
          return {};
        }
        async listMilestones(_filter: any): Promise<any> {
          return [];
        }
        async updateGigListings(_data: any): Promise<any> {
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
    service = new FreelanceModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("submitProposal", () => {
    it("should submit a valid proposal", async () => {
      vi.spyOn(service, "retrieveGigListing").mockResolvedValue({
        id: "gig_01",
        status: "open",
        budget: 5000,
      });
      vi.spyOn(service, "listProposals").mockResolvedValue([]);
      vi.spyOn(service, "createProposals").mockResolvedValue({
        id: "prop_01",
        gig_listing_id: "gig_01",
        freelancer_id: "fl_01",
        status: "submitted",
      });

      const result = await service.submitProposal("gig_01", "fl_01", {
        coverLetter: "I am interested",
        proposedRate: 4500,
        estimatedDuration: 14,
      });
      expect(result.status).toBe("submitted");
    });

    it("should reject proposal on closed gig", async () => {
      vi.spyOn(service, "retrieveGigListing").mockResolvedValue({
        id: "gig_01",
        status: "closed",
        budget: 5000,
      });

      await expect(
        service.submitProposal("gig_01", "fl_01", {
          coverLetter: "Interested",
          proposedRate: 4500,
          estimatedDuration: 14,
        }),
      ).rejects.toThrow("Gig is not accepting proposals");
    });

    it("should reject proposal with invalid rate", async () => {
      await expect(
        service.submitProposal("gig_01", "fl_01", {
          coverLetter: "Interested",
          proposedRate: 0,
          estimatedDuration: 14,
        }),
      ).rejects.toThrow("Cover letter and valid proposed rate are required");
    });

    it("should reject duplicate proposal", async () => {
      vi.spyOn(service, "retrieveGigListing").mockResolvedValue({
        id: "gig_01",
        status: "open",
        budget: 5000,
      });
      jest
        .spyOn(service, "listProposals")
        .mockResolvedValue([{ id: "prop_01", status: "submitted" }]);

      await expect(
        service.submitProposal("gig_01", "fl_01", {
          coverLetter: "Interested",
          proposedRate: 4500,
        }),
      ).rejects.toThrow("You have already submitted a proposal for this gig");
    });
  });

  describe("calculatePlatformFee", () => {
    it("should calculate fee for an amount", async () => {
      const result = await service.calculatePlatformFee(500);
      expect(result).toBeDefined();
      expect(result.fee).toBeGreaterThan(0);
      expect(result.netAmount).toBeLessThan(500);
      expect(result.fee + result.netAmount).toBe(500);
    });

    it("should apply lower fee percentage for larger amounts", async () => {
      const small = await service.calculatePlatformFee(500);
      const large = await service.calculatePlatformFee(5000);

      expect(large.feePercentage).toBeLessThanOrEqual(small.feePercentage);
    });

    it("should ensure fee and net always sum to original amount", async () => {
      const amounts = [100, 500, 1000, 5000, 10000];
      for (const amount of amounts) {
        const result = await service.calculatePlatformFee(amount);
        expect(result.fee + result.netAmount).toBe(amount);
      }
    });
  });

  describe("releaseMilestonePayment", () => {
    it("should release payment for approved milestone", async () => {
      vi.spyOn(service, "retrieveMilestone").mockResolvedValue({
        id: "ms_01",
        status: "approved",
        amount: 2000,
        contract_id: "con_01",
      });
      vi.spyOn(service, "retrieveFreelanceContract").mockResolvedValue({
        id: "con_01",
        freelancer_id: "fl_01",
        status: "active",
      });
      vi.spyOn(service, "updateMilestones").mockResolvedValue({});

      const result = await service.releaseMilestonePayment("ms_01");
      expect(result).toBeDefined();
      expect(result.milestoneId).toBe("ms_01");
    });

    it("should reject release for unapproved milestone", async () => {
      vi.spyOn(service, "retrieveMilestone").mockResolvedValue({
        id: "ms_01",
        status: "pending",
        amount: 2000,
      });

      await expect(service.releaseMilestonePayment("ms_01")).rejects.toThrow();
    });

    it("should reject release for already paid milestone", async () => {
      vi.spyOn(service, "retrieveMilestone").mockResolvedValue({
        id: "ms_01",
        status: "paid",
        amount: 2000,
      });

      await expect(service.releaseMilestonePayment("ms_01")).rejects.toThrow();
    });
  });
});
