import { MedusaService } from "@medusajs/framework/utils";
import GigListing from "./models/gig-listing";
import Proposal from "./models/proposal";
import FreelanceContract from "./models/freelance-contract";
import Milestone from "./models/milestone";
import TimeLog from "./models/time-log";
import FreelanceDispute from "./models/freelance-dispute";

class FreelanceModuleService extends MedusaService({
  GigListing,
  Proposal,
  FreelanceContract,
  Milestone,
  TimeLog,
  FreelanceDispute,
}) {
  /** Submit a proposal for a gig */
  async submitProposal(
    gigId: string,
    freelancerId: string,
    data: {
      coverLetter: string;
      proposedRate: number;
      estimatedDuration?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<any> {
    if (!data.coverLetter || data.proposedRate <= 0) {
      throw new Error("Cover letter and valid proposed rate are required");
    }

    const gig = await this.retrieveGigListing(gigId) as any;
    if (gig.status !== "open") {
      throw new Error("Gig is not accepting proposals");
    }

    const existing = await this.listProposals({
      gig_listing_id: gigId,
      freelancer_id: freelancerId,
    }) as any;
    const list = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (list.length > 0) {
      throw new Error("You have already submitted a proposal for this gig");
    }

    return await this.createProposals({
      gig_listing_id: gigId,
      freelancer_id: freelancerId,
      cover_letter: data.coverLetter,
      proposed_rate: data.proposedRate,
      estimated_duration: data.estimatedDuration || null,
      status: "submitted",
      submitted_at: new Date(),
      metadata: data.metadata || null,
    } as any);
  }

  /** Award a contract to a freelancer based on their proposal */
  async awardContract(proposalId: string): Promise<any> {
    const proposal = await this.retrieveProposal(proposalId) as any;

    if (proposal.status !== "submitted" && proposal.status !== "shortlisted") {
      throw new Error("Proposal is not in a valid state for awarding");
    }

    const contract = await this.createFreelanceContracts({
      gig_listing_id: proposal.gig_listing_id,
      proposal_id: proposalId,
      freelancer_id: proposal.freelancer_id,
      rate: proposal.proposed_rate,
      status: "active",
      started_at: new Date(),
    } as any);

    await this.updateProposals({ id: proposalId, status: "accepted" } as any);

    await this.updateGigListings({
      id: proposal.gig_listing_id,
      status: "in_progress",
    } as any);

    return contract;
  }

  /** Submit a deliverable for a contract milestone */
  async submitDeliverable(
    contractId: string,
    data: {
      title: string;
      description: string;
      milestoneId?: string;
    },
  ): Promise<any> {
    const contract = await this.retrieveFreelanceContract(contractId) as any;

    if (contract.status !== "active") {
      throw new Error("Contract is not active");
    }

    if (data.milestoneId) {
      const milestone = await this.retrieveMilestone(data.milestoneId) as any;
      await this.updateMilestones({
        id: data.milestoneId,
        status: "submitted",
        submitted_at: new Date(),
        deliverable_title: data.title,
        deliverable_description: data.description,
      } as any);
      return milestone;
    }

    return await this.createMilestones({
      contract_id: contractId,
      title: data.title,
      description: data.description,
      status: "submitted",
      submitted_at: new Date(),
    } as any);
  }

  /** Release payment for a completed contract */
  async releasePayment(contractId: string): Promise<any> {
    const contract = await this.retrieveFreelanceContract(contractId) as any;

    if (contract.status !== "active" && contract.status !== "completed") {
      throw new Error("Contract is not in a payable state");
    }

    const milestones = await this.listMilestones({
      contract_id: contractId,
    }) as any;
    const milestoneList = Array.isArray(milestones)
      ? milestones
      : [milestones].filter(Boolean);
    const pendingMilestones = milestoneList.filter(
      (m: any) => m.status !== "approved" && m.status !== "paid",
    );

    if (pendingMilestones.length > 0) {
      throw new Error(
        "All milestones must be approved before releasing payment",
      );
    }

    await this.updateFreelanceContracts({
      id: contractId,
      status: "completed",
      completed_at: new Date(),
      payment_released: true,
      payment_released_at: new Date(),
    } as any);

    return { contractId, status: "payment_released", amount: contract.rate };
  }

  async completeContract(contractId: string): Promise<any> {
    const contract = await this.retrieveFreelanceContract(contractId) as any;

    if (contract.status !== "active") {
      throw new Error("Contract must be active to mark as completed");
    }

    const milestones = await this.listMilestones({
      contract_id: contractId,
    }) as any;
    const milestoneList = Array.isArray(milestones)
      ? milestones
      : [milestones].filter(Boolean);
    const incompleteMilestones = milestoneList.filter(
      (m: any) =>
        m.status !== "approved" &&
        m.status !== "paid" &&
        m.status !== "completed",
    );

    if (incompleteMilestones.length > 0) {
      throw new Error(
        `Cannot complete contract: ${incompleteMilestones.length} milestone(s) are not yet approved`,
      );
    }

    const updated = await this.updateFreelanceContracts({
      id: contractId,
      status: "completed",
      completed_at: new Date(),
    } as any);

    await this.updateGigListings({
      id: contract.gig_listing_id,
      status: "completed",
    } as any);

    return updated;
  }

  async raiseDispute(
    contractId: string,
    data: {
      raisedBy: string;
      reason: string;
      evidence?: string;
    },
  ): Promise<any> {
    if (!data.reason || !data.raisedBy) {
      throw new Error("Dispute requires a reason and the party raising it");
    }

    const contract = await this.retrieveFreelanceContract(contractId) as any;

    if (contract.status !== "active" && contract.status !== "completed") {
      throw new Error(
        "Disputes can only be raised on active or completed contracts",
      );
    }

    const dispute = await this.createFreelanceDisputes({
      contract_id: contractId,
      raised_by: data.raisedBy,
      reason: data.reason,
      evidence: data.evidence || null,
      status: "open",
      raised_at: new Date(),
    } as any);

    await this.updateFreelanceContracts({
      id: contractId,
      status: "disputed",
    } as any);

    return dispute;
  }

  async logTime(
    contractId: string,
    data: {
      freelancerId: string;
      hours: number;
      description: string;
      date?: Date;
    },
  ): Promise<any> {
    if (!data.hours || data.hours <= 0) {
      throw new Error("Hours must be a positive number");
    }

    if (!data.description) {
      throw new Error("Description is required for time logs");
    }

    const contract = await this.retrieveFreelanceContract(contractId) as any;

    if (contract.status !== "active") {
      throw new Error("Can only log time on active contracts");
    }

    if (contract.freelancer_id !== data.freelancerId) {
      throw new Error(
        "Only the assigned freelancer can log time on this contract",
      );
    }

    const timeLog = await this.createTimeLogs({
      contract_id: contractId,
      freelancer_id: data.freelancerId,
      hours: data.hours,
      description: data.description,
      logged_date: data.date || new Date(),
      logged_at: new Date(),
    } as any);

    return timeLog;
  }

  async releaseMilestonePayment(milestoneId: string): Promise<{
    milestoneId: string;
    amount: number;
    status: string;
    releasedAt: Date;
  }> {
    const milestone = await this.retrieveMilestone(milestoneId) as any;

    if (milestone.status !== "approved" && milestone.status !== "completed") {
      throw new Error(
        "Milestone must be approved or completed before releasing payment",
      );
    }

    if (milestone.payment_released) {
      throw new Error("Payment has already been released for this milestone");
    }

    const contract = await this.retrieveFreelanceContract(
      milestone.contract_id,
    ) as any;
    const amount = Number(milestone.amount || contract.rate || 0);

    await this.updateMilestones({
      id: milestoneId,
      status: "paid",
      payment_released: true,
      payment_released_at: new Date(),
      payment_amount: amount,
    } as any);

    return {
      milestoneId,
      amount,
      status: "paid",
      releasedAt: new Date(),
    };
  }

  async calculatePlatformFee(amount: number): Promise<{
    amount: number;
    fee: number;
    feePercentage: number;
    netAmount: number;
  }> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    let fee: number;
    const firstTierLimit = 500;
    const firstTierRate = 0.1;
    const secondTierRate = 0.05;

    if (amount <= firstTierLimit) {
      fee = amount * firstTierRate;
    } else {
      fee =
        firstTierLimit * firstTierRate +
        (amount - firstTierLimit) * secondTierRate;
    }

    fee = Math.round(fee * 100) / 100;
    const feePercentage = Math.round((fee / amount) * 10000) / 100;
    const netAmount = Math.round((amount - fee) * 100) / 100;

    return { amount, fee, feePercentage, netAmount };
  }

  async getFreelancerStats(freelancerId: string): Promise<{
    completedContracts: number;
    activeContracts: number;
    totalEarned: number;
    averageRating: number;
    totalHoursLogged: number;
  }> {
    const contracts = await this.listFreelanceContracts({
      freelancer_id: freelancerId,
    }) as any;
    const contractList = Array.isArray(contracts)
      ? contracts
      : [contracts].filter(Boolean);

    const completedContracts = contractList.filter(
      (c: any) => c.status === "completed",
    );
    const activeContracts = contractList.filter(
      (c: any) => c.status === "active",
    );

    const totalEarned = completedContracts.reduce(
      (sum: number, c: any) => sum + Number(c.rate || 0),
      0,
    );

    const ratings = completedContracts
      .filter((c: any) => c.rating != null)
      .map((c: any) => Number(c.rating));
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) /
          ratings.length
        : 0;

    const timeLogs = await this.listTimeLogs({
      freelancer_id: freelancerId,
    }) as any;
    const timeLogList = Array.isArray(timeLogs)
      ? timeLogs
      : [timeLogs].filter(Boolean);
    const totalHoursLogged = timeLogList.reduce(
      (sum: number, t: any) => sum + Number(t.hours || 0),
      0,
    );

    return {
      completedContracts: completedContracts.length,
      activeContracts: activeContracts.length,
      totalEarned,
      averageRating,
      totalHoursLogged,
    };
  }
}

export default FreelanceModuleService;
