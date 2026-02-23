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
The project utilizes a Turborepo monorepo structure, incorporating a Medusa.js v2.13.1 backend API, a TanStack Start + React storefront, shared TypeScript contracts, design tokens, theme providers, and a component type system.

### Backend
The backend offers modularity for CityOS features including tenant management, a 5-level node hierarchy (CITY→DISTRICT→ZONE→FACILITY→ASSET), policy inheritance-based governance, a persona system, a CMS-compatible event outbox, and i18n. It supports multi-vendor marketplaces, subscriptions, B2B, bookings, promotions, and specialized services. Key design principles include multi-tenant isolation, RBAC, persona precedence, and residency zones. All custom code adheres to Medusa's official extension pattern without modifying its core.

### Storefront
The storefront, built with TanStack Start and React, provides SSR, dynamic routing, and file-based routing. It features a centralized design system, tenant-scoped routes, and a comprehensive Payload CMS-compatible block system with 76 block types across 45 vertical detail pages. UI adheres to mobile-first responsive design, utilizes design tokens, and supports i18n with logical CSS properties for RTL/LTR. Public routes include SEO meta tags and accessibility features.

### Multi-Vendor Architecture
The platform employs a custom multi-vendor module for granular control, linking vendors to products via a `vendor_product` junction table. It includes order splitting functionality and commission calculation, with a dedicated Vendor Portal.

### Verticals
The system distinguishes between 27 vertical modules requiring product variants (e.g., Products, Subscription, Quote, B2B) and those managing their own entity models without direct variant dependency (e.g., Bookings, Auctions, Classifieds, Events/Ticketing, Real Estate). Each vertical has domain-specific models and business logic.

### CMS Integration
A local CMS registry defines commerce verticals and pages, supporting `countryCode` and `regionZone`. Backend endpoints provide Payload-compatible responses, and a CMS Hierarchy Sync Engine synchronizes collections from Payload CMS to ERPNext.

### Integration Layer
All cross-system integration occurs via Temporal Cloud workflows, ensuring durability, retries, saga patterns, and observability. This includes PostgreSQL-backed sync tracking, webhook endpoints with signature verification, and an outbox processor with circuit breakers and rate limiters.

### Authentication and API Usage
JWT-based authentication is used for the customer SDK. All tenant/governance/node API calls must use `sdk.client.fetch()` for automatic `VITE_MEDUSA_PUBLISHABLE_KEY` inclusion. Authenticated routes are protected with granular access control via `RoleGuard` based on a 10-role RBAC system.

### Manage Page Infrastructure
The platform supports 45 CRUD configurations for various verticals using shared components like DataTable, Charts, Calendar, and FormWizard. Features include AnalyticsOverview, BulkActionsBar, and AdvancedFilters. The sidebar dynamically filters modules based on user role weight.

### Connectivity & Port Mapping
The frontend (Storefront) uses Port 5000 and Host 0.0.0.0, configured in `apps/storefront/vite.config.ts` with `allowedHosts: true`. The backend (Medusa) uses Port 9000 and Host 0.0.0.0. A `start.sh` script manages process sequencing and port cleanup.

### File Handling & CMS Storage Compliance
All media assets are stored on Vercel Blob (private store) using `@vercel/blob@2.3.0` with **CMS-compliant tenant-prefixed paths**. The `BLOB_READ_WRITE_TOKEN` secret enables the Vercel Blob file provider (`apps/backend/src/modules/file-vercel-blob`). All new uploads automatically go to `tenants/dakkah/domains/commerce/products/` via the prefix registry (`apps/backend/src/lib/storage/prefixRegistry.ts`). The default tenant is `dakkah` (configurable via `CITYOS_DEFAULT_TENANT` env var).

**Storage Migration (Feb 23, 2026):** All 282 media records fully migrated to CMS-compliant paths (`tenants/dakkah/domains/commerce/products/`):
- **Image records:** 209 total (201 dev + 8 production) — 100% compliant
- **Product thumbnails:** 73 total (65 dev + 8 production) — 100% compliant
- **Vercel Blob:** 90 files at tenant-prefixed paths, all copied and verified
- Both Neon (production) and HeliumDB (dev) databases at 100% compliance

**CMS Gateway Endpoints:**
- `/platform/storage/gateway/download` — CMS-compatible download with X-Api-Key + X-System-Id access control
- `/platform/storage/info` — Provider status, prefix counts, endpoint registry
- `/platform/storage/migrate` — Bulk migration with dry-run support
- `/platform/storage/serve` — Direct file serving with caching
- `/platform/storage/upload-buffer` — Base64 buffer upload

**Storage Scaffold:** `npm run storage:scaffold` (audit) / `npm run storage:scaffold:fix` (auto-migrate) — CI/CD-compatible compliance checker at `apps/backend/src/scripts/storage-scaffold.ts`.

### Production Database
The project utilizes Neon PostgreSQL (`NEON_DATABASE_URL` in Replit, `DATABASE_URL` in Vercel) for production. Migrations are handled via `npx medusa db:migrate` during the Vercel build process. The `apps/backend/vercel.json` config ensures correct build commands for the monorepo structure.

### System Responsibility Split
- **Medusa (Commerce Engine):** Products, orders, payments, commissions, marketplace listings, vendor management.
- **Payload CMS (Entity & Content Management):** Tenant profiles, POI content, vendor public profiles, pages, navigation.
- **Fleetbase (Geo & Logistics):** Geocoding, address validation, delivery zone management, tracking.
- **ERPNext (Finance, Accounting & ERP):** Sales invoices, payment entries, GL, inventory, procurement, reporting.
- **Temporal Cloud (Workflow Orchestration):** Workflow execution, task queues, dynamic AI agent workflows, event outbox.
- **Walt.id (Decentralized Digital Identity):** DID management, verifiable credentials, wallet integration.

### Database Configuration
The project uses an external Neon PostgreSQL database via the `NEON_DATABASE_URL` secret (same database used by Vercel production). The `medusa-config.ts` prefers `NEON_DATABASE_URL` over the Replit-provided `DATABASE_URL` (heliumdb), ensuring dev and production share the same database. All MikroORM migrations are applied against the Neon database.

## Confluence Documentation
The following audit and remediation pages are published to the Dakkah Confluence space (SD):

- **22.8.4** — Multi-Tenancy Gap Report & Model-Migration Audit
- **22.9** — Vercel Production Deployment Guide
- **22.10** — MikroORM Migration Conflict Audit & Resolution
- **22.11** — Post-Deployment Vercel Routing Audit & Remediation (page ID: 58851329)
- **22.12** — Storefront SSR Build & Hydration Audit (page ID: 58851370)
- **22.13** — Complete API Route Registry & Production Parity Matrix (page ID: 59047937)
- **22.14** — Admin Dashboard 404 Root Cause Analysis & Vercel Deployment Fix (page ID: 59113473)
- **22.15** — Product Seeding & Store API Verification Audit (page ID: 59015171)
- **22.16** — Multi-Tenant Architecture Deep-Dive & RBAC Audit (page ID: 58785813)
- **22.17** — Comprehensive Remediation Roadmap & Priority Matrix (page ID: 59015192)
- **22.18** — CityOS Storage Architecture — Integration Guide (page ID: 58785838)

### Key Findings (Feb 22, 2026)
- **Medusa v2.13.1 upgrade complete**: All `@medusajs/*` packages upgraded from `2.11.4-snapshot-20251107212527` to `2.13.1`, `@medusajs/ui` to `4.1.1`, `@medusajs/icons` to `2.13.1`
- **Zod compatibility**: Medusa 2.13.1 requires Zod v3 (`^3.25.0`), not v4 — v4's changed internals (no `.def` property) cause API route registration failures
- **472 total API routes**: 250 admin, 206 store, 16 platform
- **Production 404s**: All `/platform/*` routes return 404 via storefront proxy due to Nitro-generated `.vercel/output/config.json` overriding `vercel.json` rewrites
- **SSR hydration issue**: `enabled: typeof window !== "undefined"` in TanStack Query hooks prevents SSR data fetching, causing 3-5s LCP
- **Fix priorities**: P0 — Nitro route rules + MEDUSA_BACKEND_URL env var; P1 — Migrate to TanStack Router loaders for SSR

### Vercel Production Deployment (Feb 23, 2026)
- **Client-side absolute URLs**: Storefront `getServerBaseUrl()` returns `VITE_MEDUSA_BACKEND_URL` on client side in production, making all SDK and `fetchWithTimeout` calls use absolute backend URLs (no proxy rewrites needed)
- **Admin dashboard backend URL**: `medusa-config.ts` uses `MEDUSA_BACKEND_URL` → `VERCEL_URL` → `VERCEL_PROJECT_PRODUCTION_URL` fallback chain for admin `backendUrl`, preventing localhost:9000 calls
- **Post-build script** (`apps/storefront/scripts/vercel-post-build.mjs`): Backup rewrite injection into Nitro config (kept as defense-in-depth)
- **Image proxy**: All product images use `/platform/media?path={blob-pathname}` proxy URLs; private Vercel Blob images served through backend proxy with caching
- **Required Vercel env vars**:
  - **Backend project**: `STORE_CORS` must include `*` or the storefront domain; `MEDUSA_BACKEND_URL` (optional, auto-detected from `VERCEL_URL`)
  - **Storefront project**: `VITE_MEDUSA_BACKEND_URL` must be set to the backend deployment URL (e.g., `https://dakkah-cityos-medusa-backend.vercel.app`)

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
- **Caching:** Redis (Redis Labs) — `@medusajs/cache-redis` for Medusa framework cache, `CityOSCache` (ioredis) for application-level cache
- **Event Bus:** Redis (Redis Labs) — `@medusajs/event-bus-redis` replaces local in-memory event bus