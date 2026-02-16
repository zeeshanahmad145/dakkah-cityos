// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
const { SeedContext, getImage, getThumb, sarPrice, randomSaudiCity, saudiPhone } = require("./seed-utils")

export default async function seedVerticals({ container }: ExecArgs, ctx: SeedContext): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const T = "dakkah"

  const log = (msg: string) => logger.info(msg)
  const logError = (section: string, err: any) => logger.warn(`  ❌ ${section} failed: ${err.message}`)

  const resolveService = (key: string) => {
    try { return container.resolve(key) as any }
    catch { return null }
  }

  const resolveAny = (...keys: string[]) => {
    for (const k of keys) {
      const s = resolveService(k)
      if (s) return s
    }
    return null
  }

  const tryCreate = async (svc: any, data: any[], methods: string[]) => {
    for (const method of methods) {
      if (typeof svc[method] === "function") {
        return await svc[method](data)
      }
    }
    const results = []
    for (const item of data) {
      for (const method of methods) {
        const singular = method.replace(/s$/, "")
        if (typeof svc[singular] === "function") {
          results.push(await svc[singular](item))
          break
        }
      }
    }
    return results
  }

  log("━━━ SEED VERTICALS (27 modules) ━━━")

  // ── 1. BOOKING ──
  try {
    const svc = resolveService("booking")
    if (!svc) { log("  ⚠ Booking service not found, skipping"); } else {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)
      const endDate = new Date(futureDate)
      endDate.setHours(endDate.getHours() + 2)
      const data = [
        { tenant_id: T, booking_number: "BK-SEED-001", customer_name: "Ahmed Al-Rashid", customer_email: "ahmed@dakkah.sa", service_product_id: "sp_seed_001", start_time: futureDate.toISOString(), end_time: endDate.toISOString(), timezone: "Asia/Riyadh", status: "confirmed", attendee_count: 1, location_type: "in_person", metadata: { seeded: true } },
        { tenant_id: T, booking_number: "BK-SEED-002", customer_name: "Fatima Al-Harbi", customer_email: "fatima@dakkah.sa", service_product_id: "sp_seed_002", start_time: futureDate.toISOString(), end_time: endDate.toISOString(), timezone: "Asia/Riyadh", status: "confirmed", attendee_count: 2, location_type: "customer_location", metadata: { seeded: true } },
        { tenant_id: T, booking_number: "BK-SEED-003", customer_name: "Mohammed Al-Qadi", customer_email: "mohammed@dakkah.sa", service_product_id: "sp_seed_003", start_time: futureDate.toISOString(), end_time: endDate.toISOString(), timezone: "Asia/Riyadh", status: "confirmed", attendee_count: 3, location_type: "in_person", metadata: { seeded: true } },
        { tenant_id: T, booking_number: "BK-SEED-004", customer_name: "Noor Al-Malik", customer_email: "noor@dakkah.sa", service_product_id: "sp_seed_004", start_time: futureDate.toISOString(), end_time: endDate.toISOString(), timezone: "Asia/Riyadh", status: "pending", attendee_count: 1, location_type: "virtual", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createBookings", "create"])
      log("  ✓ Booking: 4 bookings seeded")
    }
  } catch (err: any) { logError("Booking", err) }

  // ── 2. HEALTHCARE ──
  try {
    const svc = resolveService("healthcare")
    if (!svc) { log("  ⚠ Healthcare service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "King Faisal Specialist Hospital", type: "hospital", city: "Riyadh", specialties: ["cardiology", "oncology", "neurology"], rating: 4.8, is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Saudi German Hospital", type: "hospital", city: "Jeddah", specialties: ["orthopedics", "pediatrics", "dermatology"], rating: 4.5, is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Dr. Sulaiman Al Habib Medical Group", type: "clinic", city: "Riyadh", specialties: ["general", "dentistry", "ophthalmology"], rating: 4.7, is_active: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createHealthcareProviders", "createHealthcares", "create"])
      log("  ✓ Healthcare: 3 providers seeded")
    }
  } catch (err: any) { logError("Healthcare", err) }

  // ── 3. RESTAURANT ──
  try {
    const svc = resolveService("restaurant")
    if (!svc) { log("  ⚠ Restaurant service not found, skipping"); } else {
      const operatingHours = { mon: "09:00-23:00", tue: "09:00-23:00", wed: "09:00-23:00", thu: "09:00-23:00", fri: "12:00-23:30", sat: "12:00-23:30", sun: "09:00-23:00" }
      const data = [
        { tenant_id: T, name: "Al Baik", handle: "al-baik", cuisine_types: ["fast_food", "arabic"], city: "Jeddah", address_line1: "King Abdul Aziz Road", postal_code: "21589", country_code: "SA", operating_hours: operatingHours, is_accepting_orders: true, avg_prep_time_minutes: 15, total_reviews: 0, rating: 4.9, price_range: "$", is_active: true, logo_url: getThumb("restaurant", 0), banner_url: getImage("restaurant", 0), metadata: { seeded: true } },
        { tenant_id: T, name: "Nusret Steakhouse", handle: "nusret-steakhouse", cuisine_types: ["steakhouse", "meat"], city: "Riyadh", address_line1: "KAFD District", postal_code: "11537", country_code: "SA", operating_hours: operatingHours, is_accepting_orders: true, avg_prep_time_minutes: 30, total_reviews: 0, rating: 4.6, price_range: "$$$$", is_active: true, logo_url: getThumb("restaurant", 1), banner_url: getImage("restaurant", 1), metadata: { seeded: true } },
        { tenant_id: T, name: "The Globe", handle: "the-globe", cuisine_types: ["fine_dining", "international"], city: "Riyadh", address_line1: "Al Faisaliah Tower", postal_code: "11491", country_code: "SA", operating_hours: operatingHours, is_accepting_orders: true, avg_prep_time_minutes: 35, total_reviews: 0, rating: 4.7, price_range: "$$$", is_active: true, logo_url: getThumb("restaurant", 2), banner_url: getImage("restaurant", 2), metadata: { seeded: true } },
        { tenant_id: T, name: "Mama Noura", handle: "mama-noura", cuisine_types: ["shawarma", "arabic"], city: "Riyadh", address_line1: "Olaya Street", postal_code: "11413", country_code: "SA", operating_hours: operatingHours, is_accepting_orders: true, avg_prep_time_minutes: 10, total_reviews: 0, rating: 4.5, price_range: "$", is_active: true, logo_url: getThumb("restaurant", 3), banner_url: getImage("restaurant", 3), metadata: { seeded: true } },
      ]
      let count = 0
      for (const item of data) {
        try {
          await tryCreate(svc, [item], ["createRestaurants", "create"])
          count++
        } catch { /* skip duplicates */ }
      }
      log(`  ✓ Restaurant: ${count} restaurants seeded`)
    }
  } catch (err: any) { logError("Restaurant", err) }

  // ── 4. TRAVEL ──
  try {
    const svc = resolveService("travel")
    if (!svc) { log("  ⚠ Travel service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Umrah Premium Package", description: "5-star Umrah with hotel and transport", destination: "Mecca", duration_days: 7, price: sarPrice(8500), includes: ["flights", "hotel", "transport", "guided_tours"], thumbnail: getThumb("travel", 0), metadata: { seeded: true } },
        { tenant_id: T, name: "Riyadh City Tour", description: "Full day tour of Riyadh landmarks", destination: "Riyadh", duration_days: 1, price: sarPrice(450), includes: ["transport", "lunch", "guide"], thumbnail: getThumb("travel", 1), metadata: { seeded: true } },
        { tenant_id: T, name: "Red Sea Beach Resort", description: "Luxury beachfront resort getaway", destination: "NEOM", duration_days: 4, price: sarPrice(5200), includes: ["resort", "meals", "water_sports"], thumbnail: getThumb("travel", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createTravelPackages", "createTravels", "create"])
      log("  ✓ Travel: 3 packages seeded")
    }
  } catch (err: any) { logError("Travel", err) }

  // ── 5. EVENT TICKETING ──
  try {
    const svc = resolveAny("eventTicketing", "event_ticketing", "event-ticketing")
    if (!svc) { log("  ⚠ Event Ticketing service not found, skipping"); } else {
      const starts1 = new Date("2026-10-15T18:00:00Z")
      const ends1 = new Date("2026-10-15T23:00:00Z")
      const starts2 = new Date("2026-03-20T10:00:00Z")
      const ends2 = new Date("2026-03-22T17:00:00Z")
      const starts3 = new Date("2026-02-22T14:00:00Z")
      const ends3 = new Date("2026-02-22T20:00:00Z")
      const starts4 = new Date("2026-12-19T16:00:00Z")
      const ends4 = new Date("2026-12-20T06:00:00Z")
      const data = [
        { tenant_id: T, title: "Riyadh Season Festival", description: "Annual entertainment mega-event", venue: "Boulevard Riyadh City", city: "Riyadh", starts_at: starts1.toISOString(), ends_at: ends1.toISOString(), event_type: "festival", status: "published", timezone: "Asia/Riyadh", is_online: false, current_attendees: 0, capacity: 50000, thumbnail: getThumb("events", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Jeddah Art Week", description: "Contemporary art exhibition and workshops", venue: "Jeddah Corniche", city: "Jeddah", starts_at: starts2.toISOString(), ends_at: ends2.toISOString(), event_type: "workshop", status: "published", timezone: "Asia/Riyadh", is_online: false, current_attendees: 0, capacity: 5000, thumbnail: getThumb("events", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Saudi Cup Horse Race", description: "World's richest horse race event", venue: "King Abdulaziz Racecourse", city: "Riyadh", starts_at: starts3.toISOString(), ends_at: ends3.toISOString(), event_type: "sports", status: "published", timezone: "Asia/Riyadh", is_online: false, current_attendees: 0, capacity: 20000, thumbnail: getThumb("events", 2), metadata: { seeded: true } },
        { tenant_id: T, title: "MDL Beast Music Festival", description: "Mega electronic music festival", venue: "MDL Beast Venue", city: "Riyadh", starts_at: starts4.toISOString(), ends_at: ends4.toISOString(), event_type: "concert", status: "published", timezone: "Asia/Riyadh", is_online: false, current_attendees: 0, capacity: 100000, thumbnail: getThumb("events", 3), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createEventTicketings", "createEvents", "create"])
      log("  ✓ Event Ticketing: 4 events seeded")
    }
  } catch (err: any) { logError("Event Ticketing", err) }

  // ── 6. FREELANCE ──
  try {
    const svc = resolveService("freelance")
    if (!svc) { log("  ⚠ Freelance service not found, skipping"); } else {
      const data = [
        { tenant_id: T, title: "Web Development", description: "Full-stack web application development", category: "development", price_from: sarPrice(2000), delivery_days: 14, freelancer_name: "Ahmed Al-Rashid", metadata: { seeded: true } },
        { tenant_id: T, title: "Arabic Translation", description: "Professional Arabic-English translation", category: "translation", price_from: sarPrice(300), delivery_days: 3, freelancer_name: "Fatima Al-Harbi", metadata: { seeded: true } },
        { tenant_id: T, title: "Graphic Design", description: "Brand identity and marketing materials", category: "design", price_from: sarPrice(800), delivery_days: 7, freelancer_name: "Omar Badr", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createFreelanceGigs", "createFreelances", "create"])
      log("  ✓ Freelance: 3 gigs seeded")
    }
  } catch (err: any) { logError("Freelance", err) }

  // ── 7. GROCERY ──
  try {
    const svc = resolveService("grocery")
    if (!svc) { log("  ⚠ Grocery service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Panda Supermarket", type: "supermarket", city: "Riyadh", delivery_radius_km: 15, min_order: sarPrice(50), logo_url: getThumb("grocery", 0), metadata: { seeded: true } },
        { tenant_id: T, name: "Danube", type: "supermarket", city: "Jeddah", delivery_radius_km: 20, min_order: sarPrice(75), logo_url: getThumb("grocery", 1), metadata: { seeded: true } },
        { tenant_id: T, name: "Tamimi Markets", type: "supermarket", city: "Dammam", delivery_radius_km: 12, min_order: sarPrice(60), logo_url: getThumb("grocery", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createGroceryStores", "createGrocerys", "create"])
      log("  ✓ Grocery: 3 stores seeded")
    }
  } catch (err: any) { logError("Grocery", err) }

  // ── 8. AUTOMOTIVE ──
  try {
    const svc = resolveService("automotive")
    if (!svc) { log("  ⚠ Automotive service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Oil Change Service", type: "service", price: sarPrice(120), duration_minutes: 30, description: "Full synthetic oil change with filter", metadata: { seeded: true } },
        { tenant_id: T, name: "Tire Replacement", type: "service", price: sarPrice(800), duration_minutes: 45, description: "Set of 4 tires with balancing and alignment", metadata: { seeded: true } },
        { tenant_id: T, name: "Car Detailing Premium", type: "service", price: sarPrice(350), duration_minutes: 120, description: "Interior and exterior deep cleaning and polish", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createAutomotiveServices", "createAutomotives", "create"])
      log("  ✓ Automotive: 3 services seeded")
    }
  } catch (err: any) { logError("Automotive", err) }

  // ── 9. FITNESS ──
  try {
    const svc = resolveService("fitness")
    if (!svc) { log("  ⚠ Fitness service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Fitness Time Gym", type: "gym", city: "Riyadh", membership_price: sarPrice(250), facilities: ["weights", "cardio", "pool", "sauna"], metadata: { seeded: true } },
        { tenant_id: T, name: "Leejam Sports", type: "gym", city: "Jeddah", membership_price: sarPrice(300), facilities: ["weights", "cardio", "group_classes", "spa"], metadata: { seeded: true } },
        { tenant_id: T, name: "Body Masters", type: "gym", city: "Dammam", membership_price: sarPrice(200), facilities: ["weights", "cardio", "boxing", "yoga"], metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createFitnessFacilities", "createFitnesss", "create"])
      log("  ✓ Fitness: 3 facilities seeded")
    }
  } catch (err: any) { logError("Fitness", err) }

  // ── 10. FINANCIAL PRODUCT ──
  try {
    const svc = resolveAny("financialProduct", "financial_product")
    if (!svc) { log("  ⚠ Financial Product service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Murabaha Personal Finance", type: "personal_finance", min_amount: 5000, max_amount: 500000, currency_code: "sar", rate_min: 3.5, rate_max: 7.0, metadata: { seeded: true } },
        { tenant_id: T, name: "SME Business Financing", type: "business_finance", min_amount: 50000, max_amount: 5000000, currency_code: "sar", rate_min: 4.0, rate_max: 8.5, metadata: { seeded: true } },
        { tenant_id: T, name: "Home Ijara", type: "mortgage", min_amount: 200000, max_amount: 3000000, currency_code: "sar", rate_min: 2.5, rate_max: 5.0, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createFinancialProducts", "create"])
      log("  ✓ Financial Product: 3 products seeded")
    }
  } catch (err: any) { logError("Financial Product", err) }

  // ── 11. ADVERTISING ──
  try {
    const svc = resolveService("advertising")
    if (!svc) { log("  ⚠ Advertising service not found, skipping"); } else {
      const data = [
        { tenant_id: T, advertiser_id: ctx?.vendorIds?.[0] || "vendor_placeholder", name: "Homepage Banner", campaign_type: "banner", status: "active", budget: sarPrice(50000), spent: sarPrice(15000), currency_code: "sar", bid_type: "cpm", total_impressions: 250000, total_clicks: 5000, total_conversions: 150, metadata: { seeded: true } },
        { tenant_id: T, advertiser_id: ctx?.vendorIds?.[1] || "vendor_placeholder", name: "Category Spotlight", campaign_type: "search", status: "active", budget: sarPrice(25000), spent: sarPrice(8000), currency_code: "sar", bid_type: "cpc", total_impressions: 100000, total_clicks: 2000, total_conversions: 80, metadata: { seeded: true } },
        { tenant_id: T, advertiser_id: ctx?.vendorIds?.[2] || "vendor_placeholder", name: "Flash Sale Promo", campaign_type: "social", status: "active", budget: sarPrice(75000), spent: sarPrice(45000), currency_code: "sar", bid_type: "cpa", total_impressions: 500000, total_clicks: 12000, total_conversions: 600, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createAdvertisings", "createAdCampaigns", "create"])
      log("  ✓ Advertising: 3 campaigns seeded")
    }
  } catch (err: any) { logError("Advertising", err) }

  // ── 12. PARKING ──
  try {
    const svc = resolveService("parking")
    if (!svc) { log("  ⚠ Parking service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "King Fahd Road Parking", city: "Riyadh", capacity: 500, hourly_rate: sarPrice(10), type: "covered", metadata: { seeded: true } },
        { tenant_id: T, name: "Olaya Towers Parking", city: "Riyadh", capacity: 300, hourly_rate: sarPrice(15), type: "covered", metadata: { seeded: true } },
        { tenant_id: T, name: "Mall of Dhahran Parking", city: "Dhahran", capacity: 1200, hourly_rate: sarPrice(5), type: "open", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createParkingLocations", "createParkings", "create"])
      log("  ✓ Parking: 3 locations seeded")
    }
  } catch (err: any) { logError("Parking", err) }

  // ── 13. UTILITIES ──
  try {
    const svc = resolveService("utilities")
    if (!svc) { log("  ⚠ Utilities service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Electricity Bill Payment", provider: "Saudi Electricity Company", type: "electricity", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Water Bill Payment", provider: "National Water Company", type: "water", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Internet Subscription", provider: "STC", type: "internet", is_active: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createUtilityServices", "createUtilitiess", "create"])
      log("  ✓ Utilities: 3 services seeded")
    }
  } catch (err: any) { logError("Utilities", err) }

  // ── 14. LEGAL ──
  try {
    const svc = resolveService("legal")
    if (!svc) { log("  ⚠ Legal service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Contract Review", type: "review", price: sarPrice(1500), description: "Comprehensive legal contract review", estimated_days: 3, metadata: { seeded: true } },
        { tenant_id: T, name: "Business Registration", type: "registration", price: sarPrice(3000), description: "Saudi CR and business license registration", estimated_days: 14, metadata: { seeded: true } },
        { tenant_id: T, name: "Trademark Filing", type: "trademark", price: sarPrice(2500), description: "Saudi and GCC trademark filing and protection", estimated_days: 30, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createLegalServices", "createLegals", "create"])
      log("  ✓ Legal: 3 services seeded")
    }
  } catch (err: any) { logError("Legal", err) }

  // ── 15. GOVERNMENT ──
  try {
    const svc = resolveService("government")
    if (!svc) { log("  ⚠ Government service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Business License Application", type: "license", department: "Ministry of Commerce", processing_days: 7, fee: sarPrice(1000), metadata: { seeded: true } },
        { tenant_id: T, name: "Visa Processing", type: "visa", department: "Ministry of Interior", processing_days: 14, fee: sarPrice(2000), metadata: { seeded: true } },
        { tenant_id: T, name: "Vehicle Registration", type: "registration", department: "Muroor Traffic Department", processing_days: 1, fee: sarPrice(150), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createGovernmentServices", "createGovernments", "create"])
      log("  ✓ Government: 3 services seeded")
    }
  } catch (err: any) { logError("Government", err) }

  // ── 16. CROWDFUNDING ──
  try {
    const svc = resolveService("crowdfunding")
    if (!svc) { log("  ⚠ Crowdfunding service not found, skipping"); } else {
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      const data = [
        { tenant_id: T, title: "Tech Startup Fund", description: "Supporting Saudi tech entrepreneurs", goal_amount: 500000, raised_amount: 125000, currency_code: "sar", end_date: endDate.toISOString(), thumbnail: getThumb("charity", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Community Garden Project", description: "Green spaces for Riyadh neighborhoods", goal_amount: 75000, raised_amount: 32000, currency_code: "sar", end_date: endDate.toISOString(), thumbnail: getThumb("charity", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Youth Education Initiative", description: "STEM education for underprivileged youth", goal_amount: 200000, raised_amount: 89000, currency_code: "sar", end_date: endDate.toISOString(), thumbnail: getThumb("charity", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createCrowdfundingCampaigns", "createCrowdfundings", "create"])
      log("  ✓ Crowdfunding: 3 campaigns seeded")
    }
  } catch (err: any) { logError("Crowdfunding", err) }

  // ── 17. AUCTION ──
  try {
    const svc = resolveService("auction")
    if (!svc) { log("  ⚠ Auction service not found, skipping"); } else {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      const data = [
        { tenant_id: T, title: "Vintage Arabian Sword", description: "Antique Saudi ceremonial sword circa 1850", starting_price: sarPrice(15000), current_bid: sarPrice(22000), end_date: endDate.toISOString(), thumbnail: getThumb("auction", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Classic Car 1970 Mercedes", description: "Restored 1970 Mercedes-Benz 280SL", starting_price: sarPrice(120000), current_bid: sarPrice(185000), end_date: endDate.toISOString(), thumbnail: getThumb("auction", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Rare Arabic Manuscript", description: "13th century Islamic calligraphy manuscript", starting_price: sarPrice(50000), current_bid: sarPrice(73000), end_date: endDate.toISOString(), thumbnail: getThumb("auction", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createAuctionItems", "createAuctions", "create"])
      log("  ✓ Auction: 3 items seeded")
    }
  } catch (err: any) { logError("Auction", err) }

  // ── 18. CLASSIFIED ──
  try {
    const svc = resolveService("classified")
    if (!svc) { log("  ⚠ Classified service not found, skipping"); } else {
      const data = [
        { tenant_id: T, seller_id: ctx?.customerIds?.[0] || "cus_placeholder", title: "Used Toyota Camry 2022", description: "Single owner, 35k km, excellent condition", category: "automotive", price: sarPrice(85000), currency_code: "sar", city: "Riyadh", listing_type: "sell", condition: "good", is_negotiable: true, status: "active", view_count: 0, favorite_count: 0, thumbnail: getThumb("automotive", 0), metadata: { seeded: true } },
        { tenant_id: T, seller_id: ctx?.customerIds?.[0] || "cus_placeholder", title: "3BR Apartment in Jeddah", description: "Spacious apartment near corniche, furnished", category: "real_estate", price: sarPrice(450000), currency_code: "sar", city: "Jeddah", listing_type: "trade", condition: "like_new", is_negotiable: true, status: "active", view_count: 0, favorite_count: 0, thumbnail: getThumb("real_estate", 0), metadata: { seeded: true } },
        { tenant_id: T, seller_id: ctx?.customerIds?.[0] || "cus_placeholder", title: "MacBook Pro 2024 M3", description: "Like new, 16GB RAM, 512GB SSD", category: "electronics", price: sarPrice(6500), currency_code: "sar", city: "Riyadh", listing_type: "sell", condition: "like_new", is_negotiable: true, status: "active", view_count: 0, favorite_count: 0, thumbnail: getThumb("electronics", 0), metadata: { seeded: true } },
        { tenant_id: T, seller_id: ctx?.customerIds?.[0] || "cus_placeholder", title: "Office Furniture Set", description: "Complete office set: desk, chair, shelves", category: "furniture", price: sarPrice(3200), currency_code: "sar", city: "Dammam", listing_type: "sell", condition: "good", is_negotiable: true, status: "active", view_count: 0, favorite_count: 0, thumbnail: getThumb("home", 0), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createClassifiedListings", "createClassifieds", "create"])
      log("  ✓ Classified: 4 listings seeded")
    }
  } catch (err: any) { logError("Classified", err) }

  // ── 19. CHARITY ──
  try {
    const svc = resolveService("charity")
    if (!svc) { log("  ⚠ Charity service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Ramadan Food Drive", description: "Providing iftar meals to families in need", goal_amount: 100000, raised_amount: 67000, currency_code: "sar", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Orphan Support Program", description: "Education and care for orphaned children", goal_amount: 250000, raised_amount: 142000, currency_code: "sar", is_active: true, metadata: { seeded: true } },
        { tenant_id: T, name: "Mosque Renovation Fund", description: "Restoring historic mosques across Saudi Arabia", goal_amount: 500000, raised_amount: 210000, currency_code: "sar", is_active: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createCharityCampaigns", "createCharitys", "create"])
      log("  ✓ Charity: 3 campaigns seeded")
    }
  } catch (err: any) { logError("Charity", err) }

  // ── 20. EDUCATION ──
  try {
    const svc = resolveService("education")
    if (!svc) { log("  ⚠ Education service not found, skipping"); } else {
      const data = [
        { tenant_id: T, title: "Arabic Calligraphy Masterclass", description: "Learn traditional Arabic calligraphy styles", instructor: "Sheikh Ibrahim Al-Khattat", duration_hours: 24, price: sarPrice(1200), level: "beginner", thumbnail: getThumb("education", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Business Management Diploma", description: "Comprehensive business management program", instructor: "Dr. Sarah Al-Mahmoud", duration_hours: 120, price: sarPrice(5000), level: "intermediate", thumbnail: getThumb("education", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Data Science Bootcamp", description: "Intensive data science and ML training", instructor: "Eng. Khalid Hassan", duration_hours: 200, price: sarPrice(8000), level: "advanced", thumbnail: getThumb("education", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createEducationCourses", "createEducations", "create"])
      log("  ✓ Education: 3 courses seeded")
    }
  } catch (err: any) { logError("Education", err) }

  // ── 21. REAL ESTATE ──
  try {
    const svc = resolveAny("realEstate", "real_estate", "real-estate")
    if (!svc) { log("  ⚠ Real Estate service not found, skipping"); } else {
      const data = [
        { tenant_id: T, title: "Luxury Villa in Al Narjis", type: "villa", city: "Riyadh", bedrooms: 5, area_sqm: 450, price: sarPrice(3500000), thumbnail: getThumb("real_estate", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Modern Apartment in Al Olaya", type: "apartment", city: "Riyadh", bedrooms: 3, area_sqm: 180, price: sarPrice(850000), thumbnail: getThumb("real_estate", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Office Space in KAFD Tower", type: "office", city: "Riyadh", bedrooms: 0, area_sqm: 120, price: sarPrice(1200000), thumbnail: getThumb("real_estate", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createRealEstateListings", "createRealEstates", "create"])
      log("  ✓ Real Estate: 3 properties seeded")
    }
  } catch (err: any) { logError("Real Estate", err) }

  // ── 22. PET SERVICE ──
  try {
    const svc = resolveAny("petService", "pet_service", "pet-service")
    if (!svc) { log("  ⚠ Pet Service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Pet Grooming", type: "grooming", price: sarPrice(150), duration_minutes: 60, description: "Full grooming: bath, haircut, nail trim", metadata: { seeded: true } },
        { tenant_id: T, name: "Veterinary Checkup", type: "veterinary", price: sarPrice(200), duration_minutes: 30, description: "Comprehensive pet health examination", metadata: { seeded: true } },
        { tenant_id: T, name: "Pet Boarding", type: "boarding", price: sarPrice(100), duration_minutes: 1440, description: "Overnight pet boarding with care and feeding", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createPetServices", "create"])
      log("  ✓ Pet Service: 3 services seeded")
    }
  } catch (err: any) { logError("Pet Service", err) }

  // ── 23. AFFILIATE ──
  try {
    const svc = resolveService("affiliate")
    if (!svc) { log("  ⚠ Affiliate service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Dakkah Referral Program", email: "referrals@dakkah.com", affiliate_type: "partner", commission_rate: 5, commission_type: "percentage", payout_method: "bank_transfer", status: "active", metadata: { seeded: true } },
        { tenant_id: T, name: "Influencer Partner Program", email: "influencers@dakkah.com", affiliate_type: "influencer", commission_rate: 10, commission_type: "percentage", payout_method: "bank_transfer", status: "active", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createAffiliatePrograms", "createAffiliates", "create"])
      log("  ✓ Affiliate: 2 programs seeded")
    }
  } catch (err: any) { logError("Affiliate", err) }

  // ── 24. WARRANTY ──
  try {
    const svc = resolveService("warranty")
    if (!svc) { log("  ⚠ Warranty service not found, skipping"); } else {
      const data = [
        { tenant_id: T, name: "Electronics 2-Year Extended", plan_type: "extended", duration_months: 24, price: sarPrice(299), currency_code: "sar", coverage: { type: "electronics", parts: true, labor: true }, description: "Extended warranty for all electronics", metadata: { seeded: true } },
        { tenant_id: T, name: "Home Appliance 3-Year", plan_type: "extended", duration_months: 36, price: sarPrice(499), currency_code: "sar", coverage: { type: "appliance", parts: true, labor: true }, description: "Full coverage for home appliances", metadata: { seeded: true } },
        { tenant_id: T, name: "Premium All-in-One", plan_type: "premium", duration_months: 24, price: sarPrice(799), currency_code: "sar", coverage: { type: "comprehensive", parts: true, labor: true, accidental: true }, description: "Premium coverage for all product categories", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createWarrantyPlans", "createWarrantys", "create"])
      log("  ✓ Warranty: 3 plans seeded")
    }
  } catch (err: any) { logError("Warranty", err) }

  // ── 25. RENTAL ──
  try {
    const svc = resolveService("rental")
    if (!svc) { log("  ⚠ Rental service not found, skipping"); } else {
      const data = [
        { tenant_id: T, product_id: ctx?.productIds?.[0] || "prod_placeholder", rental_type: "daily", base_price: sarPrice(500), currency_code: "sar", deposit_amount: sarPrice(5000), min_duration: 1, max_duration: 30, is_available: true, metadata: { seeded: true } },
        { tenant_id: T, product_id: ctx?.productIds?.[1] || "prod_placeholder", rental_type: "daily", base_price: sarPrice(200), currency_code: "sar", deposit_amount: sarPrice(2000), min_duration: 1, max_duration: 14, is_available: true, metadata: { seeded: true } },
        { tenant_id: T, product_id: ctx?.productIds?.[2] || "prod_placeholder", rental_type: "daily", base_price: sarPrice(1000), currency_code: "sar", deposit_amount: sarPrice(3000), min_duration: 1, max_duration: 7, is_available: true, metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createRentalProducts", "createRentals", "create"])
      log("  ✓ Rental: 3 items seeded")
    }
  } catch (err: any) { logError("Rental", err) }

  // ── 26. INSURANCE ──
  try {
    const svc = resolveService("insurance")
    if (!svc) { log("  ⚠ Insurance service not found, skipping"); } else {
      const data = [
        { customer_id: ctx?.customerIds?.[0] || "cus_placeholder", product_id: ctx?.productIds?.[0] || "prod_placeholder", plan_type: "vehicle", coverage_amount: sarPrice(5000), premium: sarPrice(250), status: "active", metadata: { seeded: true } },
        { customer_id: ctx?.customerIds?.[0] || "cus_placeholder", product_id: ctx?.productIds?.[1] || "prod_placeholder", plan_type: "health", coverage_amount: sarPrice(10000), premium: sarPrice(400), status: "active", metadata: { seeded: true } },
        { customer_id: ctx?.customerIds?.[0] || "cus_placeholder", product_id: ctx?.productIds?.[2] || "prod_placeholder", plan_type: "property", coverage_amount: sarPrice(20000), premium: sarPrice(150), status: "active", metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createInsPolicys", "createInsurances", "create"])
      log("  ✓ Insurance: 3 policies seeded")
    }
  } catch (err: any) { logError("Insurance", err) }

  // ── 27. SOCIAL COMMERCE ──
  try {
    const svc = resolveAny("socialCommerce", "social_commerce", "social-commerce")
    if (!svc) { log("  ⚠ Social Commerce service not found, skipping"); } else {
      const data = [
        { tenant_id: T, title: "Fashion Show Live", description: "Live showcase of latest Saudi fashion trends", platform: "internal", status: "scheduled", thumbnail: getThumb("events", 0), metadata: { seeded: true } },
        { tenant_id: T, title: "Electronics Flash Sale", description: "Live deals on electronics and gadgets", platform: "internal", status: "scheduled", thumbnail: getThumb("events", 1), metadata: { seeded: true } },
        { tenant_id: T, title: "Cooking Class Live", description: "Traditional Saudi cuisine cooking demonstration", platform: "internal", status: "scheduled", thumbnail: getThumb("events", 2), metadata: { seeded: true } },
      ]
      await tryCreate(svc, data, ["createSocialCommerceStreams", "createSocialCommerces", "create"])
      log("  ✓ Social Commerce: 3 live streams seeded")
    }
  } catch (err: any) { logError("Social Commerce", err) }

  log("━━━ SEED VERTICALS COMPLETE ━━━")
}
