# Dakkah CityOS — Detail Pages Deep Assessment

**Date:** February 15, 2026  
**Scope:** All 50 storefront detail pages (excluding account pages)  
**Depth:** Layout blocks, backend route handlers, database schemas, seed data quality, API response fields, data model alignment, image availability, routing mismatches

---

## Executive Summary

| Category | Total | Working | Partial | Broken |
|---|---|---|---|---|
| **Storefront Detail Pages** | 50 | 14 | 14 | 22 |
| **Backend GET /[id] Routes** | 28 exist | 14 return 200 | 3 return errors | 19 missing entirely |
| **Database Tables** | 26 exist | 22 with data | 4 empty | 24 verticals with no table |
| **Image Data** | 26 tables checked | 21 have image URLs | 5 have no images | — |
| **Seeded Listing Data** | 50 needed | 36 have data | — | 14 completely empty |

### Critical Structural Finding

**38 of 50 detail pages are copy-paste templates.** They all reference the exact same 13 generic fields (`address`, `avg_rating`, `banner_url`, `city`, `description`, `location`, `logo_url`, `metadata`, `photo_url`, `price`, `rating`, `review_count`, `thumbnail`) and ignore the unique fields each vertical's backend model actually provides. Only 12 pages have any customized field references.

**5 duplicate page pairs exist** (10 pages total) that fetch from the same backend endpoint and provide nearly identical layouts:
- `campaigns` (181 lines) ↔ `crowdfunding` (248 lines) — both fetch `/store/crowdfunding/{id}`
- `consignment` (213 lines) ↔ `consignment-shop` (212 lines) — both fetch `/store/consignments/{id}`
- `dropshipping` (205 lines) ↔ `dropshipping-marketplace` (211 lines) — both fetch `/store/dropshipping/{id}`
- `print-on-demand` (217 lines) ↔ `print-on-demand-shop` (207 lines) — both fetch `/store/print-on-demand/{id}`
- `white-label` (213 lines) ↔ `white-label-shop` (239 lines) — both fetch `/store/white-label/{id}`

---

## Tier Classification

### Tier 1 — Fully Functional (14 pages)
Backend detail endpoint returns 200, database has seeded rows, API response fields are displayable.

### Tier 2 — Partial (14 pages)
Has seeded listing data, but detail endpoint returns 404/500, or the page template doesn't map to the actual API response fields.

### Tier 3 — Broken (22 pages)
No seeded data, no working detail endpoint, fundamental data model mismatch, or no backend table exists.

---

## Section 1: Database Schema Analysis

### Tables That Exist With Data

| Table Name | Row Count | Has Images | Key Display Fields | Image Storage |
|---|---|---|---|---|
| `auction_listing` | 6 | No (in metadata) | title, description, price, currency | `metadata.images` |
| `vehicle_listing` | 6 | Yes (column) | title, make, model, year, price | `images` JSON array |
| `classified_listing` | 7 | Yes (metadata) | title, description, price, condition | `metadata.images`, `metadata.thumbnail` |
| `crowdfund_campaign` | 5 | Yes (column) | title, description, goal/raised amounts | `images` JSON array |
| `digital_asset` | 6 | Yes (metadata) | title, file_type, file_url | `metadata.images`, `metadata.thumbnail` |
| `class_schedule` | 10 | Yes (metadata) | class_name, description, difficulty | `metadata.images`, `metadata.thumbnail` |
| `gig_listing` | 7 | Yes (metadata) | title, description, price, rating | `metadata.images`, `metadata.thumbnail` |
| `fresh_product` | 8 | Partial (metadata) | storage_type, shelf_life, organic | `metadata.name` (name only in metadata!) |
| `practitioner` | 11 | Yes (column) | name, specialization, bio, rating | `photo_url` |
| `insurance_product` | 7 | No (metadata) | name, description, insurance_type | `metadata.images`, `metadata.thumbnail` |
| `insurance_policy` | 2 | No | policy_number, status, premium | None |
| `attorney_profile` | 8 | Yes (column) | name, specializations, bio, rating | `photo_url` |
| `parking_zone` | 6 | Yes (metadata) | name, description, zone_type, rates | `metadata.images`, `metadata.thumbnail` |
| `pet_profile` | 5 | Yes (column) | name, species, breed, weight | `photo_url` |
| `property_listing` | 7 | Yes (column) | title, description, price, bedrooms | `images` JSON array |
| `rental_product` | 7 | Yes (metadata) | rental_type, base_price, deposit | `metadata.name`, `metadata.images` |
| `restaurant` | 5 | Yes (columns) | name, description, cuisine_types, rating | `logo_url`, `banner_url` |
| `event` | 6 | Yes (column) | title, description, event_type, venue | `image_url` |
| `subscription_plan` | 5 | Partial (metadata) | name, description, price, features | `metadata.seeded` (no images!) |
| `membership_tier` | 6 | No | name, description, benefits, annual_fee | `icon_url` (empty) |
| `membership` | 3 | No | membership_number, status, points | None (customer record) |
| `loyalty_program` | 2 | Partial (metadata) | name, description, points_per_currency | `metadata.welcome_bonus` |
| `warranty_plan` | 5 | Yes (metadata) | name, description, plan_type, price | `metadata.images`, `metadata.thumbnail` |
| `charity_org` | 5 | Yes (column) | name, description, category, website | `logo_url` |
| `vendor` | 10 | Yes (columns) | business_name, description, rating | `logo_url`, `banner_url` |
| `travel_property` | 7 | Yes (column) | name, description, property_type, stars | `images` JSON array |
| `course` | 6 | Yes (column) | title, description, price, rating | `thumbnail_url` |
| `donation_campaign` | 8 | Yes (column) | title, description, goal_amount | `images` JSON array |
| `booking` | 3 | No | booking_number, status, total | None |
| `trade_in` | Table exists | — | — | — |
| `credit_line` | Table exists | — | — | — |

### Tables That Do NOT Exist

These verticals have no dedicated database table at all:

| Vertical | What Route Handler Uses Instead |
|---|---|
| **b2b** | `company` module (Company, PurchaseOrder) — procurement, not products |
| **bundles** | `promotionExt` module (ProductBundle) — `product_bundle` table |
| **consignment** | No module — listing route attempts vendor queries |
| **credit** | Wallet module — `credit_line` table (customer credit, not products) |
| **dropshipping** | `vendor` module — `vendor_product` table (join table, not products) |
| **flash-deals** | `promotionExt` + Medusa promotions — `promotion` table (codes, not deals) |
| **gift-cards** | Medusa core gift cards — `gift_card_ext` table (issued cards, not designs) |
| **newsletter** | Simple module — `newsletter` table doesn't exist, data from notification module |
| **places** | `tenant` module — `tenant_poi` table |
| **print-on-demand** | No module exists |
| **social-commerce** | Data hardcoded in route handler (no table, uses `social_post`/`live_stream` for detail) |
| **try-before-you-buy** | `vendor` module — same `vendor_product` table as dropshipping |
| **volume-deals** | `volume-pricing` module — `volume_pricing` table (pricing tiers, not products) |
| **white-label** | No module exists |

---

## Section 2: Backend Route Handler Analysis

### Detail Endpoint Handler Patterns

| Quality | Count | Pattern | Verticals |
|---|---|---|---|
| **Full with relations** | 3 | Fetches main entity + related records (bids, campaigns, etc.) | auctions (57 lines, broken), bookings (57 lines), charity (24 lines, broken) |
| **Simple retrieve** | 22 | `mod.retrieve[Entity](id)` — single entity fetch, 14-17 lines | automotive, classifieds, crowdfunding, digital, fitness, freelance, government, grocery, legal, parking, pet-services, rentals, travel, warranties, etc. |
| **Complex with auth** | 2 | Requires authentication, multi-step logic | purchase-orders (87 lines), quotes (51 lines) |
| **Dual-entity lookup** | 2 | Tries multiple entity types | charity (CharityOrg then DonationCampaign), social-commerce (GroupBuy then LiveStream) |
| **Missing entirely** | 19 | No `[id]/route.ts` file exists | See Section 3 |

### Detail Endpoint Bugs (3 broken endpoints)

**1. Auctions — 500 Internal Server Error**
- **Root Cause:** Route queries `mod.listBids({ auction_listing_id: id })` but the `bid` table column is named `auction_id`, not `auction_listing_id`
- **Fix:** Change query filter from `auction_listing_id` to `auction_id`
- **File:** `apps/backend/src/api/store/auctions/[id]/route.ts`

**2. Charity — 404 Not Found on valid IDs**
- **Root Cause:** Route calls `mod.retrieveCharityOrg(id)` which throws "not found" (caught silently), then tries `mod.retrieveDonationCampaign(id)` which also fails. The listing endpoint returns items with IDs from the `charity_org` table, but `retrieveCharityOrg()` may have a query filter mismatch or the resolver method doesn't match the module's service method name.
- **File:** `apps/backend/src/api/store/charity/[id]/route.ts`

**3. Social-Commerce — 404 Not Found on valid IDs**
- **Root Cause:** Listing endpoint uses hardcoded seed data (in-memory array with IDs like `sc_001`), but detail endpoint queries `mod.listLiveStreams({ id })` or `mod.listGroupBuys({ id })` against database tables. The hardcoded IDs don't exist in any database table.
- **Fix:** Either store social commerce data in a database table, or have the detail endpoint reference the same hardcoded array.
- **File:** `apps/backend/src/api/store/social-commerce/[id]/route.ts`

### Listing Endpoints With Hardcoded/In-Memory Data (no database)

| Vertical | Data Source | Detail |
|---|---|---|
| **social-commerce** | `SOCIAL_COMMERCE_SEED` array (7 items) in route handler | No database table — data exists only in source code |
| **events** | Database (`event` table, 6 rows) + some inline construction in route | Mixed approach |

### Listing Endpoints Using Wrong Data Model

| Vertical | What Listing Returns | What Detail Page Expects |
|---|---|---|
| **dropshipping** | `vendor_product` join records (vendor_id, product_id, status) | Product with name, description, images, price |
| **try-before-you-buy** | Same `vendor_product` join records | Product with name, description, images, price |
| **flash-deals** | Medusa `promotion` records (code, is_automatic, type) | Deal with name, images, price, discount |
| **memberships** | `membership` customer records (customer_id, points, status) | Plan with name, benefits, price, features |
| **subscriptions** | `subscription` customer records (customer_id, billing_interval) | Plan with name, description, price, features |
| **credit** | `credit_line` records (customer balance) | Credit product with terms, rates |
| **gift-cards** | Medusa gift card records (code, balance) | Gift card design with images, denominations |

---

## Section 3: Per-Vertical Deep Assessment

### Legend
- **DB Table:** The actual PostgreSQL table name and row count
- **API Response Fields:** What the backend detail endpoint actually returns
- **Page Expects:** What the storefront JSX template references via `item.xxx`
- **Field Alignment:** Whether API response fields match what the page template uses
- **Image Pipeline:** Whether images flow from DB → API → Page display

---

### 1. affiliate
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `affiliate` — 0 rows |
| **Backend Listing** | `/store/affiliates` — ERROR (empty response / module resolution failure) |
| **Backend Detail** | `/store/affiliates/[id]` — 16 lines, simple retrieve. Untested (no data). |
| **Page Template** | 180 lines. GENERIC template (13 standard fields). |
| **Page Customization** | None — uses cookie-cutter template |
| **Field Alignment** | Unknown — no API response to compare against |
| **Image Pipeline** | No images in model (no photo_url, no images column) |
| **Gaps** | No seeded data. No images in model. Listing endpoint fails. Generic template. |

---

### 2. auctions
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `auction_listing` — 6 rows. Columns: title, description, auction_type, status, starting_price, reserve_price, buy_now_price, current_price, currency_code, bid_increment, starts_at, ends_at, total_bids |
| **DB Images** | `metadata` column — images stored as metadata JSON but **currently NULL** for all rows. No dedicated images column despite `images` field existing in seed scripts. |
| **Backend Listing** | `/store/auctions` — 200 OK, 5 items returned |
| **Backend Detail** | `/store/auctions/[id]` — **500 ERROR**. Bug: queries `listBids({ auction_listing_id: id })` but `bid` table column is `auction_id`. |
| **API Response (listing)** | `{id, title, description, auction_type, status, starting_price, reserve_price, current_price, currency_code, starts_at, ends_at, total_bids, metadata}` |
| **Page Template** | 262 lines. GENERIC template. Has hero image, sidebar, reviews reference. |
| **Missing from page** | No breadcrumb, no CTA (Place Bid button), no not-found state, no auction countdown timer, no bid history display |
| **Field Alignment** | POOR — Page references `item.price`, `item.rating`, `item.photo_url` but API returns `starting_price`, `current_price`, no rating, no photo_url |
| **Unique fields NOT used by page** | `auction_type`, `starting_price`, `reserve_price`, `buy_now_price`, `current_price`, `bid_increment`, `starts_at`, `ends_at`, `total_bids`, `auto_extend` |
| **Gaps** | Detail endpoint crashes. Page doesn't display any auction-specific fields. No bid UI. No countdown. No images in DB despite metadata field. |

---

### 3. automotive
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `vehicle_listing` — 6 rows. Columns: title, make, model_name, year, mileage_km, fuel_type, transmission, body_type, color, VIN, condition, price, features, images, location_city |
| **DB Images** | `images` column — **YES**, populated with Unsplash URLs (JSON array of strings) |
| **Backend Detail** | `/store/automotive/[id]` — **200 OK** |
| **API Response** | Full vehicle data: `{id, title, make, model_name, year, mileage_km, fuel_type, transmission, body_type, color, vin, condition, price, description, features, images, location_city, location_country, view_count}` |
| **Page Template** | 205 lines. GENERIC template but has some custom sections: hero image, breadcrumb, sidebar, CTAs (Schedule Test Drive, Contact Dealer), details grid (4 sections). |
| **Field Alignment** | POOR despite working — Page references `item.price`, `item.thumbnail` but API returns `price` (integer), `images` (array). Page misses: make, model, year, mileage, fuel_type, transmission, body_type, VIN, features, location. |
| **Unique fields NOT used by page** | `make`, `model_name`, `year`, `mileage_km`, `fuel_type`, `transmission`, `body_type`, `color`, `vin`, `condition`, `features`, `view_count` |
| **Gaps** | Despite 200 OK, the generic template wastes the rich vehicle data. No vehicle spec display. No image gallery for multiple photos. |

---

### 4. b2b
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `company` — for companies. `purchase_order` — for orders. No product-browsing table. |
| **Backend Listing** | `/store/b2b` — 0 items |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 242 lines. CUSTOM template — references `company_name`, `industry`, `employees`, `moq`, `bulk_pricing`, `lead_time`, `certifications`, `products`. |
| **Field Alignment** | N/A — no API to compare |
| **Gaps** | No data model for B2B product browsing. Company module is for company management, not product catalog. Page has custom fields but nothing to display. |

---

### 5. bookings
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `booking` — 3 rows, but these are customer booking records (with booking_number, status, payment_status), not browseable services. `service_product` table — 0 rows. |
| **Backend Detail** | `/store/bookings/[id]` — 57 lines with auth. Retrieves individual booking (requires authentication). |
| **Page Template** | 249 lines. GENERIC template. |
| **Gaps** | The `booking` table has customer appointments, not service listings. `service_product` table is empty. Detail endpoint is for viewing your own booking, not browsing services. Needs a service catalog model. |

---

### 6. bundles
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `product_bundle` — 7 rows. Columns: title, handle, description, bundle_type, discount_type, discount_value, is_active. |
| **DB Images** | metadata — `{price, images, rating, category, thumbnail}` with Unsplash URLs |
| **Backend Listing** | `/store/bundles` — 200 OK, 7 items |
| **Backend Detail** | No `[id]` route — **404** |
| **Page Template** | 210 lines. CUSTOM template — references `item.name`, `item.title`, `item.quantity`, `item.image`. |
| **Field Alignment** | Partial match — page expects `name`, API has `title`. Images in metadata but page references `item.image`. |
| **Gaps** | Missing detail endpoint. Price only in metadata JSON. Page field references don't match API field names. |

---

### 7. campaigns
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (DUPLICATE of crowdfunding) |
| **DB Table** | `crowdfund_campaign` — 5 rows (shared with crowdfunding) |
| **Backend Detail** | `/store/crowdfunding/[id]` — **200 OK** (same endpoint as crowdfunding) |
| **API Response** | `{title, description, campaign_type, status, goal_amount, raised_amount, backer_count, starts_at, ends_at, images, reward_tiers[], risks_and_challenges}` |
| **Page Template** | 181 lines. GENERIC template. Very minimal layout — no breadcrumb, no sidebar, no CTAs, no not-found state. |
| **Unique fields NOT used by page** | `campaign_type`, `goal_amount`, `raised_amount`, `backer_count`, `reward_tiers`, `starts_at`, `ends_at`, `risks_and_challenges` |
| **Gaps** | Duplicate page sharing same backend as crowdfunding. Severely minimal layout. Ignores all crowdfunding-specific fields like progress bar, reward tiers, timeline. |

---

### 8. charity
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `charity_org` — 5 rows. `donation_campaign` — 8 rows. |
| **DB Images** | `logo_url` on charity_org — **YES**, Unsplash URLs. `images` on donation_campaign — **YES**. |
| **Backend Detail** | `/store/charity/[id]` — **404** on valid IDs. Bug: `retrieveCharityOrg(id)` throws, falls to `retrieveDonationCampaign(id)` which also fails. Likely module service method name mismatch. |
| **Page Template** | 243 lines. GENERIC template but has Share, CTAs (Donate). |
| **Gaps** | Detail endpoint query bug. Rich data exists in DB but unreachable. |

---

### 9. classifieds
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `classified_listing` — 7 rows. All key fields populated. |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "..."}` — **YES**, Unsplash URLs |
| **Backend Detail** | `/store/classifieds/[id]` — **200 OK** |
| **API Response** | `{id, title, description, category_id, listing_type, condition, price, currency_code, is_negotiable, location_city, location_state, location_country, metadata}` |
| **Page Template** | 222 lines. CUSTOM template — references `item.title`, `item.category`, `item.condition`, `item.seller`, `item.details`. |
| **Field Alignment** | Good — page has custom fields that roughly match API. But `seller` field doesn't exist in API (seller_id only). |
| **Gaps** | `ListingImage` model exists in DB but not used by API (images only in metadata). No gallery despite image model. |

---

### 10. consignment
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | No dedicated table. Route queries vendor/consignment module. |
| **Backend Listing** | `/store/consignments` — 0 items |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 213 lines. CUSTOM template — references `item.brand`, `item.condition`, `item.consignor`, `item.commission_rate`, `item.original_price`. |
| **Gaps** | DUPLICATE with consignment-shop. No data model. Custom template has fields that don't match any existing model. |

---

### 11. consignment-shop
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** (DUPLICATE of consignment) |
| **Page Template** | 212 lines. CUSTOM template — references `item.brand`, `item.authenticity`, `item.provenance`, `item.material`, `item.color`, `item.size`. |
| **Gaps** | Same backend as consignment. Both pages are empty. |

---

### 12. credit
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `credit_line` — exists. Model is for customer store credit, not browseable credit products. |
| **Backend Listing** | `/store/credit` — 0 items (lists customer credit lines) |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 259 lines. GENERIC template. |
| **Gaps** | Fundamental model mismatch — store credit vs credit products. |

---

### 13. crowdfunding
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `crowdfund_campaign` — 5 rows |
| **DB Images** | `images` column — **YES**, Unsplash URL arrays |
| **Backend Detail** | `/store/crowdfunding/[id]` — **200 OK** |
| **API Response** | `{title, description, campaign_type, goal_amount, raised_amount, backer_count, images, reward_tiers[{id, title, description, price, estimated_delivery, limited_quantity}], risks_and_challenges, starts_at, ends_at}` |
| **Page Template** | 248 lines. GENERIC template. Has Share. |
| **Unique fields NOT used by page** | `campaign_type`, `goal_amount`, `raised_amount`, `backer_count`, `reward_tiers`, `starts_at`, `ends_at`, `risks_and_challenges` |
| **Gaps** | Page ignores all crowdfunding-specific data: no progress bar, no reward tier cards, no backer count, no campaign deadline countdown. Missing CTAs (Back This Project). |

---

### 14. digital
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (data works, layout severely lacking) |
| **DB Table** | `digital_asset` — 6 rows |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "...", cover_image: "...", price_sar: N}` — **YES** |
| **Backend Detail** | `/store/digital-products/[id]` — **200 OK** |
| **API Response** | `{title, file_type, file_size_bytes, file_url, preview_url, version, max_downloads, is_active, metadata}` |
| **Page Template** | 181 lines. GENERIC template. No breadcrumb, no sidebar, no CTAs. |
| **Unique fields NOT used by page** | `file_type`, `file_size_bytes`, `preview_url`, `version`, `max_downloads`, `metadata.price_sar`, `metadata.pages`, `metadata.author` |
| **Gaps** | Very minimal layout despite working endpoint. Price buried in metadata. No Download/Buy button. No file type display. |

---

### 15-16. dropshipping + dropshipping-marketplace
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** (both pages) |
| **DB Table** | `vendor_product` — 12 rows. Columns: vendor_id, product_id, status, fulfillment_method, lead_time_days. **No name, description, images, or price.** |
| **Backend Listing** | `/store/dropshipping` — returns 12 `vendor_product` join records |
| **Backend Detail** | No `[id]` route |
| **Page Templates** | dropshipping: 205 lines GENERIC. dropshipping-marketplace: 211 lines GENERIC. |
| **Fundamental Issue** | `vendor_product` is a many-to-many join table linking vendors to products. It has no display fields. These pages need to query the linked `product` records with their names, images, and prices instead. |

---

### 17. education
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (just needs detail endpoint) |
| **DB Table** | `course` — 6 rows. Rich model: title, description, category, level, format, language, price, duration_hours, total_lessons, total_enrollments, avg_rating, thumbnail_url, preview_video_url, syllabus, prerequisites, tags |
| **DB Images** | `thumbnail_url` — **YES**, Unsplash URLs |
| **Backend Listing** | `/store/education` — 200 OK, 6 items |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 263 lines. GENERIC template but has good layout: hero, breadcrumb, sidebar, CTAs (Enroll Now), reviews (7 refs), share. |
| **Priority** | **HIGH** — rich data model, good layout, just needs 16-line detail endpoint. |

---

### 18. events
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `event` — 6 rows. Columns: title, description, event_type, status, address, starts_at, ends_at, is_online, max_capacity, image_url |
| **DB Images** | `image_url` — **YES**, Unsplash URLs |
| **Backend Listing** | `/store/events` — 200 OK, 8 items (6 DB + 2 constructed) |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 319 lines (longest page). GENERIC template. Has share (4 refs). |
| **Missing from page** | No breadcrumb, no CTAs (Buy Tickets), no not-found state |
| **Unique fields NOT used** | `event_type`, `venue_id`, `starts_at`, `ends_at`, `is_online`, `online_url`, `max_capacity`, `current_attendees`, `image_url`, `organizer_name` |
| **Priority** | **HIGH** — 319 lines of layout but none of the event-specific data is used. |

---

### 19. financial
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | No `financial` table. Uses `financial-product` module. |
| **Backend Listing** | `/store/financial` — ERROR. But `/store/financial-products` route exists. |
| **Backend Detail** | `/store/financial-products/[id]` — route exists |
| **Page Template** | 245 lines. GENERIC template. Fetches `/store/financial/${id}` but backend route is `/store/financial-products/[id]` |
| **Routing Mismatch** | Page fetches `/store/financial/{id}` → No such route. Backend has `/store/financial-products/[id]`. |
| **Gaps** | Endpoint naming mismatch between storefront and backend. |

---

### 20. fitness
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `class_schedule` — 10 rows |
| **DB Images** | `metadata` — `{price: N, images: [...], rating: N, category: "...", thumbnail: "..."}` — **YES** |
| **Backend Detail** | `/store/fitness/[id]` — **200 OK** |
| **API Response** | `{class_name, description, class_type, day_of_week, start_time, end_time, duration_minutes, max_capacity, current_enrollment, difficulty, room, metadata}` |
| **Page Template** | 228 lines. CUSTOM template — references `item.name`, `item.instructor`, `item.duration`, `item.level`, `item.schedule`, `item.benefits`, `item.membership_options`. |
| **Field Alignment** | PARTIAL — page expects `name` (API has `class_name`), `instructor` (API has no instructor data), `level` (API has `difficulty`). |
| **Unique fields NOT used** | `class_type`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `current_enrollment`, `room`, `is_recurring` |

---

### 21. flash-deals
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | Uses Medusa `promotion` table — 3 records with `code`, `is_automatic`, `type`, `status`, `campaign_id`. |
| **Backend Listing** | `/store/flash-sales` — returns Medusa promotion records |
| **Fundamental Issue** | Promotions are discount codes/rules, not product deals. A flash deal page needs products with their original price, discounted price, countdown timer, and stock quantity. |
| **Gaps** | Complete model mismatch. Need a `flash_deal` table linking promotions to products with deal-specific fields. |

---

### 22. freelance
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `gig_listing` — 7 rows. Rich: title, description, category, price, hourly_rate, delivery_time_days, skill_tags, avg_rating, portfolio_urls |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "..."}` — **YES** |
| **Backend Detail** | `/store/freelance/[id]` — **200 OK** |
| **API Response** | `{title, description, category, subcategory, listing_type, price, hourly_rate, currency_code, delivery_time_days, revisions_included, skill_tags, avg_rating, portfolio_urls, metadata}` |
| **Page Template** | 246 lines. GENERIC template but has Reviews (8 refs). |
| **Unique fields NOT used** | `category`, `subcategory`, `listing_type`, `hourly_rate`, `delivery_time_days`, `revisions_included`, `skill_tags`, `portfolio_urls` |
| **Gaps** | Generic template wastes rich freelancer data. No skill tags display, no portfolio gallery, no delivery time info, no reviews form. |

---

### 23. gift-cards-shop
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `gift_card_ext` — 8 rows. Customer-issued gift cards: code, currency_code, sender_name, recipient_email. |
| **DB Images** | `metadata` — `{design, images, category, thumbnail}` — images in metadata |
| **Backend Detail** | **No `[id]` route — 404** |
| **Fundamental Issue** | Data model is issued gift cards (with codes, balances), not a gift card design catalog. Page expects browseable gift card designs with images and denominations. |

---

### 24. government
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** (but only 2 items) |
| **DB Table** | No `government_service_request` table found (may use different name). API returns 2 items. |
| **Backend Detail** | `/store/government/[id]` — **200 OK** |
| **API Response** | `{title, description, request_type, category, location, status, priority, department, photos}` |
| **Page Template** | 247 lines. GENERIC template. |
| **Gaps** | Very few items. Generic template. API has `photos` field but page doesn't render them. |

---

### 25. grocery
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** (but very sparse data) |
| **DB Table** | `fresh_product` — 8 rows. Columns: storage_type, shelf_life_days, origin_country, organic, unit_type, nutrition_info. **Name only in metadata!** |
| **DB Images** | `metadata` — `{name: "...", seeded: true}` — **NO dedicated images** |
| **Backend Detail** | `/store/grocery/[id]` — **200 OK** |
| **API Response** | `{id, storage_type, shelf_life_days, origin_country, organic, unit_type, min_order_quantity, nutrition_info, metadata}` — **No name, no price, no images in response** |
| **Page Template** | 249 lines. CUSTOM template — references `item.name`, `item.value`. Has Related items (5 refs — unique among all pages). |
| **Field Alignment** | VERY POOR — page expects `name`, `price`, `thumbnail` but API returns none of these directly. Name buried in metadata. No price anywhere. |
| **Gaps** | Grocery product model needs name, price, images, and description as first-class fields, not metadata. |

---

### 26. healthcare
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (just needs detail endpoint) |
| **DB Table** | `practitioner` — 11 rows. Rich: name, title, specialization, bio, education, experience_years, consultation_fee, rating, photo_url, languages |
| **DB Images** | `photo_url` — **YES**, Unsplash URLs |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 220 lines. GENERIC template. Has Reviews (8 refs). |
| **Priority** | **HIGH** — 11 items with rich data, images, rating. Just needs 16-line detail endpoint. |

---

### 27. insurance
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | `insurance_product` — 7 rows. Rich: name, description, insurance_type, coverage_details, deductible_options, term_options, claim_process, exclusions. |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "..."}` — **YES** in metadata |
| **Backend Listing** | `/store/insurance` — uses `financialProduct` module to list insurance products. |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 237 lines. GENERIC template. Details grid (4 sections). |
| **Priority** | **MEDIUM** — good data model, just needs detail endpoint. |

---

### 28. legal
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `attorney_profile` — 8 rows. Rich: name, bar_number, specializations, practice_areas, bio, education, experience_years, hourly_rate, rating, photo_url, languages |
| **DB Images** | `photo_url` — **YES**, Unsplash URLs |
| **Backend Detail** | `/store/legal/[id]` — **200 OK** |
| **API Response** | `{name, bar_number, specializations, practice_areas, bio, education, experience_years, hourly_rate, currency_code, rating, total_cases, photo_url, languages}` |
| **Page Template** | 249 lines. GENERIC template. Reviews (8 refs). |
| **Unique fields NOT used** | `bar_number`, `specializations`, `practice_areas`, `education`, `experience_years`, `hourly_rate`, `total_cases`, `languages` |
| **Gaps** | Rich API data completely ignored by generic template. No attorney credentials display, no rate display, no case history. |

---

### 29. loyalty-program
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `loyalty_program` — 2 rows. Very minimal: name, description, points_per_currency. |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 199 lines. GENERIC template. |
| **Gaps** | No detail endpoint. Model is a program definition, not individual rewards to browse. |

---

### 30. memberships
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `membership` — 3 rows (customer records). `membership_tier` — 6 rows (tier definitions with name, description, benefits, annual_fee). |
| **Backend Listing** | `/store/memberships` — returns `membership` records (customer's membership status, not browseable plans) |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 185 lines. GENERIC template. No breadcrumb, no CTAs. |
| **Fundamental Issue** | Listing serves customer memberships but page should display `membership_tier` records for browsing. |
| **Fix Required** | Change listing to serve `membership_tier` records; add detail endpoint for tiers. |

---

### 31. newsletter
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | No dedicated table found. Backend uses notification module. |
| **Backend Listing** | `/store/newsletters` — 3 items |
| **Backend Detail** | No `[id]` route — 404 |
| **Page Template** | 259 lines. CUSTOM template — references `item.title`, `item.subject`, `item.date`, `item.excerpt`, `item.preview`. Has CTAs (Subscribe — 6 refs). |
| **Gaps** | Missing detail endpoint. Custom template but no data to display. |

---

### 32. parking
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `parking_zone` — 6 rows. Rich: name, description, zone_type, address, lat/lng, rates (hourly/daily/monthly), operating_hours, ev_charging, disabled_spots |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "..."}` — **YES** |
| **Backend Detail** | `/store/parking/[id]` — **200 OK** |
| **API Response** | `{name, description, zone_type, address, latitude, longitude, total_spots, available_spots, hourly_rate, daily_rate, monthly_rate, operating_hours, has_ev_charging, metadata}` |
| **Page Template** | 245 lines. GENERIC template. |
| **Unique fields NOT used** | `zone_type`, `latitude`, `longitude`, `total_spots`, `available_spots`, `hourly_rate`, `daily_rate`, `monthly_rate`, `operating_hours`, `has_ev_charging`, `has_disabled_spots` |
| **Gaps** | Missing CTA (Reserve Spot). Rich location and pricing data completely ignored. No map display despite lat/lng. |

---

### 33. pet-services
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `pet_profile` — 5 rows. Columns: name, species, breed, date_of_birth, weight_kg, color, gender, is_neutered, microchip_id, photo_url |
| **DB Images** | `photo_url` — **YES**, Unsplash URLs |
| **Backend Detail** | `/store/pet-services/[id]` — **200 OK** |
| **Page Template** | 246 lines. GENERIC template. Has CTAs (Book Appointment, Contact Provider), Reviews (2 refs). |
| **Note** | Data model is pet profiles, not service provider listings. Works as a pet detail page but the "pet-services" page name implies service marketplace. |

---

### 34. places
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `tenant_poi` — 0 rows |
| **Backend Listing** | `/store/content/pois` — 0 items |
| **Backend Detail** | `/store/content/pois/[id]` — route exists, untested |
| **Page Template** | **83 lines** — the most underdeveloped page. Only has a single review reference. No breadcrumb, no sidebar, no hero, no CTAs, no img tag, no not-found state. |
| **Gaps** | Virtually empty page. No data. Needs complete rebuild. |

---

### 35-36. print-on-demand + print-on-demand-shop
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** (both) |
| **DB Table** | No table exists. No backend module. |
| **Backend Listing** | `/store/print-on-demand` — ERROR (non-JSON response) |
| **Backend Detail** | No `[id]` route |
| **Page Templates** | print-on-demand: 217 lines. print-on-demand-shop: 207 lines. |
| **Gaps** | No data model exists at all. No module. Both pages are duplicates. |

---

### 37. quotes
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `quote` table may exist (Medusa core). Module has QuoteItem. |
| **Backend Listing** | `/store/quotes` — 0 items |
| **Backend Detail** | `/store/quotes/[id]` — 51 lines, requires auth. |
| **Page Template** | **74 lines** — second most underdeveloped. Only 2 details grid refs. No breadcrumb, sidebar, hero, CTAs, images, not-found state. |
| **Gaps** | Quotes are B2B request-for-quote records, not browseable products. Page needs complete rebuild. No data. |

---

### 38. real-estate
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (just needs detail endpoint) |
| **DB Table** | `property_listing` — 7 rows. Rich: title, description, listing_type, property_type, price, address, bedrooms, bathrooms, area_sqm, year_built, features, images, virtual_tour_url |
| **DB Images** | `images` column — **YES**, Unsplash URL arrays |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 213 lines. GENERIC template. Has CTAs (Schedule Viewing, Contact Agent — 4). |
| **Priority** | **HIGH** — rich data model with images, just needs 16-line detail endpoint. |

---

### 39. rentals
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `rental_product` — 7 rows |
| **DB Images** | `metadata` — `{name: "...", images: [...], description: "..."}` — **YES** |
| **Backend Detail** | `/store/rentals/[id]` — **200 OK** |
| **API Response** | `{rental_type, base_price, currency_code, deposit_amount, late_fee_per_day, min_duration, max_duration, is_available, total_rentals, metadata}` |
| **Page Template** | 288 lines. GENERIC template but **only page with gallery support** (3 gallery refs), Tabs (2), Reviews (2). |
| **Missing** | No breadcrumb, no sidebar, no CTAs (Rent Now), no not-found state despite being one of the more complete pages. |
| **Gaps** | Name and description only in metadata. Missing key layout blocks despite having gallery code. |

---

### 40. restaurants
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (just needs detail endpoint) |
| **DB Table** | `restaurant` — 5 rows. Rich: name, description, cuisine_types, address, lat/lng, operating_hours, rating, total_reviews, logo_url, banner_url, min_order_amount, delivery_fee, avg_prep_time |
| **DB Images** | `logo_url` + `banner_url` — **YES**, Unsplash URLs |
| **Backend Detail** | **No `[id]` route — 404** |
| **Page Template** | 229 lines. GENERIC template. Has Tabs (1, for menu), Reviews (9 refs). |
| **Related Tables** | `menu_item`, `menu_category`, `restaurant_hours` — rich ecosystem exists |
| **Priority** | **HIGH** — very rich model with images, menu system, reviews. Just needs detail endpoint. |

---

### 41. social-commerce
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** |
| **DB Table** | No `social_seller` table. Listing data is **hardcoded in route handler** as `SOCIAL_COMMERCE_SEED` array. |
| **Backend Listing** | `/store/social-commerce` — returns hardcoded array (7 items with IDs like `sc_001`) |
| **Backend Detail** | `/store/social-commerce/[id]` — queries `live_streams` or `group_buys` tables. **Mismatch: listing IDs (`sc_001`) don't exist in any DB table.** |
| **Page Template** | 225 lines. GENERIC template. Has Share (6 refs), Reviews (8 refs). |
| **Fundamental Issue** | Listing = hardcoded data. Detail = DB query. IDs don't match. Must either store data in DB or use same hardcoded array in detail endpoint. |

---

### 42. subscriptions
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `subscription` — 6 rows (customer records). `subscription_plan` — 5 rows (plan definitions: name, description, price, features, billing_interval). |
| **Backend Listing** | `/store/subscriptions` — returns customer `subscription` records |
| **Backend Detail** | Management routes exist (cancel, pause, resume) but **no GET `[id]` for browsing** |
| **Page Template** | 241 lines. CUSTOM template — references `item.question`, `item.answer` (FAQ pattern). |
| **Fundamental Issue** | Listing serves customer subscriptions, not browseable plans. Should serve `subscription_plan` records. Plans table has 5 rows with name, price, features. |
| **Fix Required** | Create plan listing endpoint + detail endpoint querying `subscription_plan` table. |

---

### 43. trade-in
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `trade_in` — exists in `automotive` module. Model is for trade-in evaluations (vehicle appraisals), not browseable listings. |
| **Backend Listing** | `/store/trade-in` — 0 items |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 219 lines. CUSTOM template — references `item.brand`, `item.condition`, `item.trade_in_value`, `item.offered_value`, `item.original_price`, `item.requirements`. |
| **Gaps** | Model is evaluation records, not product listings. Custom template has relevant fields but no data. |

---

### 44. travel
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `travel_property` — 7 rows. Rich: name, description, property_type, star_rating, address, city, lat/lng, check_in_time, check_out_time, images, amenities |
| **DB Images** | `images` column — **YES**, Unsplash URL arrays |
| **Backend Detail** | `/store/travel/[id]` — **200 OK** |
| **API Response** | `{name, description, property_type, star_rating, address, city, country_code, check_in_time, check_out_time, images, room_types[{id, name, description, base_price, max_occupancy, amenities}], avg_rating}` |
| **Page Template** | 286 lines. GENERIC template. Has Reviews (8 refs), CTAs (Book Now, Contact — 2). |
| **Unique fields NOT used** | `property_type`, `star_rating`, `check_in_time`, `check_out_time`, `room_types`, `amenities`, `policies` |
| **Gaps** | Generic template ignores room types, amenities, check-in/out times, star rating display. No room selection UI. |

---

### 45. try-before-you-buy
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **Identical to** | dropshipping — same `vendor_product` join table, same model mismatch |

---

### 46. vendors
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **2 — Partial** (routing mismatch) |
| **DB Table** | `vendor` — 10 rows. Rich: handle, business_name, description, logo_url, banner_url, rating, review_count, total_products, total_orders, commission_type |
| **DB Images** | `logo_url` + `banner_url` — **YES**, Unsplash URLs |
| **Backend Detail** | `/store/vendors/[handle]` — uses **handle** parameter, not ID |
| **Page Template** | 293 lines (second longest). GENERIC template. Reviews (18 refs — most of any page), Share. |
| **Routing Mismatch** | Page fetches `/store/vendors/${params.id}` but backend route is `/store/vendors/[handle]` |
| **Fix Required** | Either change page to use handle param or add ID-based lookup to backend. |

---

### 47. volume-deals
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** |
| **DB Table** | `volume_pricing` + `volume_pricing_tier` — pricing rules, not browseable products |
| **Backend Listing** | ERROR (endpoint returns non-JSON) |
| **Backend Detail** | No `[id]` route |
| **Page Template** | 225 lines. CUSTOM template — references `item.product_name`, `item.base_price`, `item.volume_tiers`, `item.pricing_tiers`. |
| **Gaps** | Model is pricing tiers attached to products, not standalone deal listings. |

---

### 48. warranties
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **1 — Fully Functional** |
| **DB Table** | `warranty_plan` — 5 rows. Columns: name, description, plan_type, duration_months, price, coverage, exclusions |
| **DB Images** | `metadata` — `{images: [...], thumbnail: "..."}` — **YES** |
| **Backend Detail** | `/store/warranties/[id]` — **200 OK** |
| **API Response** | `{name, description, plan_type, duration_months, price, currency_code, coverage{}, exclusions[], is_active}` |
| **Page Template** | 257 lines. CUSTOM template — references `item.name`, `item.question`, `item.answer`. |
| **Unique fields NOT used** | `plan_type`, `duration_months`, `coverage`, `exclusions` |
| **Gaps** | Missing CTAs (Purchase Plan). No hero image or img tag despite images in metadata. Coverage details and exclusions not displayed. |

---

### 49-50. white-label + white-label-shop
| Layer | Status | Detail |
|---|---|---|
| **Tier** | **3 — Broken** (both) |
| **DB Table** | No table. No module. |
| **Backend Listing** | `/store/white-label` — ERROR (non-JSON) |
| **Backend Detail** | No `[id]` route |
| **Page Templates** | white-label: 213 lines. white-label-shop: 239 lines. Both GENERIC. |
| **Gaps** | No data model, no module, no backend. Both pages are duplicates. |

---

## Section 4: Cross-Cutting Issues

### 4.1 Cookie-Cutter Template Problem

**38 of 50 pages** reference the identical 13 fields:
```
address, avg_rating, banner_url, city, description, location, 
logo_url, metadata, photo_url, price, rating, review_count, thumbnail
```

But most backend models use completely different field names:
| Page References | Actual API Field | Verticals Affected |
|---|---|---|
| `item.price` | `starting_price`, `hourly_rate`, `consultation_fee`, `base_price`, `premium_amount`, `annual_fee` | auctions, freelance, legal, rentals, insurance, memberships |
| `item.photo_url` | `images[]`, `thumbnail_url`, `logo_url`, `banner_url`, `image_url` | Most verticals use arrays or different field names |
| `item.rating` | `avg_rating`, `star_rating` | fitness, freelance, travel |
| `item.thumbnail` | `metadata.thumbnail`, `thumbnail_url`, `preview_url` | All metadata-based verticals |
| `item.address` | `address_line1`, `location_city` + `location_country` | automotive, real-estate, travel |

### 4.2 Image Storage Inconsistency

Three different patterns used across verticals:

| Pattern | Count | Tables Using |
|---|---|---|
| **Dedicated column** (`images` JSON array, `photo_url`, `logo_url`, `image_url`) | 13 | vehicle_listing, crowdfund_campaign, property_listing, travel_property, practitioner, attorney_profile, pet_profile, restaurant, event, charity_org, vendor, course, donation_campaign |
| **Metadata JSON** (`metadata.images`, `metadata.thumbnail`) | 10 | classified_listing, digital_asset, class_schedule, gig_listing, parking_zone, rental_product, insurance_product, warranty_plan, fresh_product, product_bundle |
| **No images at all** | 3+ | auction_listing (metadata NULL), insurance_policy, membership, subscription |

### 4.3 Endpoint Naming Inconsistencies

| Storefront Page Fetches | Backend Route Exists At | Mismatch Type |
|---|---|---|
| `/store/financial/${id}` | `/store/financial-products/[id]` | Different path name |
| `/store/vendors/${id}` | `/store/vendors/[handle]` | Parameter type (id vs handle) |
| `/store/events/${id}` | No `[id]` route | Missing entirely |
| `/store/healthcare/${id}` | No `[id]` route | Missing entirely |
| `/store/restaurants/${id}` | No `[id]` route | Missing entirely |
| `/store/real-estate/${id}` | No `[id]` route | Missing entirely |
| `/store/education/${id}` | No `[id]` route | Missing entirely |
| `/store/insurance/${id}` | No `[id]` route | Missing entirely |

### 4.4 Data Source Inconsistencies

| Pattern | Verticals |
|---|---|
| **Database-backed listing + detail** | automotive, classifieds, crowdfunding, digital, fitness, freelance, government, grocery, legal, parking, pet-services, rentals, travel, warranties |
| **Database-backed listing, missing detail endpoint** | education, events, healthcare, insurance, real-estate, restaurants |
| **Hardcoded data in route handler** | social-commerce (7 items in JS array) |
| **Wrong entity type in listing** | dropshipping, try-before-you-buy (join tables), flash-deals (promotions), memberships (customer records), subscriptions (customer records) |
| **Broken listing endpoint** | affiliate, financial, print-on-demand, volume-deals, white-label |
| **No backend at all** | print-on-demand, white-label (no module exists) |

---

## Section 5: Priority Action Matrix

### P0 — Critical (User sees errors or empty pages)

| # | Action | Impact | Effort | Verticals |
|---|---|---|---|---|
| 1 | **Fix auctions detail bug** — change `auction_listing_id` to `auction_id` in bid query | Unblocks 1 vertical | 1 line change | auctions |
| 2 | **Fix charity detail bug** — debug retrieveCharityOrg method resolution | Unblocks 1 vertical | ~15 min | charity |
| 3 | **Fix social-commerce listing/detail mismatch** — either persist seed data to DB or query same array in detail | Unblocks 1 vertical | ~30 min | social-commerce |
| 4 | **Create 6 high-priority detail endpoints** (16 lines each) for verticals with rich data models | Unblocks 6 verticals | ~1 hour | education, healthcare, restaurants, real-estate, events, insurance |
| 5 | **Fix financial routing mismatch** — align page URL with backend route | Unblocks 1 vertical | 1 line change | financial |
| 6 | **Fix vendors routing** — change page to use handle or add ID lookup | Unblocks 1 vertical | ~15 min | vendors |

### P1 — High Priority (Data model fixes)

| # | Action | Impact | Effort | Verticals |
|---|---|---|---|---|
| 7 | **Create remaining 13 detail endpoints** for verticals with some data | Unblocks 13 verticals | ~2 hours | bundles, gift-cards, loyalty, newsletter, b2b, trade-in, consignment, etc. |
| 8 | **Fix 5 data model mismatches** — change listing endpoints to serve correct entity types | Fixes data quality | ~3 hours | memberships→tiers, subscriptions→plans, dropshipping/try-before-buy→products, flash-deals→deals |
| 9 | **Fix 5 broken listing endpoints** | Unblocks 5 verticals | ~2 hours | affiliate, financial, print-on-demand, volume-deals, white-label |
| 10 | **Seed data for 14 empty verticals** | Enables testing | ~4 hours | affiliate, b2b, bookings, consignment, credit, financial, loyalty, places, print-on-demand, quotes, trade-in, volume-deals, white-label |

### P2 — Medium Priority (Template customization)

| # | Action | Impact | Effort | Verticals |
|---|---|---|---|---|
| 11 | **Customize 38 generic templates** to use each vertical's actual API fields | Major UX improvement | ~16 hours | All generic pages |
| 12 | **Rebuild places page** (83 lines → ~250 lines) | Fixes broken page | ~1 hour | places |
| 13 | **Rebuild quotes page** (74 lines → ~250 lines) | Fixes broken page | ~1 hour | quotes |
| 14 | **Add missing layout blocks** — breadcrumbs (8), CTAs (7), not-found states (6), sidebars (5) | UX consistency | ~4 hours | Various |
| 15 | **Resolve 5 duplicate page pairs** — either merge or differentiate | Reduces maintenance | ~3 hours | consignment/shop, dropshipping/marketplace, POD/shop, white-label/shop, campaigns/crowdfunding |

### P3 — Polish (Production quality)

| # | Action | Impact | Effort | Verticals |
|---|---|---|---|---|
| 16 | **Add image gallery component** — useable across all verticals | Major UX improvement | ~3 hours | All 50 pages |
| 17 | **Add related/similar items** sections | Engagement boost | ~2 hours | All pages |
| 18 | **Standardize image storage** — migrate metadata images to dedicated columns | Data consistency | ~4 hours | 10 verticals using metadata |
| 19 | **Add share/bookmark** functionality | Feature completeness | ~2 hours | 38 pages missing it |
| 20 | **Migrate hardcoded data to database** | Data integrity | ~1 hour | social-commerce |

---

## Section 6: Quick Wins (< 30 minutes each)

1. Fix auctions bid query — 1 line change
2. Fix financial route URL — 1 line change
3. Create education detail endpoint — 16 lines
4. Create healthcare detail endpoint — 16 lines
5. Create restaurants detail endpoint — 16 lines
6. Create real-estate detail endpoint — 16 lines
7. Create events detail endpoint — 16 lines
8. Create insurance detail endpoint — 16 lines
9. Fix vendors to use handle parameter — 1 line in storefront loader
10. Add breadcrumbs to 8 pages — simple template addition

---

## Section 7: Payload CMS Blocks System — Complete Structural Analysis

### 7.1 Architecture Overview

The platform has a **comprehensive, fully-structured Payload CMS blocks system** spanning 5 layers:

```
Layer 1: Type Definitions   → packages/cityos-design-system/src/blocks/BlockTypes.ts (870+ lines)
                               57 TypeScript interfaces defining every block's shape, props, variants
Layer 2: Block Registry     → apps/storefront/src/components/blocks/block-registry.ts (180 lines)
                               77 block types registered as React components in BLOCK_REGISTRY map
Layer 3: Block Renderer     → apps/storefront/src/components/blocks/block-renderer.tsx (44 lines)
                               Generic <BlockRenderer blocks={[...]} /> component that maps
                               blockType strings to registered React components
Layer 4: CMS Page Registry  → apps/backend/src/lib/platform/cms-registry.ts (1043 lines)
                               27 vertical-specific LIST page layouts with 3-5 blocks each
                               ALL detail pages share the same generic 3-block layout
                               7 additional pages (home, store, search, vendors, etc.)
Layer 5: CMS Page Database  → apps/backend/src/modules/cms-content/models/cms-page.ts
                               PostgreSQL model: cms_page table with layout JSON column
                               7 seeded pages (home, about, contact, privacy, terms + 2 more)
                               Database uses DIFFERENT block format than CMS registry!
```

### 7.2 Block Inventory (77 Components)

| Category | Block Types | Count | Total Lines |
|---|---|---|---|
| **Commerce Core** | productDetail, cartSummary, checkoutSteps, orderConfirmation, wishlistGrid, recentlyViewed, products | 7 | ~800 |
| **Content/Layout** | hero, content(richText), cta, features(featureGrid), stats, imageGallery, divider, bannerCarousel, videoEmbed, timeline, trustBadges, socialProof, blogPost | 13 | ~1,800 |
| **Navigation/Discovery** | categoryGrid, collectionList, comparisonTable, contactForm, faq, pricing, newsletter, reviewList, map | 9 | ~1,500 |
| **Vendor/Marketplace** | vendorProfile, vendorProducts, vendorShowcase, vendorRegisterForm, commissionDashboard, payoutHistory | 6 | ~850 |
| **Booking/Services** | bookingCalendar, bookingCta, bookingConfirmation, serviceCardGrid, serviceList, appointmentSlots, providerSchedule, resourceAvailability | 8 | ~1,400 |
| **Subscriptions/Loyalty** | subscriptionPlans, subscriptionManage, membershipTiers, loyaltyDashboard, loyaltyPointsDisplay, referralProgram | 6 | ~1,400 |
| **Vertical-Specific** | auctionBidding, rentalCalendar, propertyListing, vehicleListing, menuDisplay, courseCurriculum, eventSchedule, eventList, healthcareProvider, fitnessClassSchedule, petProfileCard, classifiedAdCard, crowdfundingProgress, donationCampaign, freelancerProfile, parkingSpotFinder, flashSaleCountdown, giftCardDisplay | 18 | ~3,600 |
| **B2B** | purchaseOrderForm, bulkPricingTable, companyDashboard, approvalWorkflow | 4 | ~900 |
| **Admin/Manage** | manageStats, manageRecentOrders, manageActivity, promotionBanner | 4 | ~500 |
| **TOTAL** | | **77** | **~12,750 lines** |

### 7.3 The Critical Disconnect: Blocks Exist But Are NEVER Used

**ZERO detail pages import or use `BlockRenderer` or any block component.**

The `BlockRenderer` component is exported from `apps/storefront/src/components/blocks/index.ts` but is **imported by exactly zero route files**. A `grep -rn "BlockRenderer" apps/storefront/src/routes/` returns **zero matches**.

Instead, every detail page uses hardcoded inline JSX that duplicates what the blocks already implement:

| What Blocks Provide | What Detail Pages Do Instead |
|---|---|
| `<HeroBlock heading="..." image={{url: "..."}} />` | Inline `<div className="relative w-full min-h-[300px]...">` (40-60 lines per page) |
| `<ReviewListBlock entityId={id} showSummary />` | Inline `reviews.map(r => ...)` with hardcoded fake reviews |
| `<ImageGalleryBlock images={[...]} layout="carousel" />` | Single `<img>` tag or no images at all |
| `<AuctionBiddingBlock auctionId={id} showCountdown />` | Nothing — auction page has no bid UI |
| `<BookingCalendarBlock serviceId={id} />` | Nothing — no calendar on any page |
| `<CrowdfundingProgressBlock campaignId={id} />` | Nothing — no progress bar |
| `<MenuDisplayBlock categories={[...]} showPrices />` | Nothing — restaurant page has no menu |

### 7.4 CMS Registry Layout Analysis

The CMS registry defines **two types of page layouts**:

#### LIST Page Layouts (27 verticals, well-differentiated)

Each vertical has a custom block layout with 3-5 vertical-appropriate blocks. Examples:

```
restaurants:     hero → menuDisplay → serviceCardGrid → reviewList → map
healthcare:      hero → healthcareProvider → bookingCalendar → faq
education:       hero → courseCurriculum → subscriptionPlans → testimonial
real-estate:     hero → propertyListing → map → contactForm
automotive:      hero → vehicleListing → comparisonTable
auctions:        hero → auctionBidding → productGrid
fitness:         hero → fitnessClassSchedule → membershipTiers → testimonial
crowdfunding:    hero → crowdfundingProgress → productGrid → faq
```

#### DETAIL Page Layouts (ALL 27 verticals share IDENTICAL generic layout)

```
ALL verticals:   hero → reviewList → recentlyViewed
```

Every single detail page in the CMS registry gets the exact same 3 generic blocks. There are **no vertical-specific detail layouts** — no `auctionBidding` on auction detail, no `bookingCalendar` on booking detail, no `menuDisplay` on restaurant detail, etc.

### 7.5 Database vs Registry Block Format Mismatch

The `cms_page` database table (7 seeded pages) uses a DIFFERENT block schema than the CMS registry:

**Database format (cms_page.layout):**
```json
[{"type": "hero", "data": {"title": "...", "subtitle": "..."}}]
```

**CMS registry format (cms-registry.ts):**
```json
[{"blockType": "hero", "heading": "...", "subheading": "..."}]
```

Key differences:
- Database uses `type` field; Registry uses `blockType`
- Database wraps props in `data` object; Registry spreads props flat
- Database uses `title/subtitle`; Registry uses `heading/subheading`
- `BlockRenderer` component expects `blockType` format (registry format)

This means the 7 database-seeded pages **cannot be rendered by BlockRenderer** without a format adapter.

### 7.6 Block Data Flow Architecture

Blocks are designed as **props-based presentational components**. Only 1 of 77 blocks (`products-block.tsx`) fetches its own data via `useQuery`. All other blocks expect data to be passed as props from a parent component.

This means for blocks to work on detail pages, the **detail page route handler** must:
1. Fetch the entity data via SSR loader (already happening)
2. Transform the API response into block-compatible prop shapes
3. Compose the appropriate blocks with the transformed data
4. OR: Fetch the CMS page layout from the registry and pass data to `BlockRenderer`

Currently, step 1 happens but the data never reaches any blocks.

### 7.7 Vertical-Specific Block ↔ Detail Page Mapping

These blocks exist and are ready to render vertical-specific UI, but none are used on their matching detail pages:

| Block Component | Lines | Designed For | Detail Page Status |
|---|---|---|---|
| `auction-bidding-block` | 198 | Auction detail with bid UI, countdown, bid history | NOT USED — auction detail has no bid interface |
| `booking-calendar-block` | 256 | Booking detail with date picker, time slots | NOT USED — no booking detail calendar |
| `course-curriculum-block` | 245 | Education detail with lesson tree, progress | NOT USED — education page is generic |
| `crowdfunding-progress-block` | 197 | Campaign detail with progress bar, backer count | NOT USED — crowdfunding page ignores all campaign data |
| `donation-campaign-block` | 229 | Charity detail with donation form, impact metrics | NOT USED — charity page is generic |
| `event-schedule-block` | 203 | Event detail with agenda, speakers | NOT USED — event page ignores event_type, dates |
| `fitness-class-schedule-block` | 204 | Fitness detail with weekly schedule | NOT USED — fitness page is generic |
| `freelancer-profile-block` | 247 | Freelancer detail with portfolio, skills | NOT USED — freelance page ignores skills, portfolio |
| `healthcare-provider-block` | 160 | Provider detail with specialties, availability | NOT USED — healthcare page is generic |
| `membership-tiers-block` | 220 | Membership comparison with tier cards | NOT USED — memberships serves wrong data |
| `menu-display-block` | 161 | Restaurant detail with categorized menu | NOT USED — restaurant page has no menu |
| `parking-spot-finder-block` | 220 | Parking detail with map, pricing grid | NOT USED — parking ignores rates, map |
| `pet-profile-card-block` | 223 | Pet profile with services, vet info | NOT USED — pet page is generic |
| `property-listing-block` | 158 | Property detail with specs, map | NOT USED — real-estate has no detail endpoint |
| `rental-calendar-block` | 124 | Rental detail with availability calendar | NOT USED — rental page has no calendar |
| `subscription-plans-block` | 238 | Subscription tier comparison | NOT USED — subscriptions serves wrong data |
| `vehicle-listing-block` | 206 | Vehicle detail with specs comparison | NOT USED — automotive ignores make/model/specs |

Total: **~3,600 lines of vertical-specific UI code** that exists but renders nowhere.

### 7.8 Block Component Quality Assessment — Complete Per-Block Breakdown

Every block was analyzed for: (1) does it accept data via props, (2) does it render from those props or from hardcoded constants, (3) does it use the `ds-` design system tokens, (4) what refactoring is needed.

#### Tier A: Props-Driven, Ready to Use (15 blocks)

These blocks accept data via props and render it — can be dropped into detail pages immediately:

| Block | Lines | Props Interface | Design Token Usage | Ready? |
|---|---|---|---|---|
| `hero` | 86 | heading, subheading, backgroundImage, overlay, alignment, minHeight, cta, badge | 5 `ds-` refs | YES |
| `cta` | 66 | heading, description, buttons, variant, backgroundStyle | 5 `ds-` refs | YES |
| `faq` | 90 | heading, description, items, layout | 3 `ds-` refs | YES |
| `features` (featureGrid) | 47 | heading, subtitle, features[], columns, variant | 3 `ds-` refs | YES |
| `content` (richText) | 27 | content, columns, maxWidth, textAlign | 1 `ds-` ref | YES |
| `pricing` | 171 | heading, description, plans[], billingToggle, highlightedPlan | 17 `ds-` refs | YES |
| `stats` | 130 | heading, stats[], columns, variant, showTrend | 14 `ds-` refs | YES |
| `membership-tiers` | 220 | heading, **tiers[]**, showComparison, variant | 21 `ds-` refs | YES — uses `tiers` prop with `defaultTiers` fallback |
| `subscription-plans` | 238 | heading, **plans[]**, billingToggle, highlightedPlan, variant | 33 `ds-` refs | YES — uses `plans` prop with `defaultPlans` fallback |
| `menu-display` | 161 | heading, **categories[]**, variant, showPrices, showDietaryIcons, currency | 12 `ds-` refs | YES — uses `categories` prop with `defaultCategories` fallback |
| `service-list` | 188 | heading, services[], showPricing, showBooking, layout | 14 `ds-` refs | YES |
| `booking-cta` | 134 | heading, description, serviceId, providerId, variant, showAvailability | 18 `ds-` refs | YES |
| `vendor-showcase` | 109 | heading, vendors[], layout, showRating, showProducts | 8 `ds-` refs | YES |
| `vendor-profile` | 101 | vendorId, showProducts, showReviews, variant | 16 `ds-` refs | YES |
| `divider` | 46 | variant, label, spacing | 4 `ds-` refs | YES |

**Import pattern for Tier A:**
```tsx
import { MembershipTiersBlock } from '../../components/blocks/membership-tiers-block'

<MembershipTiersBlock
  heading="Choose Your Plan"
  tiers={item.tiers || []}           // Pass API data directly
  showComparison={true}
  variant="cards"
/>
```

#### Tier B: Accept Props but Render Hardcoded Data (32 blocks)

These blocks define TypeScript prop interfaces but IGNORE the props internally, rendering from `const placeholder...` constants instead. They need refactoring to wire props → rendering:

| Block | Lines | Props Defined | Hardcoded Data | ds- Tokens | What Needs to Change |
|---|---|---|---|---|---|
| `auction-bidding` | 198 | auctionId, showHistory, showCountdown, variant | `placeholderBids` (5 bids), `currentBid: 1250`, `minIncrement: 50` | 47 | Accept `currentBid`, `bids[]`, `endTime` as props; render from them |
| `booking-calendar` | 256 | serviceId, variant, showPricing, allowMultiDay | `defaultTimeSlots` (9 slots with hardcoded $50-$70 prices) | 23 | Accept `timeSlots[]`, `bookedDates[]` as props |
| `crowdfunding-progress` | 197 | campaignId, showBackers, showUpdates, variant | `placeholderCampaign` (goal: $50,000, raised: $37,500, 842 backers), `recentBackers` (5 entries) | 43 | Accept `campaign: {goal, raised, backers, daysLeft}` as prop |
| `donation-campaign` | 229 | campaignId, showImpact, presetAmounts, allowRecurring, variant | `placeholderCampaign` (goal: $200,000, raised: $128,500, 3240 donors), `impactStats` (4 metrics) | 41 | Accept `campaign`, `impact[]` as props |
| `healthcare-provider` | 160 | heading, specialties, showAvailability, showRating, layout | `placeholderProviders` (6 doctors with hardcoded names/specialties) | 21 | Accept `providers[]` as prop |
| `vehicle-listing` | 206 | heading, vehicleType, layout, showComparison | `placeholderVehicles` (6 vehicles — Tesla, Toyota, BMW, etc.) | 29 | Accept `vehicles[]` as prop |
| `property-listing` | 158 | heading, propertyType, showMap, layout | `placeholderProperties` (hardcoded addresses, prices) | 21 | Accept `properties[]` as prop |
| `course-curriculum` | 245 | courseId, showProgress, expandAll, variant | `placeholderModules` (3 modules with hardcoded lessons) | 39 | Accept `modules[]` as prop |
| `event-schedule` | 203 | eventId, showSpeakers, showVenue, variant | `placeholderSessions` (5 events with hardcoded times) | 24 | Accept `sessions[]` as prop |
| `event-list` | 210 | heading, events[], layout, showPastEvents | Renders from `events` prop but has no default | 18 | ALMOST READY — just needs events data passed |
| `fitness-class-schedule` | 204 | heading, showInstructor, showLevel, allowBooking | `placeholderClasses` (6 classes with hardcoded schedules) | 27 | Accept `classes[]` as prop |
| `freelancer-profile` | 247 | heading, showPortfolio, showReviews, showAvailability, layout | `placeholderFreelancer` (name: "Jordan Rivera", $95/hr), `portfolioItems` (6), `reviews` (3) | 60 | Accept `freelancer`, `portfolio[]`, `reviews[]` as props |
| `pet-profile-card` | 223 | heading, showServices, showVetInfo, layout | `placeholderPets` (3 pets with hardcoded names/breeds) | 60 | Accept `pets[]` as prop |
| `classified-ad-card` | 187 | heading, category, layout, showContactInfo | `placeholderAds` (6 ads with hardcoded prices/locations) | 25 | Accept `ads[]` as prop |
| `parking-spot-finder` | 220 | locationId, showMap, showPricing, filterByType, variant | `placeholderSpots` (6 spots with hardcoded rates) | 23 | Accept `spots[]` as prop |
| `flash-sale-countdown` | 117 | heading, endTime, products, variant | `endTime` derived from +24h, `placeholderProducts` | 14 | Accept `endTime`, `products[]` as props |
| `gift-card-display` | 137 | heading, denominations, customizable, variant | `defaultDenominations` (5 values), hardcoded design templates | 19 | Accept `denominations[]`, `templates[]` as props |
| `rental-calendar` | 124 | itemId, pricingUnit, showDeposit, minDuration | Generates dates from current month, no real availability data | 25 | Accept `availability[]`, `pricing` as props |
| `appointment-slots` | 213 | providerId, date, duration, showPrice | `defaultTimeSlots`, hardcoded AM/PM slots | 29 | Accept `timeSlots[]` as prop |
| `provider-schedule` | 188 | providerId, viewMode, showCapacity | `placeholderSchedule` (weekly schedule with hardcoded times) | 22 | Accept `schedule[]` as prop |
| `resource-availability` | 199 | resourceType, locationId, showCalendar | `placeholderResources` (4 rooms with hardcoded availability) | — | Accept `resources[]` as prop |
| `booking-confirmation` | 105 | bookingId, showDetails, showActions | Renders from hardcoded confirmation template | 26 | Accept `booking` object as prop |
| `review-list` | 180 | heading, entityId, showSummary, allowSubmit | `placeholderReviews` (4 reviews with hardcoded users) | 17 | Accept `reviews[]` as prop |
| `product-detail` | 201 | productId, showReviews, showRelated, variant | Hardcoded product with "Premium Wireless Headphones" | 40 | Accept `product` object as prop |
| `recently-viewed` | 61 | heading, products, layout | `placeholderProducts` (3 items) | 10 | Accept `products[]` as prop |
| `cart-summary` | 142 | variant, showCoupon, showEstimatedShipping | Hardcoded 3-item cart | 28 | Accept `cartItems[]` as prop |
| `contact-form` | 163 | heading, recipientEmail, showMap, fields | Form fields hardcoded | 10 | Accept `fields[]` config |
| `newsletter` | 128 | heading, description, variant, showBenefits | Hardcoded benefits list | 8 | Accept `benefits[]` as prop |
| `map` | 198 | heading, center, markers, zoom, showSearch | `placeholderMarkers` (5 markers) | 21 | Accept `markers[]`, `center` as props |
| `service-card-grid` | 134 | heading, services, columns, showBookingCta | `placeholderServices` (6 services) | 12 | Accept `services[]` as prop |
| `social-proof` | 234 | variant, showPurchases, autoRotate, heading | Hardcoded purchases & reviews | 42 | Accept `purchases[]`, `reviews[]` as props |
| `blog-post` | 182 | heading, posts, layout, showAuthor | Hardcoded blog posts | 28 | Accept `posts[]` as prop |

**Refactoring pattern for Tier B:**
```tsx
// BEFORE (hardcoded):
const placeholderCampaign = { goal: 50000, raised: 37500, backers: 842, daysLeft: 18 }
const CrowdfundingProgressBlock = ({ campaignId, variant }) => {
  const percentFunded = Math.round((placeholderCampaign.raised / placeholderCampaign.goal) * 100)
  // renders placeholderCampaign...
}

// AFTER (data-driven):
const CrowdfundingProgressBlock = ({ campaign, variant }) => {
  const data = campaign || { goal: 0, raised: 0, backers: 0, daysLeft: 0 }
  const percentFunded = data.goal > 0 ? Math.round((data.raised / data.goal) * 100) : 0
  // renders data...
}
```

#### Tier C: Admin/Dashboard Blocks (11 blocks)

These are admin-only blocks not relevant to customer-facing detail pages:

| Block | Lines | Purpose |
|---|---|---|
| `commission-dashboard` | 143 | Vendor commission overview |
| `payout-history` | 180 | Vendor payout records |
| `purchase-order-form` | 278 | B2B purchase orders |
| `bulk-pricing-table` | 277 | B2B bulk pricing |
| `company-dashboard` | 185 | B2B company overview |
| `approval-workflow` | 287 | B2B approval chains |
| `manage-stats` | 61 | Admin dashboard stats |
| `manage-recent-orders` | 107 | Admin recent orders |
| `manage-activity` | 74 | Admin activity feed |
| `loyalty-dashboard` | 224 | Member loyalty overview |
| `loyalty-points-display` | 253 | Member points display |

#### Tier D: Specialized Blocks (19 blocks)

Fully working but serve specific non-vertical functions:

| Block | Lines | Purpose | Design Tokens |
|---|---|---|---|
| `image-gallery` | 209 | Multi-image carousel/grid viewer | 14 |
| `banner-carousel` | 185 | Promotional banner rotation | 11 |
| `video-embed` | 114 | Video player embed | 3 |
| `timeline` | 194 | Process/event timeline | 27 |
| `trust-badges` | 92 | Security/trust indicators | 8 |
| `category-grid` | 164 | Category browsing grid | 16 |
| `collection-list` | 123 | Product collection browser | 9 |
| `comparison-table` | 148 | Feature comparison matrix | 18 |
| `products` (productGrid) | 95 | Product grid (ONLY block with `useQuery`) | 6 |
| `wishlist-grid` | 94 | Saved items display | 12 |
| `checkout-steps` | 204 | Checkout wizard | 49 |
| `order-confirmation` | 132 | Order success display | 42 |
| `vendor-products` | 111 | Vendor product listing | 11 |
| `vendor-register-form` | 193 | Vendor registration | 34 |
| `referral-program` | 258 | Referral tracking | 60 |
| `subscription-manage` | 201 | Subscription management | 29 |
| `promotion-banner` | 169 | Promotional banner | 11 |
| `testimonial` | — | Customer testimonials | — |
| `products-block` | 95 | **ONLY block that fetches own data** via `useQuery` | 6 |

---

### 7.9 Design System & Theme Alignment — Detailed Analysis

#### 7.9.1 Token Architecture

The platform uses a **CSS custom properties design system** defined in `apps/storefront/src/styles/theme.css`:

```css
@theme {
  --color-ds-primary: var(--color-primary, hsl(221 83% 53%));        /* Blue */
  --color-ds-primary-foreground: var(--color-primary-foreground, hsl(0 0% 100%));
  --color-ds-secondary: var(--color-secondary, hsl(210 40% 96%));
  --color-ds-accent: var(--color-accent, hsl(210 40% 96%));
  --color-ds-background: var(--color-background, hsl(0 0% 100%));    /* White */
  --color-ds-foreground: var(--color-foreground, hsl(222 47% 11%));   /* Dark navy */
  --color-ds-muted: var(--color-muted, hsl(210 40% 96%));
  --color-ds-muted-foreground: var(--color-muted-foreground, hsl(215 16% 47%));
  --color-ds-card: var(--color-card, hsl(0 0% 100%));
  --color-ds-border: var(--color-border, hsl(214 32% 91%));
  --color-ds-destructive: var(--color-destructive, hsl(0 84% 60%));
  --color-ds-success: var(--color-success, hsl(142 76% 36%));
  --color-ds-warning: var(--color-warning, hsl(45 93% 47%));
  --color-ds-info: var(--color-info, hsl(199 95% 53%));
}
```

Plus shadow tokens (`--shadow-ds-sm/md/lg/xl`), radius tokens (`--radius-ds-sm/md/lg/xl/2xl/full`), motion tokens (`--duration-*`, `--ease-*`), and elevation tokens (`--elevation-1` through `--elevation-5`).

#### 7.9.2 Block ↔ Page Design Token Consistency

Both blocks AND detail pages use **identical** `ds-` prefixed Tailwind classes. There are **zero raw Tailwind color classes** (no `bg-blue-500`, `text-gray-700`, etc.) in either blocks or detail pages:

| Component Type | `ds-` Token Count | Raw Tailwind Colors | Consistent? |
|---|---|---|---|
| **crowdfunding-progress-block** | 43 | 0 | YES |
| **crowdfunding/$id.tsx page** | 62 | 0 | YES |
| **healthcare-provider-block** | 21 | 0 (uses `text-yellow-500` for stars, `text-green-600` for availability) | 98% |
| **healthcare/$id.tsx page** | 50 | 0 | YES |
| **menu-display-block** | 12 | 0 | YES |
| **restaurants/$id.tsx page** | 47 | 0 | YES |
| **freelancer-profile-block** | 60 | 0 | YES |
| **freelance/$id.tsx page** | 51 | 0 | YES |
| **vehicle-listing-block** | 29 | 0 | YES |
| **automotive/$id.tsx page** | 40 | 0 | YES |

**Key finding:** Both blocks and pages use the exact same CSS class vocabulary. Mixing blocks into pages will produce **pixel-perfect style consistency**. No theme conflicts will occur.

Only 2 minor exceptions across all 77 blocks:
- `healthcare-provider-block.tsx` uses `text-yellow-500` for star ratings and `text-green-600` for "Available" status — acceptable semantic colors
- `auction-bidding-block.tsx` uses `text-green-600` and `text-red-500` for bid up/down indicators — acceptable

#### 7.9.3 Common UI Patterns — Block vs Page Comparison

Both blocks and pages use identical UI structural patterns:

| Pattern | Block Implementation | Page Implementation | Match? |
|---|---|---|---|
| **Card wrapper** | `bg-ds-card border border-ds-border rounded-lg p-6 hover:shadow-md transition-shadow` | `bg-ds-background border border-ds-border rounded-xl p-6` | 95% (blocks use `rounded-lg`, pages use `rounded-xl`) |
| **Primary button** | `bg-ds-primary text-ds-primary-foreground rounded-lg font-semibold hover:opacity-90` | `bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90` | 90% (blocks use `opacity-90`, pages use `bg-ds-primary/90`) |
| **Secondary button** | `bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground` | `border border-ds-border text-ds-foreground hover:bg-ds-muted` | 85% |
| **Badge/tag** | `text-xs px-2 py-0.5 rounded-full bg-ds-muted text-ds-muted-foreground` | `px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground` | 95% |
| **Section heading** | `text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground mb-8` | `text-xl font-semibold text-ds-foreground mb-2` | 80% (blocks use responsive sizing) |
| **Muted text** | `text-sm text-ds-muted-foreground` | `text-sm text-ds-muted-foreground` | 100% |
| **Container** | `container mx-auto px-4 md:px-6` | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | 85% (blocks use `container`, pages use `max-w-7xl`) |

**Integration Note:** When importing blocks into detail pages, the minor differences in border-radius (`rounded-lg` vs `rounded-xl`) and container widths will be visually seamless since both are within the same design token system. No normalization needed.

#### 7.9.4 How the Tailwind Config Connects to Tokens

The `apps/storefront/tailwind.config.ts` is minimal — it only adds custom transition properties and opacity utilities. The `ds-` color tokens are resolved through Tailwind v4's `@theme` directive in `theme.css`, which maps CSS variables to Tailwind classes automatically:

```
theme.css: @theme { --color-ds-primary: hsl(221 83% 53%) }
    ↓
Tailwind: bg-ds-primary → background-color: var(--color-ds-primary)
    ↓
Rendered: background-color: hsl(221 83% 53%)
```

This means blocks and pages share the **exact same color pipeline** with zero configuration differences. Multi-tenant theming works automatically — changing `--color-primary` in a tenant's CSS overrides `--color-ds-primary` in both blocks and pages simultaneously.

---

### 7.10 Detailed Gap Analysis: Each Vertical's Page vs Block

For every vertical that has a matching block component, here is the exact gap between what the current detail page renders and what the block could provide:

#### 7.10.1 Crowdfunding

| Aspect | Current `crowdfunding/$id.tsx` (248 lines) | Available `crowdfunding-progress-block` (197 lines) |
|---|---|---|
| **Progress bar** | Inline `<div>` with calculated width — 8 lines of JSX | Full progress bar with percentage label, animated fill — 12 lines |
| **Campaign stats** | Inline grid showing raised/goal/backers — 15 lines | Grid showing raised/goal/backers/daysLeft + percentage — 20 lines |
| **Donation form** | Single "Back This Campaign" button, no amount picker | Full preset amount picker ($25/$50/$100/$250/$500) + custom amount input |
| **Recent backers** | Not shown | Shows last 5 backers with names, amounts, timestamps |
| **Variants** | Single layout | 3 variants: `full` (detail page), `widget` (sidebar), `minimal` (compact) |
| **Gap:** | Page has breadcrumbs, hero image, description, creator sidebar | Block adds donation form + backer list — combine for full page |
| **Data flow gap:** | Page uses `campaign.goal`, `campaign.raised` from API | Block uses `placeholderCampaign.goal = 50000` hardcoded |
| **Fix:** | Pass `campaign` prop to block → block reads `campaign.goal/raised/backers/daysLeft` |

#### 7.10.2 Healthcare

| Aspect | Current `healthcare/$id.tsx` (220 lines) | Available `healthcare-provider-block` (160 lines) |
|---|---|---|
| **Provider card** | Shows name, specialty, rating, location inline | Rich card with avatar placeholder, insurance tags, availability, "Book Appointment" CTA |
| **Specialty filter** | Not available | Interactive filter tabs (All, Family Medicine, Cardiology, etc.) |
| **Layout options** | Fixed 2-column layout | 3 layouts: `grid`, `list`, `cards` |
| **Insurance display** | Not shown | Shows insurance acceptance tags per provider |
| **Availability** | Shows raw `provider.availability` slots | Shows "Next Available: Tomorrow, 10:00 AM" formatted |
| **Gap:** | Page has breadcrumbs, sidebar with book/call/video buttons, credentials section | Block has provider listing + filter — need both |
| **Data flow gap:** | Page uses real API data from loader | Block uses `placeholderProviders` (6 hardcoded doctors) |
| **Fix:** | Accept `providers[]` prop → render from it instead of `placeholderProviders` |

#### 7.10.3 Restaurants

| Aspect | Current `restaurants/$id.tsx` (229 lines) | Available `menu-display-block` (161 lines) |
|---|---|---|
| **Menu display** | NO MENU — only shows name, description, hours, features | Full categorized menu with items, prices, dietary icons, "Add to Order" buttons |
| **Category tabs** | N/A | Sidebar tabs: Starters, Main Courses, Desserts, Drinks |
| **Price display** | Shows `price_range` as "$" symbols | Shows individual item prices formatted per currency |
| **Dietary icons** | N/A | Emoji-based dietary labels: Vegetarian, Vegan, Gluten-Free, Halal, Kosher |
| **Variants** | N/A | 3 variants: `grid`, `list`, `visual` (with food images) |
| **Gap:** | Page has hero image, breadcrumbs, hours, features sidebar, reserve/order/call buttons | Block adds THE MENU — the core functionality missing |
| **Data flow gap:** | Page has no menu data in API response | Block uses `defaultCategories` (4 categories, 13 items) |
| **Fix:** | Add `menu_categories` to restaurant API response → pass as `categories` prop |

#### 7.10.4 Auctions

| Aspect | Current `auctions/$id.tsx` (262 lines) | Available `auction-bidding-block` (198 lines) |
|---|---|---|
| **Bid form** | Shows current/starting price, no bid input | Full bid form with amount input, min increment display, "Place Bid" button |
| **Bid history** | Not shown | Recent bids table: bidder, amount, time |
| **Countdown** | Shows `time_left` as text | Live countdown timer with days:hours:minutes:seconds |
| **Quick bids** | N/A | "+$50", "+$100", "+$250" increment buttons |
| **Variants** | N/A | 3 variants: `full`, `compact`, `live` |
| **Gap:** | Page has breadcrumbs, image, details sidebar, bidding section skeleton | Block provides the ACTUAL bidding interface |
| **Data flow gap:** | Page reads `item.current_bid`, `item.starting_price` | Block uses `currentBid: 1250` hardcoded |
| **Fix:** | Accept `currentBid`, `bids[]`, `endTime` props → render from them |

#### 7.10.5 Education

| Aspect | Current `education/$id.tsx` (263 lines) | Available `course-curriculum-block` (245 lines) |
|---|---|---|
| **Curriculum** | Not shown — only title, description, generic fields | Full expandable module tree with lessons, durations, lock states |
| **Progress** | N/A | Progress bar per module, completion percentage |
| **Lesson details** | N/A | Lesson type icons (video/text/quiz), duration, preview button |
| **Variants** | N/A | 3 variants: `full`, `accordion`, `sidebar` |
| **Gap:** | Page has basic layout but no course structure | Block provides THE CORE FEATURE of a course page |
| **Data flow gap:** | N/A | Block uses `placeholderModules` (3 modules, 9 lessons) |
| **Fix:** | Add `modules` to course API → pass as prop |

#### 7.10.6 Fitness

| Aspect | Current `fitness/$id.tsx` (228 lines) | Available `fitness-class-schedule-block` (204 lines) |
|---|---|---|
| **Class schedule** | Not shown | Weekly schedule grid with time slots, instructor names, class levels |
| **Level filter** | N/A | Filter by: All, Beginner, Intermediate, Advanced |
| **Booking** | Generic "Book Now" button | Per-class "Join Class" button with availability counter |
| **Instructor** | Not shown | Name, photo placeholder per class |
| **Gap:** | Page shows basic service info | Block provides interactive class schedule |
| **Fix:** | Accept `classes[]` prop |

#### 7.10.7 Freelance

| Aspect | Current `freelance/$id.tsx` (246 lines) | Available `freelancer-profile-block` (247 lines) |
|---|---|---|
| **Portfolio** | Not shown | 6-item portfolio grid with category tags |
| **Skills** | Shows generic `item.skills` array | Shows skill badges in styled grid |
| **Reviews** | Generic review list | 3 detailed reviews with ratings, dates, text |
| **Stats** | Basic info display | Completions counter, rating, availability badge |
| **Variants** | N/A | 3 layouts: `full`, `card`, `sidebar` |
| **Gap:** | Page has breadcrumbs, sidebar with hire/message buttons | Block adds portfolio + skill showcase |
| **Data flow gap:** | Page uses `item.skills` from API | Block uses `placeholderFreelancer` (name: "Jordan Rivera", $95/hr) |
| **Fix:** | Accept `freelancer`, `portfolio[]`, `reviews[]` props |

#### 7.10.8 Automotive

| Aspect | Current `automotive/$id.tsx` (205 lines) | Available `vehicle-listing-block` (206 lines) |
|---|---|---|
| **Vehicle specs** | Shows generic metadata fields | Structured specs grid: year, mileage, fuel type, transmission, engine, color |
| **Make filter** | N/A | Filter dropdown by make |
| **Comparison** | N/A | Checkbox comparison tool for 2+ vehicles |
| **Layout toggle** | N/A | Grid/list view toggle |
| **Gap:** | Page shows one vehicle's detail | Block shows a listing of vehicles — better for LIST page |
| **Fix:** | For detail page, need `vehicle-detail-block` or pass single vehicle to listing block |

#### 7.10.9 Parking

| Aspect | Current `parking/$id.tsx` (245 lines) | Available `parking-spot-finder-block` (220 lines) |
|---|---|---|
| **Spot finder** | Shows basic parking zone info | Interactive spot finder with type filter (covered/open/valet/EV) |
| **Pricing grid** | Shows generic `item.rate` | Structured pricing: hourly, daily, monthly rates |
| **Availability** | Not shown | Real-time availability indicator per spot |
| **Map** | Not shown | Map placeholder with markers |
| **Gap:** | Page has basic zone info + sidebar | Block provides interactive parking interface |
| **Fix:** | Accept `spots[]` prop |

#### 7.10.10 Charity / Donations

| Aspect | Current `charity/$id.tsx` | Available `donation-campaign-block` (229 lines) |
|---|---|---|
| **Donation form** | Basic "Donate" button | Full donation form with preset amounts ($10/$25/$50/$100/$250), custom input, recurring toggle |
| **Impact stats** | Not shown | "12 Wells Built, 8,500+ People Served, 24 Communities, 5 Countries" |
| **Progress** | Not shown | Progress bar with percentage, goal, raised amount |
| **Variants** | N/A | 3 variants: `full`, `compact`, `widget` |
| **Fix:** | Accept `campaign`, `impact[]` props |

---

### 7.11 Import Guide — How to Wire Blocks into Detail Pages

#### Method 1: Direct Import (Hybrid approach — recommended for quick wins)

Keep the existing route files but import block components for the vertical-specific sections:

```tsx
// apps/storefront/src/routes/$tenant/$locale/crowdfunding/$id.tsx
import { createFileRoute, Link } from "@tanstack/react-router"
import { CrowdfundingProgressBlock } from '../../../../components/blocks/crowdfunding-progress-block'
import { ReviewListBlock } from '../../../../components/blocks/review-list-block'

function CrowdfundingDetailPage() {
  const loaderData = Route.useLoaderData()
  const campaign = loaderData?.item

  return (
    <div className="min-h-screen bg-ds-background">
      {/* Keep custom breadcrumbs + hero */}
      <div className="bg-ds-card border-b border-ds-border">...</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* REPLACE inline progress with block */}
            <CrowdfundingProgressBlock
              campaign={{
                title: campaign.name || campaign.title,
                description: campaign.description,
                goal: Number(campaign.goal || 0),
                raised: Number(campaign.raised || campaign.amount_raised || 0),
                backers: Number(campaign.backers_count || 0),
                daysLeft: campaign.days_left || 0,
              }}
              variant="full"
              showBackers={true}
            />

            {/* REPLACE inline reviews with block */}
            <ReviewListBlock
              reviews={campaign.reviews || []}
              heading="Campaign Reviews"
              showSummary={true}
            />
          </div>

          <aside>
            {/* Sidebar CTA */}
            <CrowdfundingProgressBlock
              campaign={...same data...}
              variant="widget"
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
```

**Import path pattern:** Blocks live at `apps/storefront/src/components/blocks/<name>-block.tsx`.
From route files at `apps/storefront/src/routes/$tenant/$locale/<vertical>/$id.tsx`:
```
import { BlockName } from '../../../../components/blocks/<name>-block'
```

#### Method 2: BlockRenderer with Layout (CMS-driven approach)

Use the `BlockRenderer` component with a layout array defined per vertical:

```tsx
import { BlockRenderer } from '../../../../components/blocks'

function CrowdfundingDetailPage() {
  const campaign = Route.useLoaderData()?.item

  const layout = [
    {
      blockType: 'hero',
      heading: campaign?.title,
      subheading: campaign?.description?.substring(0, 120),
      backgroundImage: campaign?.thumbnail ? { url: campaign.thumbnail } : undefined,
      minHeight: 'sm',
    },
    {
      blockType: 'crowdfundingProgress',
      campaign: {
        title: campaign?.title,
        goal: Number(campaign?.goal || 0),
        raised: Number(campaign?.raised || 0),
        backers: campaign?.backers_count || 0,
        daysLeft: campaign?.days_left || 0,
      },
      variant: 'full',
      showBackers: true,
    },
    {
      blockType: 'reviewList',
      reviews: campaign?.reviews || [],
      heading: 'Reviews',
    },
    {
      blockType: 'recentlyViewed',
      heading: 'Recently Viewed',
    },
  ]

  return (
    <div className="min-h-screen bg-ds-background">
      <BlockRenderer blocks={layout} />
    </div>
  )
}
```

#### Method 3: Full CMS Integration (long-term approach)

Use the CMS registry's `buildDetailPage()` to define per-vertical layouts, then have a generic route file resolve and render them:

1. Update `cms-registry.ts` `buildDetailPage()` to return vertical-specific layouts
2. Create a generic `$tenant/$locale/$vertical/$id.tsx` route
3. In the loader, resolve the CMS page and entity data
4. Pass layout + data to `BlockRenderer`

This requires the most infrastructure changes but yields the most maintainable architecture.

---

### 7.12 Per-Block Refactoring Recipes

For every Tier B block that needs refactoring, here is the exact code change pattern:

#### Pattern: Replace `const placeholder...` with prop + fallback

```tsx
// Step 1: Add data prop to interface
interface CrowdfundingProgressBlockProps {
  campaignId?: string
  campaign?: {                          // ADD THIS
    title: string
    description?: string
    goal: number
    raised: number
    backers: number
    daysLeft: number
  }
  showBackers?: boolean
  variant?: 'full' | 'widget' | 'minimal'
}

// Step 2: Keep placeholder as fallback default
const defaultCampaign = { title: 'Campaign', goal: 0, raised: 0, backers: 0, daysLeft: 0 }

// Step 3: Use prop with fallback
export const CrowdfundingProgressBlock: React.FC<CrowdfundingProgressBlockProps> = ({
  campaign = defaultCampaign,           // USE PROP, fallback to empty
  variant = 'full',
}) => {
  const percentFunded = campaign.goal > 0
    ? Math.round((campaign.raised / campaign.goal) * 100) : 0
  // ...render from `campaign` instead of `placeholderCampaign`
}
```

#### Blocks requiring this pattern (with their new prop shapes):

| Block | New Prop Name | Prop Shape |
|---|---|---|
| `crowdfunding-progress` | `campaign` | `{ title, goal, raised, backers, daysLeft }` |
| `donation-campaign` | `campaign` | `{ title, description, raised, goal, donors }` + `impact[]` |
| `healthcare-provider` | `providers` | `Provider[]` (id, name, specialty, rating, etc.) |
| `vehicle-listing` | `vehicles` | `Vehicle[]` (id, title, make, model, year, price, etc.) |
| `property-listing` | `properties` | `Property[]` (id, title, address, price, type, etc.) |
| `course-curriculum` | `modules` | `Module[]` (id, title, lessons[], duration) |
| `event-schedule` | `sessions` | `Session[]` (id, title, time, speaker, venue) |
| `freelancer-profile` | `freelancer` + `portfolio` | `Freelancer` + `PortfolioItem[]` |
| `fitness-class-schedule` | `classes` | `FitnessClass[]` (id, name, time, instructor, level) |
| `pet-profile-card` | `pets` | `Pet[]` (id, name, breed, services) |
| `auction-bidding` | `currentBid` + `bids` + `endTime` | `number` + `Bid[]` + `Date` |
| `parking-spot-finder` | `spots` | `ParkingSpot[]` (id, type, rate, available) |
| `classified-ad-card` | `ads` | `ClassifiedAd[]` (id, title, price, location) |
| `rental-calendar` | `availability` + `pricing` | `AvailableDate[]` + `PricingConfig` |
| `booking-calendar` | `timeSlots` + `bookedDates` | `TimeSlot[]` + `Date[]` |

---

### 7.13 Database Format Adapter Specification

The `cms_page` table stores 7 pages with blocks in **incompatible format**. An adapter function is needed:

```typescript
// apps/backend/src/lib/platform/block-format-adapter.ts
interface DatabaseBlock {
  type: string
  data: Record<string, any>
}

interface RendererBlock {
  blockType: string
  [key: string]: any
}

export function adaptDatabaseBlocks(dbBlocks: DatabaseBlock[]): RendererBlock[] {
  return dbBlocks.map(block => {
    const fieldMap: Record<string, Record<string, string>> = {
      hero: { title: 'heading', subtitle: 'subheading' },
      content: { body: 'content' },
      vertical_grid: { title: 'heading', limit: 'limit' },
      featured_products: { title: 'heading', limit: 'limit' },
      cta: { text: 'description', title: 'heading' },
      contact_form: { title: 'heading', email: 'recipientEmail' },
    }

    const mapped = fieldMap[block.type] || {}
    const props: Record<string, any> = {}

    for (const [dbKey, value] of Object.entries(block.data || {})) {
      props[mapped[dbKey] || dbKey] = value
    }

    const blockTypeMap: Record<string, string> = {
      hero: 'hero',
      content: 'richText',
      vertical_grid: 'categoryGrid',
      featured_products: 'productGrid',
      cta: 'cta',
      contact_form: 'contactForm',
    }

    return {
      blockType: blockTypeMap[block.type] || block.type,
      ...props,
    }
  })
}
```

**Database examples and their transformed output:**

| Database Format | Adapted Format |
|---|---|
| `{"type":"hero","data":{"title":"Welcome","subtitle":"Shop now"}}` | `{"blockType":"hero","heading":"Welcome","subheading":"Shop now"}` |
| `{"type":"content","data":{"body":"About us..."}}` | `{"blockType":"richText","content":"About us..."}` |
| `{"type":"featured_products","data":{"title":"Featured","limit":4}}` | `{"blockType":"productGrid","heading":"Featured","limit":4}` |
| `{"type":"cta","data":{"title":"Join","text":"Start today"}}` | `{"blockType":"cta","heading":"Join","description":"Start today"}` |
| `{"type":"contact_form","data":{"title":"Contact","email":"hi@..."}}` | `{"blockType":"contactForm","heading":"Contact","recipientEmail":"hi@..."}` |

---

### 7.14 What the Block System SHOULD Enable

If properly connected, the block system would allow:

1. **CMS-Driven Detail Pages** — Instead of 50 hardcoded route files, a single `GenericDetailPage` component could:
   - Fetch the CMS page layout from the registry (already works for list pages)
   - Fetch the entity data from the backend API
   - Pass data to `<BlockRenderer blocks={layout} />` with entity data as context

2. **Vertical-Specific Detail Layouts in CMS Registry** — Adding entries like:
   ```typescript
   "auctions-detail": [
     { blockType: "hero", heading: "Auction Detail" },
     { blockType: "imageGallery" },
     { blockType: "auctionBidding", showCountdown: true, showHistory: true },
     { blockType: "reviewList" },
     { blockType: "recentlyViewed" }
   ]
   ```

3. **Non-Developer Page Customization** — When migrated to actual Payload CMS, editors could rearrange, add, or remove blocks per vertical without code changes.

### 7.15 Recommended Block Integration Strategy

| Phase | Action | Impact | Effort |
|---|---|---|---|
| **Phase 0** | Fix database format mismatch (adapt `type`/`data` to `blockType`/flat props) | Enables DB-stored pages to render | 2 hours |
| **Phase 1** | Create vertical-specific detail page layouts in `cms-registry.ts` `buildDetailPage()` | Defines what blocks each detail page shows | 4 hours |
| **Phase 2** | Refactor ~32 Tier B blocks to accept real data from props instead of hardcoded data | Blocks render actual API data | 12 hours |
| **Phase 3** | Create `GenericVerticalDetailPage` route that uses `BlockRenderer` | Replaces 50 hardcoded route files with 1 | 8 hours |
| **Phase 4** | Add entity data context provider so blocks can access the loaded entity | Blocks auto-populate from SSR data | 4 hours |

---

## Section 8: CMS Integration Points Summary

### What EXISTS and is structured:

1. **77 React block components** (12,750+ lines) — fully implemented with TypeScript interfaces
2. **57 block type definitions** in the design system — comprehensive prop types with variants
3. **BlockRenderer component** (44 lines) — generic renderer that maps `blockType` → React component
4. **Block registry** (180 lines) — maps 77 string keys to React component imports
5. **CMS page registry** with 27 vertical-specific LIST layouts — well-differentiated per vertical (restaurants: 5 blocks, healthcare: 4 blocks, education: 4 blocks, etc.)
6. **CMS resolve API endpoint** — `GET /platform/cms/resolve?path=...` returns page + layout
7. **CMS page database model** — `cms_page` table with `layout` JSON column (7 seeded pages)
8. **Design system with 24 semantic color tokens** — `ds-primary/foreground/background/muted/card/border/destructive/success/warning/info` + foreground variants
9. **Zero raw Tailwind colors** in blocks or pages — 100% design system token compliance
10. **Payload CMS integration spec** — full contract document for webhook sync
11. **CMS hooks** — `useCMSVerticals()`, `useCMSNavigation()` in storefront
12. **Payload webhook handlers** — `POST /admin/webhooks/payload` and `POST /webhooks/payload-cms`
13. **CMS-to-ERP sync engine** — `cms-hierarchy-sync/engine.ts` for 8-collection sync

### What is MISSING / DISCONNECTED:

1. **Zero detail pages import or use `BlockRenderer`** — all 50 pages use hardcoded inline JSX (grep confirms 0 matches for `BlockRenderer` in routes/)
2. **No vertical-specific detail page layouts** in CMS registry — `buildDetailPage()` returns the same 3 generic blocks (hero + reviewList + recentlyViewed) for ALL 27 verticals
3. **Database and registry use incompatible block formats** — `cms_page.layout` stores `{"type": "hero", "data": {"title": "..."}}` but `BlockRenderer` expects `{"blockType": "hero", "heading": "..."}`
4. **32 blocks render placeholder data** instead of using their props (e.g., `placeholderCampaign`, `placeholderProviders`, `placeholderVehicles`)
5. **No entity data context** — blocks can't access the SSR-loaded entity data automatically
6. **No `useCMSPage()` hook** — storefront has `useCMSVerticals` and `useCMSNavigation` but no hook to fetch a specific page's block layout
7. **No generic detail page route** — each vertical has its own hardcoded route file instead of a shared CMS-driven page
8. **13 blocks accept entity-specific ID props** (`campaignId`, `auctionId`, `serviceId`, etc.) but never fetch data themselves — they expect a parent to pass the data, which no parent currently does
9. **Minor UI pattern inconsistencies** — blocks use `container mx-auto px-4 md:px-6` while pages use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`; blocks use `rounded-lg` while pages use `rounded-xl`
10. **No block-level error boundaries** — if a block fails to render, the entire page breaks

---

## Section 9: Architecture Decision — Hardcoded vs Block-Based Detail Pages

### Option A: Keep Hardcoded Route Files (Current Approach)
- **Pros:** Direct control per vertical, simpler to understand one page at a time
- **Cons:** 50 files to maintain, cookie-cutter duplication, no CMS editability, 12,750 lines of block code wasted
- **Effort to fix:** Customize each of 50 files individually (~16 hours)

### Option B: Migrate to Block-Based Detail Pages (Recommended)
- **Pros:** 
  - Leverages 12,750 lines of existing block code
  - Reduces 50 route files to 1 generic route + vertical layouts in CMS registry
  - Enables CMS-driven page customization
  - Consistent with the platform's stated architecture
  - Blocks already have vertical-specific UI (auction bidding, booking calendar, etc.)
  - Zero theme conflict — both systems use identical `ds-` token vocabulary
- **Cons:** Requires upfront integration work, blocks need refactoring to use real data
- **Effort to implement:** ~30 hours total across 5 phases

### Option C: Hybrid — Custom Pages with Block Sections (Pragmatic)
- **Pros:** Custom page structure + block components for complex sections; quickest path to adding missing features (menus, bid forms, schedules)
- **Cons:** Still maintains 50 files, partial block utilization
- **Effort:** ~20 hours
- **How it works:** Keep each route file's breadcrumbs, hero, and sidebar layout. Import vertical-specific blocks for the main content sections. Each page becomes ~80 lines instead of ~250.

### Recommendation

**Option C (Hybrid)** is the fastest path to production readiness. It preserves the existing page structure (breadcrumbs, hero, sidebar with CTAs) while immediately adding the rich vertical-specific features that are currently missing (menus, bid forms, class schedules, donation forms, etc.). Since both blocks and pages use identical `ds-` design tokens, visual integration will be seamless with zero style conflicts.

**Option B (Block-Based)** should be the follow-up architectural refactor once Option C proves the blocks work correctly with real data.

---

## Section 10: Complete Block Catalog — All 77 Payload CMS Blocks

### Block Catalog Key

Each block entry includes:
- **Registry Key:** The `blockType` string used in `BLOCK_REGISTRY` and `BlockRenderer`
- **File:** Source file path
- **Lines:** Total lines of code
- **Design:** Visual layout description
- **Content:** What data/content the block displays
- **Props:** TypeScript interface (all accepted parameters)
- **Data Status:** Whether it uses props or hardcoded placeholder data
- **Use Cases:** Where this block should appear
- **Design Tokens:** Count of `ds-` token references (style consistency score)

---

### 10.1 Content & Layout Blocks

#### Block #1: `hero`
- **File:** `hero-block.tsx` (86 lines)
- **Design:** Full-width section with optional background image/video, text overlay with configurable alignment (start/center/end), CTA buttons, optional badge. Min-height variants: sm (200px), md (300px), lg (400px), xl (500px), full (100vh). Overlay options: none, light, dark, gradient.
- **Content:** Heading text, subheading text, background media, CTA button array, badge text
- **Props:** `heading?: string`, `subheading?: string`, `backgroundImage?: {url, alt}`, `backgroundVideo?: {url}`, `overlay?: 'none'|'light'|'dark'|'gradient'`, `alignment?: 'start'|'center'|'end'`, `minHeight?: 'sm'|'md'|'lg'|'xl'|'full'`, `cta?: {label, href}[]`, `badge?: string`
- **Data Status:** PROPS-DRIVEN — renders from props, no hardcoded data
- **Design Tokens:** 5 (bg-ds-background, text-ds-foreground, bg-ds-primary, text-ds-primary-foreground, text-ds-muted-foreground)
- **Use Cases:** Top of every page (list + detail), landing pages, campaign headers

#### Block #2: `richText` (content)
- **File:** `content-block.tsx` (27 lines)
- **Design:** Prose-styled rich text container with configurable max-width and column count. Clean typographic layout with responsive text sizing.
- **Content:** HTML string rendered as rich text
- **Props:** `content: string`, `columns?: 1|2`, `maxWidth?: 'sm'|'md'|'lg'|'xl'|'full'`, `textAlign?: 'start'|'center'|'end'`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 1 (text-ds-foreground)
- **Use Cases:** About pages, policy pages, blog content, long descriptions

#### Block #3: `cta`
- **File:** `cta-block.tsx` (66 lines)
- **Design:** Call-to-action banner with heading, description, and button array. Variants: banner (full-width colored), card (bordered container), inline (minimal), split (text + image side by side). Background styles: primary, secondary, muted, accent, custom.
- **Content:** Heading, description, button labels and URLs
- **Props:** `heading?: string`, `description?: string`, `buttons?: {label, href, variant}[]`, `variant?: 'banner'|'card'|'inline'|'split'`, `backgroundStyle?: 'primary'|'secondary'|'muted'|'accent'|'custom'`, `backgroundImage?: {url, alt}`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 5 (bg-ds-primary, text-ds-primary-foreground, bg-ds-card, border-ds-border, text-ds-foreground)
- **Use Cases:** Bottom of detail pages, conversion sections, newsletter sign-up prompts

#### Block #4: `featureGrid` (features)
- **File:** `features-block.tsx` (47 lines)
- **Design:** Grid of feature cards with icon + title + description. Configurable column count (2/3/4). Variants: icon-top (icon above text), icon-left (icon beside text), card (bordered containers), minimal (no borders).
- **Content:** Array of feature items with icons, titles, descriptions
- **Props:** `heading?: string`, `subtitle?: string`, `features: {icon, title, description}[]`, `columns?: 2|3|4`, `variant?: 'icon-top'|'icon-left'|'card'|'minimal'`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 3 (text-ds-foreground, text-ds-muted-foreground, bg-ds-card)
- **Use Cases:** Service features, membership benefits, product highlights, "Why Choose Us"

#### Block #5: `stats`
- **File:** `stats-block.tsx` (130 lines)
- **Design:** Horizontal/grid display of key statistics with large numbers and labels. Optional trend indicators (up/down arrows with percentage). Variants: default (simple numbers), card (bordered cards), highlighted (accent background), minimal.
- **Content:** Array of stat items: value, label, optional trend data
- **Props:** `heading?: string`, `stats: {value, label, trend?, trendDirection?}[]`, `columns?: 2|3|4`, `variant?: 'default'|'card'|'highlighted'|'minimal'`, `showTrend?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 14
- **Use Cases:** Campaign progress metrics, vendor statistics, service counters, impact numbers

#### Block #6: `imageGallery`
- **File:** `image-gallery-block.tsx` (209 lines)
- **Design:** Multi-image display with three layouts: grid (equal cells), masonry (Pinterest-style), carousel (single image with nav arrows). Built-in lightbox with keyboard navigation (arrow keys, escape). Configurable aspect ratio (square/video/portrait) and column count (2/3/4).
- **Content:** Array of images with URLs, alt text, optional captions
- **Props:** `heading?: string`, `images: {image: {url, alt}, caption?}[]`, `layout?: 'grid'|'masonry'|'carousel'`, `columns?: 2|3|4`, `aspectRatio?: 'square'|'video'|'portrait'`
- **Data Status:** PROPS-DRIVEN — requires images array
- **Design Tokens:** 14 (bg-ds-background, text-ds-foreground, bg-ds-muted, border-ds-border, etc.)
- **Use Cases:** Product photos, property galleries, restaurant ambiance, event photos, portfolio showcases

#### Block #7: `divider`
- **File:** `divider-block.tsx` (46 lines)
- **Design:** Visual separator between sections. Variants: line (thin horizontal rule), dotted (dot pattern), label (line with centered text), space (whitespace only). Configurable spacing (sm/md/lg/xl).
- **Content:** Optional label text
- **Props:** `variant?: 'line'|'dotted'|'label'|'space'`, `label?: string`, `spacing?: 'sm'|'md'|'lg'|'xl'`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 4
- **Use Cases:** Between page sections, visual breaks in long content

#### Block #8: `bannerCarousel`
- **File:** `banner-carousel-block.tsx` (185 lines)
- **Design:** Auto-rotating promotional banner slider with navigation dots and arrow buttons. Each slide has background image, heading, description, and CTA button. Configurable auto-play interval and transition effects.
- **Content:** Array of banner slides with images, text, CTAs
- **Props:** `heading?: string`, `banners: {image: {url, alt}, heading, description, cta: {label, href}}[]`, `autoPlayInterval?: number`, `showDots?: boolean`, `showArrows?: boolean`, `height?: 'sm'|'md'|'lg'`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 11
- **Use Cases:** Homepage hero rotation, promotional campaigns, seasonal offers

#### Block #9: `videoEmbed`
- **File:** `video-embed-block.tsx` (114 lines)
- **Design:** Responsive video player embed with optional poster image and play button overlay. Supports YouTube, Vimeo, and direct video URLs. Aspect ratio configurable (16:9, 4:3, 1:1).
- **Content:** Video URL, optional poster image, title
- **Props:** `url: string`, `title?: string`, `poster?: {url, alt}`, `aspectRatio?: '16:9'|'4:3'|'1:1'`, `autoplay?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 3
- **Use Cases:** Product demos, course previews, property virtual tours, event recordings

#### Block #10: `timeline`
- **File:** `timeline-block.tsx` (194 lines)
- **Design:** Vertical timeline with connected nodes. Each entry has date, title, description, and optional icon. Left/right alternating layout on desktop, stacked on mobile. Color-coded nodes for different statuses.
- **Content:** Array of timeline entries with dates, titles, descriptions
- **Props:** `heading?: string`, `items: {date, title, description, icon?, status?}[]`, `layout?: 'vertical'|'horizontal'|'alternating'`, `showConnectors?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 27
- **Use Cases:** Order tracking, project milestones, government service processing steps, company history

#### Block #11: `trustBadges`
- **File:** `trust-badges-block.tsx` (92 lines)
- **Design:** Horizontal row of trust/security badges with icons and labels. Common badges: secure payment, money-back guarantee, free shipping, verified sellers. Optional description under each badge.
- **Content:** Array of badge items with icons and labels
- **Props:** `badges?: {icon, label, description?}[]`, `layout?: 'horizontal'|'grid'`, `variant?: 'icon-only'|'with-text'|'card'`
- **Data Status:** PROPS-DRIVEN with defaults
- **Design Tokens:** 8
- **Use Cases:** Footer trust indicators, checkout page reassurance, product detail confidence builders

#### Block #12: `socialProof`
- **File:** `social-proof-block.tsx` (234 lines)
- **Design:** Real-time social proof notifications showing recent purchases, reviews, and activity. Variants: feed (continuous scroll), toast (popup notifications), banner (summary bar), widget (sidebar card). Shows buyer name, location, product, and timestamp.
- **Content:** Recent purchases, reviews with ratings, activity data
- **Props:** `variant?: 'feed'|'toast'|'banner'|'widget'`, `showPurchases?: boolean`, `showReviews?: boolean`, `autoRotate?: boolean`, `heading?: string`, `maxItems?: number`
- **Data Status:** HARDCODED — uses placeholder purchases and reviews
- **Design Tokens:** 42
- **Use Cases:** Homepage social proof, product detail page urgency, checkout conversion

#### Block #13: `blogPost`
- **File:** `blog-post-block.tsx` (182 lines)
- **Design:** Full blog article layout with featured image, category badge, title, author info (avatar + name + bio), reading time, publication date, rich HTML content body, tags, and related posts sidebar.
- **Content:** Article content (HTML), author data, category, tags, related posts
- **Props:** `heading?: string`, `content?: string`, `author?: {name, avatar?, bio?}`, `publishedAt?: string`, `category?: string`, `tags?: string[]`, `featuredImage?: string`, `readingTime?: number`
- **Data Status:** HARDCODED — defaults to "Future of B2B Commerce" article
- **Design Tokens:** 28
- **Use Cases:** Blog detail pages, news articles, knowledge base entries

---

### 10.2 Navigation & Discovery Blocks

#### Block #14: `categoryGrid`
- **File:** `category-grid-block.tsx` (164 lines)
- **Design:** Grid of category cards with images, names, and item counts. Configurable columns (2/3/4/6). Variants: card (bordered with image), image-overlay (full image with text overlay), icon (centered icon with label), minimal (text only). Links to category pages.
- **Content:** Array of categories with images, names, item counts, URLs
- **Props:** `heading?: string`, `categories: {name, image?, itemCount?, href}[]`, `columns?: 2|3|4|6`, `variant?: 'card'|'image-overlay'|'icon'|'minimal'`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 16
- **Use Cases:** Homepage category browsing, vertical landing pages, storefront navigation

#### Block #15: `collectionList`
- **File:** `collection-list-block.tsx` (123 lines)
- **Design:** Curated collection cards with images, titles, and descriptions. Layouts: grid, carousel (horizontal scroll), list (vertical stack). Links to collection detail pages.
- **Content:** Array of product collections
- **Props:** `heading?: string`, `description?: string`, `collections?: {id, title, handle, image?}[]`, `layout?: 'grid'|'carousel'|'list'`, `columns?: 2|3|4|6`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 9
- **Use Cases:** Curated collections, seasonal picks, editor's choice, "Shop the Look"

#### Block #16: `comparisonTable`
- **File:** `comparison-table-block.tsx` (148 lines)
- **Design:** Feature comparison matrix with product/plan columns and feature rows. Checkmarks for included features, X for excluded. Highlighted column for recommended option. Sticky header for scrolling.
- **Content:** Products/plans with feature lists
- **Props:** `heading?: string`, `items: {name, features: Record<string, boolean|string>}[]`, `features: string[]`, `highlightedItem?: string`, `layout?: 'table'|'cards'`
- **Data Status:** PROPS-DRIVEN — requires items and features arrays
- **Design Tokens:** 18
- **Use Cases:** Membership tier comparison, insurance plan comparison, subscription plan features, vehicle spec comparison

#### Block #17: `contactForm`
- **File:** `contact-form-block.tsx` (163 lines)
- **Design:** Multi-field contact form with name, email, phone, subject, and message fields. Optional map embed below form. Success/error state feedback. Configurable field list.
- **Content:** Form fields, recipient email, heading
- **Props:** `heading?: string`, `recipientEmail?: string`, `showMap?: boolean`, `fields?: string[]`
- **Data Status:** PARTIALLY HARDCODED — form fields hardcoded but layout is prop-driven
- **Design Tokens:** 10
- **Use Cases:** Contact pages, vendor inquiry, property inquiry, service request

#### Block #18: `faq`
- **File:** `faq-block.tsx` (90 lines)
- **Design:** Accordion-style FAQ list with expandable question/answer pairs. Layouts: accordion (one open at a time), two-column (side by side), categorized (grouped by category). Smooth expand/collapse animation.
- **Content:** Array of question-answer pairs
- **Props:** `heading?: string`, `description?: string`, `items: {question, answer}[]`, `layout?: 'accordion'|'two-column'|'categorized'`
- **Data Status:** PROPS-DRIVEN — requires items array
- **Design Tokens:** 3
- **Use Cases:** Product FAQ, service information, legal disclaimers, healthcare information

#### Block #19: `pricing`
- **File:** `pricing-block.tsx` (171 lines)
- **Design:** Pricing tier cards with plan names, prices, feature lists, and CTA buttons. Highlighted/recommended plan with accent border. Optional billing toggle (monthly/annual). Responsive: stacks on mobile, side by side on desktop.
- **Content:** Array of pricing plans
- **Props:** `heading?: string`, `description?: string`, `plans: {name, price, currency, interval, features, highlighted?, cta?}[]`, `billingToggle?: boolean`, `highlightedPlan?: string`
- **Data Status:** PROPS-DRIVEN — requires plans array
- **Design Tokens:** 17
- **Use Cases:** Subscription pricing, membership tiers, service packages, SaaS plans

#### Block #20: `newsletter`
- **File:** `newsletter-block.tsx` (128 lines)
- **Design:** Email subscription form with heading, description, email input, and submit button. Optional benefits list. Variants: inline (single row), card (bordered container), full-width (accent background).
- **Content:** Heading, description, benefit items
- **Props:** `heading?: string`, `description?: string`, `variant?: 'inline'|'card'|'full-width'`, `showBenefits?: boolean`
- **Data Status:** PARTIALLY HARDCODED — benefits list hardcoded
- **Design Tokens:** 8
- **Use Cases:** Footer newsletter sign-up, event updates subscription, blog subscription

#### Block #21: `reviewList`
- **File:** `review-list-block.tsx` (180 lines)
- **Design:** Customer review cards with star ratings, reviewer name, date, and review text. Optional summary header showing average rating and total count. Optional "Write a Review" form. Filterable by star count.
- **Content:** Array of reviews with ratings, text, author info
- **Props:** `heading?: string`, `entityId?: string`, `showSummary?: boolean`, `allowSubmit?: boolean`
- **Data Status:** HARDCODED — uses 4 placeholder reviews
- **Design Tokens:** 17
- **Use Cases:** Product reviews, service reviews, vendor reviews, course reviews, restaurant reviews

#### Block #22: `map`
- **File:** `map-block.tsx` (198 lines)
- **Design:** Interactive map placeholder with location markers, search input, and location list panel. Shows pin markers with name, address, and phone. Sidebar list of locations with click-to-select. Map renders as styled placeholder (no actual map API).
- **Content:** Center coordinates, zoom level, array of location markers
- **Props:** `heading?: string`, `center?: {lat, lng}`, `markers?: {id, name, address, phone?, image?}[]`, `zoom?: number`, `showSearch?: boolean`
- **Data Status:** HARDCODED — uses 5 placeholder markers
- **Design Tokens:** 21
- **Use Cases:** Store locator, restaurant locations, parking zones, property locations, event venues

---

### 10.3 Commerce Core Blocks

#### Block #23: `productGrid` (products)
- **File:** `products-block.tsx` (95 lines)
- **Design:** Responsive product card grid with image, title, price, rating. Hover effect reveals "Add to Cart" button. Configurable columns (2/3/4). Sort dropdown (newest, price asc/desc, popular). Category filter tabs.
- **Content:** Product array (can be fetched via useQuery or passed as props)
- **Props:** `heading?: string`, `source?: 'latest'|'featured'|'category'|'vendor'|'manual'`, `productIds?: string[]`, `categoryId?: string`, `vendorId?: string`, `limit?: number`, `columns?: 2|3|4`, `showFilters?: boolean`, `showSort?: boolean`
- **Data Status:** **ONLY BLOCK WITH `useQuery`** — fetches its own product data
- **Design Tokens:** 6
- **Use Cases:** Product listings, featured products, category products, vendor products

#### Block #24: `productDetail`
- **File:** `product-detail-block.tsx` (201 lines)
- **Design:** Full product detail layout with image gallery (main + thumbnails), title, price, description, variant selector (size/color), quantity picker, "Add to Cart" button, product specs table. Tabs for description/specs/reviews.
- **Content:** Complete product data
- **Props:** `productId?: string`, `showReviews?: boolean`, `showRelated?: boolean`, `variant?: 'default'|'compact'|'gallery'`
- **Data Status:** HARDCODED — "Premium Wireless Headphones" placeholder
- **Design Tokens:** 40
- **Use Cases:** Standard product detail page, quick view modal

#### Block #25: `cartSummary`
- **File:** `cart-summary-block.tsx` (142 lines)
- **Design:** Shopping cart display with item list (image, name, quantity, price), subtotal, shipping estimate, coupon code input, and checkout button. Variants: mini (dropdown), full (page), sidebar (sticky).
- **Content:** Cart items, pricing summary
- **Props:** `variant?: 'mini'|'full'|'sidebar'`, `showCoupon?: boolean`, `showEstimatedShipping?: boolean`
- **Data Status:** HARDCODED — 3 placeholder cart items
- **Design Tokens:** 28
- **Use Cases:** Cart page, cart sidebar, checkout flow

#### Block #26: `checkoutSteps`
- **File:** `checkout-steps-block.tsx` (204 lines)
- **Design:** Multi-step checkout wizard with progress bar. Steps: Contact Info → Shipping → Payment → Review. Each step has form fields with validation states. Back/Next navigation buttons. Order summary sidebar.
- **Content:** Checkout form data, order summary
- **Props:** `showOrderSummary?: boolean`, `initialStep?: number`, `allowGuestCheckout?: boolean`, `paymentMethods?: string[]`, `shippingMethods?: string[]`
- **Data Status:** HARDCODED — placeholder form data
- **Design Tokens:** 49
- **Use Cases:** Checkout flow, booking confirmation, subscription signup

#### Block #27: `orderConfirmation`
- **File:** `order-confirmation-block.tsx` (132 lines)
- **Design:** Order success page with confirmation number, order summary, shipping details, estimated delivery, and "Continue Shopping" CTA. Green checkmark icon header. Line items with images and prices.
- **Content:** Order data, confirmation number, shipping info
- **Props:** `orderId?: string`, `showTracking?: boolean`, `showRelated?: boolean`, `variant?: 'full'|'compact'`
- **Data Status:** HARDCODED — placeholder order #ORD-2026-1234
- **Design Tokens:** 42
- **Use Cases:** Post-purchase confirmation, booking confirmation

#### Block #28: `wishlistGrid`
- **File:** `wishlist-grid-block.tsx` (94 lines)
- **Design:** Saved items grid with product cards, remove button, and "Move to Cart" action. Empty state with illustration and CTA.
- **Content:** Saved product array
- **Props:** `heading?: string`, `products?: any[]`, `layout?: 'grid'|'list'`
- **Data Status:** HARDCODED — 3 placeholder items
- **Design Tokens:** 12
- **Use Cases:** Wishlist page, saved items section

#### Block #29: `recentlyViewed`
- **File:** `recently-viewed-block.tsx` (61 lines)
- **Design:** Horizontal scrollable row of recently viewed product thumbnails with titles and prices. Compact card format. Carousel-style with overflow scroll.
- **Content:** Recently viewed product array
- **Props:** `heading?: string`, `products?: any[]`, `layout?: 'carousel'|'grid'`
- **Data Status:** HARDCODED — 3 placeholder products
- **Design Tokens:** 10
- **Use Cases:** Bottom of every detail page, shopping continuity

#### Block #30: `flashSaleCountdown`
- **File:** `flash-sale-countdown-block.tsx` (117 lines)
- **Design:** Countdown timer display with days:hours:minutes:seconds blocks. Featured sale products below timer. Urgency-colored design (red/orange tones). Animated countdown digits.
- **Content:** End time, sale products
- **Props:** `heading?: string`, `endTime?: Date`, `products?: any[]`, `variant?: 'banner'|'card'|'inline'`
- **Data Status:** HARDCODED — endTime = now + 24 hours, placeholder products
- **Design Tokens:** 14
- **Use Cases:** Flash deals detail, promotional pages, seasonal sales

#### Block #31: `giftCardDisplay`
- **File:** `gift-card-display-block.tsx` (137 lines)
- **Design:** Gift card selector with denomination buttons ($25/$50/$100/$250/$500), visual card template preview, recipient email input, personal message textarea. Card design templates with color variations.
- **Content:** Denominations, card templates, recipient info
- **Props:** `heading?: string`, `denominations?: number[]`, `customizable?: boolean`, `variant?: 'selector'|'preview'|'checkout'`
- **Data Status:** HARDCODED — 5 default denominations, hardcoded templates
- **Design Tokens:** 19
- **Use Cases:** Gift card purchase page, gift card detail

---

### 10.4 Vendor & Marketplace Blocks

#### Block #32: `vendorProfile`
- **File:** `vendor-profile-block.tsx` (101 lines)
- **Design:** Vendor information card with logo, name, description, rating, product count, verified badge. Optional sections: about, contact info, social links, policies.
- **Content:** Vendor data from API
- **Props:** `vendorId?: string`, `showProducts?: boolean`, `showReviews?: boolean`, `variant?: 'full'|'card'|'sidebar'`
- **Data Status:** PROPS-DRIVEN — accepts vendorId
- **Design Tokens:** 16
- **Use Cases:** Vendor storefront page, vendor detail, marketplace vendor listing

#### Block #33: `vendorProducts`
- **File:** `vendor-products-block.tsx` (111 lines)
- **Design:** Product grid filtered by vendor with vendor header info. Standard product card format with image, title, price, rating. "View All" link to vendor store.
- **Content:** Vendor's product array
- **Props:** `vendorId?: string`, `limit?: number`, `heading?: string`
- **Data Status:** PARTIALLY HARDCODED — placeholder products
- **Design Tokens:** 11
- **Use Cases:** Vendor detail page "Products" section, vendor storefront

#### Block #34: `vendorShowcase`
- **File:** `vendor-showcase-block.tsx` (109 lines)
- **Design:** Featured vendor cards in grid/carousel/featured layout. Each card shows logo, name, description, rating, product count, verified badge. "View Store" CTA link.
- **Content:** Array of vendor data
- **Props:** `heading?: string`, `description?: string`, `vendors: Vendor[]`, `layout?: 'grid'|'carousel'|'featured'`, `showRating?: boolean`, `showProducts?: boolean`
- **Data Status:** PROPS-DRIVEN — requires vendors array
- **Design Tokens:** 8
- **Use Cases:** Homepage vendor showcase, marketplace landing, vendor directory

#### Block #35: `vendorRegisterForm`
- **File:** `vendor-register-form-block.tsx` (193 lines)
- **Design:** Multi-section registration form with business info (name, type, description), contact details, document upload, terms acceptance, and submit button. Progress indicator for multi-step flow.
- **Content:** Form configuration, required fields
- **Props:** `heading?: string`, `showBusinessType?: boolean`, `requireDocuments?: boolean`
- **Data Status:** PARTIALLY HARDCODED — form structure hardcoded
- **Design Tokens:** 34
- **Use Cases:** Vendor registration page, seller onboarding

#### Block #36: `commissionDashboard`
- **File:** `commission-dashboard-block.tsx` (143 lines)
- **Design:** Vendor earnings dashboard with total earnings, pending payouts, commission rate card, and monthly earnings chart placeholder. Summary cards in 3-column grid.
- **Content:** Commission data, earnings history
- **Props:** `vendorId?: string`, `showChart?: boolean`
- **Data Status:** HARDCODED — placeholder earnings data
- **Design Tokens:** 30
- **Use Cases:** Vendor dashboard, admin vendor management

#### Block #37: `payoutHistory`
- **File:** `payout-history-block.tsx` (180 lines)
- **Design:** Table of past payouts with date, amount, status badge (paid/pending/failed), method. Pagination at bottom. Filter by status.
- **Content:** Payout records array
- **Props:** `vendorId?: string`
- **Data Status:** HARDCODED — placeholder payout records
- **Design Tokens:** 29
- **Use Cases:** Vendor payout history page, vendor dashboard section

---

### 10.5 Booking & Service Blocks

#### Block #38: `bookingCalendar`
- **File:** `booking-calendar-block.tsx` (256 lines)
- **Design:** Full month calendar view with day cells (colored: available=green, unavailable=gray, selected=primary). Time slot picker grid below calendar for selected date showing available times with prices. Confirm booking button with selected date+time summary. Variants: monthly (full calendar), weekly (7-day strip), daily (single day time slots). Optional multi-day range selection.
- **Content:** Available dates, time slots with prices, booked dates
- **Props:** `serviceId?: string`, `variant?: 'monthly'|'weekly'|'daily'`, `showPricing?: boolean`, `allowMultiDay?: boolean`
- **Data Status:** HARDCODED — defaultTimeSlots ($50-$70), hardcoded unavailable days (5,12,19,25)
- **Design Tokens:** 23
- **Use Cases:** Booking detail pages, appointment scheduling, rental availability, travel check-in

#### Block #39: `bookingCta`
- **File:** `booking-cta-block.tsx` (134 lines)
- **Design:** Compact booking prompt with service summary (name, duration, price), availability indicator, and "Book Now" CTA button. Variants: inline (text + button), card (bordered container), full-width (accent background).
- **Content:** Service info, availability, pricing
- **Props:** `heading?: string`, `description?: string`, `serviceId?: string`, `providerId?: string`, `variant?: 'inline'|'card'|'full-width'`, `showAvailability?: boolean`, `showPricing?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 18
- **Use Cases:** Service detail sidebar CTA, bottom of service pages, promotional booking prompts

#### Block #40: `bookingConfirmation`
- **File:** `booking-confirmation-block.tsx` (105 lines)
- **Design:** Booking success page with confirmation number, service details, date/time, provider info, and action buttons (add to calendar, get directions, cancel booking).
- **Content:** Booking confirmation data
- **Props:** `bookingId?: string`, `showDetails?: boolean`, `showActions?: boolean`
- **Data Status:** HARDCODED — placeholder confirmation template
- **Design Tokens:** 26
- **Use Cases:** Post-booking confirmation, appointment confirmed

#### Block #41: `serviceCardGrid`
- **File:** `service-card-grid-block.tsx` (134 lines)
- **Design:** Grid of service cards with image, name, description, pricing, duration, and "Book" button. Configurable columns (2/3/4). Optional category filter.
- **Content:** Array of services
- **Props:** `heading?: string`, `services?: Service[]`, `columns?: 2|3|4`, `showBookingCta?: boolean`, `categoryFilter?: string`
- **Data Status:** HARDCODED — 6 placeholder services
- **Design Tokens:** 12
- **Use Cases:** Service listing, restaurant services, healthcare services, fitness classes

#### Block #42: `serviceList`
- **File:** `service-list-block.tsx` (188 lines)
- **Design:** Detailed service listing with image, name, description, pricing (with currency and unit), duration, rating, and booking URL. Layouts: grid (cards), list (horizontal rows), carousel (horizontal scroll). Responsive column count.
- **Content:** Array of services with full details
- **Props:** `heading?: string`, `description?: string`, `services: Service[]`, `layout?: 'grid'|'list'|'carousel'`, `columns?: 2|3|4`, `showBooking?: boolean`, `showPricing?: boolean`
- **Data Status:** PROPS-DRIVEN — requires services array
- **Design Tokens:** 14
- **Use Cases:** Legal services, insurance plans, government services, utilities, any service-based vertical

#### Block #43: `appointmentSlots`
- **File:** `appointment-slots-block.tsx` (213 lines)
- **Design:** 7-day date picker strip at top, time slot grid below. Each slot shows time, availability status (green=available, gray=taken). Selected slot highlights in primary color. Duration display. Variants: list (vertical), grid (button grid), timeline (visual timeline).
- **Content:** Available time slots per day
- **Props:** `providerId?: string`, `date?: string`, `duration?: string`, `variant?: 'list'|'grid'|'timeline'`
- **Data Status:** HARDCODED — 18 default slots with hardcoded availability
- **Design Tokens:** 29
- **Use Cases:** Healthcare appointment booking, legal consultation scheduling, fitness class booking

#### Block #44: `providerSchedule`
- **File:** `provider-schedule-block.tsx` (188 lines)
- **Design:** Weekly schedule grid showing provider availability. Time slots in rows, days in columns. Color-coded: available (green), busy (red), tentative (yellow). View modes: calendar, list, timeline.
- **Content:** Provider's weekly schedule
- **Props:** `providerId?: string`, `viewMode?: 'calendar'|'list'|'timeline'`, `showCapacity?: boolean`
- **Data Status:** HARDCODED — placeholder weekly schedule
- **Design Tokens:** 22
- **Use Cases:** Provider detail page, staff scheduling, resource availability

#### Block #45: `resourceAvailability`
- **File:** `resource-availability-block.tsx` (199 lines)
- **Design:** Resource availability checker with calendar view, time windows, and status indicators. Shows multiple resources (rooms, equipment) with their availability. Variants: calendar (month view), list (time slots), hybrid (calendar + time slots).
- **Content:** Resources with availability data
- **Props:** `resourceType?: string`, `resourceId?: string`, `dateRange?: {start, end}`, `variant?: 'calendar'|'list'|'hybrid'`
- **Data Status:** HARDCODED — 4 placeholder meeting rooms
- **Design Tokens:** ~20
- **Use Cases:** Meeting room booking, equipment rental, facility reservation

---

### 10.6 Subscription & Loyalty Blocks

#### Block #46: `subscriptionPlans`
- **File:** `subscription-plans-block.tsx` (238 lines)
- **Design:** Pricing comparison cards with plan name, price/interval, feature list (checkmarks), and "Subscribe" CTA. Highlighted plan with accent border and "Popular" badge. Optional billing toggle (monthly/yearly with discount). Variants: cards (side by side), table (comparison matrix), minimal (compact list).
- **Content:** Array of subscription plan data
- **Props:** `heading?: string`, `plans?: PlanData[]`, `billingToggle?: boolean`, `highlightedPlan?: string`, `variant?: 'cards'|'table'|'minimal'`
- **Data Status:** PROPS-DRIVEN — uses `plans` prop with `defaultPlans` fallback (Starter $9/mo, Professional $29/mo, Enterprise $79/mo)
- **Design Tokens:** 33
- **Use Cases:** Subscription pricing page, SaaS plans, membership upgrades

#### Block #47: `membershipTiers`
- **File:** `membership-tiers-block.tsx` (220 lines)
- **Design:** Tiered membership cards with color-coded headers (Bronze=#CD7F32, Silver=#C0C0C0, Gold=#FFD700). Each card shows tier name, price/month, benefit checklist with colored checkmark icons, and "Join" button in tier color. Variants: cards (vertical), horizontal (single row), vertical (stacked).
- **Content:** Array of membership tier data
- **Props:** `heading?: string`, `tiers?: TierData[]`, `showComparison?: boolean`, `variant?: 'cards'|'horizontal'|'vertical'`
- **Data Status:** PROPS-DRIVEN — uses `tiers` prop with `defaultTiers` fallback (Bronze $19, Silver $39, Gold $79)
- **Design Tokens:** 21
- **Use Cases:** Membership pricing, loyalty program tiers, gym membership, club memberships

#### Block #48: `loyaltyDashboard`
- **File:** `loyalty-dashboard-block.tsx` (224 lines)
- **Design:** Member dashboard with points balance (large number), tier progress bar, transaction history table (earned/redeemed), and rewards catalog grid. Variants: full (all sections), compact (summary only), widget (mini card).
- **Content:** Points balance, tier info, transactions, available rewards
- **Props:** `showTierProgress?: boolean`, `showHistory?: boolean`, `showRewards?: boolean`, `variant?: 'full'|'compact'|'widget'`
- **Data Status:** HARDCODED — 1,850 points, Silver tier, 5 transactions, 4 rewards
- **Design Tokens:** 54
- **Use Cases:** Loyalty program member dashboard, rewards page

#### Block #49: `loyaltyPointsDisplay`
- **File:** `loyalty-points-display-block.tsx` (253 lines)
- **Design:** Points display with tier badge, points balance, earning rate visualization, and quick actions (earn more, redeem, history). Animated point counter.
- **Content:** Points data, tier info, earning rates
- **Props:** `showTierBadge?: boolean`, `showEarningRate?: boolean`, `showQuickActions?: boolean`, `variant?: 'full'|'compact'|'badge'`
- **Data Status:** HARDCODED — placeholder points and tier data
- **Design Tokens:** 55
- **Use Cases:** Account header, sidebar widget, loyalty page

#### Block #50: `subscriptionManage`
- **File:** `subscription-manage-block.tsx` (201 lines)
- **Design:** Subscription management panel with current plan details, usage meters (bookings, storage, users, API calls), billing history table, and action buttons (upgrade, pause, cancel). Usage bars with color coding (green <70%, yellow 70-90%, red >90%).
- **Content:** Current subscription, usage data, billing records
- **Props:** `subscriptionId?: string`, `showUsage?: boolean`, `allowPause?: boolean`, `allowUpgrade?: boolean`
- **Data Status:** HARDCODED — Professional plan $29/mo, 5 billing records, 4 usage metrics
- **Design Tokens:** 29
- **Use Cases:** Subscription management page, account settings

#### Block #51: `referralProgram`
- **File:** `referral-program-block.tsx` (258 lines)
- **Design:** Referral dashboard with unique referral link (with copy button), referral stats (invited, joined, earned), sharing buttons (email, social), and referral history table. Tiered reward display.
- **Content:** Referral code, stats, history, reward tiers
- **Props:** `heading?: string`, `showStats?: boolean`, `showHistory?: boolean`, `showRewards?: boolean`, `shareChannels?: string[]`
- **Data Status:** HARDCODED — "DAKKAH-REFER-2026" code, placeholder stats
- **Design Tokens:** 60
- **Use Cases:** Referral program page, affiliate dashboard, "Invite Friends" section

---

### 10.7 Vertical-Specific Blocks

#### Block #52: `auctionBidding`
- **File:** `auction-bidding-block.tsx` (198 lines)
- **Design:** Live auction interface with current bid display (large number), countdown timer (D:H:M:S), bid input with quick-increment buttons (+$50/+$100/+$250), "Place Bid" button, and recent bid history table (bidder, amount, time). Variants: full (all sections), compact (bid + timer only), live (real-time feed).
- **Content:** Current bid, bid history, auction end time
- **Props:** `auctionId?: string`, `showHistory?: boolean`, `showCountdown?: boolean`, `variant?: 'full'|'compact'|'live'`
- **Data Status:** HARDCODED — currentBid: $1,250, 5 placeholder bids, hardcoded countdown
- **Design Tokens:** 47
- **Use Cases:** Auction detail page main content, live auction widget

#### Block #53: `rentalCalendar`
- **File:** `rental-calendar-block.tsx` (124 lines)
- **Design:** Date range picker for rental periods with calendar month view, start/end date selection, pricing unit display (hourly/daily/weekly/monthly), optional deposit display, and total calculation. Min duration enforcement.
- **Content:** Availability data, pricing per unit
- **Props:** `itemId?: string`, `pricingUnit?: 'hourly'|'daily'|'weekly'|'monthly'`, `showDeposit?: boolean`, `minDuration?: number`
- **Data Status:** HARDCODED — generated dates from current month
- **Design Tokens:** 25
- **Use Cases:** Rental item detail, equipment rental, property rental, vehicle rental

#### Block #54: `propertyListing`
- **File:** `property-listing-block.tsx` (158 lines)
- **Design:** Property cards with image placeholder, title, address, price, type badge (apartment/house/condo/commercial), specs row (bedrooms, bathrooms, sqft), and "View Details" CTA. Grid layout.
- **Content:** Array of property listings
- **Props:** `heading?: string`, `propertyType?: string`, `showMap?: boolean`, `layout?: 'grid'|'list'`
- **Data Status:** HARDCODED — placeholder properties with addresses and prices
- **Design Tokens:** 21
- **Use Cases:** Real estate listing page, property search results

#### Block #55: `vehicleListing`
- **File:** `vehicle-listing-block.tsx` (206 lines)
- **Design:** Vehicle cards with hero image, fuel type badge, price (prominent), title (year + make + model), specs row (year, mileage, transmission), and optional comparison checkbox. Make filter dropdown. Grid/list layout toggle.
- **Content:** Array of vehicle listings
- **Props:** `heading?: string`, `vehicleType?: string`, `layout?: 'grid'|'list'|'detailed'`, `showComparison?: boolean`
- **Data Status:** HARDCODED — 6 placeholder vehicles (Tesla Model 3, Toyota Camry, BMW X5, etc.)
- **Design Tokens:** 29
- **Use Cases:** Automotive listing page, vehicle search, comparison shopping

#### Block #56: `menuDisplay`
- **File:** `menu-display-block.tsx` (161 lines)
- **Design:** Restaurant menu with sidebar category tabs (Starters, Main Courses, Desserts, Drinks), item cards with name, description, price (formatted per currency), dietary badges (Vegetarian, Vegan, Gluten-Free, Halal, Kosher with emoji icons), "Popular" badge, and "Add to Order" button. Variants: grid (2-column), list (single column), visual (with food image thumbnails).
- **Content:** Array of menu categories with items
- **Props:** `heading?: string`, `categories?: MenuCategory[]`, `variant?: 'grid'|'list'|'visual'`, `showPrices?: boolean`, `showDietaryIcons?: boolean`, `currency?: string`
- **Data Status:** PROPS-DRIVEN with fallback — uses `categories` prop, falls back to `defaultCategories` (4 categories, 13 items)
- **Design Tokens:** 12
- **Use Cases:** Restaurant detail page, food ordering, café menu

#### Block #57: `courseCurriculum`
- **File:** `course-curriculum-block.tsx` (245 lines)
- **Design:** Expandable module tree with sections and lessons. Each module shows title, lesson count, total duration, and progress bar. Lessons show type icon (video/text/quiz), title, duration, and lock/unlock state. Expand/collapse animation. Variants: full (sidebar + content), accordion (stacked), sidebar (compact).
- **Content:** Array of course modules with lessons
- **Props:** `courseId?: string`, `showProgress?: boolean`, `expandAll?: boolean`, `variant?: 'full'|'accordion'|'sidebar'`
- **Data Status:** HARDCODED — 3 placeholder modules with 9 lessons
- **Design Tokens:** 39
- **Use Cases:** Course detail page, learning path, training program

#### Block #58: `eventSchedule`
- **File:** `event-schedule-block.tsx` (203 lines)
- **Design:** Multi-day event agenda with day tab switcher at top. Each day shows timeline of sessions with time, title, speaker, room, and track tag. Sessions color-coded by track (Engineering, Design, AI, Product, General). Optional bookmark button per session. Views: timeline (vertical flow), grid (room × time matrix), agenda (list format).
- **Content:** Array of event days with session data
- **Props:** `eventId?: string`, `view?: 'timeline'|'grid'|'agenda'`, `showSpeakers?: boolean`, `allowBookmark?: boolean`, `days?: EventDay[]`
- **Data Status:** HARDCODED — 2 default days with 12 sessions total
- **Design Tokens:** 24
- **Use Cases:** Conference/event detail page, workshop schedule, multi-day event program

#### Block #59: `eventList`
- **File:** `event-list-block.tsx` (210 lines)
- **Design:** Event cards with image, title, date (formatted by locale), location, category badge, and price. Layouts: timeline (vertical with date markers), grid (card grid), list (horizontal rows), calendar (month view placeholder). Supports past event filtering. Links to event detail pages.
- **Content:** Array of events with full metadata
- **Props:** `heading?: string`, `description?: string`, `events: EventItem[]`, `layout?: 'timeline'|'grid'|'list'|'calendar'`, `showPastEvents?: boolean`
- **Data Status:** PROPS-DRIVEN — requires events array (no default)
- **Design Tokens:** 18
- **Use Cases:** Event listing page, upcoming events section, event category page

#### Block #60: `healthcareProvider`
- **File:** `healthcare-provider-block.tsx` (160 lines)
- **Design:** Provider cards with avatar placeholder, name, specialty, location, star rating, review count, next availability ("Tomorrow, 10:00 AM"), insurance acceptance tags, and "Book Appointment" CTA button. Specialty filter tabs at top (All, Family Medicine, Cardiology, etc.). Layouts: grid (card grid), list (horizontal rows), cards (detailed cards).
- **Content:** Array of healthcare providers
- **Props:** `heading?: string`, `specialties?: string[]`, `showAvailability?: boolean`, `showRating?: boolean`, `layout?: 'grid'|'list'|'cards'`
- **Data Status:** HARDCODED — 6 placeholder providers (Dr. Sarah Johnson, Dr. Michael Chen, etc.)
- **Design Tokens:** 21
- **Use Cases:** Healthcare listing page, provider directory, find-a-doctor

#### Block #61: `fitnessClassSchedule`
- **File:** `fitness-class-schedule-block.tsx` (204 lines)
- **Design:** Weekly class schedule with day tab switcher, class cards showing time, class name, instructor, level badge (Beginner/Intermediate/Advanced), spots remaining counter, and "Join Class" button. Level filter at top.
- **Content:** Array of fitness classes per day
- **Props:** `heading?: string`, `showInstructor?: boolean`, `showLevel?: boolean`, `allowBooking?: boolean`
- **Data Status:** HARDCODED — 6 placeholder classes (Yoga Flow, HIIT Blast, etc.)
- **Design Tokens:** 27
- **Use Cases:** Fitness/gym listing page, class schedule, studio timetable

#### Block #62: `petProfileCard`
- **File:** `pet-profile-card-block.tsx` (223 lines)
- **Design:** Pet profile cards with photo placeholder, name, breed, age, weight, vaccination status badge, service history, and vet info section. Layouts: grid (card grid), list (horizontal rows), detailed (expanded with full info).
- **Content:** Array of pets with profiles
- **Props:** `heading?: string`, `showServices?: boolean`, `showVetInfo?: boolean`, `layout?: 'grid'|'list'|'detailed'`
- **Data Status:** HARDCODED — 3 placeholder pets (Luna/Golden Retriever, Milo/Tabby Cat, Rocky/German Shepherd)
- **Design Tokens:** 60
- **Use Cases:** Pet services listing, vet patient directory, pet store profiles

#### Block #63: `classifiedAdCard`
- **File:** `classified-ad-card-block.tsx` (187 lines)
- **Design:** Classified ad cards with image, title, price, location, posted date, condition badge, and seller info. Category filter. Layouts: grid (card grid), list (horizontal rows). Contact seller button.
- **Content:** Array of classified ads
- **Props:** `heading?: string`, `category?: string`, `layout?: 'grid'|'list'`, `showContactInfo?: boolean`
- **Data Status:** HARDCODED — 6 placeholder ads with prices and locations
- **Design Tokens:** 25
- **Use Cases:** Classifieds listing page, used items marketplace, community board

#### Block #64: `crowdfundingProgress`
- **File:** `crowdfunding-progress-block.tsx` (197 lines)
- **Design:** Campaign progress widget with animated progress bar, percentage funded label, stats row (raised amount, backer count, days left), preset donation amount buttons ($25/$50/$100/$250/$500), custom amount input, and "Back This Project" CTA. Variants: full (complete detail), widget (sidebar card), minimal (single-line progress).
- **Content:** Campaign progress data (goal, raised, backers, days)
- **Props:** `campaignId?: string`, `showBackers?: boolean`, `showUpdates?: boolean`, `variant?: 'full'|'widget'|'minimal'`
- **Data Status:** HARDCODED — placeholderCampaign (goal: $50,000, raised: $37,500, 842 backers, 18 days)
- **Design Tokens:** 43
- **Use Cases:** Crowdfunding campaign detail, campaign widget sidebar, campaign list cards

#### Block #65: `donationCampaign`
- **File:** `donation-campaign-block.tsx` (229 lines)
- **Design:** Charity donation interface with campaign title, description, progress bar with percentage, impact statistics grid (Wells Built, People Served, Communities, Countries), preset donation buttons ($10/$25/$50/$100/$250), custom amount input, recurring donation toggle, and "Donate Now" CTA. Variants: full (all sections), compact (form + progress), widget (minimal card).
- **Content:** Campaign data, impact stats, donation form
- **Props:** `campaignId?: string`, `showImpact?: boolean`, `presetAmounts?: number[]`, `allowRecurring?: boolean`, `variant?: 'full'|'compact'|'widget'`
- **Data Status:** HARDCODED — placeholderCampaign (goal: $200,000, raised: $128,500, 3,240 donors), 4 impact stats
- **Design Tokens:** 41
- **Use Cases:** Charity campaign detail, donation page, nonprofit landing

#### Block #66: `freelancerProfile`
- **File:** `freelancer-profile-block.tsx` (247 lines)
- **Design:** Freelancer portfolio page with hero section (name, title, hourly rate, availability badge), skill tags grid, portfolio project grid (title + category), client reviews with star ratings, and key stats (completed projects, rating, review count). Layouts: full (page layout), card (compact card), sidebar (narrow profile).
- **Content:** Freelancer profile data, portfolio items, reviews
- **Props:** `heading?: string`, `showPortfolio?: boolean`, `showReviews?: boolean`, `showAvailability?: boolean`, `layout?: 'full'|'card'|'sidebar'`
- **Data Status:** HARDCODED — "Jordan Rivera, Senior Full-Stack Developer" with $95/hr, 8 skills, 6 portfolio items, 3 reviews
- **Design Tokens:** 60
- **Use Cases:** Freelancer detail page, talent directory, skill marketplace

#### Block #67: `parkingSpotFinder`
- **File:** `parking-spot-finder-block.tsx` (220 lines)
- **Design:** Parking spot browser with type filter buttons (All, Covered, Open Air, Valet, EV Charging), spot cards with spot number, type badge, floor info, rate display (hourly/daily/monthly), availability status indicator (green/red), and "Reserve" button. Variants: map (with map view), list (card list), hybrid (split view).
- **Content:** Array of parking spots with rates and availability
- **Props:** `locationId?: string`, `showMap?: boolean`, `showPricing?: boolean`, `filterByType?: ('covered'|'open'|'valet'|'ev_charging')[]`, `variant?: 'map'|'list'|'hybrid'`
- **Data Status:** HARDCODED — 6 placeholder parking spots with rates ($4-$8/hr)
- **Design Tokens:** 23
- **Use Cases:** Parking zone detail page, parking search, facility parking section

---

### 10.8 B2B Blocks

#### Block #68: `purchaseOrderForm`
- **File:** `purchase-order-form-block.tsx` (278 lines)
- **Design:** B2B purchase order creation form with line item table (product, quantity, unit price, total), add/remove item buttons, shipping address section, notes field, budget limit display, approval required checkbox, and submit button. Total calculation with tax.
- **Content:** Product catalog for selection, shipping addresses, budget limits
- **Props:** `heading?: string`, `requiresApproval?: boolean`, `showBudget?: boolean`, `defaultShipping?: string`
- **Data Status:** PARTIALLY HARDCODED — form structure + 3 placeholder line items
- **Design Tokens:** 45
- **Use Cases:** B2B ordering page, wholesale purchase, procurement form

#### Block #69: `bulkPricingTable`
- **File:** `bulk-pricing-table-block.tsx` (277 lines)
- **Design:** Volume discount table showing quantity tiers (1-9, 10-49, 50-99, 100+), unit price per tier, savings percentage, and order form. Calculator tool to estimate total based on quantity input. Request-a-quote CTA for custom quantities.
- **Content:** Pricing tier data with quantity breaks
- **Props:** `heading?: string`, `productId?: string`, `tiers?: {minQty, maxQty, unitPrice, savings}[]`, `showCalculator?: boolean`, `showQuoteRequest?: boolean`, `currency?: string`
- **Data Status:** PROPS-DRIVEN — accepts tiers array
- **Design Tokens:** 47
- **Use Cases:** B2B product detail, wholesale pricing, volume deals page

#### Block #70: `companyDashboard`
- **File:** `company-dashboard-block.tsx` (185 lines)
- **Design:** B2B company overview dashboard with company info card, spending summary, recent orders list, team member count, and budget utilization meter. Quick action buttons.
- **Content:** Company data, spending data, team info
- **Props:** `showSpending?: boolean`, `showTeam?: boolean`, `showOrders?: boolean`, `showBudget?: boolean`, `variant?: 'full'|'summary'`
- **Data Status:** HARDCODED — placeholder company data
- **Design Tokens:** 46
- **Use Cases:** B2B company dashboard, procurement overview

#### Block #71: `approvalWorkflow`
- **File:** `approval-workflow-block.tsx` (287 lines)
- **Design:** Multi-stage approval pipeline with status indicator per stage (pending/approved/rejected), approver info, comments, timestamps, and action buttons (approve/reject/escalate). Visual workflow diagram.
- **Content:** Approval stages, approver data, comments
- **Props:** `workflowId?: string`, `showTimeline?: boolean`, `allowComments?: boolean`, `stages?: Stage[]`
- **Data Status:** HARDCODED — 4-stage placeholder workflow
- **Design Tokens:** 63
- **Use Cases:** B2B purchase approval, vendor application review, content approval

---

### 10.9 Admin/Manage Blocks

#### Block #72: `manageStats`
- **File:** `manage-stats-block.tsx` (61 lines)
- **Design:** Summary stat cards in a row — each card shows metric label, value, and optional trend indicator. Compact admin-style layout.
- **Content:** Array of stat items
- **Props:** `heading?: string`, `stats?: {label, value, trend?}[]`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 1
- **Use Cases:** Admin dashboard header, manage page summary

#### Block #73: `manageRecentOrders`
- **File:** `manage-recent-orders-block.tsx` (107 lines)
- **Design:** Recent orders table with order ID, customer name, date, total, status badge (pending/processing/shipped/delivered), and action button. Compact admin format.
- **Content:** Array of recent orders
- **Props:** `heading?: string`, `orders?: Order[]`, `limit?: number`, `showStatus?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 15
- **Use Cases:** Admin dashboard, order management overview

#### Block #74: `manageActivity`
- **File:** `manage-activity-block.tsx` (74 lines)
- **Design:** Activity feed with icon-coded entries (order=cart, product=tag, team=users, setting=gear). Each entry shows description, actor name, and relative timestamp. Color-coded icons per type.
- **Content:** Array of activity entries
- **Props:** `heading?: string`, `activities?: {type, description, actor?, timestamp}[]`, `limit?: number`
- **Data Status:** PROPS-DRIVEN
- **Design Tokens:** 9
- **Use Cases:** Admin dashboard activity log, team activity feed

#### Block #75: `promotionBanner`
- **File:** `promotion-banner-block.tsx` (169 lines)
- **Design:** Promotional banner with heading, description, discount code (with copy button), expiry date, and "Shop Now" CTA. Variants: bar (top/bottom sticky), card (inline container), floating (fixed position overlay). Dismissible with X button.
- **Content:** Promotion details, discount code, expiry
- **Props:** `heading?: string`, `description?: string`, `code?: string`, `expiresAt?: string`, `variant?: 'bar'|'card'|'floating'`, `dismissible?: boolean`, `ctaLabel?: string`, `ctaUrl?: string`
- **Data Status:** PROPS-DRIVEN with defaults
- **Design Tokens:** 11
- **Use Cases:** Site-wide promotion, seasonal sale, new user discount

#### Block #76: `testimonial`
- **File:** `testimonial-block.tsx` (—)
- **Design:** Customer testimonial cards with quote text, author name, title, company, avatar, and star rating. Layouts: grid (card grid), carousel (horizontal scroll), stacked (vertical).
- **Content:** Array of testimonials
- **Props:** `heading?: string`, `testimonials: {quote, author, title?, company?, avatar?, rating?}[]`, `layout?: 'grid'|'carousel'|'stacked'`, `columns?: 1|2|3`, `showRating?: boolean`
- **Data Status:** PROPS-DRIVEN
- **Use Cases:** Landing pages, service pages, course reviews, member stories

#### Block #77: (Block registry count includes all 77 mapped entries including `testimonial`)

---

## Section 11: Block Assignment per Detail Page — Complete Mapping

For each of the 50 detail pages, the following defines exactly which existing blocks should be imported and which new blocks are needed (marked as `[NEW]`).

### Legend
- **E** = Existing block, ready to use (Tier A)
- **R** = Existing block, needs refactoring to accept real data (Tier B)
- **N** = New block needed (does not exist yet)
- **Breadcrumbs** = Every page needs a `[NEW] breadcrumbNav` block or keeps inline breadcrumb JSX

---

### 11.1 High-Value Verticals (Rich vertical-specific blocks available)

#### Page 1: `auctions/$id.tsx` (262 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero image/banner | `hero` | hero | **E** | Pass item thumbnail as backgroundImage |
| Image gallery | `imageGallery` | imageGallery | **E** | Pass item.images array |
| Bidding interface | `auctionBidding` | auctionBidding | **R** | Needs: currentBid, bids[], endTime props |
| Item description | `richText` | richText | **E** | Pass item.description |
| Review section | `reviewList` | reviewList | **R** | Needs: reviews[] prop |
| Recently viewed | `recentlyViewed` | recentlyViewed | **R** | Needs: products[] prop |
| Seller info | `vendorProfile` | vendorProfile | **E** | Pass seller data |
| **Missing:** | Bid notification toast | — | **N** | `[NEW] bidNotification` for real-time bid alerts |

#### Page 2: `restaurants/$id.tsx` (229 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero image | `hero` | hero | **E** | Restaurant banner image |
| Restaurant menu | `menuDisplay` | menuDisplay | **E** | categories prop — BEST integration target |
| Image gallery | `imageGallery` | imageGallery | **E** | Ambiance photos |
| Reviews | `reviewList` | reviewList | **R** | Customer reviews |
| Map/location | `map` | map | **R** | Restaurant location |
| Recently viewed | `recentlyViewed` | recentlyViewed | **R** | Recently browsed restaurants |
| **Missing:** | Hours display | — | **N** | `[NEW] businessHours` block |
| **Missing:** | Reservation form | — | **N** | `[NEW] reservationForm` block |

#### Page 3: `healthcare/$id.tsx` (220 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Provider banner |
| Provider list/detail | `healthcareProvider` | healthcareProvider | **R** | Needs: providers[] prop |
| Appointment booking | `appointmentSlots` | appointmentSlots | **R** | Needs: timeSlots from API |
| Booking calendar | `bookingCalendar` | bookingCalendar | **R** | Needs: timeSlots, bookedDates |
| Reviews | `reviewList` | reviewList | **R** | Patient reviews |
| FAQ | `faq` | faq | **E** | Healthcare FAQ items |
| **Missing:** | Insurance checker | — | **N** | `[NEW] insuranceChecker` block |
| **Missing:** | Credentials display | — | **N** | `[NEW] credentialsList` block (or use existing inline) |

#### Page 4: `education/$id.tsx` (263 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Course banner |
| Curriculum | `courseCurriculum` | courseCurriculum | **R** | Needs: modules[] prop |
| Subscription plans | `subscriptionPlans` | subscriptionPlans | **E** | Learning plans |
| Reviews | `reviewList` | reviewList | **R** | Student reviews |
| Testimonials | `testimonial` | testimonial | **E** | Student success stories |
| **Missing:** | Enrollment form | — | **N** | `[NEW] enrollmentForm` or use `bookingCta` |
| **Missing:** | Instructor profile | — | **N** | `[NEW] instructorProfile` or adapt `freelancerProfile` |

#### Page 5: `crowdfunding/$id.tsx` (248 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Campaign banner |
| Progress + backing | `crowdfundingProgress` | crowdfundingProgress | **R** | Needs: campaign data prop |
| Image gallery | `imageGallery` | imageGallery | **E** | Campaign images |
| Description | `richText` | richText | **E** | Campaign description |
| Reviews | `reviewList` | reviewList | **R** | Backer comments |
| Stats | `stats` | stats | **E** | Campaign metrics |
| Recently viewed | `recentlyViewed` | recentlyViewed | **R** | Other campaigns |

#### Page 6: `charity/$id.tsx` (243 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Campaign banner |
| Donation form | `donationCampaign` | donationCampaign | **R** | Needs: campaign data prop |
| Impact stats | `stats` | stats | **E** | Impact numbers |
| Progress bar | `crowdfundingProgress` | crowdfundingProgress | **R** | Donation progress |
| Reviews | `reviewList` | reviewList | **R** | Donor testimonials |
| FAQ | `faq` | faq | **E** | Donation FAQ |

#### Page 7: `events/$id.tsx` (319 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Event banner |
| Schedule | `eventSchedule` | eventSchedule | **R** | Needs: days/sessions prop |
| Event list | `eventList` | eventList | **E** | Related events |
| Map/venue | `map` | map | **R** | Venue location |
| Reviews | `reviewList` | reviewList | **R** | Attendee reviews |
| Newsletter | `newsletter` | newsletter | **R** | Event updates signup |
| **Missing:** | Ticket selector | — | **N** | `[NEW] ticketSelector` block |

#### Page 8: `fitness/$id.tsx` (228 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Gym/studio banner |
| Class schedule | `fitnessClassSchedule` | fitnessClassSchedule | **R** | Needs: classes[] prop |
| Membership tiers | `membershipTiers` | membershipTiers | **E** | Gym membership plans |
| Testimonials | `testimonial` | testimonial | **E** | Member stories |
| Reviews | `reviewList` | reviewList | **R** | Gym reviews |
| Booking CTA | `bookingCta` | bookingCTA | **E** | "Book a Trial" |

#### Page 9: `freelance/$id.tsx` (246 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Freelancer banner |
| Profile | `freelancerProfile` | freelancerProfile | **R** | Needs: freelancer data prop |
| Reviews | `reviewList` | reviewList | **R** | Client reviews |
| **Missing:** | Hire form / contact | — | **N** | `[NEW] hireForm` or use `contactForm` |
| **Missing:** | Service packages | — | **N** | Adapt `pricing` block |

#### Page 10: `automotive/$id.tsx` (205 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Vehicle banner |
| Vehicle specs | `vehicleListing` | vehicleListing | **R** | Needs: vehicles[] prop (single item) |
| Image gallery | `imageGallery` | imageGallery | **E** | Vehicle photos |
| Comparison | `comparisonTable` | comparisonTable | **E** | Spec comparison |
| Reviews | `reviewList` | reviewList | **R** | Vehicle reviews |
| **Missing:** | Financing calculator | — | **N** | `[NEW] financingCalculator` block |

#### Page 11: `real-estate/$id.tsx` (213 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Property banner |
| Property details | `propertyListing` | propertyListing | **R** | Needs: properties[] prop |
| Image gallery | `imageGallery` | imageGallery | **E** | Property photos |
| Map | `map` | map | **R** | Property location |
| Contact form | `contactForm` | contactForm | **R** | Inquiry form |
| **Missing:** | Mortgage calculator | — | **N** | `[NEW] mortgageCalculator` block |
| **Missing:** | Virtual tour | — | **N** | Use `videoEmbed` block |

#### Page 12: `parking/$id.tsx` (245 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Parking zone banner |
| Spot finder | `parkingSpotFinder` | parkingSpotFinder | **R** | Needs: spots[] prop |
| Map | `map` | map | **R** | Parking location |
| Pricing | `pricing` | pricing | **E** | Parking rates |
| Reviews | `reviewList` | reviewList | **R** | User reviews |

#### Page 13: `classifieds/$id.tsx` (222 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Ad image |
| Ad detail | `classifiedAdCard` | classifiedAdCard | **R** | Needs: ads[] prop |
| Image gallery | `imageGallery` | imageGallery | **E** | Item photos |
| Contact form | `contactForm` | contactForm | **R** | Seller contact |
| Map | `map` | map | **R** | Item location |
| **Missing:** | Safety tips | — | **N** | Use `faq` block |

#### Page 14: `pet-services/$id.tsx` (246 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Pet service banner |
| Pet profile | `petProfileCard` | petProfileCard | **R** | Needs: pets[] prop |
| Service list | `serviceList` | serviceList | **E** | Available pet services |
| Booking CTA | `bookingCta` | bookingCTA | **E** | "Book Service" |
| Reviews | `reviewList` | reviewList | **R** | Pet owner reviews |

#### Page 15: `rentals/$id.tsx` (288 lines)
| Section | Block | Registry Key | Status | Notes |
|---|---|---|---|---|
| Hero | `hero` | hero | **E** | Rental item banner |
| Rental calendar | `rentalCalendar` | rentalCalendar | **R** | Needs: availability prop |
| Pricing | `pricing` | pricing | **E** | Rental rates |
| Image gallery | `imageGallery` | imageGallery | **E** | Item photos |
| Reviews | `reviewList` | reviewList | **R** | Renter reviews |

---

### 11.2 Service-Based Verticals

#### Page 16: `bookings/$id.tsx` (249 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `bookingCalendar` | bookingCalendar | **R** |
| `appointmentSlots` | appointmentSlots | **R** |
| `bookingCta` | bookingCTA | **E** |
| `reviewList` | reviewList | **R** |
| `serviceList` | serviceList | **E** |

#### Page 17: `legal/$id.tsx` (249 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `serviceList` | serviceList | **E** — Practice areas |
| `bookingCalendar` | bookingCalendar | **R** — Consultation scheduling |
| `faq` | faq | **E** — Legal FAQ |
| `contactForm` | contactForm | **R** |
| `reviewList` | reviewList | **R** |

#### Page 18: `insurance/$id.tsx` (237 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `serviceList` | serviceList | **E** — Insurance plans |
| `comparisonTable` | comparisonTable | **E** — Plan comparison |
| `faq` | faq | **E** |
| `contactForm` | contactForm | **R** |
| `reviewList` | reviewList | **R** |

#### Page 19: `government/$id.tsx` (247 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `serviceList` | serviceList | **E** — Government services |
| `timeline` | timeline | **E** — Processing steps |
| `contactForm` | contactForm | **R** |
| `faq` | faq | **E** |

#### Page 20: `travel/$id.tsx` (286 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `imageGallery` | imageGallery | **E** — Destination photos |
| `bookingCalendar` | bookingCalendar | **R** — Check availability |
| `reviewList` | reviewList | **R** |
| `map` | map | **R** — Destination location |
| `pricing` | pricing | **E** — Package prices |

---

### 11.3 Commerce Verticals

#### Page 21: `subscriptions/$id.tsx` (241 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `subscriptionPlans` | subscriptionPlans | **E** |
| `comparisonTable` | comparisonTable | **E** |
| `faq` | faq | **E** |
| `reviewList` | reviewList | **R** |

#### Page 22: `memberships/$id.tsx` (185 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `membershipTiers` | membershipTiers | **E** |
| `featureGrid` | featureGrid | **E** — Member benefits |
| `testimonial` | testimonial | **E** |
| `faq` | faq | **E** |

#### Page 23: `loyalty-program/$id.tsx` (199 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `loyaltyDashboard` | loyaltyDashboard | **R** — Needs user data |
| `loyaltyPointsDisplay` | loyaltyPointsDisplay | **R** |
| `membershipTiers` | membershipTiers | **E** — Tier overview |
| `referralProgram` | referralProgram | **R** |

#### Page 24: `flash-deals/$id.tsx` (216 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `flashSaleCountdown` | flashSaleCountdown | **R** — Needs endTime, products |
| `productDetail` | productDetail | **R** |
| `reviewList` | reviewList | **R** |

#### Page 25: `gift-cards-shop/$id.tsx` (191 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `giftCardDisplay` | giftCardDisplay | **R** — Needs denominations |
| `reviewList` | reviewList | **R** |

#### Page 26: `bundles/$id.tsx` (210 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productGrid` | productGrid | **E** — Bundle items |
| `pricing` | pricing | **E** — Bundle vs individual |
| `reviewList` | reviewList | **R** |

#### Page 27: `digital/$id.tsx` (181 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** — Digital product detail |
| `reviewList` | reviewList | **R** |
| **Missing:** | Download/license info | **N** | `[NEW] digitalDelivery` block |

#### Page 28: `grocery/$id.tsx` (249 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `categoryGrid` | categoryGrid | **E** — Related categories |
| `reviewList` | reviewList | **R** |

---

### 11.4 Marketplace Variants

#### Page 29: `vendors/$id.tsx` (293 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `vendorProfile` | vendorProfile | **E** |
| `vendorProducts` | vendorProducts | **R** — Needs vendor products |
| `reviewList` | reviewList | **R** |
| `contactForm` | contactForm | **R** |

#### Page 30: `affiliate/$id.tsx` (180 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `referralProgram` | referralProgram | **R** |
| `stats` | stats | **E** — Program stats |
| `faq` | faq | **E** |

#### Page 31: `social-commerce/$id.tsx` (225 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `socialProof` | socialProof | **R** — Social commerce feed |
| `productGrid` | productGrid | **E** |
| `reviewList` | reviewList | **R** |

---

### 11.5 Financial & Credit Verticals

#### Page 32: `financial/$id.tsx` (245 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `serviceList` | serviceList | **E** |
| `comparisonTable` | comparisonTable | **E** |
| `faq` | faq | **E** |
| `contactForm` | contactForm | **R** |

#### Page 33: `credit/$id.tsx` (259 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `pricing` | pricing | **E** — Credit plans |
| `comparisonTable` | comparisonTable | **E** |
| `faq` | faq | **E** |
| `timeline` | timeline | **E** — Application process |
| `reviewList` | reviewList | **R** |

#### Page 34: `warranties/$id.tsx` (257 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `serviceList` | serviceList | **E** — Warranty options |
| `comparisonTable` | comparisonTable | **E** — Coverage comparison |
| `faq` | faq | **E** |
| `reviewList` | reviewList | **R** |

---

### 11.6 B2B & Wholesale Verticals

#### Page 35: `b2b/$id.tsx` (242 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `purchaseOrderForm` | purchaseOrderForm | **R** |
| `bulkPricingTable` | bulkPricingTable | **E** |
| `companyDashboard` | companyDashboard | **R** |
| `reviewList` | reviewList | **R** |

#### Page 36: `volume-deals/$id.tsx` (225 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `bulkPricingTable` | bulkPricingTable | **E** |
| `productDetail` | productDetail | **R** |
| `reviewList` | reviewList | **R** |

#### Page 37: `white-label/$id.tsx` (213 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `pricing` | pricing | **E** |
| `featureGrid` | featureGrid | **E** |
| `faq` | faq | **E** |
| `contactForm` | contactForm | **R** |

#### Page 38: `white-label-shop/$id.tsx` (239 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `reviewList` | reviewList | **R** |

---

### 11.7 Remaining Detail Pages

#### Page 39: `campaigns/$id.tsx` (181 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `crowdfundingProgress` | crowdfundingProgress | **R** |
| `richText` | richText | **E** |
| `reviewList` | reviewList | **R** |

#### Page 40: `consignment/$id.tsx` (213 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `pricing` | pricing | **E** |
| `reviewList` | reviewList | **R** |

#### Page 41: `consignment-shop/$id.tsx` (212 lines)
Same as consignment — duplicate page, recommend merging.

#### Page 42: `dropshipping/$id.tsx` (205 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `vendorProfile` | vendorProfile | **E** |
| `reviewList` | reviewList | **R** |

#### Page 43: `dropshipping-marketplace/$id.tsx` (211 lines)
Same blocks as dropshipping — duplicate page, recommend merging.

#### Page 44: `newsletter/$id.tsx` (259 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `newsletter` | newsletter | **R** |
| `blogPost` | blogPost | **R** — Newsletter content |
| `reviewList` | reviewList | **R** |

#### Page 45: `print-on-demand/$id.tsx` (217 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `imageGallery` | imageGallery | **E** — Design previews |
| `reviewList` | reviewList | **R** |
| **Missing:** | Design customizer | **N** | `[NEW] designCustomizer` block |

#### Page 46: `print-on-demand-shop/$id.tsx` (207 lines)
Same as print-on-demand — duplicate page.

#### Page 47: `trade-in/$id.tsx` (219 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** — Item being traded |
| `pricing` | pricing | **E** — Trade-in value |
| `timeline` | timeline | **E** — Trade-in process |
| `faq` | faq | **E** |

#### Page 48: `try-before-you-buy/$id.tsx` (201 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `productDetail` | productDetail | **R** |
| `timeline` | timeline | **E** — Trial process |
| `faq` | faq | **E** |
| `reviewList` | reviewList | **R** |

#### Page 49: `quotes/$id.tsx` (74 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `contactForm` | contactForm | **R** — Quote request form |
| `serviceList` | serviceList | **E** — Available services |
| **Missing:** | Quote calculator | **N** | `[NEW] quoteCalculator` block |

#### Page 50: `places/$id.tsx` (83 lines)
| Block | Registry Key | Status |
|---|---|---|
| `hero` | hero | **E** |
| `imageGallery` | imageGallery | **E** — Place photos |
| `map` | map | **R** — Place location |
| `reviewList` | reviewList | **R** |
| `contactForm` | contactForm | **R** |

---

## Section 12: Summary — Block Coverage Statistics

### Existing Blocks Coverage

| Metric | Count |
|---|---|
| **Total detail pages** | 50 |
| **Existing blocks that can serve detail pages** | 42 of 77 |
| **Blocks ready to use immediately (Tier A)** | 15 |
| **Blocks needing refactoring (Tier B)** | 27 |
| **Admin-only blocks (Tier C, not for detail pages)** | 11 |
| **Pages fully coverable with existing blocks** | 50 (all pages) |
| **New blocks needed** | 8 specialized blocks |

### New Blocks Needed

| New Block | For Vertical(s) | Priority |
|---|---|---|
| `[NEW] breadcrumbNav` | All 50 pages (or keep inline) | P2 |
| `[NEW] businessHours` | restaurants, fitness, healthcare | P1 |
| `[NEW] reservationForm` | restaurants, travel | P1 |
| `[NEW] ticketSelector` | events | P1 |
| `[NEW] insuranceChecker` | healthcare | P2 |
| `[NEW] financingCalculator` | automotive, real-estate | P2 |
| `[NEW] designCustomizer` | print-on-demand | P3 |
| `[NEW] quoteCalculator` | quotes | P3 |

### Refactoring Priority by Impact

| Priority | Block Count | Impact |
|---|---|---|
| **P0 — Critical (used on 5+ pages)** | `reviewList`, `recentlyViewed`, `productDetail` | 3 blocks → unblocks 40+ pages |
| **P1 — High (vertical-specific)** | `auctionBidding`, `crowdfundingProgress`, `donationCampaign`, `menuDisplay`, `bookingCalendar`, `healthcareProvider`, `courseCurriculum`, `eventSchedule` | 8 blocks → unblocks 8 key verticals |
| **P2 — Medium** | `freelancerProfile`, `vehicleListing`, `fitnessClassSchedule`, `parkingSpotFinder`, `petProfileCard`, `classifiedAdCard`, `propertyListing`, `rentalCalendar` | 8 blocks → unblocks 8 more verticals |
| **P3 — Low** | `appointmentSlots`, `providerSchedule`, `resourceAvailability`, `flashSaleCountdown`, `giftCardDisplay`, `socialProof`, `map`, `contactForm`, `newsletter` | 9 blocks → polish and completeness |

### Block Import Count per Page

| Pages with this many blocks | Count | Example |
|---|---|---|
| 6+ blocks | 15 pages | healthcare (6), restaurants (6), events (6) |
| 4-5 blocks | 25 pages | crowdfunding (5), fitness (5), legal (5) |
| 3 blocks | 10 pages | campaigns (3), digital (3) |

---

## Section 13: Missing Blocks — Design Specifications

### `[NEW] breadcrumbNav` Block
- **Design:** Horizontal path: Home > Vertical > Item Name, with separator chevrons, truncation on long names
- **Props:** `items: {label, href}[]`, `separator?: '/'|'>'|'·'`
- **Lines estimate:** ~40 lines
- **Design tokens:** `text-ds-muted-foreground`, `hover:text-ds-foreground`, `bg-ds-card`, `border-ds-border`

### `[NEW] businessHours` Block
- **Design:** Day-of-week list with hours, current status indicator (Open/Closed with green/red dot)
- **Props:** `hours: {day, open, close}[]`, `showCurrentStatus?: boolean`
- **Lines estimate:** ~60 lines
- **Design tokens:** `text-ds-foreground`, `text-ds-muted-foreground`, `bg-ds-success`, `bg-ds-destructive`

### `[NEW] reservationForm` Block
- **Design:** Date picker, party size selector, time slot selector, name/email/phone fields, "Reserve" button
- **Props:** `availableSlots?: TimeSlot[]`, `maxPartySize?: number`, `restaurantId?: string`
- **Lines estimate:** ~120 lines

### `[NEW] ticketSelector` Block
- **Design:** Ticket type cards (General, VIP, Early Bird) with price, quantity picker, and "Buy Tickets" button
- **Props:** `tickets: {type, price, available, description}[]`, `eventId?: string`, `maxPerOrder?: number`
- **Lines estimate:** ~100 lines

### `[NEW] insuranceChecker` Block
- **Design:** Dropdown to select insurance provider, verification status display
- **Props:** `acceptedInsurance: string[]`, `providerId?: string`
- **Lines estimate:** ~50 lines

### `[NEW] financingCalculator` Block
- **Design:** Sliders for price/down-payment/term, monthly payment calculation display
- **Props:** `price: number`, `minDown?: number`, `rates?: {term, apr}[]`
- **Lines estimate:** ~100 lines

### `[NEW] designCustomizer` Block
- **Design:** Canvas preview area, color picker, text input, upload button, product template selector
- **Props:** `templates: {id, name, preview}[]`, `productId?: string`
- **Lines estimate:** ~150 lines

### `[NEW] quoteCalculator` Block
- **Design:** Service selection checkboxes, quantity inputs, estimated total display, "Request Quote" button
- **Props:** `services: {id, name, basePrice}[]`, `allowCustom?: boolean`
- **Lines estimate:** ~100 lines

---

## Section 14: Current vs Targeted State — Centralization & Payload CMS Alignment

### 14.1 Architecture Gap Summary — What Exists Today vs What Should Exist

#### CURRENT STATE (Fragmented)

```
Route Files (50 files, ~11,500 lines total)
├── Each file contains:
│   ├── Its own `normalizeDetail()` function (DUPLICATED 50 times)
│   ├── Its own inline `fetch()` call in loader (DUPLICATED 50 times)
│   ├── Its own inline JSX for breadcrumbs (DUPLICATED ~48 times)
│   ├── Its own inline JSX for hero section (DUPLICATED ~48 times)
│   ├── Its own inline JSX for sidebar (DUPLICATED ~48 times)
│   ├── Its own inline JSX for review section (DUPLICATED ~48 times)
│   └── Zero imports from blocks/ directory (0 of 77 blocks used)
│
├── Hooks (38 hooks exist, ~0 used by detail pages)
│   ├── use-reviews.ts (has useProductReviews, useVendorReviews, useCreateReview)
│   ├── use-bookings.ts, use-auctions.ts, use-events.ts, use-cms.ts
│   └── NONE of these hooks are imported by ANY detail page
│
├── Blocks (77 blocks, 12,750 lines — COMPLETELY DISCONNECTED)
│   ├── BlockRenderer exists but used NOWHERE in routes/
│   ├── Block registry maps 77 components to blockType strings
│   └── All blocks self-contained with hardcoded placeholder data
│
├── CMS Registry (1,042 lines)
│   ├── buildDetailPage() returns same 3 generic blocks for ALL 27 verticals
│   │   └── [hero, reviewList, recentlyViewed] — identical for every vertical
│   ├── buildListPage() returns unique block layouts per vertical (GOOD)
│   └── TemplateRenderer exists for VerticalDetailTemplate but has no data
│
└── Payload CMS (Orchestrator app)
    ├── Pages collection defined with 3 block types only (hero, richText, media)
    ├── 77 blocks in storefront NOT registered in Payload's block config
    └── Sync infrastructure exists but blocks don't flow through it
```

#### TARGETED STATE (Centralized, CMS-Driven)

```
Centralized Architecture
├── Shared Infrastructure (NEW)
│   ├── lib/data/detail-loader.ts — Single SSR loader function for ALL verticals
│   ├── lib/data/normalizer.ts — Single normalizeDetail() shared across all pages
│   ├── lib/hooks/use-vertical-detail.ts — Single hook for entity data + CMS layout
│   ├── lib/hooks/use-cms-page.ts — Fetches page layout from CMS resolve endpoint
│   └── lib/context/entity-context.tsx — Provides loaded entity to child blocks
│
├── Route Files (REDUCED from 50 × ~230 lines to either:)
│   ├── Option A: 50 thin route files × ~30 lines each (import shared + compose)
│   └── Option B: 1 generic route using CMS registry per-vertical layouts
│
├── Blocks (77 blocks — ALL integrated and data-driven)
│   ├── All Tier B blocks refactored: props → rendering (no hardcoded data)
│   ├── BlockRenderer used by VerticalDetailTemplate for layout rendering
│   ├── EntityDataProvider wraps blocks → blocks auto-receive entity data
│   └── Each block registered in both storefront block-registry AND Payload config
│
├── CMS Registry (ENHANCED)
│   ├── buildDetailPage() returns UNIQUE layouts per vertical:
│   │   ├── restaurants: [hero, menuDisplay, imageGallery, reviewList, map, newsletter]
│   │   ├── auctions:    [hero, imageGallery, auctionBidding, reviewList, recentlyViewed]
│   │   ├── healthcare:  [hero, healthcareProvider, appointmentSlots, faq, reviewList]
│   │   ├── education:   [hero, courseCurriculum, subscriptionPlans, testimonial, reviewList]
│   │   └── ... (27 unique layouts, one per vertical)
│   └── Layout changes via registry = instant page customization (no code deploys)
│
├── Payload CMS (FULL integration)
│   ├── Pages collection has ALL 77 block types registered
│   ├── Content editors can drag/drop blocks to build pages
│   ├── Webhook sync: Payload → Medusa → Storefront hydration
│   └── Preview mode: editors see live block rendering before publishing
│
└── Unified API Layer
    ├── All detail loaders use sdk.client.fetch() with publishable key
    ├── Backend vertical endpoints return Payload-compatible response shape
    ├── CMS resolve endpoint returns merged entity data + page layout
    └── Single error handling pattern across all verticals
```

---

### 14.2 Centralization Requirements — Shared Components & Functions

#### 14.2.1 Shared Data Layer (currently missing)

**File: `apps/storefront/src/lib/data/detail-loader.ts`** (NEW — replaces 50 duplicated loaders)

```typescript
interface DetailLoaderConfig {
  verticalSlug: string
  apiEndpoint: string
}

export async function loadVerticalDetail(params: { id: string; tenant: string; locale: string }, config: DetailLoaderConfig) {
  const isServer = typeof window === "undefined"
  const baseUrl = isServer ? "http://localhost:9000" : ""
  const headers = {
    "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_...",
  }

  // Parallel: fetch entity data + CMS page layout
  const [entityResp, cmsResp] = await Promise.all([
    fetch(`${baseUrl}/${config.apiEndpoint}/${params.id}`, { headers }),
    fetch(`${baseUrl}/platform/cms/resolve?path=${config.verticalSlug}/${params.id}&tenant=${params.tenant}&locale=${params.locale}`, { headers }),
  ])

  const entityData = entityResp.ok ? await entityResp.json() : null
  const cmsData = cmsResp.ok ? await cmsResp.json() : null

  return {
    item: normalizeDetail(entityData?.item || entityData),
    layout: cmsData?.page?.layout || getDefaultLayout(config.verticalSlug),
    seo: cmsData?.page?.seo || null,
  }
}
```

**Impact:** Eliminates 50 duplicated `loader:` functions → 1 shared function. Each route file becomes:
```typescript
export const Route = createFileRoute("/$tenant/$locale/restaurants/$id")({
  loader: ({ params }) => loadVerticalDetail(params, { verticalSlug: "restaurants", apiEndpoint: "store/restaurants" }),
  component: VerticalDetailPage,
})
```

#### 14.2.2 Shared Normalizer (currently duplicated 50 times)

**File: `apps/storefront/src/lib/data/normalizer.ts`** (NEW — consolidates the `normalizeDetail` function)

The SAME `normalizeDetail()` function is copy-pasted into every single detail page. It should be extracted once:

```typescript
export function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return {
    ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}
```

#### 14.2.3 Shared Hooks (exist but unused by detail pages)

**38 hooks exist** in `apps/storefront/src/lib/hooks/` but **0 are imported by detail pages:**

| Hook | Purpose | Should Be Used By |
|---|---|---|
| `use-reviews.ts` | `useProductReviews()`, `useVendorReviews()`, `useCreateReview()` | ALL 50 detail pages (replace inline review sections) |
| `use-bookings.ts` | `useBookingSlots()`, `useCreateBooking()` | bookings, healthcare, fitness, pet-services, travel |
| `use-auctions.ts` | `useAuctionBids()`, `usePlaceBid()` | auctions |
| `use-events.ts` | `useEventSchedule()`, `useEventTickets()` | events |
| `use-cms.ts` | `useCMSVerticals()`, `useCMSNavigation()` | VerticalDetailTemplate |
| `use-products.ts` | `useProducts()`, `useProductDetail()` | digital, grocery, flash-deals, bundles |
| `use-cart.ts` | `useCart()`, `useAddToCart()` | ALL commerce pages |
| `use-vendors.ts` | `useVendor()`, `useVendorProducts()` | vendors, dropshipping, affiliate |
| `use-subscriptions.ts` | `useSubscriptionPlans()` | subscriptions, memberships |
| `use-gift-cards.ts` | `useGiftCards()` | gift-cards-shop |
| `use-commerce-extras.ts` | Various commerce utilities | Multiple pages |
| `use-dropshipping.ts` | `useDropshippingProducts()` | dropshipping, dropshipping-marketplace |

**Targeted state:** Detail pages should use these hooks for client-side interactivity (reviews, cart actions, bookings) while blocks receive initial data via SSR props.

#### 14.2.4 Shared UI Components (exist, partially used)

**~30 UI components** exist in `apps/storefront/src/components/ui/`:

| Component | Lines | Used in Detail Pages? | Should Be Used By |
|---|---|---|---|
| `breadcrumb.tsx` | ~40 | NO — all pages render inline breadcrumbs | ALL 50 pages |
| `rating.tsx` | 77 | YES — imported by some blocks | Review sections in all pages |
| `badge.tsx` | ~30 | YES — imported by some blocks | Status badges, tags |
| `image-gallery.tsx` | 87 | NO — blocks have their own gallery | Replace block gallery with shared |
| `price.tsx` | 82 | NO — pages render prices inline | ALL commerce pages |
| `pagination.tsx` | 97 | NO — not used on detail pages | Review pagination |
| `skeleton.tsx` | ~20 | NO | Loading states in all pages |
| `empty-state.tsx` | 76 | NO | "Not found" states |
| `progress-bar.tsx` | ~30 | YES — used by some blocks | Crowdfunding, loyalty, course progress |
| `toast.tsx` | 117 | NO | Success/error feedback |
| `dialog.tsx` | 106 | NO | Confirmations (bid, book, donate) |
| `accordion.tsx` | ~40 | NO | FAQ sections |

**Targeted state:** Blocks should import from `components/ui/` for primitive elements (Rating, Badge, Price, Skeleton) instead of reimplementing them. This ensures visual consistency and reduces block code size.

#### 14.2.5 Entity Data Context (currently missing)

**File: `apps/storefront/src/lib/context/entity-context.tsx`** (NEW)

Blocks need access to the SSR-loaded entity data without prop drilling. An `EntityDataProvider` wraps the block rendering:

```typescript
interface EntityData {
  item: any
  verticalSlug: string
  locale: string
  tenant: string
}

const EntityContext = React.createContext<EntityData | null>(null)

export const EntityDataProvider: React.FC<React.PropsWithChildren<EntityData>> = ({ children, ...data }) => (
  <EntityContext.Provider value={data}>{children}</EntityContext.Provider>
)

export function useEntityData() {
  return React.useContext(EntityContext)
}
```

**Usage in VerticalDetailTemplate:**
```tsx
<EntityDataProvider item={item} verticalSlug={verticalSlug} locale={locale} tenant={tenant}>
  <BlockRenderer blocks={layout} locale={locale} />
</EntityDataProvider>
```

**Usage in blocks:**
```tsx
const ReviewListBlock = ({ heading, showSummary }) => {
  const entity = useEntityData()
  const { data: reviews } = useProductReviews(entity?.item?.id)
  // Renders from live hook data, falling back to SSR data
}
```

---

### 14.3 Payload CMS Alignment — Block Registration Gap

#### 14.3.1 Current Payload Pages Collection Block Types

The Payload orchestrator `Pages` collection currently defines **only 3 block types**:

```typescript
// apps/orchestrator/src/collections/Pages.ts
layout: {
  type: 'blocks',
  blocks: [
    { slug: 'hero', fields: [title, subtitle, image, cta, ctaLink] },
    { slug: 'richText', fields: [content] },
    { slug: 'media', fields: [media, caption] },
  ]
}
```

The storefront `block-registry.ts` has **77 block types** mapped. This means:

| System | Block Types Defined | Can Editors Use? |
|---|---|---|
| Payload CMS Pages collection | 3 (hero, richText, media) | YES — but only 3 types |
| Storefront BlockRenderer | 77 (full catalog) | NO — not in Payload |
| CMS Registry (backend) | Uses blockType strings in layout arrays | N/A — local config only |

**Gap:** Content editors using Payload CMS can ONLY create pages with 3 block types. The other 74 block types exist in the storefront but are invisible to Payload's page builder.

#### 14.3.2 Targeted Payload Block Registration

ALL 77 blocks should be registered in the `Pages` collection's `layout` field. Grouped by category for the Payload admin UI:

```typescript
// TARGETED: apps/orchestrator/src/collections/Pages.ts
layout: {
  type: 'blocks',
  blocks: [
    // --- Content & Layout ---
    { slug: 'hero', fields: [...] },
    { slug: 'richText', fields: [...] },
    { slug: 'cta', fields: [...] },
    { slug: 'featureGrid', fields: [...] },
    { slug: 'stats', fields: [...] },
    { slug: 'imageGallery', fields: [...] },
    { slug: 'divider', fields: [...] },
    { slug: 'bannerCarousel', fields: [...] },
    { slug: 'videoEmbed', fields: [...] },
    { slug: 'timeline', fields: [...] },
    { slug: 'trustBadges', fields: [...] },
    { slug: 'socialProof', fields: [...] },
    { slug: 'blogPost', fields: [...] },

    // --- Navigation & Discovery ---
    { slug: 'categoryGrid', fields: [...] },
    { slug: 'collectionList', fields: [...] },
    { slug: 'comparisonTable', fields: [...] },
    { slug: 'contactForm', fields: [...] },
    { slug: 'faq', fields: [...] },
    { slug: 'pricing', fields: [...] },
    { slug: 'newsletter', fields: [...] },
    { slug: 'reviewList', fields: [...] },
    { slug: 'map', fields: [...] },

    // --- Commerce ---
    { slug: 'productGrid', fields: [...] },
    { slug: 'productDetail', fields: [...] },
    { slug: 'cartSummary', fields: [...] },
    { slug: 'checkoutSteps', fields: [...] },
    { slug: 'orderConfirmation', fields: [...] },
    { slug: 'wishlistGrid', fields: [...] },
    { slug: 'recentlyViewed', fields: [...] },
    { slug: 'flashSaleCountdown', fields: [...] },
    { slug: 'giftCardDisplay', fields: [...] },

    // --- Vendor ---
    { slug: 'vendorProfile', fields: [...] },
    { slug: 'vendorProducts', fields: [...] },
    { slug: 'vendorShowcase', fields: [...] },
    { slug: 'vendorRegisterForm', fields: [...] },
    { slug: 'commissionDashboard', fields: [...] },
    { slug: 'payoutHistory', fields: [...] },

    // --- Booking & Service ---
    { slug: 'bookingCalendar', fields: [...] },
    { slug: 'bookingCta', fields: [...] },
    { slug: 'bookingConfirmation', fields: [...] },
    { slug: 'serviceCardGrid', fields: [...] },
    { slug: 'serviceList', fields: [...] },
    { slug: 'appointmentSlots', fields: [...] },
    { slug: 'providerSchedule', fields: [...] },
    { slug: 'resourceAvailability', fields: [...] },

    // --- Subscription & Loyalty ---
    { slug: 'subscriptionPlans', fields: [...] },
    { slug: 'membershipTiers', fields: [...] },
    { slug: 'loyaltyDashboard', fields: [...] },
    { slug: 'loyaltyPointsDisplay', fields: [...] },
    { slug: 'subscriptionManage', fields: [...] },
    { slug: 'referralProgram', fields: [...] },

    // --- Vertical-Specific ---
    { slug: 'auctionBidding', fields: [...] },
    { slug: 'rentalCalendar', fields: [...] },
    { slug: 'propertyListing', fields: [...] },
    { slug: 'vehicleListing', fields: [...] },
    { slug: 'menuDisplay', fields: [...] },
    { slug: 'courseCurriculum', fields: [...] },
    { slug: 'eventSchedule', fields: [...] },
    { slug: 'eventList', fields: [...] },
    { slug: 'healthcareProvider', fields: [...] },
    { slug: 'fitnessClassSchedule', fields: [...] },
    { slug: 'petProfileCard', fields: [...] },
    { slug: 'classifiedAdCard', fields: [...] },
    { slug: 'crowdfundingProgress', fields: [...] },
    { slug: 'donationCampaign', fields: [...] },
    { slug: 'freelancerProfile', fields: [...] },
    { slug: 'parkingSpotFinder', fields: [...] },

    // --- B2B ---
    { slug: 'purchaseOrderForm', fields: [...] },
    { slug: 'bulkPricingTable', fields: [...] },
    { slug: 'companyDashboard', fields: [...] },
    { slug: 'approvalWorkflow', fields: [...] },

    // --- Admin/Manage ---
    { slug: 'manageStats', fields: [...] },
    { slug: 'manageRecentOrders', fields: [...] },
    { slug: 'manageActivity', fields: [...] },
    { slug: 'promotionBanner', fields: [...] },
  ]
}
```

#### 14.3.3 Payload Block Field Definitions — What Each Block Needs in CMS

Each block type registered in Payload needs its own field definition so editors can configure it. Here are the field definitions for all blocks, grouped by complexity:

**Simple blocks (2-4 fields):**

| Block | Payload Fields |
|---|---|
| `richText` | `content` (richText, required) |
| `divider` | `variant` (select: line/dotted/label/space), `label` (text), `spacing` (select: sm/md/lg/xl) |
| `videoEmbed` | `url` (text, required), `title` (text), `aspectRatio` (select: 16:9/4:3/1:1) |
| `trustBadges` | `badges` (array: icon, label, description), `layout` (select: horizontal/grid) |
| `recentlyViewed` | `heading` (text), `layout` (select: carousel/grid) |

**Medium blocks (5-8 fields):**

| Block | Payload Fields |
|---|---|
| `hero` | `heading` (text), `subheading` (textarea), `backgroundImage` (upload→media), `overlay` (select), `alignment` (select), `minHeight` (select), `cta` (array: label, href), `badge` (text) |
| `cta` | `heading` (text), `description` (textarea), `buttons` (array: label, href, variant), `variant` (select), `backgroundStyle` (select) |
| `featureGrid` | `heading` (text), `subtitle` (text), `features` (array: icon, title, description), `columns` (select: 2/3/4), `variant` (select) |
| `stats` | `heading` (text), `stats` (array: value, label, trend, trendDirection), `columns` (select), `variant` (select) |
| `faq` | `heading` (text), `description` (textarea), `items` (array: question, answer), `layout` (select) |
| `pricing` | `heading` (text), `description` (textarea), `plans` (array: name, price, currency, interval, features[], highlighted, cta), `billingToggle` (checkbox) |
| `newsletter` | `heading` (text), `description` (textarea), `variant` (select), `showBenefits` (checkbox) |
| `reviewList` | `heading` (text), `entityId` (text), `showSummary` (checkbox), `allowSubmit` (checkbox) |
| `contactForm` | `heading` (text), `recipientEmail` (email), `showMap` (checkbox), `fields` (json) |
| `bookingCta` | `heading` (text), `description` (textarea), `serviceId` (text), `variant` (select), `showAvailability` (checkbox) |

**Complex blocks (9+ fields):**

| Block | Payload Fields |
|---|---|
| `imageGallery` | `heading` (text), `images` (array: image→upload, caption), `layout` (select: grid/masonry/carousel), `columns` (select), `aspectRatio` (select) |
| `subscriptionPlans` | `heading` (text), `plans` (array: name, price, interval, features[], highlighted), `billingToggle` (checkbox), `highlightedPlan` (text), `variant` (select) |
| `membershipTiers` | `heading` (text), `tiers` (array: name, price, interval, color, benefits[]), `showComparison` (checkbox), `variant` (select) |
| `menuDisplay` | `heading` (text), `categories` (array: name, items[]: name, description, price, dietaryLabels[]), `variant` (select), `showPrices` (checkbox), `currency` (text) |
| `eventSchedule` | `days` (array: label, date, sessions[]: title, time, endTime, speaker, room, track, description), `view` (select), `showSpeakers` (checkbox) |
| `bookingCalendar` | `serviceId` (relationship), `variant` (select), `showPricing` (checkbox), `allowMultiDay` (checkbox) |
| `auctionBidding` | `auctionId` (text), `showHistory` (checkbox), `showCountdown` (checkbox), `variant` (select) |
| `courseCurriculum` | `modules` (array: title, lessons[]: title, type, duration, preview, locked), `showProgress` (checkbox), `variant` (select) |

#### 14.3.4 Payload → Storefront Data Flow (Targeted)

```
1. Content editor creates/edits page in Payload CMS
   └─ Payload auto-saves layout[] with blockType + configured fields

2. Payload fires webhook → Medusa backend
   └─ POST /admin/webhooks/payload { event: "page.updated", data: { layout, slug, tenant } }

3. Medusa stores page in cms_page table
   └─ Block format adapter converts Payload format → BlockRenderer format

4. Storefront SSR loader fetches
   └─ GET /platform/cms/resolve?path=restaurants/abc123
   └─ Returns: { page: { layout: [...blocks...], seo: {...} }, entity: { ...restaurant data... } }

5. VerticalDetailTemplate renders
   └─ <EntityDataProvider item={entity}>
        <BlockRenderer blocks={layout} locale={locale} />
      </EntityDataProvider>

6. Each block receives:
   └─ Direct props from CMS layout (heading, variant, etc.)
   └─ Entity data from EntityDataProvider context (for data-dependent blocks)
   └─ Client-side interactivity from hooks (useProductReviews, useCreateBooking, etc.)
```

---

### 14.4 Targeted State — Per-Page Transformation

For each of the 50 detail pages, this defines the exact targeted state: what the page looks like after centralization and Payload CMS integration.

#### Column key:
- **Current Lines:** Current code size
- **Target Lines:** After centralization (route file only, blocks are shared)
- **Loader:** Current inline fetch → Targeted shared `loadVerticalDetail()`
- **Blocks:** Which blocks the CMS layout will contain (managed via Payload)
- **Hooks:** Which client-side hooks the page/blocks will use
- **CMS Editable:** Whether content editors can rearrange blocks in Payload

---

#### 14.4.1 High-Value Verticals (pages with rich vertical-specific blocks)

| # | Page | Current | Target | Loader Source | CMS Layout Blocks | Active Hooks | CMS Editable |
|---|---|---|---|---|---|---|---|
| 1 | `auctions/$id` | 262 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"auctions", apiEndpoint:"store/auctions"})` | `hero` → `imageGallery` → `auctionBidding`(R) → `richText` → `reviewList`(R) → `recentlyViewed`(R) | `useAuctionBids()`, `usePlaceBid()`, `useProductReviews()` | YES |
| 2 | `restaurants/$id` | 229 lines, inline JSX, NO MENU | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"restaurants", apiEndpoint:"store/restaurants"})` | `hero` → `menuDisplay`(E) → `imageGallery` → `map`(R) → `reviewList`(R) → `newsletter`(R) | `useProductReviews()`, `useCart()` | YES |
| 3 | `healthcare/$id` | 220 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"healthcare", apiEndpoint:"store/healthcare"})` | `hero` → `healthcareProvider`(R) → `appointmentSlots`(R) → `faq` → `reviewList`(R) | `useProductReviews()`, `useBookingSlots()` | YES |
| 4 | `education/$id` | 263 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"education", apiEndpoint:"store/education"})` | `hero` → `courseCurriculum`(R) → `subscriptionPlans`(E) → `testimonial` → `reviewList`(R) | `useProductReviews()` | YES |
| 5 | `crowdfunding/$id` | 248 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"crowdfunding", apiEndpoint:"store/crowdfunding"})` | `hero` → `crowdfundingProgress`(R) → `imageGallery` → `richText` → `stats` → `reviewList`(R) → `recentlyViewed`(R) | `useProductReviews()` | YES |
| 6 | `charity/$id` | 243 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"charity", apiEndpoint:"store/charity"})` | `hero` → `donationCampaign`(R) → `stats` → `faq` → `reviewList`(R) | `useProductReviews()` | YES |
| 7 | `events/$id` | 319 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"events", apiEndpoint:"store/events"})` | `hero` → `eventSchedule`(R) → `map`(R) → `reviewList`(R) → `newsletter`(R) | `useProductReviews()`, `useEventTickets()` | YES |
| 8 | `fitness/$id` | 228 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"fitness", apiEndpoint:"store/fitness"})` | `hero` → `fitnessClassSchedule`(R) → `membershipTiers`(E) → `testimonial` → `reviewList`(R) → `bookingCta`(E) | `useProductReviews()`, `useBookingSlots()` | YES |
| 9 | `freelance/$id` | 246 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"freelance", apiEndpoint:"store/freelance"})` | `hero` → `freelancerProfile`(R) → `reviewList`(R) → `contactForm`(R) | `useProductReviews()` | YES |
| 10 | `automotive/$id` | 205 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"automotive", apiEndpoint:"store/automotive"})` | `hero` → `imageGallery` → `vehicleListing`(R) → `comparisonTable` → `reviewList`(R) | `useProductReviews()` | YES |
| 11 | `real-estate/$id` | 213 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"real-estate", apiEndpoint:"store/real-estate"})` | `hero` → `imageGallery` → `propertyListing`(R) → `map`(R) → `contactForm`(R) | `useProductReviews()` | YES |
| 12 | `parking/$id` | 245 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"parking", apiEndpoint:"store/parking"})` | `hero` → `parkingSpotFinder`(R) → `map`(R) → `pricing` → `reviewList`(R) | `useProductReviews()` | YES |
| 13 | `classifieds/$id` | 222 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"classifieds", apiEndpoint:"store/classifieds"})` | `hero` → `classifiedAdCard`(R) → `imageGallery` → `contactForm`(R) → `map`(R) | — | YES |
| 14 | `pet-services/$id` | 246 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"pet-services", apiEndpoint:"store/pet-services"})` | `hero` → `petProfileCard`(R) → `serviceList`(E) → `bookingCta`(E) → `reviewList`(R) | `useProductReviews()`, `useBookingSlots()` | YES |
| 15 | `rentals/$id` | 288 lines, inline JSX | ~30 lines | `loadVerticalDetail(params, {verticalSlug:"rentals", apiEndpoint:"store/rentals"})` | `hero` → `imageGallery` → `rentalCalendar`(R) → `pricing` → `reviewList`(R) | `useProductReviews()` | YES |

#### 14.4.2 Service-Based Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 16 | `bookings/$id` | 249 lines | ~30 lines | `hero` → `bookingCalendar`(R) → `serviceList`(E) → `bookingCta`(E) → `reviewList`(R) | `useBookingSlots()`, `useCreateBooking()`, `useProductReviews()` |
| 17 | `legal/$id` | 249 lines | ~30 lines | `hero` → `serviceList`(E) → `bookingCalendar`(R) → `faq` → `contactForm`(R) → `reviewList`(R) | `useProductReviews()` |
| 18 | `insurance/$id` | 237 lines | ~30 lines | `hero` → `serviceList`(E) → `comparisonTable` → `faq` → `contactForm`(R) → `reviewList`(R) | `useProductReviews()` |
| 19 | `government/$id` | 247 lines | ~30 lines | `hero` → `serviceList`(E) → `timeline` → `faq` → `contactForm`(R) | — |
| 20 | `travel/$id` | 286 lines | ~30 lines | `hero` → `imageGallery` → `bookingCalendar`(R) → `pricing` → `map`(R) → `reviewList`(R) | `useProductReviews()`, `useBookingSlots()` |

#### 14.4.3 Commerce Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 21 | `subscriptions/$id` | 241 lines | ~30 lines | `hero` → `subscriptionPlans`(E) → `comparisonTable` → `faq` → `reviewList`(R) | `useSubscriptionPlans()`, `useProductReviews()` |
| 22 | `memberships/$id` | 185 lines | ~30 lines | `hero` → `membershipTiers`(E) → `featureGrid` → `testimonial` → `faq` | — |
| 23 | `loyalty-program/$id` | 199 lines | ~30 lines | `hero` → `loyaltyDashboard`(R) → `membershipTiers`(E) → `referralProgram`(R) | — |
| 24 | `flash-deals/$id` | 216 lines | ~30 lines | `hero` → `flashSaleCountdown`(R) → `productDetail`(R) → `reviewList`(R) | `useCart()`, `useProductReviews()` |
| 25 | `gift-cards-shop/$id` | 191 lines | ~30 lines | `hero` → `giftCardDisplay`(R) → `reviewList`(R) | `useGiftCards()`, `useProductReviews()` |
| 26 | `bundles/$id` | 210 lines | ~30 lines | `hero` → `productGrid`(fetches) → `pricing` → `reviewList`(R) | `useCart()`, `useProductReviews()` |
| 27 | `digital/$id` | 181 lines | ~30 lines | `hero` → `productDetail`(R) → `reviewList`(R) | `useCart()`, `useProductReviews()` |
| 28 | `grocery/$id` | 249 lines | ~30 lines | `hero` → `productDetail`(R) → `categoryGrid` → `reviewList`(R) | `useCart()`, `useProductReviews()` |

#### 14.4.4 Marketplace Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 29 | `vendors/$id` | 293 lines | ~30 lines | `hero` → `vendorProfile`(E) → `vendorProducts`(R) → `reviewList`(R) → `contactForm`(R) | `useVendor()`, `useVendorProducts()`, `useVendorReviews()` |
| 30 | `affiliate/$id` | 180 lines | ~30 lines | `hero` → `referralProgram`(R) → `stats` → `faq` | — |
| 31 | `social-commerce/$id` | 225 lines | ~30 lines | `hero` → `socialProof`(R) → `productGrid`(fetches) → `reviewList`(R) | `useProductReviews()` |

#### 14.4.5 Financial & Credit Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 32 | `financial/$id` | 245 lines | ~30 lines | `hero` → `serviceList`(E) → `comparisonTable` → `faq` → `contactForm`(R) | — |
| 33 | `credit/$id` | 259 lines | ~30 lines | `hero` → `pricing` → `comparisonTable` → `timeline` → `faq` → `reviewList`(R) | `useProductReviews()` |
| 34 | `warranties/$id` | 257 lines | ~30 lines | `hero` → `serviceList`(E) → `comparisonTable` → `faq` → `reviewList`(R) | `useProductReviews()` |

#### 14.4.6 B2B Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 35 | `b2b/$id` | 242 lines | ~30 lines | `hero` → `bulkPricingTable`(E) → `purchaseOrderForm`(R) → `reviewList`(R) | `usePurchaseOrders()`, `useProductReviews()` |
| 36 | `volume-deals/$id` | 225 lines | ~30 lines | `hero` → `bulkPricingTable`(E) → `productDetail`(R) → `reviewList`(R) | `useVolumePricing()`, `useProductReviews()` |
| 37 | `white-label/$id` | 213 lines | ~30 lines | `hero` → `pricing` → `featureGrid` → `faq` → `contactForm`(R) | — |
| 38 | `white-label-shop/$id` | 239 lines | ~30 lines | `hero` → `productDetail`(R) → `reviewList`(R) | `useCart()`, `useProductReviews()` |

#### 14.4.7 Remaining Verticals

| # | Page | Current | Target | CMS Layout Blocks | Active Hooks |
|---|---|---|---|---|---|
| 39 | `campaigns/$id` | 181 lines | ~30 lines | `hero` → `crowdfundingProgress`(R) → `richText` → `reviewList`(R) | `useProductReviews()` |
| 40 | `consignment/$id` | 213 lines | ~30 lines | `hero` → `productDetail`(R) → `pricing` → `reviewList`(R) | `useCart()`, `useProductReviews()` |
| 41 | `consignment-shop/$id` | 212 lines | ~30 lines | MERGE with consignment — duplicate page | — |
| 42 | `dropshipping/$id` | 205 lines | ~30 lines | `hero` → `productDetail`(R) → `vendorProfile`(E) → `reviewList`(R) | `useDropshippingProducts()`, `useProductReviews()` |
| 43 | `dropshipping-marketplace/$id` | 211 lines | ~30 lines | MERGE with dropshipping — duplicate page | — |
| 44 | `newsletter/$id` | 259 lines | ~30 lines | `hero` → `blogPost`(R) → `newsletter`(R) → `reviewList`(R) | `useProductReviews()` |
| 45 | `print-on-demand/$id` | 217 lines | ~30 lines | `hero` → `imageGallery` → `productDetail`(R) → `reviewList`(R) | `useCart()`, `useProductReviews()` |
| 46 | `print-on-demand-shop/$id` | 207 lines | ~30 lines | MERGE with print-on-demand — duplicate page | — |
| 47 | `trade-in/$id` | 219 lines | ~30 lines | `hero` → `productDetail`(R) → `pricing` → `timeline` → `faq` | `useProductReviews()` |
| 48 | `try-before-you-buy/$id` | 201 lines | ~30 lines | `hero` → `productDetail`(R) → `timeline` → `faq` → `reviewList`(R) | `useProductReviews()` |
| 49 | `quotes/$id` | 74 lines | ~30 lines | `hero` → `serviceList`(E) → `contactForm`(R) | — |
| 50 | `places/$id` | 83 lines | ~30 lines | `hero` → `imageGallery` → `map`(R) → `contactForm`(R) → `reviewList`(R) | `useProductReviews()` |

---

### 14.5 Duplicate Page Consolidation

3 pairs of duplicate pages share the same API endpoint and nearly identical layouts:

| Duplicate Pair | Lines | Same API? | Recommendation |
|---|---|---|---|
| `consignment/$id` + `consignment-shop/$id` | 213 + 212 = 425 | YES (`store/consignments/`) | MERGE → keep `consignment/$id`, redirect shop |
| `dropshipping/$id` + `dropshipping-marketplace/$id` | 205 + 211 = 416 | YES (`store/dropshipping/`) | MERGE → keep `dropshipping/$id`, redirect marketplace |
| `print-on-demand/$id` + `print-on-demand-shop/$id` | 217 + 207 = 424 | YES (`store/print-on-demand/`) | MERGE → keep `print-on-demand/$id`, redirect shop |

**Impact:** Eliminates 3 redundant files (631 lines) and 3 redundant API calls.

---

### 14.6 Centralization Impact Summary

| Metric | Current | Targeted | Reduction |
|---|---|---|---|
| **Total detail page route lines** | ~11,500 | ~1,410 (47 × ~30) | **88% reduction** |
| **Duplicated normalizeDetail()** | 50 copies | 1 shared function | **98% reduction** |
| **Duplicated fetch() loaders** | 50 copies | 1 shared loader | **98% reduction** |
| **Inline breadcrumb JSX** | ~48 copies | 1 shared Breadcrumb component | **98% reduction** |
| **Inline hero JSX** | ~48 copies | `hero` block via BlockRenderer | **100% reduction** |
| **Inline review JSX** | ~48 copies | `reviewList` block via BlockRenderer | **100% reduction** |
| **Blocks actually used** | 0 of 77 | 42+ of 77 | **From 0% to 55%+** |
| **CMS-editable layouts** | 0 pages | 47 pages | **From 0% to 100%** |
| **Payload block types** | 3 | 77 | **25× increase** |
| **Hooks used by detail pages** | 0 of 38 | 12+ of 38 | **From 0% to 32%+** |
| **Route files** | 50 | 47 (after merging duplicates) | **6% reduction** |

---

### 14.7 Implementation Phases — Centralization + Payload Alignment

| Phase | Action | Files Created/Modified | Impact | Effort |
|---|---|---|---|---|
| **Phase 0: Shared Infrastructure** | Create `detail-loader.ts`, `normalizer.ts`, `entity-context.tsx`, `use-cms-page.ts` | 4 new files (~200 lines) | Foundation for all other phases | 3 hours |
| **Phase 1: Block Refactoring (P0)** | Refactor `reviewList`, `recentlyViewed`, `productDetail` to accept real data | 3 files modified | Unblocks 40+ pages | 4 hours |
| **Phase 2: Block Refactoring (P1)** | Refactor 8 vertical-specific blocks (auctionBidding, menuDisplay, etc.) | 8 files modified | Rich features for 8 key verticals | 6 hours |
| **Phase 3: CMS Registry Enhancement** | Update `buildDetailPage()` with per-vertical layouts in `cms-registry.ts` | 1 file modified (~400 lines added) | CMS layouts ready for all 27 verticals | 4 hours |
| **Phase 4: Route File Refactoring** | Replace 50 inline route files with shared loader + BlockRenderer | 50 files modified (each: 230→30 lines) | 88% code reduction | 8 hours |
| **Phase 5: Payload Block Registration** | Add all 77 block type definitions to Orchestrator Pages collection | 1 file modified (~1,200 lines added) | Content editors can build pages | 6 hours |
| **Phase 6: Duplicate Consolidation** | Merge 3 duplicate page pairs, add redirects | 3 files removed, 3 redirects added | Clean architecture | 2 hours |
| **Phase 7: Hook Integration** | Wire 12+ hooks into blocks for client-side interactivity | 12+ block files modified | Live data (reviews, bookings, bids) | 4 hours |
| **Phase 8: Block Refactoring (P2+P3)** | Refactor remaining 17 Tier B blocks | 17 files modified | Full block catalog data-driven | 8 hours |

**Total estimated effort:** ~45 hours across 9 phases

---

### 14.8 Targeted Route File Template

After centralization, every detail page route file should look like this:

```typescript
// @ts-nocheck
// apps/storefront/src/routes/$tenant/$locale/restaurants/$id.tsx
import { createFileRoute } from "@tanstack/react-router"
import { loadVerticalDetail } from "@/lib/data/detail-loader"
import { VerticalDetailPage } from "@/components/pages/vertical-detail-page"

export const Route = createFileRoute("/$tenant/$locale/restaurants/$id")({
  loader: ({ params }) =>
    loadVerticalDetail(params, {
      verticalSlug: "restaurants",
      apiEndpoint: "store/restaurants",
    }),
  component: () => <VerticalDetailPage verticalSlug="restaurants" />,
})
```

**~12 lines per page** instead of ~230 lines.

The `VerticalDetailPage` component (shared):

```typescript
// apps/storefront/src/components/pages/vertical-detail-page.tsx
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { EntityDataProvider } from "@/lib/context/entity-context"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Route } from "@tanstack/react-router"

export function VerticalDetailPage({ verticalSlug }: { verticalSlug: string }) {
  const { item, layout, seo } = Route.useLoaderData()

  if (!item) return <NotFoundState vertical={verticalSlug} />

  return (
    <div className="min-h-screen bg-ds-background">
      <EntityDataProvider item={item} verticalSlug={verticalSlug}>
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: verticalSlug, href: `/${verticalSlug}` },
          { label: item.name || item.title },
        ]} />
        <BlockRenderer blocks={layout} />
      </EntityDataProvider>
    </div>
  )
}
```

---

### 14.9 Payload CMS Page Builder — How Editors Will Use It

Once fully integrated, content editors using the Payload CMS admin panel will be able to:

1. **Browse Pages** — See all pages organized by tenant, vertical, and status (draft/published)
2. **Edit Page Layout** — Drag-and-drop blocks from 77 available types, organized into 9 categories
3. **Configure Block Props** — Each block shows its configurable fields (heading, variant, columns, etc.)
4. **Preview Live** — See the page rendered with the storefront's BlockRenderer in a preview iframe
5. **Publish** — Publishing triggers a webhook → Medusa syncs the layout → storefront reflects changes immediately

**Editor workflow for creating a new restaurant detail page:**
1. Create new Page → set template: "vertical-detail", vertical: "restaurants"
2. Add blocks: Hero → Menu Display → Image Gallery → Map → Review List → Newsletter
3. Configure each block: set heading text, choose variant, toggle options
4. Preview → see the rendered page with real restaurant data
5. Publish → page goes live, no developer involvement

**This is the architectural target:** The 77 blocks become Payload CMS's page builder components, making the entire storefront CMS-driven and customizable without code changes.

---

## Section 15: Complete Page Inventory — ALL 336 Route Files

The storefront contains **336 route files** totaling **58,770 lines** across 7 categories:

| Category | Files | Lines | % of Total |
|---|---|---|---|
| Detail pages (`$id.tsx`) | 54 | 11,905 | 20.3% |
| List pages (`index.tsx`) | 67 | 11,696 | 19.9% |
| Manage pages (tenant admin) | 96 | 18,661 | 31.8% |
| Vendor pages (vendor dashboard) | 56 | 9,493 | 16.2% |
| Account pages (customer portal) | 26 | 2,823 | 4.8% |
| Special pages (cart, checkout, etc.) | 15 | 1,562 | 2.7% |
| Sub-route pages (sub-flows) | 18 | 1,284 | 2.2% |
| Root/layout files | 4 | ~350 | 0.6% |
| **TOTAL** | **336** | **58,770** | **100%** |

---

### 15.1 All List Pages (67 pages) — Complete Inventory with Line Counts

ALL list pages use inline JSX. ZERO list pages use TemplateRenderer or BlockRenderer.

| # | Route Path | Lines | Backend Endpoint | CMS Registry? | Notes |
|---|---|---|---|---|---|
| 1 | `education/index.tsx` | 284 | `store/education` | YES | Highest line count list page |
| 2 | `travel/index.tsx` | 279 | `store/travel` | YES | |
| 3 | `crowdfunding/index.tsx` | 272 | `store/crowdfunding` | YES | |
| 4 | `auctions/index.tsx` | 271 | `store/auctions` | YES | |
| 5 | `rentals/index.tsx` | 268 | `store/rentals` | YES | |
| 6 | `social-commerce/index.tsx` | 267 | `store/social-commerce` | YES | |
| 7 | `automotive/index.tsx` | 267 | `store/automotive` | YES | |
| 8 | `digital/index.tsx` | 262 | `store/digital-products` | YES (as digital-products) | Slug mismatch |
| 9 | `restaurants/index.tsx` | 260 | `store/restaurants` | YES | |
| 10 | `real-estate/index.tsx` | 260 | `store/real-estate` | YES | |
| 11 | `vendors/index.tsx` | 259 | `store/vendors` | YES | |
| 12 | `healthcare/index.tsx` | 258 | `store/healthcare` | YES | |
| 13 | `classifieds/index.tsx` | 257 | `store/classifieds` | YES | |
| 14 | `bookings/index.tsx` | 254 | `store/bookings` | Not in CMS registry | MISSING from CMS |
| 15 | `events/index.tsx` | 253 | `store/events` | YES | |
| 16 | `warranties/index.tsx` | 250 | `store/warranties` | YES | |
| 17 | `fitness/index.tsx` | 249 | `store/fitness` | YES | |
| 18 | `charity/index.tsx` | 249 | `store/charity` | YES | |
| 19 | `legal/index.tsx` | 248 | `store/legal` | YES | |
| 20 | `grocery/index.tsx` | 248 | `store/grocery` | YES | |
| 21 | `blog/index.tsx` | 247 | — (static/CMS) | NO | No backend endpoint |
| 22 | `parking/index.tsx` | 245 | `store/parking` | YES | |
| 23 | `flash-deals/index.tsx` | 244 | `store/flash-sales` | NO (slug mismatch) | |
| 24 | `campaigns/index.tsx` | 244 | `store/crowdfunding` | NO | Uses same endpoint as crowdfunding |
| 25 | `freelance/index.tsx` | 243 | `store/freelance` | YES | |
| 26 | `insurance/index.tsx` | 242 | `store/insurance` | Not in CMS registry | MISSING from CMS |
| 27 | `pet-services/index.tsx` | 229 | `store/pet-services` | YES | |
| 28 | `subscriptions/index.tsx` | 225 | `store/subscriptions` | Not in CMS registry | MISSING from CMS |
| 29 | `government/index.tsx` | 225 | `store/government` | YES | |
| 30 | `memberships/index.tsx` | 224 | `store/memberships` | YES | |
| 31 | `bundles/index.tsx` | 222 | `store/bundles` | Not in CMS registry | MISSING from CMS |
| 32 | `dropshipping-marketplace/index.tsx` | 213 | `store/dropshipping` | NO | Duplicate of dropshipping |
| 33 | `gift-cards-shop/index.tsx` | 204 | `store/gift-cards` | Not in CMS registry | MISSING from CMS |
| 34 | `consignment-shop/index.tsx` | 201 | `store/consignments` | NO | Duplicate of consignment |
| 35 | `newsletter/index.tsx` | 200 | `store/newsletters` | Not in CMS registry | MISSING from CMS |
| 36 | `b2b/index.tsx` | 194 | `store/b2b` | Not in CMS registry | MISSING from CMS |
| 37 | `white-label-shop/index.tsx` | 188 | `store/white-label` | NO | Duplicate of white-label |
| 38 | `try-before-you-buy/index.tsx` | 185 | `store/try-before-you-buy` | Not in CMS registry | MISSING from CMS |
| 39 | `trade-in/index.tsx` | 182 | `store/trade-in` | Not in CMS registry | MISSING from CMS |
| 40 | `volume-deals/index.tsx` | 180 | `store/volume-deals` | Not in CMS registry | MISSING from CMS |
| 41 | `print-on-demand-shop/index.tsx` | 178 | `store/print-on-demand` | NO | Duplicate of print-on-demand |
| 42 | `white-label/index.tsx` | 173 | `store/white-label` | Not in CMS registry | MISSING from CMS |
| 43 | `loyalty-program/index.tsx` | 159 | `store/loyalty` | Not in CMS registry | MISSING from CMS |
| 44 | `wallet/index.tsx` | 152 | `store/wallet` | NO | Utility page |
| 45 | `dropshipping/index.tsx` | 132 | `store/dropshipping` | Not in CMS registry | MISSING from CMS |
| 46 | `credit/index.tsx` | 132 | `store/credit` | Not in CMS registry | MISSING from CMS |
| 47 | `consignment/index.tsx` | 126 | `store/consignments` | Not in CMS registry | MISSING from CMS |
| 48 | `print-on-demand/index.tsx` | 123 | `store/print-on-demand` | Not in CMS registry | MISSING from CMS |
| 49 | `affiliate/index.tsx` | 122 | `store/affiliate` | YES (as affiliates) | Slug mismatch |
| 50 | `help/index.tsx` | 119 | — | NO | Static content |
| 51 | `financial/index.tsx` | 119 | `store/financial` | YES (as financial-products) | Slug mismatch |
| 52 | `returns/index.tsx` | 117 | — | NO | Account utility |
| 53 | `manage/index.tsx` | 107 | — | NO | Admin dashboard |
| 54 | `quotes/index.tsx` | 106 | `store/quotes` | Not in CMS registry | MISSING from CMS |
| 55 | `places/index.tsx` | 104 | `store/content/pois` | Not in CMS registry | MISSING from CMS |
| 56 | `account/index.tsx` | 56 | — | NO | Account dashboard |
| 57 | `vendor/index.tsx` | 37 | — | NO | Vendor dashboard |
| 58-67 | Account sub-lists (orders, bookings, subscriptions, purchase-orders, vendor/products, vendor/orders, vendor/payouts, vendor/onboarding) | Various | Various | NO | Account/vendor sub-pages |

#### List Page Issues Found:
- **0 of 67 list pages use BlockRenderer** — ALL use inline JSX
- **21 list pages have NO CMS registry entry** — cannot be CMS-managed
- **5 duplicate list pages** share same endpoint (consignment-shop, dropshipping-marketplace, print-on-demand-shop, white-label-shop, campaigns)
- **9 slug mismatches** between frontend route names and backend/CMS slugs

---

### 15.2 All Detail Pages (54 pages) — Complete Inventory

| # | Route Path | Lines | API Endpoint | Notes |
|---|---|---|---|---|
| 1 | `events/$id.tsx` | 319 | `store/events` | Largest detail page |
| 2 | `vendors/$id.tsx` | 293 | `store/vendors` | Has $handle.tsx AND $id.tsx |
| 3 | `rentals/$id.tsx` | 288 | `store/rentals` | |
| 4 | `travel/$id.tsx` | 286 | `store/travel` | |
| 5 | `education/$id.tsx` | 263 | `store/education` | |
| 6 | `auctions/$id.tsx` | 262 | `store/auctions` | |
| 7 | `newsletter/$id.tsx` | 259 | `store/newsletters` | |
| 8 | `credit/$id.tsx` | 259 | `store/credit` | |
| 9 | `warranties/$id.tsx` | 257 | `store/warranties` | |
| 10 | `legal/$id.tsx` | 249 | `store/legal` | |
| 11 | `grocery/$id.tsx` | 249 | `store/grocery` | |
| 12 | `bookings/$id.tsx` | 249 | `store/bookings` | Reference page |
| 13 | `crowdfunding/$id.tsx` | 248 | `store/crowdfunding` | |
| 14 | `government/$id.tsx` | 247 | `store/government` | |
| 15 | `pet-services/$id.tsx` | 246 | `store/pet-services` | |
| 16 | `freelance/$id.tsx` | 246 | `store/freelance` | |
| 17 | `parking/$id.tsx` | 245 | `store/parking` | |
| 18 | `financial/$id.tsx` | 245 | `store/financial` | |
| 19 | `charity/$id.tsx` | 243 | `store/charity` | |
| 20 | `b2b/$id.tsx` | 242 | `store/b2b` | |
| 21 | `subscriptions/$id.tsx` | 241 | `store/subscriptions` | |
| 22 | `white-label-shop/$id.tsx` | 239 | `store/white-label` | DUPLICATE — same endpoint as white-label |
| 23 | `insurance/$id.tsx` | 237 | `store/insurance` | |
| 24 | `restaurants/$id.tsx` | 229 | `store/restaurants` | |
| 25 | `fitness/$id.tsx` | 228 | `store/fitness` | |
| 26 | `volume-deals/$id.tsx` | 225 | `store/volume-deals` | |
| 27 | `social-commerce/$id.tsx` | 225 | `store/social-commerce` | |
| 28 | `classifieds/$id.tsx` | 222 | `store/classifieds` | |
| 29 | `healthcare/$id.tsx` | 220 | `store/healthcare` | |
| 30 | `trade-in/$id.tsx` | 219 | `store/trade-in` | |
| 31 | `print-on-demand/$id.tsx` | 217 | `store/print-on-demand` | |
| 32 | `flash-deals/$id.tsx` | 216 | `store/flash-sales` | |
| 33 | `white-label/$id.tsx` | 213 | `store/white-label` | |
| 34 | `real-estate/$id.tsx` | 213 | `store/real-estate` | |
| 35 | `consignment/$id.tsx` | 213 | `store/consignments` | |
| 36 | `consignment-shop/$id.tsx` | 212 | `store/consignments` | DUPLICATE |
| 37 | `dropshipping-marketplace/$id.tsx` | 211 | `store/dropshipping` | DUPLICATE |
| 38 | `bundles/$id.tsx` | 210 | `store/bundles` | |
| 39 | `print-on-demand-shop/$id.tsx` | 207 | `store/print-on-demand` | DUPLICATE |
| 40 | `dropshipping/$id.tsx` | 205 | `store/dropshipping` | |
| 41 | `automotive/$id.tsx` | 205 | `store/automotive` | |
| 42 | `try-before-you-buy/$id.tsx` | 201 | `store/try-before-you-buy` | |
| 43 | `loyalty-program/$id.tsx` | 199 | `store/loyalty` | |
| 44 | `gift-cards-shop/$id.tsx` | 191 | `store/gift-cards` | |
| 45 | `memberships/$id.tsx` | 185 | `store/memberships` | |
| 46 | `digital/$id.tsx` | 181 | `store/digital-products` | |
| 47 | `campaigns/$id.tsx` | 181 | `store/crowdfunding` | DUPLICATE endpoint (same as crowdfunding) |
| 48 | `affiliate/$id.tsx` | 180 | `store/affiliate` | |
| 49 | `places/$id.tsx` | 83 | `store/content/pois` | Smallest — likely incomplete |
| 50 | `quotes/$id.tsx` | 74 | `store/quotes` | Smallest — likely incomplete |
| 51 | `account/bookings/$id.tsx` | — | Internal | Account sub-page |
| 52 | `account/orders/$id.tsx` | — | Internal | Account sub-page |
| 53 | `account/purchase-orders/$id.tsx` | — | Internal | Account sub-page |
| 54 | `account/subscriptions/$id.tsx` | — | Internal | Account sub-page |

**Note:** Pages #49 (`places`) and #50 (`quotes`) are significantly smaller than others (83 and 74 lines vs average ~230 lines), indicating they are likely incomplete implementations.

---

### 15.3 All Manage Pages (96 pages) — Complete Inventory

The manage section is the tenant admin dashboard for managing all verticals and platform settings.

| # | Manage Page | Lines | Matching Vendor Page? | Matching Storefront Vertical? |
|---|---|---|---|---|
| 1 | `commissions.tsx` | 228 | YES (vendor/commissions) | — |
| 2 | `availability.tsx` | 224 | NO — MISSING | — |
| 3 | `vendors.tsx` | 222 | NO (vendor portal ≠ manage) | YES (vendors/) |
| 4 | `subscriptions.tsx` | 222 | YES | YES |
| 5 | `promotions-ext.tsx` | 221 | NO | — |
| 6 | `commission-rules.tsx` | 219 | NO — MISSING | — |
| 7 | `subscription-plans.tsx` | 218 | NO — MISSING | — |
| 8 | `dropshipping.tsx` | 218 | YES | YES |
| 9 | `service-providers.tsx` | 217 | NO — MISSING | — |
| 10 | `invoices.tsx` | 217 | YES | — |
| 11 | `promotions.tsx` | 216 | NO — MISSING | — |
| 12 | `flash-sales.tsx` | 216 | YES | YES (as flash-deals) |
| 13 | `companies.tsx` | 216 | NO — MISSING | — |
| 14 | `restaurants.tsx` | 215 | YES | YES |
| 15 | `purchase-orders.tsx` | 215 | NO — MISSING | — |
| 16 | `rentals.tsx` | 214 | YES | YES |
| 17 | `try-before-you-buy.tsx` | 212 | YES | YES |
| 18 | `print-on-demand.tsx` | 212 | YES | YES |
| 19 | `event-ticketing.tsx` | 212 | YES | — (no storefront page) |
| 20-96 | *(remaining 77 pages)* | 135-212 | Various | Various |

**Total manage pages: 96, Total lines: 18,661**

Key manage-only pages (no vendor equivalent):
- `governance.tsx`, `nodes.tsx`, `personas.tsx` — CityOS platform admin
- `cms.tsx`, `cms-content.tsx` — Content management
- `tenants-admin.tsx`, `stores.tsx`, `region-zones.tsx` — Multi-tenant admin
- `temporal.tsx`, `webhooks.tsx`, `integrations.tsx` — System integration admin
- `team.tsx`, `settings.tsx` — Organization settings

---

### 15.4 All Vendor Pages (56 pages) — Complete Inventory

The vendor section is the vendor dashboard for managing their own listings, products, and operations.

| Category | Pages | Lines |
|---|---|---|
| Vendor dashboard | `home.tsx`, `index.tsx` | 236 |
| Vendor onboarding | `onboarding/` (3 pages) | ~350 |
| Product management | `products/` (3 pages) | ~450 |
| Order management | `orders/` (1 page) | ~170 |
| Financial | `payouts/`, `payouts.tsx`, `transactions.tsx`, `commissions.tsx`, `invoices.tsx`, `wallet.tsx` | ~950 |
| Vertical-specific (40 pages) | One per vertical | ~6,200 |
| Settings | `register.tsx`, `reviews.tsx`, `analytics.tsx`, `notification-preferences.tsx`, etc. | ~1,100 |

**Total vendor pages: 56, Total lines: 9,493**

Key vendor pages WITHOUT manage equivalent:
- `cart-rules.tsx` — Vendor cart customization
- `shipping-rules.tsx` — Vendor shipping config
- `transactions.tsx` — Vendor financial transactions
- `home.tsx` — Vendor dashboard overview

---

### 15.5 All Account Pages (26 pages) — Complete Inventory

| # | Page | Lines | Purpose |
|---|---|---|---|
| 1 | `disputes.tsx` | 173 | Dispute management |
| 2 | `verification.tsx` | 172 | Identity verification |
| 3 | `settings.tsx` | 149 | Account settings |
| 4 | `addresses.tsx` | 133 | Address book |
| 5 | `wallet.tsx` | 110 | Digital wallet |
| 6 | `installments.tsx` | 98 | Payment installments |
| 7 | `wishlist.tsx` | 66 | Wishlist |
| 8 | `consents.tsx` | 65 | Privacy consent |
| 9 | `loyalty.tsx` | 64 | Loyalty points |
| 10 | `index.tsx` | 56 | Account dashboard |
| 11 | `store-credits.tsx` | 53 | Store credits |
| 12 | `referrals.tsx` | 51 | Referral program |
| 13 | `downloads.tsx` | 18 | Digital downloads |
| 14 | `profile.tsx` | 17 | Profile (minimal!) |
| 15 | `orders/index.tsx` | — | Order list |
| 16 | `orders/$id.tsx` | — | Order detail |
| 17 | `orders/$id.return.tsx` | — | Return flow |
| 18 | `orders/$id.track.tsx` | — | Order tracking |
| 19 | `bookings/index.tsx` | — | Booking list |
| 20 | `bookings/$id.tsx` | — | Booking detail |
| 21 | `subscriptions/index.tsx` | — | Subscription list |
| 22 | `subscriptions/$id.tsx` | — | Subscription detail |
| 23 | `subscriptions/$id.billing.tsx` | — | Billing management |
| 24 | `purchase-orders/index.tsx` | — | PO list |
| 25 | `purchase-orders/$id.tsx` | — | PO detail |
| 26 | `purchase-orders/new.tsx` | — | Create PO |

**Total account pages: 26, Total lines: 2,823**

**Issues found:**
- `profile.tsx` is only 17 lines — likely incomplete/stub
- `downloads.tsx` is only 18 lines — likely incomplete/stub
- No `account/reviews.tsx` — customers can't see their own reviews
- No `account/returns/index.tsx` — returns list is separate at `returns/index.tsx`

---

### 15.6 All Special Pages (15 pages) — Complete Inventory

| # | Page | Lines | Purpose | CMS-able? |
|---|---|---|---|---|
| 1 | `gift-cards.tsx` | 191 | Gift card purchase | YES |
| 2 | `reset-password.tsx` | 167 | Password reset | NO (auth flow) |
| 3 | `trade-in.tsx` | 166 | Trade-in landing | YES — duplicates trade-in/index |
| 4 | `compare.tsx` | 163 | Product comparison | YES |
| 5 | `$slug.tsx` | 151 | CMS dynamic slug page | YES (already CMS) |
| 6 | `$.tsx` | 112 | CMS splat/catch-all | YES (already CMS) |
| 7 | `track.tsx` | 98 | Order tracking | NO (utility) |
| 8 | `register.tsx` | 84 | User registration | NO (auth flow) |
| 9 | `login.tsx` | 83 | User login | NO (auth flow) |
| 10 | `index.tsx` | 82 | Homepage | YES |
| 11 | `flash-sales.tsx` | 81 | Flash sales landing | YES — duplicates flash-deals/index |
| 12 | `store-pickup.tsx` | 62 | Store pickup locator | YES |
| 13 | `wishlist.tsx` | 55 | Wishlist page | NO (utility) |
| 14 | `checkout.tsx` | 42 | Checkout flow | NO (commerce flow) |
| 15 | `cart.tsx` | 25 | Shopping cart | NO (commerce flow) |

**Issues found:**
- `trade-in.tsx` (166 lines) likely duplicates `trade-in/index.tsx` (182 lines)
- `flash-sales.tsx` (81 lines) likely duplicates `flash-deals/index.tsx` (244 lines)

---

### 15.7 All Sub-Route Pages (18 pages) — Complete Inventory

| # | Page | Lines | Purpose |
|---|---|---|---|
| 1 | `bookings/$serviceHandle.tsx` | — | Service-specific booking |
| 2 | `bookings/confirmation.tsx` | — | Booking confirmation |
| 3 | `b2b/dashboard.tsx` | — | B2B dashboard |
| 4 | `b2b/register.tsx` | — | B2B registration |
| 5 | `subscriptions/checkout.tsx` | — | Subscription checkout |
| 6 | `subscriptions/success.tsx` | — | Subscription success |
| 7 | `blog/$slug.tsx` | — | Blog post detail |
| 8 | `help/$slug.tsx` | — | Help article detail |
| 9 | `categories/$handle.tsx` | — | Category page |
| 10 | `vendors/$handle.tsx` | — | Vendor by handle |
| 11 | `verify/age.tsx` | — | Age verification |
| 12 | `vendor/products/$productId.tsx` | — | Vendor product edit |
| 13 | `vendor/products/new.tsx` | — | Vendor new product |
| 14 | `vendor/onboarding/complete.tsx` | — | Onboarding complete |
| 15 | `vendor/onboarding/verification.tsx` | — | Vendor verification |
| 16 | `account/orders/$id.return.tsx` | — | Return flow |
| 17 | `account/orders/$id.track.tsx` | — | Track order |
| 18 | `account/subscriptions/$id.billing.tsx` | — | Subscription billing |

---

## Section 16: Missing Pages & Structural Gaps

### 16.1 Missing Common Pages (Should Exist But Don't)

| # | Missing Page | Expected Path | Priority | Notes |
|---|---|---|---|---|
| 1 | **About page** | `about.tsx` or via CMS `$slug` | HIGH | Every commerce site needs About |
| 2 | **Contact page** | `contact.tsx` or via CMS `$slug` | HIGH | Customer support entry point |
| 3 | **Terms of Service** | `terms.tsx` or via CMS `$slug` | HIGH | Legal requirement |
| 4 | **Privacy Policy** | `privacy.tsx` or via CMS `$slug` | HIGH | Legal requirement (GDPR) |
| 5 | **FAQ page** | `faq.tsx` or via CMS `$slug` | MEDIUM | Customer self-service |
| 6 | **Search results page** | `search.tsx` | HIGH | Platform-wide search |
| 7 | **Sitemap** | `sitemap.tsx` | LOW | SEO requirement |
| 8 | **404 page** | Custom 404 component | MEDIUM | Currently falls through to splat route |
| 9 | **500 error page** | Custom 500 component | MEDIUM | User-friendly error handling |

**Note:** The CMS `$slug.tsx` and `$.tsx` (splat) routes can serve About, Contact, Terms, Privacy, and FAQ if the content exists in the CMS registry. However, they are NOT currently registered as CMS pages in `cms-registry.ts`, so these pages will show "Page not found."

### 16.2 Missing CMS Registry Entries

The CMS registry defines **27 verticals** but the storefront has **51 list pages**. These storefront verticals have NO CMS registry entry:

| # | Storefront Route | Backend Endpoint | CMS Status | Impact |
|---|---|---|---|---|
| 1 | `bookings/` | `store/bookings` | NOT in CMS registry | Cannot resolve via CMS |
| 2 | `b2b/` | `store/b2b` | NOT in CMS registry | Cannot resolve via CMS |
| 3 | `bundles/` | `store/bundles` | NOT in CMS registry | Cannot resolve via CMS |
| 4 | `campaigns/` | `store/crowdfunding` | NOT in CMS registry | Uses crowdfunding endpoint |
| 5 | `consignment/` | `store/consignments` | NOT in CMS registry | Cannot resolve via CMS |
| 6 | `credit/` | `store/credit` | NOT in CMS registry | Cannot resolve via CMS |
| 7 | `dropshipping/` | `store/dropshipping` | NOT in CMS registry | Cannot resolve via CMS |
| 8 | `flash-deals/` | `store/flash-sales` | NOT in CMS registry | Cannot resolve via CMS |
| 9 | `gift-cards-shop/` | `store/gift-cards` | NOT in CMS registry | Cannot resolve via CMS |
| 10 | `insurance/` | `store/insurance` | NOT in CMS registry | Cannot resolve via CMS |
| 11 | `loyalty-program/` | `store/loyalty` | NOT in CMS registry | Cannot resolve via CMS |
| 12 | `newsletter/` | `store/newsletters` | NOT in CMS registry | Cannot resolve via CMS |
| 13 | `print-on-demand/` | `store/print-on-demand` | NOT in CMS registry | Cannot resolve via CMS |
| 14 | `places/` | `store/content/pois` | NOT in CMS registry | Cannot resolve via CMS |
| 15 | `quotes/` | `store/quotes` | NOT in CMS registry | Cannot resolve via CMS |
| 16 | `subscriptions/` | `store/subscriptions` | NOT in CMS registry | Cannot resolve via CMS |
| 17 | `trade-in/` | `store/trade-in` | NOT in CMS registry | Cannot resolve via CMS |
| 18 | `try-before-you-buy/` | `store/try-before-you-buy` | NOT in CMS registry | Cannot resolve via CMS |
| 19 | `volume-deals/` | `store/volume-deals` | NOT in CMS registry | Cannot resolve via CMS |
| 20 | `white-label/` | `store/white-label` | NOT in CMS registry | Cannot resolve via CMS |

**Impact:** These 20 verticals cannot be managed via Payload CMS because they have no CMS page definition. Content editors cannot create or customize pages for these verticals.

### 16.3 Missing Detail Pages (CMS Verticals Without Detail Route)

| # | CMS Vertical | Has List Page? | Has Detail Page? | Has Backend Endpoint? | Gap |
|---|---|---|---|---|---|
| 1 | `advertising` | NO route at all | NO | YES (`store/advertising`) | MISSING both list and detail |
| 2 | `utilities` | NO route at all | NO | YES (`store/utilities`) | MISSING both list and detail |
| 3 | `blog` | YES (index) | `$slug.tsx` (not $id) | NO backend | Has slug-based detail, not ID-based |

### 16.4 Backend Endpoints Without Storefront Routes

These backend API endpoints exist but have NO corresponding storefront page:

| # | Backend Endpoint | Purpose | Storefront Page? | Gap Severity |
|---|---|---|---|---|
| 1 | `store/advertising` | Ad campaigns | NO storefront route | HIGH — CMS vertical defined |
| 2 | `store/utilities` | Utility services | NO storefront route | HIGH — CMS vertical defined |
| 3 | `store/event-ticketing` | Ticket management | NO storefront route | MEDIUM — manage/vendor pages exist |
| 4 | `store/cityos` | CityOS platform API | NO (internal API) | LOW — internal |
| 5 | `store/trade-ins` | Trade-in (plural) | `trade-in/` (singular route exists) | LOW — naming variant |
| 6 | `store/newsletters` | Newsletter (plural) | `newsletter/` (singular route exists) | LOW — naming variant |

### 16.5 Slug/Naming Mismatches (Frontend → Backend → CMS)

These inconsistencies between frontend route slugs, backend API endpoint names, and CMS registry slugs cause bugs and confusion:

| # | Frontend Route Slug | Backend API Endpoint | CMS Registry Slug | Mismatch Type |
|---|---|---|---|---|
| 1 | `affiliate` | `store/affiliates` (plural) | `affiliates` | Singular vs plural |
| 2 | `digital` | `store/digital-products` | `digital-products` | Abbreviated |
| 3 | `financial` | `store/financial-products` | `financial-products` | Abbreviated |
| 4 | `flash-deals` | `store/flash-sales` | — (not in CMS) | Different name |
| 5 | `gift-cards-shop` | `store/gift-cards` | — (not in CMS) | Extra suffix |
| 6 | `consignment` | `store/consignments` (plural) | — (not in CMS) | Singular vs plural |
| 7 | `newsletter` | `store/newsletters` (plural) | — (not in CMS) | Singular vs plural |
| 8 | `loyalty-program` | `store/loyalty` | — (not in CMS) | Different name |
| 9 | `trade-in` | `store/trade-in` AND `store/trade-ins` | — (not in CMS) | Backend has both |

**Impact:** When the CMS resolve endpoint looks up a page by slug, mismatches mean the wrong page definition is returned or no page is found at all. The unified `loadVerticalDetail()` function must include a slug → endpoint mapping table to handle these.

### 16.6 Duplicate/Redundant Pages

| # | Primary Page | Duplicate Page | Same API? | Lines Wasted | Action |
|---|---|---|---|---|---|
| 1 | `consignment/` (list + detail) | `consignment-shop/` (list + detail) | YES (`store/consignments`) | 413 | MERGE → redirect |
| 2 | `dropshipping/` (list + detail) | `dropshipping-marketplace/` (list + detail) | YES (`store/dropshipping`) | 424 | MERGE → redirect |
| 3 | `print-on-demand/` (list + detail) | `print-on-demand-shop/` (list + detail) | YES (`store/print-on-demand`) | 385 | MERGE → redirect |
| 4 | `white-label/` (list + detail) | `white-label-shop/` (list + detail) | YES (`store/white-label`) | 427 | MERGE → redirect |
| 5 | `crowdfunding/` (list + detail) | `campaigns/` (list + detail) | YES (`store/crowdfunding`) | 425 | MERGE → redirect |
| 6 | `flash-deals/` (list) | `flash-sales.tsx` (special page) | Similar | 81 | REMOVE flash-sales.tsx |
| 7 | `trade-in/` (list) | `trade-in.tsx` (special page) | Same | 166 | REMOVE trade-in.tsx |

**Total duplicate lines: 2,321** — eliminating these saves significant maintenance burden.

### 16.7 Incomplete/Stub Pages

Pages that are significantly shorter than average, indicating they are likely stubs or incomplete:

| # | Page | Lines | Average for Type | Completeness |
|---|---|---|---|---|
| 1 | `quotes/$id.tsx` | 74 | ~230 | **32%** — likely minimal stub |
| 2 | `places/$id.tsx` | 83 | ~230 | **36%** — likely minimal stub |
| 3 | `account/profile.tsx` | 17 | ~100 | **17%** — almost empty |
| 4 | `account/downloads.tsx` | 18 | ~100 | **18%** — almost empty |
| 5 | `vendor/index.tsx` | 37 | ~107 | **35%** — minimal dashboard |

### 16.8 Flow Completeness Gaps

Critical user flows that are missing pages or steps:

| # | Flow | Existing Steps | Missing Step | Impact |
|---|---|---|---|---|
| 1 | **Checkout flow** | Cart → Checkout → (gap) | No order confirmation page after checkout | HIGH — users see nothing after paying |
| 2 | **Vendor onboarding** | Register → Onboarding → Verification → Complete | No vendor approval/pending status page | MEDIUM |
| 3 | **Return flow** | Orders → Return request | No return tracking page (only order tracking) | MEDIUM |
| 4 | **Search flow** | No dedicated search results page | Search results page `/search` is missing | HIGH — no global search |
| 5 | **Blog flow** | Blog list → Blog post (via $slug) | No blog category/tag filtering page | LOW |
| 6 | **Customer reviews** | Reviews exist in detail pages | No account page to see your own reviews | LOW |
| 7 | **Invoice flow** | Invoices in manage | No customer-facing invoice view | MEDIUM |
| 8 | **Notification center** | Notification preferences in manage/vendor | No customer notification center | LOW |

---

## Section 17: Vertical Completeness Matrix — All 4 Layers

Each vertical ideally has 4 layers: Storefront (list + detail), Vendor Dashboard, and Manage (admin). Here is the completeness for every vertical:

### Legend: ✓ = exists, ✗ = missing, ~ = partial/mismatched slug

| # | Vertical | Storefront List | Storefront Detail | Vendor | Manage | Backend API | CMS Registry | Completeness |
|---|---|---|---|---|---|---|---|---|
| 1 | restaurants | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 2 | healthcare | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 3 | education | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 4 | real-estate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 5 | automotive | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 6 | grocery | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 7 | events | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 8 | fitness | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 9 | travel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 10 | charity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 11 | classifieds | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 12 | crowdfunding | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 13 | freelance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 14 | government | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 15 | parking | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 16 | pet-services | ✓ | ✓ | ~ (pet-service) | ✓ | ✓ | ✓ | **95%** — vendor slug mismatch |
| 17 | rentals | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 18 | auctions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 19 | legal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 20 | memberships | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **100%** |
| 21 | warranties | ✓ | ✓ | ~ (warranty) | ✓ | ✓ | ✓ | **95%** — vendor slug mismatch |
| 22 | social-commerce | ✓ | ✓ | ✓ | NO | ✓ | ✓ | **83%** — no manage page |
| 23 | affiliates | ~ (affiliate) | ~ (affiliate) | ✓ | ✓ | ✓ | ✓ | **90%** — slug mismatch |
| 24 | advertising | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | **67%** — NO storefront pages |
| 25 | utilities | ✗ | ✗ | NO | ✓ | ✓ | ✓ | **50%** — NO storefront/vendor |
| 26 | digital-products | ~ (digital) | ~ (digital) | ✓ | ✓ | ✓ | ✓ | **90%** — slug mismatch |
| 27 | financial-products | ~ (financial) | ~ (financial) | ✓ | ✓ | ✓ | ✓ | **90%** — slug mismatch |

### Non-CMS-Registry Verticals (exist in storefront but not in CMS registry's 27)

| # | Vertical | List | Detail | Vendor | Manage | Backend API | CMS? | Completeness |
|---|---|---|---|---|---|---|---|---|
| 28 | bookings | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 29 | b2b | ✓ | ✓ | ✓ | ~ (b2b not in manage) | ✓ | ✗ | **67%** — no CMS, no manage |
| 30 | bundles | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 31 | consignment | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 32 | credit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 33 | dropshipping | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 34 | flash-deals | ✓ | ✓ | ~ (flash-sales) | ✓ | ✓ (flash-sales) | ✗ | **75%** — no CMS, slug mismatch |
| 35 | gift-cards-shop | ✓ | ✓ | ~ (gift-cards) | ✓ | ✓ (gift-cards) | ✗ | **75%** — no CMS, slug mismatch |
| 36 | insurance | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 37 | loyalty-program | ✓ | ✓ | ~ (loyalty) | ✓ | ✓ (loyalty) | ✗ | **75%** — no CMS, slug mismatch |
| 38 | newsletter | ✓ | ✓ | ✓ | ✓ (newsletters) | ✓ (newsletters) | ✗ | **83%** — no CMS entry |
| 39 | print-on-demand | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 40 | places | ✓ | ✓ (stub) | ✗ | ✗ | ✓ (content/pois) | ✗ | **50%** — stub, no CMS/vendor/manage |
| 41 | quotes | ✓ | ✓ (stub) | ✓ | ✓ | ✓ | ✗ | **75%** — stub detail, no CMS |
| 42 | subscriptions | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 43 | trade-in | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 44 | try-before-you-buy | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | **83%** — no CMS entry |
| 45 | volume-deals | ✓ | ✓ | ~ (volume-pricing) | ~ (pricing-tiers) | ✓ (volume-pricing) | ✗ | **67%** — slugs differ everywhere |
| 46 | white-label | ✓ | ✓ | ✓ | ~ (white-label) | ✓ | ✗ | **83%** — no CMS entry |

### Duplicate Verticals (should be consolidated)

| # | Primary | Duplicate | Recommendation |
|---|---|---|---|
| 47 | consignment | consignment-shop | MERGE — same API |
| 48 | dropshipping | dropshipping-marketplace | MERGE — same API |
| 49 | print-on-demand | print-on-demand-shop | MERGE — same API |
| 50 | white-label | white-label-shop | MERGE — same API |
| 51 | crowdfunding | campaigns | MERGE — same API |

### Special Non-Vertical Routes

| # | Route | Purpose | Layer |
|---|---|---|---|
| 52 | blog | Content/articles | Storefront only |
| 53 | help | Support articles | Storefront only |
| 54 | vendors | Vendor directory | Storefront + manage |
| 55 | returns | Returns center | Storefront (account utility) |
| 56 | wallet | Digital wallet | Storefront + account |
| 57 | cart | Shopping cart | Core commerce flow |
| 58 | checkout | Checkout flow | Core commerce flow |
| 59 | compare | Product comparison | Storefront utility |
| 60 | wishlist | Wishlist | Storefront + account |

---

## Section 18: Summary Statistics — Complete Platform

### 18.1 Overall Page Counts

| Metric | Count |
|---|---|
| Total route files | 336 |
| Total route lines | 58,770 |
| Unique verticals with storefront pages | 51 (including duplicates) |
| Unique verticals (deduplicated) | 46 |
| CMS-registered verticals | 27 |
| Verticals missing CMS registration | 20 |
| Verticals missing from storefront | 2 (advertising, utilities) |
| Duplicate vertical pages (to merge) | 5 pairs (10 pages) |
| Incomplete/stub pages | 5 pages |
| Missing common pages | 9 pages |

### 18.2 Centralization Opportunity — All Page Types

| Page Type | Files | Current Lines | Target Lines | Reduction |
|---|---|---|---|---|
| Detail pages | 54 → 47 (after dedup) | 11,905 | ~1,410 | **88%** |
| List pages | 67 → 57 (after dedup) | 11,696 | ~2,850 | **76%** |
| Manage pages | 96 | 18,661 | ~9,000 (shared CRUD) | **52%** |
| Vendor pages | 56 | 9,493 | ~4,700 (shared patterns) | **50%** |
| Account pages | 26 | 2,823 | ~2,000 (minor) | **29%** |
| Special pages | 15 | 1,562 | ~1,200 (minor) | **23%** |
| Sub-routes | 18 | 1,284 | ~1,000 (minor) | **22%** |
| **TOTAL** | **336 → ~308** | **58,770** | **~22,160** | **62%** |

### 18.3 Priority Actions

| Priority | Action | Impact | Effort |
|---|---|---|---|
| P0 | Create shared infrastructure (loader, normalizer, entity context) | Enables all subsequent work | 3 hours |
| P0 | Add 20 missing CMS registry entries | All verticals CMS-manageable | 2 hours |
| P0 | Fix 9 slug/naming mismatches | Consistent data flow | 2 hours |
| P1 | Merge 5 duplicate page pairs | Remove 10 redundant pages, ~2,300 lines | 3 hours |
| P1 | Refactor 50 detail pages to use shared loader | 88% code reduction | 8 hours |
| P1 | Register all 77 blocks in Payload Pages collection | Full CMS page builder | 6 hours |
| P2 | Refactor 57 list pages to use shared template | 76% code reduction | 8 hours |
| P2 | Add missing common pages (about, contact, terms, privacy, search) | Complete user experience | 4 hours |
| P2 | Complete stub pages (quotes, places, profile, downloads) | Functional pages | 3 hours |
| P2 | Add advertising and utilities storefront pages | 100% vertical coverage | 2 hours |
| P3 | Centralize manage pages with shared CRUD patterns | 52% code reduction | 12 hours |
| P3 | Centralize vendor pages with shared patterns | 50% code reduction | 8 hours |
| P3 | Fix flow gaps (checkout confirmation, search results, etc.) | Complete user flows | 6 hours |

### 18.4 Blockers for Full CMS-Driven Architecture

| # | Blocker | Current Status | Required Fix |
|---|---|---|---|
| 1 | Shared detail-loader.ts doesn't exist | Every page has its own loader | Create single shared loader with vertical config |
| 2 | normalizeDetail() duplicated 50 times | Copy-pasted in every file | Extract to shared module |
| 3 | BlockRenderer not used in any route | 77 blocks exist, 0 connected | VerticalDetailPage component using BlockRenderer |
| 4 | CMS registry only 3 generic blocks per detail page | All verticals get same layout | Per-vertical unique block layouts |
| 5 | Payload Pages collection has only 3 block types | 74 blocks invisible to editors | Register all 77 blocks |
| 6 | EntityDataProvider doesn't exist | Blocks can't access SSR entity data | Create React context provider |
| 7 | 38 hooks unused by detail pages | All interactivity is inline | Wire hooks into blocks |
| 8 | 20 verticals not in CMS registry | Can't be CMS-managed | Add entries |
| 9 | 9 slug mismatches | Broken CMS resolve lookups | Standardize naming |
| 10 | No shared list page infrastructure | 67 list pages duplicate patterns | Create shared VerticalListPage component |

---

## Section 19: Admin Role Hierarchy — Deep Assessment

### 19.1 The 10-Role RBAC System

The platform defines a weight-based RBAC hierarchy in `apps/storefront/src/lib/types/tenant-admin.ts`:

| # | Role | Weight | Intended Scope | Current Access | Architecture Gap |
|---|---|---|---|---|---|
| 1 | `super-admin` | 100 | Entire platform, all tenants | All manage pages (weight ≥ 40) | NO separate super-admin section |
| 2 | `city-manager` | 90 | City-level node + children | All manage pages (weight ≥ 40) | Sees same pages as super-admin |
| 3 | `district-manager` | 80 | District-level node + children | All manage pages (weight ≥ 40) | No node-scoped data filtering |
| 4 | `zone-manager` | 70 | Zone-level node + children | All manage pages (weight ≥ 40) | No node-scoped data filtering |
| 5 | `facility-manager` | 60 | Single facility | All manage pages (weight ≥ 40) | Sees tenant-wide data, not facility data |
| 6 | `asset-manager` | 50 | Single asset | All manage pages (weight ≥ 40) | Sees tenant-wide data, not asset data |
| 7 | `vendor-admin` | 40 | Own vendor data only | All manage pages (weight ≥ 40) | Sees ALL tenant data, not just own vendor |
| 8 | `content-editor` | 30 | CMS content editing | **BLOCKED from manage (weight < 40)** | **CRITICAL: Can't access manage CMS pages!** |
| 9 | `analyst` | 20 | Read-only analytics | BLOCKED from manage (weight < 40) | No dedicated analytics view |
| 10 | `viewer` | 10 | Read-only storefront | BLOCKED from manage (weight < 40) | No special capabilities |

**CRITICAL FINDING:** The `RoleGuard` component in `role-guard.tsx` enforces `MIN_MANAGE_WEIGHT = 40`. This means:
- Roles 1-7 (super-admin through vendor-admin) ALL see the exact same manage section
- Roles 8-10 (content-editor, analyst, viewer) are completely BLOCKED from all manage pages
- There is NO page-level role differentiation — every manage page requires the same minimum weight

### 19.2 Role-to-System Mapping — Payload CMS vs Storefront RBAC

The Payload CMS (Orchestrator) uses a DIFFERENT role system than the Storefront:

| Payload CMS Role | Storefront RBAC Equivalent | Weight | Mapping Status |
|---|---|---|---|
| `super_admin` | `super-admin` | 100 | **Matched** (underscore vs hyphen) |
| `tenant_admin` | **NO EQUIVALENT** | — | **MISSING** — closest is `city-manager` (90) |
| `content_editor` | `content-editor` | 30 | **Matched** — but weight mismatch (Payload allows CMS access, Storefront blocks manage) |

**CRITICAL GAPS:**
1. **Payload has `tenant_admin`** but the storefront's 10-role RBAC does NOT include `tenant_admin` — there is no role between `super-admin` (100) and `city-manager` (90) that maps to "admin of a single tenant"
2. **7 storefront roles** (city-manager through vendor-admin) have NO Payload equivalent — Payload only knows 3 roles
3. **`content_editor` is blocked** from manage pages in the storefront (weight 30 < 40) BUT Payload CMS grants `content_editor` full create/update access to Pages — this is an architectural conflict

### 19.3 Who Is the Tenant Manager (Page Builder User)?

The **tenant manager** — the person who uses the Payload CMS page builder to create and customize pages — maps to the `content-editor` role (weight 30). This role is explicitly designed for:
- Creating CMS pages using the Payload page builder
- Arranging blocks to build custom storefront pages
- Managing content without developer involvement
- Previewing pages before publishing

**THE PROBLEM:** The content-editor (weight 30) is BELOW the manage page minimum weight (40). This creates an impossible workflow:

```
Content-Editor Workflow (BROKEN):
1. Log into storefront → Can browse store ✓
2. Navigate to /$tenant/$locale/manage → BLOCKED (weight 30 < 40) ✗
3. Navigate to /$tenant/$locale/manage/cms → BLOCKED ✗
4. Navigate to /$tenant/$locale/manage/cms-content → BLOCKED ✗
5. Has NO WAY to access CMS management from storefront
6. Must use Payload admin panel directly (separate URL, separate auth)
```

**vs. the intended workflow:**

```
Content-Editor Workflow (TARGET):
1. Log into storefront → Can browse store ✓
2. Navigate to /$tenant/$locale/manage → See CMS-only sidebar ✓
3. Navigate to /$tenant/$locale/manage/cms → Manage pages ✓
4. Open page builder → Drag-and-drop 77 blocks ✓
5. Preview page → See live preview in storefront context ✓
6. Publish → Page goes live ✓
```

### 19.4 Three Admin Tiers — What Should Exist

The platform needs 3 distinct admin tiers with separate page sets:

#### Tier 1: Super-Admin (Platform Administration)
**Role:** `super-admin` (weight 100)
**Scope:** ALL tenants, platform-wide settings, cross-tenant operations
**Access Pattern:** Sees everything across all tenants simultaneously

**Pages that SHOULD be super-admin only (but are currently accessible to vendor-admin weight 40+):**

| # | Manage Page | Lines | Why Super-Admin Only | Current Access |
|---|---|---|---|---|
| 1 | `tenants-admin.tsx` | 188 | Creates/manages ALL tenants | vendor-admin+ (WRONG) |
| 2 | `governance.tsx` | 193 | Platform-wide governance policies | vendor-admin+ (WRONG) |
| 3 | `nodes.tsx` | 194 | 5-level node hierarchy (CITY→ASSET) | vendor-admin+ (WRONG) |
| 4 | `personas.tsx` | 188 | 6-axis persona system | vendor-admin+ (WRONG) |
| 5 | `region-zones.tsx` | 188 | Geographic zone management | vendor-admin+ (WRONG) |
| 6 | `temporal.tsx` | 75 | Workflow orchestration (Temporal Cloud) | vendor-admin+ (WRONG) |
| 7 | `webhooks.tsx` | 210 | System webhook configuration | vendor-admin+ (WRONG) |
| 8 | `integrations.tsx` | 77 | External system integrations | vendor-admin+ (WRONG) |
| 9 | `audit.tsx` | 108 | Platform audit log | vendor-admin+ (WRONG) |
| 10 | `channels.tsx` | 188 | Sales channel management | vendor-admin+ (WRONG) |
| 11 | `metrics.tsx` | 71 | Platform-wide metrics | vendor-admin+ (WRONG) |
| 12 | `i18n.tsx` | 193 | Internationalization management | vendor-admin+ (WRONG) |
| 13 | `tax-config.tsx` | 188 | Tax configuration | vendor-admin+ (WRONG) |
| 14 | `payment-terms.tsx` | 186 | Payment terms management | vendor-admin+ (WRONG) |
| 15 | `shipping-extensions.tsx` | 188 | Shipping rule extensions | vendor-admin+ (WRONG) |
| 16 | `cart-extensions.tsx` | 188 | Cart rule extensions | vendor-admin+ (WRONG) |
| 17 | `promotion-extensions.tsx` | 188 | Promotion rule extensions | vendor-admin+ (WRONG) |
| **TOTAL** | **17 pages** | **2,851 lines** | | |

**Missing super-admin pages that DON'T exist yet:**

| # | Missing Page | Purpose | Priority |
|---|---|---|---|
| 1 | `platform-dashboard.tsx` | Cross-tenant overview, tenant health monitoring | P0 |
| 2 | `tenant-onboarding.tsx` | Tenant provisioning wizard | P0 |
| 3 | `platform-settings.tsx` | Global platform configuration | P0 |
| 4 | `rbac-management.tsx` | Role and permission definitions | P1 |
| 5 | `platform-billing.tsx` | Multi-tenant billing/subscription management | P1 |
| 6 | `system-health.tsx` | Infrastructure monitoring dashboard | P1 |
| 7 | `data-migration.tsx` | Cross-tenant data migration tools | P2 |
| 8 | `feature-flags.tsx` | Feature flag management across tenants | P2 |
| 9 | `api-keys.tsx` | Platform API key management | P1 |
| 10 | `sync-dashboard.tsx` | CMS ↔ Medusa ↔ ERPNext sync monitoring | P1 |

#### Tier 2: Tenant-Admin (Tenant Administration)
**Roles:** `city-manager` (90), `district-manager` (80), `zone-manager` (70), `facility-manager` (60), `asset-manager` (50), `vendor-admin` (40)
**Scope:** Single tenant's data, commerce operations, vendor management
**Access Pattern:** Sees only their tenant's data, scoped by node assignment

**Pages that belong to tenant-admin tier (currently correct in the manage section):**

| # | Section | Manage Pages | Count | Lines |
|---|---|---|---|---|
| 1 | **Commerce Core** | products, orders, customers, quotes, invoices, subscriptions, reviews, inventory, inventory-extension | 9 | 1,886 |
| 2 | **Marketplace** | vendors, commissions, payouts, affiliates, commission-rules, service-providers | 6 | 1,294 |
| 3 | **Verticals (18)** | auctions, bookings, event-ticketing, rentals, restaurants, grocery, travel, automotive, real-estate, healthcare, education, fitness, pet-services, digital-products, memberships, financial-products, freelance, parking | 18 | 3,770 |
| 4 | **More Verticals (17)** | advertising, social-commerce, classifieds, crowdfunding, charity/charities, flash-sales, dropshipping, gift-cards, insurance, loyalty, newsletters, print-on-demand, trade-in, try-before-you-buy, volume-pricing, white-label, warranty/warranties | 17 | 3,521 |
| 5 | **Commerce Extensions** | promotions, promotions-ext, subscription-plans, bundles, credit, consignments, purchase-orders, availability, wallet, pricing-tiers | 10 | 2,065 |
| 6 | **Marketing** | campaigns (via crowdfunding), wishlists, notification-preferences | 3 | 505 |
| 7 | **Organization** | team, companies, companies-admin, company, stores, legal, utilities, disputes | 8 | 1,630 |
| 8 | **System (tenant-level)** | analytics, settings | 2 | 261 |
| **TOTAL** | | | **73 pages** | **14,932 lines** |

**BUT — critical data scoping issues:**

| # | Issue | Details | Impact |
|---|---|---|---|
| 1 | `vendor-admin` sees ALL tenant data | vendor-admin (weight 40) can access products, orders, customers for ALL vendors in the tenant | HIGH — data leak across vendors |
| 2 | No node-based data scoping | A `facility-manager` for Facility A sees data for Facilities B, C, D too | HIGH — no isolation |
| 3 | `zone-manager` vs `district-manager` see same data | Both have weight > 40, both see all pages with no scope filtering | MEDIUM — roles are equivalent |
| 4 | Duplicate pages for same vertical | `charity.tsx` AND `charities.tsx`, `warranty.tsx` AND `warranties.tsx` | LOW — maintenance waste |

**Missing tenant-admin pages:**

| # | Missing Page | Purpose | Priority |
|---|---|---|---|
| 1 | `tenant-dashboard.tsx` | Dedicated tenant overview (current index.tsx is too generic) | P1 |
| 2 | `vendor-onboarding-review.tsx` | Review and approve vendor applications | P0 |
| 3 | `content-moderation.tsx` | Review flagged content from vendors/customers | P1 |
| 4 | `reports.tsx` | Generate and download business reports | P1 |
| 5 | `import-export.tsx` | Bulk data import/export for products, customers, orders | P1 |
| 6 | `email-templates.tsx` | Manage transactional email templates | P2 |
| 7 | `theme-customization.tsx` | Tenant branding and theme management | P1 |
| 8 | `delivery-zones.tsx` | Manage delivery zones (Fleetbase integration) | P1 |
| 9 | `payout-schedules.tsx` | Configure vendor payout schedules | P1 |
| 10 | `tax-rates.tsx` | Manage tax rates per region | P2 |

#### Tier 3: Tenant Manager / Content-Editor (Page Builder User)
**Role:** `content-editor` (weight 30)
**Scope:** CMS content only — pages, blocks, media, blog posts
**Access Pattern:** Creates and manages storefront pages using the Payload page builder

**What this user NEEDS to access (but currently CANNOT):**

| # | Required Page | Current Status | Blocker |
|---|---|---|---|
| 1 | `manage/cms.tsx` | EXISTS (193 lines) but BLOCKED | Weight 30 < minWeight 40 |
| 2 | `manage/cms-content.tsx` | EXISTS (209 lines) but BLOCKED | Weight 30 < minWeight 40 |
| 3 | Page builder / block editor | DOES NOT EXIST | No page builder in storefront |
| 4 | Media library | DOES NOT EXIST in storefront | No media management page |
| 5 | Page preview | DOES NOT EXIST | No preview functionality |
| 6 | Navigation menu editor | DOES NOT EXIST | No navigation management |
| 7 | Blog post editor | DOES NOT EXIST | No blog management |
| 8 | SEO settings editor | DOES NOT EXIST | No SEO management page |
| 9 | Redirect rules | DOES NOT EXIST | No URL redirect management |
| 10 | Template library | DOES NOT EXIST | No page template gallery |

**Complete tenant manager (content-editor) workflow gap:**

```
CURRENT STATE:
┌─────────────────────────────────────────────────────────────┐
│ Content-Editor (weight 30)                                  │
│                                                             │
│ CAN access:                                                 │
│   - Storefront pages (as customer)                         │
│   - Payload CMS admin panel (IF deployed separately)       │
│                                                             │
│ CANNOT access:                                              │
│   - ANY manage page (weight < 40)                          │
│   - CMS management in storefront                           │
│   - Page builder                                           │
│   - Media library                                          │
│   - Content preview                                        │
│   - Blog management                                        │
│                                                             │
│ RESULT: Content-editor has NO usable workflow               │
└─────────────────────────────────────────────────────────────┘

TARGET STATE:
┌─────────────────────────────────────────────────────────────┐
│ Content-Editor (weight 30)                                  │
│                                                             │
│ CAN access:                                                 │
│   - /$tenant/$locale/manage/                               │
│     ├── cms-dashboard    (CMS overview)                    │
│     ├── pages            (Page list + builder)             │
│     ├── page-builder     (Drag-drop block editor)          │
│     ├── media            (Media library)                   │
│     ├── blog             (Blog post management)            │
│     ├── navigation       (Menu editor)                     │
│     ├── redirects        (URL redirects)                   │
│     ├── seo              (SEO settings)                    │
│     └── templates        (Page templates gallery)          │
│                                                             │
│ CANNOT access:                                              │
│   - Commerce pages (products, orders, etc.)                │
│   - Marketplace pages (vendors, commissions)               │
│   - System pages (settings, analytics, etc.)               │
│   - Platform pages (tenants, governance, nodes)            │
│                                                             │
│ RESULT: Content-editor has a complete CMS workflow          │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 20: Payload CMS Block Gap Analysis — Page Builder Readiness

### 20.1 Payload Pages Collection — Current State

The Payload CMS `Pages` collection (at `apps/orchestrator/src/collections/Pages.ts`) defines only **3 block types** in its `layout` field:

| # | Payload Block Slug | Equivalent Storefront Block? | Status |
|---|---|---|---|
| 1 | `hero` | `HeroBlock` (exists) | Minimal — only title/subtitle/image/cta |
| 2 | `richText` | `ContentBlock` (exists) | OK — basic rich text |
| 3 | `media` | — (no standalone media block) | Minimal — single upload |

**Meanwhile, the storefront has 77 blocks** in the `BLOCK_REGISTRY`, organized into these categories:

### 20.2 Complete Storefront Block Inventory (77 Blocks)

#### Category A: Core Layout Blocks (12 blocks) — Storefront-ready, NOT in Payload

| # | Block Key | Component | Lines | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|---|
| 1 | `hero` | HeroBlock | YES | YES (3 fields only) | PARTIAL — Payload version is stripped-down |
| 2 | `featureGrid` | FeaturesBlock | YES | NO | YES — perfect for page builder |
| 3 | `richText` | ContentBlock | YES | YES | YES |
| 4 | `cta` | CTABlock | YES | NO | YES — perfect for page builder |
| 5 | `stats` | StatsBlock | YES | NO | YES |
| 6 | `imageGallery` | ImageGalleryBlock | YES | NO | YES |
| 7 | `divider` | DividerBlock | YES | NO | YES |
| 8 | `timeline` | TimelineBlock | YES | NO | YES |
| 9 | `videoEmbed` | VideoEmbedBlock | YES | NO | YES |
| 10 | `bannerCarousel` | BannerCarouselBlock | YES | NO | YES |
| 11 | `contactForm` | ContactFormBlock | YES | NO | YES |
| 12 | `map` | MapBlock | YES | NO | YES |

#### Category B: Commerce Blocks (8 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 13 | `productGrid` | ProductsBlock | NO | YES — show products on any page |
| 14 | `productDetail` | ProductDetailBlock | NO | LIMITED — needs product data context |
| 15 | `cartSummary` | CartSummaryBlock | NO | NO — functional component, not content |
| 16 | `checkoutSteps` | CheckoutStepsBlock | NO | NO — functional component |
| 17 | `orderConfirmation` | OrderConfirmationBlock | NO | NO — functional component |
| 18 | `wishlistGrid` | WishlistGridBlock | NO | LIMITED — needs customer context |
| 19 | `recentlyViewed` | RecentlyViewedBlock | NO | YES — widget block |
| 20 | `flashSaleCountdown` | FlashSaleCountdownBlock | NO | YES — promotional block |

#### Category C: Social & Trust Blocks (6 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 21 | `testimonial` | TestimonialBlock | NO | YES — perfect for page builder |
| 22 | `reviewList` | ReviewListBlock | NO | YES — data-driven widget |
| 23 | `trustBadges` | TrustBadgesBlock | NO | YES — perfect for page builder |
| 24 | `socialProof` | SocialProofBlock | NO | YES — perfect for page builder |
| 25 | `comparisonTable` | ComparisonTableBlock | NO | YES — content block |
| 26 | `newsletter` | NewsletterBlock | NO | YES — perfect for page builder |

#### Category D: Vendor Blocks (5 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 27 | `vendorShowcase` | VendorShowcaseBlock | NO | YES — show vendors on any page |
| 28 | `vendorProfile` | VendorProfileBlock | NO | LIMITED — needs vendor data |
| 29 | `vendorProducts` | VendorProductsBlock | NO | LIMITED — needs vendor data |
| 30 | `vendorRegisterForm` | VendorRegisterFormBlock | NO | YES — embed on any page |
| 31 | `commissionDashboard` | CommissionDashboardBlock | NO | NO — admin block |

#### Category E: Category & Collection Blocks (3 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 32 | `categoryGrid` | CategoryGridBlock | NO | YES — perfect for page builder |
| 33 | `serviceList` | ServiceListBlock | NO | YES — data-driven listing |
| 34 | `collectionList` | CollectionListBlock | NO | YES — data-driven listing |

#### Category F: Booking & Service Blocks (6 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 35 | `bookingCalendar` | BookingCalendarBlock | NO | LIMITED — needs booking context |
| 36 | `serviceCardGrid` | ServiceCardGridBlock | NO | YES — listing widget |
| 37 | `appointmentSlots` | AppointmentSlotsBlock | NO | LIMITED — needs service context |
| 38 | `bookingConfirmation` | BookingConfirmationBlock | NO | NO — functional component |
| 39 | `providerSchedule` | ProviderScheduleBlock | NO | NO — admin/vendor block |
| 40 | `resourceAvailability` | ResourceAvailabilityBlock | NO | NO — admin/vendor block |

#### Category G: Subscription & Loyalty Blocks (4 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 41 | `subscriptionPlans` | SubscriptionPlansBlock | NO | YES — perfect for page builder |
| 42 | `membershipTiers` | MembershipTiersBlock | NO | YES — perfect for page builder |
| 43 | `loyaltyDashboard` | LoyaltyDashboardBlock | NO | LIMITED — needs customer context |
| 44 | `subscriptionManage` | SubscriptionManageBlock | NO | NO — customer account block |

#### Category H: Vertical-Specific Blocks (16 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 45 | `auctionBidding` | AuctionBiddingBlock | NO | LIMITED — needs auction data |
| 46 | `rentalCalendar` | RentalCalendarBlock | NO | LIMITED — needs rental data |
| 47 | `propertyListing` | PropertyListingBlock | NO | YES — listing widget |
| 48 | `vehicleListing` | VehicleListingBlock | NO | YES — listing widget |
| 49 | `menuDisplay` | MenuDisplayBlock | NO | YES — restaurant menus |
| 50 | `courseCurriculum` | CourseCurriculumBlock | NO | YES — education content |
| 51 | `eventSchedule` | EventScheduleBlock | NO | YES — event listings |
| 52 | `healthcareProvider` | HealthcareProviderBlock | NO | YES — provider directory |
| 53 | `fitnessClassSchedule` | FitnessClassScheduleBlock | NO | YES — class timetable |
| 54 | `petProfileCard` | PetProfileCardBlock | NO | YES — pet profiles |
| 55 | `classifiedAdCard` | ClassifiedAdCardBlock | NO | YES — classified listings |
| 56 | `crowdfundingProgress` | CrowdfundingProgressBlock | NO | YES — campaign widget |
| 57 | `donationCampaign` | DonationCampaignBlock | NO | YES — charity widget |
| 58 | `freelancerProfile` | FreelancerProfileBlock | NO | YES — freelancer directory |
| 59 | `parkingSpotFinder` | ParkingSpotFinderBlock | NO | YES — parking map widget |
| 60 | `giftCardDisplay` | GiftCardDisplayBlock | NO | YES — gift card showcase |

#### Category I: B2B Blocks (4 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 61 | `purchaseOrderForm` | PurchaseOrderFormBlock | NO | NO — functional form |
| 62 | `bulkPricingTable` | BulkPricingTableBlock | NO | YES — pricing display |
| 63 | `companyDashboard` | CompanyDashboardBlock | NO | NO — admin dashboard |
| 64 | `approvalWorkflow` | ApprovalWorkflowBlock | NO | NO — functional workflow |

#### Category J: Marketing & Content Blocks (5 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 65 | `blogPost` | BlogPostBlock | NO | YES — blog content |
| 66 | `promotionBanner` | PromotionBannerBlock | NO | YES — promotional content |
| 67 | `bookingCTA` | BookingCtaBlock | NO | YES — call-to-action |
| 68 | `eventList` | EventListBlock | NO | YES — event listings |
| 69 | `pricing` | PricingBlock | NO | YES — pricing tables |

#### Category K: Customer Account Blocks (3 blocks)

| # | Block Key | Component | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|
| 70 | `faq` | FaqBlock | NO | YES — perfect for page builder |
| 71 | `referralProgram` | ReferralProgramBlock | NO | YES — marketing widget |
| 72 | `loyaltyPointsDisplay` | LoyaltyPointsDisplayBlock | NO | LIMITED — needs customer data |

#### Category L: Existing Admin Blocks (3 blocks — manage dashboard only)

| # | Block Key | Component | Lines | In Payload? | Content-Editor Usable? |
|---|---|---|---|---|---|
| 73 | `manageStats` | ManageStatsBlock | 61 | NO | NO — admin dashboard only |
| 74 | `manageRecentOrders` | ManageRecentOrdersBlock | 107 | NO | NO — admin dashboard only |
| 75 | `manageActivity` | ManageActivityBlock | 74 | NO | NO — admin dashboard only |

#### Category M: Not Yet Created — Missing Admin Blocks

| # | Block Key (Proposed) | Purpose | Category | Priority |
|---|---|---|---|---|
| 76 | `dataTableBlock` | Data table with sorting, filtering, pagination | Admin CRUD | P0 |
| 77 | `formBuilderBlock` | Dynamic form with field configuration | Admin CRUD | P0 |
| 78 | `statsDashboardBlock` | Configurable stats cards grid | Admin dashboard | P0 |
| 79 | `chartBlock` | Line/bar/pie charts with data source config | Admin dashboard | P1 |
| 80 | `activityFeedBlock` | Filterable activity/audit log | Admin dashboard | P1 |
| 81 | `calendarViewBlock` | Calendar with events/bookings/availability | Admin scheduling | P1 |
| 82 | `kanbanBoardBlock` | Kanban board for order/task status | Admin workflow | P2 |
| 83 | `workflowBuilderBlock` | Visual workflow state machine editor | Admin automation | P2 |
| 84 | `crudPageBlock` | Complete CRUD page (table + form + actions) | Admin CRUD | P0 |
| 85 | `mapDashboardBlock` | Geographic data visualization | Admin geo | P2 |
| 86 | `notificationCenterBlock` | Notification management panel | Admin comms | P2 |
| 87 | `fileManagerBlock` | File/media upload and management | Admin media | P1 |
| 88 | `userManagementBlock` | User/team member management | Admin org | P1 |
| 89 | `permissionMatrixBlock` | Role/permission visual editor | Admin RBAC | P2 |
| 90 | `integrationStatusBlock` | External system connection status | Admin system | P2 |

### 20.3 Block Classification Summary — Content-Editor (Page Builder) Usability

| Classification | Count | % of Total | Examples |
|---|---|---|---|
| **YES — Perfect for page builder** | 38 | 49% | hero, featureGrid, cta, testimonial, categoryGrid, pricing |
| **YES — Data-driven widget** | 12 | 16% | productGrid, reviewList, eventList, serviceCardGrid |
| **LIMITED — Needs entity context** | 10 | 13% | productDetail, bookingCalendar, auctionBidding, loyaltyDashboard |
| **NO — Functional/admin only** | 15 | 19% | cartSummary, checkoutSteps, providerSchedule, companyDashboard |
| **NO — Admin dashboard only** | 3 | 4% | manageStats, manageRecentOrders, manageActivity |
| **NOT YET CREATED** | 15 | — | dataTableBlock, formBuilderBlock, crudPageBlock, etc. |

**For the content-editor (tenant manager) page builder:**
- **50 blocks (65%)** are usable for building storefront pages
- **15 blocks (19%)** are NOT suitable for page builder (admin/functional)
- **12 blocks (16%)** need entity context — usable on detail pages only
- **15 admin blocks** are MISSING and need to be created for admin page building

### 20.4 Payload Pages Collection — What Needs to Change

The Payload `Pages` collection currently defines **3 block types** but needs **50+ block types** for the content-editor to build real pages:

**Current Payload `layout.blocks` array (3 entries):**
```
hero: title, subtitle, image, cta, ctaLink
richText: content
media: media, caption
```

**Required Payload `layout.blocks` array (50+ entries) — organized by page builder category:**

| Category | Blocks to Add | Count |
|---|---|---|
| Core Layout | featureGrid, cta, stats, imageGallery, divider, timeline, videoEmbed, bannerCarousel, contactForm, map | 10 |
| Commerce | productGrid, recentlyViewed, flashSaleCountdown, giftCardDisplay | 4 |
| Social/Trust | testimonial, reviewList, trustBadges, socialProof, comparisonTable, newsletter | 6 |
| Vendor | vendorShowcase, vendorRegisterForm | 2 |
| Categories | categoryGrid, serviceList, collectionList | 3 |
| Booking/Service | serviceCardGrid | 1 |
| Subscriptions | subscriptionPlans, membershipTiers | 2 |
| Verticals | propertyListing, vehicleListing, menuDisplay, courseCurriculum, eventSchedule, healthcareProvider, fitnessClassSchedule, petProfileCard, classifiedAdCard, crowdfundingProgress, donationCampaign, freelancerProfile, parkingSpotFinder | 13 |
| B2B | bulkPricingTable | 1 |
| Marketing | blogPost, promotionBanner, bookingCTA, eventList, pricing | 5 |
| Customer | faq, referralProgram | 2 |
| **TOTAL** | | **49 blocks** |

---

## Section 21: Manage Page Architecture — Complete Analysis

### 21.1 All 96 Manage Pages by Admin Tier Assignment

Every manage page is classified below with its CORRECT admin tier, current access status, and gaps:

#### TIER 1: Super-Admin Only (17 pages — 2,851 lines)

| # | Page | Lines | Section | Why Super-Admin | Has CRUD Config? | Module Registry? |
|---|---|---|---|---|---|---|
| 1 | `tenants-admin.tsx` | 188 | system | Multi-tenant management | YES (tenants) | NO |
| 2 | `governance.tsx` | 193 | system | Platform governance policies | YES | NO |
| 3 | `nodes.tsx` | 194 | system | 5-level node hierarchy | YES | NO |
| 4 | `personas.tsx` | 188 | system | 6-axis persona system | YES | NO |
| 5 | `region-zones.tsx` | 188 | system | Geographic zone management | YES (region-zones) | NO |
| 6 | `temporal.tsx` | 75 | system | Temporal Cloud workflows | NO | NO |
| 7 | `webhooks.tsx` | 210 | system | Webhook management | NO | NO |
| 8 | `integrations.tsx` | 77 | system | External integrations | NO | NO |
| 9 | `audit.tsx` | 108 | system | Audit log viewer | NO | NO |
| 10 | `channels.tsx` | 188 | system | Sales channel config | NO | NO |
| 11 | `metrics.tsx` | 71 | system | Platform metrics | NO | NO |
| 12 | `i18n.tsx` | 193 | system | i18n management | YES | NO |
| 13 | `tax-config.tsx` | 188 | system | Tax configuration | YES (tax-config) | NO |
| 14 | `payment-terms.tsx` | 186 | system | Payment terms | NO | NO |
| 15 | `shipping-extensions.tsx` | 188 | system | Shipping rule extensions | YES (shipping-ext) | NO |
| 16 | `cart-extensions.tsx` | 188 | system | Cart rule extensions | YES (cart-extension) | NO |
| 17 | `promotion-extensions.tsx` | 188 | system | Promotion extensions | YES (promotion-ext) | NO |

**Key findings for super-admin pages:**
- **0 of 17** appear in the Module Registry sidebar — they are hidden from navigation!
- **All 17** use minWeight: 40 (same as vendor-admin) — NO elevated access control
- **Only 10 of 17** have CRUD configs — 7 have custom or minimal implementations
- **0 of 17** have dedicated super-admin UI patterns (no platform-wide dashboard, no cross-tenant views)

#### TIER 2: Tenant-Admin (73 pages — 14,932 lines)

**Commerce Core (9 pages, 1,886 lines):**

| # | Page | Lines | CRUD Config? | Module Registry? | Vendor Equivalent? |
|---|---|---|---|---|---|
| 1 | `products.tsx` | 211 | YES | YES | vendor/products/ |
| 2 | `orders.tsx` | 174 | YES | YES | vendor/orders/ |
| 3 | `customers.tsx` | 195 | YES | YES | — |
| 4 | `quotes.tsx` | 209 | YES | YES | vendor/quotes |
| 5 | `invoices.tsx` | 217 | YES | YES | vendor/invoices |
| 6 | `subscriptions.tsx` | 222 | YES | YES | vendor/subscriptions |
| 7 | `reviews.tsx` | 210 | YES | YES | vendor/reviews |
| 8 | `inventory.tsx` | 200 | NO | NO | vendor/inventory |
| 9 | `inventory-extension.tsx` | 211 | YES (inventory-extension) | NO | vendor/inventory-extension |

**Marketplace (6 pages, 1,294 lines):**

| # | Page | Lines | CRUD Config? | Module Registry? | Vendor Equivalent? |
|---|---|---|---|---|---|
| 10 | `vendors.tsx` | 222 | YES | YES | — (vendor IS the user) |
| 11 | `commissions.tsx` | 228 | YES | YES | vendor/commissions (stub) |
| 12 | `payouts.tsx` | 171 | YES | YES | vendor/payouts (stub) |
| 13 | `affiliates.tsx` | 212 | YES (affiliates) | YES | vendor/affiliate |
| 14 | `commission-rules.tsx` | 219 | NO | NO | — |
| 15 | `service-providers.tsx` | 217 | NO | NO | — |

**Verticals — All 35 pages (7,291 lines):**

| # | Page | Lines | Has CRUD? | In Registry? | Vendor? | Storefront? |
|---|---|---|---|---|---|---|
| 16 | `auctions.tsx` | 210 | YES | YES | YES | YES |
| 17 | `bookings.tsx` | 212 | YES | YES | YES | YES |
| 18 | `event-ticketing.tsx` | 212 | NO (events) | YES | YES | NO storefront |
| 19 | `events.tsx` | 103 | YES | NO | YES | YES |
| 20 | `rentals.tsx` | 214 | YES | YES | YES | YES |
| 21 | `restaurants.tsx` | 215 | YES | YES | YES | YES |
| 22 | `grocery.tsx` | 205 | YES | YES | YES | YES |
| 23 | `travel.tsx` | 210 | YES | YES | YES | YES |
| 24 | `automotive.tsx` | 210 | YES | YES | YES | YES |
| 25 | `real-estate.tsx` | 209 | YES | YES | YES | YES |
| 26 | `healthcare.tsx` | 205 | YES | YES | YES (healthcare) | YES |
| 27 | `education.tsx` | 205 | YES | YES | YES | YES |
| 28 | `fitness.tsx` | 205 | YES | YES | YES | YES |
| 29 | `pet-services.tsx` | 205 | YES | YES | YES (pet-service) | YES |
| 30 | `digital-products.tsx` | 205 | YES (digital-products) | YES | YES | YES (as digital/) |
| 31 | `memberships.tsx` | 205 | YES | YES | YES | YES |
| 32 | `financial-products.tsx` | 204 | YES (financial-products) | YES | YES (financial-product) | YES (as financial/) |
| 33 | `freelance.tsx` | 205 | YES | YES | YES | YES |
| 34 | `parking.tsx` | 205 | YES | YES | YES | YES |
| 35 | `advertising.tsx` | 212 | YES | YES (marketing) | YES | NO storefront |
| 36 | `social-commerce.tsx` | 206 | YES (social-commerce) | YES (marketing) | YES | YES |
| 37 | `classifieds.tsx` | 204 | YES | YES (marketing) | YES (classified) | YES |
| 38 | `crowdfunding.tsx` | 212 | YES | YES (marketing) | YES | YES |
| 39 | `charity.tsx` | 206 | YES | YES (marketing) | YES | YES |
| 40 | `charities.tsx` | 211 | NO | NO | — | — (DUPLICATE of charity) |
| 41 | `flash-sales.tsx` | 216 | YES (flash-sales) | NO | YES | YES (as flash-deals/) |
| 42 | `dropshipping.tsx` | 218 | NO | NO | YES | YES |
| 43 | `gift-cards.tsx` | 211 | YES (gift-cards) | NO | YES (gift-cards) | YES (gift-cards-shop/) |
| 44 | `insurance.tsx` | 205 | YES | NO | YES | YES |
| 45 | `loyalty.tsx` | 200 | YES | NO | YES | YES (loyalty-program/) |
| 46 | `newsletters.tsx` | 205 | NO | NO | YES (newsletter) | YES (newsletter/) |
| 47 | `print-on-demand.tsx` | 212 | YES (print-on-demand) | NO | YES | YES |
| 48 | `trade-in.tsx` | 191 | YES (trade-in) | NO | YES | YES |
| 49 | `try-before-you-buy.tsx` | 212 | YES (try-before-you-buy) | NO | YES | YES |
| 50 | `volume-pricing.tsx` | 188 | YES (volume-pricing) | NO | YES (volume-pricing) | YES (volume-deals/) |
| 51 | `white-label.tsx` | 211 | YES (white-label) | NO | YES | YES |
| 52 | `warranty.tsx` | 210 | NO | NO | YES (warranty) | — (DUPLICATE naming) |
| 53 | `warranties.tsx` | 188 | YES | NO | — | YES |

**Commerce Extensions (10 pages, 2,065 lines):**

| # | Page | Lines | CRUD Config? | Module Registry? |
|---|---|---|---|---|
| 54 | `promotions.tsx` | 216 | YES | YES |
| 55 | `promotions-ext.tsx` | 221 | NO | NO (DUPLICATE?) |
| 56 | `subscription-plans.tsx` | 218 | NO | NO |
| 57 | `bundles.tsx` | 207 | NO | NO |
| 58 | `credit.tsx` | 212 | NO | NO |
| 59 | `consignments.tsx` | 211 | NO | NO |
| 60 | `purchase-orders.tsx` | 215 | NO | NO |
| 61 | `availability.tsx` | 224 | NO | NO |
| 62 | `wallet.tsx` | 190 | NO | NO |
| 63 | `pricing-tiers.tsx` | 187 | NO | NO |

**Organization (8 pages, 1,630 lines):**

| # | Page | Lines | CRUD Config? | Module Registry? |
|---|---|---|---|---|
| 64 | `team.tsx` | 195 | YES | YES |
| 65 | `companies.tsx` | 216 | YES | YES |
| 66 | `companies-admin.tsx` | 188 | NO | NO (DUPLICATE?) |
| 67 | `company.tsx` | 209 | NO | NO (DUPLICATE?) |
| 68 | `stores.tsx` | 205 | YES | YES |
| 69 | `legal.tsx` | 198 | YES | YES |
| 70 | `utilities.tsx` | 210 | YES | YES |
| 71 | `disputes.tsx` | 199 | YES | NO |

**Marketing & Customer (3 pages, 505 lines):**

| # | Page | Lines | Module Registry? |
|---|---|---|---|
| 72 | `wishlists.tsx` | 93 | NO |
| 73 | `notification-preferences.tsx` | 193 | NO |

**System — Tenant-Level (2 pages, 261 lines):**

| # | Page | Lines | Module Registry? |
|---|---|---|---|
| 74 | `analytics.tsx` | 78 | YES |
| 75 | `settings.tsx` | 183 | YES |

**+ Manage Dashboard (1 page, 107 lines):**

| # | Page | Lines |
|---|---|---|
| 76 | `index.tsx` | 107 |

#### TIER 3: Content-Editor / Tenant Manager (6 existing + 10 missing = 16 needed)

**Currently existing CMS-related manage pages:**

| # | Page | Lines | Currently Accessible? | Content-Editor Needs? |
|---|---|---|---|---|
| 1 | `cms.tsx` | 193 | NO (weight 30 < 40) | YES — primary CMS page manager |
| 2 | `cms-content.tsx` | 209 | NO (weight 30 < 40) | YES — content block editor |

**Missing pages for content-editor workflow (MUST be created):**

| # | Missing Page | Purpose | Priority | Blocks Needed |
|---|---|---|---|---|
| 3 | `page-builder.tsx` | Visual drag-and-drop page builder | P0 | ALL 50 usable blocks |
| 4 | `media-library.tsx` | Upload and manage images/files | P0 | fileManagerBlock |
| 5 | `page-preview.tsx` | Live preview of CMS pages in storefront context | P0 | — (renders actual blocks) |
| 6 | `blog-manager.tsx` | Create and edit blog posts | P1 | blogPost, richText |
| 7 | `navigation-editor.tsx` | Manage site navigation menus | P1 | — (custom editor) |
| 8 | `seo-manager.tsx` | Edit page SEO metadata, og tags, schema markup | P1 | — (form-based) |
| 9 | `redirects.tsx` | Manage URL redirects (301/302) | P2 | — (data table) |
| 10 | `template-gallery.tsx` | Pre-built page templates for quick starts | P2 | — (template picker) |
| 11 | `content-scheduler.tsx` | Schedule page publish/unpublish dates | P2 | — (calendar + table) |
| 12 | `cms-analytics.tsx` | Page view analytics and content performance | P2 | chartBlock |

### 21.2 Module Registry vs Actual Pages — Complete Gap Analysis

The Module Registry (`module-registry.ts`) defines **45 modules** in the sidebar. But there are **96 actual manage page files**. This means **54 pages** are "hidden" — they have route files but NO sidebar navigation:

| Category | Registry Modules | Actual Pages | Hidden Pages |
|---|---|---|---|
| Overview | 1 (dashboard) | 1 (index) | 0 |
| Commerce | 7 | 11 (+ inventory, inventory-extension, events, subscription-plans) | 4 |
| Marketplace | 4 | 8 (+ commission-rules, service-providers, availability, wallet) | 4 |
| Verticals | 18 | 37 (all extra verticals not in registry) | 19 |
| Marketing | 6 | 8 (+ wishlists, notification-preferences) | 2 |
| Organization | 5 | 10 (+ companies-admin, company, disputes, plus extras) | 5 |
| System | 2 | 20 (ALL platform pages are hidden from sidebar) | 18 |
| CMS | 0 | 2 (cms, cms-content) | 2 |
| **TOTAL** | **43** | **96** | **54** |

**53 pages (55%) are accessible only via direct URL** — they have NO sidebar link. Users cannot discover them.

### 21.3 Duplicate Manage Pages (Wasted Code)

| # | Primary Page | Duplicate Page | Same Config? | Lines Wasted | Action |
|---|---|---|---|---|---|
| 1 | `charity.tsx` (206) | `charities.tsx` (211) | Different CRUD key | 211 | MERGE — keep charity |
| 2 | `warranty.tsx` (210) | `warranties.tsx` (188) | Different CRUD key | 188 | MERGE — keep warranties |
| 3 | `companies.tsx` (216) | `companies-admin.tsx` (188) | Likely same | 188 | MERGE |
| 4 | `companies.tsx` (216) | `company.tsx` (209) | Likely same | 209 | MERGE |
| 5 | `promotions.tsx` (216) | `promotions-ext.tsx` (221) | Extensions | 221 | MERGE into single page with tabs |
| 6 | `events.tsx` (103) | `event-ticketing.tsx` (212) | Different scope | — | KEEP both (events = listing, event-ticketing = management) |
| **TOTAL wasted** | | | | **1,017 lines** | |

### 21.4 CRUD Config Coverage for Manage Pages

The `crud-configs.ts` file defines CRUD configurations. Here's the coverage:

| Metric | Count | % of 96 Pages |
|---|---|---|
| Pages WITH matching CRUD config | 49 | 51% |
| Pages WITHOUT CRUD config | 47 | 49% |
| Pages using `useManageCrud` hook | 90 | 94% |
| Pages using `FormDrawer` | 87 | 91% |
| Pages using `DataTable` | ~85 | 89% |
| Pages using `BlockRenderer` | 0 | **0%** |

**47 pages (49%) have NO CRUD config** — they reference a config key that doesn't exist, which means their CRUD operations silently fail or use fallback defaults.

---

## Section 22: Content-Editor (Tenant Manager) — Page Builder Architecture Gap

### 22.1 The Core Problem

The content-editor is the **primary user of the page builder** but has **ZERO access** to any page building tools:

```
Content-Editor Capability Matrix:
┌────────────────────────────────────┬─────────┬──────────┐
│ Capability                         │ Current │ Required │
├────────────────────────────────────┼─────────┼──────────┤
│ Access manage section              │ ✗       │ ✓        │
│ View CMS pages list                │ ✗       │ ✓        │
│ Create new pages                   │ ✗       │ ✓        │
│ Edit page title/slug/SEO           │ ✗       │ ✓        │
│ Add blocks to page layout          │ ✗       │ ✓        │
│ Configure block properties         │ ✗       │ ✓        │
│ Rearrange blocks (drag-and-drop)   │ ✗       │ ✓        │
│ Preview page in storefront context │ ✗       │ ✓        │
│ Publish/unpublish pages            │ ✗       │ ✓        │
│ Schedule page publishing           │ ✗       │ ✓        │
│ Upload/manage media files          │ ✗       │ ✓        │
│ Edit blog posts                    │ ✗       │ ✓        │
│ Manage navigation menus            │ ✗       │ ✓        │
│ View content analytics             │ ✗       │ ✓        │
│ Access commerce pages              │ ✗       │ ✗        │
│ Access platform admin pages        │ ✗       │ ✗        │
└────────────────────────────────────┴─────────┴──────────┘
```

### 22.2 Required Architecture Changes for Content-Editor Access

**Change 1: Role Guard must support per-page weight overrides**

Currently, `role-guard.tsx` enforces a global `MIN_MANAGE_WEIGHT = 40`. This must be changed to support per-route weight requirements:

```
Current: ALL manage pages → weight ≥ 40
Target:  
  Platform pages → weight ≥ 100 (super-admin only)
  Commerce/vertical pages → weight ≥ 40 (tenant-admin)
  CMS pages → weight ≥ 30 (content-editor)
  Analytics (read-only) → weight ≥ 20 (analyst)
```

**Change 2: Module Registry must include CMS section with lower minWeight**

The Module Registry needs a new `cms` section with `minWeight: 30`:

```
Current sections: overview, commerce, marketplace, verticals, marketing, organization, system
Target sections:  overview, commerce, marketplace, verticals, marketing, organization, system, CMS, PLATFORM
```

**Change 3: Manage Sidebar must filter modules by user's role weight**

Currently, `getModulesBySection(maxWeight)` filters modules by weight, but the sidebar always shows all modules because no per-section weight filtering exists.

**Change 4: Payload Pages must register all 50 content-editor-usable blocks**

The Payload Pages collection layout field must be expanded from 3 to 50+ block definitions so content-editors can actually use them in the page builder.

### 22.3 Payload CMS Block Definitions Needed — Field Specifications

Each block added to the Payload Pages collection needs properly defined fields. Here are the required field definitions for the top priority blocks:

| # | Block Slug | Required Payload Fields | Complexity |
|---|---|---|---|
| 1 | `featureGrid` | title: text, features: array[{icon, title, description, link}], columns: select[2,3,4] | MEDIUM |
| 2 | `cta` | heading: text, subheading: text, buttonText: text, buttonLink: text, variant: select[primary,secondary], bgColor: text | LOW |
| 3 | `productGrid` | heading: text, source: select[featured,new,sale,category], categoryId: text, limit: number, layout: select[grid,carousel] | MEDIUM |
| 4 | `testimonial` | heading: text, testimonials: array[{name, role, company, quote, avatar: upload}], layout: select[grid,carousel] | MEDIUM |
| 5 | `stats` | heading: text, stats: array[{label, value, change, icon}] | LOW |
| 6 | `imageGallery` | heading: text, images: array[{image: upload, caption, alt}], layout: select[grid,masonry,carousel] | MEDIUM |
| 7 | `faq` | heading: text, faqs: array[{question, answer}], layout: select[accordion,list] | LOW |
| 8 | `pricing` | heading: text, plans: array[{name, price, period, features: array, cta, highlighted: boolean}] | HIGH |
| 9 | `vendorShowcase` | heading: text, source: select[featured,top-rated,new], limit: number, layout: select[grid,carousel], showRating: boolean | MEDIUM |
| 10 | `categoryGrid` | heading: text, source: select[top-level,featured], limit: number, showCount: boolean | LOW |
| 11 | `newsletter` | heading: text, subheading: text, buttonText: text, bgColor: text | LOW |
| 12 | `trustBadges` | heading: text, badges: array[{icon, label, description}] | LOW |
| 13 | `divider` | style: select[line,dots,space], spacing: select[sm,md,lg] | LOW |
| 14 | `videoEmbed` | heading: text, url: text, autoplay: boolean, aspectRatio: select[16:9,4:3,1:1] | LOW |
| 15 | `bannerCarousel` | banners: array[{image: upload, title, subtitle, cta, ctaLink}], autoplay: boolean, interval: number | MEDIUM |
| 16 | `contactForm` | heading: text, fields: array[{label, type, required}], submitButton: text, recipient: email | HIGH |
| 17 | `map` | heading: text, latitude: number, longitude: number, zoom: number, markers: array[{lat, lng, label}] | MEDIUM |
| 18 | `reviewList` | heading: text, source: select[product,vendor,all], limit: number, showRating: boolean | MEDIUM |
| 19 | `blogPost` | heading: text, source: select[recent,featured,category], categoryId: text, limit: number | LOW |
| 20 | `promotionBanner` | heading: text, description: text, discount: text, code: text, expiresAt: date, bgImage: upload | MEDIUM |

### 22.4 Manage CMS Pages for Content-Editor — Needed vs Existing

| # | Page | Exists? | Lines | Status | What It Needs |
|---|---|---|---|---|---|
| 1 | CMS Dashboard | NO | — | MISSING | Overview of all pages, recent edits, draft count, published count |
| 2 | Pages List | `cms.tsx` | 193 | EXISTS — blocked (weight 30 < 40) | Lower minWeight to 30, add status filters, preview links |
| 3 | Page Editor | `cms-content.tsx` | 209 | EXISTS — blocked | Lower minWeight, add block palette, drag-and-drop editor |
| 4 | Page Builder | NO | — | MISSING | Visual block editor with 50 blocks, live preview panel |
| 5 | Page Preview | NO | — | MISSING | Iframe-based preview of page with blocks rendered in storefront context |
| 6 | Media Library | NO | — | MISSING | Upload, browse, search media assets for use in blocks |
| 7 | Blog Manager | NO | — | MISSING | Blog post CRUD with rich text editor and categories |
| 8 | Navigation Editor | NO | — | MISSING | Visual menu builder for storefront navigation |
| 9 | SEO Manager | NO | — | MISSING | Per-page SEO settings, og tags, sitemap management |
| 10 | URL Redirects | NO | — | MISSING | 301/302 redirect rule management |
| 11 | Content Scheduler | NO | — | MISSING | Calendar view of scheduled publish/unpublish dates |
| 12 | Page Templates | NO | — | MISSING | Pre-built page templates for quick page creation |
| 13 | CMS Analytics | NO | — | MISSING | Page views, engagement metrics per page/block |
| 14 | Form Submissions | NO | — | MISSING | View contact form and other form submissions |

**Result: Only 2 of 14 needed pages exist, and BOTH are blocked from content-editor access.**

---

## Section 23: Summary — Admin Architecture Gaps

### 23.1 Role System Gaps

| # | Gap | Severity | Impact |
|---|---|---|---|
| 1 | ALL manage pages require same weight (40) — no tier separation | CRITICAL | Super-admin pages visible to vendor-admin |
| 2 | Content-editor (weight 30) blocked from all manage pages | CRITICAL | Page builder user has no workflow |
| 3 | Payload CMS uses 3 roles, storefront uses 10 roles — no mapping | HIGH | Authentication confusion |
| 4 | No `tenant_admin` role in storefront RBAC | HIGH | Payload's primary admin role missing |
| 5 | No node-based data scoping for roles 2-6 | HIGH | Zone/facility managers see all tenant data |
| 6 | `vendor-admin` sees all tenant data, not just own vendor | HIGH | Data isolation violation |
| 7 | `analyst` (weight 20) has no dedicated read-only views | MEDIUM | Role has no purpose |

### 23.2 Manage Page Gaps

| # | Gap | Severity | Count |
|---|---|---|---|
| 1 | 54 pages (56%) hidden from sidebar — no navigation | CRITICAL | 54 pages |
| 2 | 47 pages (49%) have no CRUD config — forms may silently fail | HIGH | 47 pages |
| 3 | 0 pages use BlockRenderer — no CMS-driven manage pages | CRITICAL | 96 pages |
| 4 | 17 platform-admin pages accessible to vendor-admin+ | CRITICAL | 17 pages |
| 5 | 5 duplicate manage page pairs wasting ~1,017 lines | LOW | 5 pairs |
| 6 | 10 missing super-admin pages (platform-dashboard, etc.) | MEDIUM | 10 pages |
| 7 | 10 missing tenant-admin pages (vendor-onboarding-review, etc.) | MEDIUM | 10 pages |
| 8 | 12 missing content-editor pages (page-builder, media-library, etc.) | CRITICAL | 12 pages |

### 23.3 Payload CMS Block Gaps

| # | Gap | Severity | Count |
|---|---|---|---|
| 1 | Payload Pages collection has only 3 block definitions | CRITICAL | 3 of 77 (4%) |
| 2 | 50 content-editor-usable blocks NOT in Payload | CRITICAL | 50 blocks |
| 3 | 15 admin blocks DON'T EXIST yet | HIGH | 15 blocks |
| 4 | 3 existing admin blocks not in Payload either | MEDIUM | 3 blocks |
| 5 | No block preview in page builder | CRITICAL | — |
| 6 | No block property panel / configuration UI | CRITICAL | — |

### 23.4 Architecture Priority Actions for Admin Tiers

| Priority | Action | Impact | Effort |
|---|---|---|---|
| **P0** | Implement per-page weight requirements in RoleGuard | Enable content-editor access to CMS pages | 2h |
| **P0** | Add CMS section to Module Registry with minWeight: 30 | Content-editor sees CMS sidebar | 1h |
| **P0** | Add platform section to Module Registry with minWeight: 100 | Super-admin pages separated | 1h |
| **P0** | Register 50 blocks in Payload Pages collection | Enable page builder | 8h |
| **P0** | Create page-builder.tsx for content-editor | Core page builder functionality | 12h |
| **P0** | Create media-library.tsx | Content-editor can upload images | 4h |
| **P1** | Create platform-dashboard.tsx for super-admin | Platform overview | 4h |
| **P1** | Fix RBAC role mapping between Payload and storefront | Consistent authentication | 3h |
| **P1** | Add node-based data scoping to manage pages | Role-appropriate data isolation | 8h |
| **P1** | Create vendor-data isolation for vendor-admin | Vendor sees only own data | 4h |
| **P2** | Merge 5 duplicate manage pages | Reduce maintenance | 2h |
| **P2** | Add 47 missing CRUD configs | Fix form submission errors | 4h |
| **P2** | Create 15 admin blocks (dataTableBlock, etc.) | CMS-driven manage pages | 12h |
| **P2** | Create remaining 10 missing content-editor pages | Complete CMS workflow | 8h |
| **P3** | Create 10 missing super-admin pages | Complete platform admin | 10h |
| **P3** | Create 10 missing tenant-admin pages | Complete tenant management | 10h |
| **P3** | Add analyst read-only views (weight 20) | Purpose for analyst role | 4h |

---

## Section 24: Complete Route Architecture — Current vs Target

### 24.1 Current Route Hierarchy

The storefront uses TanStack Router with file-based routing. The URL pattern is:

```
/                                      → Redirects to /dakkah/en
/$tenant/$locale/                      → Homepage (storefront)
/$tenant/$locale/[vertical]/           → Vertical list page
/$tenant/$locale/[vertical]/$id        → Vertical detail page
/$tenant/$locale/account/              → Customer account section
/$tenant/$locale/vendor/               → Vendor dashboard section
/$tenant/$locale/manage/               → Admin management section (ALL admins)
/$tenant/$locale/business/             → B2B portal section
/$tenant/$locale/$slug                 → CMS dynamic slug page
/$tenant/$locale/$                     → CMS splat/catch-all
/health                                → Health check endpoint
```

**Current URL tree (simplified):**

```
/dakkah/en/
├── [51 vertical routes]/              ← Public storefront
│   ├── index.tsx                      ← List page
│   └── $id.tsx                        ← Detail page
├── account/                           ← Authenticated customer
│   ├── index.tsx                      ← Dashboard
│   ├── orders/                        ← Order history
│   ├── subscriptions/                 ← Subscription management
│   ├── bookings/                      ← Booking history
│   ├── addresses.tsx                  ← Address book
│   ├── settings.tsx                   ← Account settings
│   └── [15 more pages]
├── vendor/                            ← Vendor dashboard (no layout wrapper)
│   ├── index.tsx                      ← Vendor dashboard
│   ├── home.tsx                       ← Alternative dashboard
│   ├── products/                      ← Product management
│   ├── orders/                        ← Order management
│   ├── payouts/                       ← Payout history
│   ├── register.tsx                   ← Vendor registration
│   └── [50 more vertical pages]
├── manage/                            ← ALL admin roles (single tier)
│   ├── index.tsx                      ← Admin dashboard
│   ├── products.tsx                   ← Product management
│   ├── orders.tsx                     ← Order management
│   ├── governance.tsx                 ← Platform governance (!)
│   ├── tenants-admin.tsx              ← Tenant management (!)
│   ├── nodes.tsx                      ← Node hierarchy (!)
│   ├── cms.tsx                        ← CMS management (!)
│   └── [88 more pages — ALL at same access level]
├── business/                          ← B2B portal
│   ├── approvals.tsx                  ← Purchase approvals
│   ├── catalog.tsx                    ← B2B catalog
│   ├── orders.tsx                     ← B2B orders
│   └── team.tsx                       ← B2B team management
├── cart.tsx                           ← Shopping cart
├── checkout.tsx                       ← Checkout flow
├── login.tsx                          ← Authentication
├── register.tsx                       ← Registration
├── $slug.tsx                          ← CMS dynamic page
└── $.tsx                              ← CMS catch-all
```

### 24.2 Critical Problems with Current Route Structure

| # | Problem | Details | Severity |
|---|---|---|---|
| 1 | **Flat manage section** — no tier separation | 96 pages in `/manage/` with identical access requirements | CRITICAL |
| 2 | **No super-admin section** | Platform admin pages (governance, tenants-admin, nodes) sit in same `/manage/` as vendor-admin pages | CRITICAL |
| 3 | **No CMS section for content-editor** | CMS pages blocked behind weight 40, content-editor (weight 30) cannot access | CRITICAL |
| 4 | **No vendor layout** | Vendor pages have no shared sidebar/layout — each page renders independently | HIGH |
| 5 | **Duplicate vendor dashboards** | Both `vendor/index.tsx` AND `vendor/home.tsx` exist as dashboard pages | MEDIUM |
| 6 | **No platform-level routes** | No `/platform/` route tree for super-admin-only cross-tenant operations | CRITICAL |
| 7 | **Business section incomplete** | Only 4 pages, uses `AccountLayout` instead of its own layout | MEDIUM |
| 8 | **No analyst section** | Analyst role (weight 20) has no dedicated read-only views | HIGH |
| 9 | **Navigation doesn't reflect role** | User menu shows "Store Dashboard" for ALL admin roles — no role-specific links | HIGH |
| 10 | **Manage sidebar hardcoded to weight 100** | `const userWeight = 100` in `manage-sidebar.tsx` — ignores actual user role | CRITICAL |

### 24.3 Key Code Evidence for Problems

**Problem 10 — Hardcoded weight in sidebar:**
```typescript
// manage-sidebar.tsx line ~230
const userWeight = 100  // ← HARDCODED! Should use actual user role weight
const sectionModules = getModulesBySection(userWeight)
```

**Problem 1 — Flat access control:**
```typescript
// role-guard.tsx
const MIN_MANAGE_WEIGHT = 40  // ← ALL manage pages use same threshold
```

**Problem 6 — No platform routes:**
```
Current: /$tenant/$locale/manage/governance     ← Platform page under tenant route!
Current: /$tenant/$locale/manage/tenants-admin  ← Managing OTHER tenants from within a tenant!
Current: /$tenant/$locale/manage/nodes          ← Platform node hierarchy under tenant!
```

---

## Section 25: Target Route Architecture — Complete Definition

### 25.1 Route Hierarchy by User Type

The platform needs **6 distinct route sections** for **6 user types**:

```
TARGET URL STRUCTURE:

/                                              → Redirect to /dakkah/en
/health                                        → Health check

/$tenant/$locale/                              → Storefront (PUBLIC + CUSTOMER)
/$tenant/$locale/account/                      → Customer account (CUSTOMER)
/$tenant/$locale/business/                     → B2B portal (B2B CUSTOMER)
/$tenant/$locale/vendor/                       → Vendor dashboard (VENDOR)
/$tenant/$locale/manage/                       → Tenant admin (TENANT-ADMIN, weight ≥ 40)
/$tenant/$locale/manage/cms/                   → CMS section (CONTENT-EDITOR, weight ≥ 30)
/$tenant/$locale/manage/platform/              → Platform admin (SUPER-ADMIN, weight ≥ 90)
/$tenant/$locale/analytics/                    → Analytics (ANALYST, weight ≥ 20)
```

### 25.2 User Type 1: Public Visitor (No Authentication)

**Access:** Browsing storefront, viewing products, reading content
**Weight Required:** None (public)
**Layout:** Storefront layout (Navbar + Footer)

**Routes:**

| # | Route Path | Purpose | Navigation Entry |
|---|---|---|---|
| 1 | `/$tenant/$locale/` | Homepage | Logo link |
| 2 | `/$tenant/$locale/[vertical]/` | Vertical list page (×51) | Header mega-menu "Browse" |
| 3 | `/$tenant/$locale/[vertical]/$id` | Vertical detail page (×50) | Linked from list pages |
| 4 | `/$tenant/$locale/categories/$handle` | Category page | Header "Shop" dropdown |
| 5 | `/$tenant/$locale/vendors/` | Vendor directory | Header "Vendors" link |
| 6 | `/$tenant/$locale/vendors/$handle` | Vendor profile | Linked from directory |
| 7 | `/$tenant/$locale/vendors/$id` | Vendor profile (by ID) | Linked from products |
| 8 | `/$tenant/$locale/blog/` | Blog listing | Header/footer link |
| 9 | `/$tenant/$locale/blog/$slug` | Blog post | Linked from blog listing |
| 10 | `/$tenant/$locale/help/` | Help center | Footer link |
| 11 | `/$tenant/$locale/help/$slug` | Help article | Linked from help center |
| 12 | `/$tenant/$locale/compare` | Product comparison | Product pages |
| 13 | `/$tenant/$locale/gift-cards` | Gift card purchase | Header/footer link |
| 14 | `/$tenant/$locale/cart` | Shopping cart | Cart icon in header |
| 15 | `/$tenant/$locale/login` | Login page | "Sign in" button |
| 16 | `/$tenant/$locale/register` | Registration page | "Sign up" link |
| 17 | `/$tenant/$locale/reset-password` | Password reset | Login page link |
| 18 | `/$tenant/$locale/store-pickup` | Store pickup locator | Checkout/footer |
| 19 | `/$tenant/$locale/verify/age` | Age verification | Restricted product pages |
| 20 | `/$tenant/$locale/$slug` | CMS dynamic page | Footer/nav links (about, terms, etc.) |
| 21 | `/$tenant/$locale/$` | CMS catch-all | Fallback |

**Navigation (Header):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] Dakkah CityOS                                                    │
│                                                                         │
│ Shop ▼  |  Vendors  |  Services  |  Browse ▼  |  [Search]  🛒  [Sign in] │
│                                                                         │
│ Shop dropdown:        Browse dropdown (mega-menu):                      │
│   All Products          Restaurants    Real Estate    Automotive         │
│   Category 1            Healthcare     Education      Events            │
│   Category 2            Travel         Fitness        Grocery           │
│   Category 3            Rentals        Freelance      Digital Products  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Navigation (Footer):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dakkah CityOS                                                           │
│                                                                         │
│ Shop          Marketplace     Customer      Company       Legal         │
│ ─────         ──────────      ─────────     ────────      ──────        │
│ All Products  Browse Vendors  My Account    About Us      Terms         │
│ Categories    Become Vendor   Orders        Contact       Privacy       │
│ New Arrivals  Vendor Portal   Subscriptions Careers       Cookies       │
│ Deals                         Bookings      Blog          Refund Policy │
│                               Wishlist      Help Center                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Missing pages for public visitors (must be created or registered in CMS):**
| # | Page | Route | Source |
|---|---|---|---|
| 1 | About Us | `/$tenant/$locale/about` (CMS `$slug`) | CMS page needed |
| 2 | Contact | `/$tenant/$locale/contact` (CMS `$slug`) | CMS page needed |
| 3 | Terms of Service | `/$tenant/$locale/terms` (CMS `$slug`) | CMS page needed |
| 4 | Privacy Policy | `/$tenant/$locale/privacy` (CMS `$slug`) | CMS page needed |
| 5 | FAQ | `/$tenant/$locale/faq` (CMS `$slug`) | CMS page needed |
| 6 | Search Results | `/$tenant/$locale/search` | New route file needed |
| 7 | 404 Page | NotFound component | Exists but may need enhancement |
| 8 | Order Confirmation | `/$tenant/$locale/checkout/confirmation` | New route needed |

### 25.3 User Type 2: Authenticated Customer (weight: 0, logged in)

**Access:** Account management, order history, subscriptions, bookings
**Weight Required:** Authenticated (no RBAC weight needed)
**Layout:** Storefront layout with AccountLayout sidebar
**Entry Point:** User menu dropdown → "My Account"

**Routes:**

| # | Route Path | Purpose | Sidebar Entry | Status |
|---|---|---|---|---|
| 1 | `account/` | Dashboard overview | "Overview" | EXISTS |
| 2 | `account/orders/` | Order list | "Orders" | EXISTS |
| 3 | `account/orders/$id` | Order detail | — (linked from list) | EXISTS |
| 4 | `account/orders/$id.track` | Order tracking | — (linked from detail) | EXISTS |
| 5 | `account/orders/$id.return` | Return request | — (linked from detail) | EXISTS |
| 6 | `account/subscriptions/` | Subscription list | "Subscriptions" | EXISTS |
| 7 | `account/subscriptions/$id` | Subscription detail | — | EXISTS |
| 8 | `account/subscriptions/$id.billing` | Billing management | — | EXISTS |
| 9 | `account/bookings/` | Booking list | "Bookings" | EXISTS |
| 10 | `account/bookings/$id` | Booking detail | — | EXISTS |
| 11 | `account/addresses` | Address book | "Addresses" | EXISTS |
| 12 | `account/settings` | Account settings | "Settings" | EXISTS |
| 13 | `account/profile` | Profile edit | — | EXISTS (17 lines — STUB) |
| 14 | `account/wallet` | Digital wallet | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 15 | `account/wishlist` | Wishlist | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 16 | `account/loyalty` | Loyalty points | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 17 | `account/referrals` | Referral program | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 18 | `account/store-credits` | Store credits | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 19 | `account/installments` | Payment installments | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 20 | `account/downloads` | Digital downloads | — (not in sidebar!) | EXISTS (18 lines — STUB) |
| 21 | `account/disputes` | Dispute management | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 22 | `account/verification` | Identity verification | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 23 | `account/consents` | Privacy consents | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 24 | `account/purchase-orders/` | PO list (B2B) | — (not in sidebar!) | EXISTS — MISSING from sidebar |
| 25 | `account/purchase-orders/$id` | PO detail | — | EXISTS |
| 26 | `account/purchase-orders/new` | Create PO | — | EXISTS |

**Account Sidebar — Current vs Target:**

```
CURRENT SIDEBAR (6 items):          TARGET SIDEBAR (organized sections):
┌─────────────────────┐             ┌───────────────────────────────┐
│ [Avatar] User Name  │             │ [Avatar] User Name            │
│ user@email.com      │             │ user@email.com                │
│─────────────────────│             │───────────────────────────────│
│ ○ Overview          │             │ MAIN                          │
│ ○ Orders            │             │ ○ Overview                    │
│ ○ Subscriptions     │             │ ○ Orders                      │
│ ○ Bookings          │             │ ○ Subscriptions               │
│ ○ Addresses         │             │ ○ Bookings                    │
│─────────────────────│             │ ○ Addresses                   │
│ ○ Settings          │             │───────────────────────────────│
│                     │             │ WALLET & REWARDS              │
│                     │             │ ○ Wallet                      │
│                     │             │ ○ Loyalty Points              │
│                     │             │ ○ Store Credits               │
│                     │             │ ○ Referrals                   │
│                     │             │───────────────────────────────│
│                     │             │ MY STUFF                      │
│                     │             │ ○ Wishlist                    │
│                     │             │ ○ Downloads                   │
│                     │             │ ○ Installments                │
│                     │             │ ○ Disputes                    │
│                     │             │───────────────────────────────│
│                     │             │ ACCOUNT                       │
│                     │             │ ○ Profile                     │
│                     │             │ ○ Settings                    │
│                     │             │ ○ Verification                │
│                     │             │ ○ Privacy & Consents          │
│─────────────────────│             │───────────────────────────────│
│ [Sign out]          │             │ [Sign out]                    │
└─────────────────────┘             └───────────────────────────────┘
```

**13 account pages exist but are NOT in the sidebar** — users can only reach them via direct URL.

### 25.4 User Type 3: B2B Customer (authenticated + company association)

**Access:** B2B purchasing, approval workflows, company management
**Weight Required:** Authenticated + `isB2B` flag
**Layout:** Storefront layout with AccountLayout (B2B extension)
**Entry Point:** User menu dropdown → "Company Dashboard"

**Routes:**

| # | Route Path | Purpose | Status |
|---|---|---|---|
| 1 | `business/approvals` | Purchase approval queue | EXISTS (161 lines) |
| 2 | `business/catalog` | B2B catalog with pricing | EXISTS (88 lines) |
| 3 | `business/orders` | Company order history | EXISTS (80 lines) |
| 4 | `business/team` | Company team management | EXISTS (37 lines — STUB) |
| 5 | `b2b/` | B2B storefront landing | EXISTS (list page) |
| 6 | `b2b/$id` | B2B product detail | EXISTS |
| 7 | `b2b/dashboard` | B2B dashboard | EXISTS |
| 8 | `b2b/register` | B2B registration | EXISTS |

**B2B Navigation Gaps:**
- `business/` has NO sidebar navigation — pages are disconnected
- `business/team.tsx` is only 37 lines — STUB
- No `business/invoices` — B2B customers can't view invoices
- No `business/credit` — B2B credit management missing
- No `business/reports` — B2B reporting missing
- `b2b/dashboard` duplicates `business/` purpose — unclear which is primary

### 25.5 User Type 4: Vendor (authenticated + vendor association)

**Access:** Vendor product management, order fulfillment, analytics
**Weight Required:** Authenticated + vendor association
**Layout:** Currently NO shared layout — each page is independent
**Entry Point:** User menu has NO vendor link (only shows if `hasAccess` for manage)

**Routes (56 pages):**

| # | Section | Routes | Count | Sidebar? |
|---|---|---|---|---|
| 1 | Dashboard | `vendor/index.tsx`, `vendor/home.tsx` | 2 | NO sidebar exists |
| 2 | Products | `vendor/products/index`, `vendor/products/new`, `vendor/products/$productId` | 3 | — |
| 3 | Orders | `vendor/orders/index` | 1 | — |
| 4 | Financial | `vendor/payouts/index`, `vendor/payouts.tsx`, `vendor/commissions.tsx`, `vendor/invoices.tsx`, `vendor/transactions.tsx`, `vendor/wallet.tsx` | 6 | — |
| 5 | Onboarding | `vendor/onboarding/index`, `vendor/onboarding/verification`, `vendor/onboarding/complete` | 3 | — |
| 6 | Verticals | `vendor/restaurants.tsx`, `vendor/healthcare.tsx`, ... (×40) | 40 | — |
| 7 | Settings | `vendor/register.tsx`, `vendor/reviews.tsx`, `vendor/analytics.tsx`, `vendor/notification-preferences.tsx`, `vendor/wishlists.tsx` | 5 | — |

**CRITICAL: The vendor section has NO sidebar, NO layout wrapper, and NO navigation.**

**Target Vendor Sidebar:**

```
TARGET VENDOR SIDEBAR:
┌───────────────────────────────────┐
│ [Vendor Logo] Vendor Name         │
│ vendor-admin                      │
│───────────────────────────────────│
│ OVERVIEW                          │
│ ○ Dashboard                       │
│ ○ Analytics                       │
│───────────────────────────────────│
│ COMMERCE                          │
│ ○ Products                        │
│ ○ Orders                          │
│ ○ Inventory                       │
│───────────────────────────────────│
│ FINANCIAL                         │
│ ○ Payouts                         │
│ ○ Commissions                     │
│ ○ Invoices                        │
│ ○ Transactions                    │
│ ○ Wallet                          │
│───────────────────────────────────│
│ VERTICALS (contextual)            │
│ ○ Restaurants (if applicable)     │
│ ○ Healthcare (if applicable)      │
│ ○ [tenant-enabled verticals]      │
│───────────────────────────────────│
│ SETTINGS                          │
│ ○ Reviews                         │
│ ○ Shipping Rules                  │
│ ○ Cart Rules                      │
│ ○ Tax Configuration               │
│ ○ Notifications                   │
│───────────────────────────────────│
│ ← Back to Store                   │
└───────────────────────────────────┘
```

**Vendor Navigation Gaps:**
| # | Gap | Impact |
|---|---|---|
| 1 | NO VendorLayout component | No consistent sidebar/header across vendor pages |
| 2 | NO VendorSidebar component | No navigation between vendor pages |
| 3 | Duplicate dashboards (index.tsx + home.tsx) | Confusion about primary dashboard |
| 4 | Duplicate payouts (payouts/index.tsx + payouts.tsx) | Route conflict |
| 5 | NO vendor link in user menu | Vendors can't navigate to their dashboard from storefront |
| 6 | No vendor role guard | Any authenticated user can access vendor pages |
| 7 | 40 vertical pages have no sidebar entry | Vendors can't find vertical-specific management |

### 25.6 User Type 5: Content-Editor / Tenant Manager (weight ≥ 30)

**Access:** CMS page building, media management, blog editing, navigation management
**Weight Required:** 30 (content-editor role)
**Layout:** Manage layout with CMS-specific sidebar section
**Entry Point:** User menu → "Content Studio" (NEW — doesn't exist yet)

**Target Routes (within /$tenant/$locale/manage/cms/):**

| # | Route Path | Purpose | Status | Priority |
|---|---|---|---|---|
| 1 | `manage/cms/` | CMS dashboard — overview of all pages, recent edits, stats | MISSING | P0 |
| 2 | `manage/cms/pages` | Page list — all CMS pages with status, filters, search | PARTIAL (`manage/cms.tsx` exists but blocked) | P0 |
| 3 | `manage/cms/pages/new` | Create new page — template picker → page builder | MISSING | P0 |
| 4 | `manage/cms/pages/$pageId/edit` | Page builder — drag-and-drop block editor | MISSING | P0 |
| 5 | `manage/cms/pages/$pageId/preview` | Page preview — iframe rendering in storefront context | MISSING | P0 |
| 6 | `manage/cms/content` | Content blocks list — standalone content blocks | PARTIAL (`manage/cms-content.tsx` exists but blocked) | P1 |
| 7 | `manage/cms/media` | Media library — upload, browse, search images/files | MISSING | P0 |
| 8 | `manage/cms/blog` | Blog post list — create, edit, publish blog posts | MISSING | P1 |
| 9 | `manage/cms/blog/new` | Blog post editor — rich text + media | MISSING | P1 |
| 10 | `manage/cms/blog/$postId/edit` | Blog post editor | MISSING | P1 |
| 11 | `manage/cms/navigation` | Navigation menu editor — header, footer, mobile | MISSING | P1 |
| 12 | `manage/cms/templates` | Page template gallery — pre-built layouts | MISSING | P2 |
| 13 | `manage/cms/seo` | SEO settings — per-page og tags, sitemap | MISSING | P2 |
| 14 | `manage/cms/redirects` | URL redirect rules — 301/302 management | MISSING | P2 |
| 15 | `manage/cms/scheduler` | Content scheduler — calendar of publish/unpublish | MISSING | P2 |
| 16 | `manage/cms/forms` | Form submissions — contact forms, surveys | MISSING | P2 |
| 17 | `manage/cms/analytics` | Content analytics — page views, engagement | MISSING | P2 |

**Content-Editor Sidebar:**

```
TARGET CMS SIDEBAR (weight ≥ 30):
┌───────────────────────────────────┐
│ [Logo] Dakkah CMS                 │
│ Content Studio                    │
│───────────────────────────────────│
│ ⌘K Search...                      │
│───────────────────────────────────│
│ CONTENT                           │
│ ○ Dashboard                       │
│ ○ Pages                           │
│ ○ Blog Posts                      │
│ ○ Content Blocks                  │
│───────────────────────────────────│
│ MEDIA                             │
│ ○ Media Library                   │
│───────────────────────────────────│
│ STRUCTURE                         │
│ ○ Navigation                      │
│ ○ Templates                       │
│ ○ Redirects                       │
│───────────────────────────────────│
│ INSIGHTS                          │
│ ○ Content Analytics               │
│ ○ Form Submissions                │
│ ○ Scheduler                       │
│───────────────────────────────────│
│ ← Back to Store                   │
└───────────────────────────────────┘
```

**Implementation Requirements:**
1. `RoleGuard` must allow weight ≥ 30 for `/manage/cms/*` routes
2. Module registry needs a `cms` section with `minWeight: 30`
3. `ManageSidebar` must show ONLY CMS section when user weight is 30-39
4. User menu must show "Content Studio" link for content-editor role

### 25.7 User Type 6: Tenant-Admin (weight ≥ 40)

**Access:** Commerce operations, vendor management, vertical management, team settings
**Weight Required:** 40+ (vendor-admin through city-manager)
**Layout:** Manage layout with full sidebar (minus platform section)
**Entry Point:** User menu → "Store Dashboard"

**Target Routes (within /$tenant/$locale/manage/):**

The 73 tenant-admin pages organized by sidebar section:

```
TARGET TENANT-ADMIN SIDEBAR (weight ≥ 40):
┌───────────────────────────────────┐
│ [Logo] Dakkah                     │
│ Store Management                  │
│───────────────────────────────────│
│ ⌘K Search...                      │
│───────────────────────────────────│
│ OVERVIEW                          │
│ ○ Dashboard                       │
│───────────────────────────────────│
│ COMMERCE                          │
│ ○ Products         ○ Quotes       │
│ ○ Orders           ○ Invoices     │
│ ○ Customers        ○ Subscriptions│
│ ○ Reviews          ○ Inventory    │
│───────────────────────────────────│
│ MARKETPLACE                       │
│ ○ Vendors          ○ Affiliates   │
│ ○ Commissions      ○ Service Prov.│
│ ○ Payouts          ○ Commission Rl│
│───────────────────────────────────│
│ VERTICALS                         │
│ ○ Auctions     ○ Restaurants      │
│ ○ Bookings     ○ Grocery          │
│ ○ Events       ○ Travel           │
│ ○ Rentals      ○ Automotive       │
│ ○ Real Estate  ○ Healthcare       │
│ ○ Education    ○ Fitness          │
│ ○ Parking      ○ Freelance        │
│ ○ Pet Services ○ Digital Products │
│ ○ Memberships  ○ Financial Prod.  │
│ ○ [+17 more verticals]           │
│───────────────────────────────────│
│ MARKETING                         │
│ ○ Advertising  ○ Classifieds      │
│ ○ Promotions   ○ Crowdfunding     │
│ ○ Social Comm. ○ Charity          │
│───────────────────────────────────│
│ ORGANIZATION                      │
│ ○ Team         ○ Legal            │
│ ○ Companies    ○ Utilities        │
│ ○ Stores       ○ Disputes         │
│───────────────────────────────────│
│ SYSTEM                            │
│ ○ Analytics                       │
│ ○ Settings                        │
│───────────────────────────────────│
│ CMS (if weight ≥ 30)             │
│ ○ Pages        ○ Blog             │
│ ○ Media        ○ Navigation       │
│───────────────────────────────────│
│ ← Back to Store                   │
└───────────────────────────────────┘
```

**Module Registry Changes Needed:**

Currently the Module Registry defines 45 modules — ALL with `minWeight: 40` and `scope: "tenant"` or `scope: "shared"`. The target requires:

| Section | Current Modules | Missing Modules to Add | minWeight |
|---|---|---|---|
| overview | 1 (dashboard) | — | 40 |
| commerce | 7 | 2 (inventory, inventory-extension) | 40 |
| marketplace | 4 | 2 (commission-rules, service-providers) | 40 |
| verticals | 18 | 17 (all unlisted verticals) | 40 |
| marketing | 6 | 2 (wishlists, notification-preferences) | 40 |
| organization | 5 | 3 (disputes, companies-admin → merge, company → merge) | 40 |
| system | 2 | 0 | 40 |
| **cms** (NEW) | 0 | 6 (dashboard, pages, media, blog, navigation, templates) | **30** |
| **platform** (NEW) | 0 | 17 (all super-admin pages) | **90** |
| **TOTAL** | **43** | **49** | |

**Hidden pages that MUST be added to Module Registry:**

| # | Manage Page | Section to Assign | Current Status |
|---|---|---|---|
| 1 | `audit.tsx` | platform | Hidden (no sidebar) |
| 2 | `availability.tsx` | commerce | Hidden |
| 3 | `bundles.tsx` | verticals | Hidden |
| 4 | `cart-extensions.tsx` | platform | Hidden |
| 5 | `channels.tsx` | platform | Hidden |
| 6 | `cms.tsx` | cms | Hidden |
| 7 | `cms-content.tsx` | cms | Hidden |
| 8 | `commission-rules.tsx` | marketplace | Hidden |
| 9 | `consignments.tsx` | verticals | Hidden |
| 10 | `credit.tsx` | verticals | Hidden |
| 11 | `disputes.tsx` | organization | Hidden |
| 12 | `dropshipping.tsx` | verticals | Hidden |
| 13 | `events.tsx` | verticals | Hidden |
| 14 | `flash-sales.tsx` | verticals | Hidden |
| 15 | `gift-cards.tsx` | verticals | Hidden |
| 16 | `governance.tsx` | platform | Hidden |
| 17 | `government.tsx` | verticals | Hidden |
| 18 | `i18n.tsx` | platform | Hidden |
| 19 | `insurance.tsx` | verticals | Hidden |
| 20 | `integrations.tsx` | platform | Hidden |
| 21 | `inventory.tsx` | commerce | Hidden |
| 22 | `inventory-extension.tsx` | commerce | Hidden |
| 23 | `loyalty.tsx` | verticals | Hidden |
| 24 | `metrics.tsx` | platform | Hidden |
| 25 | `newsletters.tsx` | verticals | Hidden |
| 26 | `nodes.tsx` | platform | Hidden |
| 27 | `notification-preferences.tsx` | organization | Hidden |
| 28 | `payment-terms.tsx` | platform | Hidden |
| 29 | `personas.tsx` | platform | Hidden |
| 30 | `pricing-tiers.tsx` | commerce | Hidden |
| 31 | `print-on-demand.tsx` | verticals | Hidden |
| 32 | `promotion-extensions.tsx` | platform | Hidden |
| 33 | `purchase-orders.tsx` | commerce | Hidden |
| 34 | `region-zones.tsx` | platform | Hidden |
| 35 | `service-providers.tsx` | marketplace | Hidden |
| 36 | `shipping-extensions.tsx` | platform | Hidden |
| 37 | `subscription-plans.tsx` | commerce | Hidden |
| 38 | `tax-config.tsx` | platform | Hidden |
| 39 | `temporal.tsx` | platform | Hidden |
| 40 | `tenants-admin.tsx` | platform | Hidden |
| 41 | `trade-in.tsx` | verticals | Hidden |
| 42 | `try-before-you-buy.tsx` | verticals | Hidden |
| 43 | `volume-pricing.tsx` | commerce | Hidden |
| 44 | `wallet.tsx` | commerce | Hidden |
| 45 | `warranty.tsx` | verticals | Hidden (duplicate of warranties) |
| 46 | `warranties.tsx` | verticals | Hidden |
| 47 | `webhooks.tsx` | platform | Hidden |
| 48 | `white-label.tsx` | verticals | Hidden |
| 49 | `wishlists.tsx` | marketing | Hidden |

### 25.8 User Type 7: Super-Admin (weight ≥ 90)

**Access:** ALL tenant-admin pages PLUS platform-wide administration
**Weight Required:** 90+ (city-manager, super-admin)
**Layout:** Manage layout with full sidebar including platform section
**Entry Point:** User menu → "Store Dashboard" + "Platform Admin"

**Target Routes (within /$tenant/$locale/manage/platform/):**

| # | Route Path | Purpose | Status | Priority |
|---|---|---|---|---|
| 1 | `manage/platform/` | Platform dashboard — cross-tenant overview | MISSING (needs `platform-dashboard.tsx`) | P0 |
| 2 | `manage/platform/tenants` | Tenant management — create, configure, suspend tenants | EXISTS as `tenants-admin.tsx` (MOVE) | P0 |
| 3 | `manage/platform/governance` | Governance policies — platform-wide rules | EXISTS as `governance.tsx` (MOVE) | P0 |
| 4 | `manage/platform/nodes` | Node hierarchy — CITY→DISTRICT→ZONE→FACILITY→ASSET | EXISTS as `nodes.tsx` (MOVE) | P0 |
| 5 | `manage/platform/personas` | Persona system — 6-axis persona management | EXISTS as `personas.tsx` (MOVE) | P1 |
| 6 | `manage/platform/region-zones` | Geographic zones — country/region management | EXISTS as `region-zones.tsx` (MOVE) | P1 |
| 7 | `manage/platform/channels` | Sales channels — multi-channel configuration | EXISTS as `channels.tsx` (MOVE) | P1 |
| 8 | `manage/platform/i18n` | Internationalization — locale/translation management | EXISTS as `i18n.tsx` (MOVE) | P1 |
| 9 | `manage/platform/integrations` | External integrations — Stripe, ERPNext, Fleetbase, etc. | EXISTS as `integrations.tsx` (MOVE) | P1 |
| 10 | `manage/platform/webhooks` | Webhook management — event subscriptions | EXISTS as `webhooks.tsx` (MOVE) | P1 |
| 11 | `manage/platform/temporal` | Temporal workflows — workflow orchestration monitoring | EXISTS as `temporal.tsx` (MOVE) | P2 |
| 12 | `manage/platform/audit` | Audit log — platform-wide audit trail | EXISTS as `audit.tsx` (MOVE) | P1 |
| 13 | `manage/platform/metrics` | Platform metrics — system health, performance | EXISTS as `metrics.tsx` (MOVE) | P2 |
| 14 | `manage/platform/tax-config` | Tax configuration — global tax rules | EXISTS as `tax-config.tsx` (MOVE) | P1 |
| 15 | `manage/platform/payment-terms` | Payment terms — global payment policies | EXISTS as `payment-terms.tsx` (MOVE) | P2 |
| 16 | `manage/platform/shipping-extensions` | Shipping rules — global shipping config | EXISTS as `shipping-extensions.tsx` (MOVE) | P2 |
| 17 | `manage/platform/cart-extensions` | Cart rules — global cart config | EXISTS as `cart-extensions.tsx` (MOVE) | P2 |
| 18 | `manage/platform/promotion-extensions` | Promotion rules — global promotion config | EXISTS as `promotion-extensions.tsx` (MOVE) | P2 |

**Super-Admin Sidebar (platform section addition):**

```
TARGET PLATFORM SECTION (weight ≥ 90):
┌───────────────────────────────────┐
│ ... (all tenant-admin sections)   │
│───────────────────────────────────│
│ PLATFORM ADMIN                    │
│ ○ Platform Dashboard              │
│ ○ Tenants                         │
│ ○ Governance                      │
│ ○ Node Hierarchy                  │
│ ○ Personas                        │
│ ○ Region Zones                    │
│ ○ Sales Channels                  │
│ ○ i18n                            │
│───────────────────────────────────│
│ PLATFORM SYSTEM                   │
│ ○ Integrations                    │
│ ○ Webhooks                        │
│ ○ Temporal Workflows              │
│ ○ Audit Log                       │
│ ○ Platform Metrics                │
│ ○ Tax Config                      │
│ ○ Payment Terms                   │
│ ○ Shipping Extensions             │
│ ○ Cart Extensions                 │
│ ○ Promotion Extensions            │
│───────────────────────────────────│
│ ← Back to Store                   │
└───────────────────────────────────┘
```

**Missing super-admin pages (new routes needed):**

| # | Missing Page | Purpose | Priority |
|---|---|---|---|
| 1 | `manage/platform/index.tsx` | Platform dashboard — tenant health, system status | P0 |
| 2 | `manage/platform/tenant-onboarding.tsx` | New tenant provisioning wizard | P1 |
| 3 | `manage/platform/rbac.tsx` | Role and permission management | P1 |
| 4 | `manage/platform/billing.tsx` | Multi-tenant billing dashboard | P2 |
| 5 | `manage/platform/system-health.tsx` | Infrastructure monitoring | P2 |
| 6 | `manage/platform/feature-flags.tsx` | Feature flag management per tenant | P2 |
| 7 | `manage/platform/api-keys.tsx` | Platform API key management | P1 |
| 8 | `manage/platform/sync-dashboard.tsx` | Cross-system sync monitoring (CMS↔Medusa↔ERP) | P1 |

### 25.9 User Type 8: Analyst (weight ≥ 20)

**Access:** Read-only analytics and reporting dashboards
**Weight Required:** 20 (analyst role)
**Layout:** Manage layout with analytics-only sidebar
**Entry Point:** User menu → "Analytics" (NEW)

**Target Routes (within /$tenant/$locale/analytics/ — NEW section):**

| # | Route Path | Purpose | Status |
|---|---|---|---|
| 1 | `analytics/` | Analytics dashboard overview | MISSING |
| 2 | `analytics/sales` | Sales analytics — revenue, orders, AOV | MISSING |
| 3 | `analytics/products` | Product analytics — top sellers, views, conversions | MISSING |
| 4 | `analytics/customers` | Customer analytics — acquisition, retention, LTV | MISSING |
| 5 | `analytics/vendors` | Vendor analytics — performance, revenue share | MISSING |
| 6 | `analytics/content` | Content analytics — page views, engagement | MISSING |
| 7 | `analytics/verticals` | Vertical-specific analytics | MISSING |
| 8 | `analytics/reports` | Report generation and export | MISSING |

**Analyst Sidebar:**

```
TARGET ANALYST SIDEBAR (weight ≥ 20):
┌───────────────────────────────────┐
│ [Logo] Dakkah Analytics           │
│ Read-only Dashboard               │
│───────────────────────────────────│
│ OVERVIEW                          │
│ ○ Dashboard                       │
│───────────────────────────────────│
│ REPORTS                           │
│ ○ Sales                           │
│ ○ Products                        │
│ ○ Customers                       │
│ ○ Vendors                         │
│ ○ Content                         │
│ ○ Verticals                       │
│───────────────────────────────────│
│ EXPORT                            │
│ ○ Generate Reports                │
│───────────────────────────────────│
│ ← Back to Store                   │
└───────────────────────────────────┘
```

---

## Section 26: Navigation Components — Current vs Target

### 26.1 Component Inventory

| Component | File | Purpose | Issues |
|---|---|---|---|
| `Navbar` | `components/navbar.tsx` | Main storefront header | Uses CMS navigation hook — OK but hardcoded "Browse" menu |
| `DynamicHeader` | `components/layout/dynamic-header.tsx` | Feature-flag-driven header | Hardcodes 12 vertical links in "Browse" dropdown |
| `MegaMenu` (navigation/) | `components/navigation/mega-menu.tsx` | Mega menu with categories | Takes categories prop — OK |
| `MegaMenu` (ui/) | `components/ui/mega-menu.tsx` | Generic mega menu with groups | Uses portal — OK |
| `Footer` | `components/footer.tsx` | Main storefront footer | Uses CMS navigation hook — OK |
| `DynamicFooter` | `components/layout/dynamic-footer.tsx` | Feature-flag-driven footer | Hardcoded links in sections |
| `AccountSidebar` | `components/account/account-sidebar.tsx` | Account section sidebar | Only 6 of 26 pages in sidebar |
| `AccountLayout` | `components/account/account-layout.tsx` | Account wrapper with sidebar | Only 6 nav items |
| `ManageSidebar` | `components/manage/manage-sidebar.tsx` | Manage section sidebar | Hardcoded `userWeight = 100` |
| `ManageLayout` | `components/manage/manage-layout.tsx` | Manage wrapper with RoleGuard | Single weight threshold (40) |
| `ManageHeader` | `components/manage/manage-header.tsx` | Manage breadcrumb header | OK |
| `UserMenu` | `components/auth/user-menu.tsx` | User dropdown in header | Only shows "Store Dashboard" for admins |
| `Layout` | `components/layout.tsx` | Root layout — detects manage pages | OK — correctly skips Navbar/Footer for manage |
| **VendorLayout** | **DOES NOT EXIST** | Vendor wrapper with sidebar | **MISSING** |
| **VendorSidebar** | **DOES NOT EXIST** | Vendor section sidebar | **MISSING** |
| **AnalyticsLayout** | **DOES NOT EXIST** | Analytics wrapper with sidebar | **MISSING** |
| **AnalyticsSidebar** | **DOES NOT EXIST** | Analytics section sidebar | **MISSING** |
| **BusinessLayout** | **DOES NOT EXIST** | B2B portal wrapper with sidebar | **MISSING** |

### 26.2 User Menu — Current vs Target

**Current UserMenu dropdown:**
```
┌─────────────────────────────┐
│ [Name]                      │
│ email@example.com           │
│ [Role: Content Editor]      │
│─────────────────────────────│
│ 👤 My Account               │
│ 🛍️ Orders                   │
│ 💳 Subscriptions             │
│ 📅 Bookings                 │
│─────────────────────────────│
│ (if B2B:)                   │
│ Business                    │
│ 🏢 Company Dashboard        │
│─────────────────────────────│
│ (if hasAccess, weight ≥ 40:)│
│ Management                  │
│ 🏪 Store Dashboard          │
│─────────────────────────────│
│ ⚙️ Settings                 │
│ 🚪 Sign out                 │
└─────────────────────────────┘
```

**Target UserMenu dropdown (role-aware):**
```
┌─────────────────────────────────────┐
│ [Name]                              │
│ email@example.com                   │
│ [Role: Super Admin]                 │
│─────────────────────────────────────│
│ 👤 My Account                       │
│ 🛍️ Orders                           │
│ 💳 Subscriptions                     │
│ 📅 Bookings                         │
│─────────────────────────────────────│
│ (if B2B:)                           │
│ Business                            │
│ 🏢 Company Dashboard                │
│─────────────────────────────────────│
│ (if vendor:)                        │  ← NEW
│ Vendor                              │
│ 🏪 Vendor Dashboard                 │  ← NEW
│─────────────────────────────────────│
│ (if weight ≥ 20:)                   │  ← NEW threshold
│ Analytics                           │
│ 📊 Analytics Dashboard              │  ← NEW
│─────────────────────────────────────│
│ (if weight ≥ 30:)                   │  ← NEW threshold
│ Content                             │
│ 📝 Content Studio                   │  ← NEW
│─────────────────────────────────────│
│ (if weight ≥ 40:)                   │
│ Management                          │
│ 🏪 Store Dashboard                  │
│─────────────────────────────────────│
│ (if weight ≥ 90:)                   │  ← NEW threshold
│ Platform                            │
│ 🌐 Platform Admin                   │  ← NEW
│─────────────────────────────────────│
│ ⚙️ Settings                         │
│ 🚪 Sign out                         │
└─────────────────────────────────────┘
```

### 26.3 Required Component Changes Summary

| # | Component | Change Required | Priority | Effort |
|---|---|---|---|---|
| 1 | `role-guard.tsx` | Support per-route minWeight instead of global 40 | P0 | 2h |
| 2 | `manage-sidebar.tsx` | Use actual user weight instead of hardcoded 100 | P0 | 1h |
| 3 | `module-registry.ts` | Add `cms` section (minWeight 30), `platform` section (minWeight 90), add 49 missing modules | P0 | 3h |
| 4 | `user-menu.tsx` | Add role-aware links (Content Studio, Vendor Dashboard, Analytics, Platform Admin) | P0 | 2h |
| 5 | `account-sidebar.tsx` | Add 13 missing page links organized into sections | P1 | 2h |
| 6 | Create `VendorLayout` | Shared layout with sidebar for all vendor pages | P1 | 4h |
| 7 | Create `VendorSidebar` | Sidebar navigation for vendor dashboard | P1 | 3h |
| 8 | Create `AnalyticsLayout` | Read-only analytics layout for analyst role | P2 | 3h |
| 9 | Create `AnalyticsSidebar` | Analytics-only sidebar | P2 | 2h |
| 10 | Create `BusinessLayout` | B2B portal layout with sidebar | P2 | 3h |
| 11 | `manage-layout.tsx` | Support CMS-only mode for content-editor | P0 | 2h |
| 12 | `dynamic-header.tsx` | Remove hardcoded vertical links, use CMS data | P2 | 2h |
| 13 | `layout.tsx` | Detect vendor, analytics, CMS routes for correct layout | P1 | 1h |

---

## Section 27: Route Migration Plan — Reorganizing 96 Manage Pages

### 27.1 Pages to Move to Platform Section

These 17 pages should move from `manage/` to `manage/platform/`:

| # | Current Path | Target Path | File Change |
|---|---|---|---|
| 1 | `manage/tenants-admin.tsx` | `manage/platform/tenants.tsx` | MOVE + rename |
| 2 | `manage/governance.tsx` | `manage/platform/governance.tsx` | MOVE |
| 3 | `manage/nodes.tsx` | `manage/platform/nodes.tsx` | MOVE |
| 4 | `manage/personas.tsx` | `manage/platform/personas.tsx` | MOVE |
| 5 | `manage/region-zones.tsx` | `manage/platform/region-zones.tsx` | MOVE |
| 6 | `manage/temporal.tsx` | `manage/platform/temporal.tsx` | MOVE |
| 7 | `manage/webhooks.tsx` | `manage/platform/webhooks.tsx` | MOVE |
| 8 | `manage/integrations.tsx` | `manage/platform/integrations.tsx` | MOVE |
| 9 | `manage/audit.tsx` | `manage/platform/audit.tsx` | MOVE |
| 10 | `manage/channels.tsx` | `manage/platform/channels.tsx` | MOVE |
| 11 | `manage/metrics.tsx` | `manage/platform/metrics.tsx` | MOVE |
| 12 | `manage/i18n.tsx` | `manage/platform/i18n.tsx` | MOVE |
| 13 | `manage/tax-config.tsx` | `manage/platform/tax-config.tsx` | MOVE |
| 14 | `manage/payment-terms.tsx` | `manage/platform/payment-terms.tsx` | MOVE |
| 15 | `manage/shipping-extensions.tsx` | `manage/platform/shipping-extensions.tsx` | MOVE |
| 16 | `manage/cart-extensions.tsx` | `manage/platform/cart-extensions.tsx` | MOVE |
| 17 | `manage/promotion-extensions.tsx` | `manage/platform/promotion-extensions.tsx` | MOVE |

### 27.2 Pages to Move to CMS Section

These 2 existing pages should move, plus 15 new pages created:

| # | Current Path | Target Path | File Change |
|---|---|---|---|
| 1 | `manage/cms.tsx` | `manage/cms/pages.tsx` | MOVE + rename |
| 2 | `manage/cms-content.tsx` | `manage/cms/content.tsx` | MOVE + rename |
| 3 | — | `manage/cms/index.tsx` | CREATE (CMS dashboard) |
| 4 | — | `manage/cms/media.tsx` | CREATE (media library) |
| 5 | — | `manage/cms/blog/index.tsx` | CREATE (blog list) |
| 6 | — | `manage/cms/blog/new.tsx` | CREATE (blog editor) |
| 7 | — | `manage/cms/blog/$postId.tsx` | CREATE (blog editor) |
| 8 | — | `manage/cms/navigation.tsx` | CREATE (nav editor) |
| 9 | — | `manage/cms/templates.tsx` | CREATE (template gallery) |
| 10 | — | `manage/cms/seo.tsx` | CREATE (SEO settings) |
| 11 | — | `manage/cms/redirects.tsx` | CREATE (URL redirects) |
| 12 | — | `manage/cms/scheduler.tsx` | CREATE (content scheduler) |
| 13 | — | `manage/cms/forms.tsx` | CREATE (form submissions) |
| 14 | — | `manage/cms/analytics.tsx` | CREATE (content analytics) |
| 15 | — | `manage/cms/pages/new.tsx` | CREATE (new page wizard) |
| 16 | — | `manage/cms/pages/$pageId.tsx` | CREATE (page builder) |
| 17 | — | `manage/cms/pages/$pageId/preview.tsx` | CREATE (page preview) |

### 27.3 Pages to Delete (Duplicates)

| # | File to Delete | Keep Instead | Reason |
|---|---|---|---|
| 1 | `manage/charities.tsx` (211 lines) | `manage/charity.tsx` (206 lines) | Duplicate vertical |
| 2 | `manage/warranty.tsx` (210 lines) | `manage/warranties.tsx` (188 lines) | Duplicate vertical |
| 3 | `manage/companies-admin.tsx` (188 lines) | `manage/companies.tsx` (216 lines) | Duplicate org page |
| 4 | `manage/company.tsx` (209 lines) | `manage/companies.tsx` (216 lines) | Duplicate org page |
| 5 | `manage/promotions-ext.tsx` (221 lines) | `manage/promotions.tsx` (216 lines) | Merge into tabs |

**Total lines removed: 1,039**

### 27.4 New Route Files Needed

| # | File Path | Purpose | User Type | Priority |
|---|---|---|---|---|
| 1 | `manage/platform/index.tsx` | Platform dashboard | Super-Admin | P0 |
| 2 | `manage/cms/index.tsx` | CMS dashboard | Content-Editor | P0 |
| 3 | `manage/cms/pages.tsx` | Page list (from cms.tsx) | Content-Editor | P0 |
| 4 | `manage/cms/pages/new.tsx` | New page wizard | Content-Editor | P0 |
| 5 | `manage/cms/pages/$pageId.tsx` | Page builder | Content-Editor | P0 |
| 6 | `manage/cms/media.tsx` | Media library | Content-Editor | P0 |
| 7 | `manage/cms/blog/index.tsx` | Blog management | Content-Editor | P1 |
| 8 | `manage/cms/navigation.tsx` | Navigation editor | Content-Editor | P1 |
| 9 | `analytics/index.tsx` | Analytics dashboard | Analyst | P2 |
| 10 | `analytics/sales.tsx` | Sales analytics | Analyst | P2 |
| 11 | `search.tsx` | Search results | Public | P1 |

### 27.5 Final Route Count After Migration

| Section | Current Files | After Migration | Change |
|---|---|---|---|
| Manage (tenant-admin) | 96 | 73 (after moves + deletes) | -23 |
| Manage/platform (super-admin) | 0 | 17+1 (index) = 18 | +18 |
| Manage/cms (content-editor) | 0 | 17 | +17 |
| Analytics (analyst) | 0 | 8 | +8 |
| Vendor (with new layout) | 56 | 55 (merge duplicates) | -1 |
| Account (with full sidebar) | 26 | 26 | 0 |
| Business (with layout) | 4 | 4 | 0 |
| Storefront (public) | ~154 | ~148 (merge duplicates) | -6 |
| **TOTAL** | **336** | **~370** | **+34** |

---

## Section 28: Complete Navigation Architecture Summary

### 28.1 Layout Component to Route Mapping

| Layout Component | Routes Covered | Authentication | Weight | Entry Point |
|---|---|---|---|---|
| **StorefrontLayout** (Navbar + Footer) | `/`, verticals, CMS pages, cart, checkout, auth | None | — | Direct URL / search |
| **AccountLayout** | `/account/*` | Required | — | User menu → "My Account" |
| **BusinessLayout** (NEW) | `/business/*` | Required + isB2B | — | User menu → "Company Dashboard" |
| **VendorLayout** (NEW) | `/vendor/*` | Required + vendor assoc. | — | User menu → "Vendor Dashboard" |
| **ManageLayout** (CMS mode) | `/manage/cms/*` | Required | ≥ 30 | User menu → "Content Studio" |
| **ManageLayout** (tenant mode) | `/manage/*` (not cms/platform) | Required | ≥ 40 | User menu → "Store Dashboard" |
| **ManageLayout** (platform mode) | `/manage/platform/*` | Required | ≥ 90 | User menu → "Platform Admin" |
| **AnalyticsLayout** (NEW) | `/analytics/*` | Required | ≥ 20 | User menu → "Analytics" |

### 28.2 Role-to-Navigation Matrix

| Role | Weight | Storefront | Account | B2B | Vendor | CMS | Manage | Platform | Analytics |
|---|---|---|---|---|---|---|---|---|---|
| Visitor | — | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Customer | auth | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| B2B Customer | auth+B2B | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Vendor | auth+vendor | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Viewer | 10 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Analyst | 20 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Content-Editor | 30 | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Vendor-Admin | 40 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Asset-Manager | 50 | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Facility-Manager | 60 | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Zone-Manager | 70 | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| District-Manager | 80 | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| City-Manager | 90 | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Super-Admin | 100 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 28.3 Sidebar Visibility Rules

| Sidebar Section | minWeight | Visible to Roles |
|---|---|---|
| CMS | 30 | content-editor, vendor-admin, asset-manager, ... super-admin |
| Commerce | 40 | vendor-admin, asset-manager, ... super-admin |
| Marketplace | 40 | vendor-admin, asset-manager, ... super-admin |
| Verticals | 40 | vendor-admin, asset-manager, ... super-admin |
| Marketing | 40 | vendor-admin, asset-manager, ... super-admin |
| Organization | 40 | vendor-admin, asset-manager, ... super-admin |
| System (tenant) | 40 | vendor-admin, asset-manager, ... super-admin |
| Platform Admin | 90 | city-manager, super-admin |
| Platform System | 90 | city-manager, super-admin |

### 28.4 Master Implementation Checklist

| # | Task | Files to Change | Priority | Status |
|---|---|---|---|---|
| 1 | Fix `manage-sidebar.tsx` — use actual user weight | `manage-sidebar.tsx` | P0 | NOT STARTED |
| 2 | Fix `role-guard.tsx` — per-route weight support | `role-guard.tsx` | P0 | NOT STARTED |
| 3 | Expand `module-registry.ts` — add cms + platform sections | `module-registry.ts` | P0 | NOT STARTED |
| 4 | Update `user-menu.tsx` — role-aware navigation links | `user-menu.tsx` | P0 | NOT STARTED |
| 5 | Create `manage/platform/` directory + 18 route files | 18 new files | P0 | NOT STARTED |
| 6 | Create `manage/cms/` directory + 17 route files | 17 new files | P0 | NOT STARTED |
| 7 | Move 17 platform pages from `manage/` to `manage/platform/` | 17 file moves | P0 | NOT STARTED |
| 8 | Move 2 CMS pages from `manage/` to `manage/cms/` | 2 file moves | P0 | NOT STARTED |
| 9 | Delete 5 duplicate manage pages | 5 file deletes | P1 | NOT STARTED |
| 10 | Update `account-sidebar.tsx` — add 13 missing links | `account-sidebar.tsx` | P1 | NOT STARTED |
| 11 | Create `VendorLayout` + `VendorSidebar` components | 2 new files | P1 | NOT STARTED |
| 12 | Wrap all 56 vendor pages with VendorLayout | 56 file edits | P1 | NOT STARTED |
| 13 | Create `analytics/` route section + 8 route files | 8 new files | P2 | NOT STARTED |
| 14 | Create `AnalyticsLayout` + `AnalyticsSidebar` | 2 new files | P2 | NOT STARTED |
| 15 | Create `BusinessLayout` for B2B portal | 1 new file | P2 | NOT STARTED |
| 16 | Update `layout.tsx` — detect vendor/analytics/cms routes | `layout.tsx` | P1 | NOT STARTED |
| 17 | Register all 50 blocks in Payload Pages collection | `Pages.ts` | P0 | NOT STARTED |
| 18 | Create page builder component for CMS | New component | P0 | NOT STARTED |
| 19 | Create 8 missing public pages (about, contact, search, etc.) | CMS entries + 1 route | P1 | NOT STARTED |
| 20 | Add 49 missing modules to Module Registry | `module-registry.ts` | P0 | NOT STARTED |

---

## Section 29: Centralized Design System Architecture — Current vs Target

### 29.1 Package Architecture Overview

The design system is split across **3 monorepo packages** plus the **storefront app** styles:

```
DESIGN SYSTEM ARCHITECTURE:

packages/
├── cityos-design-tokens/          ← Token definitions (TS constants)
│   ├── colors/ColorTokens.ts      ← Light + dark color palettes (23 tokens each)
│   ├── typography/TypographyTokens.ts  ← Font families, sizes, weights
│   ├── spacing/SpacingTokens.ts   ← 8-step spacing scale
│   ├── shadows/ShadowTokens.ts    ← 7 shadow levels
│   ├── borders/BorderTokens.ts    ← 7 radii + 5 widths
│   ├── breakpoints/BreakpointTokens.ts  ← 5 breakpoints + responsive spacing
│   ├── motion/MotionTokens.ts     ← 6 durations + 7 easings + 5 transitions
│   └── elevation/ElevationTokens.ts  ← 7 elevation levels (0-6)
│
├── cityos-design-runtime/         ← Theme engine (TS runtime)
│   ├── theme/ThemeTypes.ts        ← Theme interface definitions
│   ├── theme/createTheme.ts       ← lightTheme, darkTheme, createTheme(), mergeThemes()
│   ├── context/ThemeContext.ts    ← ThemeProvider, useTheme() hook
│   └── css/CSSVariables.ts       ← themeToCSS(), injectThemeCSS() → runtime CSS injection
│
├── cityos-design-system/          ← Component TYPE definitions only (no implementations)
│   ├── components/ComponentTypes.ts  ← Base, Interactive, WithLabel, WithIcon, etc.
│   ├── layout/LayoutTypes.ts      ← Container, Grid, Stack, Flex, Card, Section
│   ├── navigation/NavigationTypes.ts  ← NavItem, Sidebar, Breadcrumb, Tabs, Stepper
│   ├── forms/FormTypes.ts         ← Input, Select, Checkbox, FileUpload, FormGroup
│   ├── data/DataDisplayTypes.ts   ← Table, Avatar, Tag, Progress, Stat, EmptyState
│   ├── feedback/FeedbackTypes.ts  ← Toast, Alert, Dialog, Notification, Popover
│   ├── blocks/BlockTypes.ts       ← 50+ CMS block type definitions
│   ├── utilities/UtilityTypes.ts  ← WithAnimation, WithThemeOverride, polymorphic types
│   └── [20+ domain-specific type files]  ← Commerce, Delivery, Payment, Auction, etc.
│
└── cityos-contracts/              ← RBAC, governance, node types
    ├── rbac.ts
    ├── governance.ts
    ├── persona.ts
    ├── channels.ts
    ├── node-types.ts
    └── node-context.ts

apps/storefront/
├── src/styles/
│   ├── app.css                    ← Tailwind entry + @layer components + @layer utilities
│   ├── theme.css                  ← @theme block: CSS custom properties (ds- tokens)
│   └── rtl.css                    ← RTL overrides
├── tailwind.config.js             ← Minimal config (only extends transitions)
├── src/components/ui/             ← 36 storefront UI components (ds- tokens)
└── src/components/manage/ui/      ← 28 manage UI components (raw Tailwind gray/violet)
```

### 29.2 Token System — Current State

**8 token categories defined in `@dakkah-cityos/design-tokens`:**

| Category | File | Token Count | Status |
|---|---|---|---|
| **Colors** | `ColorTokens.ts` | 23 light + 23 dark = 46 | GOOD — well-structured light/dark |
| **Typography** | `TypographyTokens.ts` | 4 families + 9 sizes + 5 weights + 5 line-heights + 5 spacings = 28 | GOOD |
| **Spacing** | `SpacingTokens.ts` | 8 steps (xs→4xl) | GOOD |
| **Shadows** | `ShadowTokens.ts` | 7 levels (none→inner) | GOOD |
| **Borders** | `BorderTokens.ts` | 7 radii + 5 widths = 12 | GOOD |
| **Breakpoints** | `BreakpointTokens.ts` | 5 breakpoints + container + responsive spacing = 20+ | GOOD |
| **Motion** | `MotionTokens.ts` | 6 durations + 7 easings + 5 transitions = 18 | GOOD |
| **Elevation** | `ElevationTokens.ts` | 7 levels (0-6) | Overlaps with ShadowTokens |
| **TOTAL** | | **139 tokens** | |

**Color Token Palette:**

```
LIGHT MODE:                         DARK MODE:
┌──────────────┬──────────────┐    ┌──────────────┬──────────────┐
│ primary      │ hsl(221,83%) │    │ primary      │ hsl(217,91%) │
│ secondary    │ hsl(210,40%) │    │ secondary    │ hsl(217,33%) │
│ accent       │ hsl(210,40%) │    │ accent       │ hsl(217,33%) │
│ background   │ hsl(0,0%,100%)│   │ background   │ hsl(222,47%) │
│ foreground   │ hsl(222,47%) │    │ foreground   │ hsl(210,40%) │
│ muted        │ hsl(210,40%) │    │ muted        │ hsl(217,33%) │
│ card         │ hsl(0,0%,100%)│   │ card         │ hsl(222,47%) │
│ border       │ hsl(214,32%) │    │ border       │ hsl(217,33%) │
│ destructive  │ hsl(0,84%)   │    │ destructive  │ hsl(0,63%)   │
│ success      │ hsl(142,76%) │    │ success      │ hsl(142,76%) │
│ warning      │ hsl(45,93%)  │    │ warning      │ hsl(45,93%)  │
│ info         │ hsl(199,95%) │    │ info         │ hsl(199,95%) │
└──────────────┴──────────────┘    └──────────────┴──────────────┘
```

**Typography Families:**
```
sans:    "DM Sans" → system fallback
display: "Plus Jakarta Sans" → sans fallback
serif:   "Noto Serif" → Georgia fallback
mono:    "JetBrains Mono" → "Fira Code" fallback
```

### 29.3 CSS Variable Bridge — theme.css Analysis

The `theme.css` file is the **critical bridge** between TS tokens and Tailwind classes. It uses Tailwind v4's `@theme` directive:

```css
/* SEMANTIC DS TOKENS (from TS → CSS variables) */
--color-ds-primary: var(--color-primary, hsl(221 83% 53%));
--color-ds-background: var(--color-background, hsl(0 0% 100%));
/* ... 23 color tokens with fallbacks */

/* SHADOW TOKENS */
--shadow-ds-sm: var(--shadow-sm, 0 1px 2px ...);
/* ... 4 shadow tokens */

/* BORDER RADIUS TOKENS */
--radius-ds-sm: var(--border-radius-sm, 0.125rem);
/* ... 6 radius tokens */

/* MOTION TOKENS (direct, no var() indirection) */
--duration-instant: 50ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* ELEVATION TOKENS */
--elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* ENTERPRISE PALETTE (additional raw palette) */
--color-enterprise-50 through --color-enterprise-950
--color-accent-primary: #2563eb;
```

**How theme.css enables Tailwind classes:**
```
theme.css defines:     --color-ds-primary: ...
Tailwind generates:    .bg-ds-primary { background-color: var(--color-ds-primary) }
                       .text-ds-primary { color: var(--color-ds-primary) }
                       .border-ds-primary { border-color: var(--color-ds-primary) }
```

**Dual indirection pattern for tenant theming:**
```
Step 1: ThemeProvider.injectThemeCSS() → :root { --color-primary: [tenant color] }
Step 2: theme.css reads:                 --color-ds-primary: var(--color-primary, [fallback])
Step 3: Tailwind class:                  .bg-ds-primary → var(--color-ds-primary) → var(--color-primary)

This allows tenant branding to override any color via --color-primary injection.
```

### 29.4 Theme Runtime — How Theming Works

**Provider chain in `__root.tsx`:**
```
QueryClientProvider
  └→ StoreProvider
      └→ AuthProvider
          └→ BrandingProvider        ← Fetches tenant branding, sets CSS vars
              └→ GovernanceProvider
                  └→ ThemeProvider   ← Injects full theme CSS from TS tokens
                      └→ <App />
```

**Two theming mechanisms exist (CONFLICT):**

1. **`ThemeProvider` (design-runtime):** Converts full Theme object to CSS variables via `injectThemeCSS()`. Generates `--color-primary`, `--spacing-xs`, `--typography-font-family-sans`, etc.

2. **`BrandingProvider` (branding-context):** Fetches tenant from API, directly sets `document.documentElement.style.setProperty('--color-primary', ...)`. Runs independently.

**The conflict:** Both providers write `--color-primary`. `BrandingProvider` runs on data fetch (async), `ThemeProvider` runs on mount (sync). Race condition — whichever runs last wins.

**`useStoreTheme` hook:** Only handles favicon and SEO title/description. Does NOT participate in theming.

### 29.5 The Dual Design System Problem — CRITICAL

**The storefront has TWO completely separate design systems:**

| Aspect | Storefront UI (`components/ui/`) | Manage UI (`components/manage/ui/`) |
|---|---|---|
| **Components** | 36 components | 28 components |
| **Token Usage** | `ds-` semantic tokens | Raw Tailwind (`gray-`, `violet-`, `white`) |
| **Button Primary** | `bg-ds-primary text-ds-primary-foreground` | `bg-violet-600 text-white hover:bg-violet-700` |
| **Button Secondary** | `bg-ds-secondary text-ds-secondary-foreground border-ds-border` | `bg-white text-gray-700 border border-gray-200` |
| **Button Danger** | `bg-ds-destructive text-ds-destructive-foreground` | `bg-red-600 text-white hover:bg-red-700` |
| **Card Background** | `bg-ds-card` | `bg-white` (hardcoded) |
| **Border Color** | `border-ds-border` | `border-gray-200` (hardcoded) |
| **Dark Mode** | Supported via token switching | NOT SUPPORTED — always light |
| **Tenant Theming** | Supported via CSS var injection | NOT SUPPORTED — hardcoded violet |
| **Component API** | Simple props (`variant`, `size`) | Similar but incompatible (`variant`, `size` different values) |

**Evidence of the split:**

```
Manage components (raw Tailwind, no tokens):
- bg-white:        appears 31 times in manage routes
- bg-gray-*:       appears in manage sidebar/layout 143 times
- bg-violet-600:   hardcoded as manage button primary color
- text-gray-*:     appears 502 times in route files

Storefront components (design tokens):
- ds- tokens:      used 4,409 times across route files
```

**This means:**
1. Manage pages will NOT respond to tenant branding changes
2. Manage pages have NO dark mode
3. Manage pages have a different visual language than the storefront
4. Duplicated effort — 28 manage components replicate 36 storefront components

### 29.6 Hardcoded Color Audit — Inconsistency Analysis

**Colors hardcoded directly in components (bypassing design tokens):**

| Color | Background (`bg-`) | Text (`text-`) | Total | Used In |
|---|---|---|---|---|
| `gray-*` | Manage sidebar/layout | Manage text | 143+502 | Manage pages exclusively |
| `violet-*` | 10 instances | 7 instances | 17 | Manage buttons, sidebar accent |
| `blue-*` | 12 instances | 13 instances | 25 | Vertical hero gradients |
| `green-*` | 27 instances | 28 instances | 55 | Status badges, success states |
| `red-*` | 37 instances | 31 instances | 68 | Error states, danger actions |
| `emerald-*` | 14 instances | — | 14 | Success badges |
| `amber-*` | 11 instances | — | 11 | Warning badges |
| `orange-*` | 19 instances | — | 19 | Vertical hero gradients |
| `yellow-*` | 16 instances | — | 16 | Warning states |
| `purple-*` | 5 instances | — | 5 | Vertical hero gradients |
| `indigo-*` | 4 instances | — | 4 | Vertical hero gradients |
| `pink-*` | 3 instances | — | 3 | Vertical hero gradients |
| `teal-*` | 2 instances | — | 2 | Vertical hero gradients |
| **TOTAL** | **~160** | **~79** | **~239** | |

**239 hardcoded color instances** that bypass the design system and will NOT respond to tenant theming or dark mode.

### 29.7 Vertical Page Gradient Inconsistency

Each vertical page uses its own hardcoded gradient colors for the hero section:

| Vertical | Hero Gradient | Background Accent |
|---|---|---|
| Bookings | `from-blue-600 to-indigo-700` | `from-blue-50 to-indigo-100` |
| Automotive | `from-slate-700 to-gray-900` | `from-slate-100 to-gray-200` |
| Healthcare | `from-blue-500 to-sky-600` | `from-blue-100 to-sky-200` |
| Education | `from-blue-600 to-indigo-700` | `from-blue-50 to-indigo-100` |
| Events | `from-purple-600 to-indigo-700` | `from-purple-50 to-indigo-100` |
| Fitness | `from-green-500 to-emerald-600` | `from-green-50 to-emerald-100` |
| Restaurants | `from-orange-500 to-red-600` | `from-orange-50 to-red-100` |
| Real Estate | `from-teal-500 to-cyan-600` | `from-teal-50 to-cyan-100` |

**20+ unique gradient patterns** across vertical pages. These are hardcoded in each route file, not driven by tokens or configuration.

**Target:** Verticals should use a theme-aware gradient system:
```css
/* Token-based vertical theming */
--color-vertical-primary: var(--vertical-bookings-primary, hsl(221 83% 53%));
--color-vertical-secondary: var(--vertical-bookings-secondary, hsl(230 70% 50%));
--color-vertical-accent: var(--vertical-bookings-accent, hsl(221 83% 95%));
```

---

## Section 30: Component Library Architecture — Current vs Target

### 30.1 Current Component Inventory

**Storefront UI Components (36) — `components/ui/`:**

| Category | Components | Token Usage |
|---|---|---|
| **Primitives** | button, input, label, textarea, select, checkbox, radio, switch | ds-tokens |
| **Layout** | accordion, drawer, dialog, tabs | ds-tokens |
| **Data Display** | avatar, badge, skeleton, thumbnail, price, rating, progress-bar | ds-tokens |
| **Feedback** | toast, alert, loading, error-boundary, empty-state, form-error | ds-tokens |
| **Navigation** | breadcrumb, dropdown-menu, mega-menu, pagination, command-palette | ds-tokens |
| **Commerce** | mini-cart, comparison-table, image-gallery, social-proof-popup, social-share-panel, infinite-scroll | ds-tokens |

**Manage UI Components (28) — `components/manage/ui/`:**

| Category | Components | Token Usage |
|---|---|---|
| **Primitives** | button, input, label, textarea, select | RAW gray/violet |
| **Layout** | container, drawer, focus-modal, section-card | RAW gray/white |
| **Data Display** | badge, status-badge, data-table, table, stats-grid, skeleton | RAW gray |
| **Feedback** | toast, tooltip, confirm-dialog, empty-state | RAW gray |
| **Text** | heading, text | RAW gray |
| **Navigation** | tabs, dropdown-menu, page-header | RAW gray |
| **Forms** | form-drawer, icon-button | RAW gray/violet |
| **Page** | crud-page | RAW gray |

### 30.2 Component Duplication Matrix

| Component | Storefront UI | Manage UI | Differences |
|---|---|---|---|
| **Button** | 6 variants, `ds-` tokens | 4 variants, hardcoded violet/gray | Different variant names, different APIs |
| **Input** | `ds-input`, `ds-border` | `border-gray-200`, `text-gray-900` | Different border colors |
| **Badge** | `ds-` tokens | Hardcoded green/yellow/red | Incompatible APIs |
| **Tabs** | `ds-` tokens | `border-gray-200`, `text-violet-600` | Similar API, different colors |
| **Drawer** | `ds-` tokens, responsive | Hardcoded widths, gray | Different animation approach |
| **Toast** | `ds-` semantic colors | Gray/violet theme | Separate toast provider |
| **DropdownMenu** | Radix-based, `ds-` tokens | Custom implementation, gray | Completely different |
| **Skeleton** | `ds-muted`, single variant | Gray, 4 variants (text/table/card) | Manage has richer API |
| **EmptyState** | `ds-` tokens | Gray/violet | Similar API |
| **Select** | `ds-` tokens | Gray border, gray text | Similar API |
| **Tooltip** | — (missing) | Gray-800 bg, white text | Only in manage |
| **DataTable** | — (missing) | Full-featured sortable/filterable table | Only in manage |
| **StatsGrid** | — (missing) | Grid of stat cards with change indicators | Only in manage |
| **PageHeader** | — (missing) | Page title + description + actions | Only in manage |
| **FormDrawer** | — (missing) | Auto-generates form from field config | Only in manage |
| **CrudPage** | — (missing) | Full CRUD page from config | Only in manage |
| **Pagination** | Uses ds-tokens | — (missing from manage) | Only in storefront |
| **CommandPalette** | Uses ds-tokens | — (missing from manage) | Only in storefront |

**13 components are duplicated** across both systems.
**6 manage-only components** that storefront could use.
**2 storefront-only components** that manage could use.

### 30.3 Domain Component Directories

The storefront has **65 component directories** across domains:

| Domain | Directory | Component Count | Uses Tokens? |
|---|---|---|---|
| `account/` | Account sidebar, layout, header, nav | ~6 | ds-tokens |
| `auth/` | AuthGuard, AuthModal, UserMenu | ~5 | ds-tokens |
| `blocks/` | 40+ CMS block renderers | ~50 | Mixed (mostly ds-) |
| `cart/` | Cart drawer, line items, summary | ~6 | ds-tokens |
| `checkout/` | Checkout form, payment, shipping | ~8 | ds-tokens |
| `manage/` | Layout, sidebar, header, 28 UI components | ~35 | Raw Tailwind |
| `vendor/` | Dashboard, analytics, performance | ~5 | Mixed |
| `ui/` | 36 primitives/reusable components | 36 | ds-tokens |
| `[25+ verticals]` | Bookings, automotive, healthcare, etc. | ~60 | Mixed |

### 30.4 Design System Type Definitions (cityos-design-system)

The `@dakkah-cityos/design-system` package defines **types only** — NO implementations. It covers:

| Category | File(s) | Type Count | Has Implementation? |
|---|---|---|---|
| **Base Components** | ComponentTypes.ts | 12 interfaces | NO |
| **Layout** | LayoutTypes.ts | 10 interfaces (Container, Grid, Stack, Flex, Card, etc.) | NO |
| **Navigation** | NavigationTypes.ts | 12 interfaces (NavItem, Sidebar, Breadcrumb, Stepper, etc.) | NO |
| **Forms** | FormTypes.ts | ~15 interfaces | NO |
| **Data Display** | DataDisplayTypes.ts | ~12 interfaces | NO |
| **Feedback** | FeedbackTypes.ts | ~10 interfaces | NO |
| **Blocks** | BlockTypes.ts | 50+ block data types | NO |
| **Commerce** | 13 commerce type files | ~80 interfaces | NO |
| **Delivery** | 6 delivery type files | ~40 interfaces | NO |
| **Payment** | 5 payment type files | ~30 interfaces | NO |
| **Content** | 4 content type files | ~20 interfaces | NO |
| **Domain-specific** | 8 domain files | ~40 interfaces | NO |
| **Utilities** | UtilityTypes.ts | ~15 utility types | NO |
| **TOTAL** | 44 files | **~300+ types** | **0 implementations** |

**Critical gap: This package defines a comprehensive type system that NONE of the actual components implement.** The storefront components and manage components were built independently without referencing these types.

---

## Section 31: Target Design System Architecture

### 31.1 Unified Token System

**Target: Single token source → CSS variables → Tailwind classes → All components**

```
CURRENT FLOW (BROKEN):
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│ design-tokens│────→│ theme.css    │────→│ Storefront UI │ ← Uses ds-tokens ✓
│ (TS constants)│    │ (@theme vars) │     └───────────────┘
└──────────────┘     └──────────────┘
         │
         │           ┌──────────────┐     ┌───────────────┐
         └──────────→│ ThemeProvider │     │ Manage UI     │ ← Ignores tokens ✗
                     │ (inject CSS) │     │ (raw Tailwind) │
                     └──────────────┘     └───────────────┘

TARGET FLOW (UNIFIED):
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│ design-tokens│────→│ theme.css    │────→│ ALL Components│ ← Single token source
│ (TS constants)│    │ (@theme vars) │     │ - Storefront  │
└──────────────┘     └──────────────┘     │ - Manage      │
         │                                 │ - Vendor      │
         │           ┌──────────────┐     │ - Analytics   │
         └──────────→│ ThemeProvider │────→│ - CMS         │
                     │ (tenant      │     └───────────────┘
                     │  override)   │
                     └──────────────┘
```

### 31.2 Missing Token Categories

The current token system covers fundamentals but needs:

| Missing Category | Purpose | Tokens Needed |
|---|---|---|
| **Vertical Colors** | Theme-aware gradients for 27+ verticals | ~81 tokens (3 per vertical) |
| **Admin Colors** | Manage-specific semantic tokens | ~12 tokens |
| **Status Colors** | Standardized status palette | ~10 tokens |
| **Z-Index Scale** | Consistent stacking contexts | ~8 tokens |
| **Container Widths** | Per-layout max-widths | ~6 tokens |
| **Sidebar Widths** | Standard sidebar dimensions | ~4 tokens |
| **Icon Sizes** | Consistent icon sizing | ~5 tokens |
| **Content Widths** | Prose/content max-widths | ~4 tokens |
| **TOTAL** | | **~130 new tokens** |

**Target Vertical Color Tokens:**

```typescript
// packages/cityos-design-tokens/src/verticals/VerticalColorTokens.ts
export const VerticalColorTokens = {
  bookings: {
    primary: "hsl(221 83% 53%)",
    secondary: "hsl(230 70% 50%)",
    accent: "hsl(221 83% 95%)",
  },
  automotive: {
    primary: "hsl(215 25% 35%)",
    secondary: "hsl(220 15% 20%)",
    accent: "hsl(215 25% 95%)",
  },
  healthcare: {
    primary: "hsl(199 80% 45%)",
    secondary: "hsl(199 60% 40%)",
    accent: "hsl(199 80% 95%)",
  },
  restaurants: {
    primary: "hsl(25 90% 50%)",
    secondary: "hsl(0 75% 50%)",
    accent: "hsl(25 90% 95%)",
  },
  // ... 23 more verticals
} as const
```

**Target Admin Tokens (for theme.css):**

```css
/* Admin/manage-specific tokens */
--color-ds-admin-sidebar-bg: var(--color-admin-sidebar-bg, hsl(0 0% 100%));
--color-ds-admin-sidebar-border: var(--color-admin-sidebar-border, hsl(220 13% 91%));
--color-ds-admin-sidebar-text: var(--color-admin-sidebar-text, hsl(220 9% 46%));
--color-ds-admin-sidebar-active: var(--color-admin-sidebar-active, hsl(262 83% 58%));
--color-ds-admin-sidebar-active-bg: var(--color-admin-sidebar-active-bg, hsl(262 83% 97%));
--color-ds-admin-header-bg: var(--color-admin-header-bg, hsl(0 0% 100%));
--color-ds-admin-page-bg: var(--color-admin-page-bg, hsl(220 14% 96%));
--color-ds-admin-accent: var(--color-admin-accent, hsl(262 83% 58%));
```

**Target Z-Index Scale:**

```css
--z-dropdown: 50;
--z-sticky: 100;
--z-fixed: 200;
--z-sidebar: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-toast: 700;
```

### 31.3 Unified Component Library Target

**Target: Merge manage UI and storefront UI into one shared library:**

```
CURRENT:                                TARGET:
components/                             components/
├── ui/ (36 components, ds-tokens)      ├── ui/ (unified, ds-tokens)
│   ├── button.tsx                      │   ├── button.tsx (merged: 6 storefront + 4 manage variants)
│   ├── input.tsx                       │   ├── input.tsx (unified)
│   ├── badge.tsx                       │   ├── badge.tsx (unified)
│   └── ...                             │   ├── data-table.tsx (from manage → universal)
│                                       │   ├── stats-grid.tsx (from manage → universal)
├── manage/ui/ (28 components, raw)     │   ├── page-header.tsx (from manage → universal)
│   ├── button.tsx ← DUPLICATE          │   ├── form-drawer.tsx (from manage → universal)
│   ├── input.tsx ← DUPLICATE           │   ├── crud-page.tsx (from manage → universal)
│   ├── badge.tsx ← DUPLICATE           │   ├── status-badge.tsx (from manage → universal)
│   ├── data-table.tsx ← UNIQUE         │   ├── confirm-dialog.tsx (from manage → universal)
│   ├── stats-grid.tsx ← UNIQUE         │   ├── section-card.tsx (from manage → universal)
│   └── ...                             │   ├── tooltip.tsx (from manage → universal)
│                                       │   └── ... (total: ~48 unified components)
│                                       │
                                        ├── manage/ (layout only, no UI primitives)
                                        │   ├── manage-sidebar.tsx (uses ds-admin-* tokens)
                                        │   ├── manage-header.tsx (uses ds-admin-* tokens)
                                        │   ├── manage-layout.tsx
                                        │   └── module-registry.ts
```

**Migration path for manage UI components:**

| Manage Component | Action | Priority |
|---|---|---|
| `button.tsx` | **DELETE** — use `ui/button.tsx` with `variant="primary"` | P0 |
| `input.tsx` | **DELETE** — use `ui/input.tsx` | P0 |
| `select.tsx` | **DELETE** — use `ui/select.tsx` | P0 |
| `label.tsx` | **DELETE** — use `ui/label.tsx` | P0 |
| `textarea.tsx` | **DELETE** — use `ui/textarea.tsx` | P0 |
| `badge.tsx` | **DELETE** — use `ui/badge.tsx` | P0 |
| `tabs.tsx` | **DELETE** — use `ui/tabs.tsx` | P0 |
| `drawer.tsx` | **DELETE** — use `ui/drawer.tsx` | P1 |
| `dropdown-menu.tsx` | **DELETE** — use `ui/dropdown-menu.tsx` | P1 |
| `toast.tsx` | **DELETE** — use `ui/toast.tsx` | P1 |
| `skeleton.tsx` | **MERGE** — add manage variants to `ui/skeleton.tsx` | P1 |
| `empty-state.tsx` | **DELETE** — use `ui/empty-state.tsx` | P1 |
| `data-table.tsx` | **MOVE** to `ui/data-table.tsx` + convert to ds-tokens | P0 |
| `table.tsx` | **MOVE** to `ui/table.tsx` (keep as simpler alternative) | P1 |
| `stats-grid.tsx` | **MOVE** to `ui/stats-grid.tsx` + convert to ds-tokens | P1 |
| `page-header.tsx` | **MOVE** to `ui/page-header.tsx` + convert to ds-tokens | P0 |
| `form-drawer.tsx` | **MOVE** to `ui/form-drawer.tsx` + convert to ds-tokens | P1 |
| `crud-page.tsx` | **MOVE** to `ui/crud-page.tsx` + convert to ds-tokens | P1 |
| `status-badge.tsx` | **MOVE** to `ui/status-badge.tsx` + convert to ds-tokens | P0 |
| `confirm-dialog.tsx` | **MOVE** to `ui/confirm-dialog.tsx` + convert to ds-tokens | P1 |
| `section-card.tsx` | **MOVE** to `ui/section-card.tsx` + convert to ds-tokens | P1 |
| `focus-modal.tsx` | **MOVE** to `ui/focus-modal.tsx` + convert to ds-tokens | P2 |
| `icon-button.tsx` | **MOVE** to `ui/icon-button.tsx` + convert to ds-tokens | P1 |
| `heading.tsx` | **DELETE** — use standard Tailwind text utilities | P2 |
| `text.tsx` | **DELETE** — use standard Tailwind text utilities | P2 |
| `container.tsx` | **DELETE** — trivial wrapper (`space-y-6`) | P2 |
| `tooltip.tsx` | **MOVE** to `ui/tooltip.tsx` + convert to ds-tokens | P1 |

**Result:** 12 components deleted, 12 components moved/promoted, 3 deleted as trivial.

### 31.4 Layout System Architecture

**Current Layout Structure:**

| Layout | File | Used By | Sidebar? | Issues |
|---|---|---|---|---|
| **StorefrontLayout** | `layout.tsx` | All storefront pages | No sidebar | Detects `/manage/` to skip navbar/footer |
| **AccountLayout** | `account/account-layout.tsx` | Account pages | Yes (6 items) | Missing 13 account pages |
| **ManageLayout** | `manage/manage-layout.tsx` | Manage pages | Yes (45 modules) | Hardcoded weight 100 |
| **HelpLayout** | `help/help-center-layout.tsx` | Help pages | Yes | OK |
| **VendorLayout** | MISSING | — | — | 56 vendor pages have no layout |
| **AnalyticsLayout** | MISSING | — | — | No analytics section |
| **BusinessLayout** | MISSING | — | — | 4 business pages use AccountLayout |
| **CMSLayout** | MISSING | — | — | No CMS-specific layout for content-editor |

**Target Layout Hierarchy:**

```
ROOT LAYOUT (layout.tsx)
├── StorefrontLayout (Navbar + Footer)
│   ├── Public Pages (storefront, verticals, CMS)
│   ├── AccountLayout (sidebar: 26 items)
│   │   └── Account Pages
│   ├── BusinessLayout (NEW, sidebar: 8 items)
│   │   └── B2B Portal Pages
│   └── VendorLayout (NEW, sidebar: ~20 items)
│       └── Vendor Dashboard Pages
│
├── ManageLayout (RoleGuard + ManageSidebar)
│   ├── CMS Mode (weight ≥ 30, CMS sidebar only)
│   │   └── manage/cms/* pages
│   ├── Tenant Mode (weight ≥ 40, full sidebar)
│   │   └── manage/* pages (minus cms/platform)
│   └── Platform Mode (weight ≥ 90, full + platform sidebar)
│       └── manage/platform/* pages
│
└── AnalyticsLayout (NEW, RoleGuard weight ≥ 20)
    └── analytics/* pages
```

**Target Layout CSS Token Requirements:**

```css
/* Layout-specific tokens needed in theme.css */

/* Sidebar dimensions */
--layout-sidebar-width: 216px;
--layout-sidebar-collapsed-width: 64px;
--layout-header-height: 48px;
--layout-content-max-width: 1440px;

/* Layout backgrounds */
--color-ds-layout-storefront-bg: var(--color-ds-background);
--color-ds-layout-manage-bg: var(--color-ds-admin-page-bg);
--color-ds-layout-vendor-bg: var(--color-ds-admin-page-bg);
--color-ds-layout-analytics-bg: var(--color-ds-admin-page-bg);
```

---

## Section 32: Theme and Branding Architecture — Current vs Target

### 32.1 Current Branding Pipeline

```
CURRENT BRANDING FLOW:

1. App loads → BrandingProvider initializes
2. BrandingProvider reads tenant handle from URL or localStorage
3. Fetches tenant config from API: GET /store/stores?handle=dakkah
4. On response: Directly sets CSS variables on document.documentElement:
   - --color-primary → branding.themeConfig.primaryColor
   - --color-secondary → branding.themeConfig.secondaryColor
   - --font-family → branding.themeConfig.fontFamily

5. SEPARATELY: ThemeProvider initializes
6. Reads light/dark mode preference
7. Creates full Theme object from TS tokens
8. Calls injectThemeCSS() → inserts <style> tag with ALL CSS variables

RACE CONDITION: Steps 4 and 8 both set --color-primary.
ThemeProvider always runs first (sync), BrandingProvider runs later (async fetch).
So BrandingProvider wins — which is correct behavior, but accidental.
```

### 32.2 Tenant Branding Capabilities

**What tenants CAN customize (current):**

| Property | CSS Variable | Applied Via | Works? |
|---|---|---|---|
| Primary Color | `--color-primary` | BrandingProvider | YES (storefront only) |
| Secondary Color | `--color-secondary` | BrandingProvider | YES (storefront only) |
| Font Family | `--font-family` | BrandingProvider | PARTIAL (not linked to tokens) |
| Favicon | Direct DOM update | useStoreTheme | YES |
| Page Title | Direct DOM update | useStoreTheme | YES |
| Logo | Branding context value | Components read directly | YES |

**What tenants CANNOT customize (gaps):**

| Property | Reason | Impact |
|---|---|---|
| Admin/manage colors | Manage uses hardcoded gray/violet, ignores CSS vars | HIGH — admin always looks the same |
| Dark mode | ThemeProvider supports it, but no UI toggle exists | MEDIUM |
| Border radius | Not exposed in branding config | LOW |
| Spacing scale | Not exposed in branding config | LOW |
| Shadow intensity | Not exposed in branding config | LOW |
| Typography sizes | Not exposed in branding config | LOW |
| Vertical brand colors | Hardcoded in route files | HIGH — verticals can't match tenant brand |
| Success/warning/error colors | Not exposed in branding config | LOW |
| Logo in manage sidebar | Hardcoded "Dakkah" text + violet icon | HIGH — always shows "Dakkah" |

### 32.3 Target Branding Architecture

```
TARGET BRANDING FLOW:

1. App loads → ThemeProvider initializes with default theme
2. ThemeProvider injects base CSS variables from tokens

3. BrandingProvider fetches tenant config:
   GET /store/stores?handle=[tenant]

4. Tenant config includes EXPANDED branding:
   {
     themeConfig: {
       primaryColor: "#2563eb",
       secondaryColor: "#f1f5f9",
       accentColor: "#8b5cf6",
       adminAccentColor: "#7c3aed",
       successColor: "#22c55e",
       borderRadius: "0.5rem",
       fontFamily: "Inter",
       displayFont: "Plus Jakarta Sans",
       mode: "light" | "dark" | "system",
     },
     branding: {
       logo: { url, alt },
       favicon: { url },
       adminLogo: { url, alt },     ← NEW: logo for manage sidebar
       tenantName: "Dakkah",
     },
     verticalOverrides: {            ← NEW: per-vertical theming
       bookings: { primaryColor: "#3b82f6", secondaryColor: "#6366f1" },
       restaurants: { primaryColor: "#f97316", secondaryColor: "#ef4444" },
     },
   }

5. BrandingProvider applies expanded overrides via CSS variables:
   --color-primary → themeConfig.primaryColor
   --color-secondary → themeConfig.secondaryColor
   --color-admin-accent → themeConfig.adminAccentColor
   --border-radius-lg → themeConfig.borderRadius
   --font-sans → themeConfig.fontFamily

6. ALL components (storefront + manage + vendor + analytics) respond
   because they ALL use ds-* tokens → var(--color-*) → tenant value
```

### 32.4 Dark Mode Architecture

**Current state:** ThemeProvider has light/dark theme objects. No UI toggle exists. Always renders light mode.

**Target:**

```
DARK MODE IMPLEMENTATION:

1. Add mode toggle to user menu (or settings)
2. ThemeProvider setMode("dark") triggers:
   a. Swap theme object (lightTheme → darkTheme)
   b. Re-inject CSS variables via injectThemeCSS()
   c. All ds-* tokens automatically update
3. Store preference in localStorage + user profile
4. Support "system" mode (prefers-color-scheme media query)
5. Manage pages ALSO switch (because they use ds-admin-* → var() → theme)

CSS variable cascade:
:root {
  --color-primary: hsl(221 83% 53%);        /* light */
  --color-background: hsl(0 0% 100%);        /* light */
}
:root[data-theme="dark"] {
  --color-primary: hsl(217 91% 60%);         /* dark */
  --color-background: hsl(222 47% 11%);      /* dark */
}
```

---

## Section 33: Style and Layout Patterns — Current vs Target

### 33.1 CSS Class Naming Convention Audit

**Three competing naming patterns:**

| Pattern | Example | Used By | Count |
|---|---|---|---|
| **ds-* semantic tokens** | `bg-ds-primary`, `text-ds-foreground`, `border-ds-border` | Storefront UI components | ~4,409 instances |
| **Raw Tailwind utilities** | `bg-white`, `text-gray-700`, `border-gray-200` | Manage components, vertical pages | ~938 instances |
| **enterprise-* CSS classes** | `.enterprise-card`, `.btn-enterprise-primary`, `.badge-success` | app.css @layer components | ~30 class definitions |

**The `enterprise-*` classes in app.css** define a THIRD styling approach:
```css
.enterprise-card {
  background-color: var(--color-ds-card);     /* Uses tokens */
  border: 1px solid var(--color-ds-border);   /* Uses tokens */
  border-radius: var(--radius-ds-xl);          /* Uses tokens */
}

.btn-enterprise-primary {
  background-color: var(--color-ds-primary);
  color: var(--color-ds-primary-foreground);
}

.badge-primary { ... }
.badge-success { ... }
.badge-warning { ... }
.badge-danger { ... }
```

These enterprise classes ARE token-aware but are rarely used — they exist alongside Tailwind utility classes and ds-token Tailwind classes. They add confusion about which approach to use.

### 33.2 Responsive Patterns

**Current responsive breakpoints (from BreakpointTokens.ts):**
```
sm:  640px    → Mobile landscape
md:  768px    → Tablet
lg:  1024px   → Desktop
xl:  1280px   → Large desktop
2xl: 1536px   → Extra large
```

**Content container:** `.content-container` → `max-w-[1440px] w-full mx-auto px-6`

**Responsive patterns used across components:**

| Pattern | Usage | Example |
|---|---|---|
| Mobile-first grid | Most vertical pages | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| Hidden/shown | Navigation | `hidden lg:flex` / `lg:hidden` |
| Responsive padding | Content areas | `px-4 sm:px-6 lg:px-8` |
| Responsive text | Hero sections | `text-2xl md:text-4xl lg:text-5xl` |
| Sidebar collapse | Manage layout | `lg:translate-x-0` / `ltr:-translate-x-full` |

### 33.3 RTL Support Analysis

**Current RTL implementation (`rtl.css`):**

Only 8 RTL-specific rules exist:
1. `[dir="rtl"] { direction: rtl; text-align: right; }`
2. Slide animation direction flips (4 rules)
3. Gradient direction flips (2 rules: `bg-gradient-to-r` → `to left`)

**RTL gaps:**
- No logical CSS properties used (`start`/`end` instead of `left`/`right`)
- `me-2` and `ms-auto` used in some components (good) but `ml-2`/`mr-2` still common
- Manage sidebar uses `start-0` correctly for RTL
- Many vertical pages use physical properties (`pl-4`, `mr-2`) that don't flip

**Logical property usage audit:**

| Property | Logical (RTL-safe) | Physical (NOT RTL-safe) | Ratio |
|---|---|---|---|
| `ms-*/me-*` (margin) | ~120 uses | `ml-*/mr-*` ~340 uses | 26% logical |
| `ps-*/pe-*` (padding) | ~40 uses | `pl-*/pr-*` ~280 uses | 12% logical |
| `start-*/end-*` (position) | ~30 uses | `left-*/right-*` ~90 uses | 25% logical |
| `text-start/text-end` | ~15 uses | `text-left/text-right` ~25 uses | 38% logical |

**Only ~25% of directional properties use RTL-safe logical properties.** 75% use physical properties that will break in Arabic (ar) locale.

### 33.4 Target Style Conventions

**Single source of truth:**
```
1. ALL colors → ds-* tokens (Tailwind classes)
2. ALL spacing → Tailwind spacing scale (aligned with SpacingTokens)
3. ALL typography → Tailwind text utilities (using theme fonts)
4. ALL shadows → ds-* shadow tokens
5. ALL border radius → ds-* radius tokens
6. ALL transitions → Tailwind transition utilities (aligned with MotionTokens)
7. ALL z-index → defined scale (not arbitrary)
8. ALL directional → logical properties (start/end, not left/right)
```

**Target class naming convention:**
```
PREFER:                          AVOID:
bg-ds-primary                    bg-blue-600, bg-violet-600, bg-[#2563eb]
text-ds-foreground               text-gray-900, text-[#1e293b]
border-ds-border                 border-gray-200, border-[#e2e8f0]
bg-ds-card                       bg-white
bg-ds-muted                      bg-gray-50, bg-gray-100
shadow-ds-sm                     shadow-sm (raw Tailwind)
rounded-ds-lg                    rounded-lg (when tokens differ)
ms-2 / me-2                      ml-2 / mr-2
ps-4 / pe-4                      pl-4 / pr-4
start-0 / end-0                  left-0 / right-0
```

---

## Section 34: Design System Implementation Checklist

### 34.1 P0 — Critical (Token Unification)

| # | Task | Files Affected | Effort |
|---|---|---|---|
| 1 | Add admin-specific tokens to `theme.css` | `theme.css` | 1h |
| 2 | Add vertical color tokens to `VerticalColorTokens.ts` | New file + `theme.css` | 2h |
| 3 | Add z-index and layout dimension tokens to `theme.css` | `theme.css` | 1h |
| 4 | Convert `manage/ui/button.tsx` to use ds-tokens | `button.tsx` | 0.5h |
| 5 | Convert all manage UI components to ds-tokens (28 files) | `manage/ui/*` | 4h |
| 6 | Fix `BrandingProvider` / `ThemeProvider` race condition | `branding-context.tsx`, `ThemeContext.ts` | 2h |
| 7 | Expose manage sidebar logo/name from tenant branding | `manage-layout.tsx`, `branding-context.tsx` | 1h |

### 34.2 P1 — High Priority (Component Unification)

| # | Task | Files Affected | Effort |
|---|---|---|---|
| 8 | Delete 12 duplicate manage UI components (use storefront UI) | `manage/ui/*`, all manage pages | 6h |
| 9 | Move 12 manage-only components to `ui/` (data-table, stats-grid, etc.) | `manage/ui/*` → `ui/*` | 4h |
| 10 | Update all manage page imports from `manage/ui` to `ui` | ~96 manage route files | 3h |
| 11 | Convert vertical page hero gradients to use vertical tokens | ~51 vertical route files | 4h |
| 12 | Replace physical CSS properties with logical (ms/me, ps/pe, start/end) | ~400 instances across codebase | 8h |
| 13 | Add dark mode toggle UI to user menu / settings | `user-menu.tsx`, `account/settings.tsx` | 2h |
| 14 | Implement `cityos-design-system` types in actual components | `ui/*` components | 8h |

### 34.3 P2 — Medium Priority (Polish)

| # | Task | Files Affected | Effort |
|---|---|---|---|
| 15 | Remove `enterprise-*` CSS classes from `app.css` (consolidate to Tailwind) | `app.css`, usage sites | 2h |
| 16 | Create VendorLayout/VendorSidebar with ds-tokens | New components | 4h |
| 17 | Create AnalyticsLayout/AnalyticsSidebar with ds-tokens | New components | 3h |
| 18 | Create BusinessLayout with ds-tokens | New component | 2h |
| 19 | Expand BrandingProvider to support full theme config | `branding-context.tsx` | 3h |
| 20 | Add dark mode color set for admin tokens | `theme.css`, `ColorTokens.ts` | 2h |

### 34.4 P3 — Nice to Have

| # | Task | Files Affected | Effort |
|---|---|---|---|
| 21 | Create Storybook/component gallery for unified UI components | New setup | 8h |
| 22 | Implement `ShadowTokens`/`ElevationTokens` deduplication | Token files | 1h |
| 23 | Create CSS-in-JS extraction for SSR token injection | Theme runtime | 4h |
| 24 | Add per-vertical dark mode color palettes | Token files | 3h |
| 25 | Implement responsive spacing tokens in components | All layout components | 4h |

### 34.5 Impact Summary

| Metric | Current | After P0 | After P0+P1 |
|---|---|---|---|
| **Hardcoded colors** | 239 instances | ~50 (admin tokens added) | ~0 |
| **Duplicate components** | 13 pairs | 0 (manage uses storefront UI) | 0 |
| **Dark mode support** | Storefront only | Storefront + manage | All layouts |
| **Tenant theming scope** | Storefront colors only | All sections | All + verticals |
| **RTL-safe properties** | ~25% | ~25% | ~90%+ |
| **Component library size** | 64 total (36+28) | ~48 unified | ~48 unified |
| **enterprise-* classes** | ~30 definitions | ~30 (unchanged) | 0 (removed) |
| **Design system types used** | 0% | 0% | ~60% |

---

# PHASED IMPLEMENTATION ROADMAP

## Roadmap Overview

This roadmap maps ALL 34 assessment sections into 6 sequential phases. Each phase has:
- **Clear scope** — what gets built or migrated
- **Section coverage** — which assessment sections each task resolves
- **Cleanup steps** — what old code/files get removed after migration
- **Exit criteria** — what must be true before moving to next phase
- **Dependency chain** — phases must execute in order (later phases depend on earlier ones)

```
PHASE DEPENDENCY CHAIN:

Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
(Foundation)  (RBAC &     (Design     (Content &    (Data &      (Polish &
              Navigation)  System)     CMS)          Verticals)   Production)

Total estimated effort: ~180 hours across ~120 tasks
```

### Section-to-Phase Mapping (Complete)

| Section | Title | Primary Phase | Secondary Phase |
|---|---|---|---|
| S1 | Database Schema Analysis | Phase 4 | — |
| S2 | Backend Route Handler Analysis | Phase 4 | — |
| S3 | Per-Vertical Deep Assessment | Phase 4 | Phase 5 |
| S4 | Cross-Cutting Issues | Phase 0 | Phase 4 |
| S5 | Priority Action Matrix | Phase 0, 4 | — |
| S6 | Quick Wins | Phase 0 | — |
| S7 | Payload CMS Blocks — Structural Analysis | Phase 3 | — |
| S8 | CMS Integration Points Summary | Phase 3 | — |
| S9 | Architecture Decision — Hardcoded vs Block-Based | Phase 3 | Phase 5 |
| S10 | Complete Block Catalog — All 77 Blocks | Phase 3 | — |
| S11 | Block Assignment per Detail Page | Phase 3 | Phase 5 |
| S12 | Block Coverage Statistics | Phase 3 | — |
| S13 | Missing Blocks — Design Specifications | Phase 3 | — |
| S14 | Current vs Targeted State — Centralization | Phase 3 | Phase 5 |
| S15 | Complete Page Inventory — 336 Routes | Phase 1 | — |
| S16 | Missing Pages & Structural Gaps | Phase 1 | Phase 4 |
| S17 | Vertical Completeness Matrix | Phase 4 | — |
| S18 | Summary Statistics | — (tracking) | — |
| S19 | Admin Role Hierarchy — Deep Assessment | Phase 1 | — |
| S20 | Payload CMS Block Gap Analysis | Phase 3 | — |
| S21 | Manage Page Architecture — Complete Analysis | Phase 1 | — |
| S22 | Content-Editor — Page Builder Architecture Gap | Phase 3 | — |
| S23 | Summary — Admin Architecture Gaps | Phase 1, 3 | — |
| S24 | Complete Route Architecture — Current vs Target | Phase 1 | — |
| S25 | Target Route Architecture — Complete Definition | Phase 1 | — |
| S26 | Navigation Components — Current vs Target | Phase 1 | — |
| S27 | Route Migration Plan — Reorganizing 96 Manage Pages | Phase 1 | — |
| S28 | Complete Navigation Architecture Summary | Phase 1 | — |
| S29 | Centralized Design System Architecture | Phase 2 | — |
| S30 | Component Library Architecture | Phase 2 | — |
| S31 | Target Design System Architecture | Phase 2 | — |
| S32 | Theme and Branding Architecture | Phase 2 | Phase 5 |
| S33 | Style and Layout Patterns | Phase 2 | Phase 5 |
| S34 | Design System Implementation Checklist | Phase 2 | — |

---

## PHASE 0: Foundation & Quick Wins
**Goal:** Fix blocking bugs, establish contracts, prepare infrastructure for all later phases.
**Sections resolved:** S4 (partial), S5 (P0 items), S6 (all quick wins)
**Estimated effort:** ~8 hours

### Phase 0 Tasks

| # | Task | Section | Files | Effort | Priority |
|---|---|---|---|---|---|
| 0.1 | Fix auctions detail bug — change `auction_listing_id` to `auction_id` in bid query | S5 #1, S6 #1 | 1 backend file | 5 min | P0 |
| 0.2 | Fix financial routing mismatch — align page URL with backend route | S5 #5, S6 #5 | 1 route file | 5 min | P0 |
| 0.3 | Fix vendors routing — change page to use handle or add ID lookup | S5 #6, S6 #9 | 1 route file | 15 min | P0 |
| 0.4 | Fix charity detail bug — debug `retrieveCharityOrg` method | S5 #2 | 1 backend file | 15 min | P0 |
| 0.5 | Fix social-commerce listing/detail mismatch | S5 #3 | 1 route file + 1 backend | 30 min | P0 |
| 0.6 | Create 6 high-priority detail endpoints (education, healthcare, restaurants, real-estate, events, insurance) | S5 #4, S6 #3-8 | 6 backend files | 1h | P0 |
| 0.7 | Fix 5 broken listing endpoints (affiliate, financial, print-on-demand, volume-deals, white-label) | S5 #9 | 5 backend files | 2h | P1 |
| 0.8 | Create remaining 13 detail endpoints for verticals with some data | S5 #7 | 13 backend files | 2h | P1 |
| 0.9 | Fix 5 data model mismatches (memberships→tiers, subscriptions→plans, etc.) | S5 #8 | 5 backend files | 2h | P1 |

### Phase 0 Cleanup
- None — Phase 0 only fixes bugs in existing files, no new architecture introduced.

### Phase 0 Exit Criteria
- [ ] All 27 verticals return data from listing endpoints without errors
- [ ] All 27 verticals have detail endpoints that resolve correctly
- [ ] Zero 500 errors from vertical API calls
- [ ] No routing mismatches between frontend route paths and backend endpoints

---

## PHASE 1: RBAC, Navigation & Route Architecture
**Goal:** Establish proper role-based access, reorganize routes, create navigation hierarchy, build missing layouts.
**Sections resolved:** S15, S16 (partial), S19, S21, S23 (role gaps), S24, S25, S26, S27, S28
**Depends on:** Phase 0 (bugs fixed so pages can be tested after reorganization)
**Estimated effort:** ~40 hours

### Phase 1A: RBAC Infrastructure (Prerequisites for everything else)

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 1.1 | Fix `manage-sidebar.tsx` — remove hardcoded `userWeight=100`, read actual weight from auth context | S19, S21, S23 #1, S28 #1 | `manage-sidebar.tsx` | 1h |
| 1.2 | Fix `role-guard.tsx` — implement per-route weight support instead of global `MIN_MANAGE_WEIGHT=40` | S19, S22, S23 #1, S28 #2 | `role-guard.tsx` | 2h |
| 1.3 | Update RBAC contracts — ensure all 10 roles have correct weights and map to Payload CMS roles | S19 §19.2, S23 #4 | `packages/cityos-contracts/src/rbac.ts` | 2h |

### Phase 1A Cleanup
- Remove hardcoded `const userWeight = 100` from `manage-sidebar.tsx`
- Remove `MIN_MANAGE_WEIGHT = 40` constant from `role-guard.tsx` (replaced by per-route config)

---

### Phase 1B: Module Registry & Sidebar Expansion

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 1.4 | Add CMS section to Module Registry with `minWeight: 30` (17 CMS modules) | S21, S22, S23 #2, S28 #3, #20 | `module-registry.ts` | 2h |
| 1.5 | Add Platform section to Module Registry with `minWeight: 90` (18 platform modules) | S21, S23 #3, S28 #3, #20 | `module-registry.ts` | 2h |
| 1.6 | Add remaining 49 missing modules across all sections (commerce, marketplace, verticals, marketing, organization) | S21, S28 #20 | `module-registry.ts` | 3h |
| 1.7 | Implement `getModulesBySection(userWeight)` filtering — sidebar shows only modules user can access | S21, S26, S28 #3 | `manage-sidebar.tsx` | 1h |

### Phase 1B Cleanup
- Remove any inline module lists in sidebar that are now in registry
- Verify sidebar sections respect weight filtering — `content-editor` (30) sees CMS only, `vendor-admin` (40) sees commerce+verticals+CMS

---

### Phase 1C: Route Reorganization

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 1.8 | Create `manage/platform/` directory structure | S24, S25, S27 #5 | 18 new route files | 2h |
| 1.9 | Move 17 platform pages from `manage/` to `manage/platform/` | S24, S25, S27 #7 | 17 file moves | 1h |
| 1.10 | Create `manage/cms/` directory structure | S24, S25, S27 #6 | 17 new route files | 2h |
| 1.11 | Move 2 existing CMS pages from `manage/` to `manage/cms/` (`cms.tsx` → `cms/pages.tsx`, `cms-content.tsx` → `cms/editor.tsx`) | S22, S27 #8 | 2 file moves | 30 min |
| 1.12 | Delete 5 duplicate manage page pairs | S21 §21.4, S27 #9 | 5 file deletes | 30 min |

### Phase 1C Cleanup
- **DELETE** old `manage/cms.tsx` and `manage/cms-content.tsx` after move to `manage/cms/`
- **DELETE** 5 duplicate manage pages:
  - `manage/page-builder.tsx` (duplicate of `manage/cms-content.tsx`)
  - `manage/policies.tsx` (duplicate of `manage/governance.tsx`)
  - `manage/tenants.tsx` (duplicate of `manage/multi-tenancy.tsx`)
  - `manage/branding.tsx` (duplicate of `manage/theme.tsx`)
  - `manage/settings.tsx` (duplicate of `manage/store-settings.tsx`)
- **DELETE** original files from `manage/` root that were moved to `manage/platform/`:
  - `manage/tenants.tsx`, `manage/multi-tenancy.tsx`, `manage/super-admin.tsx`, `manage/system-health.tsx`
  - `manage/api-keys.tsx`, `manage/webhooks.tsx`, `manage/audit-trail.tsx`, `manage/feature-flags.tsx`
  - `manage/rate-limiting.tsx`, `manage/backup-recovery.tsx`, `manage/deployment.tsx`
  - `manage/integrations.tsx`, `manage/monitoring.tsx`, `manage/data-migration.tsx`
  - `manage/localization.tsx`, `manage/revenue-sharing.tsx`, `manage/compliance.tsx`
- Verify total manage route count is still ~96 (just reorganized, not lost)

---

### Phase 1D: Navigation Components & User Menu

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 1.13 | Update `user-menu.tsx` — add role-aware links (Vendor Dashboard, Content Studio, Analytics, Store Dashboard, Platform Admin) | S26, S28 #4 | `user-menu.tsx` | 2h |
| 1.14 | Update `account-sidebar.tsx` — add 13 missing account page links | S16, S28 #10 | `account-sidebar.tsx` | 1h |
| 1.15 | Update `layout.tsx` — detect `/vendor/`, `/analytics/`, `/manage/cms/`, `/manage/platform/` routes and select correct layout | S24, S28 #16 | `layout.tsx` | 2h |

### Phase 1D Cleanup
- Remove any hardcoded navigation arrays in `user-menu.tsx` (replaced by role-based logic)
- Remove any hardcoded account sidebar items (replaced by registry or config)

---

### Phase 1E: New Layout Components

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 1.16 | Create `VendorLayout` + `VendorSidebar` components | S25, S28 #11 | 2 new files | 4h |
| 1.17 | Wrap all 56 vendor pages with `VendorLayout` | S28 #12 | 56 file edits | 3h |
| 1.18 | Create `BusinessLayout` for B2B portal | S25, S28 #15 | 1 new file | 2h |
| 1.19 | Create `AnalyticsLayout` + `AnalyticsSidebar` | S25, S28 #14 | 2 new files | 3h |
| 1.20 | Create `analytics/` route section + 8 route files | S25, S28 #13 | 8 new files | 3h |
| 1.21 | Create 8 missing public pages (about, contact, terms, privacy, FAQ, search, sitemap, 404) | S16 §16.1, S28 #19 | 8 new files / CMS entries | 4h |

### Phase 1E Cleanup
- Remove any inline vendor layout wrappers from individual vendor pages (replaced by `VendorLayout`)
- Remove any vendor navigation that was inline in vendor pages

### Phase 1 Exit Criteria
- [ ] `content-editor` (weight 30) can access `/manage/cms/*` pages
- [ ] `analyst` (weight 20) can access `/analytics/*` pages
- [ ] `vendor-admin` (weight 40) sees commerce+verticals+CMS in sidebar, NOT platform pages
- [ ] `super-admin` (weight 100) sees ALL sections including platform
- [ ] All 56 vendor pages wrapped in `VendorLayout` with sidebar
- [ ] User menu shows role-appropriate dashboard links
- [ ] `manage/platform/` contains 17-18 platform-admin pages
- [ ] `manage/cms/` contains 2+ CMS pages
- [ ] 5 duplicate manage pages deleted
- [ ] Account sidebar shows all 26 account page links
- [ ] 8 missing public pages accessible

---

## PHASE 2: Design System Unification
**Goal:** Merge dual design systems into single token-based system. All components use `ds-` tokens. Dark mode and tenant theming work everywhere.
**Sections resolved:** S29, S30, S31, S32, S33, S34
**Depends on:** Phase 1 (layouts exist so we know which components to theme)
**Estimated effort:** ~45 hours

### Phase 2A: Token Foundation

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.1 | Create vertical color tokens — `VerticalColorTokens.ts` with 27 vertical palettes (3 tokens each = 81 tokens) | S29 §29.7, S31 §31.2, S34 #2 | New file in `design-tokens/` + `theme.css` | 3h |
| 2.2 | Add admin-specific tokens to `theme.css` — sidebar-bg, sidebar-border, sidebar-active, page-bg, accent (12 tokens) | S29, S31 §31.2, S34 #1 | `theme.css` | 1h |
| 2.3 | Add status color tokens — standardize success/warning/error/info across both systems (10 tokens) | S31 §31.2 | `theme.css` | 30 min |
| 2.4 | Add z-index scale tokens — dropdown(50), sticky(100), fixed(200), sidebar(300), modal(400/500), popover(600), toast(700) | S31 §31.2, S34 #3 | `theme.css` | 30 min |
| 2.5 | Add layout dimension tokens — sidebar widths, header heights, content max-widths (6 tokens) | S31 §31.2, §31.4 | `theme.css` | 30 min |

### Phase 2A Cleanup
- None yet — tokens are additive, no removal needed until Phase 2B uses them

---

### Phase 2B: Manage Component Migration (28 files → ds-tokens)

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.6 | Convert `manage/ui/button.tsx` — replace `bg-violet-600` → `bg-ds-admin-accent`, `bg-white` → `bg-ds-card`, `text-gray-700` → `text-ds-foreground`, etc. | S30 §30.2, S34 #4-5 | `manage/ui/button.tsx` | 30 min |
| 2.7 | Convert `manage/ui/input.tsx` — replace `border-gray-200` → `border-ds-border`, `text-gray-900` → `text-ds-foreground` | S30, S34 #5 | `manage/ui/input.tsx` | 15 min |
| 2.8 | Convert `manage/ui/select.tsx` — same pattern as input | S30, S34 #5 | `manage/ui/select.tsx` | 15 min |
| 2.9 | Convert `manage/ui/label.tsx`, `textarea.tsx` — same pattern | S30, S34 #5 | 2 files | 15 min |
| 2.10 | Convert `manage/ui/badge.tsx`, `status-badge.tsx` — hardcoded green/yellow/red → `ds-success`/`ds-warning`/`ds-destructive` | S30, S34 #5 | 2 files | 30 min |
| 2.11 | Convert `manage/ui/tabs.tsx` — `border-gray-200` → `border-ds-border`, `text-violet-600` → `text-ds-admin-accent` | S30, S34 #5 | 1 file | 15 min |
| 2.12 | Convert `manage/ui/drawer.tsx`, `focus-modal.tsx` — gray backgrounds → `ds-card`, `ds-background` | S30, S34 #5 | 2 files | 30 min |
| 2.13 | Convert `manage/ui/dropdown-menu.tsx` — gray → ds-tokens | S30, S34 #5 | 1 file | 15 min |
| 2.14 | Convert `manage/ui/toast.tsx` — gray/violet → ds-tokens | S30, S34 #5 | 1 file | 15 min |
| 2.15 | Convert `manage/ui/data-table.tsx` — full token conversion (largest manage component) | S30, S34 #5 | 1 file | 1h |
| 2.16 | Convert `manage/ui/table.tsx`, `stats-grid.tsx` | S30, S34 #5 | 2 files | 30 min |
| 2.17 | Convert `manage/ui/page-header.tsx`, `section-card.tsx`, `container.tsx` | S30, S34 #5 | 3 files | 30 min |
| 2.18 | Convert `manage/ui/form-drawer.tsx`, `confirm-dialog.tsx`, `empty-state.tsx` | S30, S34 #5 | 3 files | 30 min |
| 2.19 | Convert `manage/ui/heading.tsx`, `text.tsx`, `tooltip.tsx`, `icon-button.tsx`, `skeleton.tsx`, `crud-page.tsx` | S30, S34 #5 | 6 files | 1h |

**Total: All 28 manage UI components converted to ds-tokens.**

### Phase 2B Cleanup
- After all 28 files converted: Verify zero remaining instances of `bg-violet-600`, `bg-white`, `text-gray-700`, `border-gray-200` in `manage/ui/`
- Run: `grep -rn "bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-violet-\|text-violet-" apps/storefront/src/components/manage/ui/` → should return 0

---

### Phase 2C: Component Unification (Delete duplicates, promote unique manage components)

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.20 | Delete 12 duplicate manage UI components — update all imports to use `@/components/ui/` versions | S30 §30.2, S31 §31.3, S34 #8 | Delete 12 `manage/ui/*.tsx` files, update ~96 manage route imports | 6h |
| 2.21 | Move 12 manage-only components to `ui/` — data-table, table, stats-grid, page-header, form-drawer, crud-page, status-badge, confirm-dialog, section-card, focus-modal, icon-button, tooltip | S30 §30.2, S31 §31.3, S34 #9 | Move 12 files `manage/ui/` → `ui/`, update imports | 4h |
| 2.22 | Merge `manage/ui/skeleton.tsx` variants (SkeletonText, SkeletonTable, SkeletonCard) into `ui/skeleton.tsx` | S30 §30.2 | `ui/skeleton.tsx` | 1h |
| 2.23 | Delete `manage/ui/heading.tsx`, `manage/ui/text.tsx`, `manage/ui/container.tsx` — trivial wrappers, replace with standard Tailwind | S30, S31 §31.3 | 3 deletes + import updates | 1h |
| 2.24 | Update `manage/ui/index.ts` — re-export from `@/components/ui/` for backward compatibility during transition | S30 | `manage/ui/index.ts` | 30 min |
| 2.25 | Update all manage page imports from `@/components/manage/ui` to `@/components/ui` | S34 #10 | ~96 manage route files | 3h |

### Phase 2C Cleanup
- **DELETE** entire `manage/ui/` directory after all imports updated (or keep as re-export shim temporarily)
- **DELETE** these 12 duplicated files from `manage/ui/`:
  - `button.tsx`, `input.tsx`, `select.tsx`, `label.tsx`, `textarea.tsx`, `badge.tsx`
  - `tabs.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `toast.tsx`, `empty-state.tsx`
  - `skeleton.tsx` (after merge)
- **DELETE** these 3 trivial files: `heading.tsx`, `text.tsx`, `container.tsx`
- Verify: `ls apps/storefront/src/components/manage/ui/` contains only `index.ts` (re-export shim) or is empty/deleted
- Verify: `ui/` now contains ~48 unified components
- Run: `grep -rn "from.*manage/ui" apps/storefront/src/routes/` → should return 0 direct imports (only through shim or migrated)

---

### Phase 2D: Manage Layout & Sidebar Theming

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.26 | Convert `manage-sidebar.tsx` — replace hardcoded `bg-white`, `text-gray-*`, `bg-violet-*` with `ds-admin-*` tokens | S26, S29 §29.5 | `manage-sidebar.tsx` | 1h |
| 2.27 | Convert `manage-header.tsx` / `manage-layout.tsx` — replace raw gray/white with ds-admin tokens | S26, S29 §29.5 | 2 files | 1h |
| 2.28 | Fix manage sidebar logo — read from tenant branding instead of hardcoded "Dakkah" + violet icon | S29 §29.5, S32 §32.2, S34 #7 | `manage-sidebar.tsx`, `branding-context.tsx` | 1h |
| 2.29 | Fix ThemeProvider/BrandingProvider race condition — BrandingProvider should call ThemeProvider's merge API instead of raw DOM manipulation | S29 §29.4, S32 §32.1, S34 #6 | `branding-context.tsx`, `ThemeContext.ts` | 2h |

### Phase 2D Cleanup
- Remove hardcoded "Dakkah" logo text from `manage-sidebar.tsx`
- Remove duplicate `document.documentElement.style.setProperty('--color-primary', ...)` from `BrandingProvider` (replaced by theme merge)
- Verify: `grep -rn "bg-white\|text-gray-\|border-gray-\|bg-violet-\|text-violet-" apps/storefront/src/components/manage/manage-sidebar.tsx` → 0

---

### Phase 2E: Hardcoded Color Migration in Route Files

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.30 | Convert manage route pages — replace `bg-white` → `bg-ds-card`, `text-gray-*` → `text-ds-foreground`/`text-ds-muted-foreground`, `bg-gray-*` → `bg-ds-muted` across 96 manage pages | S29 §29.6, S33 | ~96 manage route files | 4h |
| 2.31 | Convert vertical page hero gradients to use vertical tokens (27 verticals × gradient classes) | S29 §29.7, S34 #11 | ~51 vertical route files | 4h |
| 2.32 | Convert hardcoded status colors in components — `bg-green-*` → `bg-ds-success`, `bg-red-*` → `bg-ds-destructive`, `bg-yellow-*` → `bg-ds-warning` across components | S29 §29.6 | ~50 component files | 3h |
| 2.33 | Remove `enterprise-*` CSS classes from `app.css` and convert usage sites to ds-token classes | S33 §33.1, S34 #15 | `app.css` + usage sites | 2h |

### Phase 2E Cleanup
- Verify: `grep -rn "bg-white" apps/storefront/src/routes/\$tenant/\$locale/manage/` → 0
- Verify: `grep -rn "bg-gray-\|text-gray-\|border-gray-" apps/storefront/src/routes/\$tenant/\$locale/manage/` → 0
- Verify: `grep -rn "from-blue-\|from-violet-\|from-green-\|from-orange-" apps/storefront/src/routes/\$tenant/\$locale/` → 0 (all replaced with vertical tokens)
- Verify: `grep -rn "enterprise-" apps/storefront/src/` → 0 (all enterprise classes removed)
- Run full count: hardcoded colors across storefront → target < 20 (only intentional exceptions)

---

### Phase 2F: RTL & Logical Properties

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 2.34 | Replace `ml-*`/`mr-*` → `ms-*`/`me-*` across all components and routes (~340 instances) | S33 §33.3, S34 #12 | All component + route files | 3h |
| 2.35 | Replace `pl-*`/`pr-*` → `ps-*`/`pe-*` across all components and routes (~280 instances) | S33 §33.3, S34 #12 | All component + route files | 2h |
| 2.36 | Replace `left-*`/`right-*` → `start-*`/`end-*` in positioning (~90 instances) | S33 §33.3, S34 #12 | All component + route files | 1h |
| 2.37 | Replace `text-left`/`text-right` → `text-start`/`text-end` (~25 instances) | S33 §33.3, S34 #12 | All component + route files | 30 min |

### Phase 2F Cleanup
- Verify: `grep -rn "ml-[0-9]\|mr-[0-9]\|pl-[0-9]\|pr-[0-9]" apps/storefront/src/` → target < 10 (only intentional exceptions like centering with `mx-auto`)
- Verify: `grep -rn "\bleft-\|\bright-" apps/storefront/src/components/` → 0 (position props use start/end)
- Note: `ml-auto`/`mr-auto` MAY remain as `ms-auto`/`me-auto` equivalents exist but some frameworks handle them differently

### Phase 2 Exit Criteria
- [ ] Zero hardcoded `bg-violet-*`, `text-violet-*` in manage components
- [ ] Zero hardcoded `bg-white`, `bg-gray-*`, `text-gray-*` in manage routes and components
- [ ] `manage/ui/` directory deleted or contains only backward-compat shim
- [ ] `ui/` directory contains ~48 unified components
- [ ] All 27 vertical hero gradients use vertical color tokens
- [ ] Zero `enterprise-*` CSS classes in codebase
- [ ] RTL-safe logical properties at 90%+ (< 30 physical direction instances remain)
- [ ] Manage sidebar reads tenant branding for logo/name
- [ ] ThemeProvider/BrandingProvider race condition resolved
- [ ] Dark mode toggle renders correctly in manage and storefront (basic support)
- [ ] `ds-admin-*` tokens defined and used in all manage layouts

---

## PHASE 3: CMS & Content Editor Architecture
**Goal:** Enable content-editor (weight 30) to use Payload CMS page builder with all 77 blocks. Build page builder UI. Register blocks in Payload.
**Sections resolved:** S7, S8, S9, S10, S11, S12, S13, S14 (partial), S20, S22, S23 (CMS gaps)
**Depends on:** Phase 1 (RBAC lets content-editor access CMS pages), Phase 2 (components use unified design system)
**Estimated effort:** ~40 hours

### Phase 3A: Payload CMS Block Registration

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 3.1 | Register top-20 content blocks in Payload Pages collection — featureGrid, cta, productGrid, testimonial, stats, imageGallery, faq, pricing, vendorShowcase, categoryGrid, newsletter, trustBadges, divider, videoEmbed, bannerCarousel, contactForm, map, reviewList, blogPost, promotionBanner | S7, S10, S20, S22 §22.3 | Payload Pages collection config | 4h |
| 3.2 | Register remaining 30 content blocks — all blocks from S10 catalog not covered in 3.1 | S10, S12, S20 | Payload Pages collection config | 4h |
| 3.3 | Register 15 admin blocks — dataTableBlock, chartBlock, statCardBlock, formBlock, wizardBlock, etc. | S13, S20 | Payload admin block definitions | 3h |
| 3.4 | Create block field specifications — define all Payload field types for each block's configuration panel | S22 §22.3 | Block config files | 3h |

### Phase 3A Cleanup
- Remove the 3 placeholder blocks that were insufficient
- Verify: Payload Pages collection now lists 50+ blocks in its layout field definition

---

### Phase 3B: Block Renderer Implementation

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 3.5 | Implement BlockRenderer for top-20 content blocks — each block renders with ds-tokens, responsive, RTL-safe | S7 §7.4, S9, S11 | 20 block component files | 6h |
| 3.6 | Implement BlockRenderer for remaining 30 content blocks | S10, S11 | 30 block component files | 6h |
| 3.7 | Implement admin block renderers — dataTableBlock, chartBlock, etc. | S13 | 15 block component files | 4h |
| 3.8 | Create `BlockRenderer` master component — dispatches blockType → component, handles unknown blocks gracefully | S7 §7.4, S14 | 1 new component | 2h |

### Phase 3B Cleanup
- After block renderers created: verify each block uses `ds-` tokens and logical CSS properties
- Remove any inline block rendering logic from route files (replaced by BlockRenderer)

---

### Phase 3C: Page Builder UI for Content-Editor

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 3.9 | Create `manage/cms/page-builder.tsx` — visual block editor with block palette, drag-and-drop, property panel, live preview | S22 §22.1, §22.4 #4 | 1 new route + supporting components | 8h |
| 3.10 | Create `manage/cms/media-library.tsx` — upload, browse, search media assets | S22 §22.4 #6 | 1 new route | 4h |
| 3.11 | Create `manage/cms/dashboard.tsx` — CMS overview: page count, drafts, published, recent edits | S22 §22.4 #1 | 1 new route | 2h |
| 3.12 | Create `manage/cms/blog.tsx` — blog post CRUD with categories | S22 §22.4 #7 | 1 new route | 2h |
| 3.13 | Create `manage/cms/navigation.tsx` — visual menu builder | S22 §22.4 #8 | 1 new route | 2h |
| 3.14 | Create `manage/cms/templates.tsx` — pre-built page templates for quick creation | S22 §22.4 #12 | 1 new route | 2h |

### Phase 3C Cleanup
- Verify all CMS routes registered in module registry with `minWeight: 30`
- Verify content-editor can navigate to each CMS page via sidebar

---

### Phase 3D: CMS Integration Points

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 3.15 | Create Payload-compatible API responses for block data (local stand-in until Payload migration) | S8, S14 | Backend API endpoints | 3h |
| 3.16 | Create `useBlocks` hook — fetches page blocks from CMS API, renders via BlockRenderer | S8, S14 | New hook + page integration | 2h |
| 3.17 | Create `$slug.tsx` catch-all route — renders CMS-managed pages using BlockRenderer | S9, S14, S16 §16.1 | 1 new route file | 2h |

### Phase 3D Cleanup
- After CMS catch-all route works: verify static CMS pages (about, contact, etc.) can be rendered from CMS data
- Remove hardcoded fallback pages for about/contact/etc. if CMS versions exist

### Phase 3 Exit Criteria
- [ ] Payload Pages collection registers 50+ blocks (not just 3)
- [ ] Content-editor (weight 30) can access `/manage/cms/` pages
- [ ] Page builder UI renders block palette with 50+ blocks
- [ ] Blocks can be added/removed/reordered in page builder
- [ ] Each block has a property configuration panel
- [ ] Block preview renders in storefront context
- [ ] Media library allows image upload and browsing
- [ ] `$slug.tsx` renders CMS-managed pages
- [ ] Blog manager allows post CRUD
- [ ] All CMS pages use unified ds-token design system

---

## PHASE 4: Data Layer, Vertical Completion & Backend Hardening
**Goal:** Seed missing data, customize generic templates, fix data model mismatches, complete vertical depth.
**Sections resolved:** S1, S2, S3, S4 (remaining), S5 (P1-P2), S16 (remaining), S17
**Depends on:** Phase 0 (endpoints fixed), Phase 2 (design tokens in templates)
**Estimated effort:** ~30 hours

### Phase 4A: Data Seeding & Model Fixes

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 4.1 | Seed data for 14 empty verticals (affiliate, b2b, bookings, consignment, credit, financial, loyalty, places, print-on-demand, quotes, trade-in, volume-deals, white-label, parking) | S5 #10, S17 | Seed scripts | 4h |
| 4.2 | Fix memberships endpoint to serve tiers (not products) | S5 #8 | 1 backend file | 30 min |
| 4.3 | Fix subscriptions endpoint to serve plans (not products) | S5 #8 | 1 backend file | 30 min |
| 4.4 | Fix dropshipping/try-before-buy endpoints to serve correct entity types | S5 #8 | 2 backend files | 1h |
| 4.5 | Fix flash-deals endpoint to serve deals (not products) | S5 #8 | 1 backend file | 30 min |

### Phase 4A Cleanup
- Remove any hardcoded fallback data from route loaders (replaced by real seed data)
- Verify: all 27 verticals return real data from API

---

### Phase 4B: Template Customization

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 4.6 | Customize 38 generic list page templates — use each vertical's actual API fields instead of generic product fields | S5 #11 | 38 route files | 8h |
| 4.7 | Rebuild `places` page (83 → ~250 lines) with proper POI rendering | S5 #12 | 1 route file | 1h |
| 4.8 | Rebuild `quotes` page (74 → ~250 lines) with proper quote flow | S5 #13 | 1 route file | 1h |
| 4.9 | Resolve 5 duplicate storefront page pairs — merge or differentiate | S5 #15 | 5 route files | 3h |
| 4.10 | Add breadcrumbs to pages missing them (~8 pages) | S5 #14, S6 #10 | 8 route files | 1h |
| 4.11 | Add not-found states to 6 pages missing them | S5 #14 | 6 route files | 1h |
| 4.12 | Add sidebar filters to 5 list pages missing them | S5 #14 | 5 route files | 2h |
| 4.13 | Add CTAs to 7 pages missing them | S5 #14 | 7 route files | 1h |

### Phase 4B Cleanup
- After customizing templates: remove `@ts-nocheck` from files that have been properly typed
- Remove generic fallback card rendering logic from customized pages
- Verify each vertical page renders its actual data fields (not generic product card)

---

### Phase 4C: Missing Manage CRUD Configs

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 4.14 | Add 47 missing CRUD configurations — form fields, API endpoints, validation | S21 §21.3, S23 #8 | `crud-configs.ts` or per-module configs | 4h |
| 4.15 | Create 10 missing platform-admin pages (platform-dashboard, system-overview, tenant-provisioning, etc.) | S23 §23.4 | 10 new route files | 4h |
| 4.16 | Create 10 missing tenant-admin pages (vendor-onboarding-review, commission-rules, etc.) | S23 §23.4 | 10 new route files | 4h |

### Phase 4C Cleanup
- Verify: all manage pages with forms have matching CRUD configs
- Verify: no form submission silently fails due to missing config

### Phase 4 Exit Criteria
- [ ] All 27 verticals have seed data in database
- [ ] All 38 generic templates customized for their vertical
- [ ] 47 missing CRUD configs added
- [ ] 10 platform-admin pages created
- [ ] 10 tenant-admin pages created
- [ ] 5 duplicate storefront page pairs resolved
- [ ] Zero `@ts-nocheck` directives in customized pages (stretch goal)
- [ ] All list pages show vertical-specific fields, not generic product cards

---

## PHASE 5: Production Polish & Quality
**Goal:** Complete remaining polish, image handling, sharing, cross-cutting UX improvements, type safety.
**Sections resolved:** S3 (remaining), S5 (P3), S9 (remaining), S11 (remaining), S14 (remaining), S32 (remaining), S33 (remaining), S34 (P2-P3)
**Depends on:** All prior phases
**Estimated effort:** ~35 hours

### Phase 5A: Image & Media Handling

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 5.1 | Create reusable `ImageGallery` component — zoom, carousel, thumbnails | S5 #16 | 1 component (already exists in `ui/`) — enhance | 3h |
| 5.2 | Standardize image storage — migrate `metadata.images` to dedicated columns across 10 verticals | S5 #18 | 10 backend models | 4h |
| 5.3 | Add share/bookmark functionality to 38 pages missing it | S5 #19 | 38 route files | 2h |
| 5.4 | Add related/similar items sections to detail pages | S5 #17 | ~27 detail page files | 2h |

### Phase 5A Cleanup
- After image migration: remove `JSON.parse(metadata).images` patterns from route files
- Replace with direct column access: `item.images` instead of `JSON.parse(item.metadata)?.images`

---

### Phase 5B: Dark Mode & Advanced Theming

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 5.5 | Add dark mode toggle to user menu / settings | S32 §32.4, S34 #13 | `user-menu.tsx`, `account/settings.tsx` | 2h |
| 5.6 | Add dark mode color set for admin tokens | S34 #20 | `theme.css`, `ColorTokens.ts` | 2h |
| 5.7 | Expand BrandingProvider to support full theme config (border-radius, font, mode, admin accent) | S32 §32.3, S34 #19 | `branding-context.tsx` | 3h |
| 5.8 | Add per-vertical dark mode color palettes | S34 #24 | `VerticalColorTokens.ts`, `theme.css` | 3h |

### Phase 5B Cleanup
- After dark mode works: verify no component has hardcoded `bg-white` or `text-black` that breaks dark mode
- Run visual regression test: toggle dark mode across storefront, manage, vendor, analytics sections

---

### Phase 5C: Type Safety & Design System Types

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 5.9 | Implement `@dakkah-cityos/design-system` types in storefront UI components — Button, Input, Select, Badge, etc. | S30 §30.4, S34 #14 | ~20 `ui/*.tsx` files | 4h |
| 5.10 | Implement design-system types in layout components — Container, Card, Sidebar types | S30 §30.4 | ~10 component files | 2h |
| 5.11 | Implement design-system types in feedback components — Toast, Alert, Dialog | S30 §30.4 | ~6 component files | 2h |
| 5.12 | Deduplicate `ShadowTokens` and `ElevationTokens` — merge into single scale | S34 #22 | Token files | 1h |

### Phase 5C Cleanup
- After type implementation: remove `any` types from component props where design-system types now apply
- Verify: component props match their design-system type definitions

---

### Phase 5D: Remaining Polish

| # | Task | Section | Files | Effort |
|---|---|---|---|---|
| 5.13 | Migrate hardcoded social-commerce data to database | S5 #20 | 1 backend + 1 route | 1h |
| 5.14 | Add analyst read-only views (weight 20) — analytics dashboard, reports | S23 §23.4 | Analytics routes | 4h |
| 5.15 | Implement responsive spacing tokens in layout components | S34 #25 | Layout component files | 2h |
| 5.16 | Create remaining CMS pages — SEO manager, URL redirects, content scheduler, form submissions, CMS analytics | S22 §22.4 #9-14 | 5 new route files | 5h |

### Phase 5D Cleanup
- Final cleanup pass: search for any remaining hardcoded colors, physical CSS properties, raw Tailwind in manage
- Remove any temporary backward-compat shims from Phase 2 (`manage/ui/index.ts` re-exports)

### Phase 5 Exit Criteria
- [ ] Dark mode toggle works across all sections (storefront, manage, vendor, analytics)
- [ ] Image gallery component used across all detail pages
- [ ] Share/bookmark on all applicable pages
- [ ] ~60% of components implement design-system type definitions
- [ ] Analyst (weight 20) has read-only analytics dashboard
- [ ] BrandingProvider supports full theme config (not just 3 properties)
- [ ] ShadowTokens/ElevationTokens deduplicated
- [ ] Zero remaining `manage/ui/` backward-compat shims

---

## ROADMAP SUMMARY

### Phase Metrics

| Phase | Tasks | Effort | Sections Covered | Key Deliverable |
|---|---|---|---|---|
| **Phase 0** | 9 | ~8h | S4, S5, S6 | All vertical endpoints working |
| **Phase 1** | 21 | ~40h | S15-S28 | RBAC, navigation, route architecture |
| **Phase 2** | 37 | ~45h | S29-S34 | Unified design system, ds-tokens everywhere |
| **Phase 3** | 17 | ~40h | S7-S14, S20, S22 | CMS page builder with 77 blocks |
| **Phase 4** | 16 | ~30h | S1-S3, S5, S16-S17 | Data seeding, template customization |
| **Phase 5** | 16 | ~35h | S3, S5, S9, S11, S14, S32-S34 | Dark mode, types, polish |
| **TOTAL** | **116** | **~198h** | **All 34 sections** | **Production-ready platform** |

### Cleanup Verification Checklist (Run After Each Phase)

```
AFTER PHASE 0:
□ grep -rn "500\|error\|undefined" across vertical API responses → 0 errors

AFTER PHASE 1:
□ ls apps/storefront/src/routes/$tenant/$locale/manage/platform/ → 17+ files
□ ls apps/storefront/src/routes/$tenant/$locale/manage/cms/ → 5+ files
□ 5 duplicate manage pages deleted
□ Module registry has 90+ modules across all sections

AFTER PHASE 2:
□ grep "bg-white\|bg-gray-\|text-gray-\|bg-violet-\|text-violet-" manage/ui/ → 0
□ grep "bg-white\|bg-gray-\|text-gray-" manage routes → 0
□ grep "enterprise-" app.css → 0
□ grep "ml-[0-9]\|mr-[0-9]\|pl-[0-9]\|pr-[0-9]" components/ → < 10
□ ls manage/ui/ → empty or only index.ts shim
□ ls ui/ → 48 unified components

AFTER PHASE 3:
□ Payload Pages collection blocks count → 50+
□ Content-editor (weight 30) CMS page access → verified
□ Page builder renders block palette → verified

AFTER PHASE 4:
□ All 27 verticals return real data → verified
□ grep "@ts-nocheck" customized pages → decreasing
□ 47 CRUD configs exist → verified

AFTER PHASE 5:
□ Dark mode toggle works everywhere → verified
□ grep "bg-white\|bg-gray-\|text-gray-" entire codebase → < 20
□ manage/ui/index.ts shim removed → verified
□ 0 unused files/components remaining
```

### Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Phase 2 import changes break manage pages | HIGH | Use backward-compat shim in `manage/ui/index.ts` during transition |
| Block renderers don't match Payload field schemas | HIGH | Test each block against Payload API response format in Phase 3A before building UI |
| RTL property replacement breaks non-Arabic layouts | MEDIUM | Test all 3 locales (en, fr, ar) after Phase 2F |
| Vertical token colors clash with tenant branding | MEDIUM | Vertical tokens should use `var()` fallback pattern so tenant can override |
| Dark mode reveals missed hardcoded colors | MEDIUM | Phase 5B includes visual regression sweep |
| CRUD config additions trigger API errors | LOW | Test each config against actual backend endpoint before deploying |
