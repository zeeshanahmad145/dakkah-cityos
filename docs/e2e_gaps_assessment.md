# Dakkah CityOS Backend E2E Gaps Assessment

This document provides a 100% holistic view of all operations, database models (tables), mapped API endpoints, and their direct E2E test coverage.

## Executive Summary
- **Total Modules Tracked**: 163
- **Total Database Models (Tables)**: 267
- **Modules with E2E Tests**: 26
- **Overall E2E Module Coverage**: 15.95%

## Coverage Matrix by Module

| Module | Models (Tables) | Custom Operations | Endpoints Reached? | E2E Covered? |
|---|---|---|---|---|
| **admin-route-auth.integration** | None | Standard CRUD | ❌ No API | ✅ **Tested** |
| **advertising** | ad-account, ad-campaign, ad-creative, ad-placement, impression-log | 9 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **affiliate** | affiliate-commission, affiliate, click-tracking, influencer-campaign, referral-link | 7 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **affiliates** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **analytics** | analytics-event, dashboard, report | 9 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **approval-workflow** | approval-request, workflow-policy | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **attribution** | attribution-touch | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **auction** | auction-escrow, auction-listing, auction-result, auto-bid-rule, bid | 7 custom methods | ❌ No API | ✅ **Tested** |
| **auctions** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **audit** | audit-log | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **automotive** | part-catalog, test-drive, trade-in, vehicle-listing, vehicle-service | 8 custom methods | ✅ Yes | ✅ **Tested** |
| **availability** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **b2b** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **booking** | availability, booking, reminder, service-product, service-provider, waitlist-entry | 19 custom methods | ❌ No API | ✅ **Tested** |
| **bookings** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **bundles** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **cart-extension** | cart-metadata | 15 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **cart-rules** | cart-rule | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **channel** | sales-channel-mapping | 11 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **channels** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **chargeback** | chargeback | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **charities** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **charity** | charity-org, donation-campaign, donation, impact-report | 6 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **classified** | classified-listing, listing-category, listing-flag, listing-image, listing-offer | 6 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **classifieds** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **cms** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **cms-content** | cms-navigation, cms-page | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **commerce-contract** | contract, evidence-record, obligation, policy-snapshot | 5 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **commission** | commission-rule, commission-transaction | 7 custom methods | ❌ No API | ✅ **Tested** |
| **commission-rules** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **commissions** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **companies** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **company** | approval-workflow, company-user, company, payment-terms, purchase-order-item, purchase-order, tax-exemption | 15 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **consignments** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **credit** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **crowdfunding** | backer, campaign-update, campaign, pledge, reward-tier | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **custom** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **digital-product** | digital-asset, download-license | 9 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **digital-products** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **dispute** | dispute-message, dispute | 12 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **disputes** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **dropshipping** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **economic-health** | reconciliation-config | 8 custom methods | ✅ Yes | ✅ **Tested** |
| **education** | assignment, certificate, course, enrollment, lesson, quiz | 5 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **entitlements** | entitlement | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **event-outbox** | processed-event | Standard CRUD | ❌ No API | 🚨 **UNTESTED** |
| **event-ticketing** | check-in, event, seat-map, ticket-type, ticket, venue | 11 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **events** | event-outbox | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **file-replit** | None | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **file-vercel-blob** | None | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **financial-product** | insurance-policy, insurance-product, investment-plan, loan-application, loan-product | 8 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **financial-products** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **fitness** | class-booking, class-schedule, gym-membership, trainer-profile, wellness-plan | 9 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **flash-deals** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **flash-sales** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **fraud** | fraud-signal | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **freelance** | freelance-contract, freelance-dispute, gig-listing, milestone, proposal, time-log | 10 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **fulfillment-legs** | fulfillment-leg | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **gift-cards** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **governance** | governance-authority | 10 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **government** | citizen-profile, fine, municipal-license, permit, service-request | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **grocery** | batch-tracking, delivery-slot, fresh-product, substitution-rule | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **health** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **healthcare** | healthcare-appointment, insurance-claim, lab-order, medical-record, pharmacy-product, practitioner, prescription | 9 custom methods | ✅ Yes | ✅ **Tested** |
| **i18n** | locale-config, translation | 5 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **identity-gate** | identity-requirement | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **insurance** | insurance-claim, insurance-policy | 5 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **integrations** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **inventory** | inventory-lock | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **inventory-ext** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **inventory-extension** | reservation-hold, stock-alert, warehouse-transfer | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **invoice** | invoice-item, invoice | 10 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **invoices** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **kernel** | commerce-state, offer | 6 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **ledger** | freeze-record, ledger-entry | 7 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **ledger-snapshot** | daily-ledger-snapshot | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **legal** | attorney-profile, consultation, legal-case, retainer-agreement | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **lib** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **loyalty** | loyalty-account, loyalty-program, point-transaction | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **membership** | membership-tier, membership, points-ledger, redemption, reward | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **memberships** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **metering** | metering-models | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **metrics** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **middleware-rate-limiter** | None | Standard CRUD | ❌ No API | ✅ **Tested** |
| **newsletter** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **node** | node | 9 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **nodes** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **notification-preferences** | notification-preference | 10 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **ops-health** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **order-fulfillment.integration** | None | Standard CRUD | ❌ No API | ✅ **Tested** |
| **order-orchestration** | order-sla-timer, order-state-config, order-transition-log | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **parking** | parking-session, parking-zone, ride-request, shuttle-route | 10 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **payload** | payload-record | 2 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **payment-terms** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **payout** | payout-transaction-link, payout | 10 custom methods | ❌ No API | ✅ **Tested** |
| **payouts** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **persona** | persona-assignment, persona | 8 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **personas** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **pet-service** | grooming-booking, pet-product, pet-profile, vet-appointment | 9 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **pet-services** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **platform** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **policy-engine** | policy-rule | 2 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **pricing-resolver** | pricing-decision | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **pricing-tiers** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **print-on-demand** | pod-order, pod-product | 4 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **products** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **projections** | vendor-projection | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **promotion-ext** | customer-segment, gift-card-ext, product-bundle, referral | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **promotions-ext** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **purchase-orders** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **quote** | quote-item, quote | 5 custom methods | ❌ No API | ✅ **Tested** |
| **quotes** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **real-estate** | agent-profile, lease-agreement, property-document, property-listing, property-valuation, viewing-appointment | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **reconciliation** | reconciliation-batch | 2 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **region-zone** | region-zone-mapping | 8 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **region-zones** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **rental** | damage-claim, rental-agreement, rental-period, rental-product, rental-return | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **rentals** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **resource** | resource | 3 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **restaurant** | kitchen-order, menu-item, menu, modifier-group, modifier, restaurant, table-reservation | 10 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **restaurants** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **revenue-topology** | revenue-split-rule | 1 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **review** | review | 10 custom methods | ❌ No API | ✅ **Tested** |
| **reviews** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **rma** | return-request, rma-inspection | 3 custom methods | ❌ No API | ✅ **Tested** |
| **saga** | saga-instance | 6 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **search** | search-index-config | 5 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **seed-verticals** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **sentry** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **service-providers** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **settings** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **settlement** | settlement-ledger, settlement-payout-line | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **shipping-ext** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **shipping-extension** | carrier-config, shipping-rate | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **simulation** | None | 4 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **social-commerce** | group-buy, live-product, live-stream, social-post, social-share | 6 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **store** | store | 10 custom methods | ❌ No API | ✅ **Tested** |
| **subscription** | billing-cycle, subscription-event, subscription-item, subscription-plan, subscription | 17 custom methods | ❌ No API | ✅ **Tested** |
| **subscription-benefits** | subscription-benefit-rule | 1 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **subscription-plans** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **subscriptions** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **tax-artifact** | tax-invoice | 4 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **tax-config** | tax-exemption, tax-rule | 11 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **temporal** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **tenant** | service-channel, tenant-billing, tenant-poi, tenant-relationship, tenant-settings, tenant-user, tenant | 22 custom methods | ✅ Yes | ✅ **Tested** |
| **tenants** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **trade-in** | trade-in-offer, trade-in-request | 7 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **trade-ins** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **travel** | amenity, guest-profile, property, rate-plan, reservation, room-type, room | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **try-before-you-buy** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **utilities** | meter-reading, usage-record, utility-account, utility-bill | 8 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **vendor** | marketplace-listing, vendor-analytics, vendor-order, vendor-product, vendor-sla-record, vendor-user, vendor | 15 custom methods | ❌ No API | ✅ **Tested** |
| **vendors** | None | Standard CRUD | ✅ Yes | ✅ **Tested** |
| **volume-deals** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **volume-pricing** | volume-pricing-tier, volume-pricing | 3 custom methods | ✅ Yes | ✅ **Tested** |
| **wallet** | escrow-milestone, wallet-hold, wallet-transaction, wallet | 13 custom methods | ✅ Yes | ✅ **Tested** |
| **wallets** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **warranties** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **warranty** | repair-order, service-center, spare-part, warranty-claim, warranty-plan | 7 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **webhooks** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |
| **white-label** | white-label-config, white-label-theme | 3 custom methods | ✅ Yes | 🚨 **UNTESTED** |
| **wishlist** | wishlist-item, wishlist | 7 custom methods | ❌ No API | 🚨 **UNTESTED** |
| **wishlists** | None | Standard CRUD | ✅ Yes | 🚨 **UNTESTED** |

## Critical Gaps
The vast majority of Domain Modules strictly implement Database schemas and Medusa abstractions without proper E2E verification. The newly authored Custom E2E Runner (vitest --pool=forks) solves the connection drops, meaning we can rapidly inject `crud-test-generator.ts` wrappers into the 🚨 **UNTESTED** domains.

### Business Logic Blindspots
Modules like **Automotive** hold complex service operations (e.g. `submitTradeIn`, `calculateFinancing`) beyond simple CRUD logic. While CRUD endpoints interact with the base tables, deep integration tests must be written for the custom business methods.
