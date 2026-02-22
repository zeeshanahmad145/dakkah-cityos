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
The backend offers modularity for CityOS features including tenant management, a 5-level node hierarchy (CITY→DISTRICT→ZONE→FACILITY→ASSET), policy inheritance-based governance, a persona system, a CMS-compatible event outbox, and i18n. It supports multi-vendor marketplaces, subscriptions, B2B, bookings, promotions, and specialized services. Key design principles include multi-tenant isolation, RBAC, persona precedence, and residency zones. The API includes 489 endpoints with centralized error handling and structured logging. All custom code lives in `apps/backend/src/`, adhering to Medusa's official extension pattern without modifying its core.

### Storefront
The storefront, built with TanStack Start and React, provides SSR, dynamic routing, and file-based routing. It features a centralized design system with a robust provider chain, tenant-scoped routes, and a comprehensive Payload CMS-compatible block system with 76 block types across 45 vertical detail pages. UI adheres to mobile-first responsive design, utilizes design tokens, and supports i18n with logical CSS properties for RTL/LTR. All public routes include SEO meta tags and accessibility features, and all 65 detail pages have SSR loaders.

### Multi-Vendor Architecture
The platform employs a custom multi-vendor module for granular control, linking vendors to products via a `vendor_product` junction table. It includes order splitting functionality and commission calculation. A dedicated Vendor Portal provides 73 dashboard pages.

### Verticals
The system distinguishes between verticals requiring product variants (e.g., Products, Subscription, Quote, B2B) and those managing their own entity models without direct variant dependency (e.g., Bookings, Auctions, Classifieds, Events/Ticketing, Real Estate). There are 27 vertical modules, each with domain-specific models and business logic.

### CMS Integration
A local CMS registry defines 27 commerce verticals and additional pages, supporting `countryCode` and `regionZone`. Backend endpoints provide Payload-compatible responses, and a CMS Hierarchy Sync Engine synchronizes 8 collections from Payload CMS to ERPNext.

### Integration Layer
All cross-system integration occurs via Temporal Cloud workflows, ensuring durability, retries, saga patterns, and observability. This includes PostgreSQL-backed sync tracking, webhook endpoints with signature verification for Stripe, ERPNext, Fleetbase, and Payload CMS, and an outbox processor with circuit breakers and rate limiters.

### Authentication and API Usage
JWT-based authentication is used for the customer SDK. All tenant/governance/node API calls must use `sdk.client.fetch()` for automatic `VITE_MEDUSA_PUBLISHABLE_KEY` inclusion. Authenticated routes are protected with granular access control via `RoleGuard` based on a 10-role RBAC system.

### Manage Page Infrastructure
The platform supports 45 CRUD configurations for various verticals using shared components like DataTable, Charts, Calendar, and FormWizard. Features include AnalyticsOverview, BulkActionsBar, and AdvancedFilters. The sidebar dynamically filters modules based on user role weight.

### Connectivity & Port Mapping
- **Frontend (Storefront):** Port 5000, Host 0.0.0.0. Configuration in `apps/storefront/vite.config.ts` includes `allowedHosts: true`.
- **Backend (Medusa):** Port 9000, Host 0.0.0.0.
- **Start Script:** `start.sh` manages process sequencing and port cleanup.

### File Handling
- **Development (Replit):** Custom Replit Object Storage provider (`apps/backend/src/modules/file-replit`).
- **Production (Vercel):** Custom Vercel Blob provider (`apps/backend/src/modules/file-vercel-blob`).
- **Auto-switching:** `medusa-config.ts` uses `BLOB_READ_WRITE_TOKEN` env var to select provider.
- **Routes:** `/store/file-replit/download?key=...` for dev, Vercel Blob URLs for production.

### Production Database (Neon)
- **Connection:** `NEON_DATABASE_URL` secret in Replit, `DATABASE_URL` in Vercel.
- **Migration:** `cd apps/backend && npx medusa db:migrate` (runs during Vercel build).
- **Vercel backend config:** `vercel.json` at repo root — includes migration in build command.
- **Current state:** Core Medusa tables (134 migrations, 111 tables) applied. Custom module migrations pending.

### System Responsibility Split
- **Medusa (Commerce Engine):** Products, orders, payments, commissions, marketplace listings, vendor management.
- **Payload CMS (Entity & Content Management):** Tenant profiles, POI content, vendor public profiles, pages, navigation.
- **Fleetbase (Geo & Logistics):** Geocoding, address validation, delivery zone management, tracking.
- **ERPNext (Finance, Accounting & ERP):** Sales invoices, payment entries, GL, inventory, procurement, reporting.
- **Temporal Cloud (Workflow Orchestration):** Workflow execution, task queues, dynamic AI agent workflows, event outbox.
- **Walt.id (Decentralized Digital Identity):** DID management, verifiable credentials, wallet integration.

### Database Configuration
The project uses Replit-provided PostgreSQL (heliumdb) via the `DATABASE_URL` environment variable. Medusa backend connects via `process.env.DATABASE_URL` in `medusa-config.ts`. All 203 MikroORM migrations are applied, and all seed data lives in heliumdb. No local PostgreSQL instance is required.

## Recent Changes (2026-02-22)

### Production Deployment Infrastructure
- Vercel Blob file storage provider created (`apps/backend/src/modules/file-vercel-blob`) for production file uploads
- `medusa-config.ts` updated with conditional file provider: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, Replit Object Storage otherwise
- Root `vercel.json` updated for Medusa backend deployment: includes `medusa db:migrate` in build step
- Neon PostgreSQL production database: core Medusa migrations (134/207) applied, remaining will complete during Vercel build
- `@vercel/blob` package installed

### Orchestrator Removal & Storefront Migration Prep
- Removed `@dakkah/orchestrator` (duplicate Payload CMS app) from monorepo — already deployed at https://vercel.com/mvp-lab-team/dakkah-cityos-cms/
- Storefront migration guide created at `docs/STOREFRONT_MIGRATION_GUIDE.md`
- Storefront to be migrated to the CMS project; this repo will become backend-only
- Shared packages needed by storefront: `@dakkah-cityos/design-runtime`, `@dakkah-cityos/design-tokens`, `@dakkah-cityos/design-system`

## Previous Changes (2026-02-20)

### Comprehensive 7-Sprint Gap Remediation
Full deep-dive audit identified and remediated all gaps across 8 areas:

#### Sprint 1 — Critical Infrastructure
- Insurance & trade-in migrations verified (tables: ins_policy, ins_claim, trade_in_request, trade_in_offer)
- Admin context middleware (`apps/backend/src/api/middleware/admin-context.ts`) — injects tenantId/storeId/locale for all admin routes
- Module query config: wallet, tradeIn, insurance now have `definition: { isQueryable: true }`

#### Sprint 2 — Workflow Implementation (6 workflows fixed)
- KYC verification: real document validation (types, sizes, expiry) + scoring algorithm (doc completeness 30pts, business age 20pts, identity 30pts, address 20pts) + rejection path
- Fleet dispatch: uses FleetbaseService `getAvailableDrivers()` + `assignDriver()` with manual queue fallback
- Payment reconciliation: real matching by amount (±0.01), reference ID, date proximity (<24hrs) with confidence scoring
- Tenant provisioning: creates default store config, roles (owner/admin/manager/staff), plan-based settings
- Event ticketing: calculates real ticket pricing from ticket types and quantities
- Auction lifecycle: validates reserve price, minimum increment (5%), anti-sniping, winner determination

#### Sprint 3 — Vertical Service Depth (15 services deepened)
**Tier 1 (Financial):** Insurance (premium calc, claims adjudication, policy lifecycle, prorated cancellation), Auction (bid validation, anti-sniping, reserve price, winner determination), Wallet (balance locking, transfers, statements, freeze)
**Tier 2 (Key Verticals):** Restaurant (menu availability, order routing, prep time estimation, status state machine), Real Estate (Haversine geo-filtering, mortgage calc, viewing scheduling), Loyalty (points expiry, tier upgrade, earning multipliers, referral bonuses), Event Ticketing (seat selection, ticket transfer, time-based refunds, waitlist)
**Tier 3 (Supporting):** Healthcare (insurance verification, prescriptions), Freelance (proposals, milestone payments, tiered fees), Education (enrollment, progress tracking), Fitness (class booking, late-cancel fees), Parking (time-based pricing, spot reservation), Pet Service (vaccination checks, booking), Charity (donations, tax deductions), Legal (case lifecycle, status state machine)

#### Sprint 4 — Missing Admin CRUD Routes (7 routes created)
- `/admin/bookings/route.ts` — list/create with tenant scoping
- `/admin/subscriptions/route.ts` — list/create with plan/status filters
- `/admin/commissions/route.ts` — list/create commission rules
- `/admin/invoices/route.ts` — list/create with overdue filter
- `/admin/wallet/route.ts` — list wallets, admin credit/debit
- `/admin/insurance/route.ts` — list/create policies
- `/admin/auctions/route.ts` — list/create auctions

#### Sprint 5 — Webhook Handler Implementation
- ERPNext: inventory sync (product lookup by SKU), invoice status updates (payment confirmation), payment entry recording, stock reconciliation (±5 unit auto-adjust threshold)
- Fleetbase: delivery status mapping (dispatched→shipped, delivered→delivered), driver assignment metadata, route/ETA updates, delivery completion with proof storage + Temporal event dispatch

#### Sprint 6 — Storefront Custom Module Integration
- Custom API client (`apps/storefront/src/lib/custom-api.ts`) — 100+ typed functions for all 27+ verticals
- Booking detail page with status badges, cancel functionality, breadcrumb navigation
- All 8 key vertical page sets verified (bookings, subscriptions, auctions, rentals, digital products, event ticketing, freelance + detail pages)

#### Sprint 7 — Test Infrastructure (22 new test files, ~230 total)
- Integration tests: booking lifecycle (12 tests), subscription lifecycle (15 tests), wallet operations (15 tests), auction bidding (14 tests)
- Unit tests: 15 files covering insurance, auction, wallet, restaurant, real-estate, loyalty, event-ticketing, healthcare, freelance, education, fitness, parking, charity, legal, pet-service (152 tests)
- E2E tests: store purchase flow (7 tests), vendor onboarding (5 tests), admin management (7 tests)

### Prior Remediation (6-Sprint Security Plan)
- Sprint 1A/1B: All store mutation routes have auth checks + Zod validation
- Sprint 2: All workflows have compensation on mutating steps
- Sprint 4: Centralized auth middleware, differentiated rate limits, request logger, security headers
- Sprint 6: 211 admin + 4 vendor routes with Zod validation

### Middleware Infrastructure
- Auth: `apps/backend/src/api/middleware/require-customer-auth.ts`
- Admin context: `apps/backend/src/api/middleware/admin-context.ts` — tenant/store/locale injection
- Rate limiter: `apps/backend/src/api/middleware/rate-limiter.ts` — differentiated per-route limits
- Request logger: `apps/backend/src/api/middleware/request-logger.ts` — redaction, correlation IDs
- Security headers: `apps/backend/src/api/middleware/security-headers.ts`

### Test Infrastructure (~230 total test files)
- `tests/integration/workflows/` (5 files) — compensation verification
- `tests/integration/services/` (8 files) — financial accuracy + lifecycle tests
- `tests/integration/isolation/` (3 files) — multi-tenant isolation
- `tests/integration/auth/` (3 files) — auth boundaries
- `tests/unit/services/` (15 files) — vertical module service logic
- `tests/unit/workflows/` (8 files) — workflow unit tests
- `tests/e2e/` (3 files) — end-to-end flow tests
- `tests/integration/` (7 files) — store/admin integration tests

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