import { MedusaService } from "@medusajs/framework/utils"
import PropertyListing from "./models/property-listing"
import ViewingAppointment from "./models/viewing-appointment"
import LeaseAgreement from "./models/lease-agreement"
import PropertyDocument from "./models/property-document"
import PropertyValuation from "./models/property-valuation"
import AgentProfile from "./models/agent-profile"

class RealEstateModuleService extends MedusaService({
  PropertyListing,
  ViewingAppointment,
  LeaseAgreement,
  PropertyDocument,
  PropertyValuation,
  AgentProfile,
}) {
  /** Publish a property listing */
  async publishProperty(propertyId: string): Promise<any> {
    const property = await this.retrievePropertyListing(propertyId) as any

    if (property.status === "published") {
      throw new Error("Property is already published")
    }

    if (!property.price && !property.rent_price) {
      throw new Error("Property must have a price before publishing")
    }

    return await (this as any).updatePropertyListings({
      id: propertyId,
      status: "published",
      published_at: new Date(),
    })
  }

  /** Schedule a viewing appointment for a property */
  async scheduleViewing(propertyId: string, viewerId: string, date: Date, notes?: string): Promise<any> {
    if (date < new Date()) {
      throw new Error("Viewing date must be in the future")
    }

    const property = await this.retrievePropertyListing(propertyId) as any
    if (property.status !== "published") {
      throw new Error("Property is not available for viewings")
    }

    const existing = await this.listViewingAppointments({
      property_listing_id: propertyId,
      viewer_id: viewerId,
      status: "scheduled",
    }) as any
    const list = Array.isArray(existing) ? existing : [existing].filter(Boolean)
    if (list.length > 0) {
      throw new Error("You already have a scheduled viewing for this property")
    }

    return await (this as any).createViewingAppointments({
      property_listing_id: propertyId,
      viewer_id: viewerId,
      scheduled_date: date,
      status: "scheduled",
      notes: notes || null,
    })
  }

  /** Make an offer on a property */
  async makeOffer(propertyId: string, buyerId: string, amount: number, conditions?: string): Promise<any> {
    if (amount <= 0) {
      throw new Error("Offer amount must be greater than zero")
    }

    const property = await this.retrievePropertyListing(propertyId) as any
    if (property.status !== "published") {
      throw new Error("Property is not accepting offers")
    }

    const valuation = await (this as any).createPropertyValuations({
      property_listing_id: propertyId,
      buyer_id: buyerId,
      offered_amount: amount,
      asking_price: Number(property.price || property.rent_price || 0),
      difference_percentage: property.price
        ? Math.round(((amount - Number(property.price)) / Number(property.price)) * 10000) / 100
        : 0,
      conditions: conditions || null,
      status: "pending",
      submitted_at: new Date(),
    })

    return valuation
  }

  /** Calculate monthly mortgage payment */
  async calculateMortgage(price: number, downPayment: number, termYears: number, annualRate?: number): Promise<{
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    loanAmount: number
  }> {
    if (price <= 0 || downPayment < 0 || termYears <= 0) {
      throw new Error("Invalid mortgage parameters")
    }

    if (downPayment >= price) {
      throw new Error("Down payment cannot exceed or equal the price")
    }

    const loanAmount = price - downPayment
    const rate = (annualRate || 6.5) / 100 / 12
    const payments = termYears * 12

    const monthlyPayment = rate > 0
      ? (loanAmount * rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1)
      : loanAmount / payments

    const totalPayment = monthlyPayment * payments
    const totalInterest = totalPayment - loanAmount

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      loanAmount,
    }
  }

  async searchProperties(filters: {
    lat?: number
    lng?: number
    radiusKm?: number
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    propertyType?: string
    status?: string
  }): Promise<any[]> {
    const queryFilters: Record<string, any> = { status: filters.status || "published" }
    if (filters.propertyType) queryFilters.property_type = filters.propertyType
    if (filters.bedrooms) queryFilters.bedrooms = filters.bedrooms

    const listings = await this.listPropertyListings(queryFilters) as any
    const list = Array.isArray(listings) ? listings : [listings].filter(Boolean)

    let filtered = list

    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter((p: any) => {
        const price = Number(p.price || p.rent_price || 0)
        if (filters.minPrice && price < filters.minPrice) return false
        if (filters.maxPrice && price > filters.maxPrice) return false
        return true
      })
    }

    if (filters.lat && filters.lng && filters.radiusKm) {
      filtered = filtered.filter((p: any) => {
        if (!p.latitude || !p.longitude) return false
        const lat1 = filters.lat! * Math.PI / 180
        const lat2 = Number(p.latitude) * Math.PI / 180
        const dLat = (Number(p.latitude) - filters.lat!) * Math.PI / 180
        const dLng = (Number(p.longitude) - filters.lng!) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = 6371 * c
        return distance <= filters.radiusKm!
      })
    }

    return filtered
  }

  async createInquiry(propertyId: string, buyerId: string, message: string): Promise<any> {
    if (!message || !message.trim()) {
      throw new Error("Inquiry message is required")
    }

    const property = await this.retrievePropertyListing(propertyId) as any
    if (property.status !== "published") {
      throw new Error("Property is not available for inquiries")
    }

    return await (this as any).createPropertyValuations({
      property_listing_id: propertyId,
      buyer_id: buyerId,
      inquiry_message: message.trim(),
      asking_price: Number(property.price || property.rent_price || 0),
      status: "inquiry",
      submitted_at: new Date(),
    })
  }

  async getMarketAnalysis(filters: { location?: string; propertyType?: string }): Promise<{
    totalListings: number
    averagePrice: number
    medianPrice: number
    priceRange: { min: number; max: number }
    averageDaysOnMarket: number
  }> {
    const queryFilters: Record<string, any> = { status: "published" }
    if (filters.location) queryFilters.location = filters.location
    if (filters.propertyType) queryFilters.property_type = filters.propertyType

    const listings = await this.listPropertyListings(queryFilters) as any
    const list = Array.isArray(listings) ? listings : [listings].filter(Boolean)

    if (list.length === 0) {
      return { totalListings: 0, averagePrice: 0, medianPrice: 0, priceRange: { min: 0, max: 0 }, averageDaysOnMarket: 0 }
    }

    const prices = list.map((l: any) => Number(l.price || l.rent_price || 0)).filter((p: number) => p > 0).sort((a: number, b: number) => a - b)
    const totalPrice = prices.reduce((sum: number, p: number) => sum + p, 0)
    const averagePrice = prices.length > 0 ? Math.round(totalPrice / prices.length) : 0
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0

    const now = new Date().getTime()
    const daysOnMarket = list
      .filter((l: any) => l.published_at)
      .map((l: any) => Math.floor((now - new Date(l.published_at).getTime()) / (1000 * 60 * 60 * 24)))
    const averageDaysOnMarket = daysOnMarket.length > 0 ? Math.round(daysOnMarket.reduce((s: number, d: number) => s + d, 0) / daysOnMarket.length) : 0

    return {
      totalListings: list.length,
      averagePrice,
      medianPrice,
      priceRange: { min: prices[0] || 0, max: prices[prices.length - 1] || 0 },
      averageDaysOnMarket,
    }
  }
}

export default RealEstateModuleService
