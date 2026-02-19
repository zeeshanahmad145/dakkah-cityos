import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type TradeInEvaluationInput = {
  customerId: string
  productCategory: string
  brand: string
  model: string
  condition: string
  description: string
  imageUrls?: string[]
}

const submitTradeInStep = createStep(
  "submit-trade-in-step",
  async (input: TradeInEvaluationInput) => {
    const submission = {
      customer_id: input.customerId,
      category: input.productCategory,
      brand: input.brand,
      model: input.model,
      condition: input.condition,
      status: "submitted",
      submitted_at: new Date(),
    }
    return new StepResponse({ submission }, { customerId: input.customerId })
  },
  async (compensationData: { customerId: string } | undefined) => {
    if (!compensationData?.customerId) return
    try {
    } catch (error) {
    }
  }
)

const inspectItemStep = createStep(
  "inspect-trade-in-item-step",
  async (input: { submission: any; condition: string }) => {
    const conditionGrades: Record<string, number> = { excellent: 0.9, good: 0.7, fair: 0.5, poor: 0.3 }
    const grade = conditionGrades[input.condition] || 0.5
    const inspection = {
      condition_grade: grade,
      cosmetic_score: grade * 100,
      functional_score: grade * 100,
      inspected_at: new Date(),
    }
    return new StepResponse({ inspection })
  }
)

const priceItemStep = createStep(
  "price-trade-in-item-step",
  async (input: { brand: string; model: string; inspection: any }) => {
    const basePrice = 100
    const offerPrice = Math.round(basePrice * input.inspection.condition_grade)
    return new StepResponse({ offerPrice, basePrice })
  }
)

const generateOfferStep = createStep(
  "generate-trade-in-offer-step",
  async (input: { customerId: string; offerPrice: number; brand: string; model: string }) => {
    const offer = {
      customer_id: input.customerId,
      item: `${input.brand} ${input.model}`,
      offer_amount: input.offerPrice,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "pending_acceptance",
    }
    return new StepResponse({ offer }, { customerId: input.customerId, offer })
  },
  async (compensationData: { customerId: string; offer: any } | undefined) => {
    if (!compensationData?.customerId) return
    try {
      compensationData.offer.status = "cancelled"
    } catch (error) {
    }
  }
)

export const tradeInEvaluationWorkflow = createWorkflow(
  "trade-in-evaluation-workflow",
  (input: TradeInEvaluationInput) => {
    const { submission } = submitTradeInStep(input)
    const { inspection } = inspectItemStep({ submission, condition: input.condition })
    const { offerPrice } = priceItemStep({ brand: input.brand, model: input.model, inspection })
    const { offer } = generateOfferStep({ customerId: input.customerId, offerPrice, brand: input.brand, model: input.model })
    return new WorkflowResponse({ submission, inspection, offer })
  }
)
