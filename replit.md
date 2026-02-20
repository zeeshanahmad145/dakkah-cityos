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

### System Responsibility Split
- **Medusa (Commerce Engine):** Products, orders, payments, commissions, marketplace listings, vendor management.
- **Payload CMS (Entity & Content Management):** Tenant profiles, POI content, vendor public profiles, pages, navigation.
- **Fleetbase (Geo & Logistics):** Geocoding, address validation, delivery zone management, tracking.
- **ERPNext (Finance, Accounting & ERP):** Sales invoices, payment entries, GL, inventory, procurement, reporting.
- **Temporal Cloud (Workflow Orchestration):** Workflow execution, task queues, dynamic AI agent workflows, event outbox.
- **Walt.id (Decentralized Digital Identity):** DID management, verifiable credentials, wallet integration.

### Database Configuration
The project uses Replit-provided PostgreSQL (heliumdb) via the `DATABASE_URL` environment variable. Medusa backend connects via `process.env.DATABASE_URL` in `medusa-config.ts`. All 203 MikroORM migrations are applied, and all seed data lives in heliumdb. No local PostgreSQL instance is required.

## Recent Changes (2026-02-20)

### Deep Audit & Remediation — Full 6-Sprint Plan Compliance
All items from the detailed implementation plan have been verified and corrected across two remediation rounds:

- **Sprint 1A (24/24 routes):** All store mutation routes have auth checks. Centralized `requireCustomerAuth` middleware in `middlewares.ts` provides defense-in-depth. IDOR fix on subscription checkout (uses auth_context.actor_id, not body-supplied customer_id).
- **Sprint 1B (48/48 routes):** All store mutation routes have Zod validation. No-body action endpoints use `.strict()` to reject unexpected payloads. Routes with body fields use properly typed schemas.
- **Sprint 2 (30/30 workflows):** All workflows have compensation on mutating steps. Read-only steps explicitly return `StepResponse(result, null)`. All compensation is idempotent (try/catch + null guards).
- **Sprint 3 (2/2 modules):** Insurance and trade-in migration files match model definitions.
- **Sprint 4 (4/4 items):** Centralized auth middleware, differentiated rate limits (30/min store, 5/min checkout, 10/min wallet, 3/min newsletter), request logger with redaction + correlation IDs, security headers.
- **Sprint 5 (30 test files):** Integration tests across workflows (5), services (4), isolation (3), auth (3). Plus unit tests and store integration tests.
- **Sprint 6 (215 routes):** 211 admin + 4 vendor routes with Zod validation.

### Middleware Infrastructure
- Auth: `apps/backend/src/api/middleware/require-customer-auth.ts`
- Rate limiter: `apps/backend/src/api/middleware/rate-limiter.ts` — differentiated per-route limits
- Request logger: `apps/backend/src/api/middleware/request-logger.ts` — redaction, correlation IDs
- Security headers: `apps/backend/src/api/middleware/security-headers.ts`

### Test Infrastructure (207 total test files)
- `tests/integration/workflows/` (5 files) — compensation verification
- `tests/integration/services/` (4 files) — financial accuracy
- `tests/integration/isolation/` (3 files) — multi-tenant isolation
- `tests/integration/auth/` (3 files) — auth boundaries
- `tests/unit/workflows/` (8 files) — workflow unit tests
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