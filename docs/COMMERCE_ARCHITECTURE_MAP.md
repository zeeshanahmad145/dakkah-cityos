# Dakkah CityOS CMS — Commerce Architecture Map

**Last Updated: 2026-02-20** | **Status: Phase 30G Complete**

---

## Architecture Diagram

```mermaid
graph TB
    subgraph CMS ["CMS (Payload) — Source of Truth"]
        direction TB

        subgraph Domains ["Domain Collections"]
            HC["HealthcareAppointments\n(30B ✅)"]
            ED["Enrollments\n(30C ✅)"]
            TP["TransitPasses\n(30D ✅)"]
            ML["MarketListings\n(30E ✅)"]
            RE["Properties + Rentals\n(30F ✅)"]
            SP["ServicePlans\n(30G ✅)"]
            JL["JobListings"]
            EV["Events"]
        end

        subgraph POI ["POI Commerce Layer"]
            PBS["POIBookingSummary"]
            PCS["POICommerceSummary"]
            PRT["POIRevenueTracking"]
        end

        subgraph Finance ["Finance (Phase 29)"]
            INV["Invoices\n(platform-commission ✅)"]
        end

        subgraph Lib ["Commerce Library"]
            MC["medusaClient.ts\n(26 methods)"]
            AR["aggregatePoiRevenue.ts"]
            AB["aggregatePoiBookings.ts"]
            GM["generateMonthlyInvoices.ts"]
            MMS["medusaMetadataStandardizer.ts\n(8 builders ✅)"]
        end
    end

    subgraph Crons ["Cron Routes (3 active)"]
        CR1["GET /snapshot-poi-revenue\n(daily 01:00)"]
        CR2["GET /refresh-poi-summaries\n(daily 02:00)"]
        CR3["GET /generate-monthly-invoices\n(1st of month 00:00)"]
    end

    subgraph Webhooks ["Webhook Routes"]
        WH1["POST /webhooks/medusa-content\n(HMAC verified)"]
        WH2["POST /refresh-poi-summaries\n(order.placed → targeted)"]
    end

    subgraph Medusa ["Medusa Backend"]
        MO["Admin Orders API\n/admin/orders?metadata[cms_poi_id]=X"]
        MB["Medusa Booking Module"]
        MS2["Medusa Subscription Module"]
        MP["Medusa Products / Inventory"]
    end

    HC & ED & TP & ML & RE & SP --> MMS
    MMS --> MC
    MC --> MO & MB & MS2 & MP

    AB --> PBS
    AR --> PCS & PRT
    GM --> INV
    GM -.reads.-> PCS

    CR1 --> AR
    CR2 --> AR & AB
    CR3 --> GM
    WH1 --> WH2
    WH2 --> AR

    MO --> AR
```

---

## Domain → Medusa Mapping (Phase 30 Status)

| CMS Collection           | Domain           | Medusa Operation                      | Phase 30 |
| ------------------------ | ---------------- | ------------------------------------- | -------- |
| `HealthcareAppointments` | healthcare       | `createBooking()`                     | ✅ 30B   |
| `Enrollments`            | education        | `createProduct()`                     | ✅ 30C   |
| `TransitPasses`          | transportation   | `createProduct()` subscription        | ✅ 30D   |
| `MarketListings`         | agriculture      | `createProduct()` inventory           | ✅ 30E   |
| `Properties`             | real-estate      | `createProduct()` / `updateProduct()` | ✅ 30F   |
| `Rentals`                | real-estate      | `createProduct()` / `updateProduct()` | ✅ 30F   |
| `ServicePlans`           | commerce         | `createProduct()` / `updateProduct()` | ✅ 30G   |
| `Services`               | citizen-services | `createProduct()`                     | —        |
| `Events`                 | events-culture   | `createProduct()`                     | —        |

---

## Billing Cycle (Phase 29)

```
POI Commerce Summaries → [monthBounds filter + idempotency guard]
  → generateMonthlyInvoices.ts
    → Per-tenant: sum domain revenues from revenueByDomain
    → Platform fee: grossRevenueSAR × 3.5% (PLATFORM_FEE_RATE)
    → VAT: commissionSAR × 15% (KSA_VAT_RATE)
    → Create Invoice {
        invoiceType: "platform-commission"
        sourceEntity.billingMonth: "YYYY-MM"
        sourceEntity.lineItems: [domain × gross × rate × commission]
        amounts.subtotalSAR, amounts.taxSAR, amounts.totalSAR
      }
→ Cron: 1st of month 00:00 UTC
→ Manual: POST /api/cron/generate-monthly-invoices (ADMIN_API_TOKEN)
```

---

## Canonical Metadata (Phase 30 — All Hooks Done)

All 7 domain collections now inject via `buildMedusaMetadata()`:

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| `cms_poi_id`     | `doc.poi?.id \| doc.facility?.id \| null` |
| `cms_domain`     | Domain string (e.g. `"healthcare"`)       |
| `cms_tenant_id`  | `doc.tenant?.id \| doc.tenantId`          |
| `cms_collection` | Slug (e.g. `"healthcare-appointments"`)   |
| `cms_id`         | `doc.id`                                  |
| `cms_title`      | `doc.title \| doc.name`                   |
| `cms_synced_at`  | `new Date().toISOString()`                |

---

## vercel.json — Complete Cron Config

```json
{
  "crons": [
    { "path": "/api/cron/snapshot-poi-revenue", "schedule": "0 1 * * *" },
    { "path": "/api/cron/refresh-poi-summaries", "schedule": "0 2 * * *" },
    { "path": "/api/cron/generate-monthly-invoices", "schedule": "0 0 1 * *" }
  ]
}
```
