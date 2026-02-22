-- SQL Migration Script: Fix Image URLs and Seed Data Gaps
-- Date: 2026-02-16
-- Purpose: Migrate Unsplash URLs to platform storage paths and fill empty image columns
-- Note: This script is idempotent and safe to run multiple times

-- ============================================================================
-- SECTION 1: FIX UNSPLASH URLS IN DIRECT IMAGE COLUMNS
-- ============================================================================
-- These statements replace Unsplash URLs with platform storage paths

-- Fix ad_creative unsplash URLs
UPDATE ad_creative 
SET image_url = '/platform/storage/serve?path=advertising/ad-creative-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url LIKE '%unsplash%'
AND image_url IS NOT NULL;

-- Fix cityos_store unsplash URLs
UPDATE cityos_store 
SET logo_url = '/platform/storage/serve?path=stores/store-logo-' || substring(id from 1 for 8) || '.jpg'
WHERE logo_url LIKE '%unsplash%'
AND logo_url IS NOT NULL;

-- ============================================================================
-- SECTION 2: FILL EMPTY IMAGE COLUMNS WITH DEFAULT PATHS
-- ============================================================================
-- These statements populate NULL or empty image columns with platform storage URLs

-- Fill agent_profile photo_url
UPDATE agent_profile 
SET photo_url = '/platform/storage/serve?path=agents/agent-profile-' || substring(id from 1 for 8) || '.jpg'
WHERE photo_url IS NULL OR photo_url = '';

-- Fill event image_url
UPDATE event 
SET image_url = '/platform/storage/serve?path=events/event-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url IS NULL OR image_url = '';

-- Fill pet_profile photo_url
UPDATE pet_profile 
SET photo_url = '/platform/storage/serve?path=pets/pet-' || substring(id from 1 for 8) || '.jpg'
WHERE photo_url IS NULL OR photo_url = '';

-- Fill reward image_url
UPDATE reward 
SET image_url = '/platform/storage/serve?path=rewards/reward-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url IS NULL OR image_url = '';

-- Fill reward_tier image_url
UPDATE reward_tier 
SET image_url = '/platform/storage/serve?path=rewards/tier-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url IS NULL OR image_url = '';

-- Fill membership_tier icon_url
UPDATE membership_tier 
SET icon_url = '/platform/storage/serve?path=membership/tier-icon-' || substring(id from 1 for 8) || '.png'
WHERE icon_url IS NULL OR icon_url = '';

-- Fill tenant logo_url and favicon_url
UPDATE tenant 
SET 
  logo_url = '/platform/storage/serve?path=tenants/dakkah-logo.png',
  favicon_url = '/platform/storage/serve?path=tenants/dakkah-favicon.png'
WHERE logo_url IS NULL OR logo_url = '';

-- Fill service_provider avatar_url
UPDATE service_provider 
SET avatar_url = '/platform/storage/serve?path=providers/provider-' || substring(id from 1 for 8) || '.jpg'
WHERE avatar_url IS NULL OR avatar_url = '';

-- Fill vendor logo_url
UPDATE vendor 
SET logo_url = '/platform/storage/serve?path=vendors/vendor-logo-' || substring(id from 1 for 8) || '.jpg'
WHERE logo_url IS NULL OR logo_url = '';

-- Fill vendor banner_url
UPDATE vendor 
SET banner_url = '/platform/storage/serve?path=vendors/vendor-banner-' || substring(id from 1 for 8) || '.jpg'
WHERE banner_url IS NULL OR banner_url = '';

-- Fill live_stream thumbnail_url
UPDATE live_stream 
SET thumbnail_url = '/platform/storage/serve?path=streams/stream-' || substring(id from 1 for 8) || '.jpg'
WHERE thumbnail_url IS NULL OR thumbnail_url = '';

-- Fill menu_item image_url
UPDATE menu_item 
SET image_url = '/platform/storage/serve?path=restaurants/menu-item-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url IS NULL OR image_url = '';

-- attorney_profile photo_url — already has images from initial seed; only fix empty/missing records
UPDATE attorney_profile
SET photo_url = '/platform/storage/serve?path=legal/attorney-' || substring(id from 1 for 8) || '.jpg'
WHERE photo_url IS NULL OR photo_url = '';

-- charity_org logo_url — already has images from initial seed; only fix empty/missing records
UPDATE charity_org
SET logo_url = '/platform/storage/serve?path=charity/org-logo-' || substring(id from 1 for 8) || '.jpg'
WHERE logo_url IS NULL OR logo_url = '';

-- course thumbnail_url — already has images from initial seed; only fix empty/missing records
UPDATE course
SET thumbnail_url = '/platform/storage/serve?path=education/course-thumb-' || substring(id from 1 for 8) || '.jpg'
WHERE thumbnail_url IS NULL OR thumbnail_url = '';

-- practitioner photo_url — already has images from initial seed; only fix empty/missing records
UPDATE practitioner
SET photo_url = '/platform/storage/serve?path=healthcare/practitioner-' || substring(id from 1 for 8) || '.jpg'
WHERE photo_url IS NULL OR photo_url = '';

-- restaurant logo_url — already has images from initial seed; only fix empty/missing records
UPDATE restaurant
SET logo_url = '/platform/storage/serve?path=restaurants/restaurant-logo-' || substring(id from 1 for 8) || '.jpg'
WHERE logo_url IS NULL OR logo_url = '';

-- restaurant banner_url — already has images from initial seed; only fix empty/missing records
UPDATE restaurant
SET banner_url = '/platform/storage/serve?path=restaurants/restaurant-banner-' || substring(id from 1 for 8) || '.jpg'
WHERE banner_url IS NULL OR banner_url = '';

-- trainer_profile photo_url — already has images from initial seed; only fix empty/missing records
UPDATE trainer_profile
SET photo_url = '/platform/storage/serve?path=fitness/trainer-' || substring(id from 1 for 8) || '.jpg'
WHERE photo_url IS NULL OR photo_url = '';

-- venue image_url — already has images from initial seed; only fix empty/missing records
UPDATE venue
SET image_url = '/platform/storage/serve?path=events/venue-' || substring(id from 1 for 8) || '.jpg'
WHERE image_url IS NULL OR image_url = '';

-- ============================================================================
-- SECTION 3: ADD IMAGE METADATA TO JSONB COLUMNS
-- ============================================================================
-- These statements populate metadata columns with image URLs

-- Fill crowdfund_campaign metadata with thumbnail and images
UPDATE crowdfund_campaign 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'thumbnail', '/platform/storage/serve?path=crowdfunding/campaign-thumb-' || substring(id from 1 for 8) || '.jpg',
  'images', jsonb_build_array(
    '/platform/storage/serve?path=crowdfunding/campaign-' || substring(id from 1 for 8) || '-1.jpg',
    '/platform/storage/serve?path=crowdfunding/campaign-' || substring(id from 1 for 8) || '-2.jpg'
  )
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'thumbnail') IS NULL);

-- Fill property_listing metadata with images and thumbnail
UPDATE property_listing 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'thumbnail', '/platform/storage/serve?path=real-estate/property-thumb-' || substring(id from 1 for 8) || '.jpg',
  'images', jsonb_build_array(
    '/platform/storage/serve?path=real-estate/property-' || substring(id from 1 for 8) || '-1.jpg',
    '/platform/storage/serve?path=real-estate/property-' || substring(id from 1 for 8) || '-2.jpg'
  )
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'thumbnail') IS NULL);

-- Fill vehicle_listing metadata with images and thumbnail
UPDATE vehicle_listing 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'thumbnail', '/platform/storage/serve?path=automotive/vehicle-thumb-' || substring(id from 1 for 8) || '.jpg',
  'images', jsonb_build_array(
    '/platform/storage/serve?path=automotive/vehicle-' || substring(id from 1 for 8) || '-1.jpg',
    '/platform/storage/serve?path=automotive/vehicle-' || substring(id from 1 for 8) || '-2.jpg'
  )
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'thumbnail') IS NULL);

-- Fill subscription_plan metadata with image
UPDATE subscription_plan 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=subscriptions/plan-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill loan_product metadata with image
UPDATE loan_product 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=financial/loan-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill class_schedule metadata with image
UPDATE class_schedule 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=education/class-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill parking_zone metadata with image
UPDATE parking_zone 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=parking/zone-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill rental_product metadata with images and thumbnail
UPDATE rental_product 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'thumbnail', '/platform/storage/serve?path=rentals/product-thumb-' || substring(id from 1 for 8) || '.jpg',
  'images', jsonb_build_array(
    '/platform/storage/serve?path=rentals/product-' || substring(id from 1 for 8) || '-1.jpg',
    '/platform/storage/serve?path=rentals/product-' || substring(id from 1 for 8) || '-2.jpg'
  )
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'thumbnail') IS NULL);

-- Fill warranty_plan metadata with image
UPDATE warranty_plan 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=warranty/plan-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill product_bundle metadata with image
UPDATE product_bundle 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=products/bundle-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- Fill gift_card_ext metadata with image
UPDATE gift_card_ext 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=gift-cards/card-' || substring(id from 1 for 8) || '.jpg'
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'image') IS NULL);

-- ============================================================================
-- SECTION 4: FIX UNSPLASH URLS IN JSONB METADATA COLUMNS
-- ============================================================================
-- These statements remove Unsplash URLs from metadata and replace with platform paths
-- Uses proper JSONB merge semantics (|| operator) instead of text concatenation

-- Fix unsplash URLs in gig_listing metadata
UPDATE gig_listing 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=freelance/gig-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in insurance_product metadata
UPDATE insurance_product 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=insurance/product-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in donation_campaign metadata
UPDATE donation_campaign 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=charity/campaign-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in classified_listing metadata
UPDATE classified_listing 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=classifieds/listing-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in auction_listing metadata
UPDATE auction_listing 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=auctions/listing-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in event metadata
UPDATE event 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=events/event-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in social_post metadata
UPDATE social_post 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=social/post-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in service_product metadata
UPDATE service_product 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=services/product-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- Fix unsplash URLs in digital_asset metadata
UPDATE digital_asset 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'image', '/platform/storage/serve?path=digital/asset-' || substring(id from 1 for 8) || '.jpg'
)
WHERE metadata::text LIKE '%unsplash%';

-- ============================================================================
-- SECTION 5: SEED DATA FOR ANCILLARY TABLES
-- ============================================================================
-- These INSERT statements fill the 9 ancillary tables with Saudi-themed seed data
-- All statements use ON CONFLICT (id) DO NOTHING for idempotency

-- 5a) wallet_transaction — 4 records (top_up, payment, refund, cashback)
INSERT INTO wallet_transaction (id, wallet_id, type, amount, balance_after, description, reference_id, metadata, raw_amount, raw_balance_after)
VALUES
  ('wt_seed_topup_01', (SELECT id FROM wallet LIMIT 1), 'top_up', 500.00, 500.00, 'Initial wallet top-up via Mada card', 'ref_topup_001', '{"method": "mada", "channel": "online"}'::jsonb, '{"value": "500", "precision": 20}'::jsonb, '{"value": "500", "precision": 20}'::jsonb),
  ('wt_seed_payment_01', (SELECT id FROM wallet LIMIT 1), 'payment', -200.00, 300.00, 'Payment for order #ORD-2026-0451', 'ref_pay_001', '{"order_id": "ORD-2026-0451", "channel": "storefront"}'::jsonb, '{"value": "-200", "precision": 20}'::jsonb, '{"value": "300", "precision": 20}'::jsonb),
  ('wt_seed_refund_01', (SELECT id FROM wallet LIMIT 1), 'refund', 50.00, 350.00, 'Partial refund for returned item', 'ref_refund_001', '{"reason": "item_returned", "original_order": "ORD-2026-0451"}'::jsonb, '{"value": "50", "precision": 20}'::jsonb, '{"value": "350", "precision": 20}'::jsonb),
  ('wt_seed_cashback_01', (SELECT id FROM wallet LIMIT 1), 'cashback', 25.00, 375.00, 'Cashback reward from Riyadh Season promotion', 'ref_cashback_001', '{"campaign": "riyadh_season_2026", "percentage": 5}'::jsonb, '{"value": "25", "precision": 20}'::jsonb, '{"value": "375", "precision": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5b) tenant_poi — 3 records (office, store, pickup_point)
INSERT INTO tenant_poi (id, tenant_id, name, slug, poi_type, address_line1, city, state, postal_code, country_code, latitude, longitude, phone, email, is_primary, is_active, metadata)
VALUES
  ('poi_seed_kafd_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'King Abdullah Financial District', 'king-abdullah-financial-district', 'office', 'KAFD, King Fahd Road', 'Riyadh', 'Riyadh Region', '13519', 'SA', 24.7671, 46.6396, '+966112345678', 'kafd@dakkah.sa', true, true, '{"zone": "central_riyadh", "parking_available": true}'::jsonb),
  ('poi_seed_boulevard_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'Riyadh Boulevard', 'riyadh-boulevard', 'store', 'Prince Mohammed Bin Salman Road', 'Riyadh', 'Riyadh Region', '12382', 'SA', 24.7255, 46.6356, '+966113456789', 'boulevard@dakkah.sa', false, true, '{"zone": "riyadh_boulevard", "seasonal": true}'::jsonb),
  ('poi_seed_diriyah_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'Diriyah Gate', 'diriyah-gate', 'pickup_point', 'Diriyah Gate Development', 'Diriyah', 'Riyadh Region', '13711', 'SA', 24.7341, 46.5728, '+966114567890', 'diriyah@dakkah.sa', false, true, '{"zone": "diriyah", "heritage_site": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5c) quote_item — 4 records linked to existing quotes
INSERT INTO quote_item (id, quote_id, product_id, variant_id, title, description, sku, quantity, unit_price, subtotal, discount_total, tax_total, total, raw_unit_price, raw_subtotal, raw_discount_total, raw_tax_total, raw_total)
VALUES
  ('qi_seed_01', 'q_01', 'prod_01KGZ2PS2QMB6SMDDNX3JY2WR1', 'variant_01KGXWKEX0B3HXE2F3CR74M3DN', 'Premium Oud Collection', 'Handcrafted Saudi oud set with luxury packaging', 'OUD-PREM-001', 5, 450.00, 2250.00, 0, 337.50, 2587.50, '{"value": "450", "precision": 20}'::jsonb, '{"value": "2250", "precision": 20}'::jsonb, '{"value": "0", "precision": 20}'::jsonb, '{"value": "337.50", "precision": 20}'::jsonb, '{"value": "2587.50", "precision": 20}'::jsonb),
  ('qi_seed_02', 'q_01', 'prod_01KGZ2PSEZR6KYNP7FS6NG5XTN', 'variant_01KGXWKEX1JX3PQ47XY1V4FNX0', 'Arabic Coffee Maker Set', 'Traditional dallah with finjan cups', 'COF-SET-001', 10, 180.00, 1800.00, 0, 270.00, 2070.00, '{"value": "180", "precision": 20}'::jsonb, '{"value": "1800", "precision": 20}'::jsonb, '{"value": "0", "precision": 20}'::jsonb, '{"value": "270", "precision": 20}'::jsonb, '{"value": "2070", "precision": 20}'::jsonb),
  ('qi_seed_03', 'q_02', 'prod_01KGZ2PRSBJH8DJCXXNZB2FJ2Q', 'variant_01KGXWKEX160ZXQ75GXQV774H2', 'Sadu Weaving Wall Art', 'Hand-woven Sadu textile artwork', 'ART-SADU-001', 3, 320.00, 960.00, 0, 144.00, 1104.00, '{"value": "320", "precision": 20}'::jsonb, '{"value": "960", "precision": 20}'::jsonb, '{"value": "0", "precision": 20}'::jsonb, '{"value": "144", "precision": 20}'::jsonb, '{"value": "1104", "precision": 20}'::jsonb),
  ('qi_seed_04', 'q_02', 'prod_01KGZ2PRXSWNQWQZ1Y4XTQ6DAR', 'variant_01KGXWKEX16EH69JXGSY3TQ4SQ', 'Date Gift Box — Khlas Variety', 'Premium Khlas dates from Al-Ahsa', 'DATE-KHL-001', 20, 95.00, 1900.00, 0, 285.00, 2185.00, '{"value": "95", "precision": 20}'::jsonb, '{"value": "1900", "precision": 20}'::jsonb, '{"value": "0", "precision": 20}'::jsonb, '{"value": "285", "precision": 20}'::jsonb, '{"value": "2185", "precision": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5d) proposal — 3 records (E-commerce Platform, Event App, Smart City Dashboard)
INSERT INTO proposal (id, tenant_id, gig_id, client_id, freelancer_id, title, description, proposed_price, currency_code, estimated_duration_days, milestones, status, cover_letter, submitted_at, raw_proposed_price)
VALUES
  ('prop_seed_01', '01KGZ2JRYX607FWMMYQNQRKVWS', (SELECT id FROM gig_listing LIMIT 1), 'cus_01KGZ2JS53BEYQAQ28YYZEMPKC', 'freelancer_design_01', 'E-commerce Platform for Saudi Artisans', 'Full-stack marketplace platform connecting Saudi artisans with global buyers, featuring Arabic/English bilingual support, Mada payment integration, and ZATCA e-invoicing compliance.', 75000.00, 'SAR', 90, '[{"title": "Discovery & Design", "amount": 15000, "duration_days": 15}, {"title": "Core Development", "amount": 35000, "duration_days": 45}, {"title": "Integration & Testing", "amount": 25000, "duration_days": 30}]'::jsonb, 'submitted', 'With 8 years of experience building Arabic-first e-commerce platforms, I am excited to bring Saudi artisan crafts to the global market through this platform.', NOW() - INTERVAL '5 days', '{"value": "75000", "precision": 20}'::jsonb),
  ('prop_seed_02', '01KGZ2JRYX607FWMMYQNQRKVWS', (SELECT id FROM gig_listing LIMIT 1), 'cus_01KGZ2JS5P4S10CEF14VAYEZZ7', 'freelancer_translation_01', 'Riyadh Season Event App', 'Mobile-responsive event management application for Riyadh Season featuring real-time ticketing, AR venue navigation, and multi-language support for international visitors.', 120000.00, 'SAR', 60, '[{"title": "UI/UX Design", "amount": 20000, "duration_days": 10}, {"title": "App Development", "amount": 70000, "duration_days": 35}, {"title": "AR Integration & Launch", "amount": 30000, "duration_days": 15}]'::jsonb, 'submitted', 'Having built event apps for previous Riyadh Season editions, I understand the scale and requirements of this prestigious entertainment initiative.', NOW() - INTERVAL '3 days', '{"value": "120000", "precision": 20}'::jsonb),
  ('prop_seed_03', '01KGZ2JRYX607FWMMYQNQRKVWS', (SELECT id FROM gig_listing LIMIT 1), 'cus_01KGZ2JS6ET997Q1HXY8BBNQ0F', 'freelancer-002', 'NEOM Smart City Dashboard', 'Real-time IoT analytics dashboard for NEOM smart city infrastructure monitoring, featuring AI-powered predictive maintenance, energy optimization, and citizen engagement metrics.', 200000.00, 'SAR', 120, '[{"title": "Architecture & Data Pipeline", "amount": 50000, "duration_days": 25}, {"title": "Dashboard Development", "amount": 80000, "duration_days": 50}, {"title": "AI Models & Optimization", "amount": 50000, "duration_days": 30}, {"title": "Testing & Deployment", "amount": 20000, "duration_days": 15}]'::jsonb, 'submitted', 'As a certified IoT architect with smart city experience across the GCC, I am uniquely positioned to deliver this critical NEOM infrastructure component.', NOW() - INTERVAL '1 day', '{"value": "200000", "precision": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5e) credit_line — 3 records (store_credit, gift_card, loyalty_points)
INSERT INTO credit_line (id, cart_id, reference, reference_id, amount, raw_amount, metadata)
VALUES
  ('cl_seed_store_01', 'cart_01KGZD30EQJ6Y1V2T6G1XJHC0T', 'store_credit', 'sc_ref_001', 500.00, '{"value": "500", "precision": 20}'::jsonb, '{"type": "store_credit", "reason": "loyalty_reward", "issued_by": "admin"}'::jsonb),
  ('cl_seed_gift_01', 'cart_01KGZD30EQJ6Y1V2T6G1XJHC0T', 'gift_card', 'gc_ref_001', 250.00, '{"value": "250", "precision": 20}'::jsonb, '{"type": "gift_card", "card_code": "GIFT-SA-2026", "sender": "corporate_gifting"}'::jsonb),
  ('cl_seed_loyalty_01', 'cart_01KGZD30PV1HJXRP6B4H7BN6HV', 'loyalty_points', 'lp_ref_001', 150.00, '{"value": "150", "precision": 20}'::jsonb, '{"type": "loyalty_points", "points_redeemed": 1500, "conversion_rate": 0.10}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5f) dashboard — 3 records (Commerce Overview, Vendor Performance, Saudi Regions Analytics)
INSERT INTO dashboard (id, tenant_id, name, slug, widgets, layout, is_default, role_access, metadata)
VALUES
  ('dash_seed_commerce_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'Commerce Overview', 'commerce-overview', '[{"type": "metric_card", "title": "Total Revenue", "metric": "total_revenue"}, {"type": "chart", "title": "Sales Trend", "chart_type": "line"}, {"type": "metric_card", "title": "Orders Today", "metric": "orders_today"}, {"type": "table", "title": "Top Products", "data_source": "top_products"}]'::jsonb, '{"columns": 2, "rows": 2}'::jsonb, true, '["admin", "manager"]'::jsonb, '{"theme": "default", "refresh_interval": 300}'::jsonb),
  ('dash_seed_vendor_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'Vendor Performance', 'vendor-performance', '[{"type": "chart", "title": "Vendor Sales Distribution", "chart_type": "pie"}, {"type": "table", "title": "Vendor Rankings", "data_source": "vendor_rankings"}, {"type": "metric_card", "title": "Active Vendors", "metric": "active_vendors"}, {"type": "chart", "title": "Commission Revenue", "chart_type": "bar"}]'::jsonb, '{"columns": 2, "rows": 2}'::jsonb, false, '["admin"]'::jsonb, '{"theme": "vendor", "refresh_interval": 600}'::jsonb),
  ('dash_seed_regions_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'Saudi Regions Analytics', 'saudi-regions-analytics', '[{"type": "map", "title": "Regional Sales Heatmap", "data_source": "regional_sales"}, {"type": "chart", "title": "City-wise Performance", "chart_type": "bar"}, {"type": "table", "title": "Zone Breakdown", "data_source": "zone_metrics"}, {"type": "metric_card", "title": "Coverage Areas", "metric": "coverage_count"}]'::jsonb, '{"columns": 2, "rows": 2}'::jsonb, false, '["admin", "manager", "analyst"]'::jsonb, '{"theme": "geographic", "refresh_interval": 900}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5g) shipping_rate — 4 records (SMSA, Aramex, Naqel, Zajil)
INSERT INTO shipping_rate (id, tenant_id, carrier_id, carrier_name, service_type, origin_zone, destination_zone, base_rate, per_kg_rate, min_weight, max_weight, estimated_days_min, estimated_days_max, is_active, metadata, raw_base_rate, raw_per_kg_rate)
VALUES
  ('sr_seed_smsa_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'carrier_smsa', 'SMSA Express', 'express', 'riyadh', 'riyadh', 15.00, 3.00, 0.1, 30.0, 1, 2, true, '{"tracking": true, "cod_available": true}'::jsonb, '{"value": "15", "precision": 20}'::jsonb, '{"value": "3", "precision": 20}'::jsonb),
  ('sr_seed_aramex_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'carrier_aramex', 'Aramex', 'standard', 'riyadh', 'jeddah', 25.00, 5.00, 0.1, 50.0, 2, 4, true, '{"tracking": true, "insurance_available": true}'::jsonb, '{"value": "25", "precision": 20}'::jsonb, '{"value": "5", "precision": 20}'::jsonb),
  ('sr_seed_naqel_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'carrier_naqel', 'Naqel Express', 'standard', 'riyadh', 'dammam', 20.00, 4.00, 0.1, 40.0, 2, 3, true, '{"tracking": true, "cold_chain": false}'::jsonb, '{"value": "20", "precision": 20}'::jsonb, '{"value": "4", "precision": 20}'::jsonb),
  ('sr_seed_zajil_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'carrier_zajil', 'Zajil Express', 'economy', 'nationwide', 'nationwide', 12.00, 2.50, 0.1, 25.0, 3, 7, true, '{"tracking": true, "rural_coverage": true}'::jsonb, '{"value": "12", "precision": 20}'::jsonb, '{"value": "2.50", "precision": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5h) reservation_hold — 2 records
INSERT INTO reservation_hold (id, tenant_id, variant_id, quantity, reason, reference_id, expires_at, status, metadata)
VALUES
  ('rh_seed_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'variant_01KGXWKEX0B3HXE2F3CR74M3DN', 3, 'Customer checkout in progress', 'cart_01KGZD30EQJ6Y1V2T6G1XJHC0T', NOW() + INTERVAL '30 minutes', 'active', '{"channel": "storefront", "priority": "normal"}'::jsonb),
  ('rh_seed_02', '01KGZ2JRYX607FWMMYQNQRKVWS', 'variant_01KGXWKEX1JX3PQ47XY1V4FNX0', 1, 'B2B quote hold for corporate buyer', 'q_01', NOW() + INTERVAL '48 hours', 'active', '{"channel": "b2b", "priority": "high", "company": "Saudi Aramco"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5i) subscription_discount — 3 records (RAMADAN25, VISION2030, NATIONALDAY)
INSERT INTO subscription_discount (id, tenant_id, code, name, discount_type, discount_value, duration, duration_in_months, applicable_plans, max_redemptions, current_redemptions, max_redemptions_per_customer, starts_at, ends_at, is_active, metadata, raw_discount_value)
VALUES
  ('sd_seed_ramadan_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'RAMADAN25', 'Ramadan Kareem Discount', 'percentage', 25.00, 'repeating', 3, '["subplan_01", "subplan_02"]'::jsonb, 500, 0, 1, '2026-03-01 00:00:00+03', '2026-04-01 00:00:00+03', true, '{"campaign": "ramadan_2026", "theme": "islamic"}'::jsonb, '{"value": "25", "precision": 20}'::jsonb),
  ('sd_seed_vision_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'VISION2030', 'Vision 2030 Innovation Discount', 'fixed', 50.00, 'once', NULL, '["subplan_01", "subplan_02"]'::jsonb, 2030, 0, 1, '2026-01-01 00:00:00+03', '2026-12-31 23:59:59+03', true, '{"campaign": "vision_2030", "government_backed": true}'::jsonb, '{"value": "50", "precision": 20}'::jsonb),
  ('sd_seed_national_01', '01KGZ2JRYX607FWMMYQNQRKVWS', 'NATIONALDAY', 'Saudi National Day Special', 'percentage', 15.00, 'once', NULL, '["subplan_01", "subplan_02"]'::jsonb, 1000, 0, 1, '2026-09-20 00:00:00+03', '2026-09-25 23:59:59+03', true, '{"campaign": "national_day_96", "celebratory": true}'::jsonb, '{"value": "15", "precision": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 6: COMPREHENSIVE VERIFICATION QUERIES
-- ============================================================================
-- Verification: row counts for ALL tables mentioned in replit.md

-- 6a) Verify zero unsplash URLs remain
SELECT 'UNSPLASH_CHECK' as check_type,
  (SELECT count(*) FROM image WHERE url LIKE '%unsplash%') as image_unsplash,
  (SELECT count(*) FROM ad_creative WHERE image_url LIKE '%unsplash%') as ad_creative_unsplash,
  (SELECT count(*) FROM cityos_store WHERE logo_url LIKE '%unsplash%') as cityos_store_unsplash,
  (SELECT count(*) FROM event WHERE image_url LIKE '%unsplash%' OR metadata::text LIKE '%unsplash%') as event_unsplash,
  (SELECT count(*) FROM gig_listing WHERE metadata::text LIKE '%unsplash%') as gig_listing_unsplash,
  (SELECT count(*) FROM insurance_product WHERE metadata::text LIKE '%unsplash%') as insurance_unsplash,
  (SELECT count(*) FROM donation_campaign WHERE metadata::text LIKE '%unsplash%') as donation_unsplash,
  (SELECT count(*) FROM classified_listing WHERE metadata::text LIKE '%unsplash%') as classified_unsplash,
  (SELECT count(*) FROM auction_listing WHERE metadata::text LIKE '%unsplash%') as auction_unsplash,
  (SELECT count(*) FROM social_post WHERE metadata::text LIKE '%unsplash%') as social_post_unsplash,
  (SELECT count(*) FROM service_product WHERE metadata::text LIKE '%unsplash%') as service_product_unsplash,
  (SELECT count(*) FROM digital_asset WHERE metadata::text LIKE '%unsplash%') as digital_asset_unsplash;

-- 6b) Verify empty image columns are filled
SELECT 'EMPTY_IMAGES_CHECK' as check_type,
  (SELECT count(*) FROM agent_profile WHERE photo_url IS NULL OR photo_url = '') as agent_profile_empty,
  (SELECT count(*) FROM event WHERE image_url IS NULL OR image_url = '') as event_empty,
  (SELECT count(*) FROM pet_profile WHERE photo_url IS NULL OR photo_url = '') as pet_profile_empty,
  (SELECT count(*) FROM reward WHERE image_url IS NULL OR image_url = '') as reward_empty,
  (SELECT count(*) FROM reward_tier WHERE image_url IS NULL OR image_url = '') as reward_tier_empty,
  (SELECT count(*) FROM membership_tier WHERE icon_url IS NULL OR icon_url = '') as membership_tier_empty,
  (SELECT count(*) FROM service_provider WHERE avatar_url IS NULL OR avatar_url = '') as service_provider_empty,
  (SELECT count(*) FROM vendor WHERE logo_url IS NULL OR logo_url = '') as vendor_logo_empty,
  (SELECT count(*) FROM vendor WHERE banner_url IS NULL OR banner_url = '') as vendor_banner_empty,
  (SELECT count(*) FROM live_stream WHERE thumbnail_url IS NULL OR thumbnail_url = '') as live_stream_empty,
  (SELECT count(*) FROM menu_item WHERE image_url IS NULL OR image_url = '') as menu_item_empty;

-- 6c) Verify tables that already had images from initial seed
SELECT 'SEED_IMAGE_CHECK' as check_type,
  (SELECT count(*) FROM attorney_profile WHERE photo_url IS NULL OR photo_url = '') as attorney_profile_empty,
  (SELECT count(*) FROM charity_org WHERE logo_url IS NULL OR logo_url = '') as charity_org_empty,
  (SELECT count(*) FROM course WHERE thumbnail_url IS NULL OR thumbnail_url = '') as course_empty,
  (SELECT count(*) FROM practitioner WHERE photo_url IS NULL OR photo_url = '') as practitioner_empty,
  (SELECT count(*) FROM restaurant WHERE logo_url IS NULL OR logo_url = '') as restaurant_logo_empty,
  (SELECT count(*) FROM restaurant WHERE banner_url IS NULL OR banner_url = '') as restaurant_banner_empty,
  (SELECT count(*) FROM trainer_profile WHERE photo_url IS NULL OR photo_url = '') as trainer_profile_empty,
  (SELECT count(*) FROM venue WHERE image_url IS NULL OR image_url = '') as venue_empty;

-- 6d) Verify 27 seeded verticals — row counts
SELECT 'VERTICAL_COUNTS' as check_type,
  (SELECT count(*) FROM booking) as booking,
  (SELECT count(*) FROM healthcare_appointment) as healthcare,
  (SELECT count(*) FROM restaurant) as restaurant,
  (SELECT count(*) FROM travel_property) as travel,
  (SELECT count(*) FROM event) as event_ticketing,
  (SELECT count(*) FROM gig_listing) as freelance,
  (SELECT count(*) FROM fresh_product) as grocery,
  (SELECT count(*) FROM vehicle_listing) as automotive,
  (SELECT count(*) FROM gym_membership) as fitness,
  (SELECT count(*) FROM loan_product) as financial_product,
  (SELECT count(*) FROM ad_campaign) as advertising,
  (SELECT count(*) FROM parking_zone) as parking,
  (SELECT count(*) FROM utility_account) as utilities,
  (SELECT count(*) FROM legal_case) as legal,
  (SELECT count(*) FROM citizen_profile) as government,
  (SELECT count(*) FROM crowdfund_campaign) as crowdfunding,
  (SELECT count(*) FROM auction_listing) as auction,
  (SELECT count(*) FROM classified_listing) as classified,
  (SELECT count(*) FROM donation_campaign) as charity,
  (SELECT count(*) FROM course) as education,
  (SELECT count(*) FROM property_listing) as real_estate,
  (SELECT count(*) FROM pet_profile) as pet_service,
  (SELECT count(*) FROM affiliate) as affiliate,
  (SELECT count(*) FROM warranty_plan) as warranty,
  (SELECT count(*) FROM rental_product) as rental,
  (SELECT count(*) FROM insurance_product) as insurance,
  (SELECT count(*) FROM social_post) as social_commerce;

-- 6e) Verify 17 seeded infrastructure tables — row counts
SELECT 'INFRASTRUCTURE_COUNTS' as check_type,
  (SELECT count(*) FROM persona) as persona,
  (SELECT count(*) FROM governance_authority) as governance,
  (SELECT count(*) FROM wallet) as wallet,
  (SELECT count(*) FROM notification_preference) as notification_prefs,
  (SELECT count(*) FROM cms_page) as cms_content,
  (SELECT count(*) FROM volume_pricing) as volume_pricing,
  (SELECT count(*) FROM tax_rate) as tax_config,
  (SELECT count(*) FROM region_zone_mapping) as region_zone,
  (SELECT count(*) FROM subscription) as subscription,
  (SELECT count(*) FROM quote) as quote,
  (SELECT count(*) FROM insurance_policy) as insurance_plans,
  (SELECT count(*) FROM membership) as membership,
  (SELECT count(*) FROM digital_asset) as digital_product,
  (SELECT count(*) FROM product_bundle) as promotion_ext,
  (SELECT count(*) FROM loyalty_program) as loyalty,
  (SELECT count(*) FROM report) as report,
  (SELECT count(*) FROM vendor) as vendor;

-- 6f) Verify 18 seeded sub-entity tables — row counts
SELECT 'SUB_ENTITY_COUNTS' as check_type,
  (SELECT count(*) FROM menu) as menu,
  (SELECT count(*) FROM menu_item) as menu_item,
  (SELECT count(*) FROM table_reservation) as table_reservation,
  (SELECT count(*) FROM kitchen_order) as kitchen_order,
  (SELECT count(*) FROM room_type) as room_type,
  (SELECT count(*) FROM room) as room,
  (SELECT count(*) FROM medical_record) as medical_record,
  (SELECT count(*) FROM lab_order) as lab_order,
  (SELECT count(*) FROM prescription) as prescription,
  (SELECT count(*) FROM citizen_profile) as citizen_profile,
  (SELECT count(*) FROM service_request) as service_request,
  (SELECT count(*) FROM fine) as fine,
  (SELECT count(*) FROM damage_claim) as damage_claim,
  (SELECT count(*) FROM stock_alert) as stock_alert,
  (SELECT count(*) FROM loyalty_account) as loyalty_account,
  (SELECT count(*) FROM dispute) as dispute,
  (SELECT count(*) FROM ride_request) as ride_request,
  (SELECT count(*) FROM shuttle_route) as shuttle_route;

-- 6g) Verify 9 seeded ancillary tables — row counts
SELECT 'ANCILLARY_COUNTS' as check_type,
  (SELECT count(*) FROM credit_line) as credit_line,
  (SELECT count(*) FROM dashboard) as dashboard,
  (SELECT count(*) FROM proposal) as proposal,
  (SELECT count(*) FROM quote_item) as quote_item,
  (SELECT count(*) FROM shipping_rate) as shipping_rate,
  (SELECT count(*) FROM tenant_poi) as tenant_poi,
  (SELECT count(*) FROM wallet_transaction) as wallet_transaction,
  (SELECT count(*) FROM reservation_hold) as reservation_hold,
  (SELECT count(*) FROM subscription_discount) as subscription_discount;

-- 6h) Verify JSONB metadata image columns populated
SELECT 'METADATA_IMAGE_CHECK' as check_type,
  (SELECT count(*) FROM crowdfund_campaign WHERE metadata IS NOT NULL AND (metadata->>'thumbnail') IS NOT NULL) as crowdfund_with_thumb,
  (SELECT count(*) FROM property_listing WHERE metadata IS NOT NULL AND (metadata->>'thumbnail') IS NOT NULL) as property_with_thumb,
  (SELECT count(*) FROM vehicle_listing WHERE metadata IS NOT NULL AND (metadata->>'thumbnail') IS NOT NULL) as vehicle_with_thumb,
  (SELECT count(*) FROM subscription_plan WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as subplan_with_image,
  (SELECT count(*) FROM loan_product WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as loan_with_image,
  (SELECT count(*) FROM class_schedule WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as class_with_image,
  (SELECT count(*) FROM parking_zone WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as parking_with_image,
  (SELECT count(*) FROM rental_product WHERE metadata IS NOT NULL AND (metadata->>'thumbnail') IS NOT NULL) as rental_with_thumb,
  (SELECT count(*) FROM warranty_plan WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as warranty_with_image,
  (SELECT count(*) FROM product_bundle WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as bundle_with_image,
  (SELECT count(*) FROM gift_card_ext WHERE metadata IS NOT NULL AND (metadata->>'image') IS NOT NULL) as giftcard_with_image;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
