-- ============================================================
-- Dakkah CityOS — Sub-table and vertical data seed
-- Run once to populate all empty detail sub-tables
-- ============================================================

-- ============================================================
-- 1. PURCHASE ORDER ITEMS (15 items across 5 POs)
-- ============================================================
INSERT INTO purchase_order_item (id, purchase_order_id, title, description, sku, thumbnail, quantity, unit_price, original_price, discount_amount, tax_amount, subtotal, total, status, created_at, updated_at)
VALUES
  ('poi_moh1_1', 'po_moh_1', 'Premium Wireless Earbuds', 'High-fidelity audio with ANC', 'SKU-EAR-001', '/seed-images/electronics/electronics_01.jpg', 2, 299.00, 349.00, 0, 44.85, 598.00, 642.85, 'confirmed', NOW(), NOW()),
  ('poi_moh1_2', 'po_moh_1', 'Smart Fitness Watch Pro', 'GPS & health monitoring', 'SKU-WAT-002', '/seed-images/electronics/electronics_02.jpg', 1, 799.00, 899.00, 50.00, 112.35, 749.00, 861.35, 'confirmed', NOW(), NOW()),
  ('poi_moh1_3', 'po_moh_1', 'USB-C Hub 7-in-1', 'Multi-port hub for productivity', 'SKU-HUB-003', '/seed-images/electronics/electronics_03.jpg', 3, 149.00, 149.00, 0, 67.05, 447.00, 514.05, 'confirmed', NOW(), NOW()),
  ('poi_moh2_1', 'po_moh_2', 'Organic Arabic Coffee Blend', 'Single origin arabica beans', 'SKU-COF-001', '/seed-images/grocery/grocery_01.jpg', 5, 89.00, 99.00, 0, 66.75, 445.00, 511.75, 'confirmed', NOW(), NOW()),
  ('poi_moh2_2', 'po_moh_2', 'Saudi Dates Premium Box', 'Medjool dates 1kg', 'SKU-DAT-002', '/seed-images/grocery/grocery_02.jpg', 3, 120.00, 120.00, 0, 54.00, 360.00, 414.00, 'pending', NOW(), NOW()),
  ('poi_moh2_3', 'po_moh_2', 'Luxury Oud Perfume', '50ml eau de parfum', 'SKU-OUD-003', '/seed-images/fashion/fashion_01.jpg', 2, 450.00, 500.00, 0, 135.00, 900.00, 1035.00, 'pending', NOW(), NOW()),
  ('poi_kha1_1', 'po_kha_1', 'Office Chair Executive', 'Ergonomic leather chair', 'SKU-CHR-001', '/seed-images/home/home_01.jpg', 4, 1200.00, 1400.00, 200.00, 300.00, 4600.00, 4900.00, 'confirmed', NOW(), NOW()),
  ('poi_kha1_2', 'po_kha_1', 'Standing Desk 180cm', 'Electric height-adjustable desk', 'SKU-DSK-002', '/seed-images/home/home_02.jpg', 2, 2500.00, 2800.00, 0, 750.00, 5000.00, 5750.00, 'confirmed', NOW(), NOW()),
  ('poi_kha1_3', 'po_kha_1', 'Monitor 27" 4K', 'IPS panel, 144Hz', 'SKU-MON-003', '/seed-images/electronics/electronics_04.jpg', 2, 1800.00, 2000.00, 0, 540.00, 3600.00, 4140.00, 'pending', NOW(), NOW()),
  ('poi_sar1_1', 'po_sar_1', 'Yoga Mat Premium', 'Non-slip 6mm thick', 'SKU-YOG-001', '/seed-images/fitness/fitness_01.jpg', 10, 150.00, 175.00, 0, 225.00, 1500.00, 1725.00, 'confirmed', NOW(), NOW()),
  ('poi_sar1_2', 'po_sar_1', 'Resistance Bands Set', '5-piece progressive resistance', 'SKU-RES-002', '/seed-images/fitness/fitness_02.jpg', 10, 95.00, 95.00, 0, 142.50, 950.00, 1092.50, 'confirmed', NOW(), NOW()),
  ('poi_sar1_3', 'po_sar_1', 'Water Bottle Insulated', '1L stainless steel', 'SKU-BOT-003', '/seed-images/fitness/fitness_03.jpg', 20, 65.00, 75.00, 0, 195.00, 1300.00, 1495.00, 'confirmed', NOW(), NOW()),
  ('poi_abd1_1', 'po_abd_1', 'Laptop Business Pro', 'Intel i7, 16GB RAM, 512GB SSD', 'SKU-LAP-001', '/seed-images/electronics/electronics_05.jpg', 3, 3500.00, 3800.00, 0, 1575.00, 10500.00, 12075.00, 'confirmed', NOW(), NOW()),
  ('poi_abd1_2', 'po_abd_1', 'Wireless Keyboard & Mouse', 'Mechanical keyboard combo', 'SKU-KEY-002', '/seed-images/electronics/electronics_06.jpg', 3, 350.00, 400.00, 0, 157.50, 1050.00, 1207.50, 'confirmed', NOW(), NOW()),
  ('poi_abd1_3', 'po_abd_1', 'Webcam 4K Business', 'Auto-focus with ring light', 'SKU-CAM-003', '/seed-images/electronics/electronics_07.jpg', 3, 480.00, 520.00, 0, 216.00, 1440.00, 1656.00, 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. INVOICE ITEMS (18 items across 6 invoices)
-- ============================================================
INSERT INTO invoice_item (id, invoice_id, title, description, quantity, unit_price, subtotal, tax_total, total, raw_unit_price, raw_subtotal, raw_tax_total, raw_total, created_at)
VALUES
  ('ii_01_1', 'inv_01', 'Premium Wireless Earbuds', 'ANC wireless earbuds x2', 2, 299.00, 598.00, 89.70, 687.70,
    '{"value":"29900","precision":2}', '{"value":"59800","precision":2}', '{"value":"8970","precision":2}', '{"value":"68770","precision":2}', NOW()),
  ('ii_01_2', 'inv_01', 'Smart Fitness Watch Pro', 'GPS smartwatch', 1, 799.00, 799.00, 119.85, 918.85,
    '{"value":"79900","precision":2}', '{"value":"79900","precision":2}', '{"value":"11985","precision":2}', '{"value":"91885","precision":2}', NOW()),
  ('ii_01_3', 'inv_01', 'Delivery Charges', 'Express shipping Riyadh', 1, 45.00, 45.00, 0, 45.00,
    '{"value":"4500","precision":2}', '{"value":"4500","precision":2}', '{"value":"0","precision":2}', '{"value":"4500","precision":2}', NOW()),
  ('ii_02_1', 'inv_02', 'Office Chair Executive', 'Ergonomic leather x2', 2, 1200.00, 2400.00, 360.00, 2760.00,
    '{"value":"120000","precision":2}', '{"value":"240000","precision":2}', '{"value":"36000","precision":2}', '{"value":"276000","precision":2}', NOW()),
  ('ii_02_2', 'inv_02', 'Standing Desk 180cm', 'Electric height-adjustable', 1, 2500.00, 2500.00, 375.00, 2875.00,
    '{"value":"250000","precision":2}', '{"value":"250000","precision":2}', '{"value":"37500","precision":2}', '{"value":"287500","precision":2}', NOW()),
  ('ii_02_3', 'inv_02', 'Installation Service', 'Professional setup service', 1, 200.00, 200.00, 0, 200.00,
    '{"value":"20000","precision":2}', '{"value":"20000","precision":2}', '{"value":"0","precision":2}', '{"value":"20000","precision":2}', NOW()),
  ('ii_03_1', 'inv_03', 'Laptop Business Pro', 'Intel i7 laptop x2', 2, 3500.00, 7000.00, 1050.00, 8050.00,
    '{"value":"350000","precision":2}', '{"value":"700000","precision":2}', '{"value":"105000","precision":2}', '{"value":"805000","precision":2}', NOW()),
  ('ii_03_2', 'inv_03', 'Microsoft 365 Business', '1 year subscription x5', 5, 300.00, 1500.00, 225.00, 1725.00,
    '{"value":"30000","precision":2}', '{"value":"150000","precision":2}', '{"value":"22500","precision":2}', '{"value":"172500","precision":2}', NOW()),
  ('ii_03_3', 'inv_03', 'IT Setup Consulting', 'Network configuration 4hr', 4, 250.00, 1000.00, 0, 1000.00,
    '{"value":"25000","precision":2}', '{"value":"100000","precision":2}', '{"value":"0","precision":2}', '{"value":"100000","precision":2}', NOW()),
  ('ii_04_1', 'inv_04', 'Organic Coffee Blend 1kg', 'Arabic arabica x10', 10, 89.00, 890.00, 133.50, 1023.50,
    '{"value":"8900","precision":2}', '{"value":"89000","precision":2}', '{"value":"13350","precision":2}', '{"value":"102350","precision":2}', NOW()),
  ('ii_04_2', 'inv_04', 'Saudi Medjool Dates 1kg', 'Premium dates x10', 10, 120.00, 1200.00, 180.00, 1380.00,
    '{"value":"12000","precision":2}', '{"value":"120000","precision":2}', '{"value":"18000","precision":2}', '{"value":"138000","precision":2}', NOW()),
  ('ii_04_3', 'inv_04', 'Cold Chain Delivery', 'Refrigerated transport', 1, 150.00, 150.00, 0, 150.00,
    '{"value":"15000","precision":2}', '{"value":"15000","precision":2}', '{"value":"0","precision":2}', '{"value":"15000","precision":2}', NOW()),
  ('ii_05_1', 'inv_05', 'Yoga Mat Premium', 'Non-slip x20', 20, 150.00, 3000.00, 450.00, 3450.00,
    '{"value":"15000","precision":2}', '{"value":"300000","precision":2}', '{"value":"45000","precision":2}', '{"value":"345000","precision":2}', NOW()),
  ('ii_05_2', 'inv_05', 'Resistance Bands Set', '5-piece x20', 20, 95.00, 1900.00, 285.00, 2185.00,
    '{"value":"9500","precision":2}', '{"value":"190000","precision":2}', '{"value":"28500","precision":2}', '{"value":"218500","precision":2}', NOW()),
  ('ii_05_3', 'inv_05', 'Custom Logo Printing', 'Branding service flat fee', 1, 500.00, 500.00, 0, 500.00,
    '{"value":"50000","precision":2}', '{"value":"50000","precision":2}', '{"value":"0","precision":2}', '{"value":"50000","precision":2}', NOW()),
  ('ii_06_1', 'inv_06', 'Luxury Oud Perfume 50ml', 'Premium fragrance x5', 5, 450.00, 2250.00, 337.50, 2587.50,
    '{"value":"45000","precision":2}', '{"value":"225000","precision":2}', '{"value":"33750","precision":2}', '{"value":"258750","precision":2}', NOW()),
  ('ii_06_2', 'inv_06', 'Gift Packaging Premium', 'Luxury box set x5', 5, 75.00, 375.00, 0, 375.00,
    '{"value":"7500","precision":2}', '{"value":"37500","precision":2}', '{"value":"0","precision":2}', '{"value":"37500","precision":2}', NOW()),
  ('ii_06_3', 'inv_06', 'Corporate Engraving', 'Custom name engraving x5', 5, 60.00, 300.00, 0, 300.00,
    '{"value":"6000","precision":2}', '{"value":"30000","precision":2}', '{"value":"0","precision":2}', '{"value":"30000","precision":2}', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. QUOTE ITEMS (18 items across 6 quotes)
-- ============================================================
INSERT INTO quote_item (id, quote_id, product_id, variant_id, title, description, sku, thumbnail, quantity, unit_price, custom_unit_price, subtotal, discount_total, tax_total, total, discount_percentage, discount_reason, created_at, updated_at)
VALUES
  ('qi_01_1', 'quot_01', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857JTD5G670FZ8B916RV', 'Premium Wireless Earbuds', 'ANC over-ear', 'SKU-EAR-001', '/seed-images/electronics/electronics_01.jpg', 10, 299.00, 269.10, 2691.00, 299.00, 358.64, 2750.64, 10, 'Volume discount 10%', NOW(), NOW()),
  ('qi_01_2', 'quot_01', 'prod_01KJ3C8AT9PRM83BRVQ4V3PHF7', 'variant_01KJ3C8DT0TAPFXJW34SXXT1FX', 'Smart Fitness Watch Pro', 'GPS & HR monitor', 'SKU-WAT-002', '/seed-images/electronics/electronics_02.jpg', 5, 799.00, 759.05, 3795.25, 199.75, 536.24, 4131.74, 5, 'Corporate rate', NOW(), NOW()),
  ('qi_01_3', 'quot_01', 'prod_01KJ3C8KBXR6CEDR4FHR9VNMPP', 'variant_01KJ3C8PBHXNQ5GCY8VE1APYSS', 'Organic Arabic Coffee', '1kg premium blend', 'SKU-COF-001', '/seed-images/grocery/grocery_01.jpg', 20, 89.00, 89.00, 1780.00, 0, 267.00, 2047.00, 0, NULL, NOW(), NOW()),
  ('qi_02_1', 'quot_02', 'prod_01KJ3C8VXK90T35XYXHKCPJD1A', 'variant_01KJ3C8YXHMJDDDTGG9V5BYAFM', 'Luxury Oud Perfume', '50ml EDP', 'SKU-OUD-001', '/seed-images/fashion/fashion_01.jpg', 8, 450.00, 405.00, 3240.00, 360.00, 432.00, 3312.00, 10, 'Retail partnership', NOW(), NOW()),
  ('qi_02_2', 'quot_02', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857K8SP88522XY7QDRN9', 'Premium Wireless Earbuds', 'Noise cancelling', 'SKU-EAR-002', '/seed-images/electronics/electronics_01.jpg', 6, 299.00, 269.10, 1614.60, 179.40, 215.14, 1650.34, 10, 'Bundle offer', NOW(), NOW()),
  ('qi_02_3', 'quot_02', 'prod_01KJ3C8AT9PRM83BRVQ4V3PHF7', 'variant_01KJ3C8DT1QYEG3RG89E17845H', 'Smart Fitness Watch Pro', 'Sport edition', 'SKU-WAT-003', '/seed-images/electronics/electronics_02.jpg', 4, 799.00, 799.00, 3196.00, 0, 479.40, 3675.40, 0, NULL, NOW(), NOW()),
  ('qi_03_1', 'quot_03', 'prod_01KJ3C8KBXR6CEDR4FHR9VNMPP', 'variant_01KJ3C8PBK8FENFZB5TZEWPD20', 'Organic Arabic Coffee', 'Premium 1kg', 'SKU-COF-002', '/seed-images/grocery/grocery_01.jpg', 50, 89.00, 80.10, 4005.00, 445.00, 534.00, 4094.00, 10, 'Hospitality bulk', NOW(), NOW()),
  ('qi_03_2', 'quot_03', 'prod_01KJ3C8VXK90T35XYXHKCPJD1A', 'variant_01KJ3C8YXMB8GF3JJNDEG6QA6R', 'Luxury Oud Perfume', 'Gift edition', 'SKU-OUD-002', '/seed-images/fashion/fashion_02.jpg', 12, 450.00, 427.50, 5130.00, 270.00, 714.00, 5574.00, 5, 'Hotel amenity deal', NOW(), NOW()),
  ('qi_03_3', 'quot_03', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857MARBK9TMMRK752F1Z', 'Premium Wireless Earbuds', 'For guest rooms', 'SKU-EAR-003', '/seed-images/electronics/electronics_01.jpg', 30, 299.00, 254.15, 7624.50, 1347.00, 0, 6277.50, 15, 'Long-term contract', NOW(), NOW()),
  ('qi_04_1', 'quot_04', 'prod_01KJ3C8AT9PRM83BRVQ4V3PHF7', 'variant_01KJ3C8DT0TAPFXJW34SXXT1FX', 'Smart Fitness Watch Pro', 'Employee wellness', 'SKU-WAT-001', '/seed-images/electronics/electronics_02.jpg', 25, 799.00, 719.10, 17977.50, 1997.50, 2397.00, 18377.00, 10, 'Corporate wellness', NOW(), NOW()),
  ('qi_04_2', 'quot_04', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857JTD5G670FZ8B916RV', 'Premium Wireless Earbuds', 'Remote work kit', 'SKU-EAR-001', '/seed-images/electronics/electronics_01.jpg', 25, 299.00, 269.10, 6727.50, 747.50, 897.00, 6877.00, 10, 'Corporate rate', NOW(), NOW()),
  ('qi_04_3', 'quot_04', 'prod_01KJ3C8KBXR6CEDR4FHR9VNMPP', 'variant_01KJ3C8PBHXNQ5GCY8VE1APYSS', 'Organic Arabic Coffee', 'Office pantry', 'SKU-COF-001', '/seed-images/grocery/grocery_01.jpg', 40, 89.00, 89.00, 3560.00, 0, 534.00, 4094.00, 0, NULL, NOW(), NOW()),
  ('qi_05_1', 'quot_05', 'prod_01KJ3C8VXK90T35XYXHKCPJD1A', 'variant_01KJ3C8YXHMJDDDTGG9V5BYAFM', 'Luxury Oud Perfume', 'Event giveaway', 'SKU-OUD-001', '/seed-images/fashion/fashion_01.jpg', 100, 450.00, 382.50, 38250.00, 4500.00, 0, 33750.00, 15, 'Event sponsorship', NOW(), NOW()),
  ('qi_05_2', 'quot_05', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857K8SP88522XY7QDRN9', 'Premium Wireless Earbuds', 'Speaker gift', 'SKU-EAR-002', '/seed-images/electronics/electronics_01.jpg', 50, 299.00, 254.15, 12707.50, 2245.00, 0, 10462.50, 15, 'Bulk event', NOW(), NOW()),
  ('qi_05_3', 'quot_05', 'prod_01KJ3C8AT9PRM83BRVQ4V3PHF7', 'variant_01KJ3C8DT1QYEG3RG89E17845H', 'Smart Fitness Watch Pro', 'VIP attendees', 'SKU-WAT-003', '/seed-images/electronics/electronics_02.jpg', 20, 799.00, 679.15, 13583.00, 2397.00, 0, 11186.00, 15, 'Event bulk', NOW(), NOW()),
  ('qi_06_1', 'quot_06', 'prod_01KJ3C8KBXR6CEDR4FHR9VNMPP', 'variant_01KJ3C8PBK8FENFZB5TZEWPD20', 'Organic Arabic Coffee', 'Café supply', 'SKU-COF-002', '/seed-images/grocery/grocery_01.jpg', 100, 89.00, 75.65, 7565.00, 1335.00, 0, 6230.00, 15, 'Distributor tier', NOW(), NOW()),
  ('qi_06_2', 'quot_06', 'prod_01KJ3C8VXK90T35XYXHKCPJD1A', 'variant_01KJ3C8YXMB8GF3JJNDEG6QA6R', 'Luxury Oud Perfume', 'Gift set resale', 'SKU-OUD-002', '/seed-images/fashion/fashion_02.jpg', 60, 450.00, 382.50, 22950.00, 4050.00, 0, 18900.00, 15, 'Wholesale', NOW(), NOW()),
  ('qi_06_3', 'quot_06', 'prod_01KJ3C82731E73D8NQNSNZ3KA0', 'variant_01KJ3C857MARBK9TMMRK752F1Z', 'Premium Wireless Earbuds', 'Reseller bundle', 'SKU-EAR-003', '/seed-images/electronics/electronics_01.jpg', 80, 299.00, 239.20, 19136.00, 4784.00, 0, 14352.00, 20, 'Reseller discount', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. COMPANY USERS (linking customers to companies)
-- ============================================================
INSERT INTO company_user (id, company_id, customer_id, role, spending_limit, spending_limit_period, current_period_spend, period_start, approval_limit, status, invited_at, joined_at, raw_spending_limit, raw_current_period_spend, raw_approval_limit, created_at, updated_at)
VALUES
  ('cu_moh_comp1', 'comp_01', 'cus_01KJE60GD6RQ9WXJYDVTZ4HECS', 'admin', 50000.00, 'monthly', 12500.00, NOW() - INTERVAL '15 days', 20000.00, 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days',
    '{"value":"5000000","precision":2}', '{"value":"1250000","precision":2}', '{"value":"2000000","precision":2}', NOW(), NOW()),
  ('cu_fat_comp1', 'comp_01', 'cus_01KJE60N5FGC6SFDVR7YGB6M8R', 'buyer', 10000.00, 'monthly', 3200.00, NOW() - INTERVAL '15 days', 5000.00, 'active', NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days',
    '{"value":"1000000","precision":2}', '{"value":"320000","precision":2}', '{"value":"500000","precision":2}', NOW(), NOW()),
  ('cu_ahm_comp2', 'comp_02', 'cus_01KJE60SXRT8WPBM60GYX0AXHJ', 'admin', 75000.00, 'monthly', 28000.00, NOW() - INTERVAL '10 days', 30000.00, 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '85 days',
    '{"value":"7500000","precision":2}', '{"value":"2800000","precision":2}', '{"value":"3000000","precision":2}', NOW(), NOW()),
  ('cu_kha_comp2', 'comp_02', 'cus_01KJE60YP7AX0N8DENW5DHM3P6', 'buyer', 15000.00, 'monthly', 4500.00, NOW() - INTERVAL '10 days', 7500.00, 'active', NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days',
    '{"value":"1500000","precision":2}', '{"value":"450000","precision":2}', '{"value":"750000","precision":2}', NOW(), NOW()),
  ('cu_sar_comp3', 'comp_03', 'cus_01KJE613ECDN1V2NQY2DGVPV6K', 'admin', 30000.00, 'monthly', 8900.00, NOW() - INTERVAL '20 days', 12000.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days',
    '{"value":"3000000","precision":2}', '{"value":"890000","precision":2}', '{"value":"1200000","precision":2}', NOW(), NOW()),
  ('cu_omar_comp3', 'comp_03', 'cus_01KJE6186XM3BZ291HEVFGVVW7', 'buyer', 8000.00, 'monthly', 1200.00, NOW() - INTERVAL '20 days', 4000.00, 'active', NOW() - INTERVAL '25 days', NOW() - INTERVAL '22 days',
    '{"value":"800000","precision":2}', '{"value":"120000","precision":2}', '{"value":"400000","precision":2}', NOW(), NOW()),
  ('cu_nour_comp4', 'comp_04', 'cus_01KJE61CZ52CWQD6RFNYFGSQSM', 'admin', 20000.00, 'monthly', 5600.00, NOW() - INTERVAL '5 days', 10000.00, 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '115 days',
    '{"value":"2000000","precision":2}', '{"value":"560000","precision":2}', '{"value":"1000000","precision":2}', NOW(), NOW()),
  ('cu_abd_comp4', 'comp_04', 'cus_01KJE61HQ8QSPER5A7SDMV0XN6', 'buyer', 12000.00, 'monthly', 2300.00, NOW() - INTERVAL '5 days', 6000.00, 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '95 days',
    '{"value":"1200000","precision":2}', '{"value":"230000","precision":2}', '{"value":"600000","precision":2}', NOW(), NOW()),
  ('cu_moh_comp5', 'comp_05', 'cus_01KJE60GD6RQ9WXJYDVTZ4HECS', 'buyer', 5000.00, 'monthly', 890.00, NOW() - INTERVAL '12 days', 2500.00, 'active', NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days',
    '{"value":"500000","precision":2}', '{"value":"89000","precision":2}', '{"value":"250000","precision":2}', NOW(), NOW()),
  ('cu_kha_comp5', 'comp_05', 'cus_01KJE60YP7AX0N8DENW5DHM3P6', 'buyer', 5000.00, 'monthly', 1100.00, NOW() - INTERVAL '12 days', 2500.00, 'active', NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days',
    '{"value":"500000","precision":2}', '{"value":"110000","precision":2}', '{"value":"250000","precision":2}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SERVICE PROVIDERS (for booking module enrichment)
-- ============================================================
INSERT INTO service_provider (id, tenant_id, name, email, phone, bio, avatar_url, title, specializations, certifications, service_ids, max_daily_bookings, max_weekly_bookings, status, timezone, calendar_color, created_at, updated_at)
VALUES
  ('sp_001', 'dakkah', 'Dr. Khaled Al-Rashidi', 'drkhaled@dakkah.com', '+966501234001', 'Board-certified cardiologist with 15 years experience at King Faisal Specialist Hospital.', '/seed-images/healthcare/healthcare_01.jpg', 'Cardiologist', '["Cardiology","Internal Medicine","Echocardiography"]', '["ABIM","Saudi Board of Internal Medicine"]', '["svc_001","svc_002"]', 8, 40, 'active', 'Asia/Riyadh', '#3B82F6', NOW(), NOW()),
  ('sp_002', 'dakkah', 'Dr. Maha Al-Qassem', 'drmaha@dakkah.com', '+966501234002', 'Pediatrics specialist focusing on child development and preventive care.', '/seed-images/healthcare/healthcare_02.jpg', 'Pediatrician', '["Pediatrics","Neonatology","Child Development"]', '["Saudi Board of Pediatrics","MRCPCH"]', '["svc_003","svc_004"]', 10, 50, 'active', 'Asia/Riyadh', '#10B981', NOW(), NOW()),
  ('sp_003', 'dakkah', 'Coach Saad Al-Mutairi', 'coach.saad@dakkah.com', '+966501234003', 'Certified personal trainer specializing in strength and conditioning for elite athletes.', '/seed-images/fitness/fitness_01.jpg', 'Personal Trainer', '["Strength Training","HIIT","Sports Nutrition"]', '["NSCA-CSCS","ACE","CrossFit L2"]', '["svc_005","svc_006"]', 12, 60, 'active', 'Asia/Riyadh', '#F59E0B', NOW(), NOW()),
  ('sp_004', 'dakkah', 'Coach Hessa Al-Dossari', 'coach.hessa@dakkah.com', '+966501234004', 'Yoga and pilates instructor with focus on mindfulness and women''s wellness.', '/seed-images/fitness/fitness_02.jpg', 'Yoga Instructor', '["Yoga","Pilates","Meditation","Women Wellness"]', '["RYT-500","BASI Pilates"]', '["svc_007","svc_008"]', 15, 75, 'active', 'Asia/Riyadh', '#8B5CF6', NOW(), NOW()),
  ('sp_005', 'dakkah', 'Groomer Abdulrahman', 'groomer.abdo@dakkah.com', '+966501234005', 'Professional pet groomer with 8 years experience in dog breeds common in the Gulf region.', '/seed-images/pets/pets_01.jpg', 'Pet Groomer', '["Dog Grooming","Cat Grooming","Breed Styling","Spa Treatments"]', '["City & Guilds Dog Grooming","Groom Team Saudi"]', '["svc_009"]', 10, 50, 'active', 'Asia/Riyadh', '#EC4899', NOW(), NOW()),
  ('sp_006', 'dakkah', 'Dr. Nora Al-Shehri', 'drnora@dakkah.com', '+966501234006', 'Veterinarian specializing in small animal medicine and preventive care.', '/seed-images/pets/pets_02.jpg', 'Veterinarian', '["Small Animal Medicine","Surgery","Dentistry","Preventive Care"]', '["DVM","Saudi Veterinary Society"]', '["svc_010","svc_011"]', 8, 40, 'active', 'Asia/Riyadh', '#14B8A6', NOW(), NOW()),
  ('sp_007', 'dakkah', 'Prof. Ahmed Al-Harbi', 'prof.ahmed@dakkah.com', '+966501234007', 'Senior software engineering instructor with 20 years in academia and industry.', '/seed-images/education/education_01.jpg', 'Senior Instructor', '["Computer Science","AI/ML","Cloud Architecture","Software Engineering"]', '["PhD Computer Science","AWS Solutions Architect","Google Cloud Professional"]', '["svc_012","svc_013"]', 5, 25, 'active', 'Asia/Riyadh', '#6366F1', NOW(), NOW()),
  ('sp_008', 'dakkah', 'Stylist Lujain Al-Otaibi', 'stylist.lujain@dakkah.com', '+966501234008', 'Fashion consultant and personal stylist working with Saudi designers and international brands.', '/seed-images/fashion/fashion_01.jpg', 'Personal Stylist', '["Fashion Styling","Color Analysis","Wardrobe Curation","Event Dressing"]', '["London College of Fashion","FIT NY"]', '["svc_014"]', 6, 30, 'active', 'Asia/Riyadh', '#F97316', NOW(), NOW()),
  ('sp_009', 'dakkah', 'Eng. Turki Al-Zahrani', 'turki.auto@dakkah.com', '+966501234009', 'Master automotive technician specializing in European luxury vehicles.', '/seed-images/automotive/automotive_01.jpg', 'Master Technician', '["Luxury Vehicle Service","Diagnostics","Performance Tuning","Electric Vehicles"]', '["BMW Master Tech","Mercedes-Benz Star","Tesla Certified"]', '["svc_015"]', 6, 30, 'active', 'Asia/Riyadh', '#64748B', NOW(), NOW()),
  ('sp_010', 'dakkah', 'Therapist Rasha Al-Muqbel', 'rasha.therapy@dakkah.com', '+966501234010', 'Licensed clinical psychologist providing CBT and family therapy services.', '/seed-images/healthcare/healthcare_03.jpg', 'Clinical Psychologist', '["CBT","Family Therapy","Anxiety","Depression","PTSD"]', '["PhD Clinical Psychology","Licensed SCFHS","APA Member"]', '["svc_016","svc_017"]', 6, 30, 'active', 'Asia/Riyadh', '#EF4444', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. MEMBERSHIPS (customer membership records)
-- ============================================================
INSERT INTO membership (id, tenant_id, customer_id, tier_id, membership_number, status, joined_at, expires_at, renewed_at, total_points, lifetime_points, total_spent, auto_renew, raw_total_spent, created_at, updated_at)
VALUES
  ('mem_moh_01', 'dakkah', 'cus_01KJE60GD6RQ9WXJYDVTZ4HECS', '01KJDJRHAPJDZ4ZGVA0P2V32VC', 'MEM-2024-MOH-001', 'active', '2024-01-15 00:00:00+00', '2025-01-15 00:00:00+00', '2024-06-15 00:00:00+00', 4250, 12500, 28500.00, true, '{"value":"2850000","precision":2}', NOW(), NOW()),
  ('mem_fat_01', 'dakkah', 'cus_01KJE60N5FGC6SFDVR7YGB6M8R', '01KJDJRGPAD6P959HYTWT8D4YZ', 'MEM-2024-FAT-001', 'active', '2024-03-20 00:00:00+00', '2025-03-20 00:00:00+00', NULL, 1850, 5200, 9800.00, true, '{"value":"980000","precision":2}', NOW(), NOW()),
  ('mem_ahm_01', 'dakkah', 'cus_01KJE60SXRT8WPBM60GYX0AXHJ', '01KJDJRHYVK90QXBC2QJZS518Y', 'MEM-2024-AHM-001', 'active', '2023-11-01 00:00:00+00', '2024-11-01 00:00:00+00', '2024-05-01 00:00:00+00', 8900, 32000, 87500.00, true, '{"value":"8750000","precision":2}', NOW(), NOW()),
  ('mem_kha_01', 'dakkah', 'cus_01KJE60YP7AX0N8DENW5DHM3P6', '01KJDJRHAPJDZ4ZGVA0P2V32VC', 'MEM-2024-KHA-001', 'active', '2024-02-10 00:00:00+00', '2025-02-10 00:00:00+00', NULL, 3100, 9400, 22000.00, false, '{"value":"2200000","precision":2}', NOW(), NOW()),
  ('mem_sar_01', 'dakkah', 'cus_01KJE613ECDN1V2NQY2DGVPV6K', '01KJDJRGPAD6P959HYTWT8D4YZ', 'MEM-2024-SAR-001', 'active', '2024-05-05 00:00:00+00', '2025-05-05 00:00:00+00', NULL, 920, 2800, 6200.00, true, '{"value":"620000","precision":2}', NOW(), NOW()),
  ('mem_abd_01', 'dakkah', 'cus_01KJE61HQ8QSPER5A7SDMV0XN6', '01KJDJRHAPJDZ4ZGVA0P2V32VC', 'MEM-2024-ABD-001', 'active', '2024-04-12 00:00:00+00', '2025-04-12 00:00:00+00', NULL, 2200, 7100, 16800.00, true, '{"value":"1680000","precision":2}', NOW(), NOW()),
  ('mem_oma_01', 'dakkah', 'cus_01KJE6186XM3BZ291HEVFGVVW7', '01KJDJRGPAD6P959HYTWT8D4YZ', 'MEM-2024-OMA-001', 'active', '2024-06-18 00:00:00+00', '2025-06-18 00:00:00+00', NULL, 680, 1900, 4500.00, false, '{"value":"450000","precision":2}', NOW(), NOW()),
  ('mem_nou_01', 'dakkah', 'cus_01KJE61CZ52CWQD6RFNYFGSQSM', '01KJDJRHYVK90QXBC2QJZS518Y', 'MEM-2024-NOU-001', 'active', '2023-08-22 00:00:00+00', '2024-08-22 00:00:00+00', '2024-02-22 00:00:00+00', 11200, 41000, 105000.00, true, '{"value":"10500000","precision":2}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. SUBSCRIPTIONS (customer subscription records)
-- ============================================================
INSERT INTO subscription (id, customer_id, status, start_date, end_date, current_period_start, current_period_end, billing_interval, billing_interval_count, currency_code, subtotal, tax_total, total, tenant_id, raw_subtotal, raw_tax_total, raw_total, created_at, updated_at)
VALUES
  ('sub_moh_01', 'cus_01KJE60GD6RQ9WXJYDVTZ4HECS', 'active', '2024-01-01 00:00:00+00', '2025-01-01 00:00:00+00', '2026-01-01 00:00:00+00', '2026-02-01 00:00:00+00', 'monthly', 1, 'SAR', 299.00, 44.85, 343.85, 'dakkah',
    '{"value":"29900","precision":2}', '{"value":"4485","precision":2}', '{"value":"34385","precision":2}', NOW(), NOW()),
  ('sub_fat_01', 'cus_01KJE60N5FGC6SFDVR7YGB6M8R', 'active', '2024-03-01 00:00:00+00', '2025-03-01 00:00:00+00', '2026-02-01 00:00:00+00', '2026-03-01 00:00:00+00', 'monthly', 1, 'SAR', 149.00, 22.35, 171.35, 'dakkah',
    '{"value":"14900","precision":2}', '{"value":"2235","precision":2}', '{"value":"17135","precision":2}', NOW(), NOW()),
  ('sub_ahm_01', 'cus_01KJE60SXRT8WPBM60GYX0AXHJ', 'active', '2023-06-01 00:00:00+00', '2024-06-01 00:00:00+00', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'yearly', 1, 'SAR', 2990.00, 448.50, 3438.50, 'dakkah',
    '{"value":"299000","precision":2}', '{"value":"44850","precision":2}', '{"value":"343850","precision":2}', NOW(), NOW()),
  ('sub_kha_01', 'cus_01KJE60YP7AX0N8DENW5DHM3P6', 'paused', '2024-02-01 00:00:00+00', '2025-02-01 00:00:00+00', '2025-12-01 00:00:00+00', '2026-01-01 00:00:00+00', 'monthly', 1, 'SAR', 89.00, 13.35, 102.35, 'dakkah',
    '{"value":"8900","precision":2}', '{"value":"1335","precision":2}', '{"value":"10235","precision":2}', NOW(), NOW()),
  ('sub_abd_01', 'cus_01KJE61HQ8QSPER5A7SDMV0XN6', 'active', '2024-05-01 00:00:00+00', '2025-05-01 00:00:00+00', '2026-02-01 00:00:00+00', '2026-03-01 00:00:00+00', 'monthly', 1, 'SAR', 499.00, 74.85, 573.85, 'dakkah',
    '{"value":"49900","precision":2}', '{"value":"7485","precision":2}', '{"value":"57385","precision":2}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. POINT TRANSACTIONS (loyalty history)
-- ============================================================
INSERT INTO point_transaction (id, account_id, tenant_id, type, points, balance_after, reference_type, reference_id, description, created_at, updated_at)
VALUES
  ('pt_la01_01', 'la_01', 'dakkah', 'earn', 500, 500, 'order', 'ord_001', 'Points earned on order #001', NOW() - INTERVAL '90 days', NOW()),
  ('pt_la01_02', 'la_01', 'dakkah', 'earn', 750, 1250, 'order', 'ord_002', 'Points earned on order #002', NOW() - INTERVAL '60 days', NOW()),
  ('pt_la01_03', 'la_01', 'dakkah', 'redeem', -300, 950, 'redemption', 'red_001', 'Redeemed for SAR 30 discount', NOW() - INTERVAL '45 days', NOW()),
  ('pt_la01_04', 'la_01', 'dakkah', 'earn', 1200, 2150, 'order', 'ord_003', 'Points earned on order #003 — double points event', NOW() - INTERVAL '30 days', NOW()),
  ('pt_la01_05', 'la_01', 'dakkah', 'bonus', 250, 2400, 'promotion', 'promo_001', 'Birthday bonus points', NOW() - INTERVAL '15 days', NOW()),
  ('pt_la02_01', 'la_02', 'dakkah', 'earn', 320, 320, 'order', 'ord_011', 'Points earned on order #011', NOW() - INTERVAL '80 days', NOW()),
  ('pt_la02_02', 'la_02', 'dakkah', 'earn', 480, 800, 'order', 'ord_012', 'Points earned on order #012', NOW() - INTERVAL '55 days', NOW()),
  ('pt_la02_03', 'la_02', 'dakkah', 'redeem', -200, 600, 'redemption', 'red_002', 'Redeemed for free delivery', NOW() - INTERVAL '40 days', NOW()),
  ('pt_la02_04', 'la_02', 'dakkah', 'earn', 650, 1250, 'order', 'ord_013', 'Points earned on order #013', NOW() - INTERVAL '20 days', NOW()),
  ('pt_la03_01', 'la_03', 'dakkah', 'earn', 900, 900, 'order', 'ord_021', 'Points earned on order #021', NOW() - INTERVAL '100 days', NOW()),
  ('pt_la03_02', 'la_03', 'dakkah', 'earn', 1500, 2400, 'order', 'ord_022', 'Points earned on order #022 — premium purchase', NOW() - INTERVAL '70 days', NOW()),
  ('pt_la03_03', 'la_03', 'dakkah', 'redeem', -500, 1900, 'redemption', 'red_003', 'Redeemed for SAR 50 discount', NOW() - INTERVAL '50 days', NOW()),
  ('pt_la03_04', 'la_03', 'dakkah', 'earn', 2200, 4100, 'order', 'ord_023', 'Points earned on large B2B order', NOW() - INTERVAL '25 days', NOW()),
  ('pt_la03_05', 'la_03', 'dakkah', 'expire', -400, 3700, 'expiry', NULL, 'Points expired (6 month old batch)', NOW() - INTERVAL '10 days', NOW()),
  ('pt_la04_01', 'la_04', 'dakkah', 'earn', 180, 180, 'order', 'ord_031', 'Welcome order points', NOW() - INTERVAL '50 days', NOW()),
  ('pt_la04_02', 'la_04', 'dakkah', 'bonus', 100, 280, 'promotion', 'promo_002', 'Referral bonus', NOW() - INTERVAL '35 days', NOW()),
  ('pt_la04_03', 'la_04', 'dakkah', 'earn', 420, 700, 'order', 'ord_032', 'Points earned on order #032', NOW() - INTERVAL '20 days', NOW()),
  ('pt_la05_01', 'la_05', 'dakkah', 'earn', 600, 600, 'order', 'ord_041', 'Points earned on order #041', NOW() - INTERVAL '75 days', NOW()),
  ('pt_la05_02', 'la_05', 'dakkah', 'earn', 850, 1450, 'order', 'ord_042', 'Points earned on order #042', NOW() - INTERVAL '45 days', NOW()),
  ('pt_la05_03', 'la_05', 'dakkah', 'redeem', -400, 1050, 'redemption', 'red_004', 'Redeemed for SAR 40 discount', NOW() - INTERVAL '30 days', NOW()),
  ('pt_la06_01', 'la_06', 'dakkah', 'earn', 240, 240, 'order', 'ord_051', 'Points earned on order #051', NOW() - INTERVAL '60 days', NOW()),
  ('pt_la06_02', 'la_06', 'dakkah', 'earn', 360, 600, 'order', 'ord_052', 'Points earned on order #052', NOW() - INTERVAL '35 days', NOW()),
  ('pt_la06_03', 'la_06', 'dakkah', 'bonus', 150, 750, 'promotion', 'promo_003', 'Seasonal promotion bonus', NOW() - INTERVAL '15 days', NOW()),
  ('pt_la06_04', 'la_06', 'dakkah', 'redeem', -250, 500, 'redemption', 'red_005', 'Redeemed for voucher SAR 25', NOW() - INTERVAL '5 days', NOW()),
  ('pt_la06_05', 'la_06', 'dakkah', 'earn', 320, 820, 'order', 'ord_053', 'Points earned on order #053', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Summary verification
-- ============================================================
SELECT 'purchase_order_item' AS "table", COUNT(*) AS "count" FROM purchase_order_item
UNION ALL SELECT 'invoice_item', COUNT(*) FROM invoice_item
UNION ALL SELECT 'quote_item', COUNT(*) FROM quote_item
UNION ALL SELECT 'company_user', COUNT(*) FROM company_user
UNION ALL SELECT 'service_provider', COUNT(*) FROM service_provider
UNION ALL SELECT 'membership', COUNT(*) FROM membership
UNION ALL SELECT 'subscription', COUNT(*) FROM subscription
UNION ALL SELECT 'point_transaction', COUNT(*) FROM point_transaction;
