# Dakkah CityOS — Medusa Commerce Engine Documentation Plan

**Space:** Software Development (`98310`) · **Homepage:** [Medusa Commerce Engine](https://dakkah.atlassian.net/wiki/spaces/SD/pages/56393848) · **Updated:** February 19, 2026

**Companion Space:** Software Development (`98310`) — Payload CMS documentation
**Cross-Link:** Section 25 (Commerce — Medusa Integration) in Payload docs links here

**Confluence Page IDs:**

| Section | Title | Page ID |
|---------|-------|---------|
| Homepage | Medusa Commerce Engine — Documentation | 56393848 |
| 1 | Platform Overview and Architecture | 56262754 |
| 2 | Module System and Configuration | 56262763 |
| 3 | Core Commerce Extensions | 56262772 |
| 4 | Vertical Modules — Marketplace and Listings | 56262781 |
| 5 | Vertical Modules — Services and Bookings | 56262790 |
| 6 | Vertical Modules — Finance and Insurance | 56262799 |
| 7 | Vertical Modules — Content and Social | 56262808 |
| 8 | Vertical Modules — Civic and Specialized | 56262817 |
| 9 | Multi-Vendor Architecture | 56393877 |
| 10 | Custom API Layer | 56393886 |
| 11 | Workflows | 56230026 |
| 12 | Event Subscribers | 56230045 |
| 13 | Module Links | 56918056 |
| 14 | Infrastructure Modules | 55804342 |
| 15 | Integration Layer | 56230064 |
| 16 | Database and Migrations | 56098919 |
| 17 | Seed Data and Scripts | 56262837 |
| 18 | Storefront Application | 56262857 |
| 19 | Authentication and RBAC | 56983650 |
| 20 | Deployment and DevOps | 56688758 |
| 21 | Testing and Quality | 56262876 |
| 22 | Appendices and Reference | 55935079 |

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

**Overall: 22 / 170 pages (13%) — All Section Index Pages Created**

| # | Section | Page ID | Progress | Status |
|---|---------|---------|----------|--------|
| 1 | Platform Overview & Architecture | 56262754 | 1/8 (13%) | Index DONE |
| 2 | Module System & Configuration | 56262763 | 1/6 (17%) | Index DONE |
| 3 | Core Commerce Extensions | 56262772 | 1/12 (8%) | Index DONE |
| 4 | Vertical Modules — Marketplace & Listings | 56262781 | 1/8 (13%) | Index DONE |
| 5 | Vertical Modules — Services & Bookings | 56262790 | 1/8 (13%) | Index DONE |
| 6 | Vertical Modules — Finance & Insurance | 56262799 | 1/7 (14%) | Index DONE |
| 7 | Vertical Modules — Content & Social | 56262808 | 1/7 (14%) | Index DONE |
| 8 | Vertical Modules — Civic & Specialized | 56262817 | 1/10 (10%) | Index DONE |
| 9 | Multi-Vendor Architecture | 56393877 | 1/10 (10%) | Index DONE |
| 10 | Custom API Layer | 56393886 | 1/12 (8%) | Index DONE |
| 11 | Workflows | 56230026 | 1/8 (13%) | Index DONE |
| 12 | Event Subscribers | 56230045 | 1/10 (10%) | Index DONE |
| 13 | Module Links | 56918056 | 1/9 (11%) | Index DONE |
| 14 | Infrastructure Modules | 55804342 | 1/14 (7%) | Index DONE |
| 15 | Integration Layer | 56230064 | 1/11 (9%) | Index DONE |
| 16 | Database & Migrations | 56098919 | 1/8 (13%) | Index DONE |
| 17 | Seed Data & Scripts | 56262837 | 1/8 (13%) | Index DONE |
| 18 | Storefront Application | 56262857 | 1/11 (9%) | Index DONE |
| 19 | Authentication & RBAC | 56983650 | 1/6 (17%) | Index DONE |
| 20 | Deployment & DevOps | 56688758 | 1/9 (11%) | Index DONE |
| 21 | Testing & Quality | 56262876 | 1/6 (17%) | Index DONE |
| 22 | Appendices & Reference | 55935079 | 1/12 (8%) | Index DONE |

> `DONE` = Created with content · `PARTIAL` = Needs updating · `TODO` = Not yet created · `PLANNED` = Feature not yet in code · `EXISTING` = Pre-existing page

---

## Detailed Section Child Pages

### 1. Platform Overview & Architecture (Page ID: 56262754)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 1.1 | Vision: Headless Commerce for CityOS | `TODO` | `replit.md`, `medusa-config.ts` |
| 1.2 | System Architecture & Boundary Diagram | `TODO` | Architecture overview |
| 1.3 | Technology Stack Reference | `TODO` | `package.json` files |
| 1.4 | Monorepo Structure (Turborepo + pnpm) | `TODO` | `turbo.json`, workspace config |
| 1.5 | Medusa v2 Extension Pattern | `TODO` | `apps/backend/src/modules/*/index.ts` |
| 1.6 | System Responsibility Split | `TODO` | Medusa vs Payload vs ERPNext vs Fleetbase |
| 1.7 | Glossary & Terminology | `TODO` | All docs |

### 2. Module System & Configuration (Page ID: 56262763)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 2.1 | Medusa Configuration (`medusa-config.ts`) | `TODO` | `apps/backend/medusa-config.ts` |
| 2.2 | Module Registry (61 Modules) | `TODO` | All module `index.ts` files |
| 2.3 | Module Anatomy (Models, Service, Index, Migrations) | `TODO` | Module structure pattern |
| 2.4 | Module Keys & Resolution | `TODO` | `medusa-config.ts` keys |
| 2.5 | Conditional Module Loading | `TODO` | Stripe, SendGrid, Meilisearch |

### 3. Core Commerce Extensions (Page ID: 56262772)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 3.1 | Cart Extension Module | `TODO` | `modules/cart-extension/` |
| 3.2 | Shipping Extension Module | `TODO` | `modules/shipping-extension/` |
| 3.3 | Inventory Extension Module | `TODO` | `modules/inventory-extension/` |
| 3.4 | Tax Configuration Module | `TODO` | `modules/tax-config/` |
| 3.5 | Volume Pricing Module | `TODO` | `modules/volume-pricing/` |
| 3.6 | Promotion Extension Module | `TODO` | `modules/promotion-ext/` |
| 3.7 | Invoice Module | `TODO` | `modules/invoice/` |
| 3.8 | Payout Module | `TODO` | `modules/payout/` |
| 3.9 | Review Module | `TODO` | `modules/review/` |
| 3.10 | Wishlist Module | `TODO` | `modules/wishlist/` |
| 3.11 | Trade-In Module | `TODO` | `modules/trade-in/` |

### 4. Marketplace & Listings Verticals (Page ID: 56262781)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 4.1 | Auction Module | `TODO` | `modules/auction/` |
| 4.2 | Classified Module | `TODO` | `modules/classified/` |
| 4.3 | Real Estate Module | `TODO` | `modules/real-estate/` |
| 4.4 | Automotive Module | `TODO` | `modules/automotive/` |
| 4.5 | Rental Module | `TODO` | `modules/rental/` |
| 4.6 | Digital Product Module | `TODO` | `modules/digital-product/` |
| 4.7 | Crowdfunding Module | `TODO` | `modules/crowdfunding/` |

### 5. Services & Bookings Verticals (Page ID: 56262790)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 5.1 | Booking Module | `TODO` | `modules/booking/` |
| 5.2 | Restaurant Module | `TODO` | `modules/restaurant/` |
| 5.3 | Healthcare Module | `TODO` | `modules/healthcare/` |
| 5.4 | Travel Module | `TODO` | `modules/travel/` |
| 5.5 | Event Ticketing Module | `TODO` | `modules/event-ticketing/` |
| 5.6 | Freelance Module | `TODO` | `modules/freelance/` |
| 5.7 | Fitness Module | `TODO` | `modules/fitness/` |

### 6. Finance & Insurance Verticals (Page ID: 56262799)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 6.1 | Financial Product Module | `TODO` | `modules/financial-product/` |
| 6.2 | Insurance Module | `TODO` | `modules/insurance/` |
| 6.3 | Subscription Module | `TODO` | `modules/subscription/` |
| 6.4 | Wallet Module | `TODO` | `modules/wallet/` |
| 6.5 | Loyalty Module | `TODO` | `modules/loyalty/` |
| 6.6 | Membership Module | `TODO` | `modules/membership/` |

### 7. Content & Social Verticals (Page ID: 56262808)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 7.1 | Social Commerce Module | `TODO` | `modules/social-commerce/` |
| 7.2 | Affiliate Module | `TODO` | `modules/affiliate/` |
| 7.3 | Advertising Module | `TODO` | `modules/advertising/` |
| 7.4 | Education Module | `TODO` | `modules/education/` |
| 7.5 | Charity Module | `TODO` | `modules/charity/` |
| 7.6 | Grocery Module | `TODO` | `modules/grocery/` |

### 8. Civic & Specialized Verticals (Page ID: 56262817)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 8.1 | Government Module | `TODO` | `modules/government/` |
| 8.2 | Legal Module | `TODO` | `modules/legal/` |
| 8.3 | Utilities Module | `TODO` | `modules/utilities/` |
| 8.4 | Parking Module | `TODO` | `modules/parking/` |
| 8.5 | Pet Service Module | `TODO` | `modules/pet-service/` |
| 8.6 | Warranty Module | `TODO` | `modules/warranty/` |
| 8.7 | Quote Module | `TODO` | `modules/quote/` |
| 8.8 | Company / B2B Module | `TODO` | `modules/company/` |
| 8.9 | Dispute Module | `TODO` | `modules/dispute/` |

### 9. Multi-Vendor Architecture (Page ID: 56393877)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 9.1 | Vendor Module | `TODO` | `modules/vendor/` |
| 9.2 | Vendor-Product Junction | `TODO` | `VendorProduct` model |
| 9.3 | Vendor Order & Order Splitting | `TODO` | `VendorOrder` model |
| 9.4 | Commission Module | `TODO` | `modules/commission/` |
| 9.5 | Marketplace Listings | `TODO` | `MarketplaceListing` model |
| 9.6 | Vendor Analytics | `TODO` | `VendorAnalytics` model |
| 9.7 | Vendor Portal API (68 routes) | `TODO` | `api/vendor/` |
| 9.8 | Vendor Portal Frontend (73 pages) | `TODO` | `storefront/vendor/` |
| 9.9 | Vendor Onboarding Workflow | `TODO` | `workflows/vendor-onboarding.ts` |

### 10. Custom API Layer (Page ID: 56393886)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 10.1 | Admin API (237 routes) | `TODO` | `api/admin/` |
| 10.2 | Store API (163 routes) | `TODO` | `api/store/` |
| 10.3 | Vendor API (68 routes) | `TODO` | `api/vendor/` |
| 10.4 | Platform API (16 routes) | `TODO` | `api/platform/` |
| 10.5 | Webhook Endpoints (4 providers) | `TODO` | `api/webhooks/` |
| 10.6 | Health Check Endpoint | `TODO` | `api/health/` |
| 10.7 | API Route Conventions & Patterns | `TODO` | Route structure patterns |
| 10.8 | Admin Route Reference by Vertical | `TODO` | Admin routes grouped by vertical |
| 10.9 | Store Route Reference by Vertical | `TODO` | Store routes grouped by vertical |
| 10.10 | Vendor Route Reference by Vertical | `TODO` | Vendor routes grouped by vertical |
| 10.11 | Error Handling & Validation | `TODO` | `lib/api-error-handler.ts` |

### 11. Workflows (Page ID: 56230026)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 11.1 | Workflow Architecture | `TODO` | Medusa workflow pattern |
| 11.2 | Order Workflows | `TODO` | `workflows/order-fulfillment.ts`, etc. |
| 11.3 | Vendor Workflows | `TODO` | `workflows/vendor/`, `vendor-onboarding.ts` |
| 11.4 | Subscription Workflows | `TODO` | `workflows/subscription/` |
| 11.5 | Integration Sync Workflows | `TODO` | `workflows/hierarchy-sync.ts`, `product-sync.ts` |
| 11.6 | Vertical Workflows | `TODO` | `workflows/auction-lifecycle.ts`, etc. |
| 11.7 | Event Outbox | `TODO` | `modules/events/` |

### 12. Event Subscribers (Page ID: 56230045)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 12.1 | Subscriber Architecture | `TODO` | Subscriber pattern |
| 12.2 | Order Lifecycle Subscribers | `TODO` | `subscribers/order-*.ts` |
| 12.3 | Booking Lifecycle Subscribers | `TODO` | `subscribers/booking-*.ts` |
| 12.4 | Subscription Lifecycle Subscribers | `TODO` | `subscribers/subscription-*.ts` |
| 12.5 | Vendor Lifecycle Subscribers | `TODO` | `subscribers/vendor-*.ts` |
| 12.6 | Payment Lifecycle Subscribers | `TODO` | `subscribers/payment-*.ts` |
| 12.7 | Quote Lifecycle Subscribers | `TODO` | `subscribers/quote-*.ts` |
| 12.8 | B2B & Integration Subscribers | `TODO` | `subscribers/company-*.ts`, `integration-sync-*.ts` |
| 12.9 | Analytics Subscribers | `TODO` | `subscribers/product-updated-analytics.ts` |

### 13. Module Links (Page ID: 56918056)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 13.1 | Link Architecture | `TODO` | `defineLink` pattern |
| 13.2 | Customer Links (12) | `TODO` | `links/customer-*.ts` |
| 13.3 | Product Links (10) | `TODO` | `links/product-*.ts` |
| 13.4 | Order Links (3) | `TODO` | `links/order-*.ts` |
| 13.5 | Vendor Links (5) | `TODO` | `links/vendor-*.ts` |
| 13.6 | Cart & Inventory Links | `TODO` | `links/cart-*.ts`, `links/inventory-*.ts` |
| 13.7 | Company Links | `TODO` | `links/company-*.ts` |
| 13.8 | Tenant & Node Links | `TODO` | `links/tenant-*.ts`, `links/node-*.ts` |

### 14. Infrastructure Modules (Page ID: 55804342)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 14.1 | Tenant Module | `TODO` | `modules/tenant/` |
| 14.2 | Node Hierarchy Module | `TODO` | `modules/node/` |
| 14.3 | Governance Module | `TODO` | `modules/governance/` |
| 14.4 | Persona Module | `TODO` | `modules/persona/` |
| 14.5 | Store Module (CityOS) | `TODO` | `modules/store/` |
| 14.6 | Channel Module | `TODO` | `modules/channel/` |
| 14.7 | Region Zone Module | `TODO` | `modules/region-zone/` |
| 14.8 | i18n Module | `TODO` | `modules/i18n/` |
| 14.9 | Notification Preferences | `TODO` | `modules/notification-preferences/` |
| 14.10 | Analytics Module | `TODO` | `modules/analytics/` |
| 14.11 | Audit Module | `TODO` | `modules/audit/` |
| 14.12 | Events Module | `TODO` | `modules/events/` |
| 14.13 | CMS Content Module | `TODO` | `modules/cms-content/` |

### 15. Integration Layer (Page ID: 56230064)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 15.1 | Integration Architecture | `TODO` | `lib/integrations/` |
| 15.2 | Payload CMS Integration | `TODO` | `lib/integrations/payload-cms-spec.ts` |
| 15.3 | ERPNext Integration | `TODO` | `lib/integrations/erpnext-spec.ts` |
| 15.4 | Fleetbase Integration | `TODO` | `lib/integrations/fleetbase-spec.ts` |
| 15.5 | Stripe Webhooks | `TODO` | `api/webhooks/stripe/` |
| 15.6 | Temporal Cloud Client | `TODO` | `lib/temporal-client.ts` |
| 15.7 | Walt.id (Digital Identity) | `TODO` | `lib/integrations/waltid-spec.ts` |
| 15.8 | Webhook Security | `TODO` | Signature verification |
| 15.9 | Outbox Processor | `TODO` | `lib/platform/outbox-processor.ts` |
| 15.10 | Sync Tracker | `TODO` | `lib/platform/sync-tracker.ts` |

### 16. Database & Migrations (Page ID: 56098919)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 16.1 | Database Architecture | `TODO` | PostgreSQL + MikroORM |
| 16.2 | MikroORM Patterns | `TODO` | Entity/model conventions |
| 16.3 | Migration System | `TODO` | MikroORM migrations |
| 16.4 | Module Migration Registry | `TODO` | 203 migrations |
| 16.5 | Schema Reference | `TODO` | Full table listing |
| 16.6 | Enum Constraints | `TODO` | All enum columns |
| 16.7 | JSONB Fields | `TODO` | Metadata/config fields |

### 17. Seed Data & Scripts (Page ID: 56262837)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 17.1 | Seed Architecture | `TODO` | Master scripts, execution order |
| 17.2 | Core Data Seeds | `TODO` | `seed-master.ts` |
| 17.3 | Vertical Seeds (27) | `TODO` | `seed-verticals.ts` |
| 17.4 | Infrastructure Seeds (17) | `TODO` | Infrastructure seed scripts |
| 17.5 | Sub-Entity Seeds (18) | `TODO` | Sub-entity seed scripts |
| 17.6 | Seed Utilities | `TODO` | `seed-utils.ts` |
| 17.7 | Image Policy & Object Storage | `TODO` | Bucket paths, zero Unsplash |

### 18. Storefront Application (Page ID: 56262857)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 18.1 | Storefront Architecture | `TODO` | TanStack Start + React |
| 18.2 | Route Registry (349 routes) | `TODO` | All route files |
| 18.3 | Design System | `TODO` | Design tokens, theme provider |
| 18.4 | CMS Block System (77 blocks) | `TODO` | Block type definitions |
| 18.5 | SSR Loaders (65 pages) | `TODO` | Server loaders |
| 18.6 | Vendor Portal (73 pages) | `TODO` | Vendor dashboard |
| 18.7 | Manage Pages (45 CRUD configs) | `TODO` | Admin management |
| 18.8 | Authentication Flow | `TODO` | JWT, SDK, RoleGuard |
| 18.9 | i18n and RTL Support | `TODO` | en/fr/ar, logical CSS |
| 18.10 | SEO and Accessibility | `TODO` | Meta tags, ARIA |

### 19. Authentication & RBAC (Page ID: 56983650)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 19.1 | Authentication Architecture | `TODO` | JWT, sessions |
| 19.2 | 10-Role RBAC System | `TODO` | Role hierarchy |
| 19.3 | API Key Management | `TODO` | Publishable/secret keys |
| 19.4 | Route Protection Patterns | `TODO` | Middleware, RoleGuard |
| 19.5 | Vendor Authentication | `TODO` | Vendor JWT |

### 20. Deployment & DevOps (Page ID: 56688758)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 20.1 | Development Setup | `TODO` | `start.sh` |
| 20.2 | Production Build | `TODO` | `build-production.sh` |
| 20.3 | Production Architecture | `TODO` | Health responder pattern |
| 20.4 | VM Deployment Strategy | `TODO` | VM vs autoscale |
| 20.5 | Production Proxy | `TODO` | `prod-proxy.js` |
| 20.6 | Health Check Patterns | `TODO` | Readiness probes |
| 20.7 | Environment Variables | `TODO` | Complete reference |
| 20.8 | Monitoring and Logging | `TODO` | Structured logging |

### 21. Testing & Quality (Page ID: 56262876)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 21.1 | TypeScript Contracts | `TODO` | `packages/contracts/` |
| 21.2 | Type Safety Patterns | `TODO` | MikroORM types |
| 21.3 | Code Quality Standards | `TODO` | ESLint, Prettier |
| 21.4 | Testing Strategy | `TODO` | Unit/integration tests |
| 21.5 | Error Handling Patterns | `TODO` | MedusaError types |

### 22. Appendices & Reference (Page ID: 55935079)

| # | Page Title | Status | Source |
|---|-----------|--------|--------|
| 22.1 | Complete API Route Reference (489) | `TODO` | All API routes |
| 22.2 | Complete Module Registry (61) | `TODO` | All modules |
| 22.3 | Complete Link Registry (38) | `TODO` | All links |
| 22.4 | Complete Subscriber Catalog (38) | `TODO` | All subscribers |
| 22.5 | Complete Workflow Catalog (23) | `TODO` | All workflows |
| 22.6 | Complete Migration Log (203) | `TODO` | All migrations |
| 22.7 | Environment Variable Reference | `TODO` | All env vars |
| 22.8 | Payload CMS Cross-Reference Index | `TODO` | Section mapping |
| 22.9 | ERPNext Sync Field Mapping | `TODO` | Field mappings |
| 22.10 | Fleetbase Integration Reference | `TODO` | Geo/logistics API |
| 22.11 | Changelog | `TODO` | Version history |

---

## Section Structure Summary

Each section index page includes:
- Tier classification and status tracking
- Purpose/overview paragraph
- Child pages table with numbered sub-pages and TODO status
- Summary tables (module registry, API routes, link definitions, etc.)
- Cross-references to Payload CMS documentation sections
- Source file attribution

### Child Pages Per Section (148 planned sub-pages)

| Section | Child Pages | Topic Areas |
|---------|-------------|-------------|
| 1 | 7 | Vision, architecture, tech stack, monorepo, extension pattern, responsibility split, glossary |
| 2 | 5 | Config, module registry, anatomy, keys, conditional loading |
| 3 | 11 | Cart, shipping, inventory, tax, volume pricing, promotion, invoice, payout, review, wishlist, trade-in |
| 4 | 7 | Auction, classified, real estate, automotive, rental, digital product, crowdfunding |
| 5 | 7 | Booking, restaurant, healthcare, travel, event ticketing, freelance, fitness |
| 6 | 6 | Financial product, insurance, subscription, wallet, loyalty, membership |
| 7 | 6 | Social commerce, affiliate, advertising, education, charity, grocery |
| 8 | 9 | Government, legal, utilities, parking, pet service, warranty, quote, B2B, dispute |
| 9 | 9 | Vendor module, junction table, order splitting, commission, listings, analytics, portal API, portal UI, onboarding |
| 10 | 11 | Admin API, store API, vendor API, platform API, webhooks, health, conventions, route refs (admin/store/vendor), errors |
| 11 | 7 | Architecture, order workflows, vendor workflows, subscription, integration sync, vertical workflows, outbox |
| 12 | 8 | Architecture, order/booking/subscription/vendor/quote/B2B/integration/analytics subscribers |
| 13 | 8 | Architecture, customer/product/order/vendor/cart/inventory/company links |
| 14 | 13 | Tenant, node hierarchy, governance, persona, store, channel, region zone, i18n, notifications, analytics, audit, events, CMS |
| 15 | 10 | Architecture, Payload CMS, ERPNext, Fleetbase, Stripe, Temporal, Walt.id, webhook security, outbox, sync |
| 16 | 7 | Architecture, MikroORM patterns, migration system, registry, schema ref, enums, JSONB |
| 17 | 7 | Architecture, core seeds, vertical seeds, infrastructure seeds, sub-entity seeds, utilities, image policy |
| 18 | 10 | Architecture, routes, design system, CMS blocks, SSR loaders, vendor portal, manage pages, auth, i18n, SEO |
| 19 | 5 | Auth architecture, RBAC roles, API keys, route protection, vendor auth |
| 20 | 8 | Dev setup, production build, production architecture, VM strategy, proxy, health checks, env vars, monitoring |
| 21 | 5 | TypeScript contracts, type safety, code quality, testing, error handling |
| 22 | 11 | API routes, module registry, links, subscribers, workflows, migrations, env vars, CMS cross-ref, ERPNext, Fleetbase, changelog |

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
| Commerce Engine | S1 Platform Overview | S25 Commerce — Medusa Integration |
| Multi-Tenancy | S14 Infrastructure | S2 Multi-Tenancy & Node Hierarchy |
| RBAC & Governance | S19 Authentication & RBAC | S3 Security & RBAC, S4 Governance |
| Vertical Modules (27) | S3-S8 Vertical Modules | S14 Domain Package System (37 domains) |
| Multi-Vendor | S9 Multi-Vendor Architecture | S25.5 POI Product Sync |
| API Layer | S10 Custom API Layer | S23 API Architecture (BFF layer) |
| Event System | S11-S12 Workflows & Subscribers | S30 Event-Driven Architecture |
| Payload CMS Sync | S15 Integration Layer | S25.3 Commerce Event Bridge |
| ERPNext Sync | S15 Integration Layer | S27 ERP — ERPNext Integration |
| Fleetbase Sync | S15 Integration Layer | S28 Logistics — Fleetbase Integration |
| Temporal Workflows | S11 Workflows | S26 Workflow Engine — Temporal |
| Database | S16 Database & Migrations | S18 Database & Data Model |
| Storefront | S18 Storefront Application | S37 Frontend Architecture |
| Deployment | S20 Deployment & DevOps | S38 DevOps & Deployment |
| Persona System | S14 Infrastructure (persona) | S21 Multi-Axis Persona System |

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
