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