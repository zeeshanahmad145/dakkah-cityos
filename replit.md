# Medusa.js E-Commerce Monorepo — Dakkah CityOS Commerce Platform

## Overview
This project is a Medusa.js e-commerce monorepo for multi-tenancy, integrated with the Dakkah CityOS CMS architecture. Dakkah aims to be a comprehensive commerce platform supporting over 27 verticals with a sophisticated hierarchy, RBAC, persona, and governance systems, alongside full localization. The vision is to establish Dakkah as a leading commerce solution across diverse verticals, with "Dakkah" as the primary super-app tenant.

## User Preferences
- Full alignment with CityOS CMS architecture required
- Centralized design system matching CMS pattern
- Port 5000 for frontend, 0.0.0.0 host
- Bypass host verification for Replit environment
- Country-level record unification for CMS pages
- Payload CMS API compatibility for future migration

## System Architecture
The project uses a Turborepo monorepo with a Medusa.js backend, a TanStack Start + React storefront, shared TypeScript contracts, design tokens, theme providers, and a component type system.

### Backend
The Medusa.js backend offers modularity for CityOS features, including multi-tenant management, a 5-level node hierarchy (CITY→DISTRICT→ZONE→FACILITY→ASSET), policy-inherited governance, a persona system, a CMS-compatible event outbox, and i18n. It supports multi-vendor marketplaces, subscriptions, B2B, bookings, promotions, and specialized services. Core principles include multi-tenant isolation, RBAC, persona precedence, and residency zones. All custom code adheres to Medusa's official extension patterns.

### Storefront
The TanStack Start and React storefront provides SSR, dynamic, and file-based routing. It features a centralized design system, tenant-scoped routes, and a comprehensive Payload CMS-compatible block system with 76 block types across 45 vertical detail pages. UI adheres to mobile-first responsive design, utilizes design tokens, and supports i18n with logical CSS properties for RTL/LTR. Public routes include SEO meta tags and accessibility features.

### Multi-Vendor Architecture
A custom multi-vendor module manages granular control, linking vendors to products via a `vendor_product` junction table, supporting order splitting and commission calculation, alongside a dedicated Vendor Portal.

### Verticals
The system accommodates 27 vertical modules, distinguishing between those requiring product variants (e.g., Products, Subscription, B2B) and those managing their own entity models (e.g., Bookings, Auctions, Classifieds). Each vertical has domain-specific models and business logic.

### CMS Integration
A local CMS registry defines commerce verticals and pages by `countryCode` and `regionZone`. Backend endpoints provide Payload-compatible responses, and a CMS Hierarchy Sync Engine synchronizes collections from Payload CMS to ERPNext.

### Integration Layer
Cross-system integration occurs via Temporal Cloud workflows for durability, retries, saga patterns, and observability. This includes PostgreSQL-backed sync tracking, webhook endpoints with signature verification, and an outbox processor with circuit breakers and rate limiters.

### Authentication and API Usage
JWT-based authentication is used for the customer SDK. All tenant/governance/node API calls must use `sdk.client.fetch()` for automatic `VITE_MEDUSA_PUBLISHABLE_KEY` inclusion. Authenticated routes are protected with granular access control via `RoleGuard` based on a 10-role RBAC system.

### Manage Page Infrastructure
The platform supports 45 CRUD configurations for various verticals using shared components like DataTable, Charts, Calendar, and FormWizard. Features include AnalyticsOverview, BulkActionsBar, and AdvancedFilters. The sidebar dynamically filters modules based on user role weight.

### File Handling & CMS Storage Compliance
All media assets are stored on Vercel Blob with CMS-compliant tenant-prefixed paths. New uploads automatically go to `tenants/dakkah/domains/commerce/products/` via the prefix registry. A CI/CD-compatible compliance checker (`storage-scaffold.ts`) ensures adherence to storage rules. CMS Gateway Endpoints provide download, info, migration, serving, and upload functionalities.

### Production Database
Neon PostgreSQL (`NEON_DATABASE_URL`) is used for production. Migrations are handled via `npx medusa db:migrate` during the Vercel build process. The `apps/backend/vercel.json` config ensures correct build commands for the monorepo structure. The `medusa-config.ts` prefers `NEON_DATABASE_URL` over the Replit-provided `DATABASE_URL` (heliumdb).

### System Responsibility Split
- **Medusa (Commerce Engine):** Products, orders, payments, commissions, marketplace, vendor management.
- **Payload CMS (Entity & Content Management):** Tenant profiles, POI, vendor profiles, pages, navigation.
- **Fleetbase (Geo & Logistics):** Geocoding, address validation, delivery zones, tracking.
- **ERPNext (Finance, Accounting & ERP):** Sales invoices, payments, GL, inventory, procurement, reporting.
- **Temporal Cloud (Workflow Orchestration):** Workflow execution, task queues, AI agents, event outbox.
- **Walt.id (Decentralized Digital Identity):** DID management, verifiable credentials, wallet integration.

### Environment Variable Strategy
All env access is centralized:
- **Backend:** `apps/backend/src/lib/config.ts` → `appConfig` object. No direct `process.env` in application code.
- **Storefront:** `apps/storefront/src/lib/utils/env.ts` → getter functions. No direct `import.meta.env` or `process.env` in application code.
- **Vite config:** `vite.config.ts` auto-forwards canonical env vars (e.g., `MEDUSA_BACKEND_URL`) as `VITE_` prefixed build-time values. Users only set the canonical name.

Canonical env vars (set once, used everywhere):
| Variable | Where | Purpose |
|---|---|---|
| `MEDUSA_BACKEND_URL` | dev=`localhost:9000`, prod=Vercel backend URL | Backend API origin |
| `MEDUSA_PUBLISHABLE_KEY` | shared | Publishable API key for store requests |
| `NEON_DATABASE_URL` | secret | Production PostgreSQL |
| `REDIS_URL` | secret | Redis for cache/events |
| `SENTRY_DSN` | secret | Error monitoring |
| `JWT_SECRET` | shared | JWT signing |
| `COOKIE_SECRET` | shared | Cookie signing |
| `BLOB_READ_WRITE_TOKEN` | shared | Vercel Blob storage |

For Vercel deployment, set `MEDUSA_BACKEND_URL`, `MEDUSA_PUBLISHABLE_KEY`, `NEON_DATABASE_URL`, `SENTRY_DSN`, `JWT_SECRET`, `COOKIE_SECRET`, `BLOB_READ_WRITE_TOKEN`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` in the Vercel project settings.

### Error Monitoring
Sentry is integrated in the backend via `@sentry/node` in `instrumentation.ts`. All API errors are auto-captured via `api-error-handler.ts`. Sentry initializes when `SENTRY_DSN` is set.

## External Dependencies
- **Database:** PostgreSQL (Neon, Replit's heliumdb)
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
- **File Storage:** Vercel Blob, Replit Object Storage
- **Caching:** Redis (Redis Labs)
- **Event Bus:** Redis (Redis Labs)

### Seed Data & Reviews
- **65 custom modules** with 270 model files across all verticals
- **74 list routes** (including invoices, promotions), all with seed data and top-level thumbnails
- **57 detail routes** (including companies/[id], donations/[id], vehicles/[id], quotes/[id]), all return 200 with seed data, reviews, and populated arrays
- **Companies detail page**: `apps/storefront/src/routes/$tenant/$locale/companies/$id.tsx` fetches from `/store/companies/{id}`, displays hero image, tier badge, status, contact details, credit info, reviews
- **Quotes detail page**: `QuoteDetails` component handles both `tax_total`/`discount_total` and `tax`/`discount` field names, divides cent values by 100 for display
- **Seed images**: 201 images stored locally in `apps/backend/static/seed-images/` organized by vertical. Served via `/seed-images/{vertical}%2F{filename}.jpg` endpoint (no publishable key required). Vite proxy configured for `/seed-images` path. Zero external Unsplash URLs. All 200+ image references validated against existing files — zero broken references.
- **Image sanitizer**: `apps/backend/src/lib/image-sanitizer.ts` — replaces any Unsplash URLs in DB-sourced data with local `/seed-images/` paths at the response level. Applied to vendors, classifieds, restaurants, bookings/services routes.
- **Review system**: `ReviewListBlock` component (45 pages) auto-fetches reviews from `/store/reviews/products/{id}` via useEffect. Backend returns 10-12 seed reviews per product with realistic names, ratings, and content when DB is empty.
- **Seed review data**: Products get 10 reviews (3-5 stars), vendors get 8 reviews, all detail routes have 5 reviews. All with `customer_name`/`author`, `content`/`comment`, `created_at`, `rating`.
- **Array field safety**: All backend seed data includes required array fields (`features`, `benefits`, `tiers`, `highlights`, `coverage_details`, `schedule`, `packages`, `updates`, `menu`, `services`, `insurance_accepted`, `availability`, `steps`, `requirements`, `faq`, `claims_process`, `case_types`, `bar_associations`, `languages`, `office_locations`, `rates`, `rules`, `amenities`, `nutrition`, `allergens`, `dietary`, `bids`, `room_types`) to prevent `.map()` crashes on storefront detail pages.
- **Vendor detail page**: Returns `name`, `logo`, `products` array (3-5 per vendor), `reviews` array (8 reviews), `policies` object. Storefront maps `business_name`→`name`, `logo_url`→`logo` via `normalizeDetail`.
- **Crowdfunding/Campaigns page**: Fetches from `/store/crowdfunding`, displays campaign cards with progress bars, goal/raised amounts, backer counts, category badges (technology/arts/education/sustainability), and campaign type badges.
- **Thumbnail consistency**: All list routes (events, bookings/services, classifieds, restaurants) map top-level `thumbnail` from alternative fields (`image_url`, `banner_url`, `metadata.thumbnail`, `images[]`) to ensure API consistency for both seed and DB-sourced data.
- **Affiliate detail page**: Hero image section renders `program.thumbnail`, breadcrumb navigation, 5 seed reviews per program.
- **Manage page**: `useManageStats()` hook has error fallback and `retry: false` to prevent infinite spinner for unauthenticated users. `RoleGuard` handles auth flow (loading → login form → role check → dashboard).
- Auth-required routes (analytics, audit, bookings, disputes, permits, purchase-orders, tickets, wallet, wishlists) have hardcoded storefront fallback data or handle empty state gracefully.
- **CTA button wiring**: All 52 customer-facing detail pages have functional CTA buttons with `onClick` handlers, `useToast` feedback, and loading states. Modules with backend POST endpoints call them directly (e.g., healthcare→appointments, legal→consultations, auctions→bid, campaigns→pledge, subscriptions→checkout). Modules without dedicated endpoints show toast confirmations simulating the action. Pattern: `useState` for loading + `useToast` for success/error + `fetch()` with publishable key header.
- **CTA button categories**: Purchase (bundles, flash-deals, grocery, digital, social-commerce, gift-cards), Booking (healthcare, fitness, pet-services, parking, restaurants, real-estate, travel, event-ticketing, bookings), Application (financial, credit, government, insurance, legal, education), Subscription (subscriptions, memberships, newsletter, loyalty, affiliate), Marketplace (classifieds, freelance, auctions, campaigns, charity, trade-in, vendors, dropshipping, b2b, companies, white-label, print-on-demand, consignment, volume-deals, warranties, try-before-you-buy, automotive, places, events, rentals, crowdfunding).