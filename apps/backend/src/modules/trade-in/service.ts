import { MedusaService } from "@medusajs/framework/utils"
import { TradeInRequest, TradeInOffer } from "./models"

type TradeInRequestRecord = {
  id: string
  customer_id: string
  product_id: string
  condition: string
  condition_rating: number | null
  description: string
  photos: Record<string, unknown>
  status: string
  trade_in_number: string
  estimated_value: number | string | null
  market_value: number | string | null
  final_value: number | string | null
  credit_amount: number | string | null
  evaluation_notes: string | null
  rejection_reason: string | null
  submitted_at: Date | null
  evaluated_at: Date | null
  approved_at: Date | null
  rejected_at: Date | null
  completed_at: Date | null
  metadata: Record<string, unknown> | null
}

type TradeInOfferRecord = {
  id: string
  request_id: string
  offer_amount: number | string
  credit_type: string
  expires_at: Date | null
  status: string
  rejection_reason: string | null
  accepted_at: Date | null
  rejected_at: Date | null
  metadata: Record<string, unknown> | null
}

interface TradeInServiceBase {
  createTradeInRequests(data: Record<string, unknown>): Promise<TradeInRequestRecord>
  updateTradeInRequests(data: { id: string } & Record<string, unknown>): Promise<TradeInRequestRecord>
  retrieveTradeInRequest(id: string): Promise<TradeInRequestRecord>
  listTradeInRequests(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<TradeInRequestRecord[]>
  createTradeInOffers(data: Record<string, unknown>): Promise<TradeInOfferRecord>
  updateTradeInOffers(data: { id: string } & Record<string, unknown>): Promise<TradeInOfferRecord>
  retrieveTradeInOffer(id: string): Promise<TradeInOfferRecord>
  listTradeInOffers(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<TradeInOfferRecord[]>
}

const DEPRECIATION_RATES: Record<string, number> = {
  excellent: 0.15,
  good: 0.30,
  fair: 0.50,
  poor: 0.70,
}

class TradeInService extends MedusaService({
  TradeInRequest,
  TradeInOffer,
}) {
  private get svc(): TradeInServiceBase {
    return this as unknown as TradeInServiceBase
  }

  private generateReferenceNumber(): string {
    return `TI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  }

  private getDepreciationFromRating(rating: number): number {
    if (rating >= 9) return 0.10
    if (rating >= 7) return 0.25
    if (rating >= 5) return 0.40
    if (rating >= 3) return 0.60
    return 0.80
  }

  async createTradeInRequest(data: {
    customer_id: string
    product_id: string
    condition: string
    description: string
    photos?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }): Promise<TradeInRequestRecord> {
    if (!data.customer_id) {
      throw new Error("Customer ID is required")
    }
    if (!data.product_id) {
      throw new Error("Product ID is required")
    }
    if (!data.description || !data.description.trim()) {
      throw new Error("Item description is required")
    }
    const validConditions = ["excellent", "good", "fair", "poor"]
    if (!validConditions.includes(data.condition)) {
      throw new Error(`Condition must be one of: ${validConditions.join(", ")}`)
    }

    return this.svc.createTradeInRequests({
      customer_id: data.customer_id,
      product_id: data.product_id,
      condition: data.condition,
      description: data.description.trim(),
      photos: data.photos ?? {},
      status: "pending_evaluation",
      trade_in_number: this.generateReferenceNumber(),
      submitted_at: new Date(),
      metadata: data.metadata ?? null,
    })
  }

  async evaluateItem(
    requestId: string,
    evaluationData: {
      condition_rating: number
      market_value: number
      evaluation_notes?: string
    },
  ): Promise<TradeInRequestRecord & { calculated_offer: number }> {
    if (
      evaluationData.condition_rating < 1 ||
      evaluationData.condition_rating > 10
    ) {
      throw new Error("Condition rating must be between 1 and 10")
    }
    if (evaluationData.market_value <= 0) {
      throw new Error("Market value must be greater than zero")
    }

    const request = await this.svc.retrieveTradeInRequest(requestId)

    if (
      request.status !== "pending_evaluation" &&
      request.status !== "submitted"
    ) {
      throw new Error("Request is not in a state that can be evaluated")
    }

    const depreciationRate = this.getDepreciationFromRating(
      evaluationData.condition_rating,
    )
    const calculatedOffer = Math.round(
      evaluationData.market_value * (1 - depreciationRate) * 100,
    ) / 100

    const updated = await this.svc.updateTradeInRequests({
      id: requestId,
      status: "evaluated",
      condition_rating: evaluationData.condition_rating,
      market_value: evaluationData.market_value,
      estimated_value: calculatedOffer,
      evaluation_notes: evaluationData.evaluation_notes ?? null,
      evaluated_at: new Date(),
    })

    return { ...updated, calculated_offer: calculatedOffer }
  }

  async createOffer(
    requestId: string,
    offerData: {
      offer_amount: number
      credit_type?: string
      expiry_days?: number
      metadata?: Record<string, unknown>
    },
  ): Promise<TradeInOfferRecord> {
    if (offerData.offer_amount <= 0) {
      throw new Error("Offer amount must be greater than zero")
    }

    const request = await this.svc.retrieveTradeInRequest(requestId)

    if (request.status !== "evaluated") {
      throw new Error("Request must be evaluated before creating an offer")
    }

    const expiryDays = offerData.expiry_days ?? 14
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    const validCreditTypes = ["store_credit", "wallet", "refund"]
    const creditType = offerData.credit_type ?? "store_credit"
    if (!validCreditTypes.includes(creditType)) {
      throw new Error(
        `Credit type must be one of: ${validCreditTypes.join(", ")}`,
      )
    }

    await this.svc.updateTradeInRequests({
      id: requestId,
      status: "offer_pending",
    })

    return this.svc.createTradeInOffers({
      request_id: requestId,
      offer_amount: offerData.offer_amount,
      credit_type: creditType,
      expires_at: expiresAt,
      status: "pending",
      metadata: offerData.metadata ?? null,
    })
  }

  async acceptOffer(offerId: string): Promise<{
    offer: TradeInOfferRecord
    request: TradeInRequestRecord
  }> {
    const offer = await this.svc.retrieveTradeInOffer(offerId)

    if (offer.status !== "pending") {
      throw new Error("Offer is not in a pending state")
    }

    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      await this.svc.updateTradeInOffers({
        id: offerId,
        status: "expired",
      })
      throw new Error("Offer has expired")
    }

    const updatedOffer = await this.svc.updateTradeInOffers({
      id: offerId,
      status: "accepted",
      accepted_at: new Date(),
    })

    const updatedRequest = await this.svc.updateTradeInRequests({
      id: offer.request_id,
      status: "approved",
      final_value: offer.offer_amount,
      credit_amount: offer.offer_amount,
      approved_at: new Date(),
    })

    return { offer: updatedOffer, request: updatedRequest }
  }

  async rejectOffer(
    offerId: string,
    reason?: string,
  ): Promise<{
    offer: TradeInOfferRecord
    request: TradeInRequestRecord
  }> {
    const offer = await this.svc.retrieveTradeInOffer(offerId)

    if (offer.status !== "pending") {
      throw new Error("Offer is not in a pending state")
    }

    const updatedOffer = await this.svc.updateTradeInOffers({
      id: offerId,
      status: "rejected",
      rejection_reason: reason ?? null,
      rejected_at: new Date(),
    })

    const updatedRequest = await this.svc.updateTradeInRequests({
      id: offer.request_id,
      status: "rejected",
      rejection_reason: reason ?? null,
      rejected_at: new Date(),
    })

    return { offer: updatedOffer, request: updatedRequest }
  }

  async getRequestsByCustomer(
    customerId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ requests: TradeInRequestRecord[]; count: number }> {
    if (!customerId) {
      throw new Error("Customer ID is required")
    }

    const limit = options?.limit ?? 20
    const offset = options?.offset ?? 0

    const requests = await this.svc.listTradeInRequests(
      { customer_id: customerId },
      { take: limit, skip: offset },
    )

    return {
      requests,
      count: requests.length,
    }
  }

  async getRequestsByStatus(
    status: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ requests: TradeInRequestRecord[]; count: number }> {
    const validStatuses = [
      "pending_evaluation",
      "submitted",
      "evaluated",
      "offer_pending",
      "approved",
      "rejected",
      "completed",
    ]
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`)
    }

    const limit = options?.limit ?? 20
    const offset = options?.offset ?? 0

    const requests = await this.svc.listTradeInRequests(
      { status },
      { take: limit, skip: offset },
    )

    return {
      requests,
      count: requests.length,
    }
  }
}

export default TradeInService
