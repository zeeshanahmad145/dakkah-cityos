# Dakkah CityOS — Medusa Commerce Engine Documentation Plan

**Space:** Medusa Commerce Engine (NEW) · **Homepage:** TBD · **Updated:** February 19, 2026

**Companion Space:** Software Development (`98310`) — Payload CMS documentation
**Cross-Link:** Section 25 (Commerce — Medusa Integration) in Payload docs links here

**Codebase Layout**

| Directory | Purpose |
|-----------|---------|
| `apps/backend/` | Medusa v2 backend — 61 custom modules, 489 API routes, 38 subscribers, 23 workflows, 38 links |
| `apps/backend/src/modules/` | 61 custom MikroORM modules (verticals, infrastructure, commerce extensions) |
| `apps/backend/src/api/` | Custom API layer — admin (237), store (163), vendor (68), platform (16), webhooks (4), health (1) |
| `apps/backend/src/subscribers/` | 38 event subscribers (order, booking, payment, subscription lifecycle) |
| `apps/backend/src/workflows/` | 23 Medusa workflows (fulfillment, sync, provisioning, disputes, auctions) |
| `apps/backend/src/links/` | 38 module link definitions (cross-module entity relationships) |
| `apps/backend/src/scripts/` | 42 seed & utility scripts |
| `apps/backend/src/lib/` | Shared libraries — integrations, storage, monitoring, middleware, platform |
| `apps/storefront/` | TanStack Start + React storefront — 349 routes (legacy, migrating to Payload CMS) |
| `apps/orchestrator/` | Temporal Cloud orchestrator — workflow definitions, activities |
| `packages/cityos-contracts/` | Shared TypeScript contracts |
| `packages/cityos-design-tokens/` | Design token definitions |
| `packages/cityos-design-system/` | CSS generator & design utilities |
| `packages/cityos-design-runtime/` | Runtime design token resolution |

## Progress Dashboard

**Overall: 0 / 170 pages (0%) — NEW SPACE**

| # | Section | Progress | Status |
|---|---------|----------|--------|
| 1 | Platform Overview & Architecture | 0/8 (0%) | Not started |
| 2 | Module System & Configuration | 0/6 (0%) | Not started |
| 3 | Core Commerce Extensions | 0/12 (0%) | Not started |
| 4 | Vertical Modules — Marketplace & Listings | 0/8 (0%) | Not started |
| 5 | Vertical Modules — Services & Bookings | 0/8 (0%) | Not started |
| 6 | Vertical Modules — Finance & Insurance | 0/7 (0%) | Not started |
| 7 | Vertical Modules — Content & Social | 0/7 (0%) | Not started |
| 8 | Vertical Modules — Civic & Specialized | 0/10 (0%) | Not started |
| 9 | Multi-Vendor Architecture | 0/10 (0%) | Not started |
| 10 | Custom API Layer | 0/12 (0%) | Not started |
| 11 | Event Subscribers & Workflows | 0/10 (0%) | Not started |
| 12 | Module Links & Entity Relationships | 0/6 (0%) | Not started |
| 13 | Middleware & Security | 0/7 (0%) | Not started |
| 14 | Integration Bridges | 0/10 (0%) | Not started |
| 15 | Database, Migrations & Seed Data | 0/9 (0%) | Not started |
| 16 | Object Storage & Media Serving | 0/6 (0%) | Not started |
| 17 | Platform API & CMS Registry | 0/6 (0%) | Not started |
| 18 | Storefront (Legacy) | 0/10 (0%) | Not started |
| 19 | Shared Packages | 0/6 (0%) | Not started |
| 20 | Deployment & DevOps | 0/8 (0%) | Not started |
| 21 | Orchestrator — Temporal Cloud | 0/7 (0%) | Not started |
| 22 | Cross-Reference Map & Glossary | 0/4 (0%) | Not started |

> `DONE` = Created with content · `PARTIAL` = Needs updating · `TODO` = Not yet created · `PLANNED` = Feature not yet in code · `EXISTING` = Pre-existing page

---

## Tier 1 — Platform Foundations

### 1. Platform Overview & Architecture

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 1.0 | **Platform Overview & Architecture** (index) | `TODO` | — |
| 1.1 | Vision: Headless Commerce for CityOS | `TODO` | — |
| 1.2 | System Architecture & Boundary Diagram | `TODO` | — |
| 1.3 | Technology Stack Reference | `TODO` | — |
| 1.4 | Monorepo Structure (Turborepo + pnpm) | `TODO` | — |
| 1.5 | Medusa v2 Extension Pattern | `TODO` | — |
| 1.6 | System Responsibility Split | `TODO` | — |
| 1.7 | Glossary & Terminology | `TODO` | — |

- `medusa-config.ts`, `turbo.json`, `package.json` (root + `apps/backend/`)
- `apps/backend/src/lib/env-validation.ts`, `apps/backend/src/lib/config.ts`
- `replit.md` (architecture overview)

**Key content:**
- Medusa as headless commerce engine vs. Payload CMS (frontend/CMS) vs. ERPNext (ERP) vs. Fleetbase (logistics)
- 61 custom modules, 489 API routes, 38 subscribers, 23 workflows, 38 links
- Extension pattern: all custom code in `apps/backend/src/`, zero modifications to Medusa source
- Turborepo workspace layout: `apps/backend`, `apps/storefront`, `apps/orchestrator`, `packages/*`

### 2. Module System & Configuration

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 2.0 | **Module System & Configuration** (index) | `TODO` | — |
| 2.1 | Medusa Configuration (`medusa-config.ts`) | `TODO` | — |
| 2.2 | Module Registry (61 Modules) | `TODO` | — |
| 2.3 | Module Anatomy (Models, Service, Index, Migrations) | `TODO` | — |
| 2.4 | Module Keys & Resolution | `TODO` | — |
| 2.5 | Conditional Module Loading (Stripe, SendGrid, Meilisearch) | `TODO` | — |

- `apps/backend/medusa-config.ts` — full module registration with keys and options
- `apps/backend/src/modules/*/index.ts` — module entry points
- `apps/backend/src/modules/*/service.ts` — module service classes
- `apps/backend/src/modules/*/models/*.ts` — MikroORM entity models

**Key content:**
- Module registration in `medusa-config.ts` with `resolve`, `key`, `options` pattern
- `isQueryable: true` flag for queryable modules
- Conditional providers: Stripe payment (requires `STRIPE_API_KEY`), SendGrid notifications (requires `SENDGRID_API_KEY`), Meilisearch search (requires `MEILISEARCH_HOST`)
- Admin panel at `/commerce/admin` with Vite HMR and allowed hosts configuration
- CORS configuration: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`
- JWT and cookie secrets

---

## Tier 2 — Core Commerce Extensions

### 3. Core Commerce Extensions

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 3.0 | **Core Commerce Extensions** (index) | `TODO` | — |
| 3.1 | Cart Extension Module | `TODO` | — |
| 3.2 | Shipping Extension Module | `TODO` | — |
| 3.3 | Inventory Extension Module | `TODO` | — |
| 3.4 | Tax Configuration Module | `TODO` | — |
| 3.5 | Volume Pricing Module | `TODO` | — |
| 3.6 | Promotion Extension Module | `TODO` | — |
| 3.7 | Invoice Module | `TODO` | — |
| 3.8 | Payout Module | `TODO` | — |
| 3.9 | Review Module | `TODO` | — |
| 3.10 | Wishlist Module | `TODO` | — |
| 3.11 | Trade-In Module | `TODO` | — |

- `apps/backend/src/modules/cart-extension/` — `CartMetadata` model
- `apps/backend/src/modules/shipping-extension/` — `CarrierConfig`, `ShippingRate` models
- `apps/backend/src/modules/inventory-extension/` — stock alerts
- `apps/backend/src/modules/tax-config/` — `TaxRule`, `TaxExemption` models
- `apps/backend/src/modules/volume-pricing/` — `VolumePricing`, `VolumePricingTier` models
- `apps/backend/src/modules/promotion-ext/` — `CustomerSegment`, `GiftCardExt`, `ProductBundle`, `Referral` models
- `apps/backend/src/modules/invoice/` — invoice generation
- `apps/backend/src/modules/payout/` — vendor payout processing
- `apps/backend/src/modules/review/` — `Review` model
- `apps/backend/src/modules/wishlist/` — `Wishlist`, `WishlistItem` models
- `apps/backend/src/modules/trade-in/` — `TradeInRequest`, `TradeInOffer` models

---

## Tier 3 — Vertical Modules (27 Verticals)

### 4. Vertical Modules — Marketplace & Listings

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 4.0 | **Marketplace & Listings Verticals** (index) | `TODO` | — |
| 4.1 | Auction Module | `TODO` | — |
| 4.2 | Classified Module | `TODO` | — |
| 4.3 | Real Estate Module | `TODO` | — |
| 4.4 | Automotive Module | `TODO` | — |
| 4.5 | Rental Module | `TODO` | — |
| 4.6 | Digital Product Module | `TODO` | — |
| 4.7 | Crowdfunding Module | `TODO` | — |

- `apps/backend/src/modules/auction/` — `AuctionListing`, `Bid`, `AutoBidRule`, `AuctionEscrow`, `AuctionResult` models
- `apps/backend/src/modules/classified/` — `ClassifiedListing`, `ListingCategory`, `ListingFlag`, `ListingImage`, `ListingOffer` models
- `apps/backend/src/modules/real-estate/` — `PropertyListing`, `AgentProfile`, `LeaseAgreement`, `PropertyDocument`, `PropertyValuation`, `ViewingAppointment` models
- `apps/backend/src/modules/automotive/` — `VehicleListing`, `VehicleService`, `TestDrive`, `PartCatalog`, `TradeIn` models
- `apps/backend/src/modules/rental/` — `RentalProduct`, `RentalAgreement`, `RentalPeriod`, `RentalReturn`, `DamageClaim` models
- `apps/backend/src/modules/digital-product/` — `DigitalAsset`, `DownloadLicense` models
- `apps/backend/src/modules/crowdfunding/` — `Campaign`, `Pledge`, `Backer`, `CampaignUpdate`, `RewardTier` models

**Enum constraints:**
- `classified_listing.listing_type`: `sell`, `buy`, `trade`, `free`, `wanted`
- `classified_listing.condition`: `new`, `like_new`, `good`, `fair`, `poor`

### 5. Vertical Modules — Services & Bookings

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 5.0 | **Services & Bookings Verticals** (index) | `TODO` | — |
| 5.1 | Booking Module | `TODO` | — |
| 5.2 | Restaurant Module | `TODO` | — |
| 5.3 | Healthcare Module | `TODO` | — |
| 5.4 | Travel Module | `TODO` | — |
| 5.5 | Event Ticketing Module | `TODO` | — |
| 5.6 | Freelance Module | `TODO` | — |
| 5.7 | Fitness Module | `TODO` | — |

- `apps/backend/src/modules/booking/` — `Booking`, `Availability`, `ServiceProduct`, `ServiceProvider`, `Reminder` models
- `apps/backend/src/modules/restaurant/` — `Restaurant`, `Menu`, `MenuItem`, `ModifierGroup`, `Modifier`, `TableReservation`, `KitchenOrder` models
- `apps/backend/src/modules/healthcare/` — `Practitioner`, `MedicalRecord`, `LabOrder`, `Prescription` models (in seed data)
- `apps/backend/src/modules/travel/` — `Property`, `RoomType`, `Room`, `Reservation`, `RatePlan`, `GuestProfile`, `Amenity` models
- `apps/backend/src/modules/event-ticketing/` — `Event`, `Venue`, `TicketType`, `Ticket`, `SeatMap`, `CheckIn` models
- `apps/backend/src/modules/freelance/` — `GigListing`, `Proposal`, `Milestone`, `FreelancerProfile` models (in seed data)
- `apps/backend/src/modules/fitness/` — `TrainerProfile`, `ClassSchedule`, `ClassBooking`, `GymMembership`, `WellnessPlan` models

**Enum constraints:**
- `booking.location_type`: `in_person`, `virtual`, `customer_location`
- `event.status`: `draft`, `published`, `live`, `completed`, `cancelled`
- `event.event_type`: `concert`, `conference`, `workshop`, `sports`, `festival`, `webinar`, `meetup`, `other`

### 6. Vertical Modules — Finance & Insurance

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 6.0 | **Finance & Insurance Verticals** (index) | `TODO` | — |
| 6.1 | Financial Product Module | `TODO` | — |
| 6.2 | Insurance Module | `TODO` | — |
| 6.3 | Subscription Module | `TODO` | — |
| 6.4 | Wallet Module | `TODO` | — |
| 6.5 | Loyalty Module | `TODO` | — |
| 6.6 | Membership Module | `TODO` | — |

- `apps/backend/src/modules/financial-product/` — `LoanProduct`, `LoanApplication`, `InsuranceProduct`, `InsurancePolicy`, `InvestmentPlan` models
- `apps/backend/src/modules/insurance/` — insurance plans and policies
- `apps/backend/src/modules/subscription/` — `SubscriptionPlan`, `Subscription`, `SubscriptionItem`, `BillingCycle`, `SubscriptionEvent` models
- `apps/backend/src/modules/wallet/` — `Wallet`, `WalletTransaction` models
- `apps/backend/src/modules/loyalty/` — loyalty programs, accounts, tier_config
- `apps/backend/src/modules/membership/` — membership tiers and management

### 7. Vertical Modules — Content & Social

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 7.0 | **Content & Social Verticals** (index) | `TODO` | — |
| 7.1 | Social Commerce Module | `TODO` | — |
| 7.2 | Affiliate Module | `TODO` | — |
| 7.3 | Advertising Module | `TODO` | — |
| 7.4 | Education Module | `TODO` | — |
| 7.5 | Charity Module | `TODO` | — |
| 7.6 | Grocery Module | `TODO` | — |

- `apps/backend/src/modules/social-commerce/` — `SocialPost`, `SocialShare`, `LiveStream`, `LiveProduct`, `GroupBuy` models
- `apps/backend/src/modules/affiliate/` — `Affiliate`, `ReferralLink`, `ClickTracking`, `AffiliateCommission`, `InfluencerCampaign` models
- `apps/backend/src/modules/advertising/` — `AdAccount`, `AdCampaign`, `AdCreative`, `AdPlacement`, `ImpressionLog` models
- `apps/backend/src/modules/education/` — `Course`, `Lesson`, `Quiz`, `Assignment`, `Enrollment`, `Certificate` models
- `apps/backend/src/modules/charity/` — `CharityOrg`, `DonationCampaign`, `Donation`, `ImpactReport` models
- `apps/backend/src/modules/grocery/` — grocery-specific models

**Enum constraints:**
- `ad_campaign.campaign_type`: `sponsored_listing`, `banner`, `search`, `social`, `email`

### 8. Vertical Modules — Civic & Specialized

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 8.0 | **Civic & Specialized Verticals** (index) | `TODO` | — |
| 8.1 | Government Module | `TODO` | — |
| 8.2 | Legal Module | `TODO` | — |
| 8.3 | Utilities Module | `TODO` | — |
| 8.4 | Parking Module | `TODO` | — |
| 8.5 | Pet Service Module | `TODO` | — |
| 8.6 | Warranty Module | `TODO` | — |
| 8.7 | Quote Module | `TODO` | — |
| 8.8 | Company / B2B Module | `TODO` | — |
| 8.9 | Dispute Module | `TODO` | — |

- `apps/backend/src/modules/government/` — `CitizenProfile`, `ServiceRequest`, `Fine` models (in seed data)
- `apps/backend/src/modules/legal/` — `AttorneyProfile`, legal services
- `apps/backend/src/modules/utilities/` — `UtilityAccount`, `UtilityBill`, `MeterReading`, `UsageRecord` models
- `apps/backend/src/modules/parking/` — `ParkingZone`, parking management
- `apps/backend/src/modules/pet-service/` — `PetProfile`, `VetAppointment`, `GroomingBooking`, `PetProduct` models
- `apps/backend/src/modules/warranty/` — `WarrantyPlan`, `WarrantyClaim`, `RepairOrder`, `ServiceCenter`, `SparePart` models
- `apps/backend/src/modules/quote/` — `Quote`, `QuoteItem` models
- `apps/backend/src/modules/company/` — `Company`, `CompanyUser`, `PurchaseOrder`, `PurchaseOrderItem`, `ApprovalWorkflow`, `PaymentTerms`, `TaxExemption` models
- `apps/backend/src/modules/dispute/` — `Dispute`, `DisputeMessage` models

**Enum constraints:**
- `quote.status`: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `accepted`, `declined`, `expired`

---

## Tier 4 — Multi-Vendor Architecture

### 9. Multi-Vendor Architecture

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 9.0 | **Multi-Vendor Architecture** (index) | `TODO` | — |
| 9.1 | Vendor Module | `TODO` | — |
| 9.2 | Vendor-Product Junction (`VendorProduct`) | `TODO` | — |
| 9.3 | Vendor Order & Order Splitting | `TODO` | — |
| 9.4 | Commission Module | `TODO` | — |
| 9.5 | Marketplace Listings | `TODO` | — |
| 9.6 | Vendor Analytics | `TODO` | — |
| 9.7 | Vendor Portal API (68 routes) | `TODO` | — |
| 9.8 | Vendor Portal Frontend (75 pages) | `TODO` | — |
| 9.9 | Vendor Onboarding Workflow | `TODO` | — |

- `apps/backend/src/modules/vendor/` — `Vendor`, `VendorProduct`, `VendorOrder`, `VendorUser`, `VendorAnalytics`, `MarketplaceListing` models
- `apps/backend/src/modules/commission/` — `CommissionRule`, `CommissionTransaction` models
- `apps/backend/src/api/vendor/` — 68 vendor API routes (products, orders, payouts, disputes, analytics, all 27 verticals)
- `apps/storefront/src/routes/$tenant/$locale/vendor/` — 75 vendor portal frontend pages
- `apps/backend/src/subscribers/vendor-approved.ts`, `vendor-suspended.ts`, `vendor-order-split.ts`
- `apps/backend/src/workflows/vendor/`, `vendor-onboarding.ts`
- `apps/backend/src/links/vendor-commission.ts`, `vendor-freelance.ts`, `vendor-payout.ts`, `vendor-restaurant.ts`, `vendor-store.ts`

---

## Tier 5 — Custom API Layer

### 10. Custom API Layer

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 10.0 | **Custom API Layer** (index) | `TODO` | — |
| 10.1 | Admin API (237 routes) | `TODO` | — |
| 10.2 | Store API (163 routes) | `TODO` | — |
| 10.3 | Vendor API (68 routes) | `TODO` | — |
| 10.4 | Platform API (16 routes) | `TODO` | — |
| 10.5 | Webhook Endpoints (4 providers) | `TODO` | — |
| 10.6 | Health Check Endpoint | `TODO` | — |
| 10.7 | API Route Conventions & Patterns | `TODO` | — |
| 10.8 | Admin Route Reference by Vertical | `TODO` | — |
| 10.9 | Store Route Reference by Vertical | `TODO` | — |
| 10.10 | Vendor Route Reference by Vertical | `TODO` | — |
| 10.11 | Error Handling & Validation | `TODO` | — |

- `apps/backend/src/api/admin/` — 237 routes across 90+ directories (advertising, affiliates, auctions, audit, automotive, availability, b2b, bookings, bundles, cart-extension, channels, charities, classifieds, cms, commission-rules, commissions, companies, consignments, credit, crowdfunding, digital-products, disputes, dropshipping, education, events, event-ticketing, financial-products, fitness, flash-deals, flash-sales, freelance, gift-cards, governance, government, grocery, healthcare, i18n, insurance, integrations, inventory-ext, invoices, legal, loyalty, memberships, metrics, newsletter, nodes, notification-preferences, parking, payouts, personas, pet-services, platform, pricing-tiers, print-on-demand, products, promotion-ext, purchase-orders, quotes, real-estate, region-zones, rentals, restaurants, reviews, service-providers, settings, shipping-ext, social-commerce, subscriptions, tax-config, temporal, tenant, trade-ins, travel, try-before-you-buy, utilities, vendors, volume-deals, volume-pricing, warranties, webhooks, white-label, wishlists)
- `apps/backend/src/api/store/` — 163 routes across 70+ directories (customer-facing endpoints for all verticals)
- `apps/backend/src/api/vendor/` — 68 routes (vendor-specific CRUD for all verticals)
- `apps/backend/src/api/platform/` — 16 routes (capabilities, cms, context, storage, tenants, vendors)
- `apps/backend/src/api/webhooks/` — 4 webhook receivers (Stripe, ERPNext, Fleetbase, Payload CMS)
- `apps/backend/src/api/health/` — health check endpoint
- `apps/backend/src/lib/api-error-handler.ts`, `apps/backend/src/lib/validation.ts`

---

## Tier 6 — Event System & Workflows

### 11. Event Subscribers & Workflows

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 11.0 | **Event Subscribers & Workflows** (index) | `TODO` | — |
| 11.1 | Subscriber Architecture | `TODO` | — |
| 11.2 | Order Lifecycle Subscribers | `TODO` | — |
| 11.3 | Booking Lifecycle Subscribers | `TODO` | — |
| 11.4 | Payment Lifecycle Subscribers | `TODO` | — |
| 11.5 | Subscription Lifecycle Subscribers | `TODO` | — |
| 11.6 | Vendor Lifecycle Subscribers | `TODO` | — |
| 11.7 | Workflow Architecture | `TODO` | — |
| 11.8 | Commerce Workflows (23 definitions) | `TODO` | — |
| 11.9 | Events Module & Outbox | `TODO` | — |

**38 Subscribers:**
- **Order:** `order-placed.ts`, `order-shipped.ts`, `order-cancelled.ts`, `order-returned.ts`
- **Booking:** `booking-created.ts`, `booking-confirmed.ts`, `booking-completed.ts`, `booking-cancelled.ts`, `booking-checked-in.ts`
- **Payment:** `payment-authorized.ts`, `payment-captured.ts`, `payment-failed.ts`, `payment-refunded.ts`
- **Subscription:** `subscription-created.ts`, `subscription-cancelled.ts`, `subscription-paused.ts`, `subscription-resumed.ts`, `subscription-payment-failed.ts`, `subscription-plan-changed.ts`, `subscription-renewal-upcoming.ts`
- **Vendor:** `vendor-approved.ts`, `vendor-suspended.ts`, `vendor-order-split.ts`
- **Other:** `cart-metadata-sync.ts`, `company-created.ts`, `customer-created.ts`, `customer-notification-preferences.ts`, `integration-sync-subscriber.ts`, `inventory-stock-alert.ts`, `payout-completed.ts`, `payout-failed.ts`, `product-updated-analytics.ts`, `purchase-order-submitted.ts`, `quote-accepted.ts`, `quote-approved.ts`, `quote-declined.ts`, `review-created.ts`, `temporal-event-bridge.ts`

**23 Workflows:**
- `auction-lifecycle.ts`, `b2b/`, `booking-confirmation.ts`, `campaign-activation.ts`, `commission-calculation.ts`, `content-moderation.ts`, `dispute-resolution.ts`, `event-ticketing.ts`, `fleet-dispatch.ts`, `hierarchy-sync.ts`, `inventory-replenishment.ts`, `kyc-verification.ts`, `loyalty-reward.ts`, `order-fulfillment.ts`, `payment-reconciliation.ts`, `product-sync.ts`, `return-processing.ts`, `subscription/`, `subscription-renewal.ts`, `tenant-provisioning.ts`, `trade-in-evaluation.ts`, `vendor/`, `vendor-onboarding.ts`

- `apps/backend/src/modules/events/` — `EventOutbox` model (CMS-compatible event outbox)

### 12. Module Links & Entity Relationships

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 12.0 | **Module Links & Entity Relationships** (index) | `TODO` | — |
| 12.1 | Customer Links (12 relationships) | `TODO` | — |
| 12.2 | Product Links (10 relationships) | `TODO` | — |
| 12.3 | Order & Commerce Links (5 relationships) | `TODO` | — |
| 12.4 | Vendor Links (5 relationships) | `TODO` | — |
| 12.5 | Tenant & Node Links (6 relationships) | `TODO` | — |

**38 Link Definitions:**
- **Customer → Extensions:** `customer-company`, `customer-donation`, `customer-insurance`, `customer-loyalty`, `customer-membership`, `customer-notification-preference`, `customer-referral`, `customer-subscription`, `customer-tax-exemption`, `customer-trade-in`, `customer-vehicle`, `customer-wallet`, `customer-wishlist`
- **Product → Verticals:** `product-auction`, `product-classified`, `product-course`, `product-digital-asset`, `product-event`, `product-product-bundle`, `product-rental`, `product-review`, `product-trade-in`, `product-warranty`
- **Order → Extensions:** `order-dispute`, `order-insurance`, `order-vendor`
- **Vendor → Extensions:** `vendor-commission`, `vendor-freelance`, `vendor-payout`, `vendor-restaurant`, `vendor-store`
- **Tenant/Node:** `tenant-node`, `tenant-store`
- **Commerce:** `booking-customer`, `cart-cart-metadata`, `company-invoice`, `inventory-stock-alert`, `node-governance`

---

## Tier 7 — Middleware & Security

### 13. Middleware & Security

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 13.0 | **Middleware & Security** (index) | `TODO` | — |
| 13.1 | Middleware Configuration (`middlewares.ts`) | `TODO` | — |
| 13.2 | CORS Middleware | `TODO` | — |
| 13.3 | Tenant Context Middleware | `TODO` | — |
| 13.4 | Node Context Middleware | `TODO` | — |
| 13.5 | Platform Context Middleware | `TODO` | — |
| 13.6 | Scope Guards | `TODO` | — |

- `apps/backend/src/api/middlewares.ts` — route-level middleware registration with `defineMiddlewares`
- `apps/backend/src/api/middlewares/` — `index.ts`, `tenant-context.ts`, `node-context.ts`, `platform-context.ts`, `scope-guards.ts`
- `apps/backend/src/lib/middleware/` — shared middleware utilities
- `apps/backend/src/lib/tenant-scoping.ts` — tenant isolation enforcement

---

## Tier 8 — Integration Bridges

### 14. Integration Bridges

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 14.0 | **Integration Bridges** (index) | `TODO` | — |
| 14.1 | Integration Architecture | `TODO` | — |
| 14.2 | Payload CMS Integration | `TODO` | — |
| 14.3 | ERPNext Integration | `TODO` | — |
| 14.4 | Fleetbase Integration | `TODO` | — |
| 14.5 | Stripe Webhooks | `TODO` | — |
| 14.6 | Temporal Cloud Client | `TODO` | — |
| 14.7 | Walt.id (Digital Identity) Spec | `TODO` | — |
| 14.8 | Outbox Processor & Circuit Breakers | `TODO` | — |
| 14.9 | Sync Tracker | `TODO` | — |

- `apps/backend/src/lib/integrations/` — `erpnext-spec.ts`, `fleetbase-spec.ts`, `payload-cms-spec.ts`, `temporal-spec.ts`, `waltid-spec.ts`
- `apps/backend/src/api/webhooks/` — `stripe/route.ts`, `erpnext/route.ts`, `fleetbase/route.ts`, `payload-cms/route.ts`
- `apps/backend/src/lib/temporal-client.ts`, `temporal-activities.ts`, `dynamic-workflow-client.ts`
- `apps/backend/src/lib/platform/outbox-processor.ts`, `sync-tracker.ts`
- `apps/backend/src/subscribers/integration-sync-subscriber.ts`, `temporal-event-bridge.ts`

**Cross-links to Payload CMS docs:**
- Section 25 (Commerce — Medusa Integration) in Payload docs: `medusaClient.ts`, `commerceAccessControl.ts`, `eventBridge.ts`, `nodeMapping.ts`, `poiProductSync.ts`
- Section 27 (ERP — ERPNext Integration): BFF routes, webhooks
- Section 28 (Logistics — Fleetbase Integration): BFF routes, webhooks

---

## Tier 9 — Database & Seed Data

### 15. Database, Migrations & Seed Data

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 15.0 | **Database, Migrations & Seed Data** (index) | `TODO` | — |
| 15.1 | Database Architecture (PostgreSQL / Replit Neon) | `TODO` | — |
| 15.2 | MikroORM Entity Conventions | `TODO` | — |
| 15.3 | Migration History (64+ module migrations) | `TODO` | — |
| 15.4 | Enum Constraints Reference | `TODO` | — |
| 15.5 | Seed Data Infrastructure | `TODO` | — |
| 15.6 | Seed Scripts Reference (42 scripts) | `TODO` | — |
| 15.7 | Saudi Arabia Market Data | `TODO` | — |
| 15.8 | Image & Media Seed Policy | `TODO` | — |

- `apps/backend/src/modules/*/migrations/` — 64+ MikroORM migration files
- `apps/backend/src/scripts/` — 42 seed and utility scripts
- `apps/backend/src/scripts/seed-utils.ts` — centralized image URLs (`getImage()`, `getThumb()`), Saudi pricing helpers, city/phone generators
- `apps/backend/src/scripts/seed-verticals.ts` (+ parts 1–7) — seeds 27 vertical modules with Saudi-themed data
- `apps/backend/src/scripts/seed-all-with-images.ts` — master seed: verticals + 31 infrastructure/sub-entity modules
- `apps/backend/src/scripts/seed-master.ts` — core Medusa data (products, categories, regions)

**42 Seed Scripts:**
- `seed.ts`, `seed-all.ts`, `seed-all-services.ts`, `seed-all-with-images.ts`, `seed-catalog.ts`, `seed-commerce.ts`, `seed-companies.ts`, `seed-complete.ts`, `seed-core.ts`, `seed-default-tenant.ts`, `seed-fix-remaining.ts`, `seed-master.ts`, `seed-multi-tenant.ts`, `seed-platform.ts`, `seed-products-rich.ts`, `seed-saudi-arabia.ts`, `seed-saudi-data.ts`, `seed-saudi-fresh.ts`, `seed-saudi-products.ts`, `seed-services.ts`, `seed-subscriptions.ts`, `seed-utils.ts`, `seed-vendors.ts`, `seed-verticals.ts` (+ parts 1–7), `seed-volume-pricing.ts`, `setup-defaults.ts`, `setup-saudi-sales-channel.ts`, `test-seed.ts`
- **Utilities:** `db-verify.ts`, `fix-remaining-thumbnails.ts`, `fix-thumbnails.ts`, `migrate-images-and-seed-gaps.sql`, `migrate-images-to-bucket.ts`, `update-product-images.ts`, `upload-media.ts`

**Image Policy:** All images use Replit Object Storage bucket paths (`/platform/storage/serve?path=...`). Zero Unsplash URLs.

---

## Tier 10 — Object Storage & Media

### 16. Object Storage & Media Serving

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 16.0 | **Object Storage & Media Serving** (index) | `TODO` | — |
| 16.1 | Object Storage Service | `TODO` | — |
| 16.2 | Object ACL & Access Control | `TODO` | — |
| 16.3 | Storage Serve Endpoint | `TODO` | — |
| 16.4 | Upload Buffer Endpoint | `TODO` | — |
| 16.5 | Image Migration from Unsplash to Bucket | `TODO` | — |

- `apps/backend/src/lib/storage/objectStorage.ts` — Replit Object Storage client
- `apps/backend/src/lib/storage/objectAcl.ts` — access control for stored objects
- `apps/backend/src/lib/storage/index.ts` — storage exports
- `apps/backend/src/api/platform/storage/serve/route.ts` — serves images from bucket `replit-objstore-9ae4a2f3-0592-42b1-908d-b04c0c0e79c4`
- `apps/backend/src/api/platform/storage/route.ts` — storage management endpoint
- `apps/backend/src/api/platform/storage/upload-buffer/route.ts` — buffered upload endpoint

---

## Tier 11 — Platform API & CMS Registry

### 17. Platform API & CMS Registry

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 17.0 | **Platform API & CMS Registry** (index) | `TODO` | — |
| 17.1 | CMS Registry (27 Verticals + Pages) | `TODO` | — |
| 17.2 | CMS Navigation API | `TODO` | — |
| 17.3 | CMS Page Resolution | `TODO` | — |
| 17.4 | Platform Context Endpoint | `TODO` | — |
| 17.5 | Capabilities Endpoint | `TODO` | — |

- `apps/backend/src/lib/platform/cms-registry.ts` — defines 27 commerce verticals + additional pages, supports `countryCode` and `regionZone`
- `apps/backend/src/lib/platform/registry.ts` — platform service registry
- `apps/backend/src/lib/platform/helpers.ts` — platform utilities
- `apps/backend/src/lib/platform/index.ts` — platform exports
- `apps/backend/src/api/platform/cms/` — `navigation/`, `navigations/`, `pages/`, `resolve/`, `verticals/` routes
- `apps/backend/src/api/platform/context/route.ts` — tenant/node context resolution
- `apps/backend/src/api/platform/capabilities/route.ts` — capability/RBAC query
- `apps/backend/src/modules/cms-content/` — `CmsPage`, `CmsNavigation` models

---

## Tier 12 — Infrastructure Modules

### Note: Infrastructure Modules

These modules provide cross-cutting platform capabilities rather than commerce verticals:

| Module | Models | Purpose |
|--------|--------|---------|
| `tenant` | `Tenant`, `TenantUser`, `TenantSettings`, `TenantBilling`, `TenantPoi`, `TenantRelationship`, `ServiceChannel` | Multi-tenant isolation & configuration |
| `store` | `Store` (CityOS extension) | Extended store metadata |
| `node` | Node hierarchy models | 5-level node hierarchy (CITY→DISTRICT→ZONE→FACILITY→ASSET) |
| `governance` | Governance models | Policy inheritance, compliance |
| `persona` | `Persona`, `PersonaAssignment` | 6-axis persona system |
| `channel` | `SalesChannelMapping` | Multi-channel distribution |
| `region-zone` | `RegionZoneMapping` | Geographic region/zone configuration |
| `i18n` | i18n models | Internationalization (en/fr/ar + RTL) |
| `notification-preferences` | Notification preference models | Per-customer notification settings |
| `analytics` | `AnalyticsEvent`, `Dashboard`, `Report` | Business intelligence & reporting |
| `audit` | `AuditLog` | Audit trail |
| `events` | `EventOutbox` | CMS-compatible event outbox pattern |
| `cms-content` | `CmsPage`, `CmsNavigation` | Local CMS content mirror |

These modules are documented in their respective sections (Sections 2, 13, 17) rather than receiving individual vertical pages.

---

## Tier 13 — Storefront (Legacy)

### 18. Storefront (Legacy — Migration to Payload CMS)

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 18.0 | **Storefront (Legacy)** (index) | `TODO` | — |
| 18.1 | TanStack Start + React Architecture | `TODO` | — |
| 18.2 | Route Architecture (349 routes) | `TODO` | — |
| 18.3 | Customer Account Pages (30 pages) | `TODO` | — |
| 18.4 | Vertical Detail Pages (65+ pages) | `TODO` | — |
| 18.5 | Manage Dashboard (101 pages) | `TODO` | — |
| 18.6 | Vendor Portal (75 pages) | `TODO` | — |
| 18.7 | B2B Portal | `TODO` | — |
| 18.8 | Component Library | `TODO` | — |
| 18.9 | Migration Plan to Payload CMS Frontend | `TODO` | — |

- `apps/storefront/` — TanStack Start + React application
- `apps/storefront/src/routes/$tenant/$locale/` — tenant-scoped, locale-aware routing (349 total route files)
- `apps/storefront/src/routes/$tenant/$locale/account/` — 30 customer account pages (orders, subscriptions, bookings, wallet, loyalty, wishlist, disputes, invoices, etc.)
- `apps/storefront/src/routes/$tenant/$locale/manage/` — 101 admin management pages (all verticals + infrastructure)
- `apps/storefront/src/routes/$tenant/$locale/vendor/` — 75 vendor portal pages (products, orders, payouts, all verticals)
- `apps/storefront/src/components/` — 100+ shared components (auth, cart, checkout, blocks, commerce, etc.)
- `apps/storefront/vite.config.ts`, `tailwind.config.js`, `tsconfig.json`

**Storefront Vertical Categories (80+ route directories):**
account, affiliate, apps, auctions, automotive, b2b, blog, bookings, bundles, business, campaigns, cart, categories, charity, checkout, classifieds, compare, consignment, credit, crowdfunding, digital, dropshipping, education, events, event-ticketing, financial, fitness, flash-deals, freelance, gift-cards, government, grocery, healthcare, help, insurance, legal, loyalty-program, manage, marketplace, memberships, newsletter, order, parking, pet-services, places, print-on-demand, products, quotes, real-estate, rentals, restaurants, returns, social-commerce, subscriptions, trade-in, travel, try-before-you-buy, vendor, vendors, verify, volume-deals, wallet, warranties, white-label, wishlist

---

## Tier 14 — Shared Packages

### 19. Shared Packages

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 19.0 | **Shared Packages** (index) | `TODO` | — |
| 19.1 | `cityos-contracts` — TypeScript Contracts | `TODO` | — |
| 19.2 | `cityos-design-tokens` — Design Token Definitions | `TODO` | — |
| 19.3 | `cityos-design-system` — CSS Generator | `TODO` | — |
| 19.4 | `cityos-design-runtime` — Runtime Token Resolution | `TODO` | — |
| 19.5 | `lodash-set-safe` — Safe Deep Set Utility | `TODO` | — |

- `packages/cityos-contracts/` — shared TypeScript type definitions and interfaces
- `packages/cityos-design-tokens/` — design token definitions (colors, spacing, typography)
- `packages/cityos-design-system/` — CSS generator and design utilities
- `packages/cityos-design-runtime/` — runtime design token resolution and theme application
- `packages/lodash-set-safe/` — safe deep object setter (CJS + ESM)

---

## Tier 15 — Deployment & DevOps

### 20. Deployment & DevOps

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 20.0 | **Deployment & DevOps** (index) | `TODO` | — |
| 20.1 | Development Startup (`start.sh`) | `TODO` | — |
| 20.2 | Production Build (`build-production.sh`) | `TODO` | — |
| 20.3 | Production Startup (`start-production.sh`) | `TODO` | — |
| 20.4 | Production Proxy (`prod-proxy.js`) | `TODO` | — |
| 20.5 | Replit VM Configuration | `TODO` | — |
| 20.6 | Environment Variables & Secrets | `TODO` | — |
| 20.7 | Health Responder Pattern | `TODO` | — |

- `start.sh` — development startup (Medusa backend on :9000, storefront on :5000)
- `scripts/build-production.sh` — production build pipeline
- `scripts/start-production.sh` — production startup with health responder pattern
- `prod-proxy.js` — production proxy on :5000 routing API→:9000, UI→:5173
- `.replit` — Replit deployment configuration (VM target)

**Production Architecture:**
1. Lightweight HTTP server binds :5000 immediately (passes health check)
2. Medusa backend boots on :9000 (up to 4 min, `--max-old-space-size=1024`)
3. Health responder killed after backend ready
4. Storefront starts on :5173 (Nitro SSR or `server.mjs` wrapper)
5. `prod-proxy.js` takes over :5000, routing API→backend, UI→storefront

---

## Tier 16 — Orchestrator

### 21. Orchestrator — Temporal Cloud

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 21.0 | **Orchestrator — Temporal Cloud** (index) | `TODO` | — |
| 21.1 | Orchestrator Architecture | `TODO` | — |
| 21.2 | Temporal Client Configuration | `TODO` | — |
| 21.3 | Temporal Activities | `TODO` | — |
| 21.4 | Dynamic Workflow Client | `TODO` | — |
| 21.5 | Event Dispatcher | `TODO` | — |
| 21.6 | Monitoring & Metrics | `TODO` | — |

- `apps/orchestrator/` — standalone Temporal Cloud orchestrator app
- `apps/backend/src/lib/temporal-client.ts` — Temporal client for backend
- `apps/backend/src/lib/temporal-activities.ts` — activity definitions
- `apps/backend/src/lib/dynamic-workflow-client.ts` — dynamic workflow dispatch
- `apps/backend/src/lib/event-dispatcher.ts` — cross-system event dispatch
- `apps/backend/src/lib/monitoring/` — `logger.ts`, `metrics.ts`

**Cross-links to Payload CMS docs:**
- Section 26 (Workflow Engine — Temporal) in Payload docs

---

## Tier 17 — Cross-Reference & Glossary

### 22. Cross-Reference Map & Glossary

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 22.0 | **Cross-Reference Map** (index) | `TODO` | — |
| 22.1 | Medusa ↔ Payload CMS Cross-Reference | `TODO` | — |
| 22.2 | Module → API Route → Subscriber → Workflow Map | `TODO` | — |
| 22.3 | Glossary & Terminology | `TODO` | — |

---

## Appendix A — Module Inventory (61 Modules)

Complete list of all custom Medusa modules with model counts:

| # | Module | Key | Models | Category |
|---|--------|-----|--------|----------|
| 1 | `advertising` | `advertising` | AdAccount, AdCampaign, AdCreative, AdPlacement, ImpressionLog | Content & Social |
| 2 | `affiliate` | `affiliate` | Affiliate, ReferralLink, ClickTracking, AffiliateCommission, InfluencerCampaign | Content & Social |
| 3 | `analytics` | `analytics` | AnalyticsEvent, Dashboard, Report | Infrastructure |
| 4 | `auction` | `auction` | AuctionListing, Bid, AutoBidRule, AuctionEscrow, AuctionResult | Marketplace |
| 5 | `audit` | `audit` | AuditLog | Infrastructure |
| 6 | `automotive` | `automotive` | VehicleListing, VehicleService, TestDrive, PartCatalog, TradeIn | Marketplace |
| 7 | `booking` | `booking` | Booking, Availability, ServiceProduct, ServiceProvider, Reminder | Services |
| 8 | `cart-extension` | `cartExtension` | CartMetadata | Core Extension |
| 9 | `channel` | `channel` | SalesChannelMapping | Infrastructure |
| 10 | `charity` | `charity` | CharityOrg, DonationCampaign, Donation, ImpactReport | Content & Social |
| 11 | `classified` | `classified` | ClassifiedListing, ListingCategory, ListingFlag, ListingImage, ListingOffer | Marketplace |
| 12 | `cms-content` | `cmsContent` | CmsPage, CmsNavigation | Infrastructure |
| 13 | `commission` | `commission` | CommissionRule, CommissionTransaction | Multi-Vendor |
| 14 | `company` | `company` | Company, CompanyUser, PurchaseOrder, PurchaseOrderItem, ApprovalWorkflow, PaymentTerms, TaxExemption | B2B |
| 15 | `crowdfunding` | `crowdfunding` | Campaign, Pledge, Backer, CampaignUpdate, RewardTier | Marketplace |
| 16 | `digital-product` | `digitalProduct` | DigitalAsset, DownloadLicense | Core Extension |
| 17 | `dispute` | `dispute` | Dispute, DisputeMessage | Core Extension |
| 18 | `education` | `education` | Course, Lesson, Quiz, Assignment, Enrollment, Certificate | Content & Social |
| 19 | `events` | `events` | EventOutbox | Infrastructure |
| 20 | `event-ticketing` | `eventTicketing` | Event, Venue, TicketType, Ticket, SeatMap, CheckIn | Services |
| 21 | `financial-product` | `financialProduct` | LoanProduct, LoanApplication, InsuranceProduct, InsurancePolicy, InvestmentPlan | Finance |
| 22 | `fitness` | `fitness` | TrainerProfile, ClassSchedule, ClassBooking, GymMembership, WellnessPlan | Services |
| 23 | `freelance` | `freelance` | GigListing, Proposal, Milestone, FreelancerProfile (via seed) | Services |
| 24 | `governance` | `governance` | Governance models | Infrastructure |
| 25 | `government` | `government` | CitizenProfile, ServiceRequest, Fine (via seed) | Civic |
| 26 | `grocery` | `grocery` | Grocery-specific models | Content & Social |
| 27 | `healthcare` | `healthcare` | Practitioner, MedicalRecord, LabOrder, Prescription (via seed) | Services |
| 28 | `i18n` | `i18n` | i18n models | Infrastructure |
| 29 | `insurance` | `insurance` | Insurance plans and policies | Finance |
| 30 | `inventory-extension` | `inventoryExtension` | Stock alert models | Core Extension |
| 31 | `invoice` | `invoice` | Invoice models | Core Extension |
| 32 | `legal` | `legal` | AttorneyProfile, legal services | Civic |
| 33 | `loyalty` | `loyalty` | Loyalty program, accounts, tier_config | Finance |
| 34 | `membership` | `membership` | Membership tiers | Finance |
| 35 | `node` | `node` | Node hierarchy models | Infrastructure |
| 36 | `notification-preferences` | `notificationPreferences` | Notification preference models | Infrastructure |
| 37 | `parking` | `parking` | ParkingZone | Civic |
| 38 | `payout` | `payout` | Payout models | Multi-Vendor |
| 39 | `persona` | `persona` | Persona, PersonaAssignment | Infrastructure |
| 40 | `pet-service` | `petService` | PetProfile, VetAppointment, GroomingBooking, PetProduct | Civic |
| 41 | `promotion-ext` | `promotionExt` | CustomerSegment, GiftCardExt, ProductBundle, Referral | Core Extension |
| 42 | `quote` | `quote` | Quote, QuoteItem | B2B |
| 43 | `real-estate` | `realEstate` | PropertyListing, AgentProfile, LeaseAgreement, PropertyDocument, PropertyValuation, ViewingAppointment | Marketplace |
| 44 | `region-zone` | `regionZone` | RegionZoneMapping | Infrastructure |
| 45 | `rental` | `rental` | RentalProduct, RentalAgreement, RentalPeriod, RentalReturn, DamageClaim | Marketplace |
| 46 | `restaurant` | `restaurant` | Restaurant, Menu, MenuItem, ModifierGroup, Modifier, TableReservation, KitchenOrder | Services |
| 47 | `review` | `review` | Review | Core Extension |
| 48 | `shipping-extension` | `shippingExtension` | CarrierConfig, ShippingRate | Core Extension |
| 49 | `social-commerce` | `socialCommerce` | SocialPost, SocialShare, LiveStream, LiveProduct, GroupBuy | Content & Social |
| 50 | `store` | `store` | Store (CityOS extension) | Infrastructure |
| 51 | `subscription` | `subscription` | SubscriptionPlan, Subscription, SubscriptionItem, BillingCycle, SubscriptionEvent | Finance |
| 52 | `tax-config` | `taxConfig` | TaxRule, TaxExemption | Core Extension |
| 53 | `tenant` | `tenant` | Tenant, TenantUser, TenantSettings, TenantBilling, TenantPoi, TenantRelationship, ServiceChannel | Infrastructure |
| 54 | `trade-in` | `tradeIn` | TradeInRequest, TradeInOffer | Core Extension |
| 55 | `travel` | `travel` | Property, RoomType, Room, Reservation, RatePlan, GuestProfile, Amenity | Services |
| 56 | `utilities` | `utilities` | UtilityAccount, UtilityBill, MeterReading, UsageRecord | Civic |
| 57 | `vendor` | `vendor` | Vendor, VendorProduct, VendorOrder, VendorUser, VendorAnalytics, MarketplaceListing | Multi-Vendor |
| 58 | `volume-pricing` | `volumePricing` | VolumePricing, VolumePricingTier | Core Extension |
| 59 | `wallet` | `wallet` | Wallet, WalletTransaction | Finance |
| 60 | `warranty` | `warranty` | WarrantyPlan, WarrantyClaim, RepairOrder, ServiceCenter, SparePart | Marketplace |
| 61 | `wishlist` | `wishlist` | Wishlist, WishlistItem | Core Extension |

## Appendix B — API Route Summary

| API Category | Route Count | Scope |
|-------------|-------------|-------|
| Admin API | 237 | Full CRUD for all modules, admin-only operations |
| Store API | 163 | Customer-facing read + create operations for all verticals |
| Vendor API | 68 | Vendor-scoped CRUD for products, orders, payouts, all verticals |
| Platform API | 16 | CMS registry, storage serving, tenant context, capabilities |
| Webhooks | 4 | Stripe, ERPNext, Fleetbase, Payload CMS |
| Health | 1 | Health check |
| **Total** | **489** | |

## Appendix C — Cross-Reference Map

Topics that span both the Medusa space and the Payload CMS space:

| Concept | Medusa Space (Primary) | Payload CMS Space (Reference) |
|---------|------------------------|-------------------------------|
| Commerce Engine | §1 Platform Overview | §25 Commerce — Medusa Integration |
| Multi-Tenancy | §2.1, §13.3 Tenant Middleware | §2 Multi-Tenancy & Node Hierarchy |
| RBAC & Governance | §13 Middleware & Security | §3 Security & RBAC, §4 Governance |
| Vertical Modules (27) | §4–§8 Vertical Modules | §14 Domain Package System (37 domains) |
| Multi-Vendor | §9 Multi-Vendor Architecture | §25.5 POI Product Sync |
| API Layer | §10 Custom API Layer | §23 API Architecture (BFF layer) |
| Event System | §11 Subscribers & Workflows | §30 Event-Driven Architecture |
| Payload CMS Sync | §14.2 Payload CMS Integration | §25.3 Commerce Event Bridge |
| ERPNext Sync | §14.3 ERPNext Integration | §27 ERP — ERPNext Integration |
| Fleetbase Sync | §14.4 Fleetbase Integration | §28 Logistics — Fleetbase Integration |
| Temporal Workflows | §21 Orchestrator | §26 Workflow Engine — Temporal |
| Database | §15 Database & Migrations | §18 Database & Data Model |
| Object Storage | §16 Object Storage | §16 Storage Architecture |
| Design System | §19 Shared Packages | §13 Design System & Theming |
| Storefront | §18 Storefront (Legacy) | §37 Frontend Architecture |
| Deployment | §20 Deployment & DevOps | §38 DevOps & Deployment |
| Persona System | §2 Module System (persona module) | §21 Multi-Axis Persona System |
| POI System | §17 Platform CMS Registry | §20 POI Spatial Identity Engine |

## Appendix D — Enum Constraints Reference

| Table | Column | Valid Values |
|-------|--------|-------------|
| `booking` | `location_type` | `in_person`, `virtual`, `customer_location` |
| `event` | `status` | `draft`, `published`, `live`, `completed`, `cancelled` |
| `event` | `event_type` | `concert`, `conference`, `workshop`, `sports`, `festival`, `webinar`, `meetup`, `other` |
| `ad_campaign` | `campaign_type` | `sponsored_listing`, `banner`, `search`, `social`, `email` |
| `classified_listing` | `listing_type` | `sell`, `buy`, `trade`, `free`, `wanted` |
| `classified_listing` | `condition` | `new`, `like_new`, `good`, `fair`, `poor` |
| `quote` | `status` | `draft`, `submitted`, `under_review`, `approved`, `rejected`, `accepted`, `declined`, `expired` |
| `persona` | `category` | `consumer`, `creator`, `business`, `cityops`, `platform` |

## Appendix E — Page Template

Each detail page should follow this standard structure:

```
# [Section#] — [Page Title]

**Status:** `TODO` | `DONE` | `PARTIAL`
**Source:** `apps/backend/src/modules/[module]/...`

## Overview
One-paragraph description of what this module/feature does.

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Primary key |
| ... | ... | ... | ... |

## Service Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| list | filters, config | [Entity][] | List with pagination |
| ... | ... | ... | ... |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /admin/[resource] | Admin | List all |
| POST | /admin/[resource] | Admin | Create new |
| GET | /store/[resource] | Store | Customer-facing list |
| ... | ... | ... | ... |

## Subscribers

| Event | Handler | Description |
|-------|---------|-------------|
| [entity].created | handle[Entity]Created | ... |

## Workflows

| Workflow | Trigger | Steps | Description |
|----------|---------|-------|-------------|
| [workflow-name] | [event] | ... | ... |

## Links (Entity Relationships)

| Link | From | To | Type | Description |
|------|------|-----|------|-------------|
| product-[entity] | Product | [Entity] | 1:1 | Links product to ... |

## Cross-References
- Payload CMS: §[N] — [Related Section]
- Related Modules: §[N] — [Module Name]

---
_Source:_ `apps/backend/src/modules/[module]/`
_Parent:_ §[N] — [Section Name]
```
