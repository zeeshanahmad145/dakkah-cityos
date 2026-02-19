import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type AuctionLifecycleInput = {
  productId: string
  vendorId: string
  startingPrice: number
  reservePrice?: number
  startTime: string
  endTime: string
  tenantId: string
}

const createAuctionStep = createStep(
  "create-auction-step",
  async (input: AuctionLifecycleInput, { container }) => {
    const auctionModule = container.resolve("auction") as any
    const auction = await auctionModule.createAuctions({
      product_id: input.productId,
      vendor_id: input.vendorId,
      starting_price: input.startingPrice,
      reserve_price: input.reservePrice,
      start_time: new Date(input.startTime),
      end_time: new Date(input.endTime),
      status: "draft",
    })
    return new StepResponse({ auction }, { auctionId: auction.id })
  },
  async (compensationData: { auctionId: string } | undefined, { container }) => {
    if (!compensationData?.auctionId) return
    try {
      const auctionModule = container.resolve("auction") as any
      await auctionModule.deleteAuctions(compensationData.auctionId)
    } catch (error) {
    }
  }
)

const openAuctionStep = createStep(
  "open-auction-step",
  async (input: { auctionId: string }, { container }) => {
    const auctionModule = container.resolve("auction") as any
    const opened = await auctionModule.updateAuctions({
      id: input.auctionId,
      status: "active",
      opened_at: new Date(),
    })
    return new StepResponse({ auction: opened }, { auctionId: input.auctionId, previousStatus: "draft" })
  },
  async (compensationData: { auctionId: string; previousStatus: string } | undefined, { container }) => {
    if (!compensationData?.auctionId) return
    try {
      const auctionModule = container.resolve("auction") as any
      await auctionModule.updateAuctions({
        id: compensationData.auctionId,
        status: compensationData.previousStatus,
      })
    } catch (error) {
    }
  }
)

const closeAuctionStep = createStep(
  "close-auction-step",
  async (input: { auctionId: string }, { container }) => {
    const auctionModule = container.resolve("auction") as any
    const closed = await auctionModule.updateAuctions({
      id: input.auctionId,
      status: "closed",
      closed_at: new Date(),
    })
    return new StepResponse({ auction: closed }, { auctionId: input.auctionId, previousStatus: "active" })
  },
  async (compensationData: { auctionId: string; previousStatus: string } | undefined, { container }) => {
    if (!compensationData?.auctionId) return
    try {
      const auctionModule = container.resolve("auction") as any
      await auctionModule.updateAuctions({
        id: compensationData.auctionId,
        status: compensationData.previousStatus,
      })
    } catch (error) {
    }
  }
)

export const auctionLifecycleWorkflow = createWorkflow(
  "auction-lifecycle-workflow",
  (input: AuctionLifecycleInput) => {
    const { auction } = createAuctionStep(input)
    const opened = openAuctionStep({ auctionId: auction.id })
    const closed = closeAuctionStep({ auctionId: auction.id })
    return new WorkflowResponse({ auction: closed.auction })
  }
)
