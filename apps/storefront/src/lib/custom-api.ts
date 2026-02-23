// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

const API_KEY = getMedusaPublishableKey()

function getHeaders(): Record<string, string> {
  return {
    "x-publishable-api-key": API_KEY,
    "Content-Type": "application/json",
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const baseUrl = getServerBaseUrl()
  const url = new URL(path, baseUrl || (typeof window !== "undefined" ? window.location.origin : ""))
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function apiGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = buildUrl(path, params)
  const resp = await fetchWithTimeout(url, { headers: getHeaders() })
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${resp.statusText}`)
  }
  return resp.json()
}

async function apiPost<T = any>(path: string, data?: any): Promise<T> {
  const url = buildUrl(path)
  const resp = await fetchWithTimeout(url, {
    method: "POST",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${resp.statusText}`)
  }
  return resp.json()
}

async function apiPut<T = any>(path: string, data?: any): Promise<T> {
  const url = buildUrl(path)
  const resp = await fetchWithTimeout(url, {
    method: "PUT",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${resp.statusText}`)
  }
  return resp.json()
}

async function apiDelete<T = any>(path: string): Promise<T> {
  const url = buildUrl(path)
  const resp = await fetchWithTimeout(url, {
    method: "DELETE",
    headers: getHeaders(),
  })
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${resp.statusText}`)
  }
  return resp.json()
}

// ===== Bookings =====

export async function listBookingServices(params?: { limit?: number; offset?: number }) {
  return apiGet("/store/bookings/services", params)
}

export async function getBookingService(serviceId: string) {
  return apiGet(`/store/bookings/services/${serviceId}`)
}

export async function getBookingServiceProviders(serviceId: string) {
  return apiGet(`/store/bookings/services/${serviceId}/providers`)
}

export async function checkBookingAvailability(params: { service_id: string; provider_id?: string; date: string }) {
  return apiGet("/store/bookings/availability", params)
}

export async function listBookings(params?: { status?: string; limit?: number; offset?: number }) {
  return apiGet("/store/bookings", params)
}

export async function getBooking(id: string) {
  return apiGet(`/store/bookings/${id}`)
}

export async function createBooking(data: {
  service_product_id: string
  start_time: string
  end_time: string
  notes?: string
}) {
  return apiPost("/store/bookings", data)
}

export async function cancelBooking(id: string) {
  return apiPost(`/store/bookings/${id}/cancel`)
}

export async function rescheduleBooking(id: string, data: { start_time: string; end_time: string }) {
  return apiPost(`/store/bookings/${id}/reschedule`, data)
}

export async function confirmBooking(id: string) {
  return apiPost(`/store/bookings/${id}/confirm`)
}

export async function checkInBooking(id: string) {
  return apiPost(`/store/bookings/${id}/check-in`)
}

// ===== Subscriptions =====

export async function listSubscriptions(params?: Record<string, any>) {
  return apiGet("/store/subscriptions", params)
}

export async function getSubscription(id: string) {
  return apiGet(`/store/subscriptions/${id}`)
}

export async function getMySubscriptions() {
  return apiGet("/store/subscriptions/me")
}

export async function createSubscriptionCheckout(data: { plan_id: string }) {
  return apiPost("/store/subscriptions/checkout", data)
}

export async function cancelSubscription(id: string) {
  return apiPost(`/store/subscriptions/${id}/cancel`)
}

export async function pauseSubscription(id: string) {
  return apiPost(`/store/subscriptions/${id}/pause`)
}

export async function resumeSubscription(id: string) {
  return apiPost(`/store/subscriptions/${id}/resume`)
}

export async function changeSubscriptionPlan(id: string, data: { plan_id: string }) {
  return apiPost(`/store/subscriptions/${id}/change-plan`, data)
}

export async function getSubscriptionBillingHistory(id: string) {
  return apiGet(`/store/subscriptions/${id}/billing-history`)
}

export async function updateSubscriptionPaymentMethod(id: string, data: { payment_method_id: string }) {
  return apiPost(`/store/subscriptions/${id}/payment-method`, data)
}

// ===== Auctions =====

export async function listAuctions(params?: { status?: string; category?: string; limit?: number; offset?: number }) {
  return apiGet("/store/auctions", params)
}

export async function getAuction(id: string) {
  return apiGet(`/store/auctions/${id}`)
}

export async function placeBid(auctionId: string, data: { amount: number }) {
  return apiPost(`/store/auctions/${auctionId}`, data)
}

// ===== Wallet =====

export async function getWalletBalance() {
  return apiGet("/store/wallet")
}

export async function topUpWallet(data: { amount: number; payment_method: string }) {
  return apiPost("/store/wallet", data)
}

export async function getWalletTransactions(params?: { limit?: number; offset?: number }) {
  return apiGet("/store/wallet", params)
}

// ===== Rentals =====

export async function listRentals(params?: Record<string, any>) {
  return apiGet("/store/rentals", params)
}

export async function getRental(id: string) {
  return apiGet(`/store/rentals/${id}`)
}

export async function createRentalOrder(data: { rental_product_id: string; start_date: string; end_date: string }) {
  return apiPost("/store/rentals", data)
}

// ===== Digital Products =====

export async function listDigitalProducts(params?: Record<string, any>) {
  return apiGet("/store/digital-products", params)
}

export async function getDigitalProduct(id: string) {
  return apiGet(`/store/digital-products/${id}`)
}

export async function purchaseDigitalProduct(id: string) {
  return apiPost(`/store/digital-products/${id}`)
}

// ===== Event Ticketing =====

export async function listEvents(params?: Record<string, any>) {
  return apiGet("/store/event-ticketing", params)
}

export async function getEvent(id: string) {
  return apiGet(`/store/event-ticketing/${id}`)
}

export async function purchaseTickets(eventId: string, data: { ticket_type_id: string; quantity: number }) {
  return apiPost(`/store/event-ticketing/${eventId}`, data)
}

// ===== Freelance =====

export async function listGigs(params?: Record<string, any>) {
  return apiGet("/store/freelance", params)
}

export async function getGig(id: string) {
  return apiGet(`/store/freelance/${id}`)
}

export async function submitProposal(gigId: string, data: { cover_letter: string; bid_amount: number }) {
  return apiPost(`/store/freelance/${gigId}`, data)
}

// ===== Reviews =====

export async function listReviews(params?: { product_id?: string; vendor_id?: string; limit?: number; offset?: number }) {
  return apiGet("/store/reviews", params)
}

export async function getReview(id: string) {
  return apiGet(`/store/reviews/${id}`)
}

export async function listProductReviews(productId: string) {
  return apiGet(`/store/reviews/products/${productId}`)
}

export async function listVendorReviews(vendorId: string) {
  return apiGet(`/store/reviews/vendors/${vendorId}`)
}

export async function createReview(data: { product_id: string; rating: number; title?: string; content?: string }) {
  return apiPost("/store/reviews", data)
}

export async function markReviewHelpful(id: string) {
  return apiPost(`/store/reviews/${id}/helpful`)
}

// ===== Classifieds =====

export async function listClassifieds(params?: Record<string, any>) {
  return apiGet("/store/classifieds", params)
}

export async function getClassified(id: string) {
  return apiGet(`/store/classifieds/${id}`)
}

export async function createClassifiedListing(data: { title: string; description: string; price: number; category_id: string }) {
  return apiPost("/store/classifieds", data)
}

// ===== Insurance =====

export async function listInsuranceProducts(params?: Record<string, any>) {
  return apiGet("/store/insurance", params)
}

export async function getInsuranceProduct(id: string) {
  return apiGet(`/store/insurance/${id}`)
}

export async function getInsuranceQuote(data: { coverage_type: string; coverage_amount: number }) {
  return apiPost("/store/insurance", data)
}

// ===== Loyalty =====

export async function getLoyaltyInfo(params?: Record<string, any>) {
  return apiGet("/store/loyalty", params)
}

export async function getLoyaltyAccount(id: string) {
  return apiGet(`/store/loyalty/${id}`)
}

export async function redeemPoints(data: { points: number; reward_id: string }) {
  return apiPost("/store/loyalty", data)
}

// ===== Charity =====

export async function listCharities(params?: Record<string, any>) {
  return apiGet("/store/charity", params)
}

export async function getCharity(id: string) {
  return apiGet(`/store/charity/${id}`)
}

// ===== Crowdfunding =====

export async function listCrowdfunding(params?: Record<string, any>) {
  return apiGet("/store/crowdfunding", params)
}

export async function getCrowdfundingProject(id: string) {
  return apiGet(`/store/crowdfunding/${id}`)
}

// ===== Education =====

export async function listCourses(params?: Record<string, any>) {
  return apiGet("/store/education", params)
}

export async function getCourse(id: string) {
  return apiGet(`/store/education/${id}`)
}

// ===== Healthcare =====

export async function listHealthcareServices(params?: Record<string, any>) {
  return apiGet("/store/healthcare", params)
}

export async function getHealthcareService(id: string) {
  return apiGet(`/store/healthcare/${id}`)
}

// ===== Travel =====

export async function listTravelListings(params?: Record<string, any>) {
  return apiGet("/store/travel", params)
}

export async function getTravelListing(id: string) {
  return apiGet(`/store/travel/${id}`)
}

// ===== Real Estate =====

export async function listRealEstate(params?: Record<string, any>) {
  return apiGet("/store/real-estate", params)
}

export async function getRealEstateProperty(id: string) {
  return apiGet(`/store/real-estate/${id}`)
}

// ===== Government =====

export async function listGovernmentServices(params?: Record<string, any>) {
  return apiGet("/store/government", params)
}

export async function getGovernmentService(id: string) {
  return apiGet(`/store/government/${id}`)
}

// ===== Grocery =====

export async function listGroceryProducts(params?: Record<string, any>) {
  return apiGet("/store/grocery", params)
}

export async function getGroceryProduct(id: string) {
  return apiGet(`/store/grocery/${id}`)
}

// ===== Fitness =====

export async function listFitnessServices(params?: Record<string, any>) {
  return apiGet("/store/fitness", params)
}

export async function getFitnessService(id: string) {
  return apiGet(`/store/fitness/${id}`)
}

// ===== Automotive =====

export async function listAutomotiveListings(params?: Record<string, any>) {
  return apiGet("/store/automotive", params)
}

export async function getAutomotiveListing(id: string) {
  return apiGet(`/store/automotive/${id}`)
}

// ===== Pet Services =====

export async function listPetServices(params?: Record<string, any>) {
  return apiGet("/store/pet-services", params)
}

export async function getPetService(id: string) {
  return apiGet(`/store/pet-services/${id}`)
}

// ===== Parking =====

export async function listParkingSpots(params?: Record<string, any>) {
  return apiGet("/store/parking", params)
}

export async function getParkingSpot(id: string) {
  return apiGet(`/store/parking/${id}`)
}

// ===== Legal =====

export async function listLegalServices(params?: Record<string, any>) {
  return apiGet("/store/legal", params)
}

export async function getLegalService(id: string) {
  return apiGet(`/store/legal/${id}`)
}

// ===== Memberships =====

export async function listMemberships(params?: Record<string, any>) {
  return apiGet("/store/memberships", params)
}

export async function getMembership(id: string) {
  return apiGet(`/store/memberships/${id}`)
}

// ===== Warranties =====

export async function listWarranties(params?: Record<string, any>) {
  return apiGet("/store/warranties", params)
}

export async function getWarranty(id: string) {
  return apiGet(`/store/warranties/${id}`)
}

// ===== Vendors =====

export async function listVendors(params?: Record<string, any>) {
  return apiGet("/store/vendors", params)
}

export async function getFeaturedVendors() {
  return apiGet("/store/vendors/featured")
}

export async function getVendorByHandle(handle: string) {
  return apiGet(`/store/vendors/${handle}`)
}

export async function getVendorProducts(handle: string) {
  return apiGet(`/store/vendors/${handle}/products`)
}

export async function getVendorReviews(handle: string) {
  return apiGet(`/store/vendors/${handle}/reviews`)
}

// ===== Wishlists =====

export async function listWishlists() {
  return apiGet("/store/wishlists")
}

export async function getWishlist(id: string) {
  return apiGet(`/store/wishlists/${id}`)
}

// ===== Social Commerce =====

export async function listSocialCommerce(params?: Record<string, any>) {
  return apiGet("/store/social-commerce", params)
}

export async function getSocialCommerceItem(id: string) {
  return apiGet(`/store/social-commerce/${id}`)
}

// ===== Bundles =====

export async function listBundles(params?: Record<string, any>) {
  return apiGet("/store/bundles", params)
}

export async function getBundle(id: string) {
  return apiGet(`/store/bundles/${id}`)
}

// ===== Flash Sales =====

export async function listFlashSales(params?: Record<string, any>) {
  return apiGet("/store/flash-sales", params)
}

export async function getFlashSale(id: string) {
  return apiGet(`/store/flash-sales/${id}`)
}

// ===== Gift Cards =====

export async function listGiftCards(params?: Record<string, any>) {
  return apiGet("/store/gift-cards", params)
}

export async function getGiftCard(id: string) {
  return apiGet(`/store/gift-cards/${id}`)
}

// ===== Volume Pricing =====

export async function getVolumePricing(productId: string) {
  return apiGet(`/store/products/${productId}/volume-pricing`)
}

// ===== Volume Deals =====

export async function listVolumeDeals(params?: Record<string, any>) {
  return apiGet("/store/volume-deals", params)
}

export async function getVolumeDeal(id: string) {
  return apiGet(`/store/volume-deals/${id}`)
}

// ===== Disputes =====

export async function listDisputes(params?: Record<string, any>) {
  return apiGet("/store/disputes", params)
}

// ===== Invoices =====

export async function listInvoices(params?: Record<string, any>) {
  return apiGet("/store/invoices", params)
}

export async function getInvoice(id: string) {
  return apiGet(`/store/invoices/${id}`)
}

export async function requestEarlyPayment(id: string) {
  return apiPost(`/store/invoices/${id}/early-payment`)
}

// ===== Trade-Ins =====

export async function listTradeIns(params?: Record<string, any>) {
  return apiGet("/store/trade-ins", params)
}

export async function getTradeIn(id: string) {
  return apiGet(`/store/trade-ins/${id}`)
}

// ===== Try Before You Buy =====

export async function listTryBeforeYouBuy(params?: Record<string, any>) {
  return apiGet("/store/try-before-you-buy", params)
}

export async function getTryBeforeYouBuy(id: string) {
  return apiGet(`/store/try-before-you-buy/${id}`)
}

// ===== Consignments =====

export async function listConsignments(params?: Record<string, any>) {
  return apiGet("/store/consignments", params)
}

export async function getConsignment(id: string) {
  return apiGet(`/store/consignments/${id}`)
}

// ===== Dropshipping =====

export async function listDropshipping(params?: Record<string, any>) {
  return apiGet("/store/dropshipping", params)
}

export async function getDropshippingProduct(id: string) {
  return apiGet(`/store/dropshipping/${id}`)
}

// ===== Print on Demand =====

export async function listPrintOnDemand(params?: Record<string, any>) {
  return apiGet("/store/print-on-demand", params)
}

export async function getPrintOnDemandProduct(id: string) {
  return apiGet(`/store/print-on-demand/${id}`)
}

// ===== CityOS =====

export async function getCityOSGovernance() {
  return apiGet("/store/cityos/governance")
}

export async function getCityOSNodes() {
  return apiGet("/store/cityos/nodes")
}

export async function getCityOSPersona() {
  return apiGet("/store/cityos/persona")
}

export async function getCityOSTenant() {
  return apiGet("/store/cityos/tenant")
}

// ===== Channels =====

export async function listChannels() {
  return apiGet("/store/channels")
}

// ===== B2B =====

export async function listB2BProducts(params?: Record<string, any>) {
  return apiGet("/store/b2b", params)
}

export async function getB2BProduct(id: string) {
  return apiGet(`/store/b2b/${id}`)
}

// ===== Companies =====

export async function getMyCompany() {
  return apiGet("/store/companies/me")
}

export async function getMyCompanyCredit() {
  return apiGet("/store/companies/me/credit")
}

export async function getMyCompanyOrders() {
  return apiGet("/store/companies/me/orders")
}

export async function getMyCompanyTeam() {
  return apiGet("/store/companies/me/team")
}

// ===== Quotes =====

export async function listQuotes(params?: Record<string, any>) {
  return apiGet("/store/quotes", params)
}

export async function getQuote(id: string) {
  return apiGet(`/store/quotes/${id}`)
}

export async function acceptQuote(id: string) {
  return apiPost(`/store/quotes/${id}/accept`)
}

export async function declineQuote(id: string) {
  return apiPost(`/store/quotes/${id}/decline`)
}

// ===== Purchase Orders =====

export async function listPurchaseOrders(params?: Record<string, any>) {
  return apiGet("/store/purchase-orders", params)
}

export async function getPurchaseOrder(id: string) {
  return apiGet(`/store/purchase-orders/${id}`)
}

export async function submitPurchaseOrder(id: string) {
  return apiPost(`/store/purchase-orders/${id}/submit`)
}

// ===== Newsletter =====

export async function subscribeNewsletter(data: { email: string }) {
  return apiPost("/store/newsletter", data)
}

// ===== Notification Preferences =====

export async function getNotificationPreferences() {
  return apiGet("/store/notification-preferences")
}

export async function updateNotificationPreferences(id: string, data: Record<string, any>) {
  return apiPut(`/store/notification-preferences/${id}`, data)
}

// ===== Financial Products =====

export async function listFinancialProducts(params?: Record<string, any>) {
  return apiGet("/store/financial-products", params)
}

export async function getFinancialProduct(id: string) {
  return apiGet(`/store/financial-products/${id}`)
}

// ===== Restaurants =====

export async function listRestaurants(params?: Record<string, any>) {
  return apiGet("/store/restaurants", params)
}

export async function getRestaurant(id: string) {
  return apiGet(`/store/restaurants/${id}`)
}

// ===== Advertising =====

export async function listAds(params?: Record<string, any>) {
  return apiGet("/store/advertising", params)
}

export async function getAd(id: string) {
  return apiGet(`/store/advertising/${id}`)
}

// ===== Affiliates =====

export async function getAffiliateInfo(params?: Record<string, any>) {
  return apiGet("/store/affiliates", params)
}

export async function getAffiliateDetails(id: string) {
  return apiGet(`/store/affiliates/${id}`)
}

// ===== White Label =====

export async function listWhiteLabelProducts(params?: Record<string, any>) {
  return apiGet("/store/white-label", params)
}

export async function getWhiteLabelProduct(id: string) {
  return apiGet(`/store/white-label/${id}`)
}

// ===== Utilities =====

export async function listUtilities(params?: Record<string, any>) {
  return apiGet("/store/utilities", params)
}

export async function getUtility(id: string) {
  return apiGet(`/store/utilities/${id}`)
}

// ===== Credit =====

export async function listCredits(params?: Record<string, any>) {
  return apiGet("/store/credit", params)
}

export async function getCredit(id: string) {
  return apiGet(`/store/credit/${id}`)
}

// ===== Shipping =====

export async function getShippingOptions() {
  return apiGet("/store/shipping")
}

// ===== Features =====

export async function getStoreFeatures() {
  return apiGet("/store/features")
}

// ===== Analytics =====

export async function trackAnalyticsEvent(data: Record<string, any>) {
  return apiPost("/store/analytics", data)
}

// ===== Content / POIs =====

export async function listPOIs(params?: Record<string, any>) {
  return apiGet("/store/content/pois", params)
}

export async function getPOI(id: string) {
  return apiGet(`/store/content/pois/${id}`)
}
