import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

// ─── Steps ────────────────────────────────────────────────────────────────────

const validateProperty = createStep(
  "validate-property-for-offer",
  async (input: { propertyId: string }, { container }) => {
    const realEstateService = container.resolve("real-estate") as unknown as any;
    const property = await realEstateService.retrievePropertyListing(
      input.propertyId,
    );
    if (property.status !== "published") {
      throw new Error("Property is not accepting offers");
    }
    return new StepResponse({ property, askingPrice: property.price });
  },
);

const submitPurchaseOffer = createStep(
  "submit-purchase-offer",
  async (
    input: {
      propertyId: string;
      buyerId: string;
      amount: number;
      conditions?: string;
    },
    { container },
  ) => {
    const realEstateService = container.resolve("real-estate") as unknown as any;
    const offer = await realEstateService.makeOffer(
      input.propertyId,
      input.buyerId,
      input.amount,
      input.conditions,
    );
    return new StepResponse(offer);
  },
);

const schedulePurchaseViewing = createStep(
  "schedule-purchase-viewing",
  async (
    input: {
      propertyId: string;
      buyerId: string;
      viewingDate: string;
      notes?: string;
    },
    { container },
  ) => {
    const realEstateService = container.resolve("real-estate") as unknown as any;
    const viewing = await realEstateService.scheduleViewing(
      input.propertyId,
      input.buyerId,
      new Date(input.viewingDate),
      input.notes,
    );
    return new StepResponse(viewing);
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const purchaseOfferWorkflow = createWorkflow(
  "purchase-offer",
  // @ts-ignore: workflow builder return type
  (input: {
    propertyId: string;
    buyerId: string;
    amount: number;
    conditions?: string;
    scheduleViewing?: boolean;
    viewingDate?: string;
    viewingNotes?: string;
  }) => {
    const validation = validateProperty({ propertyId: input.propertyId });
    const offer = submitPurchaseOffer({
      propertyId: input.propertyId,
      buyerId: input.buyerId,
      amount: input.amount,
      conditions: input.conditions,
    });
    return { validation, offer };
  },
);
