import pg from "pg";
import { put } from "@vercel/blob";
import crypto from "crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const TENANT_ID = "01KJ3AYQ0E7SBWYXBHZF9HX01K";
const TENANT_SLUG = "dakkah";
const STORE_ID = "store_01KJ392VR5W4RSMKC6YB5WCFGE";
const SC_DEFAULT = "sc_01KJ392TEESBH2G9VYQMAXX9P4";
const SC_WEB = "sc_01KJ3AJ8X20WEBXDTYV6SM8HBR";
const SC_MOBILE = "sc_01KJ3AJACT3Q7MZPNFBH1ZWEX3";
const ALL_SC = [SC_DEFAULT, SC_WEB, SC_MOBILE];
const REGION_MENA = "reg_01KJ3AJG5S460KKRRBKBFNRDV9";
const SLOC_RIYADH = "sloc_01KJ3AJKM9KE5G89BMDEFQQYV8";
const SLOC_CENTRAL = "sloc_01KJ3APHZCJB1Q8QYWQT85K6PC";

function uid() { return crypto.randomBytes(16).toString("hex").slice(0, 26); }
function now() { return new Date().toISOString(); }

const IMAGE_CATALOG = {
  electronics: ["1526738549149-8e07eca6c147","1523275335684-37898b6baf30","1505740420928-5e560c06d30e","1610945265064-0e34e5519bbf","1498049794561-7780e7231661"],
  fashion: ["1445205170230-053b83016050","1556821840-3a63f95609a7","1521572163474-6864f9cf17ab","1515562141207-7a88fb7ce338","1552674605-db6ffd4facb5"],
  food: ["1504674900247-0877df9cc836","1473093295043-cdd812d0e601","1447933601403-0c6688de566e","1589656966895-2f33e7653819","1509042239860-f550ce710b93"],
  home: ["1560448204-e02f11c3d0e2","1581578731548-c64695cc6952","1599643478518-a784e5dc4c8f","1618221195710-dd6b41faaea6","1556909114-f6e7ad7d3136"],
  beauty: ["1588405748880-12d1d2a59f75","1587017539504-67cfbddac569","1596462502278-27bfdc403348","1571781926291-c477ebfd024b","1522335789203-aabd1fc54bc9"],
  automotive: ["1503376780353-7e6692767b70","1492144534655-ae79c964c9d7","1494976388531-d1058494cdd8","1489824904134-891ab64532f1","1580273916550-e323b7adbe07"],
  healthcare: ["1519494026892-80bbd2d6fd0d","1576091160399-112ba8d25d1d","1530026405186-ed1f139313f8","1551601651-bc60f254d532","1579684385127-1ef15d508118"],
  fitness: ["1544816155-12df9643f363","1608248543803-ba4f8c70ae0b","1571019613454-1cb2f99b2d8b","1518611012118-696072aa579a","1574680096145-d05b13162c63"],
  travel: ["1486406146926-c627a92ad1ab","1466442929976-97f336a657be","1539037116277-4db20889f2d4","1506929562872-bb421503ef21","1520250497591-112f2f40a3f4"],
  education: ["1519389950473-47ba0277781c","1490481651871-ab68de25d43d","1503454537195-1dcabb73ffb9","1515488042361-ee00e0ddd4e4","1497633762265-9d179a990aa6"],
  real_estate: ["1486406146926-c627a92ad1ab","1497366216548-37526070297c","1560185127-6ed189bf02f4","1560518883-ce09059eeffa","1545324418-cc1a3fa10c00"],
  restaurant: ["1517248135467-4c7edcad34c4","1555041469-a586c61ea9bc","1504674900247-0877df9cc836","1473093295043-cdd812d0e601","1414235077428-338989a2e8c0"],
  pets: ["1494976388531-d1058494cdd8","1587300003388-59208cc962cb","1548199973-03cce0bbc87b","1450778869180-41d0601e0e68","1583511655826-05700d52f4d9"],
  legal: ["1589829545856-d10d557cf95f","1505664194779-8beaceb93744","1450101499163-c8848e968838","1479142506502-19b3a3b7ff33","1521791055727-0637c0e61a68"],
  financial: ["1526304640581-d334cdbbf45e","1554224155-6726b3ff858f","1460925895917-afdab827c52f","1444653614773-995cb1ef9efa","1497366216548-37526070297c"],
  government: ["1486406146926-c627a92ad1ab","1555685812-4b943f1cb0eb","1523995462485-3d171b5c8fa9","1541872703-a56853f91985","1577495508048-b635879837f1"],
  digital: ["1519389950473-47ba0277781c","1526738549149-8e07eca6c147","1498049794561-7780e7231661","1490481651871-ab68de25d43d","1461896836934-ffe607ba8211"],
  grocery: ["1542838132-92c53300491e","1556228578-8c89e6adf883","1602143407151-7111542de6e8","1506484381186-d0bd208751a7","1543168256-418811576931"],
  jewelry: ["1515562141207-7a88fb7ce338","1573408301185-15e9a6f7b0dd","1602751584552-8a5b5e6e0a37","1611591437281-460bf789db56","1605100804763-247f67b3557e"],
  sports: ["1544816155-12df9643f363","1571019613454-1cb2f99b2d8b","1518611012118-696072aa579a","1574680096145-d05b13162c63","1534438327276-14e5300c3a48"],
  kids: ["1515488042361-ee00e0ddd4e4","1503454537195-1dcabb73ffb9","1497633762265-9d179a990aa6","1524178232363-1fb2b075b655","1503676260728-1c00da67a544"],
  garden: ["1416879595882-3373a0480b5b","1558618666-fcd25c85f7aa","1585320806297-9794b3e4eeae","1523348837708-15d4a09cfac2","1466692476868-aef1dfb1e735"],
  office: ["1497366216548-37526070297c","1519389950473-47ba0277781c","1498049794561-7780e7231661","1522071820081-009f0129c71c","1497215842964-222b430dc094"],
  oud: ["1588405748880-12d1d2a59f75","1596462502278-27bfdc403348","1571781926291-c477ebfd024b","1587017539504-67cfbddac569","1512496015851-a90fb38ba796"],
  traditional: ["1445205170230-053b83016050","1556821840-3a63f95609a7","1521572163474-6864f9cf17ab","1552674605-db6ffd4facb5","1515562141207-7a88fb7ce338"],
  saudi: ["1504674900247-0877df9cc836","1473093295043-cdd812d0e601","1589656966895-2f33e7653819","1447933601403-0c6688de566e","1509042239860-f550ce710b93"],
  arts: ["1513364776144-60967b0f800f","1578662996442-48f60103fc96","1544967082-d9d25d867d66","1531685250784-a1cf226d3bcc","1541367777708-7905fe3296c0"],
  books: ["1519389950473-47ba0277781c","1490481651871-ab68de25d43d","1503454537195-1dcabb73ffb9","1515488042361-ee00e0ddd4e4","1497633762265-9d179a990aa6"],
  subscription: ["1526738549149-8e07eca6c147","1498049794561-7780e7231661","1461896836934-ffe607ba8211","1519389950473-47ba0277781c","1523275335684-37898b6baf30"],
};

const HANDLE_CATEGORY_MAP = {
  "4k-drone-camera": "electronics", "ajwa-dates-gift-box": "food", "ajwa-dates-premium": "food",
  "al-olaya-office-space": "real_estate", "amber-oud-intense": "oud", "arabian-brass-lamp": "home",
  "arabic-calligraphy-course": "education", "arabic-coffee-cup-set": "food", "arabic-coffee-set-dallah": "food",
  "arabic-e-reader": "electronics", "argan-oil-set": "beauty", "baby-thobe-set": "traditional",
  "bakhoor-collection": "oud", "beach-volleyball-pro-set": "sports", "black-seed-oil-premium": "beauty",
  "camel-leather-bag": "fashion", "car-window-tint-kit": "automotive", "cityos-district": "subscription",
  "cityos-metropolis": "subscription", "cityos-pilot": "subscription", "classic-white-thobe": "traditional",
  "date-palm-seedling-kit": "garden", "dead-sea-mud-mask": "beauty", "desert-garden-collection": "garden",
  "desert-rally-kit": "automotive", "desert-running-shoes": "sports", "designer-abaya-collection": "fashion",
  "designer-leather-laptop-bag": "fashion", "diamond-solitaire-ring": "jewelry",
  "falcon-training-glove": "sports", "financial-planning-toolkit": "financial",
  "fresh-grocery-box-weekly": "grocery", "gold-arabic-calligraphy-necklace": "jewelry",
  "hajj-umrah-travel-kit": "travel", "handwoven-sadu-cushion": "arts", "healthcare-first-aid-kit-pro": "healthcare",
  "home-cleaning-service": "home", "islamic-stories-book-set": "books", "jbl-wireless-earbuds": "electronics",
  "kids-arabic-alphabet-set": "kids", "legal-document-template-suite": "legal",
  "luxury-oud-perfume": "oud", "majlis-seating-set": "home", "mens-luxury-watch-swiss": "jewelry",
  "mens-premium-linen-suit": "fashion", "mens-thobe-premium-cotton": "traditional",
  "musk-al-tahara": "oud", "natural-saffron-pack": "food", "organic-arabic-coffee-blend": "food",
  "outdoor-arabian-tent": "travel", "palm-weaving-art": "arts", "pet-falcon-accessories-kit": "pets",
  "prayer-mat-deluxe": "traditional", "premium-dashcam-4k": "electronics",
  "premium-office-chair-ergonomic": "office", "premium-oud-oil": "oud",
  "premium-saudi-bisht": "traditional", "premium-wireless-earbuds": "electronics",
  "quran-recitation-app-license": "digital", "restaurant-dining-voucher": "restaurant",
  "riyadh-season-hoodie": "fashion", "medusa-hoodie": "fashion",
  "royal-oud-mukhallat": "oud", "samsung-galaxy-s24": "electronics",
  "saudi-business-template-pack": "digital", "medusa-t-shirt": "fashion",
  "saudi-heritage-tshirt": "fashion", "saudi-honey-collection": "food",
  "saudi-khawlani-coffee": "food", "silver-khanjar-dagger": "arts",
  "smart-fitness-watch-pro": "electronics", "smart-home-hub-controller": "electronics",
  "smart-home-hub-pro": "electronics", "woven-palm-basket-bag": "fashion",
  "stainless-steel-water-bottle": "home", "zamzam-water-flask": "home",
};

const HANDLE_PRICE_MAP = {
  "4k-drone-camera": [1499, 399], "ajwa-dates-gift-box": [149, 39], "ajwa-dates-premium": [189, 49],
  "al-olaya-office-space": [15000, 3999], "amber-oud-intense": [349, 93], "arabian-brass-lamp": [299, 79],
  "arabic-calligraphy-course": [199, 53], "arabic-coffee-cup-set": [129, 34], "arabic-coffee-set-dallah": [249, 66],
  "arabic-e-reader": [599, 159], "argan-oil-set": [179, 47], "baby-thobe-set": [149, 39],
  "bakhoor-collection": [199, 53], "beach-volleyball-pro-set": [349, 93], "black-seed-oil-premium": [129, 34],
  "camel-leather-bag": [899, 239], "car-window-tint-kit": [249, 66], "cityos-district": [4999, 1333],
  "cityos-metropolis": [9999, 2666], "cityos-pilot": [1999, 533], "classic-white-thobe": [299, 79],
  "date-palm-seedling-kit": [89, 23], "dead-sea-mud-mask": [79, 21], "desert-garden-collection": [449, 119],
  "desert-rally-kit": [1299, 346], "desert-running-shoes": [499, 133], "designer-abaya-collection": [1299, 346],
  "designer-leather-laptop-bag": [599, 159], "diamond-solitaire-ring": [4999, 1333],
  "falcon-training-glove": [199, 53], "financial-planning-toolkit": [149, 39],
  "fresh-grocery-box-weekly": [99, 26], "gold-arabic-calligraphy-necklace": [2499, 666],
  "hajj-umrah-travel-kit": [349, 93], "handwoven-sadu-cushion": [399, 106],
  "healthcare-first-aid-kit-pro": [199, 53], "home-cleaning-service": [149, 39],
  "islamic-stories-book-set": [89, 23], "jbl-wireless-earbuds": [299, 79],
  "kids-arabic-alphabet-set": [69, 18], "legal-document-template-suite": [499, 133],
  "luxury-oud-perfume": [450, 120], "majlis-seating-set": [2999, 799],
  "mens-luxury-watch-swiss": [3499, 933], "mens-premium-linen-suit": [799, 213],
  "mens-thobe-premium-cotton": [599, 159], "musk-al-tahara": [49, 13],
  "natural-saffron-pack": [75, 20], "organic-arabic-coffee-blend": [139, 37],
  "outdoor-arabian-tent": [1999, 533], "palm-weaving-art": [299, 79],
  "pet-falcon-accessories-kit": [599, 159], "prayer-mat-deluxe": [149, 39],
  "premium-dashcam-4k": [499, 133], "premium-office-chair-ergonomic": [1499, 399],
  "premium-oud-oil": [399, 106], "premium-saudi-bisht": [1499, 399],
  "premium-wireless-earbuds": [299, 79], "quran-recitation-app-license": [29, 7],
  "restaurant-dining-voucher": [199, 53], "riyadh-season-hoodie": [149, 39],
  "medusa-hoodie": [149, 39], "royal-oud-mukhallat": [599, 159],
  "samsung-galaxy-s24": [4499, 1199], "saudi-business-template-pack": [99, 26],
  "medusa-t-shirt": [99, 26], "saudi-heritage-tshirt": [99, 26],
  "saudi-honey-collection": [249, 66], "saudi-khawlani-coffee": [99, 26],
  "silver-khanjar-dagger": [1499, 399], "smart-fitness-watch-pro": [599, 159],
  "smart-home-hub-controller": [449, 119], "smart-home-hub-pro": [699, 186],
  "woven-palm-basket-bag": [249, 66], "stainless-steel-water-bottle": [79, 21],
  "zamzam-water-flask": [79, 21],
};

const VENDOR_PRODUCT_MAP = {
  "vendor-extra": ["4k-drone-camera","arabic-e-reader","premium-dashcam-4k","smart-home-hub-pro","samsung-galaxy-s24","jbl-wireless-earbuds","smart-fitness-watch-pro","smart-home-hub-controller","premium-wireless-earbuds"],
  "vendor-jarir": ["arabic-calligraphy-course","islamic-stories-book-set","kids-arabic-alphabet-set","saudi-business-template-pack","quran-recitation-app-license","financial-planning-toolkit","legal-document-template-suite","arabic-e-reader"],
  "vendor-oud": ["amber-oud-intense","bakhoor-collection","musk-al-tahara","royal-oud-mukhallat","premium-oud-oil","luxury-oud-perfume"],
  "vendor-albaik": ["restaurant-dining-voucher","fresh-grocery-box-weekly"],
  "vendor-tamimi": ["ajwa-dates-gift-box","ajwa-dates-premium","saudi-honey-collection","saudi-khawlani-coffee","organic-arabic-coffee-blend","natural-saffron-pack","arabic-coffee-set-dallah","arabic-coffee-cup-set","black-seed-oil-premium"],
  "01KGZ2JS77VF4PV6F9X4RG4MKJ": ["designer-abaya-collection","mens-premium-linen-suit","camel-leather-bag","riyadh-season-hoodie","medusa-hoodie","medusa-t-shirt","saudi-heritage-tshirt","baby-thobe-set","woven-palm-basket-bag","designer-leather-laptop-bag"],
  "01KGZ2JS6VVN97NXBHNP0S4BKY": ["samsung-galaxy-s24","jbl-wireless-earbuds"],
  "01KH2A0001VENDOR3SAUDILUX": ["amber-oud-intense","luxury-oud-perfume","musk-al-tahara"],
  "01KH2A0002VENDOR4MADNDATE": ["ajwa-dates-premium","ajwa-dates-gift-box","saudi-honey-collection"],
  "01KH2A0003VENDOR5RIYDHOME": ["arabian-brass-lamp","majlis-seating-set","handwoven-sadu-cushion","prayer-mat-deluxe","outdoor-arabian-tent","palm-weaving-art","silver-khanjar-dagger"],
};

async function q(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function downloadImage(unsplashId, width = 800) {
  try {
    const url = `https://images.unsplash.com/photo-${unsplashId}?w=${width}&q=80&fit=crop`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

async function uploadToBlob(buffer, blobPath) {
  try {
    const blob = await put(blobPath, buffer, {
      access: "private",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });
    return blob.url;
  } catch (e) {
    console.error(`  Blob upload failed for ${blobPath}: ${e.message}`);
    return null;
  }
}

async function seedImages() {
  console.log("\n=== STEP 1: Uploading images to Vercel Blob ===");
  if (!BLOB_TOKEN) { console.log("  No BLOB_READ_WRITE_TOKEN, skipping blob uploads"); return; }

  const categories = Object.keys(IMAGE_CATALOG);
  let uploaded = 0, failed = 0;

  for (const cat of categories) {
    const ids = IMAGE_CATALOG[cat];
    for (let i = 0; i < ids.length; i++) {
      const blobPath = `tenants/${TENANT_SLUG}/domains/commerce/products/${cat}/${cat}-${i}.jpg`;
      const buf = await downloadImage(ids[i]);
      if (buf) {
        const url = await uploadToBlob(buf, blobPath);
        if (url) { uploaded++; } else { failed++; }
      } else { failed++; }
    }
    const thumbBuf = await downloadImage(ids[0], 400);
    if (thumbBuf) {
      const thumbPath = `tenants/${TENANT_SLUG}/domains/commerce/products/${cat}/${cat}-thumb.jpg`;
      const url = await uploadToBlob(thumbBuf, thumbPath);
      if (url) uploaded++; else failed++;
    }
    console.log(`  ${cat}: ${ids.length} images processed`);
  }
  console.log(`  Total: ${uploaded} uploaded, ${failed} failed`);
}

function blobImageUrl(category, index) {
  return `/platform/media?path=${encodeURIComponent(`tenants/${TENANT_SLUG}/domains/commerce/products/${category}/${category}-${index}.jpg`)}`;
}
function blobThumbUrl(category) {
  return `/platform/media?path=${encodeURIComponent(`tenants/${TENANT_SLUG}/domains/commerce/products/${category}/${category}-thumb.jpg`)}`;
}

async function seedPrices() {
  console.log("\n=== STEP 2: Seeding prices for all products ===");
  const variants = await q(`
    SELECT pv.id as variant_id, pv.product_id, p.handle
    FROM product_variant pv JOIN product p ON pv.product_id = p.id
    WHERE pv.product_id NOT IN (
      SELECT DISTINCT pv2.product_id FROM product_variant pv2
      JOIN product_variant_price_set pvps ON pvps.variant_id = pv2.id
    ) ORDER BY p.handle
  `);

  if (variants.length === 0) { console.log("  All products already have prices"); return; }

  const ts = now();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let count = 0;
    for (const v of variants) {
      const prices = HANDLE_PRICE_MAP[v.handle] || [99, 26];
      const [sarAmount, usdAmount] = prices;
      const psId = `pset_seed_${uid()}`;
      await client.query(`INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, $2, $2)`, [psId, ts]);
      await client.query(`INSERT INTO price (id, price_set_id, currency_code, amount, created_at, updated_at, raw_amount) VALUES ($1, $2, 'sar', $3, $4, $4, $5)`,
        [`price_sar_${uid()}`, psId, sarAmount, ts, JSON.stringify({value: String(sarAmount), precision: 20})]);
      await client.query(`INSERT INTO price (id, price_set_id, currency_code, amount, created_at, updated_at, raw_amount) VALUES ($1, $2, 'usd', $3, $4, $4, $5)`,
        [`price_usd_${uid()}`, psId, usdAmount, ts, JSON.stringify({value: String(usdAmount), precision: 20})]);
      await client.query(`INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)`,
        [`pvps_seed_${uid()}`, v.variant_id, psId, ts]);
      count++;
    }
    await client.query('COMMIT');
    console.log(`  Seeded prices for ${count} variants`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function seedSalesChannels() {
  console.log("\n=== STEP 3: Linking products to sales channels ===");
  const unlinked = await q(`
    SELECT p.id FROM product p WHERE p.id NOT IN (SELECT product_id FROM product_sales_channel)
  `);

  if (unlinked.length === 0) { console.log("  All products already linked to sales channels"); return; }

  let count = 0;
  for (const p of unlinked) {
    for (const sc of ALL_SC) {
      await q(`INSERT INTO product_sales_channel (product_id, sales_channel_id, created_at, updated_at) VALUES ($1, $2, $3, $3) ON CONFLICT DO NOTHING`,
        [p.id, sc, now()]);
    }
    count++;
  }
  console.log(`  Linked ${count} products to all 3 sales channels`);
}

async function seedCustomerAddresses() {
  console.log("\n=== STEP 4: Seeding customer addresses ===");
  const existing = await q(`SELECT count(*) as cnt FROM customer_address`);
  if (parseInt(existing[0].cnt) > 0) { console.log("  Customer addresses already exist"); return; }

  const customers = await q(`SELECT id, email, first_name, last_name FROM customer`);
  const addresses = [
    { city: "Riyadh", address_1: "King Fahd Road, Al Olaya District", postal_code: "11564", province: "Riyadh" },
    { city: "Riyadh", address_1: "Prince Sultan Street, Al Malaz", postal_code: "11441", province: "Riyadh" },
    { city: "Jeddah", address_1: "Tahlia Street, Al Rawdah", postal_code: "21577", province: "Makkah" },
    { city: "Jeddah", address_1: "Palestine Street, Al Hamra", postal_code: "21482", province: "Makkah" },
    { city: "Dammam", address_1: "King Saud Street, Al Faisaliyah", postal_code: "31411", province: "Eastern" },
    { city: "Madinah", address_1: "Abu Bakr As Siddiq Road", postal_code: "42311", province: "Madinah" },
    { city: "Makkah", address_1: "Ibrahim Al Khalil Street", postal_code: "24231", province: "Makkah" },
    { city: "Khobar", address_1: "Dhahran Mall Road, Al Khobar", postal_code: "31952", province: "Eastern" },
    { city: "Taif", address_1: "Shubra Street, Al Hawiyah", postal_code: "21944", province: "Makkah" },
    { city: "Tabuk", address_1: "King Abdulaziz Road", postal_code: "71411", province: "Tabuk" },
    { city: "Abha", address_1: "Prince Sultan Street", postal_code: "61321", province: "Asir" },
    { city: "Hail", address_1: "King Faisal Street", postal_code: "81411", province: "Hail" },
  ];

  let idx = 0;
  for (const c of customers) {
    for (let a = 0; a < 2; a++) {
      const addr = addresses[idx % addresses.length];
      const isShipping = a === 0;
      const phone = `+9665${Math.floor(10000000 + Math.random() * 89999999)}`;
      await q(`INSERT INTO customer_address (id, customer_id, first_name, last_name, phone, company, address_1, city, province, postal_code, country_code, is_default_shipping, is_default_billing, address_name, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'sa',$11,$12,$13,$14,$14)`,
        [`cadr_seed_${uid()}`, c.id, c.first_name, c.last_name, phone, "",
         addr.address_1, addr.city, addr.province, addr.postal_code,
         isShipping, !isShipping, isShipping ? "Home" : "Work", now()]);
      idx++;
    }
  }
  console.log(`  Created ${idx} customer addresses`);
}

async function seedTenantUsers() {
  console.log("\n=== STEP 5: Seeding tenant user roles ===");
  const existing = await q(`SELECT count(*) as cnt FROM tenant_user`);
  if (parseInt(existing[0].cnt) > 0) { console.log("  Tenant users already exist"); return; }

  const roles = [
    { role: "super-admin", role_level: 100 },
    { role: "city-manager", role_level: 80 },
    { role: "district-manager", role_level: 60 },
    { role: "zone-operator", role_level: 40 },
    { role: "facility-operator", role_level: 20 },
    { role: "viewer", role_level: 5 },
  ];

  const customers = await q(`SELECT id FROM customer ORDER BY created_at`);

  for (let i = 0; i < Math.min(roles.length, customers.length); i++) {
    await q(`INSERT INTO tenant_user (id, tenant_id, user_id, role, role_level, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)`,
      [`tu_seed_${uid()}`, TENANT_ID, customers[i].id, roles[i].role, roles[i].role_level, now()]);
  }
  console.log(`  Created ${Math.min(roles.length, customers.length)} tenant user role assignments`);
}

async function seedOrders() {
  console.log("\n=== STEP 6: Seeding orders ===");
  const existing = await q(`SELECT count(*) as cnt FROM "order"`);
  if (parseInt(existing[0].cnt) > 0) { console.log("  Orders already exist"); return; }

  const customers = await q(`SELECT id, email, first_name, last_name FROM customer`);
  const productsWithPrices = await q(`
    SELECT DISTINCT p.id, p.title, p.handle, pv.id as variant_id, pv.title as variant_title,
      pr.amount, pr.currency_code
    FROM product p
    JOIN product_variant pv ON pv.product_id = p.id
    JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
    JOIN price_set ps ON ps.id = pvps.price_set_id
    JOIN price pr ON pr.price_set_id = ps.id
    WHERE pr.currency_code = 'sar'
    ORDER BY p.handle
    LIMIT 30
  `);

  if (productsWithPrices.length === 0) { console.log("  No products with SAR prices found, skipping orders"); return; }

  const statuses = ["pending", "completed", "completed", "completed", "pending", "canceled", "completed", "completed"];
  const displayIdStart = 1001;

  for (let i = 0; i < 8; i++) {
    const cust = customers[i % customers.length];
    const orderId = `order_seed_${uid()}`;
    const status = statuses[i];
    const city = ["Riyadh", "Jeddah", "Dammam", "Madinah", "Makkah", "Khobar", "Taif", "Abha"][i];
    const orderDate = new Date(Date.now() - (30 - i * 3) * 86400000).toISOString();

    const numItems = 1 + (i % 3);
    let totalAmount = 0;
    const lineItems = [];
    for (let j = 0; j < numItems; j++) {
      const prod = productsWithPrices[(i * 3 + j) % productsWithPrices.length];
      const qty = 1 + (j % 2);
      const amount = parseInt(prod.amount);
      totalAmount += amount * qty;
      lineItems.push({ prod, qty, amount });
    }

    const addrId = `oadr_seed_${uid()}`;
    await q(`INSERT INTO order_address (id, first_name, last_name, phone, company, address_1, city, province, postal_code, country_code, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'sa',$10,$10)`,
      [addrId, cust.first_name, cust.last_name, `+9665${Math.floor(10000000+Math.random()*89999999)}`, "",
       `${city} Main Street, Block ${i+1}`, city, city, `${10000+i*1111}`, orderDate]);

    const billingAddrId = `oadr_seed_${uid()}`;
    await q(`INSERT INTO order_address (id, first_name, last_name, phone, company, address_1, city, province, postal_code, country_code, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'sa',$10,$10)`,
      [billingAddrId, cust.first_name, cust.last_name, `+9665${Math.floor(10000000+Math.random()*89999999)}`, "",
       `${city} Business District`, city, city, `${20000+i*1111}`, orderDate]);

    await q(`INSERT INTO "order" (id, display_id, region_id, customer_id, sales_channel_id, email, currency_code, shipping_address_id, billing_address_id, status, version, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,'sar',$7,$8,$9,1,$10,$10)`,
      [orderId, displayIdStart + i, REGION_MENA, cust.id, SC_WEB, cust.email, addrId, billingAddrId, status, orderDate]);

    for (let j = 0; j < lineItems.length; j++) {
      const li = lineItems[j];
      const liId = `oli_seed_${uid()}`;
      const oiId = `oi_seed_${uid()}`;

      await q(`INSERT INTO order_line_item (id, title, subtitle, variant_sku, variant_title, unit_price, requires_shipping, is_discountable, is_tax_inclusive, is_custom_price, is_giftcard, created_at, updated_at, product_id, variant_id, product_title, product_handle, raw_unit_price)
        VALUES ($1,$2,'',$3,$4,$5,true,true,true,false,false,$6,$6,$7,$8,$9,$10,$11)`,
        [liId, li.prod.title, "", li.prod.variant_title || "Default", li.amount, orderDate,
         li.prod.id, li.prod.variant_id, li.prod.title, li.prod.handle,
         JSON.stringify({value: String(li.amount), precision: 20})]);

      const rawQty = JSON.stringify({value: String(li.qty), precision: 20});
      const rawZero = JSON.stringify({value: "0", precision: 20});
      await q(`INSERT INTO order_item (id, order_id, item_id, version, quantity, raw_quantity, fulfilled_quantity, raw_fulfilled_quantity, shipped_quantity, raw_shipped_quantity, return_requested_quantity, raw_return_requested_quantity, return_received_quantity, raw_return_received_quantity, return_dismissed_quantity, raw_return_dismissed_quantity, written_off_quantity, raw_written_off_quantity, delivered_quantity, raw_delivered_quantity, created_at, updated_at)
        VALUES ($1,$2,$3,1,$4,$5,0,$6,0,$6,0,$6,0,$6,0,$6,0,$6,0,$6,$7,$7)`,
        [oiId, orderId, liId, li.qty, rawQty, rawZero, orderDate]);

      await q(`UPDATE order_line_item SET totals_id = $1 WHERE id = $2`, [oiId, liId]);
    }

    const shippingCost = 15;
    const tax = Math.round(totalAmount * 0.15);
    await q(`INSERT INTO order_summary (id, order_id, version, totals, created_at, updated_at)
      VALUES ($1,$2,1,$3,$4,$4)`,
      [`osum_seed_${uid()}`, orderId,
       JSON.stringify({
         subtotal: totalAmount, shipping_total: shippingCost, tax_total: tax,
         total: totalAmount + shippingCost + tax,
         item_total: totalAmount,
         pending_difference: 0, current_order_total: totalAmount + shippingCost + tax,
       }), orderDate]);
  }
  console.log(`  Created 8 orders with line items and summaries`);
}

async function seedVendorProducts() {
  console.log("\n=== STEP 7: Seeding vendor-product linkages ===");
  const existing = await q(`SELECT count(*) as cnt FROM vendor_product`);
  if (parseInt(existing[0].cnt) > 0) { console.log("  Vendor-product links already exist"); return; }

  const products = await q(`SELECT id, handle FROM product`);
  const handleToId = Object.fromEntries(products.map(p => [p.handle, p.id]));
  const columns = await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_product' ORDER BY ordinal_position`);
  const colNames = columns.map(c => c.column_name);

  let count = 0;
  let isFirst = true;
  for (const [vendorId, handles] of Object.entries(VENDOR_PRODUCT_MAP)) {
    for (const handle of handles) {
      const prodId = handleToId[handle];
      if (!prodId) continue;
      const id = `vp_seed_${uid()}`;
      try {
        await q(`INSERT INTO vendor_product (id, vendor_id, product_id, tenant_id, is_primary_vendor, attribution_percentage, status, manage_inventory, fulfillment_method, lead_time_days, commission_override, commission_rate, commission_type, raw_attribution_percentage, created_at, updated_at)
          VALUES ($1,$2,$3,$4,true,100,'approved',true,'vendor',3,false,10,'percentage',$5,$6,$6) ON CONFLICT DO NOTHING`,
          [id, vendorId, prodId, TENANT_ID, JSON.stringify({value:"100",precision:20}), now()]);
        count++;
      } catch (e) {
        if (isFirst) { console.log(`  vendor_product insert error: ${e.message}`); isFirst = false; }
      }
    }
  }
  console.log(`  Created ${count} vendor-product linkages`);
}

async function seedInventory() {
  console.log("\n=== STEP 8: Seeding inventory ===");
  const existing = await q(`SELECT count(*) as cnt FROM inventory_item`);
  if (parseInt(existing[0].cnt) > 0) { console.log("  Inventory already exists"); return; }

  const variants = await q(`SELECT pv.id, pv.sku, pv.title, p.handle FROM product_variant pv JOIN product p ON pv.product_id = p.id ORDER BY p.handle LIMIT 200`);

  let count = 0;
  for (const v of variants) {
    const sku = v.sku || `SKU-${v.handle}-${count}`;
    const invId = `iitem_seed_${uid()}`;
    await q(`INSERT INTO inventory_item (id, sku, title, requires_shipping, created_at, updated_at)
      VALUES ($1, $2, $3, true, $4, $4)`, [invId, sku, v.title || v.handle, now()]);

    const qty = 10 + Math.floor(Math.random() * 190);
    await q(`INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at, raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity)
      VALUES ($1, $2, $3, $4, 0, 0, $5, $5, $6, '{"value":"0","precision":20}', '{"value":"0","precision":20}')`,
      [`ilvl_seed_${uid()}`, invId, SLOC_RIYADH, qty, now(), JSON.stringify({value: String(qty), precision: 20})]);

    if (count % 3 === 0) {
      const qty2 = 5 + Math.floor(Math.random() * 50);
      await q(`INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at, raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity)
        VALUES ($1, $2, $3, $4, 0, 0, $5, $5, $6, '{"value":"0","precision":20}', '{"value":"0","precision":20}')`,
        [`ilvl_seed_${uid()}`, invId, SLOC_CENTRAL, qty2, now(), JSON.stringify({value: String(qty2), precision: 20})]);
    }
    count++;
  }
  console.log(`  Created ${count} inventory items with stock levels`);
}

async function updateProductImages() {
  console.log("\n=== STEP 9: Updating product images to Vercel Blob paths ===");

  const products = await q(`SELECT id, handle, thumbnail FROM product`);
  let updated = 0;

  for (const p of products) {
    const cat = HANDLE_CATEGORY_MAP[p.handle];
    if (!cat) continue;

    const newThumb = blobThumbUrl(cat);
    if (p.thumbnail !== newThumb) {
      await q(`UPDATE product SET thumbnail = $1, updated_at = $2 WHERE id = $3`, [newThumb, now(), p.id]);
    }

    const existingImages = await q(`SELECT id, url FROM image WHERE product_id = $1`, [p.id]);
    const imageCount = existingImages.length;
    const catImages = IMAGE_CATALOG[cat] || IMAGE_CATALOG.electronics;
    const targetCount = Math.max(3, imageCount);

    for (let i = imageCount; i < targetCount; i++) {
      const newUrl = blobImageUrl(cat, i % catImages.length);
      await q(`INSERT INTO image (id, url, product_id, rank, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)`,
        [`img_seed_${uid()}`, newUrl, p.id, i, now()]);
    }

    for (const img of existingImages) {
      if (img.url.startsWith("/platform/media?path=media/")) {
        const newUrl = blobImageUrl(cat, existingImages.indexOf(img) % catImages.length);
        await q(`UPDATE image SET url = $1, updated_at = $2 WHERE id = $3`, [newUrl, now(), img.id]);
      }
    }
    updated++;
  }
  console.log(`  Updated images for ${updated} products`);
}

async function seedVerticalSampleData() {
  console.log("\n=== STEP 10: Seeding vertical module sample data ===");
  const customers = await q(`SELECT id, email, first_name FROM customer LIMIT 6`);
  const ts = now();

  const checkEmpty = async (table) => {
    const r = await q(`SELECT count(*) as cnt FROM "${table}"`);
    return parseInt(r[0].cnt) === 0;
  };

  if (await checkEmpty("wishlist")) {
    for (let i = 0; i < 3; i++) {
      await q(`INSERT INTO wishlist (id, tenant_id, customer_id, title, visibility, is_default, created_at, updated_at) VALUES ($1,$2,$3,'My Wishlist','private',true,$4,$4)`,
        [`wl_seed_${uid()}`, TENANT_ID, customers[i].id, ts]);
    }
    console.log("  Created 3 wishlists");
  }

  if (await checkEmpty("wallet")) {
    for (let i = 0; i < customers.length; i++) {
      const balance = Math.floor(Math.random() * 5000);
      await q(`INSERT INTO wallet (id, customer_id, currency, balance, version, status, created_at, updated_at, raw_balance) VALUES ($1,$2,'sar',$3,1,'active',$4,$4,$5)`,
        [`wal_seed_${uid()}`, customers[i].id, balance, ts, JSON.stringify({value: String(balance), precision: 20})]);
    }
    console.log(`  Created ${customers.length} wallets`);
  }

  if (await checkEmpty("loyalty_program")) {
    const lpId = `lp_seed_${uid()}`;
    await q(`INSERT INTO loyalty_program (id, tenant_id, name, description, points_per_currency, currency_code, is_active, created_at, updated_at)
      VALUES ($1,$2,'Dakkah Rewards','Earn points on every purchase',1,'sar',true,$3,$3)`, [lpId, TENANT_ID, ts]);
    for (let i = 0; i < 4; i++) {
      const pts = Math.floor(Math.random() * 10000);
      await q(`INSERT INTO loyalty_account (id, program_id, customer_id, tenant_id, points_balance, lifetime_points, tier, status, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$8)`,
        [`la_seed_${uid()}`, lpId, customers[i].id, TENANT_ID, pts, pts + Math.floor(Math.random() * 5000), ["bronze","silver","gold","platinum"][i], ts]);
    }
    console.log("  Created loyalty program with 4 accounts");
  }

  if (await checkEmpty("event")) {
    const events = [
      { title: "Riyadh Season Opening", venue: "Boulevard Riyadh City", type: "entertainment" },
      { title: "Saudi Tech Summit 2026", venue: "Riyadh International Convention Center", type: "conference" },
      { title: "Jeddah Art Week", venue: "Jeddah Corniche", type: "exhibition" },
    ];
    for (const ev of events) {
      const startDate = new Date(Date.now() + Math.floor(Math.random() * 90) * 86400000).toISOString();
      await q(`INSERT INTO event (id, tenant_id, title, description, event_type, address, starts_at, ends_at, status, organizer_name, max_capacity, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published',$9,500,$10,$10)`,
        [`evt_seed_${uid()}`, TENANT_ID, ev.title, `${ev.title} - A premier event in Saudi Arabia`, ev.type,
         ev.venue, startDate, new Date(new Date(startDate).getTime() + 3 * 86400000).toISOString(),
         "Dakkah Events", ts]);
    }
    console.log("  Created 3 events");
  }

  if (await checkEmpty("booking")) {
    const vendors = await q(`SELECT id, business_name FROM vendor LIMIT 3`);
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 3600000).toISOString();
      const bookingNum = `BK-${TENANT_SLUG.toUpperCase()}-${String(1001 + i).padStart(6, '0')}`;
      const total = [150,200,350,100,500][i];
      await q(`INSERT INTO booking (id, booking_number, tenant_id, customer_id, customer_name, customer_email, start_time, end_time, timezone, status, currency_code, total, payment_status, customer_notes, created_at, updated_at, raw_total)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Asia/Riyadh',$9,'sar',$10,'paid',$11,$12,$12,$13)`,
        [`bk_seed_${uid()}`, bookingNum, TENANT_ID, customers[i % customers.length].id,
         customers[i % customers.length].first_name, customers[i % customers.length].email,
         startTime, endTime,
         ["confirmed","pending","confirmed","completed","confirmed"][i],
         total, `Booking for ${customers[i % customers.length].first_name}`,
         ts, JSON.stringify({value: String(total), precision: 20})]);
    }
    console.log("  Created 5 bookings");
  }

  if (await checkEmpty("classified_listing")) {
    const listings = [
      { title: "Used Toyota Land Cruiser 2024", price: 180000, type: "sale" },
      { title: "Furnished Apartment Al Olaya", price: 8500, type: "rent" },
      { title: "iPhone 15 Pro Max 256GB", price: 3200, type: "sale" },
      { title: "Antique Arabic Coffee Set", price: 2500, type: "sale" },
    ];
    for (const l of listings) {
      await q(`INSERT INTO classified_listing (id, tenant_id, seller_id, title, description, listing_type, condition, price, currency_code, is_negotiable, location_city, location_country, status, created_at, updated_at, raw_price)
        VALUES ($1,$2,$3,$4,$5,$6,'used',$7,'sar',true,'Riyadh','sa','active',$8,$8,$9)`,
        [`cl_seed_${uid()}`, TENANT_ID, customers[0].id, l.title, `${l.title} - Great condition, serious buyers only`,
         l.type, l.price, ts, JSON.stringify({value: String(l.price), precision: 20})]);
    }
    console.log("  Created 4 classified listings");
  }

  if (await checkEmpty("auction_listing")) {
    const auctions = [
      { title: "Rare Saudi Gold Coin 1952", startBid: 5000, type: "english" },
      { title: "Vintage Rolex Submariner", startBid: 25000, type: "english" },
      { title: "Handmade Persian Rug 4x6m", startBid: 8000, type: "english" },
    ];
    for (const a of auctions) {
      const startsAt = now();
      const endsAt = new Date(Date.now() + (7 + Math.floor(Math.random() * 14)) * 86400000).toISOString();
      await q(`INSERT INTO auction_listing (id, tenant_id, title, description, auction_type, status, starting_price, current_price, currency_code, bid_increment, starts_at, ends_at, total_bids, created_at, updated_at, raw_starting_price, raw_current_price, raw_bid_increment)
        VALUES ($1,$2,$3,$4,$5,'active',$6,$6,'sar',$7,$8,$9,0,$10,$10,$11,$11,$12)`,
        [`auc_seed_${uid()}`, TENANT_ID, a.title, `${a.title} - Authentic item with certificate`,
         a.type, a.startBid, Math.round(a.startBid * 0.05), startsAt, endsAt, ts,
         JSON.stringify({value: String(a.startBid), precision: 20}),
         JSON.stringify({value: String(Math.round(a.startBid * 0.05)), precision: 20})]);
    }
    console.log("  Created 3 auction listings");
  }

  if (await checkEmpty("donation_campaign")) {
    await q(`INSERT INTO donation_campaign (id, tenant_id, title, description, goal_amount, raised_amount, currency_code, donor_count, status, campaign_type, is_featured, created_at, updated_at, raw_goal_amount, raw_raised_amount)
      VALUES ($1,$2,'Build a School in Rural Saudi','Help fund construction of a new school',500000,125000,'sar',47,'active','education',true,$3,$3,$4,$5)`,
      [`dc_seed_${uid()}`, TENANT_ID, ts,
       JSON.stringify({value:"500000",precision:20}), JSON.stringify({value:"125000",precision:20})]);
    console.log("  Created 1 donation campaign");
  }

  if (await checkEmpty("vehicle_listing")) {
    const vehicles = [
      { title: "Toyota Land Cruiser 2025", make: "Toyota", model: "Land Cruiser", year: 2025, price: 280000, mileage: 5000 },
      { title: "Nissan Patrol 2024", make: "Nissan", model: "Patrol", year: 2024, price: 195000, mileage: 25000 },
      { title: "Mercedes G63 AMG 2025", make: "Mercedes", model: "G63 AMG", year: 2025, price: 850000, mileage: 1000 },
    ];
    for (const v of vehicles) {
      await q(`INSERT INTO vehicle_listing (id, tenant_id, seller_id, listing_type, title, make, model_name, year, mileage_km, fuel_type, transmission, condition, price, currency_code, description, location_city, location_country, status, created_at, updated_at, raw_price)
        VALUES ($1,$2,$3,'sale',$4,$5,$6,$7,$8,'gasoline','automatic','used',$9,'sar',$10,'Riyadh','sa','active',$11,$11,$12)`,
        [`vl_seed_${uid()}`, TENANT_ID, customers[3].id, v.title, v.make, v.model, v.year, v.mileage,
         v.price, `${v.title} - Well maintained, full service history`,
         ts, JSON.stringify({value: String(v.price), precision: 20})]);
    }
    console.log("  Created 3 vehicle listings");
  }

  if (await checkEmpty("menu")) {
    const vendors = await q(`SELECT id, business_name FROM vendor WHERE business_name LIKE '%Baik%' OR business_name LIKE '%Tamimi%' LIMIT 2`);
    for (const v of vendors) {
      const menuId = `menu_seed_${uid()}`;
      await q(`INSERT INTO menu (id, tenant_id, restaurant_id, name, description, menu_type, is_active, display_order, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,'main',true,0,$6,$6)`,
        [menuId, TENANT_ID, v.id, `${v.business_name} Menu`, `Main menu for ${v.business_name}`, ts]);
      const items = v.business_name.includes("Baik")
        ? [{ name: "Broasted Chicken Meal", price: 25, cat: "mains" }, { name: "Nuggets Box", price: 18, cat: "snacks" }, { name: "Family Meal", price: 65, cat: "combos" }]
        : [{ name: "Fresh Salad Bowl", price: 22, cat: "salads" }, { name: "Sandwich Combo", price: 28, cat: "sandwiches" }, { name: "Juice Pack", price: 15, cat: "beverages" }];
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        await q(`INSERT INTO menu_item (id, tenant_id, menu_id, name, description, price, currency_code, category, is_available, is_featured, display_order, created_at, updated_at, raw_price)
          VALUES ($1,$2,$3,$4,$5,$6,'sar',$7,true,$8,$9,$10,$10,$11)`,
          [`mi_seed_${uid()}`, TENANT_ID, menuId, item.name, `Delicious ${item.name}`, item.price, item.cat, idx === 0, idx, ts,
           JSON.stringify({value: String(item.price), precision: 20})]);
      }
    }
    console.log("  Created menus with items");
  }

  if (await checkEmpty("cms_page")) {
    const pages = [
      { title: "About Dakkah", slug: "about", template: "about" },
      { title: "Contact Us", slug: "contact", template: "contact" },
      { title: "Terms of Service", slug: "terms", template: "legal" },
      { title: "Privacy Policy", slug: "privacy", template: "legal" },
      { title: "Shipping Policy", slug: "shipping-policy", template: "policy" },
    ];
    for (const p of pages) {
      await q(`INSERT INTO cms_page (id, tenant_id, title, slug, locale, status, template, country_code, created_at, updated_at)
        VALUES ($1,$2,$3,$4,'ar','published',$5,'sa',$6,$6)`,
        [`cms_seed_${uid()}`, TENANT_ID, p.title, p.slug, p.template, ts]);
    }
    console.log("  Created 5 CMS pages");
  }

  if (await checkEmpty("cms_navigation")) {
    const navItems = [
      { label: "Home", url: "/" },
      { label: "Shop", url: "/store" },
      { label: "Categories", url: "/categories" },
      { label: "About", url: "/about" },
      { label: "Contact", url: "/contact" },
    ];
    await q(`INSERT INTO cms_navigation (id, tenant_id, locale, location, items, status, created_at, updated_at)
      VALUES ($1,$2,'ar','header',$3,'published',$4,$4)`,
      [`nav_seed_${uid()}`, TENANT_ID, JSON.stringify(navItems), ts]);
    console.log("  Created navigation with 5 items");
  }
}

async function main() {
  const skipImages = process.argv.includes("--skip-images");
  const onlyImages = process.argv.includes("--only-images");

  console.log("============================================================");
  console.log("  DAKKAH CITYOS — COMPREHENSIVE NEON DATABASE SEED");
  console.log("  Tenant: dakkah | All data under master tenant");
  if (skipImages) console.log("  Mode: --skip-images (DB only)");
  if (onlyImages) console.log("  Mode: --only-images (Blob uploads only)");
  console.log("============================================================");

  try {
    if (onlyImages) {
      await seedImages();
      await updateProductImages();
    } else {
      if (!skipImages) await seedImages();
      await seedPrices();
      await seedSalesChannels();
      await seedCustomerAddresses();
      await seedTenantUsers();
      await seedOrders();
      await seedVendorProducts();
      await seedInventory();
      await updateProductImages();
      await seedVerticalSampleData();
    }

    console.log("\n============================================================");
    console.log("  SEED COMPLETE — Summary");
    console.log("============================================================");

    const stats = await q(`
      SELECT 'products' as entity, count(*) as cnt FROM product
      UNION ALL SELECT 'variants', count(*) FROM product_variant
      UNION ALL SELECT 'images', count(*) FROM image
      UNION ALL SELECT 'prices', count(*) FROM price
      UNION ALL SELECT 'price_sets', count(*) FROM price_set
      UNION ALL SELECT 'product_sales_channel', count(*) FROM product_sales_channel
      UNION ALL SELECT 'customers', count(*) FROM customer
      UNION ALL SELECT 'customer_addresses', count(*) FROM customer_address
      UNION ALL SELECT 'orders', count(*) FROM "order"
      UNION ALL SELECT 'order_line_items', count(*) FROM order_line_item
      UNION ALL SELECT 'tenant_users', count(*) FROM tenant_user
      UNION ALL SELECT 'vendor_products', count(*) FROM vendor_product
      UNION ALL SELECT 'inventory_items', count(*) FROM inventory_item
      UNION ALL SELECT 'inventory_levels', count(*) FROM inventory_level
      UNION ALL SELECT 'vendors', count(*) FROM vendor
      UNION ALL SELECT 'wishlists', count(*) FROM wishlist
      UNION ALL SELECT 'wallets', count(*) FROM wallet
      UNION ALL SELECT 'bookings', count(*) FROM booking
      UNION ALL SELECT 'events', count(*) FROM event
      UNION ALL SELECT 'classified_listings', count(*) FROM classified_listing
      UNION ALL SELECT 'auction_listings', count(*) FROM auction_listing
      UNION ALL SELECT 'vehicle_listings', count(*) FROM vehicle_listing
      UNION ALL SELECT 'cms_pages', count(*) FROM cms_page
      UNION ALL SELECT 'cms_navigation', count(*) FROM cms_navigation
      UNION ALL SELECT 'loyalty_programs', count(*) FROM loyalty_program
      ORDER BY entity
    `);

    for (const s of stats) {
      console.log(`  ${s.entity}: ${s.cnt}`);
    }
  } catch (err) {
    console.error("SEED ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
