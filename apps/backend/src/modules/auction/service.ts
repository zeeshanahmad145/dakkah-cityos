import { MedusaService } from "@medusajs/framework/utils"
import AuctionListing from "./models/auction-listing"
import Bid from "./models/bid"
import AutoBidRule from "./models/auto-bid-rule"
import AuctionResult from "./models/auction-result"
import AuctionEscrow from "./models/auction-escrow"

class AuctionModuleService extends MedusaService({
  AuctionListing,
  Bid,
  AutoBidRule,
  AuctionResult,
  AuctionEscrow,
}) {
  /** Place a bid on an auction, validating amount exceeds current highest */
  async placeBid(auctionId: string, bidderId: string, amount: number): Promise<any> {
    if (amount <= 0) {
      throw new Error("Bid amount must be greater than zero")
    }

    const auction = await this.retrieveAuctionListing(auctionId)

    if (auction.status !== "active") {
      throw new Error("Auction is not active")
    }

    if (new Date(auction.ends_at) < new Date()) {
      throw new Error("Auction has ended")
    }

    const highestBid = await this.getHighestBid(auctionId)
    const minimumBid = highestBid
      ? Number(highestBid.amount) + Number(auction.bid_increment || 1)
      : Number(auction.starting_price || 0)

    if (amount < minimumBid) {
      throw new Error(`Bid must be at least ${minimumBid}`)
    }

    const bid = await (this as any).createBids({
      tenant_id: "default",
      auction_id: auctionId,
      customer_id: bidderId,
      amount,
      status: "active",
      placed_at: new Date(),
    })

    await (this as any).updateAuctionListings({
      id: auctionId,
      current_price: amount,
    })

    return bid
  }

  /** Close an auction and determine the winner */
  async closeAuction(auctionId: string): Promise<any> {
    const auction = await this.retrieveAuctionListing(auctionId)

    if (auction.status !== "active") {
      throw new Error("Auction is not active")
    }

    const highestBid = await this.getHighestBid(auctionId)

    const hasMetReserve = highestBid
      ? Number(highestBid.amount) >= Number(auction.reserve_price || 0)
      : false

    await (this as any).updateAuctionListings({
      id: auctionId,
      status: hasMetReserve && highestBid ? "sold" : "ended",
    })

    if (hasMetReserve && highestBid) {
      const result = await (this as any).createAuctionResults({
        auction_id: auctionId,
        winning_bid_id: highestBid.id,
        winner_id: highestBid.bidder_id,
        final_price: highestBid.amount,
        status: "pending_payment",
      })
      return result
    }

    return { auctionId, status: "ended", winner: null }
  }

  /** Get the highest bid for an auction */
  async getHighestBid(auctionId: string): Promise<any | null> {
    const bids = await this.listBids({ auction_id: auctionId, status: "active" }) as any
    const bidList = Array.isArray(bids) ? bids : [bids].filter(Boolean)

    if (bidList.length === 0) return null

    return bidList.reduce((max: any, bid: any) =>
      Number(bid.amount) > Number(max.amount) ? bid : max
    , bidList[0])
  }

  async getAuctionWithBids(auctionId: string): Promise<any> {
    const auction = await this.retrieveAuctionListing(auctionId) as any
    const bids = await this.listBids({ auction_id: auctionId }) as any
    const bidList = Array.isArray(bids) ? bids : [bids].filter(Boolean)

    const sortedBids = bidList.sort((a: any, b: any) => Number(b.amount) - Number(a.amount))

    return {
      ...auction,
      bids: sortedBids,
      totalBids: sortedBids.length,
      highestBid: sortedBids.length > 0 ? Number(sortedBids[0].amount) : null,
      lowestBid: sortedBids.length > 0 ? Number(sortedBids[sortedBids.length - 1].amount) : null,
    }
  }

  async checkAntiSniping(auctionId: string, bidTime: Date): Promise<{ extended: boolean; newEndTime?: Date }> {
    const auction = await this.retrieveAuctionListing(auctionId) as any
    const endTime = new Date(auction.ends_at)
    const bidDate = new Date(bidTime)

    const fiveMinutes = 5 * 60 * 1000
    const timeRemaining = endTime.getTime() - bidDate.getTime()

    if (timeRemaining > 0 && timeRemaining <= fiveMinutes) {
      const newEndTime = new Date(endTime.getTime() + fiveMinutes)
      await (this as any).updateAuctionListings({
        id: auctionId,
        ends_at: newEndTime,
      })
      return { extended: true, newEndTime }
    }

    return { extended: false }
  }

  async validateBidIncrement(auctionId: string, bidAmount: number): Promise<{ valid: boolean; minimumBid: number; currentPrice: number }> {
    const auction = await this.retrieveAuctionListing(auctionId) as any
    const currentPrice = Number(auction.current_price || auction.starting_price || 0)
    const minimumIncrement = currentPrice * 0.05
    const minimumBid = Math.round((currentPrice + minimumIncrement) * 100) / 100

    return {
      valid: bidAmount >= minimumBid,
      minimumBid,
      currentPrice,
    }
  }

  /** Check if an auction is currently active and accepting bids */
  async isAuctionActive(auctionId: string): Promise<boolean> {
    const auction = await this.retrieveAuctionListing(auctionId)
    if (auction.status !== "active") return false

    const now = new Date()
    const startDate = new Date(auction.starts_at)
    const endDate = new Date(auction.ends_at)

    return now >= startDate && now <= endDate
  }
}

export default AuctionModuleService
