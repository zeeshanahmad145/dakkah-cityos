import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/donations/recurring
 * Set up a recurring donation for a charity campaign.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const charityService = req.scope.resolve("charity") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    const {
      campaign_id,
      amount,
      currency = "usd",
      frequency = "monthly",
    } = req.body as {
      campaign_id: string;
      amount: number;
      currency?: string;
      frequency?: string;
    };

    if (!campaign_id || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "campaign_id and amount > 0 are required" });
    }

    const validFrequencies = ["weekly", "monthly", "quarterly", "annually"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        error: `frequency must be one of: ${validFrequencies.join(", ")}`,
      });
    }

    let donation: any;
    if (typeof charityService.scheduleRecurringDonation === "function") {
      donation = await charityService.scheduleRecurringDonation({
        campaignId: campaign_id,
        customerId,
        amount,
        currency,
        frequency,
      });
    } else if (typeof charityService.createDonationSchedule === "function") {
      donation = await charityService.createDonationSchedule({
        campaign_id,
        customer_id: customerId,
        amount,
        currency,
        frequency,
      });
    } else {
      donation = await charityService.createDonationSchedules?.({
        campaign_id,
        customer_id: customerId,
        amount,
        currency,
        frequency,
        status: "active",
        next_charge_at: getNextChargeDate(frequency),
        created_at: new Date(),
      });
    }

    return res.status(201).json({ donation });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-DONATIONS-RECURRING");
  }
}

function getNextChargeDate(frequency: string): Date {
  const next = new Date();
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
