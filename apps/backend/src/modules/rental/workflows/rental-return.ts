import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Rental Return Workflow
 * Initiate return → inspect condition → release deposit (or withhold for damages).
 */
const processRentalReturnStep = createStep(
  "process-rental-return",
  async (
    {
      rentalId,
      condition,
      notes,
    }: { rentalId: string; condition?: string; notes?: string },
    { container },
  ) => {
    const rentalService = container.resolve("rental") as unknown as any;
    const returnRecord = await rentalService.processReturn(
      rentalId,
      condition ?? "good",
      notes,
    );
    return new StepResponse({ returnRecord }, { rentalId });
  },
  async ({ rentalId }: { rentalId: string }, { container }) => {
    const rentalService = container.resolve("rental") as unknown as any;
    await rentalService.updateRentalAgreements?.({
      id: rentalId,
      status: "active",
    });
  },
);

const evaluateDamagesStep = createStep(
  "evaluate-rental-damages",
  async (
    { rentalId, condition }: { rentalId: string; condition?: string },
    { container },
  ) => {
    const rentalService = container.resolve("rental") as unknown as any;
    const damagedConditions = ["damaged", "poor", "missing"];
    const hasDamages = damagedConditions.includes(
      (condition ?? "good").toLowerCase(),
    );

    let damageClaim: any = null;
    if (hasDamages) {
      if (typeof rentalService.createDamageClaim === "function") {
        damageClaim = await rentalService.createDamageClaim(
          rentalId,
          condition,
        );
      } else {
        damageClaim = await rentalService.createDamageClaims?.({
          rental_agreement_id: rentalId,
          condition,
          status: "pending",
          reported_at: new Date(),
        });
      }
    }

    return new StepResponse({ hasDamages, damageClaim });
  },
);

const releaseDepositStep = createStep(
  "release-rental-deposit",
  async (
    { rentalId, hasDamages }: { rentalId: string; hasDamages: boolean },
    { container },
  ) => {
    const rentalService = container.resolve("rental") as unknown as any;

    // Full release if no damages, partial/hold if damages
    const depositStatus = hasDamages ? "held_for_damages" : "released";
    let result: any = { deposit_status: depositStatus };

    if (typeof rentalService.releaseDeposit === "function") {
      result = await rentalService.releaseDeposit(rentalId, !hasDamages);
    }

    return new StepResponse(result);
  },
);

export const rentalReturnWorkflow = createWorkflow(
  "rental-return",
  // @ts-ignore: workflow builder type
  (input: { rentalId: string; condition?: string; notes?: string }) => {
    const returned = processRentalReturnStep({
      rentalId: input.rentalId,
      condition: input.condition,
      notes: input.notes,
    });
    const damages = evaluateDamagesStep({
      rentalId: input.rentalId,
      condition: input.condition,
    });
    const deposit = releaseDepositStep({
      rentalId: input.rentalId,
      hasDamages: damages.hasDamages,
    });
    return { returned, damages, deposit };
  },
);
