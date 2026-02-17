# Medusa.js E-Commerce Monorepo — Dakkah CityOS Commerce Platform

## Overview
This project is a Medusa.js e-commerce monorepo designed for multi-tenancy and integration with the Dakkah CityOS CMS architecture. Dakkah aims to be a comprehensive commerce platform supporting over 27 verticals, featuring a 5-level node hierarchy, a 10-role RBAC system, a 6-axis persona system, a 4-level governance chain, and localization (en/fr/ar with RTL support). The vision is to establish Dakkah as a leading commerce solution across diverse verticals, with "Dakkah" serving as the primary super-app tenant.

## User Preferences
- Full alignment with CityOS CMS architecture required
- Centralized design system matching CMS pattern
- Port 5000 for frontend, 0.0.0.0 host
- Bypass host verification for Replit environment
- Country-level record unification for CMS pages
- Payload CMS API compatibility for future migration

## System Architecture
The project utilizes a Turborepo monorepo structure, incorporating a Medusa.js v2 backend API, a TanStack Start + React storefront, shared TypeScript contracts, design tokens, theme providers, and a component type system.

### Backend
The backend offers modularity for CityOS features including tenant management, a 5-level node hierarchy (CITY→DISTRICT→ZONE→FACILITY→ASSET), policy inheritance-based governance, a persona system, a CMS-compatible event outbox, and i18n. It supports multi-vendor marketplaces, subscriptions, B2B, bookings, promotions, and specialized services. Key design principles include multi-tenant isolation, RBAC, persona precedence, and residency zones. The API includes 486 endpoints with centralized error handling and structured logging.

### Storefront
The storefront, built with TanStack Start and React, provides SSR, dynamic routing, and file-based routing. It features a centralized design system with a robust provider chain, tenant-scoped routes, and a comprehensive Payload CMS-compatible block system with 77 block types across 45 vertical detail pages. UI adheres to mobile-first responsive design, utilizes design tokens, and supports i18n with logical CSS properties for RTL/LTR. All public routes include SEO meta tags and accessibility features, and all 65 detail pages have SSR loaders.

### Multi-Vendor Architecture
The platform employs a custom multi-vendor module for granular control, linking vendors to products via a `vendor_product` junction table. It includes order splitting functionality and commission calculation. A dedicated Vendor Portal provides 73 dashboard pages.

### Verticals
The system distinguishes between verticals requiring product variants (e.g., Products, Subscription, Quote, B2B) and those managing their own entity models without direct variant dependency (e.g., Bookings, Auctions, Classifieds, Events/Ticketing, Real Estate). There are 27 vertical modules, each with domain-specific models and business logic.

### CMS Integration
A local CMS registry defines 27 commerce verticals and additional pages, supporting `countryCode` and `regionZone`. Backend endpoints provide Payload-compatible responses, and a CMS Hierarchy Sync Engine synchronizes 8 collections from Payload CMS to ERPNext.

### Integration Layer
All cross-system integration occurs via Temporal Cloud workflows, ensuring durability, retries, saga patterns, and observability. This includes PostgreSQL-backed sync tracking, webhook endpoints with signature verification for Stripe, ERPNext, Fleetbase, and Payload CMS, and an outbox processor with circuit breakers and rate limiters. An auto-sync scheduler manages synchronization and cleanup.

### Authentication and API Usage
JWT-based authentication is used for the customer SDK. All tenant/governance/node API calls must use `sdk.client.fetch()` for automatic `VITE_MEDUSA_PUBLISHABLE_KEY` inclusion. Authenticated routes are protected with granular access control via `RoleGuard` based on a 10-role RBAC system.

### Manage Page Infrastructure
The platform supports 45 CRUD configurations for various verticals using shared components like DataTable, Charts, Calendar, and FormWizard. Features include AnalyticsOverview, BulkActionsBar, and AdvancedFilters. The sidebar dynamically filters modules based on user role weight.

### System Responsibility Split
- **Medusa (Commerce Engine):** Products, orders, payments, commissions, marketplace listings, vendor management.
- **Payload CMS (Entity & Content Management):** Tenant profiles, POI content, vendor public profiles, pages, navigation.
- **Fleetbase (Geo & Logistics):** Geocoding, address validation, delivery zone management, tracking.
- **ERPNext (Finance, Accounting & ERP):** Sales invoices, payment entries, GL, inventory, procurement, reporting.
- **Temporal Cloud (Workflow Orchestration):** Workflow execution, task queues, dynamic AI agent workflows, event outbox.
- **Walt.id (Decentralized Digital Identity):** DID management, verifiable credentials, wallet integration.

### Code Separation from Medusa
All custom code lives in `apps/backend/src/` — completely separate from Medusa's `node_modules/@medusajs/`. No patches, no forks, no modifications to Medusa source code. All modules use Medusa's official extension pattern.

## Database Configuration
- Uses Replit-provided PostgreSQL (heliumdb) via DATABASE_URL environment variable
- Medusa backend connects via `process.env.DATABASE_URL` in medusa-config.ts
- 203 MikroORM migrations applied; all seed data lives in heliumdb
- No local PostgreSQL instance required; start.sh uses Replit database directly

## Recent Changes (2026-02-17)

### Deployment Fix — "pid1 binary layer" Timeout Resolution
- **Root cause:** Deployment used `cloudrun` (autoscale) target which requires fast cold starts — incompatible with Medusa 60+ module initialization (3-5 min startup)
- **Fix 1:** Changed deployment target from `cloudrun` to `vm` (always-running, supports slow-starting stateful apps)
- **Fix 2:** Rewrote `scripts/start-production.sh` with instant health responder pattern:
  1. Lightweight Node.js HTTP server binds port 5000 immediately (passes health check)
  2. Medusa backend boots on port 9000 in background (up to 4 min)
  3. Health responder killed after backend ready
  4. Storefront starts on port 5173 (Nitro SSR or server.mjs wrapper)
  5. Production proxy (`prod-proxy.js`) takes over port 5000, routing API→backend, UI→storefront
- **Fix 3:** Increased Medusa memory from 512MB to 1024MB (`--max-old-space-size=1024`)
- **Fix 4:** Updated `scripts/build-production.sh` with build output verification
- **Fix 5:** Fixed `server.mjs` default port to 5173 (production uses proxy, dev uses direct 5000)
- **Production Architecture:** proxy on :5000 → backend on :9000 + storefront on :5173

### Previous Changes (2026-02-16)

### Database Connection Fix
- Fixed critical database mismatch: start.sh was starting local PostgreSQL (port 5433, medusadb) while all seed data existed in Replit-provided database (heliumdb)
- Removed local PostgreSQL setup from start.sh — now uses Replit DATABASE_URL directly
- Added .pgdata to .gitignore
- All 60+ modules of seed data now accessible through Medusa ORM

### Security Dependency Updates
- Updated all vulnerable packages via pnpm overrides in root package.json
- Fixed 132 TypeScript compilation errors across 40+ files

### Image Migration to Object Storage
- All product/service image references migrated from Unsplash URLs to Replit Object Storage bucket paths
- `seed-utils.ts`: `getImage()` and `getThumb()` return `/platform/storage/serve?path=...` URLs
- Storage endpoint: `/platform/storage/serve` serves images from bucket `replit-objstore-9ae4a2f3-0592-42b1-908d-b04c0c0e79c4`

### Seed Data Infrastructure
- **Seed Scripts:**
  - `seed-verticals.ts` — Seeds 27 vertical modules with Saudi-themed data and bucket storage images
  - `seed-all-with-images.ts` — Master seed: verticals + 31 infrastructure/sub-entity modules with images
  - `seed-utils.ts` — Centralized image URLs, Saudi pricing helpers, city/phone generators
  - `seed-master.ts` — Core Medusa data (products, categories, regions, etc.)
- **Seeded Verticals (27):** Booking, Healthcare, Restaurant, Travel, Event Ticketing, Freelance, Grocery, Automotive, Fitness, Financial Product, Advertising, Parking, Utilities, Legal, Government, Crowdfunding, Auction, Classified, Charity, Education, Real Estate, Pet Service, Affiliate, Warranty, Rental, Insurance, Social Commerce
- **Seeded Infrastructure (17):** Persona, Governance, Wallet, Notification Preferences, CMS Content, Volume Pricing, Tax Config, Region Zone, Subscription, Quote, Insurance Plans, Membership, Digital Product, Promotion Extensions, Loyalty, Report, Vendor
- **Seeded Sub-Entities (18):** Menu, Menu Item, Table Reservation, Kitchen Order, Room Type, Room, Medical Record, Lab Order, Prescription, Citizen Profile, Service Request, Fine, Damage Claim, Stock Alert, Loyalty Account, Dispute, Ride Request, Shuttle Route
- **Seeded Ancillary (9):** Credit Line, Dashboard, Proposal, Quote Item, Shipping Rate, Tenant POI, Wallet Transaction, Reservation Hold, Subscription Discount
- **Image Policy:** ALL images use Replit Object Storage bucket paths (`/platform/storage/serve?path=...`). Zero Unsplash URLs remain in the database. Comprehensive DB-wide scan verified across ALL tables with image columns and metadata JSONB fields.
- **Image Columns Populated:** ad_creative, agent_profile, attorney_profile, charity_org, cityos_store, course, event, live_stream, membership_tier, menu_item, pet_profile, practitioner, restaurant (logo+banner), reward, reward_tier, service_provider (avatar), tenant (logo+favicon), trainer_profile, vendor (logo+banner), venue
- **Image Metadata Populated:** auction_listing, classified_listing, class_schedule, crowdfund_campaign, digital_asset, donation_campaign, gift_card_ext, gig_listing, insurance_product, loan_product, parking_zone, product_bundle, property_listing, rental_product, service_product, social_post, subscription_plan, vehicle_listing, warranty_plan
- **Known ORM Issue:** Loyalty program `tier_config` field encounters ORM metadata caching issue on re-seed; existing data has valid tier_config

### Database Enum Constraints
- `booking.location_type`: `in_person`, `virtual`, `customer_location`
- `event.status`: `draft`, `published`, `live`, `completed`, `cancelled`
- `event.event_type`: `concert`, `conference`, `workshop`, `sports`, `festival`, `webinar`, `meetup`, `other`
- `ad_campaign.campaign_type`: `sponsored_listing`, `banner`, `search`, `social`, `email`
- `classified_listing.listing_type`: `sell`, `buy`, `trade`, `free`, `wanted`
- `classified_listing.condition`: `new`, `like_new`, `good`, `fair`, `poor`
- `quote.status`: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `accepted`, `declined`, `expired`
- `persona.category`: `consumer`, `creator`, `business`, `cityops`, `platform`

## External Dependencies
- **Database:** PostgreSQL
- **Frontend Framework:** TanStack Start, React
- **Monorepo Management:** Turborepo, pnpm
- **API Gateway/Orchestration:** Medusa.js
- **Workflow Orchestration:** Temporal Cloud
- **CMS:** Payload CMS
- **ERP:** ERPNext
- **Logistics:** Fleetbase
- **Digital Identity:** Walt.id
- **Payment Gateway:** Stripe
- **Email Service:** SendGrid