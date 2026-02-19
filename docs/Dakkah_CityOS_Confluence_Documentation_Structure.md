# Dakkah CityOS — Confluence Documentation Plan

**Space:** Software Development (`98310`) · **Homepage:** `98429` · **Updated:** February 19, 2026

**Codebase Layout**

| Directory | Purpose |
|-----------|---------|
| `src/` | Main application — collections, hooks, API routes, components, lib utilities, admin UI |
| `packages/cityos-core/src/` | Shared core library — context, contracts, errors, geo, governance, locale, RBAC, versioning |
| `packages/design-system/src/` | CSS generator, design token utilities |
| `packages/domains/` | 37 self-contained domain packages (agriculture, commerce, healthcare, POI, etc.) |

## Progress Dashboard

**Overall: 218 done + 5 partial + 3 existing = 226 / 345 pages (65%)**

| # | Section | Progress | Status |
|---|---------|----------|--------|
| 1 | Platform Overview | 4/7 (57%) | 3 child pages done |
| 2 | Multi-Tenancy & Node Hierarchy | 4/9 (44%) | 3 child pages done |
| 3 | Security & RBAC | 6/12 (50%) | 3 done, 3 partial |
| 4 | Governance & Compliance | 4/10 (40%) | 3 child pages done |
| 5 | CMS — Payload CMS Core | 9/9 (100%) | All done |
| 6 | Custom Plugins | 12/12 (100%) | All done |
| 7 | Page Builder & Block System | 9/9 (100%) | All done |
| 8 | Content Operations | 6/6 (100%) | All done |
| 9 | Admin Console Architecture | 7/7 (100%) | 5 done, 2 partial |
| 10 | Admin Header & UX Components | 12/12 (100%) | All done |
| 11 | Platform Dev Tools | 7/7 (100%) | All done |
| 12 | UI Component Library | 6/6 (100%) | All done |
| 13 | Design System & Theming | 11/11 (100%) | All done |
| 14 | Domain Package System | 10/10 (100%) | All done |
| 15 | Localization (i18n) | 8/8 (100%) | All done |
| 16 | Storage Architecture | 7/7 (100%) | All done |
| 17 | Media Management | 12/12 (100%) | All done |
| 18 | Database & Data Model | 7/7 (100%) | All done |
| 19 | Caching Layer | 5/5 (100%) | All done |
| 20 | POI Spatial Identity Engine | 4/16 (25%) | 3 child pages done |
| 21 | Multi-Axis Persona System | 1/11 (9%) | Index only |
| 22 | AI Management System | 4/10 (40%) | 3 child pages done |
| 23 | API Architecture | 4/8 (50%) | 3 child pages done |
| 24 | External Integrations Hub | 1/7 (14%) | Index only |
| 25 | Commerce — Medusa Integration | 1/11 (9%) | Index only |
| 26 | Workflow Engine — Temporal | 1/12 (8%) | Index only |
| 27 | ERP — ERPNext Integration | 1/3 (33%) | Index only |
| 28 | Logistics — Fleetbase Integration | 1/3 (33%) | Index only |
| 29 | System Registry | 1/3 (33%) | Index only |
| 30 | Event-Driven Architecture | 4/9 (44%) | 3 child pages done |
| 31 | Notification System | 1/7 (14%) | Index only |
| 32 | Email Service | 1/4 (25%) | Index only |
| 33 | Observability & Monitoring | 1/9 (11%) | Index only |
| 34 | Performance & Benchmarks | 1/3 (33%) | Index only |
| 35 | Control Plane | 4/11 (36%) | 3 child pages done |
| 36 | Pod Template System | 1/10 (10%) | Index only |
| 37 | Frontend Architecture | 1/8 (13%) | Index only |
| 38 | DevOps & Deployment | 1/8 (13%) | Index only |
| 39 | Testing Strategy | 1/6 (17%) | Index only |
| 40 | CMS Hooks Reference | 1/14 (7%) | Index only |
| 41 | Templates & Processes | 4/6 (67%) | 1 done, 3 existing |

> `DONE` = Created with content · `PARTIAL` = Needs updating · `TODO` = Not yet created · `PLANNED` = Feature not yet in code · `EXISTING` = Pre-existing page

## Tier 1 — Platform Foundations

### 1. Platform Overview `56000513`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 1.0 | **Platform Overview** (index) | `DONE` | `56000513` |
| 1.1 | Vision, Mission & Goals | `DONE` | `55967765` |
| 1.2 | System Architecture Overview | `DONE` | `56229947` |
| 1.3 | Technology Stack Reference | `DONE` | `57212949` |
| 1.4 | Monorepo Structure & Directory Map | `TODO` | — |
| 1.5 | Glossary & Terminology | `TODO` | — |
| 1.6 | Decision Log (ADRs) | `TODO` | — |

- `replit.md`, `package.json`, `src/` directory tree

### 2. Multi-Tenancy & Node Hierarchy `56033281`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 2.0 | **Multi-Tenancy & Node Hierarchy** (index) | `DONE` | `56033281` |
| 2.1 | Tenant Tier Model (MASTER to CITY) | `DONE` | `55738450` |
| 2.2 | Domain-Based Tenant Identification | `DONE` | `55771237` |
| 2.3 | Node Hierarchy & Node Context | `DONE` | `56787044` |
| 2.4 | Node Scoping (nodeId, scopeLevel) | `TODO` | — |
| 2.5 | Data Residency & Classification | `TODO` | — |
| 2.6 | Tenant Lifecycle | `TODO` | — |
| 2.7 | Child Tenants & Tenant Hierarchy | `TODO` | — |
| 2.8 | Tenant Theme Settings | `TODO` | — |

- `src/collections/Tenants/`, `src/collections/Nodes/`
- `src/utilities/tenantDomainResolver.ts`, `tenantResolver.ts`
- `src/lib/nodeContext/`, `src/lib/nodeContext/types.ts`
- `src/lib/compliance/dataResidency.ts`, `dataClassification.ts`, `residencyMiddleware.ts`
- `src/lib/security/classificationGuard.ts`
- `src/app/api/manage/child-tenants/`
- `src/control-plane/collections/tenant-theme-settings.ts`

### 3. Security & RBAC `56066049`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 3.0 | **Security & RBAC** (index) | `DONE` | `56066049` |
| 3.1 | Role Hierarchy (12 Roles) | `PARTIAL` | `55771137` |
| 3.2 | Capability System (25 Capabilities) | `PARTIAL` | `55771137` |
| 3.3 | Role-Capability Matrix | `PARTIAL` | `55771137` |
| 3.4 | Scope Hierarchy & Permission Levels | `DONE` | `57311233` |
| 3.5 | JWT Middleware & Auth | `DONE` | `57245736` |
| 3.6 | Route Guards | `TODO` | — |
| 3.7 | Elevation Guard | `TODO` | — |
| 3.8 | Rate Limiting | `TODO` | — |
| 3.9 | API Keys & Service Accounts | `TODO` | — |
| 3.10 | User Impersonation | `TODO` | — |
| 3.11 | Access Control Patterns | `TODO` | — |

- `src/lib/admin/capabilities.ts`
- `src/lib/auth/`, `src/lib/security/elevationGuard.ts`, `src/lib/security/rateLimiter.ts`, `src/lib/rateLimit.ts`
- `src/collections/ApiKeys/`, `src/collections/ServiceAccounts/`
- `src/app/components/admin/RouteGuard.tsx`, `ImpersonationBanner.tsx`, `CapabilityGate.tsx`
- `src/access/`, `src/utilities/withDomainGuard.ts`

### 4. Governance & Compliance `56098817`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 4.0 | **Governance & Compliance** (index) | `DONE` | `56098817` |
| 4.1 | Governance Framework | `DONE` | `57540610` |
| 4.2 | Compliance Engine | `DONE` | `56655911` |
| 4.3 | Data Classification | `DONE` | `55771257` |
| 4.4 | Feature Gating | `TODO` | — |
| 4.5 | Data Classification & Residency | `TODO` | — |
| 4.6 | Stewardship Validation | `TODO` | — |
| 4.7 | Cross-Domain Validation | `TODO` | — |
| 4.8 | Moderation System | `TODO` | — |
| 4.9 | Governance Validation Hook | `TODO` | — |

- `src/collections/GovernanceAuthorities/`, `Policies/`, `ComplianceRecords/`, `FeatureFlags/`, `Moderation/`
- `src/lib/policies/`, `src/lib/compliance/complianceChecker.ts`, `dataClassification.ts`, `dataResidency.ts`
- `src/lib/featureGating.ts`
- `src/hooks/policyInheritance.ts`, `complianceCheck.ts`, `featureGating.ts`, `stewardshipValidation.ts`, `cross-domain-validation-hook.ts`, `governanceValidation.ts`
- `src/app/api/bff/moderation/`

## Tier 2 — CMS & Content Management

### 5. CMS — Payload CMS Core `56131585`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 5.0 | **CMS — Payload CMS Core** (index) | `DONE` | `56131585` |
| 5.1 | Payload CMS Configuration | `DONE` | `56361019` |
| 5.2 | Pages Collection | `DONE` | `56786964` |
| 5.3 | Navigation Globals | `DONE` | `55934978` |
| 5.4 | Rich Text — Lexical Configuration | `DONE` | `57507862` |
| 5.5 | Search & SEO | `DONE` | `56655931` |
| 5.6 | Templates System | `DONE` | `55771277` |
| 5.7 | Redirects & Routing Rules | `DONE` | `57049129` |
| 5.8 | Content Versioning | `DONE` | `56197218` |

- `src/payload.config.ts`
- `src/collections/` (all subdirectories), `src/collections/SearchIndexJobs/`, `src/collections/Templates/`, `PageLayoutTemplates/`, `Redirects/`, `RoutingRules/`
- `src/globals/SiteSettings.ts`, `Navigation.ts`
- `src/lib/search/`
- `src/hooks/templateApplication.ts`, `contentVersioning.ts`

### 6. Custom Plugins `56164353`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 6.0 | **Custom Plugins** (index) | `DONE` | `56164353` |
| 6.1 | Plugin Registry (Three-Tier Loading) | `DONE` | `56688698` |
| 6.2 | Multi-Tenant Plugin | `DONE` | `56787004` |
| 6.3 | OpenAPI Generator | `DONE` | `57049109` |
| 6.4 | RBAC Utilities | `DONE` | `56131643` |
| 6.5 | Author Fields | `DONE` | `56000552` |
| 6.6 | Event Tracking Hook | `DONE` | `56197198` |
| 6.7 | Frontend Utils | `DONE` | `57114685` |
| 6.8 | Localized Slug | `DONE` | `56164392` |
| 6.9 | Tree List View | `DONE` | `55771297` |
| 6.10 | Video Processing | `DONE` | `57114705` |
| 6.11 | Visual Editor | `DONE` | `56164412` |

- `src/lib/plugins/` — `plugin-registry.ts`, `openapi-generator.ts`, `rbac-utils.ts`, `author-fields.ts`, `event-tracking-hook.ts`, `frontend-utils.ts`, `localized-slug.ts`, `tree-list-view.ts`, `video-processing.ts`, `visual-editor.ts`

### 7. Page Builder & Block System `56066069`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 7.0 | **Page Builder & Block System** (index) | `DONE` | `56066069` |
| 7.1 | Page Builder Architecture | `DONE` | `57016321` |
| 7.2 | Block Definitions (236 Types / 37 Domains) | `DONE` | `55935019` |
| 7.3 | Block Renderer System | `DONE` | `56361039` |
| 7.4 | Block Manifests & AI Intelligence | `DONE` | `56098857` |
| 7.5 | CMS Page Layout & Style Fields | `DONE` | `57016402` |
| 7.6 | Page Style Fields & Theme Resolution | `DONE` | `56066090` |
| 7.7 | Surface System & Bundle Builder | `DONE` | `57016422` |
| 7.8 | RenderPage Pipeline | `DONE` | `56459327` |

- `src/app/components/BlockRenderer/`, `src/app/components/RenderPage/`
- `src/collections/BlockManifests/`
- `src/lib/surface/bundleBuilder.ts`
- Block definition files, CSS modules, design tokens, theme resolver logic

### 8. Content Operations `56164372`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 8.0 | **Content Operations** (index) | `DONE` | `56164372` |
| 8.1 | Content Lifecycle | `DONE` | `56098837` |
| 8.2 | Content Scheduling | `DONE` | `56328234` |
| 8.3 | Moderation Queue & Status | `DONE` | `56262696` |
| 8.4 | Approval Workflows | `DONE` | `56197238` |
| 8.5 | Content BFF | `DONE` | `57409557` |

- `src/lib/content/`, `src/lib/content/scheduler.ts`
- `src/collections/Moderation/`
- `src/app/api/bff/content/`

## Tier 3 — Admin Consoles & UI

### 9. Admin Console Architecture `56197121`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 9.0 | **Admin Console Architecture** (index) | `DONE` | `56197121` |
| 9.1 | Four Console Products | `DONE` | `56000533` |
| 9.2 | Module Registry (27 Modules) | `DONE` | `57049089` |
| 9.3 | Admin Shell Components | `DONE` | `56492091` |
| 9.4 | MenuRegistry & User Avatar Menu | `DONE` | `55934997` |
| 9.5 | Console-to-Role Mapping | `PARTIAL` | `55771137` |
| 9.6 | Component Visibility by Role | `PARTIAL` | `55771137` |

- `src/app/components/admin/TenantConsoleShell.tsx`, `DomainWorkbenchShell.tsx`, `VendorConsoleShell.tsx`, `ConsoleSidebar.tsx`
- `src/app/dev/platform/PlatformAdminShell.tsx`
- `src/lib/admin/capabilities.ts`
- Module registry config, shell components

### 10. Admin Header & UX Components `55738370`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 10.0 | **Admin Header & UX Components** (index) | `DONE` | `55738370` |
| 10.1 | AdminHeader (3-zone) | `DONE` | `55738370` |
| 10.2 | MenuRegistry | `DONE` | `55738370` |
| 10.3 | CommandPalette | `DONE` | `55738370` |
| 10.4 | NotificationsPanel | `DONE` | `55738370` |
| 10.5 | QuickActionMenu | `DONE` | `55738370` |
| 10.6 | PreferencesPanel | `DONE` | `55738370` |
| 10.7 | TenantSwitchModal | `DONE` | `55738370` |
| 10.8 | UserAvatarMenu | `DONE` | `55738370` |
| 10.9 | Overlay Primitives | `DONE` | `55738370` |
| 10.10 | CapabilityGate Component | `DONE` | `56164432` |
| 10.11 | ImpersonationBanner | `DONE` | `57475093` |

- `src/app/components/admin/` — `AdminHeader.tsx`, `CommandPalette.tsx`, `NotificationsPanel.tsx`, `QuickActionMenu.tsx`, `PreferencesPanel.tsx`, `TenantSwitchModal.tsx`, `CapabilityGate.tsx`, `ImpersonationBanner.tsx`, `overlays/`
- `src/lib/admin/MenuRegistry.ts`
- `src/app/components/UserMenu/UserAvatarMenu.tsx`

### 11. Platform Dev Tools `56229889`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 11.0 | **Platform Dev Tools** (index) | `DONE` | `56229889` |
| 11.1 | Dev Shell & Sidebar | `DONE` | `56885291` |
| 11.2 | Design Studio | `DONE` | `56721448` |
| 11.3 | Identity Page | `DONE` | `56852520` |
| 11.4 | Ops Tools (Events, Integrations) | `DONE` | `57606145` |
| 11.5 | Platform Admin Tools | `DONE` | `57638914` |
| 11.6 | API Reference Page | `DONE` | `56459347` |

- `src/app/dev/` — `DevShell.tsx`, `DevSidebar.tsx`
- `src/app/dev/design-studio/` (colors, theme, preview, export, tokens)
- `src/app/dev/identity/`, `src/app/dev/ops/`, `src/app/dev/api-reference/`
- `src/app/dev/platform/` (20+ pages: dashboard, tenants, users, domains, themes, nodes, POIs, personas, system health, analytics, audit, bulk ops, moderation, inspect, draft policy)

### 12. UI Component Library `56295425`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 12.0 | **UI Component Library** (index) | `DONE` | `56295425` |
| 12.1 | Component Inventory (53+ components) | `DONE` | `55804261` |
| 12.2 | Design Tokens & CSS Modules | `DONE` | `56000572` |
| 12.3 | RTL/LTR Support | `DONE` | `55935039` |
| 12.4 | Responsive Patterns | `DONE` | `57114726` |
| 12.5 | Commerce Components | `DONE` | `56393788` |

- `src/app/components/ui/` (AlertBanner, ApiKeyCard, Avatar, Breadcrumbs, Calendar, ConnectorStatusTile, ContentCard, DataClassificationBadge, DataTable, DeviceStatusCard, EmptyState, ErrorState, ErrorTrendChart, EventTimeline, FeatureFlagToggle, FileUpload, FilterBar, FleetVehicleCard, HierarchyTree, LiveIndicator, MapLegend, Modal, ModerationQueueItem, NotificationPanel, OrderStatusTracker, Pagination, PaymentStatusBadge, POI components, PolicyRuleCard, Progress, Rating, SearchInput, ServiceCard, Skeleton, SocialPostCard, StatusBadge, StatusPill, SystemHealthIndicator, Tabs, TaskQueueHealthCard, TelemetryChart, TenantSwitcher, Toast, ToggleSwitch, VirtualizedTable, WorkflowExecutionCard, WorkflowStepper)
- `src/app/components/ui/_rtl.scss`, `_responsive.scss`
- `src/app/components/commerce/CommerceRenderer.tsx`

## Tier 4 — Design System & Theming

### 13. Design System & Theming `56328194`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 13.0 | **Design System & Theming** (index) | `DONE` | `56328194` |
| 13.1 | Design Token Architecture | `DONE` | `56459368` |
| 13.2 | Theme Resolver | `DONE` | `57245777` |
| 13.3 | Color Presets (18) | `DONE` | `55738470` |
| 13.4 | Seasonal Themes (4) | `DONE` | `56492111` |
| 13.5 | Design Presets (4) | `DONE` | `56787064` |
| 13.6 | Theme Governance (WCAG AA, Versioning) | `DONE` | `56262716` |
| 13.7 | Tenant-Level Theme Overrides | `DONE` | `55738471` |
| 13.8 | Light/Dark Mode | `DONE` | `56492112` |
| 13.9 | Control Plane Theme System | `DONE` | `57081878` |
| 13.10 | CSS Modules Convention | `DONE` | `56885311` |

- `src/lib/design/` — `tokens.ts`, `themeResolver.ts`
- `src/control-plane/collections/tenant-theme-settings.ts`, `theme-profiles.ts`, `token-sets.ts`
- `src/control-plane/services/theme-resolver.ts`
- Theme config files, `*.module.css`, `*.module.scss` files

## Tier 5 — Domain Packages

### 14. Domain Package System `56360961`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 14.0 | **Domain Package System** (index) | `DONE` | `56360961` |
| 14.1 | Domain Package Structure | `DONE` | `57114626` |
| 14.2 | Domain Registry (37 Domains) | `TODO` | — |
| 14.3 | Domain Activation & Configuration | `TODO` | — |
| 14.4 | Domain Gate | `TODO` | — |
| 14.5 | Domain-Specific Blocks & Components | `TODO` | — |
| 14.6 | Domain Token CSS | `TODO` | — |
| 14.7 | Domain Data Filter & Transformer | `TODO` | — |
| 14.8 | BFF Domain Middleware | `TODO` | — |
| 14.9 | Domain Visibility in Admin (31 entries) | `TODO` | — |

- `src/lib/domain-loader.ts`, `domain-init.ts`, `domain-component-map.ts`
- `src/app/components/admin/DomainActivationPanel/`, `src/app/components/DomainGate/`
- `src/lib/data/domain-data-filter.ts`, `domain-response-transformer.ts`
- `src/utilities/bffDomainMiddleware.ts`
- Domain block registrations, domain CSS files, admin panel visibility config

## Tier 6 — Localization

### 15. Localization (i18n) `56360980`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 15.0 | **Localization (i18n)** (index) | `DONE` | `56360980` |
| 15.1 | i18n Architecture & RTL Support | `DONE` | `57147393` |
| 15.2 | RTL Detection & RTLProvider | `TODO` | — |
| 15.3 | URL-Driven Locale Selection | `TODO` | — |
| 15.4 | next-intl Configuration | `TODO` | — |
| 15.5 | Translation Messages | `TODO` | — |
| 15.6 | LocaleSwitcher Component | `TODO` | — |
| 15.7 | Localized Slug Plugin | `TODO` | — |

- `src/i18n/`, `src/i18n/messages/`
- `src/app/components/RTLProvider/`, `src/app/components/LocaleSwitcher/`
- `src/middleware.ts`
- `src/lib/plugins/localized-slug.ts`

## Tier 7 — Data & Storage

### 16. Storage Architecture `56393729`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 16.0 | **Storage Architecture** (index) | `DONE` | `56393729` |
| 16.1 | Dual Storage Provider Architecture | `DONE` | `57081857` |
| 16.2 | GCS Sidecar Adapter | `TODO` | — |
| 16.3 | MinIO Configuration | `TODO` | — |
| 16.4 | Storage Prefixes (96 prefixes, 11 groups) | `TODO` | — |
| 16.5 | Centralized Storage Gateway | `TODO` | — |
| 16.6 | Thumbnail Strategy & Image Optimization | `TODO` | — |

- `src/lib/storage/`, `src/lib/minio/`
- `src/app/api/storage/`
- Storage prefix config, image optimization config

### 17. Media Management `56131605`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 17.0 | **Media Management** (index) | `DONE` | `56131605` |
| 17.1 | MediaService & React Hooks | `DONE` | `56459284` |
| 17.2 | MediaViewModel | `DONE` | `57049169` |
| 17.3 | Media Proxy & Access Control | `DONE` | `57081918` |
| 17.4 | Media Lifecycle & Moderation | `DONE` | `57245797` |
| 17.5 | React Hooks (useMedia, useMediaList, etc.) | `DONE` | `56131685` |
| 17.6 | BFF Media API | `DONE` | `56590358` |
| 17.7 | URL Versioning & Cache Busting | `DONE` | `57409597` |
| 17.8 | Tenant-Scoped Access Control | `DONE` | `56229967` |
| 17.9 | OG Image Validation | `DONE` | `56328254` |
| 17.10 | Media Observability | `DONE` | `57147432` |
| 17.11 | Video Processing Plugin | `DONE` | `56361080` |

- `src/lib/media/`, `src/collections/Media/`
- `src/app/api/media/`, `src/app/api/bff/media/`
- `src/app/hooks/`
- `src/lib/plugins/video-processing.ts`
- Media view model definitions, media URL logic, media status fields, media logging, Pages collection hooks

### 18. Database & Data Model `56426497`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 18.0 | **Database & Data Model** (index) | `DONE` | `56426497` |
| 18.1 | Database Architecture | `DONE` | `57344002` |
| 18.2 | Collection Catalog (82 Collections) | `DONE` | `57114646` |
| 18.3 | Migration Strategy | `DONE` | `56295444` |
| 18.4 | Migrations | `DONE` | `56262737` |
| 18.5 | Seed Data | `DONE` | `56262757` |
| 18.6 | Database Scripts | `DONE` | `56885371` |

- `src/collections/`, `src/migrations/`
- `src/seed.ts`, `seed-templates.ts`
- `src/scripts/compare-dbs.ts`, `test-replit-db.ts`
- Database config, collection relationship fields

### 19. Caching Layer `56328214`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 19.0 | **Caching Layer** (index) | `DONE` | `56328214` |
| 19.1 | Cache Architecture | `DONE` | `56688717` |
| 19.2 | Cache Adapter & Layered Adapter | `DONE` | `57278466` |
| 19.3 | PG Cache | `DONE` | `55967785` |
| 19.4 | Key Builder Patterns | `DONE` | `57114746` |

- `src/lib/cache/` — `index.ts`, `cacheAdapter.ts`, `layeredAdapter.ts`, `pgCache.ts`, `keyBuilder.ts`

## Tier 8 — POI Spatial Engine

### 20. POI Spatial Identity Engine `56459265`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 20.0 | **POI Spatial Identity Engine** (index) | `DONE` | `56459265` |
| 20.1 | POI Constitution (Core Collection) | `DONE` | `56623164` |
| 20.2 | Geo Indexing (H3 + Geohash) | `DONE` | `56787024` |
| 20.3 | POI Capability Engine | `DONE` | `55771196` |
| 20.4 | POI Core Collections | `TODO` | — |
| 20.5 | POI Governance & Compliance | `TODO` | — |
| 20.6 | POI Commerce & Revenue | `TODO` | — |
| 20.7 | POI Content & Editorial | `TODO` | — |
| 20.8 | POI Operations & IoT | `TODO` | — |
| 20.9 | POI Mobility & Digital | `TODO` | — |
| 20.10 | POI Trust & Security | `TODO` | — |
| 20.11 | POI Tenant Overlays & Source Records | `TODO` | — |
| 20.12 | POI Collections & Routes | `TODO` | — |
| 20.13 | POI Claim System | `TODO` | — |
| 20.14 | POI Frontend Components (11) | `TODO` | — |
| 20.15 | PostGIS Spatial Intelligence | `PLANNED` | — |

- `src/lib/poi/`, `src/collections/POIs/`, `POIHierarchy/`, `POIView/`, `POIHours/`, `POIOwnership/`, `POILinks/`, `POIRelations/`, `POIExternalRefs/`, `POICapabilities/`
- `POIGovernanceBindings/`, `POIComplianceStatus/`, `POILicenses/`, `POIInsuranceRecords/`
- `POICommerceSummary/`, `POIBookingSummary/`, `POIRevenueTracking/`, `src/lib/commerce/poiProductSync.ts`
- `POIEditorialSections/`, `POIStoryBlocks/`, `POIFacts/`, `POIGuides/`, `POIMediaCuration/`, `POIPageTemplates/`, `POISectionRegistry/`, `POIPageContracts/`
- `POIRealtimeSignals/`, `POISensorBindings/`, `POICrowdAnalytics/`, `POIEnvironmentalData/`, `POIMaintenanceLog/`, `POIFloorPlans/`
- `POIMobilityProfile/`, `POIDigitalPresence/`, `POIRoutesTrails/`
- `POITrustProfile/`, `POISecurityProfile/`, `POIAccessibilityProfile/`, `POIServicesSummary/`
- `POITenantOverlays/`, `POISourceRecords/`, `POIVerificationRecords/`, `POINodeBindings/`, `POICollections/`
- `src/app/api/bff/poi-claim/`
- `src/components/poi/` (HeroSection, LocationMap, QuickFacts, CapabilityBar, ContactCard, EditorialSection, ExternalRefs, GovernancePanel, ParkingPayment, RatingReviews, ServicesPills, TrustBadge)
- `src/hooks/geoIndexHook.ts`

## Tier 9 — Persona System

### 21. Multi-Axis Persona System `56492033`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 21.0 | **Multi-Axis Persona System** (index) | `DONE` | `56492033` |
| 21.1 | Persona Architecture | `TODO` | — |
| 21.2 | Persona Collections | `TODO` | — |
| 21.3 | Persona Analytics | `TODO` | — |
| 21.4 | Persona Policy Engine | `TODO` | — |
| 21.5 | Persona Suggestion Engine | `TODO` | — |
| 21.6 | Persona Theme Mapping | `TODO` | — |
| 21.7 | Persona Commerce Guard | `TODO` | — |
| 21.8 | Persona Segment Mapper | `TODO` | — |
| 21.9 | Persona Workflow Guard | `TODO` | — |
| 21.10 | BFF Persona API | `TODO` | — |

- `src/lib/personas/` — `index.ts`, `analytics.ts`, `integrationAnalytics.ts`, `policyEngine.ts`, `suggestionEngine.ts`, `themeMapping.ts`
- `src/collections/Personas/`, `PersonaAssignments/`
- `src/lib/commerce/personaCommerceGuard.ts`, `personaSegmentMapper.ts`
- `src/lib/workflows/personaWorkflowGuard.ts`
- `src/app/api/bff/persona/` (persona, analytics, policy, suggestions)

## Tier 10 — AI System

### 22. AI Management System `56524801`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 22.0 | **AI Management System** (index) | `DONE` | `56524801` |
| 22.1 | AIPrompts Collection | `DONE` | `57245757` |
| 22.2 | AIResponses Collection | `DONE` | `56557628` |
| 22.3 | AI Execution API | `DONE` | `57376769` |
| 22.4 | AI Admin Views | `TODO` | — |
| 22.5 | Cost Tracking | `TODO` | — |
| 22.6 | BFF AI API | `TODO` | — |
| 22.7 | AI Page Composer | `PLANNED` | — |
| 22.8 | Block Intelligence & Vector Embeddings | `PLANNED` | — |
| 22.9 | @ai-stack/payloadcms Plugin | `TODO` | — |

- `src/lib/ai/`
- `src/collections/AIPrompts/`, `AIResponses/`, `BlockManifests/`
- `src/app/api/ai/`
- `src/app/api/bff/ai/` (context, moderation, recommendations)
- AI admin view components, AI cost calculation logic, plugin config

## Tier 11 — API Architecture

### 23. API Architecture `55738391`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 23.0 | **API Architecture** (index) | `DONE` | `55738391` |
| 23.1 | REST API (Payload Auto-Generated) | `DONE` | `55771217` |
| 23.2 | Custom API Routes | `DONE` | `57114665` |
| 23.3 | BFF Layer | `DONE` | `57409537` |
| 23.4 | GraphQL API | `TODO` | — |
| 23.5 | OpenAPI Documentation | `TODO` | — |
| 23.6 | Correlation ID Middleware | `TODO` | — |
| 23.7 | BFF Middleware & SDK Resolver | `TODO` | — |

- `src/app/api/` (admin, auth, ai, control-plane, health, ready, media, metrics, platform, storage, sync, templates, workflow-registry)
- `src/app/api/bff/` (ai, analytics, catalog, commerce, content, domains, education, healthcare, integrations, media, moderation, navigation, notifications, persona, pois, redirects, search, surface, tenant, theme, transportation, v2)
- `src/lib/openapi/`, `src/app/api/openapi/`, `src/app/api/docs/`
- `src/lib/correlationId.ts`, `src/app/api/correlationMiddleware.ts`
- `src/lib/bff/batch-resolver.ts`, `sdk-resolver.ts`, `middleware.ts`

## Tier 12 — Integrations & External Systems

### 24. External Integrations Hub `56557569`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 24.0 | **External Integrations Hub** (index) | `DONE` | `56557569` |
| 24.1 | Integration Architecture | `TODO` | — |
| 24.2 | Integration Health Monitoring | `TODO` | — |
| 24.3 | Integration Audit Trail | `TODO` | — |
| 24.4 | Integration Logger | `TODO` | — |
| 24.5 | Stub Adapters (Analytics, GIS, IoT, Payment, Social) | `TODO` | — |
| 24.6 | External Systems Collection | `TODO` | — |

- `src/lib/integrations/`, `adapters/`, `connectors/`
- `src/collections/IntegrationHealth/`, `ExternalSystems/`
- `src/lib/metrics/integrationMetrics.ts`
- `src/lib/audit/integrationAudit.ts`
- `src/lib/logging/integrationLogger.ts`
- `src/lib/integrations/adapters/stub*.ts`

### 25. Commerce — Medusa Integration `56590337`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 25.0 | **Commerce — Medusa Integration** (index) | `DONE` | `56590337` |
| 25.1 | Medusa Client | `TODO` | — |
| 25.2 | Commerce Access Control | `TODO` | — |
| 25.3 | Commerce Event Bridge | `TODO` | — |
| 25.4 | Commerce Node Mapping | `TODO` | — |
| 25.5 | POI Product Sync | `TODO` | — |
| 25.6 | Persona Commerce Guard | `TODO` | — |
| 25.7 | Residency Enforcement | `TODO` | — |
| 25.8 | Policy Resolver & Route Matcher | `TODO` | — |
| 25.9 | Commerce BFF Routes | `TODO` | — |
| 25.10 | Commerce Webhooks | `TODO` | — |

- `src/lib/commerce/` — `medusaClient.ts`, `commerceAccessControl.ts`, `eventBridge.ts`, `nodeMapping.ts`, `poiProductSync.ts`, `personaCommerceGuard.ts`, `residencyEnforcement.ts`, `policyResolver.ts`, `routeMatcher.ts`
- `src/app/api/bff/commerce/` (cart, orders, products, customers, inventory, analytics)
- `src/app/api/bff/integrations/commerce-webhook/`, `webhooks/commerce/`

### 26. Workflow Engine — Temporal `56492052`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 26.0 | **Workflow Engine — Temporal** (index) | `DONE` | `56492052` |
| 26.1 | Temporal Client | `TODO` | — |
| 26.2 | Temporal Cloud Sync | `TODO` | — |
| 26.3 | Workflow Registry | `TODO` | — |
| 26.4 | Workflow Collections | `TODO` | — |
| 26.5 | Workflow Failure Handling | `TODO` | — |
| 26.6 | Cross-System Orchestrator | `TODO` | — |
| 26.7 | Saga Executor | `TODO` | — |
| 26.8 | Sync Engine | `TODO` | — |
| 26.9 | Workflow Access Control | `TODO` | — |
| 26.10 | POI Workflow Definitions | `TODO` | — |
| 26.11 | Governance Validator (workflows) | `TODO` | — |

- `src/lib/temporal/` — `client.ts`, `syncService.ts`; `src/lib/temporal-client.ts`
- `src/lib/workflows/` — `workflowRegistry.ts`, `crossSystemOrchestrator.ts`, `sagaExecutor.ts`, `syncEngine.ts`, `workflowAccessControl.ts`, `poiWorkflowDefinitions.ts`, `governanceValidator.ts`
- `src/collections/Workflows/`, `WorkflowExecutions/`, `TaskQueues/`, `WorkflowSchedules/`, `WorkflowFailures/`

### 27. ERP — ERPNext Integration `56623105`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 27.0 | **ERP — ERPNext Integration** (index) | `DONE` | `56623105` |
| 27.1 | ERP BFF Routes | `TODO` | — |
| 27.2 | ERP Webhooks | `TODO` | — |

- `src/app/api/bff/integrations/erp/`
- `src/app/api/bff/integrations/webhooks/erp/`

### 28. Logistics — Fleetbase Integration `56655873`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 28.0 | **Logistics — Fleetbase Integration** (index) | `DONE` | `56655873` |
| 28.1 | Logistics BFF Routes | `TODO` | — |
| 28.2 | Logistics Webhooks | `TODO` | — |

- `src/app/api/bff/integrations/logistics/`
- `src/app/api/bff/integrations/webhooks/logistics/`

### 29. System Registry `56229908`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 29.0 | **System Registry** (index) | `DONE` | `56229908` |
| 29.1 | Systems Client Factory | `TODO` | — |
| 29.2 | System Registry Configuration | `TODO` | — |

- `src/lib/systems/` — `clientFactory.ts`, `registry.ts`

## Tier 13 — Event System & Messaging

### 30. Event-Driven Architecture `56229908`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 30.0 | **Event-Driven Architecture** (index) | `DONE` | `56229908` |
| 30.1 | Event Bus | `DONE` | `56426516` |
| 30.2 | Event Catalog | `DONE` | `57475073` |
| 30.3 | Event Envelope & Serialization | `DONE` | `57016382` |
| 30.4 | Outbox Pattern | `TODO` | — |
| 30.5 | Event Failure Handling | `TODO` | — |
| 30.6 | Workflow Bridge & Triggers | `TODO` | — |
| 30.7 | Event Tracking | `TODO` | — |
| 30.8 | Webhook System | `TODO` | — |

- `src/lib/events/` — `eventBus.ts`, `catalog.ts`, `envelope.ts`, `outboxService.ts`, `outboxWorker.ts`, `outboxEnhancement.ts`, `failureReporter.ts`, `workflowBridge.ts`, `workflowTriggers.ts`
- `src/collections/Outbox/`, `EventFailures/`, `EventTracking.ts`, `Webhooks/`
- `src/lib/webhooks/dispatcher.ts`, `src/hooks/webhookDispatch.ts`

### 31. Notification System `56688641`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 31.0 | **Notification System** (index) | `DONE` | `56688641` |
| 31.1 | Notification Architecture | `TODO` | — |
| 31.2 | Notification Service | `TODO` | — |
| 31.3 | Alert Rules Engine | `TODO` | — |
| 31.4 | Notification Channels | `TODO` | — |
| 31.5 | Notification Collections | `TODO` | — |
| 31.6 | BFF Notification Routes | `TODO` | — |

- `src/lib/notifications/` — `index.ts`, `notificationService.ts`, `alertRules.ts`, `channels/`
- `src/collections/Notifications/`, `NotificationPreferences/`
- `src/app/api/bff/notifications/`

### 32. Email Service `56721409`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 32.0 | **Email Service** (index) | `DONE` | `56721409` |
| 32.1 | Resend Adapter | `TODO` | — |
| 32.2 | SendGrid Fallback | `TODO` | — |
| 32.3 | SMTP Fallback | `TODO` | — |

- `src/lib/email/` — `resendAdapter.ts`

## Tier 14 — Observability & Operations

### 33. Observability & Monitoring `55771156`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 33.0 | **Observability & Monitoring** (index) | `DONE` | `55771156` |
| 33.1 | Structured Logging | `TODO` | — |
| 33.2 | Metrics Collection | `TODO` | — |
| 33.3 | Integration Metrics | `TODO` | — |
| 33.4 | System Health Monitoring | `TODO` | — |
| 33.5 | Health & Ready Endpoints | `TODO` | — |
| 33.6 | Audit Logging | `TODO` | — |
| 33.7 | Audit Retention Policies | `TODO` | — |
| 33.8 | Correlation ID Tracking | `TODO` | — |

- `src/lib/structuredLogger.ts`, `src/lib/correlationId.ts`
- `src/lib/metrics/collector.ts`, `integrationMetrics.ts`
- `src/collections/SystemHealth/`, `AuditLogs/`
- `src/lib/health/systemProbe.ts`
- `src/app/api/health/`, `src/app/api/ready/`
- `src/lib/audit/`, `src/lib/audit/retention.ts`, `src/hooks/auditLog.ts`

### 34. Performance & Benchmarks `56688660`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 34.0 | **Performance & Benchmarks** (index) | `DONE` | `56688660` |
| 34.1 | Benchmark Framework | `TODO` | — |
| 34.2 | Benchmark Suites | `TODO` | — |

- `src/lib/benchmarks/`, `src/lib/benchmarks/suites/`

## Tier 15 — Control Plane

### 35. Control Plane `56492071`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 35.0 | **Control Plane** (index) | `DONE` | `56492071` |
| 35.1 | Control Plane Architecture | `DONE` | `55738430` |
| 35.2 | Schema Collections | `DONE` | `56229927` |
| 35.3 | RefEnvelope (Cross-Plane References) | `DONE` | `57507841` |
| 35.4 | Surface Identities | `TODO` | — |
| 35.5 | SDK Contract Versions | `TODO` | — |
| 35.6 | Deployment Runs | `TODO` | — |
| 35.7 | Pod Manifests | `TODO` | — |
| 35.8 | Tenant Theme Settings | `TODO` | — |
| 35.9 | Theme Profiles & Token Sets | `TODO` | — |
| 35.10 | Theme Resolver Service | `TODO` | — |

- `src/control-plane/` — `index.ts`, `service.ts`, `types.ts`
- `src/control-plane/collections/` — `schema-collection-blueprints.ts`, `schema-field-blueprints.ts`, `schema-relationship-blueprints.ts`, `schema-domains.ts`, `policy-bindings.ts`, `surface-identities.ts`, `sdk-contract-versions.ts`, `deployment-runs.ts`, `pod-manifests.ts`, `tenant-theme-settings.ts`, `theme-profiles.ts`, `token-sets.ts`
- `src/control-plane/services/theme-resolver.ts`

## Tier 16 — Pod Template & Microservice Patterns

### 36. Pod Template System `56819713`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 36.0 | **Pod Template System** (index) | `DONE` | `56819713` |
| 36.1 | Pod Template Architecture | `TODO` | — |
| 36.2 | Auth Middleware Template | `TODO` | — |
| 36.3 | Environment Convention | `TODO` | — |
| 36.4 | Health Endpoint Template | `TODO` | — |
| 36.5 | Node Context Pattern | `TODO` | — |
| 36.6 | Pod Config Template | `TODO` | — |
| 36.7 | Tenant Scoping Pattern | `TODO` | — |
| 36.8 | Pod Registry | `TODO` | — |
| 36.9 | Sample Pods | `TODO` | — |

- `src/pod-template/` — `index.ts`, `auth-middleware.ts`, `env-convention.ts`, `health-endpoint.ts`, `node-context.ts`, `pod-config-template.ts`, `tenant-scoping.ts`, `registry.ts`, `samples/`

## Tier 17 — Frontend Architecture

### 37. Frontend Architecture `56852481`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 37.0 | **Frontend Architecture** (index) | `DONE` | `56852481` |
| 37.1 | Next.js App Router Configuration | `TODO` | — |
| 37.2 | Three-Tier URL Architecture | `TODO` | — |
| 37.3 | Route Groups | `TODO` | — |
| 37.4 | Middleware | `TODO` | — |
| 37.5 | Public Components | `TODO` | — |
| 37.6 | Login System | `TODO` | — |
| 37.7 | App Hooks | `TODO` | — |

- `src/app/` — `(app)/`, `(payload)/`, `(admin)/`, `(console)/`
- `src/middleware.ts`
- `src/app/components/PublicNav/`, `PublicFooter/`, `ThemeToggle/`, `LocaleSwitcher/`, `Login/`
- `src/app/hooks/`
- Next.js config, route group directories

## Tier 18 — DevOps & Deployment

### 38. DevOps & Deployment `55738411`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 38.0 | **DevOps & Deployment** (index) | `DONE` | `55738411` |
| 38.1 | Replit Reserved VM Configuration | `TODO` | — |
| 38.2 | Environment Variables & Secrets | `TODO` | — |
| 38.3 | Build Pipeline (Turbopack) | `TODO` | — |
| 38.4 | Database Migrations Strategy | `TODO` | — |
| 38.5 | Seed Data Management | `TODO` | — |
| 38.6 | Debug & Utility Scripts | `TODO` | — |
| 38.7 | Worker Process | `TODO` | — |

- `src/migrations/`, `src/seed.ts`, `src/seed-templates.ts`
- `src/scripts/` (debug-config, debug-env, debug-login, reset-passwords, compare-dbs, test-replit-db, refactor-access-tests)
- `src/worker.ts`
- Replit config, `.env` patterns, build config

## Tier 19 — Testing

### 39. Testing Strategy `56197140`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 39.0 | **Testing Strategy** (index) | `DONE` | `56197140` |
| 39.1 | Test Architecture | `TODO` | — |
| 39.2 | Integration Tests | `TODO` | — |
| 39.3 | Unit Tests by Module | `TODO` | — |
| 39.4 | Test Mocks | `TODO` | — |
| 39.5 | Testing Conventions & Patterns | `TODO` | — |

- `src/__tests__/`, `src/__tests__/integration/`, `src/test/`, `src/test/mocks/`
- `src/hooks/__tests__/`, `src/lib/*/__tests__/`, `src/app/api/__tests__/`, `src/utilities/__tests__/`

## Tier 20 — CMS Hooks Reference

### 40. CMS Hooks Reference `56197159`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 40.0 | **CMS Hooks Reference** (index) | `DONE` | `56197159` |
| 40.1 | Audit Log Hook | `TODO` | — |
| 40.2 | Capability Resolver Hook | `TODO` | — |
| 40.3 | Compliance Check Hook | `TODO` | — |
| 40.4 | Content Versioning Hook | `TODO` | — |
| 40.5 | Cross-Domain Validation Hook | `TODO` | — |
| 40.6 | Feature Gating Hook | `TODO` | — |
| 40.7 | Geo Index Hook (H3 + Geohash) | `TODO` | — |
| 40.8 | Governance Validation Hook | `TODO` | — |
| 40.9 | Node Validation Hook | `TODO` | — |
| 40.10 | Policy Inheritance Hook | `TODO` | — |
| 40.11 | Stewardship Validation Hook | `TODO` | — |
| 40.12 | Template Application Hook | `TODO` | — |
| 40.13 | Webhook Dispatch Hook | `TODO` | — |

- `src/hooks/` — `auditLog.ts`, `capabilityResolverHook.ts`, `complianceCheck.ts`, `contentVersioning.ts`, `cross-domain-validation-hook.ts`, `featureGating.ts`, `geoIndexHook.ts`, `governanceValidation.ts`, `nodeValidation.ts`, `policyInheritance.ts`, `stewardshipValidation.ts`, `templateApplication.ts`, `webhookDispatch.ts`

## Tier 21 — Templates & Processes

### 41. Templates & Processes `56688679`

| # | Page Title | Status | Page ID |
|---|-----------|--------|---------|
| 41.0 | **Templates & Processes** (index) | `DONE` | `56688679` |
| 41.1 | Template — Product Requirements | `EXISTING` | `98465` |
| 41.2 | Template — Meeting Notes | `EXISTING` | `98477` |
| 41.3 | Template — Decision Documentation | `EXISTING` | `98489` |
| 41.4 | Template — Runbook / Incident Response | `TODO` | — |
| 41.5 | Template — New Domain Package Checklist | `TODO` | — |

- Confluence default templates (41.1–41.3)

## Appendix A — Existing Confluence Pages (Pre-Plan)

These pages existed before this documentation plan was created:

| Page ID | Title | Current Parent | Proposed New Parent |
|---------|-------|---------------|-------------------|
| `98429` | Software Development (Space Homepage) | — (root) | — (root) |
| `55738370` | Dakkah CityOS Admin Panel — UX Modernization Documentation | `98429` | Section 10 index |
| `55771137` | Role-Capability Matrix & Component Visibility | `55738370` | Section 3 index |
| `98465` | Template — Product Requirements | `98429` | Section 41 |
| `98477` | Template — Meeting Notes | `98429` | Section 41 |
| `98489` | Template — Decision Documentation | `98429` | Section 41 |

## Appendix B — Cross-Reference Map

Some topics span multiple sections. This table shows where key concepts are documented primarily vs. referenced:

| Concept | Primary Section | Also Referenced In |
|---------|-----------------|-------------------|
| RBAC & Capabilities | 3. Security & RBAC | 9. Admin Console, 10. Admin UX, 14. Domains, 25. Commerce, 26. Workflows |
| Multi-Tenancy | 2. Multi-Tenancy | 5. CMS Core, 9. Admin Console, 14. Domains, 17. Media, 20. POI |
| Design Tokens | 13. Design System | 7. Page Builder, 12. UI Components, 14. Domains |
| Event Bus | 30. Events | 25. Commerce, 26. Workflows, 31. Notifications |
| Personas | 21. Personas | 25. Commerce, 26. Workflows, 20. POI |
| Policy System | 4. Governance | 26. Workflows, 25. Commerce, 35. Control Plane |
| Storage | 16. Storage | 17. Media, 5. CMS Core |
| BFF Layer | 23. API Architecture | Each domain-specific section (Commerce, POI, AI, etc.) |
| Node Hierarchy | 2. Multi-Tenancy | 20. POI, 4. Governance, 17. Media |
| Webhooks | 30. Events | 24. Integrations, 25. Commerce, 27. ERP, 28. Logistics |
