# Dakkah CityOS — Medusa Commerce Engine Documentation Plan

**Space:** Software Development (`98310`) · **Homepage:** [Medusa Commerce Engine](https://dakkah.atlassian.net/wiki/spaces/SD/pages/56393848) · **Updated:** February 19, 2026

## Documentation Status: COMPLETE

All 196 Confluence pages (1 homepage + 22 section indexes + 173 child pages) across 22 sections have been created and populated with verified technical content extracted from the TypeScript source files. Content covers 61 custom modules, 489 API routes, 30 workflow files, 38 subscribers, 38 links, 27 verticals, 76 CMS block types, and all infrastructure, integration, deployment, and reference documentation. Additionally, 3 audit pages (22.12, 22.12.1, 22.12.2) provide a complete module implementation audit with gap analysis and remediation roadmap.

| Section | Child Pages | Status |
|---------|-------------|--------|
| 1. Platform Overview | 7 | Complete |
| 2. Module System | 5 | Complete |
| 3. Core Commerce | 11 | Complete |
| 4. Verticals — Marketplace | 7 | Complete |
| 5. Verticals — Services | 8 | Complete |
| 6. Verticals — Finance | 6 | Complete |
| 7. Verticals — Content | 6 | Complete |
| 8. Verticals — Civic | 9 | Complete |
| 9. Multi-Vendor | 9 | Complete |
| 10. API Layer | 8 | Complete |
| 11. Workflows | 8 | Complete |
| 12. Subscribers | 5 | Complete |
| 13. Links | 4 | Complete |
| 14. Infrastructure | 13 | Complete |
| 15. Integration Layer | 10 | Complete |
| 16. Database | 7 | Complete |
| 17. Seed Data | 7 | Complete |
| 18. Storefront | 10 | Complete |
| 19. Auth & RBAC | 5 | Complete |
| 20. Deployment | 9 | Complete |
| 21. Testing | 5 | Complete |
| 22. Appendices | 14 | Complete |
| **Total** | **173 child + 22 indexes + 1 homepage = 196** | **All Complete** |

**Companion Space:** Software Development (`98310`) — Payload CMS documentation
**Cross-Link:** Section 25 (Commerce — Medusa Integration) in Payload docs links here

**Confluence Page IDs:**

| Section | Title | Page ID |
|---------|-------|---------|
| Homepage | Medusa Commerce Engine — Documentation | 56393848 |
| 1 | Platform Overview and Architecture | 56655970 |
| 2 | Module System and Configuration | 56098897 |
| 3 | Core Commerce Extensions | 56885411 |
| 4 | Vertical Modules — Marketplace and Listings | 56557648 |
| 5 | Vertical Modules — Services and Bookings | 56164472 |
| 6 | Vertical Modules — Finance and Insurance | 56066149 |
| 7 | Vertical Modules — Content and Social | 57049229 |
| 8 | Vertical Modules — Civic and Specialized | 56524941 |
| 9 | Multi-Vendor Architecture | 56524960 |
| 10 | Custom API Layer | 55738509 |
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
| `apps/backend/` | Medusa v2 backend — 61 custom modules, 489 API routes, 38 subscribers, 30 workflow files, 38 links |
| `apps/backend/src/modules/` | 61 custom MikroORM modules (verticals, infrastructure, commerce extensions) |
| `apps/backend/src/api/` | Custom API layer — admin (237), store (163), vendor (68), platform (16), webhooks (4), health (1) |
| `apps/backend/src/subscribers/` | 38 event subscribers (order, booking, payment, subscription lifecycle) |
| `apps/backend/src/workflows/` | 30 Medusa workflow files (fulfillment, sync, provisioning, disputes, auctions, B2B, vendor, subscription) |
| `apps/backend/src/links/` | 38 module link definitions (cross-module entity relationships) |
| `apps/backend/src/scripts/` | 41 seed & utility scripts |
| `apps/backend/src/lib/` | Shared libraries — integrations, storage, monitoring, middleware, platform |
| `apps/storefront/` | TanStack Start + React storefront — 349 routes (legacy, migrating to Payload CMS) |
| `apps/orchestrator/` | Temporal Cloud orchestrator — workflow definitions, activities |
| `packages/cityos-contracts/` | Shared TypeScript contracts |
| `packages/cityos-design-tokens/` | Design token definitions |
| `packages/cityos-design-system/` | CSS generator & design utilities |
| `packages/cityos-design-runtime/` | Runtime design token resolution |

## Progress Dashboard

**Overall: 173 / 173 child pages (100%) — ALL SECTIONS COMPLETE (196 total with indexes)**

| # | Section | Page ID | Progress | Status |
|---|---------|---------|----------|--------|
| 1 | Platform Overview & Architecture | 56655970 | 7/7 (100%) | DONE |
| 2 | Module System & Configuration | 56098897 | 5/5 (100%) | DONE |
| 3 | Core Commerce Extensions | 56885411 | 11/11 (100%) | DONE |
| 4 | Vertical Modules — Marketplace & Listings | 56557648 | 7/7 (100%) | DONE |
| 5 | Vertical Modules — Services & Bookings | 56164472 | 8/8 (100%) | DONE |
| 6 | Vertical Modules — Finance & Insurance | 56066149 | 6/6 (100%) | DONE |
| 7 | Vertical Modules — Content & Social | 57049229 | 6/6 (100%) | DONE |
| 8 | Vertical Modules — Civic & Specialized | 56524941 | 9/9 (100%) | DONE |
| 9 | Multi-Vendor Architecture | 56524960 | 9/9 (100%) | DONE |
| 10 | Custom API Layer | 55738509 | 8/8 (100%) | DONE |
| 11 | Workflows | 56230026 | 8/8 (100%) | DONE |
| 12 | Event Subscribers | 56230045 | 5/5 (100%) | DONE |
| 13 | Module Links | 56918056 | 4/4 (100%) | DONE |
| 14 | Infrastructure Modules | 55804342 | 13/13 (100%) | DONE |
| 15 | Integration Layer | 56230064 | 10/10 (100%) | DONE |
| 16 | Database & Migrations | 56098919 | 7/7 (100%) | DONE |
| 17 | Seed Data & Scripts | 56262837 | 7/7 (100%) | DONE |
| 18 | Storefront Application | 56262857 | 10/10 (100%) | DONE |
| 19 | Authentication & RBAC | 56983650 | 5/5 (100%) | DONE |
| 20 | Deployment & DevOps | 56688758 | 9/9 (100%) | DONE |
| 21 | Testing & Quality | 56262876 | 5/5 (100%) | DONE |
| 22 | Appendices & Reference | 55935079 | 11/11 (100%) | DONE |

> `DONE` = Created with content · `PARTIAL` = Needs updating · `TODO` = Not yet created · `PLANNED` = Feature not yet in code · `EXISTING` = Pre-existing page

---

## Detailed Section Child Pages

### 1. Platform Overview & Architecture (Page ID: 56655970)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 1.1 | Vision: Headless Commerce for CityOS | 57049268 | `DONE` | `replit.md`, `medusa-config.ts` |
| 1.2 | System Architecture and Boundary Diagram | 57475133 | `DONE` | Architecture overview |
| 1.3 | Medusa Technology Stack Reference | 56557705 | `DONE` | `package.json` files |
| 1.4 | Monorepo Structure (Turborepo and pnpm) | 56098939 | `DONE` | `turbo.json`, workspace config |
| 1.5 | Medusa v2 Extension Pattern | 56688802 | `DONE` | `apps/backend/src/modules/*/index.ts` |
| 1.6 | System Responsibility Split | 57114806 | `DONE` | Medusa vs Payload vs ERPNext vs Fleetbase |
| 1.7 | Glossary and Terminology | 56819760 | `DONE` | All docs |

### 2. Module System & Configuration (Page ID: 56098897)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 2.1 | Medusa Configuration (medusa-config.ts) | 57606246 | `DONE` | `apps/backend/medusa-config.ts` |
| 2.2 | Module Registry (61 Modules) | 57507902 | `DONE` | All module `index.ts` files |
| 2.3 | Module Anatomy (Models, Service, Index, Migrations) | 57278547 | `DONE` | Module structure pattern |
| 2.4 | Module Keys and Resolution | 56033301 | `DONE` | `medusa-config.ts` keys |
| 2.5 | Conditional Module Loading | 56426597 | `DONE` | Stripe, SendGrid, Meilisearch |

### 3. Core Commerce Extensions (Page ID: 56885411)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 3.1 | Cart Extension Module | 57245875 | `DONE` | `modules/cart-extension/` |
| 3.2 | Shipping Extension Module | 57475153 | `DONE` | `modules/shipping-extension/` |
| 3.3 | Inventory Extension Module | 56361179 | `DONE` | `modules/inventory-extension/` |
| 3.4 | Tax Configuration Module | 55967826 | `DONE` | `modules/tax-config/` |
| 3.5 | Volume Pricing Module | 56262915 | `DONE` | `modules/volume-pricing/` |
| 3.6 | Promotion Extension Module | 57213029 | `DONE` | `modules/promotion-ext/` |
| 3.7 | Invoice Module | 57606266 | `DONE` | `modules/invoice/` |
| 3.8 | Payout Module | 56787084 | `DONE` | `modules/payout/` |
| 3.9 | Review Module | 56066188 | `DONE` | `modules/review/` |
| 3.10 | Wishlist Module | 56918076 | `DONE` | `modules/wishlist/` |
| 3.11 | Trade-In Module | 57081957 | `DONE` | `modules/trade-in/` |

### 4. Marketplace & Listings Verticals (Page ID: 56557648)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 4.1 | Auction Module | 56230085 | `DONE` | `modules/auction/` |
| 4.2 | Classified Module | 57081976 | `DONE` | `modules/classified/` |
| 4.3 | Real Estate Module | 56983689 | `DONE` | `modules/real-estate/` |
| 4.4 | Automotive Module | 56819782 | `DONE` | `modules/automotive/` |
| 4.5 | Rental Module | 57475172 | `DONE` | `modules/rental/` |
| 4.6 | Digital Product Module | 56000612 | `DONE` | `modules/digital-product/` |
| 4.7 | Crowdfunding Module | 57245895 | `DONE` | `modules/crowdfunding/` |

### 5. Services & Bookings Verticals (Page ID: 56164472)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 5.1 | Booking Module | 56000631 | `DONE` | `modules/booking/` |
| 5.2 | Healthcare Module | 56164492 | `DONE` | `modules/healthcare/` |
| 5.3 | Restaurant Module | 57475191 | `DONE` | `modules/restaurant/` |
| 5.4 | Travel Module | 55967845 | `DONE` | `modules/travel/` |
| 5.5 | Event Ticketing Module | 56885449 | `DONE` | `modules/event-ticketing/` |
| 5.6 | Freelance / Gig Module | 57540652 | `DONE` | `modules/freelance/` |
| 5.7 | Fitness Module | 57114827 | `DONE` | `modules/fitness/` |
| 5.8 | Pet Services Module | 56885469 | `DONE` | `modules/pet-service/` |

### 6. Finance & Insurance Verticals (Page ID: 56066149)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 6.1 | Financial Product Module | 56721467 | `DONE` | `modules/financial-product/` |
| 6.2 | Insurance Module | 57475210 | `DONE` | `modules/insurance/` |
| 6.3 | Subscription Module | 55967864 | `DONE` | `modules/subscription/` |
| 6.4 | Wallet Module | 56918095 | `DONE` | `modules/wallet/` |
| 6.5 | Loyalty Module | 56590399 | `DONE` | `modules/loyalty/` |
| 6.6 | Membership Module | 57114846 | `DONE` | `modules/membership/` |

### 7. Content & Social Verticals (Page ID: 57049229)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 7.1 | Social Commerce Module | 57376869 | `DONE` | `modules/social-commerce/` |
| 7.2 | Affiliate Module | 57540671 | `DONE` | `modules/affiliate/` |
| 7.3 | Advertising Module | 57409695 | `DONE` | `modules/advertising/` |
| 7.4 | Education Module | 57540690 | `DONE` | `modules/education/` |
| 7.5 | Charity Module | 57278567 | `DONE` | `modules/charity/` |
| 7.6 | Grocery Module | 56524998 | `DONE` | `modules/grocery/` |

### 8. Civic & Specialized Verticals (Page ID: 56524941)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 8.1 | Government Module | 56525017 | `DONE` | `modules/government/` |
| 8.2 | Legal Module | 57147492 | `DONE` | `modules/legal/` |
| 8.3 | Utilities Module | 56819802 | `DONE` | `modules/utilities/` |
| 8.4 | Parking Module | 56361198 | `DONE` | `modules/parking/` |
| 8.5 | Pet Service Module | 56426617 | `DONE` | `modules/pet-service/` |
| 8.6 | Warranty Module | 56426636 | `DONE` | `modules/warranty/` |
| 8.7 | Quote Module | 56361217 | `DONE` | `modules/quote/` |
| 8.8 | Company / B2B Module | 57049289 | `DONE` | `modules/company/` |
| 8.9 | Dispute Module | 56623245 | `DONE` | `modules/dispute/` |

### 9. Multi-Vendor Architecture (Page ID: 56524960)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 9.1 | Vendor Module | 56098959 | `DONE` | `modules/vendor/` |
| 9.2 | Vendor-Product Junction | 56721486 | `DONE` | `VendorProduct` model |
| 9.3 | Vendor Order and Order Splitting | 57213048 | `DONE` | `VendorOrder` model |
| 9.4 | Commission Module | 55738568 | `DONE` | `modules/commission/` |
| 9.5 | Payout Module | 56098978 | `DONE` | `modules/payout/` |
| 9.6 | Vendor Portal (73 Dashboard Pages) | 56492152 | `DONE` | `storefront/vendor/` |
| 9.7 | Vendor Onboarding Flow | 55804361 | `DONE` | `workflows/vendor-onboarding.ts` |
| 9.8 | Vendor Analytics and Reporting | 56950866 | `DONE` | `VendorAnalytics` model |
| 9.9 | Vendor Review and Rating System | 56131784 | `DONE` | Review model |

### 10. Custom API Layer (Page ID: 55738509)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 10.1 | Admin API Routes | 57114865 | `DONE` | `api/admin/` |
| 10.2 | Store API Routes | 57409714 | `DONE` | `api/store/` |
| 10.3 | Vendor API Routes | 56426655 | `DONE` | `api/vendor/` |
| 10.4 | Platform API Routes | 56098997 | `DONE` | `api/platform/` |
| 10.5 | Webhook Routes | 56983709 | `DONE` | `api/webhooks/` |
| 10.6 | API Middlewares | 57147512 | `DONE` | `api/middlewares.ts` |
| 10.7 | API Route Conventions | 56525036 | `DONE` | Route structure patterns |
| 10.8 | Route Count Summary (489 Routes) | 55738587 | `DONE` | Route summary |

### 11. Workflows (Page ID: 56230026)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 11.1 | Order Fulfillment Workflows | 56393870 | `DONE` | `workflows/order-fulfillment.ts`, etc. |
| 11.2 | Vendor Operation Workflows | 56688822 | `DONE` | `workflows/vendor/` |
| 11.3 | Subscription Lifecycle Workflows | 57606286 | `DONE` | `workflows/subscription/` |
| 11.4 | Integration Sync Workflows | 57245914 | `DONE` | `workflows/hierarchy-sync.ts`, `product-sync.ts` |
| 11.5 | Vertical-Specific Workflows | 56852601 | `DONE` | `workflows/auction-lifecycle.ts`, etc. |
| 11.6 | Notification Workflows | 56262934 | `DONE` | `workflows/notification/` |
| 11.7 | Governance and CityOS Workflows | 57081995 | `DONE` | CityOS governance workflows |
| 11.8 | Workflow Architecture and Patterns | 57082014 | `DONE` | Medusa workflow pattern |

### 12. Event Subscribers (Page ID: 56230045)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 12.1 | Order Event Subscribers | 57376888 | `DONE` | `subscribers/order-*.ts` |
| 12.2 | Vendor Event Subscribers | 57016523 | `DONE` | `subscribers/vendor-*.ts` |
| 12.3 | Vertical Event Subscribers | 56557667 | `DONE` | Various vertical subscribers |
| 12.4 | Integration Sync Subscribers | 56656009 | `DONE` | `subscribers/integration-sync-*.ts` |
| 12.5 | Subscriber Architecture and Patterns | 56525076 | `DONE` | Subscriber pattern |

### 13. Module Links (Page ID: 56918056)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 13.1 | Core Commerce Links | 57409733 | `DONE` | `links/product-*.ts`, `links/order-*.ts` |
| 13.2 | Vertical Module Links | 56950886 | `DONE` | Vertical-specific links |
| 13.3 | CityOS Infrastructure Links | 56426674 | `DONE` | `links/tenant-*.ts`, `links/node-*.ts` |
| 13.4 | Link Architecture and Complete Registry | 56131803 | `DONE` | `defineLink` pattern |

### 14. Infrastructure Modules (Page ID: 55804342)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 14.1 | Tenant Module | 56131822 | `DONE` | `modules/tenant/` |
| 14.2 | Node Hierarchy Module | 57278606 | `DONE` | `modules/node/` |
| 14.3 | Governance Module | 56688841 | `DONE` | `modules/governance/` |
| 14.4 | Persona Module | 56164511 | `DONE` | `modules/persona/` |
| 14.5 | Store Module (CityOS) | 56066227 | `DONE` | `modules/store/` |
| 14.6 | Region Zone Module | 57016542 | `DONE` | `modules/region-zone/` |
| 14.7 | Notification Preferences Module | 56525096 | `DONE` | `modules/notification-preferences/` |
| 14.8 | Wallet Module | 56852639 | `DONE` | Infrastructure wallet |
| 14.9 | Loyalty Module | 56852659 | `DONE` | Infrastructure loyalty |
| 14.10 | Report and Analytics Module | 56230104 | `DONE` | `modules/analytics/` |
| 14.11 | CMS Content Module | 57507921 | `DONE` | `modules/cms-content/` |
| 14.12 | Tax Configuration Module | 56393889 | `DONE` | `modules/tax-config/` |
| 14.13 | Volume Pricing and Promotion Extensions | 55804381 | `DONE` | `modules/volume-pricing/`, `modules/promotion-ext/` |

### 15. Integration Layer (Page ID: 56230064)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 15.1 | Integration Architecture | 57213067 | `DONE` | `lib/integrations/` |
| 15.2 | Payload CMS Integration | 56033321 | `DONE` | `lib/integrations/payload-cms-spec.ts` |
| 15.3 | ERPNext Integration | 56066246 | `DONE` | `lib/integrations/erpnext-spec.ts` |
| 15.4 | Fleetbase Integration | 56819841 | `DONE` | `lib/integrations/fleetbase-spec.ts` |
| 15.5 | Stripe Webhooks | 55738606 | `DONE` | `api/webhooks/stripe/` |
| 15.6 | Temporal Cloud Client | 56426694 | `DONE` | `lib/temporal-client.ts` |
| 15.7 | Walt.id Digital Identity | 57540709 | `DONE` | `lib/integrations/waltid-spec.ts` |
| 15.8 | Webhook Security | 56262973 | `DONE` | Signature verification |
| 15.9 | Outbox Processor | 55935100 | `DONE` | `lib/platform/outbox-processor.ts` |
| 15.10 | Sync Tracker | 57245934 | `DONE` | `lib/platform/sync-tracker.ts` |

### 16. Database & Migrations (Page ID: 56098919)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 16.1 | Database Architecture | 56459449 | `DONE` | PostgreSQL + MikroORM |
| 16.2 | MikroORM Patterns | 57016561 | `DONE` | Entity/model conventions |
| 16.3 | Migration System | 57606305 | `DONE` | MikroORM migrations |
| 16.4 | Module Migration Registry | 56230123 | `DONE` | 203 migrations |
| 16.5 | Enum Constraints Reference | 56164530 | `DONE` | All enum columns |
| 16.6 | Seed Data Infrastructure | 56525115 | `DONE` | Seed data overview |
| 16.7 | JSONB Field Patterns | 56918114 | `DONE` | Metadata/config fields |

### 17. Seed Data & Scripts (Page ID: 56262837)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 17.1 | Seed Architecture | 57507940 | `DONE` | Master scripts, execution order |
| 17.2 | Core Data Seeds | 56393908 | `DONE` | `seed-master.ts` |
| 17.3 | Vertical Seeds (27 Modules) | 56787103 | `DONE` | `seed-verticals.ts` |
| 17.4 | Infrastructure Seeds (17 Modules) | 57540730 | `DONE` | Infrastructure seed scripts |
| 17.5 | Sub-Entity and Ancillary Seeds | 57114904 | `DONE` | Sub-entity seed scripts |
| 17.6 | Seed Utilities | 56918133 | `DONE` | `seed-utils.ts` |
| 17.7 | Image Policy and Object Storage | 56525134 | `DONE` | Bucket paths, zero Unsplash |

### 18. Storefront Application (Page ID: 56262857)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 18.1 | Storefront Architecture | 57278625 | `DONE` | TanStack Start + React |
| 18.2 | Route Registry (349 Routes) | 56131841 | `DONE` | All route files |
| 18.3 | Design System | 56459468 | `DONE` | Design tokens, theme provider |
| 18.4 | CMS Block System (76 Blocks) | 56361256 | `DONE` | `storefront/src/components/blocks/block-registry.ts` |
| 18.5 | SSR Loaders (65 Pages) | 57606324 | `DONE` | Server loaders |
| 18.6 | Vendor Portal (73 Pages) | 56131860 | `DONE` | Vendor dashboard |
| 18.7 | Manage Pages (45 CRUD Configs) | 56525153 | `DONE` | Admin management |
| 18.8 | Authentication Flow | 56000669 | `DONE` | JWT, SDK, RoleGuard |
| 18.9 | i18n and RTL Support | 55935119 | `DONE` | en/fr/ar, logical CSS |
| 18.10 | SEO and Accessibility | 56721505 | `DONE` | Meta tags, ARIA |

### 19. Authentication & RBAC (Page ID: 56983650)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 19.1 | Authentication Architecture | 57278645 | `DONE` | JWT, sessions |
| 19.2 | 10-Role RBAC System | 57475229 | `DONE` | Role hierarchy |
| 19.3 | API Key Management | 56721524 | `DONE` | Publishable/secret keys |
| 19.4 | Route Protection Patterns | 57213086 | `DONE` | Middleware, RoleGuard |
| 19.5 | Vendor Authentication | 55738625 | `DONE` | Vendor JWT |

### 20. Deployment & DevOps (Page ID: 56688758)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 20.1 | Development Setup | 56262992 | `DONE` | `start.sh` |
| 20.2 | Production Build | 57606343 | `DONE` | `build-production.sh` |
| 20.3 | Production Architecture | 57082035 | `DONE` | Health responder pattern |
| 20.4 | VM Deployment Strategy | 56230142 | `DONE` | VM vs autoscale |
| 20.5 | Production Proxy | 57409753 | `DONE` | `prod-proxy.js` |
| 20.6 | Environment Variables | 55935138 | `DONE` | Complete reference |
| 20.7 | Monorepo Structure | 57606362 | `DONE` | Turborepo + pnpm |
| 20.8 | Object Storage | 57016581 | `DONE` | Replit Object Storage |
| 20.9 | Build Verification and CI | 56099016 | `DONE` | `build-production.sh` |

### 21. Testing & Quality (Page ID: 56262876)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 21.1 | Testing Strategy | 57475248 | `DONE` | Multi-layer testing |
| 21.2 | TypeScript Compilation | 56819860 | `DONE` | `tsconfig.json`, contracts |
| 21.3 | Code Quality Standards | 55738644 | `DONE` | Conventions, separation |
| 21.4 | Database Integrity | 57245953 | `DONE` | Migrations, enums, validation |
| 21.5 | Dependency Security | 56459487 | `DONE` | pnpm overrides |

### 22. Appendices & Reference (Page ID: 55935079)

| # | Page Title | Page ID | Status | Source |
|---|-----------|---------|--------|--------|
| 22.1 | Full Module Registry (61 Modules) | 57049308 | `DONE` | All modules |
| 22.2 | API Route Index (489 Routes) | 57507980 | `DONE` | All API routes |
| 22.3 | Database Table Index | 56590419 | `DONE` | All tables |
| 22.4 | Seed Data Reference | 56000688 | `DONE` | All seed scripts |
| 22.5 | CMS Cross-Reference Map | 57245972 | `DONE` | CMS mapping |
| 22.6 | Vertical Feature Matrix | 56983748 | `DONE` | Feature comparison |
| 22.7 | Integration Endpoint Reference | 56393927 | `DONE` | Webhooks, APIs |
| 22.8 | Node Hierarchy Reference | 56950925 | `DONE` | 5-level hierarchy |
| 22.9 | Persona System Reference | 56164588 | `DONE` | 6-axis personas |
| 22.10 | Governance Chain Reference | 56164607 | `DONE` | 4-level chain |
| 22.11 | Glossary and Acronyms | 56295523 | `DONE` | Terms, abbreviations |
| 22.12 | Module Implementation Audit & Gap Analysis | 56066342 | `DONE` | Deep-dive audit of all 61 modules |
| 22.12.1 | Module-by-Module Registry (Audit) | 57508130 | `DONE` | Complete implementation details per module |
| 22.12.2 | Gap Analysis & Remediation Roadmap | 56066362 | `DONE` | Severity-rated gaps with phased fix plan |

---

## Section Structure Summary

Each section index page includes:
- Tier classification and status tracking
- Purpose/overview paragraph
- Child pages table with numbered sub-pages and DONE status
- Summary tables (module registry, API routes, link definitions, etc.)
- Cross-references to Payload CMS documentation sections
- Source file attribution

### Child Pages Per Section (173 child pages + 22 section indexes + 1 homepage = 196 total)

| Section | Child Pages | Topic Areas |
|---------|-------------|-------------|
| 1 | 7 | Vision, architecture, tech stack, monorepo, extension pattern, responsibility split, glossary |
| 2 | 5 | Config, module registry, anatomy, keys, conditional loading |
| 3 | 11 | Cart, shipping, inventory, tax, volume pricing, promotion, invoice, payout, review, wishlist, trade-in |
| 4 | 7 | Auction, classified, real estate, automotive, rental, digital product, crowdfunding |
| 5 | 8 | Booking, healthcare, restaurant, travel, event ticketing, freelance, fitness, pet services |
| 6 | 6 | Financial product, insurance, subscription, wallet, loyalty, membership |
| 7 | 6 | Social commerce, affiliate, advertising, education, charity, grocery |
| 8 | 9 | Government, legal, utilities, parking, pet service, warranty, quote, B2B, dispute |
| 9 | 9 | Vendor module, vendor-product junction, order splitting, commission, payout, vendor portal, onboarding, analytics, reviews |
| 10 | 8 | Admin API, store API, vendor API, platform API, webhooks, middlewares, conventions, route summary |
| 11 | 8 | Order fulfillment, vendor operations, subscription lifecycle, integration sync, vertical workflows, notifications, governance, architecture |
| 12 | 5 | Order subscribers, vendor subscribers, vertical subscribers, integration sync subscribers, architecture |
| 13 | 4 | Core commerce links, vertical module links, CityOS infrastructure links, link architecture |
| 14 | 13 | Tenant, node hierarchy, governance, persona, store, region zone, notifications, wallet, loyalty, analytics, CMS content, tax config, volume pricing |
| 15 | 10 | Architecture, Payload CMS, ERPNext, Fleetbase, Stripe, Temporal, Walt.id, webhook security, outbox, sync |
| 16 | 7 | Architecture, MikroORM patterns, migration system, registry, enums, seed data infra, JSONB |
| 17 | 7 | Architecture, core seeds, vertical seeds, infrastructure seeds, sub-entity seeds, utilities, image policy |
| 18 | 10 | Architecture, routes, design system, CMS blocks, SSR loaders, vendor portal, manage pages, auth, i18n, SEO |
| 19 | 5 | Auth architecture, RBAC roles, API keys, route protection, vendor auth |
| 20 | 9 | Dev setup, production build, production architecture, VM strategy, proxy, env vars, monorepo, object storage, build verification |
| 21 | 5 | Testing strategy, TypeScript compilation, code quality, database integrity, dependency security |
| 22 | 11 | Module registry, API route index, database tables, seed data, CMS cross-ref, vertical matrix, integration endpoints, node hierarchy, persona system, governance chain, glossary |

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
| 7 | `booking` | `booking` | Booking, BookingItem, ServiceProduct, ServiceProvider, Availability, AvailabilityException, BookingReminder | Services |
| 8 | `cart-extension` | `cartExtension` | CartMetadata | Core Extension |
| 9 | `channel` | `channel` | SalesChannelMapping | Infrastructure |
| 10 | `charity` | `charity` | CharityOrg, DonationCampaign, Donation, ImpactReport | Content & Social |
| 11 | `classified` | `classified` | ClassifiedListing, ListingCategory, ListingFlag, ListingImage, ListingOffer | Marketplace |
| 12 | `cms-content` | `cmsContent` | CmsPage, CmsNavigation | Infrastructure |
| 13 | `commission` | `commission` | CommissionRule, CommissionTransaction | Multi-Vendor |
| 14 | `company` | `company` | Company, CompanyUser, PurchaseOrder, PurchaseOrderItem, ApprovalWorkflow, ApprovalRequest, ApprovalAction, PaymentTerms, TaxExemption | B2B |
| 15 | `crowdfunding` | `crowdfunding` | CrowdfundCampaign, Pledge, Backer, CampaignUpdate, RewardTier | Marketplace |
| 16 | `digital-product` | `digitalProduct` | DigitalAsset, DownloadLicense | Core Extension |
| 17 | `dispute` | `dispute` | Dispute, DisputeMessage | Core Extension |
| 18 | `education` | `education` | Course, Lesson, Quiz, Assignment, Enrollment, Certificate | Content & Social |
| 19 | `events` | `events` | EventOutbox | Infrastructure |
| 20 | `event-ticketing` | `eventTicketing` | Event, Venue, TicketType, Ticket, SeatMap, CheckIn | Services |
| 21 | `financial-product` | `financialProduct` | LoanProduct, LoanApplication, InsuranceProduct, InsurancePolicy, InvestmentPlan | Finance |
| 22 | `fitness` | `fitness` | TrainerProfile, ClassSchedule, ClassBooking, GymMembership, WellnessPlan | Services |
| 23 | `freelance` | `freelance` | GigListing, Proposal, Milestone, FreelanceContract, FreelanceDispute, TimeLog | Services |
| 24 | `governance` | `governance` | GovernanceAuthority | Infrastructure |
| 25 | `government` | `government` | CitizenProfile, ServiceRequest, Fine, MunicipalLicense, Permit | Civic |
| 26 | `grocery` | `grocery` | FreshProduct, DeliverySlot, BatchTracking, SubstitutionRule | Content & Social |
| 27 | `healthcare` | `healthcare` | Practitioner, MedicalRecord, LabOrder, Prescription, HealthcareAppointment, InsuranceClaim, PharmacyProduct | Services |
| 28 | `i18n` | `i18n` | Translation | Infrastructure |
| 29 | `insurance` | `insurance` | InsuranceClaim, InsurancePolicy | Finance |
| 30 | `inventory-extension` | `inventoryExtension` | ReservationHold, StockAlert, WarehouseTransfer | Core Extension |
| 31 | `invoice` | `invoice` | Invoice, InvoiceItem | Core Extension |
| 32 | `legal` | `legal` | AttorneyProfile, LegalConsultation, LegalCase, RetainerAgreement | Civic |
| 33 | `loyalty` | `loyalty` | LoyaltyProgram, LoyaltyAccount, PointTransaction | Finance |
| 34 | `membership` | `membership` | Membership, MembershipTier, PointsLedger, Redemption, Reward | Finance |
| 35 | `node` | `node` | Node | Infrastructure |
| 36 | `notification-preferences` | `notificationPreferences` | NotificationPreference | Infrastructure |
| 37 | `parking` | `parking` | ParkingZone, ParkingSession, RideRequest, ShuttleRoute | Civic |
| 38 | `payout` | `payout` | Payout, PayoutTransactionLink | Multi-Vendor |
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
| 51 | `subscription` | `subscription` | Subscription, SubscriptionPlan, SubscriptionItem, SubscriptionEvent, SubscriptionPause, SubscriptionDiscount, BillingCycle | Finance |
| 52 | `tax-config` | `taxConfig` | TaxRule, TaxExemption | Core Extension |
| 53 | `tenant` | `tenant` | Tenant, TenantUser, TenantSettings, TenantBilling, TenantUsageRecord, TenantInvoice, TenantPOI, TenantRelationship, ServiceChannel | Infrastructure |
| 54 | `trade-in` | `tradeIn` | TradeInRequest, TradeInOffer | Core Extension |
| 55 | `travel` | `travel` | Property, RoomType, Room, Reservation, RatePlan, GuestProfile, Amenity | Services |
| 56 | `utilities` | `utilities` | UtilityAccount, UtilityBill, MeterReading, UsageRecord | Civic |
| 57 | `vendor` | `vendor` | Vendor, VendorUser, VendorProduct, VendorOrder, VendorOrderItem, MarketplaceListing, VendorAnalyticsSnapshot, VendorPerformanceMetric | Multi-Vendor |
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

## Appendix E — Codebase Audit Log (February 19, 2026)

Verified metrics from direct codebase inspection using `find`, `grep`, and `wc` commands:

| Metric | Verified Count | Source Command |
|--------|---------------|----------------|
| Custom modules | 61 | `ls apps/backend/src/modules/ \| wc -l` |
| API route files | 489 | `find apps/backend/src/api -name "route.ts" \| wc -l` |
| Admin routes | 237 | `find apps/backend/src/api/admin -name "route.ts" \| wc -l` |
| Store routes | 163 | `find apps/backend/src/api/store -name "route.ts" \| wc -l` |
| Vendor routes | 68 | `find apps/backend/src/api/vendor -name "route.ts" \| wc -l` |
| Platform routes | 16 | `find apps/backend/src/api/platform -name "route.ts" \| wc -l` |
| Webhook routes | 4 | `find apps/backend/src/api/webhooks -name "route.ts" \| wc -l` |
| Health route | 1 | `find apps/backend/src/api/health -name "route.ts" \| wc -l` |
| Event subscribers | 38 | `find apps/backend/src/subscribers -name "*.ts" \| wc -l` |
| Workflow files | 30 | `find apps/backend/src/workflows -name "*.ts" \| wc -l` |
| Module links | 38 | `find apps/backend/src/links -name "*.ts" \| wc -l` |
| Seed/utility scripts | 41 | `find apps/backend/src/scripts -name "*.ts" \| wc -l` |
| Module migrations | 64 | `find apps/backend/src/modules -name "Migration*.ts" \| wc -l` |
| Total applied migrations | 203 | 64 module + 139 Medusa core |
| Storefront route files | 349 | `find apps/storefront/src/routes -name "*.tsx" -o -name "*.ts" \| wc -l` |
| CMS block types | 76 | Counted entries in `block-registry.ts` BLOCK_REGISTRY object |
| Prod-proxy API prefixes | 6 | `/platform`, `/store`, `/admin`, `/commerce`, `/auth`, `/webhooks` |

### Module Categories (61 total)

| Category | Count | Modules |
|----------|-------|---------|
| Verticals | 27 | advertising, affiliate, auction, automotive, booking, charity, classified, crowdfunding, education, event-ticketing, financial-product, fitness, freelance, government, grocery, healthcare, insurance, legal, parking, pet-service, real-estate, rental, restaurant, social-commerce, travel, utilities, warranty |
| Infrastructure | 15 | analytics, audit, cms-content, governance, i18n, loyalty, node, notification-preferences, persona, region-zone, store, tax-config, tenant, volume-pricing, wallet |
| Commerce Core | 10 | cart-extension, channel, commission, company, dispute, inventory-extension, invoice, payout, quote, subscription |
| Extensions | 5 | digital-product, membership, promotion-ext, shipping-extension, trade-in |
| Cross-Cutting | 4 | events, review, vendor, wishlist |

### Key File Paths

| Reference | Actual Path |
|-----------|-------------|
| CMS Block Registry | `apps/storefront/src/components/blocks/block-registry.ts` |
| Medusa Config | `apps/backend/medusa-config.ts` |
| Production Proxy | `prod-proxy.js` |
| Production Start | `scripts/start-production.sh` |
| Production Build | `scripts/build-production.sh` |
| Seed Utilities | `apps/backend/src/scripts/seed-utils.ts` |

### Corrections Applied

| Item | Was | Corrected To | Reason |
|------|-----|-------------|--------|
| Total Confluence pages | 227 | 196 | Counted 173 child + 22 index + 1 homepage |
| Workflow files | 23 | 30 | Includes subdirectory files (b2b/3, subscription/3, vendor/4) |
| Seed scripts | 42 | 41 | Verified via find command |
| CMS block types | 77 | 76 | Counted BLOCK_REGISTRY entries |
| API endpoints (replit.md) | 486 | 489 | Verified via route file count |
| Prod-proxy prefixes | 4 documented | 6 actual | Added `/commerce` and `/auth` |
| CMS registry path | `app/lib/cms-registry.ts` | `src/components/blocks/block-registry.ts` | Verified actual file location |
| Migration breakdown | "203 migrations" | 64 module + 139 Medusa core = 203 | Clarified composition |
| Homepage workflows | 23 | 30 | Updated Confluence page 56393848 |
| Homepage seeds | 42 | 41 | Updated Confluence page 56393848 |
| Homepage migrations | 64+ | 203 (64+139) | Updated Confluence page 56393848 |
| Homepage section table | Stale names/counts | Correct 22-section structure | Updated Confluence page 56393848 |
| Section 11 index | 23 workflows, 14 in registry | 30 workflows, all 30 listed | Updated Confluence page 56230026 |
| Section 12 index | 9 child pages listed | 5 child pages (actual) | Updated Confluence page 56230045 |
| Section 13 index | 8 child pages, 30 links | 4 child pages, 38 links | Updated Confluence page 56918056 |
| Section 17 index | 42 scripts | 41 scripts with full registry | Updated Confluence page 56262837 |
| Section 1 index (round 2) | 23 workflows | 30 workflows | Updated Confluence page 56655970 |
| Section 3 index (round 2) | 12 modules header | 11 modules (matching child pages) | Updated Confluence page 56885411 |
| Section 5 index (round 2) | 7 child pages (missing 5.8) | 8 child pages (added Pet Services) | Updated Confluence page 56164472 |
| Section 10 index (round 2) | 11 planned child pages | 8 actual child pages per structure file | Updated Confluence page 55738509 |
| Section 14 index (round 2) | 14 modules header | 13 modules (matching child pages) | Updated Confluence page 55804342 |
| Section 16 index (round 2) | 4 child pages listed | 7 child pages (added 16.5-16.7) | Updated Confluence page 56098919 |
| Section 18 index (round 2) | 77 CMS blocks in stats | 76 CMS blocks (verified count) | Updated Confluence page 56262857 |
| Section 20 index (round 2) | 8 child pages | 9 child pages (added 20.9 Build Verification) | Updated Confluence page 56688758 |
| Section 22 index (round 2) | 23 workflows, 42 seeds, 77 blocks | 30 workflows, 41 seeds, 76 blocks; 11 child pages aligned | Updated Confluence page 55935079 |
| Page 13.1 (round 3) | Order Links (2 files) | Order Links (3 files) — 3 entries listed | Updated Confluence page 57409733 |
| Page 13.2 (round 3) | Customer Links (12 files), Vendor Links (4 files) | Customer Links (14 files), Vendor Links (5 files) | Updated Confluence page 56950886 |
| Page 12.3 (round 3) | Total: 19 subscriber files | Total: 23 subscriber files (5+7+7+4) | Updated Confluence page 56557667 |
| Page 13.4 (round 3) | Link Categories missing Cart row | Added Cart Links: 1 — total now sums to 38 | Updated Confluence page 56131803 |
| Page 20.5 (round 3) | 2 routing rules (/api/*, /admin/*) | 6 API prefixes matching prod-proxy.js source | Updated Confluence page 57409753 |
| Section 4 index (round 6) | Child page statuses "TODO" | All 7 child pages marked "VERIFIED" | Updated Confluence page 56557648 |
| Section 5 index (round 6) | booking 5, healthcare 4, restaurant 8, freelance 4 | booking 7, healthcare 7, restaurant 7, freelance 6 — full model lists | Updated Confluence page 56164472 |
| Section 6 index (round 6) | subscription 5/6, vague insurance/loyalty/membership | subscription 7, insurance 2, loyalty 3, membership 5 — full model lists | Updated Confluence page 56066149 |
| Section 7 index (round 6) | Grocery "Grocery-specific models" | Grocery 4 (FreshProduct, DeliverySlot, BatchTracking, SubstitutionRule) | Updated Confluence page 57049229 |
| Section 8 index (round 6) | government 3, legal vague, parking vague, company 7 | government 5, legal 4, parking 4, company 9 — full model lists | Updated Confluence page 56524941 |
| Appendix A (round 7) | 16 vague/incorrect model entries | All 61 modules now have explicit model names matching source | Updated structure file |
| Section 14 index (round 7) | tenant 3, governance GovernancePolicy, persona 1, loyalty 2 | tenant 9, governance GovernanceAuthority, persona 2 (PersonaAssignment), loyalty 3 (PointTransaction) | Updated Confluence page 55804342 |
