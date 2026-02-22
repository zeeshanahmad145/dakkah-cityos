const CLOUD_ID = 'b7a285ff-f4b5-4a6d-9e34-2a5747051f62';

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const res = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=confluence',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  const data = await res.json();
  const connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('No access token found');
  return accessToken;
}

async function getPageVersion(accessToken, pageId) {
  const url = `https://api.atlassian.com/ex/confluence/${CLOUD_ID}/wiki/api/v2/pages/${pageId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get page ${pageId}: ${res.status} ${text}`);
  }
  const page = await res.json();
  return { version: page.version.number, title: page.title };
}

async function updatePage(accessToken, pageId, title, body, versionMessage) {
  const { version } = await getPageVersion(accessToken, pageId);
  const url = `https://api.atlassian.com/ex/confluence/${CLOUD_ID}/wiki/api/v2/pages/${pageId}`;
  const payload = {
    id: String(pageId),
    status: 'current',
    title,
    body: {
      representation: 'storage',
      value: body
    },
    version: {
      number: version + 1,
      message: versionMessage
    }
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update page ${pageId}: ${res.status} ${text}`);
  }
  return await res.json();
}

function markdownToStorage(md) {
  let html = md;
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = html.split('\n');
  let result = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```') && !inCodeBlock) {
      if (inList) { result.push('<ol>' + listItems.join('') + '</ol>'); listItems = []; inList = false; }
      if (inTable) { result.push(buildTable(tableRows)); inTable = false; tableRows = []; }
      inCodeBlock = true;
      codeLang = line.slice(3).trim();
      codeLines = [];
      continue;
    } else if (line.startsWith('```') && inCodeBlock) {
      result.push(`<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${codeLang || 'text'}</ac:parameter><ac:plain-text-body><![CDATA[${codeLines.join('\n')}]]></ac:plain-text-body></ac:structured-macro>`);
      inCodeBlock = false;
      codeLines = [];
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('|')) {
      if (!inTable) {
        if (inList) { result.push('<ol>' + listItems.join('') + '</ol>'); listItems = []; inList = false; }
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      result.push(buildTable(tableRows));
      inTable = false;
      tableRows = [];
    }

    const listMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      if (!inList) { inList = true; listItems = []; }
      listItems.push(`<li>${listMatch[2]}</li>`);
      continue;
    } else if (inList) {
      result.push('<ol>' + listItems.join('') + '</ol>');
      listItems = [];
      inList = false;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (!inList) { inList = true; listItems = []; }
      listItems.push(`<li>${ulMatch[1]}</li>`);
      continue;
    }

    if (line.trim() === '') {
      result.push('');
    } else {
      result.push(line.startsWith('<h') ? line : `<p>${line}</p>`);
    }
  }
  if (inTable) result.push(buildTable(tableRows));
  if (inList) result.push('<ol>' + listItems.join('') + '</ol>');

  return result.join('\n');
}

function buildTable(rows) {
  const headerRow = rows[0];
  const dataRows = rows.filter((r, i) => i > 1);
  const headers = headerRow.split('|').filter(c => c.trim()).map(c => c.trim());

  let html = '<table><thead><tr>';
  for (const h of headers) html += `<th>${h}</th>`;
  html += '</tr></thead><tbody>';

  for (const row of dataRows) {
    const cleaned = row.split('|');
    cleaned.shift();
    cleaned.pop();
    html += '<tr>';
    for (const c of cleaned) html += `<td>${c.trim()}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

const pages = [
  // ===== SECTION 18: Storefront Application =====
  {
    id: 57278625,
    title: '18.1 Storefront Architecture',
    versionMessage: 'Comprehensive storefront architecture documentation',
    markdown: `# 18.1 Storefront Architecture

**Source:** \`apps/storefront/\`
**Framework:** TanStack Start + React (SSR)
**Dev Port:** 5000 | **Production Port:** 5173 (behind prod-proxy.js on port 5000)

The Dakkah CityOS storefront is a server-side rendered React application built with TanStack Start. It provides the customer-facing interface for the entire CityOS Commerce platform, supporting 27 verticals, multi-tenant operations, and full RTL/i18n capabilities.

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| TanStack Start | SSR framework with file-based routing |
| React 18 | UI component library |
| TanStack Router | Type-safe file-based routing |
| Medusa JS SDK | Backend API communication |
| Tailwind CSS | Utility-first styling |
| Vite | Build tool and dev server |

## Provider Chain

The application wraps all routes in a provider chain that supplies context to every component:

| Order | Provider | Purpose |
|-------|----------|---------|
| 1 | ThemeProvider | Dark/light mode, design tokens, CSS custom properties |
| 2 | I18nProvider | Locale detection (en, fr, ar), translation strings, RTL direction |
| 3 | AuthProvider | JWT session state, customer profile, role information |
| 4 | MedusaProvider | SDK client instance, publishable key, backend URL |
| 5 | CartProvider | Cart state, line items, cart operations |

## File-Based Routing

Routes are organized under \`apps/storefront/src/routes/\` using TanStack Start file-based conventions:

| Directory | Purpose |
|-----------|---------|
| \`/$tenant/$locale/\` | Tenant-scoped, locale-aware store pages |
| \`/$tenant/$locale/products/\` | Product listing and detail pages |
| \`/$tenant/$locale/categories/\` | Category browsing |
| \`/$tenant/$locale/account/\` | Customer account management |
| \`/$tenant/$locale/manage/\` | Admin management pages (45 CRUD configs) |
| \`/vendor/\` | Vendor portal (73 dashboard pages) |

## Application Entry Point

| File | Purpose |
|------|---------|
| \`app/root.tsx\` | Root layout with provider chain |
| \`app/routes/__root.tsx\` | TanStack Router root route |
| \`app/client.tsx\` | Client-side hydration entry |
| \`app/ssr.tsx\` | Server-side rendering entry |

## Build Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| Port | 5000 | 5173 (behind proxy) |
| SSR | Enabled | Enabled (Nitro) |
| HMR | Enabled | Disabled |
| Source Maps | Enabled | Disabled |
| Minification | Disabled | Enabled |

## Key Architecture Decisions

1. TanStack Start chosen for type-safe file-based routing with built-in SSR support
2. Provider chain order ensures dependencies are available (theme before i18n, auth before cart)
3. Tenant and locale are URL segments enabling multi-tenant, multi-language storefronts
4. Medusa JS SDK handles all backend communication with automatic publishable key injection
5. SSR ensures SEO for all 65 detail pages and fast initial page loads
6. Production runs behind prod-proxy.js which routes API calls to Medusa and page requests to storefront`
  },
  {
    id: 56131841,
    title: '18.2 Route Registry (349 Routes)',
    versionMessage: 'Complete route registry documentation with 349 routes',
    markdown: `# 18.2 Route Registry (349 Routes)

**Source:** \`apps/storefront/src/routes/\`
**Total Routes:** 349 file-based routes
**Pattern:** \`/$tenant/$locale/{section}/\`

The storefront contains 349 file-based routes organized by function, covering store pages, vendor portal, admin management, vertical detail pages, and authentication flows.

## Route Distribution

| Category | Count | Description |
|----------|-------|-------------|
| Store Pages | ~80 | Products, categories, cart, checkout, account |
| Vertical Detail Pages | 65 | One detail page per vertical (27 verticals with sub-pages) |
| Vendor Portal | 73 | Vendor dashboard, orders, products, analytics |
| Manage Pages | 45 | Admin CRUD configurations |
| Authentication | ~15 | Login, register, forgot password, verify |
| Static/Utility | ~71 | Homepage, about, help, error pages, layouts |

## Store Pages

| Route Pattern | Purpose |
|---------------|---------|
| \`/$tenant/$locale/\` | Homepage with featured products and categories |
| \`/$tenant/$locale/products/\` | Product listing with filters and search |
| \`/$tenant/$locale/products/[handle]\` | Product detail page |
| \`/$tenant/$locale/categories/\` | Category browsing |
| \`/$tenant/$locale/categories/[handle]\` | Category product listing |
| \`/$tenant/$locale/cart\` | Shopping cart |
| \`/$tenant/$locale/checkout\` | Checkout flow |
| \`/$tenant/$locale/order/$orderId\` | Order confirmation and tracking |

## Tenant-Scoped Routes

All customer-facing routes are scoped under \`/$tenant/$locale/\` to support:

| Feature | Implementation |
|---------|---------------|
| Multi-tenancy | Tenant slug in URL determines store context |
| Localization | Locale segment (en, fr, ar) sets language and direction |
| Store Resolution | Tenant slug resolves to store configuration via API |
| Currency | Determined by tenant/region configuration |

## Vertical Detail Pages (65 Routes)

| Vertical | Route Pattern |
|----------|---------------|
| Auctions | \`/$tenant/$locale/auctions/\` |
| Automotive | \`/$tenant/$locale/automotive/\` |
| B2B | \`/$tenant/$locale/b2b/\` |
| Bookings | \`/$tenant/$locale/bookings/\` |
| Charity | \`/$tenant/$locale/charity/\` |
| Classifieds | \`/$tenant/$locale/classifieds/\` |
| Crowdfunding | \`/$tenant/$locale/crowdfunding/\` |
| Digital Products | \`/$tenant/$locale/digital/\` |
| Education | \`/$tenant/$locale/education/\` |
| Events | \`/$tenant/$locale/events/\` |
| Event Ticketing | \`/$tenant/$locale/event-ticketing/\` |
| Financial | \`/$tenant/$locale/financial/\` |
| Fitness | \`/$tenant/$locale/fitness/\` |
| Freelance | \`/$tenant/$locale/freelance/\` |
| Government | \`/$tenant/$locale/government/\` |
| Grocery | \`/$tenant/$locale/grocery/\` |
| Healthcare | \`/$tenant/$locale/healthcare/\` |
| Insurance | \`/$tenant/$locale/insurance/\` |
| Legal | \`/$tenant/$locale/legal/\` |
| Memberships | \`/$tenant/$locale/memberships/\` |
| Parking | \`/$tenant/$locale/parking/\` |
| Pet Services | \`/$tenant/$locale/pet-services/\` |
| Real Estate | \`/$tenant/$locale/real-estate/\` |
| Rentals | \`/$tenant/$locale/rentals/\` |
| Restaurants | \`/$tenant/$locale/restaurants/\` |
| Travel | \`/$tenant/$locale/travel/\` |
| Print on Demand | \`/$tenant/$locale/print-on-demand/\` |

## Vendor Portal Routes (73 Pages)

| Route Pattern | Purpose |
|---------------|---------|
| \`/vendor/dashboard\` | Vendor overview dashboard |
| \`/vendor/orders\` | Order management |
| \`/vendor/products\` | Product catalog management |
| \`/vendor/analytics\` | Sales and performance analytics |
| \`/vendor/commissions\` | Commission tracking |
| \`/vendor/payouts\` | Payout history and requests |
| \`/vendor/reviews\` | Customer review management |
| \`/vendor/settings\` | Vendor profile and settings |

## Manage Pages (45 CRUD Configs)

| Route Pattern | Purpose |
|---------------|---------|
| \`/$tenant/$locale/manage/\` | Admin dashboard |
| \`/$tenant/$locale/manage/[module]\` | Module-specific CRUD pages |

## Authentication Routes

| Route | Purpose |
|-------|---------|
| \`/login\` | Customer login |
| \`/register\` | Customer registration |
| \`/forgot-password\` | Password reset request |
| \`/reset-password\` | Password reset form |
| \`/verify-email\` | Email verification |

## Key Architecture Decisions

1. File-based routing ensures type safety and automatic code splitting per route
2. Tenant and locale in URL enable bookmarkable, shareable multi-tenant URLs
3. Vertical pages follow a consistent pattern for maintainability across 27 verticals
4. Vendor portal is separated from store routes for clear access control boundaries
5. Manage pages use shared CRUD components to minimize code duplication across 45 configurations`
  },
  {
    id: 56459468,
    title: '18.3 Design System',
    versionMessage: 'Design system documentation with tokens and theme provider',
    markdown: `# 18.3 Design System

**Source:** \`packages/cityos-design-tokens/\`, \`packages/cityos-design-system/\`, \`packages/cityos-design-runtime/\`
**Theme Provider:** \`apps/storefront/src/components/theme/\`

The CityOS design system provides a centralized, token-based approach to styling the entire storefront application. It supports dark/light mode switching, RTL layouts, and consistent visual language across all 349 routes.

## Design Token Categories

| Category | Examples | CSS Custom Property Pattern |
|----------|----------|---------------------------|
| Colors | Primary, secondary, accent, neutral | \`--color-primary-500\` |
| Spacing | xs, sm, md, lg, xl, 2xl | \`--spacing-md\` |
| Typography | Font family, size, weight, line height | \`--font-size-lg\` |
| Shadows | sm, md, lg, xl | \`--shadow-md\` |
| Border Radius | sm, md, lg, full | \`--radius-md\` |
| Breakpoints | sm, md, lg, xl, 2xl | Used in media queries |

## Theme Provider

| Feature | Implementation |
|---------|---------------|
| Dark/Light Mode | CSS class toggle on root element |
| System Preference | Detects \`prefers-color-scheme\` media query |
| Persistence | Theme preference stored in localStorage |
| Token Resolution | CSS custom properties updated per theme |

## Component Type System

| Component Category | Examples |
|-------------------|----------|
| Layout | Container, Grid, Stack, Flex, Divider |
| Navigation | Navbar, Sidebar, Breadcrumb, Tabs, Pagination |
| Data Display | DataTable, Card, Badge, Avatar, Stat |
| Forms | Input, Select, Checkbox, Radio, DatePicker, FormWizard |
| Feedback | Alert, Toast, Modal, Dialog, Spinner, Skeleton |
| Commerce | ProductCard, PriceDisplay, CartItem, CheckoutForm |

## Mobile-First Responsive Design

| Breakpoint | Min Width | Target |
|-----------|-----------|--------|
| Default | 0px | Mobile phones |
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

## CSS Custom Properties

Design tokens are exposed as CSS custom properties for runtime theming:

| Property Group | Count | Example |
|---------------|-------|---------|
| Color tokens | ~60 | \`--color-primary-50\` through \`--color-primary-950\` |
| Spacing tokens | ~12 | \`--spacing-0\` through \`--spacing-16\` |
| Typography tokens | ~15 | \`--font-size-xs\` through \`--font-size-5xl\` |
| Shadow tokens | ~6 | \`--shadow-sm\` through \`--shadow-2xl\` |

## Package Architecture

| Package | Purpose |
|---------|---------|
| \`cityos-design-tokens\` | Token definitions (JSON/TS) |
| \`cityos-design-system\` | CSS generator and utilities |
| \`cityos-design-runtime\` | Runtime token resolution and theme switching |

## Key Design Decisions

1. Token-based system ensures consistency across all 349 routes and 77 CMS block types
2. CSS custom properties enable runtime theme switching without rebuild
3. Mobile-first approach ensures usability on all devices including Arabic RTL layouts
4. Separate packages allow design tokens to be shared between storefront and other applications
5. Dark/light mode support with system preference detection for automatic theming`
  },
  {
    id: 56361256,
    title: '18.4 CMS Block System (77 Blocks)',
    versionMessage: 'CMS block system documentation with 77 block types',
    markdown: `# 18.4 CMS Block System (77 Blocks)

**Source:** \`apps/storefront/src/components/blocks/\`
**Block Count:** 77 block types
**Target:** 45 vertical detail pages via Payload CMS composition

The CMS Block System provides 77 reusable content blocks that can be composed into pages through Payload CMS. Each vertical detail page is built from a combination of these blocks, enabling non-developer content management while maintaining consistent design.

## Block Categories

| Category | Count | Examples |
|----------|-------|---------|
| Hero Blocks | 5 | Hero Banner, Hero Slider, Hero Video, Hero Split, Hero Minimal |
| Content Blocks | 12 | Rich Text, Feature Grid, Icon Grid, Stats, Timeline, Accordion |
| Commerce Blocks | 10 | Product Grid, Pricing Table, Cart Summary, Featured Products, Category Grid |
| Media Blocks | 8 | Image Gallery, Video Player, Carousel, Lightbox, Before/After |
| Form Blocks | 6 | Contact Form, Newsletter Signup, Survey, Booking Form, Quote Request, Search |
| Social Proof | 7 | Testimonials, Reviews, Client Logos, Case Studies, Awards, Team, Partners |
| Navigation Blocks | 5 | Breadcrumb, Tab Navigation, Sidebar Nav, Footer, CTA Banner |
| Map/Location | 4 | Map, Location Cards, Store Locator, Directions |
| Vertical-Specific | 20 | Auction Bid, Booking Calendar, Menu Display, Property Listing, Vehicle Specs |

## Core Block Types

| Block Type | Props | Description |
|-----------|-------|-------------|
| Hero | title, subtitle, image, cta, alignment | Full-width hero section with call-to-action |
| FeatureGrid | features[], columns, icon_style | Grid of feature cards with icons |
| PricingTable | plans[], highlight, currency | Pricing comparison table |
| Testimonials | items[], layout, show_avatar | Customer testimonial carousel or grid |
| FAQ | items[], expandable, search | Frequently asked questions with accordion |
| ContactForm | fields[], submit_action, validation | Customizable contact form |
| Map | center, zoom, markers[], style | Interactive map with location markers |
| Gallery | images[], layout, lightbox | Image gallery with multiple layout options |
| Video | url, autoplay, poster, caption | Video player with poster image |

## Vertical-Specific Blocks

| Vertical | Block Types |
|----------|------------|
| Auctions | AuctionBid, AuctionTimer, BidHistory |
| Bookings | BookingCalendar, ServiceList, ProviderCard |
| Real Estate | PropertyListing, FloorPlan, VirtualTour |
| Restaurants | MenuDisplay, TableReservation, ChefProfile |
| Healthcare | DoctorDirectory, AppointmentBooker, HealthArticle |
| Automotive | VehicleSpecs, CompareVehicles, TestDriveBooking |
| Events | EventCalendar, TicketSelector, VenueMap |

## Block Composition Pattern

Each vertical detail page is composed from blocks defined in the CMS:

| Component | Purpose |
|-----------|---------|
| BlockRenderer | Maps block type string to React component |
| BlockWrapper | Provides consistent spacing and container width |
| BlockRegistry | Registry of all 77 block type to component mappings |

## Payload CMS Integration

| Feature | Implementation |
|---------|---------------|
| Page Definition | Payload CMS collection with blocks array field |
| Block Schema | Each block type has a Payload field schema |
| Preview | Draft preview support via Payload preview URL |
| Sync | Webhook from Payload triggers storefront cache invalidation |

## Key Architecture Decisions

1. Block-based composition enables non-developer content management for all 45 vertical pages
2. Vertical-specific blocks provide specialized functionality while sharing the common block infrastructure
3. BlockRenderer pattern enables lazy loading of block components for performance
4. Payload CMS integration provides a visual editor for page composition
5. All blocks follow the design system tokens for consistent theming across dark/light mode`
  },
  {
    id: 57606324,
    title: '18.5 SSR Loaders (65 Pages)',
    versionMessage: 'SSR loaders documentation with 65 server-rendered pages',
    markdown: `# 18.5 SSR Loaders (65 Pages)

**Source:** \`apps/storefront/src/routes/\` (loader functions in route files)
**Framework:** TanStack Start server loaders
**Total SSR Pages:** 65

The storefront uses TanStack Start server loaders to fetch data on the server before rendering. Each of the 65 detail pages has a dedicated loader that fetches data from the Medusa backend and returns structured props for the page component.

## Loader Architecture

| Component | Purpose |
|-----------|---------|
| Route Loader | Async function that runs on the server before render |
| Medusa SDK | Fetches data from backend API with publishable key |
| Structured Props | Typed return value consumed by page component |
| SEO Meta | Title, description, and OpenGraph tags set in loader |
| Cache Headers | Cache-Control headers for CDN and browser caching |

## Loader Data Flow

| Step | Action |
|------|--------|
| 1 | TanStack Start receives incoming request |
| 2 | Router matches route to file-based route module |
| 3 | Loader function executes on server |
| 4 | Loader calls Medusa SDK to fetch page data |
| 5 | Loader returns structured props with SEO meta |
| 6 | React component renders with loader data |
| 7 | HTML sent to client with hydration data |

## SSR Pages by Category

| Category | Count | Examples |
|----------|-------|---------|
| Vertical Detail Pages | 27 | One per vertical (auctions, bookings, healthcare, etc.) |
| Vertical Listing Pages | 27 | Index pages for each vertical |
| Product Pages | 3 | Product detail, product list, product search |
| Category Pages | 2 | Category list, category detail |
| Account Pages | 4 | Orders, profile, bookings, subscriptions |
| Static Pages | 2 | Homepage, about |

## Loader Pattern

| Feature | Implementation |
|---------|---------------|
| Data Fetching | \`sdk.client.fetch()\` with Medusa endpoints |
| Error Handling | Try/catch with fallback to error page |
| Type Safety | TypeScript interfaces for loader return types |
| Params | Route params (tenant, locale, handle) extracted from URL |
| Headers | Cache-Control and Vary headers for caching |

## SEO Meta Tags

Each loader returns meta information for the page:

| Meta Tag | Source |
|----------|--------|
| title | Product/entity name + site name |
| description | Product/entity description (truncated) |
| og:title | Same as title |
| og:description | Same as description |
| og:image | Primary product/entity image URL |
| og:type | website or product |
| twitter:card | summary_large_image |
| twitter:title | Same as title |
| twitter:description | Same as description |

## Cache Strategy

| Route Type | Cache-Control |
|-----------|---------------|
| Product detail | public, max-age=60, stale-while-revalidate=300 |
| Category listing | public, max-age=300, stale-while-revalidate=600 |
| Vertical detail | public, max-age=120, stale-while-revalidate=300 |
| Account pages | private, no-cache |
| Cart/checkout | private, no-store |

## Key Architecture Decisions

1. Server-side data fetching ensures SEO for all 65 public-facing pages
2. TanStack Start loaders provide type-safe server/client data boundary
3. Cache headers enable CDN caching for public pages while protecting private data
4. Medusa SDK is used consistently across all loaders for data fetching
5. SEO meta tags are generated from actual data for accurate search engine indexing`
  },
  {
    id: 56131860,
    title: '18.6 Vendor Portal (73 Pages)',
    versionMessage: 'Vendor portal documentation with 73 dashboard pages',
    markdown: `# 18.6 Vendor Portal (73 Pages)

**Source:** \`apps/storefront/src/components/vendor/\`, vendor routes
**Total Pages:** 73 dashboard pages
**Access:** Requires vendor_owner or vendor_staff role

The Vendor Portal provides a comprehensive management interface for marketplace vendors. It includes 73 pages covering all aspects of vendor operations from order management to analytics and payouts.

## Portal Sections

| Section | Pages | Description |
|---------|-------|-------------|
| Dashboard | 1 | Overview with key metrics and recent activity |
| Orders | 8 | Order list, detail, fulfillment, returns, splits |
| Products | 10 | Product CRUD, variants, inventory, media, bulk import |
| Analytics | 7 | Sales, revenue, traffic, conversion, trends, reports |
| Commissions | 5 | Commission rates, calculations, history, disputes, tiers |
| Payouts | 5 | Payout history, requests, bank details, schedule, statements |
| Fulfillment | 6 | Shipping, tracking, labels, returns processing, pickup |
| Reviews | 4 | Customer reviews, ratings, responses, analytics |
| Promotions | 5 | Vendor promotions, coupons, flash deals, bundles |
| Settings | 8 | Profile, store config, notifications, team, branding, policies, hours, payments |
| Reports | 6 | Financial reports, tax reports, inventory reports, performance |
| Vertical-Specific | 8 | Booking management, auction management, etc. |

## Dashboard Overview

| Widget | Data Source |
|--------|-----------|
| Total Revenue | Vendor order aggregation |
| Pending Orders | Orders with status=pending |
| Products Count | Active product listings |
| Average Rating | Review score average |
| Commission Due | Unpaid commission balance |
| Recent Orders | Last 10 orders list |
| Revenue Chart | 30-day revenue trend |
| Top Products | Best-selling products |

## Order Management

| Page | Features |
|------|----------|
| Order List | Filterable list with status, date, customer, amount |
| Order Detail | Line items, customer info, shipping, payment status |
| Order Fulfillment | Mark items shipped, add tracking numbers |
| Returns | Process return requests, inspect, refund |
| Order Splits | View how multi-vendor orders were split |

## Product Management

| Page | Features |
|------|----------|
| Product List | Grid/list view with search and filters |
| Product Create | Form wizard for new product creation |
| Product Edit | Update details, pricing, images, SEO |
| Variant Manager | Add/edit product variants and options |
| Inventory | Stock levels, low stock alerts, restock |
| Media Library | Upload and manage product images |
| Bulk Import | CSV/Excel import for batch product creation |

## Role-Based Access

| Feature | vendor_owner | vendor_staff |
|---------|-------------|-------------|
| Dashboard | Full access | Read-only |
| Orders | Full CRUD | View and fulfill |
| Products | Full CRUD | Full CRUD |
| Analytics | Full access | Limited |
| Commissions | View all | View own |
| Payouts | Request and view | View only |
| Settings | Full access | Limited |
| Team Management | Add/remove staff | Not accessible |

## Key Architecture Decisions

1. Vendor portal is built as part of the storefront for shared component reuse
2. Vendor API routes (\`/api/vendor/*\`) provide vendor-scoped data access
3. Role-based access distinguishes vendor_owner (full control) from vendor_staff (operational)
4. Dashboard widgets use real-time data from vendor-scoped analytics endpoints
5. Vertical-specific pages (bookings, auctions) appear only for vendors in those verticals`
  },
  {
    id: 56525153,
    title: '18.7 Manage Pages (45 CRUD Configs)',
    versionMessage: 'Manage pages documentation with 45 CRUD configurations',
    markdown: `# 18.7 Manage Pages (45 CRUD Configs)

**Source:** \`apps/storefront/src/routes/$tenant/$locale/manage/\`, \`apps/storefront/src/components/manage/\`
**Total Configurations:** 45 CRUD modules
**Access:** Role-weighted sidebar filtering

The Manage section provides 45 admin CRUD configurations using shared components. Each module presents a consistent interface for listing, creating, editing, and deleting entities, with the sidebar dynamically filtering visible modules based on the current user's role weight.

## Shared Components

| Component | Purpose |
|-----------|---------|
| DataTable | Sortable, filterable, paginated table with column configuration |
| Charts | Bar, line, pie, area charts for analytics views |
| Calendar | Date-based views for bookings, events, schedules |
| FormWizard | Multi-step form for complex entity creation |
| AnalyticsOverview | Summary cards with key metrics |
| BulkActionsBar | Batch operations (delete, export, status change) |
| AdvancedFilters | Multi-field filtering with saved filter presets |

## CRUD Module List (45 Modules)

| # | Module | Min Role Weight | Entity Type |
|---|--------|----------------|-------------|
| 1 | Tenants | 90 | Platform tenants |
| 2 | Vendors | 70 | Marketplace vendors |
| 3 | Products | 50 | Product catalog |
| 4 | Orders | 50 | Customer orders |
| 5 | Customers | 70 | Customer accounts |
| 6 | Categories | 60 | Product categories |
| 7 | Commissions | 70 | Commission rules and transactions |
| 8 | Payouts | 70 | Vendor payouts |
| 9 | Invoices | 60 | Invoice management |
| 10 | Subscriptions | 60 | Subscription plans and instances |
| 11 | Bookings | 50 | Booking management |
| 12 | Auctions | 60 | Auction listings |
| 13 | Reviews | 50 | Customer reviews |
| 14 | Disputes | 60 | Dispute resolution |
| 15 | Promotions | 60 | Promotion rules |
| 16 | Loyalty Programs | 70 | Loyalty configuration |
| 17 | Nodes | 80 | City hierarchy nodes |
| 18 | Governance | 90 | Governance policies |
| 19 | Personas | 80 | Persona management |
| 20 | Region Zones | 70 | Geographic zones |
| 21 | Analytics | 60 | Analytics dashboard |
| 22 | CMS Content | 60 | Content management |
| 23 | Notifications | 60 | Notification preferences |
| 24-45 | Vertical Modules | 50-70 | Vertical-specific entities |

## Sidebar Filtering

The sidebar dynamically shows/hides modules based on the authenticated user's role weight:

| Role | Weight | Visible Modules |
|------|--------|----------------|
| super_admin | 100 | All 45 modules |
| platform_admin | 90 | All except super_admin-only |
| tenant_owner | 80 | Tenant-scoped modules |
| tenant_admin | 70 | Most operational modules |
| node_manager | 60 | Node and zone modules |
| vendor_owner | 50 | Vendor-scoped modules |

## DataTable Features

| Feature | Description |
|---------|-------------|
| Column Sort | Click column headers to sort ascending/descending |
| Search | Global text search across all visible columns |
| Pagination | Configurable page size (10, 25, 50, 100) |
| Column Toggle | Show/hide columns from column picker |
| Row Selection | Checkbox selection for bulk actions |
| Export | Export filtered data to CSV |
| Inline Edit | Quick-edit cells for simple field updates |

## Key Architecture Decisions

1. Shared CRUD components reduce code duplication across 45 modules
2. Role-weighted sidebar ensures users only see modules they can access
3. DataTable configuration is declarative — each module provides column definitions and API endpoints
4. FormWizard handles complex multi-step entity creation with validation
5. AdvancedFilters persist user preferences for frequently used filter combinations`
  },
  {
    id: 56000669,
    title: '18.8 Authentication Flow',
    versionMessage: 'Authentication flow documentation with JWT and RBAC',
    markdown: `# 18.8 Authentication Flow

**Source:** \`apps/storefront/src/components/auth/\`, \`apps/storefront/src/lib/context/\`
**Method:** JWT-based via Medusa Customer SDK
**RBAC:** 10-role hierarchy with weight-based access control

The storefront authentication system uses JWT tokens managed by the Medusa Customer SDK. The SDK's \`client.fetch()\` method automatically includes the \`VITE_MEDUSA_PUBLISHABLE_KEY\` header, providing seamless API authentication for store operations.

## Authentication Architecture

| Component | Purpose |
|-----------|---------|
| Medusa Customer SDK | JWT token management and API authentication |
| AuthProvider | React context providing auth state to all components |
| RoleGuard | Route-level component that checks role requirements |
| VITE_MEDUSA_PUBLISHABLE_KEY | Publishable key auto-included in SDK requests |

## Login Flow

| Step | Action |
|------|--------|
| 1 | User enters email/password on login page |
| 2 | SDK calls Medusa auth endpoint |
| 3 | Medusa validates credentials and returns JWT |
| 4 | SDK stores JWT in httpOnly cookie |
| 5 | AuthProvider updates with customer profile and role |
| 6 | RoleGuard evaluates access for current route |
| 7 | User redirected to appropriate dashboard/storefront |

## SDK Authentication

| Feature | Implementation |
|---------|---------------|
| API Key | \`VITE_MEDUSA_PUBLISHABLE_KEY\` sent as \`x-publishable-api-key\` header |
| JWT Token | Stored in httpOnly cookie, sent automatically |
| Token Refresh | Handled by Medusa session management |
| Logout | SDK clears session cookie |

## RoleGuard Component

| Prop | Type | Description |
|------|------|-------------|
| requiredWeight | number | Minimum role weight to access route |
| redirectTo | string | Redirect URL if access denied |
| fallback | ReactNode | Component to show while checking auth |

## 10-Role RBAC System

| Role | Weight | Primary Access |
|------|--------|---------------|
| super_admin | 100 | Full platform access |
| platform_admin | 90 | Platform management |
| tenant_owner | 80 | Tenant configuration |
| tenant_admin | 70 | Tenant operations |
| node_manager | 60 | Node hierarchy management |
| vendor_owner | 50 | Vendor portal full access |
| vendor_staff | 40 | Vendor operational access |
| support_agent | 30 | Customer support tools |
| customer | 20 | Store browsing and purchasing |
| guest | 10 | Public page access only |

## Route Protection Patterns

| Route Category | Required Weight | Roles Allowed |
|---------------|----------------|---------------|
| Public store pages | 10 | All (including guest) |
| Customer account | 20 | customer and above |
| Vendor portal | 40 | vendor_staff and above |
| Manage pages | 50-90 | Varies by module |
| Platform admin | 90 | platform_admin, super_admin |

## Key Architecture Decisions

1. Medusa SDK handles JWT lifecycle, eliminating custom token management
2. Publishable key is a client-safe key that identifies the store (not a secret)
3. RoleGuard is a component wrapper, enabling declarative route protection in JSX
4. Weight-based system allows simple numeric comparison for access checks
5. httpOnly cookies prevent XSS attacks from accessing JWT tokens`
  },
  {
    id: 55935119,
    title: '18.9 i18n and RTL Support',
    versionMessage: 'i18n and RTL support documentation with 3 locales',
    markdown: `# 18.9 i18n and RTL Support

**Source:** \`apps/storefront/src/lib/i18n/\`
**Locales:** en (English), fr (French), ar (Arabic)
**RTL Support:** Full RTL layout for Arabic via logical CSS properties

The storefront supports three locales with full right-to-left (RTL) support for Arabic. The i18n system uses logical CSS properties for bidirectional layouts, eliminating the need for separate RTL stylesheets.

## Supported Locales

| Locale | Language | Direction | Date Format | Number Format |
|--------|----------|-----------|-------------|---------------|
| en | English | LTR | MM/DD/YYYY | 1,234.56 |
| fr | French | LTR | DD/MM/YYYY | 1 234,56 |
| ar | Arabic | RTL | DD/MM/YYYY | ١٬٢٣٤٫٥٦ |

## Translation System

| Component | Purpose |
|-----------|---------|
| I18nProvider | React context providing locale and translation functions |
| Translation Files | JSON files per locale in \`src/lib/i18n/locales/\` |
| useTranslation | Hook returning \`t()\` function for string lookup |
| Locale Detection | URL segment (\`/$tenant/$locale/\`) determines active locale |

## Translation File Structure

| File | Content |
|------|---------|
| \`locales/en.json\` | English translation strings |
| \`locales/fr.json\` | French translation strings |
| \`locales/ar.json\` | Arabic translation strings |

## RTL Implementation

| CSS Property (Physical) | CSS Property (Logical) | Purpose |
|------------------------|----------------------|---------|
| margin-left | margin-inline-start | Start margin (left in LTR, right in RTL) |
| margin-right | margin-inline-end | End margin (right in LTR, left in RTL) |
| padding-left | padding-inline-start | Start padding |
| padding-right | padding-inline-end | End padding |
| text-align: left | text-align: start | Text alignment |
| float: left | float: inline-start | Float direction |
| border-left | border-inline-start | Start border |

## Direction Switching

| Feature | Implementation |
|---------|---------------|
| dir Attribute | \`<html dir="rtl">\` or \`<html dir="ltr">\` based on locale |
| Font Selection | Arabic-optimized fonts loaded for ar locale |
| Icon Mirroring | Directional icons (arrows, chevrons) auto-flip in RTL |
| Layout Reversal | Flexbox and grid layouts reverse automatically with logical properties |

## Date and Number Formatting

| Feature | Implementation |
|---------|---------------|
| Date Formatting | \`Intl.DateTimeFormat\` with locale parameter |
| Number Formatting | \`Intl.NumberFormat\` with locale parameter |
| Currency | Formatted per locale conventions (SAR, USD, EUR) |
| Relative Time | "2 hours ago" / "il y a 2 heures" / "منذ ساعتين" |

## Key Architecture Decisions

1. Logical CSS properties eliminate the need for separate RTL stylesheets
2. URL-based locale selection enables bookmarkable, shareable localized URLs
3. Translation files are loaded per-locale to minimize bundle size
4. \`dir\` attribute on \`<html>\` element ensures all browser defaults respect text direction
5. \`Intl\` APIs provide native, accurate date/number formatting per locale`
  },
  {
    id: 56721505,
    title: '18.10 SEO and Accessibility',
    versionMessage: 'SEO and accessibility documentation',
    markdown: `# 18.10 SEO and Accessibility

**Source:** \`apps/storefront/src/routes/\` (meta tags in loaders), component ARIA attributes
**SSR Pages:** 65 server-rendered pages for SEO
**Standards:** WCAG 2.1 AA compliance target

All public-facing routes include comprehensive meta tags for search engine optimization, and all interactive elements include ARIA labels and keyboard navigation support.

## SEO Implementation

| Feature | Implementation |
|---------|---------------|
| Server-Side Rendering | All 65 detail pages rendered on server for crawler access |
| Meta Tags | Title, description, og:*, twitter:* set in SSR loaders |
| Structured Data | JSON-LD for products, organizations, breadcrumbs |
| Canonical URLs | Canonical link tags prevent duplicate content |
| Sitemap | Auto-generated sitemap.xml from route registry |
| Robots | robots.txt with appropriate allow/disallow rules |

## Meta Tag Coverage

| Tag | Source | Example |
|-----|--------|---------|
| title | Entity name + site name | "Premium Wireless Headphones - Dakkah Store" |
| description | Entity description (truncated to 160 chars) | Product/service description |
| og:title | Same as title | OpenGraph title |
| og:description | Same as description | OpenGraph description |
| og:image | Primary entity image URL | Product image |
| og:type | website or product | Page type |
| og:url | Canonical page URL | Full URL |
| twitter:card | summary_large_image | Twitter card type |
| twitter:title | Same as title | Twitter title |
| twitter:description | Same as description | Twitter description |

## SSR Pages for SEO

| Page Type | Count | SEO Value |
|----------|-------|-----------|
| Product Detail | 3 | Product schema, pricing, availability |
| Vertical Detail | 27 | Vertical-specific content and offerings |
| Vertical Listing | 27 | Category-like listings for each vertical |
| Category Pages | 2 | Category navigation and product lists |
| Homepage | 1 | Organization schema, featured content |
| Static Pages | 5 | About, help, contact information |

## Accessibility Features

| Feature | Implementation |
|---------|---------------|
| ARIA Labels | All interactive elements (buttons, links, inputs) have descriptive labels |
| Keyboard Navigation | Tab order follows visual layout, Enter/Space activate controls |
| Focus Management | Visible focus indicators on all focusable elements |
| Semantic HTML | Proper heading hierarchy (h1-h6), landmarks, lists |
| Alt Text | All images have descriptive alt attributes |
| Color Contrast | Minimum 4.5:1 contrast ratio for text (WCAG AA) |
| Screen Reader | Visually hidden text for screen reader context |
| Skip Links | "Skip to content" link for keyboard users |

## Semantic HTML Structure

| Element | Usage |
|---------|-------|
| \`<header>\` | Site header with navigation |
| \`<nav>\` | Primary and secondary navigation |
| \`<main>\` | Primary page content |
| \`<article>\` | Product cards, blog posts, listings |
| \`<section>\` | Page sections with headings |
| \`<aside>\` | Sidebar filters, related content |
| \`<footer>\` | Site footer with links |

## Key Architecture Decisions

1. SSR ensures all content is available to search engine crawlers on first load
2. Meta tags are generated from actual entity data in SSR loaders for accuracy
3. ARIA labels are required in component development guidelines
4. Semantic HTML reduces reliance on ARIA by providing native accessibility
5. Focus management ensures modal dialogs and dynamic content are keyboard accessible`
  },

  // ===== SECTION 19: Authentication & RBAC =====
  {
    id: 57278645,
    title: '19.1 Authentication Architecture',
    versionMessage: 'Authentication architecture documentation',
    markdown: `# 19.1 Authentication Architecture

**Source:** Medusa built-in auth, \`apps/storefront/src/lib/context/\`, \`apps/backend/src/api/middlewares.ts\`
**Method:** JWT-based authentication
**Token Types:** Customer JWT, Admin Bearer Token, Vendor JWT

The authentication architecture uses JWT tokens for all three actor types: customers, administrators, and vendors. Each actor type has its own authentication flow optimized for its use case.

## Authentication Flows

| Actor | Method | Token Storage | API Pattern |
|-------|--------|---------------|------------|
| Customer | Medusa Customer SDK | httpOnly cookie | \`/store/*\` endpoints |
| Admin | Bearer token | Authorization header | \`/admin/*\` endpoints |
| Vendor | Vendor JWT | httpOnly cookie | \`/vendor/*\` endpoints (custom) |

## Customer Authentication

| Step | Action |
|------|--------|
| 1 | Customer submits email/password to \`/store/auth\` |
| 2 | Medusa validates credentials against customer table |
| 3 | JWT issued and stored in httpOnly cookie |
| 4 | SDK includes JWT and publishable key in subsequent requests |
| 5 | Session managed by Medusa's built-in session system |

## Admin Authentication

| Step | Action |
|------|--------|
| 1 | Admin authenticates via Medusa admin UI |
| 2 | Bearer token issued for admin API access |
| 3 | Token included in Authorization header for \`/admin/*\` routes |
| 4 | Admin middleware validates token and checks permissions |

## Vendor Authentication

| Step | Action |
|------|--------|
| 1 | Vendor logs in through storefront vendor portal |
| 2 | Custom vendor auth endpoint validates credentials |
| 3 | Vendor JWT issued with vendor_id and role claims |
| 4 | JWT stored in httpOnly cookie for vendor portal routes |
| 5 | Vendor middleware extracts vendor context for API routes |

## Session Management

| Feature | Implementation |
|---------|---------------|
| Session Storage | Medusa built-in session management (database-backed) |
| Token Expiry | Configurable JWT expiration (default: 24 hours) |
| Refresh | Automatic session refresh on active use |
| Logout | Cookie cleared, session invalidated server-side |
| Multi-device | Each device maintains independent session |

## Middleware Stack

| Middleware | Purpose | Routes |
|-----------|---------|--------|
| Publishable Key Check | Validates \`x-publishable-api-key\` header | \`/store/*\` |
| Customer Auth | Extracts customer from JWT cookie | \`/store/*\` (authenticated) |
| Admin Auth | Validates bearer token | \`/admin/*\` |
| Vendor Auth | Extracts vendor context from JWT | \`/vendor/*\` |
| CORS | Cross-origin request handling | All routes |

## Security Measures

| Measure | Implementation |
|---------|---------------|
| httpOnly Cookies | Prevents XSS access to JWT tokens |
| Secure Flag | Cookies only sent over HTTPS in production |
| SameSite | Strict same-site cookie policy |
| CSRF Protection | Double-submit cookie pattern |
| Rate Limiting | Login attempt throttling per IP |
| Password Hashing | bcrypt with configurable rounds |

## Key Architecture Decisions

1. Separate auth flows for customers, admins, and vendors provide appropriate security for each actor
2. Medusa's built-in auth handles customer and admin flows, reducing custom code
3. Vendor auth is custom because Medusa doesn't natively support vendor actors
4. httpOnly cookies chosen over localStorage for XSS protection
5. Publishable key is not a secret — it identifies the store context for API requests`
  },
  {
    id: 57475229,
    title: '19.2 10-Role RBAC System',
    versionMessage: '10-role RBAC system documentation with weight hierarchy',
    markdown: `# 19.2 10-Role RBAC System

**Source:** \`apps/storefront/src/lib/context/\`, \`apps/storefront/src/components/auth/\`
**Total Roles:** 10
**Method:** Weight-based hierarchy for access control

The platform implements a 10-role Role-Based Access Control (RBAC) system using a numeric weight hierarchy. Access decisions are made by comparing the user's role weight against the minimum weight required for a resource or action.

## Role Hierarchy

| Role | Weight | Scope | Description |
|------|--------|-------|-------------|
| super_admin | 100 | Platform | Full unrestricted platform access |
| platform_admin | 90 | Platform | Platform management, all tenants |
| tenant_owner | 80 | Tenant | Tenant configuration and billing |
| tenant_admin | 70 | Tenant | Tenant operational management |
| node_manager | 60 | Node | City hierarchy node management |
| vendor_owner | 50 | Vendor | Full vendor portal access |
| vendor_staff | 40 | Vendor | Vendor operational tasks |
| support_agent | 30 | Support | Customer support tools |
| customer | 20 | Store | Shopping and account management |
| guest | 10 | Public | Public page viewing only |

## Access Control Matrix

| Resource | guest (10) | customer (20) | vendor_staff (40) | vendor_owner (50) | node_manager (60) | tenant_admin (70) | tenant_owner (80) | platform_admin (90) | super_admin (100) |
|----------|-----------|--------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------------------|--------------------|
| Public store | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Account pages | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Vendor portal | No | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage pages | No | No | No | Partial | Yes | Yes | Yes | Yes | Yes |
| Node management | No | No | No | No | Yes | Yes | Yes | Yes | Yes |
| Tenant config | No | No | No | No | No | Yes | Yes | Yes | Yes |
| Tenant billing | No | No | No | No | No | No | Yes | Yes | Yes |
| Platform admin | No | No | No | No | No | No | No | Yes | Yes |
| System config | No | No | No | No | No | No | No | No | Yes |

## Sidebar Module Filtering

The manage page sidebar dynamically filters visible modules based on role weight:

| Weight Range | Visible Module Categories |
|-------------|--------------------------|
| 90-100 | All modules including governance, tenants, platform settings |
| 70-89 | Tenant-scoped modules, vendors, commissions, payouts |
| 60-69 | Node hierarchy, region zones, analytics |
| 50-59 | Products, orders, bookings, reviews, vertical modules |
| 40-49 | Vendor-scoped product and order management |

## Weight Comparison Logic

| Check | Condition | Result |
|-------|-----------|--------|
| Access Granted | user.roleWeight >= route.requiredWeight | Allow access |
| Access Denied | user.roleWeight < route.requiredWeight | Redirect to login or forbidden page |
| Admin Check | user.roleWeight >= 70 | Has tenant admin capabilities |
| Platform Check | user.roleWeight >= 90 | Has platform admin capabilities |

## Key Architecture Decisions

1. Numeric weights enable simple greater-than comparisons for access checks
2. Weight gaps between roles (10-point increments) allow future role insertion
3. Sidebar filtering at the UI level provides immediate visual feedback on available features
4. Roles are scoped (platform, tenant, vendor, store) for multi-tenant isolation
5. Guest role (weight 10) allows unauthenticated access to public pages`
  },
  {
    id: 56721524,
    title: '19.3 API Key Management',
    versionMessage: 'API key management documentation',
    markdown: `# 19.3 API Key Management

**Source:** \`apps/backend/medusa-config.ts\`, environment variables
**Key Types:** Publishable key, Secret key, Webhook secrets

The platform uses multiple API key types for different authentication contexts. Publishable keys identify store context, secret keys authenticate admin operations, and webhook secrets verify inbound webhook signatures.

## Key Types

| Key | Environment Variable | Purpose | Exposure |
|-----|---------------------|---------|----------|
| Publishable Key | VITE_MEDUSA_PUBLISHABLE_KEY | Identifies store for API requests | Client-safe (public) |
| Admin Secret | MEDUSA_ADMIN_SECRET | Admin API authentication | Server-only (secret) |
| Stripe Webhook Secret | STRIPE_WEBHOOK_SECRET | Verify Stripe webhook signatures | Server-only (secret) |
| ERPNext Webhook Secret | ERPNEXT_WEBHOOK_SECRET | Verify ERPNext webhook signatures | Server-only (secret) |
| Fleetbase Webhook Secret | FLEETBASE_WEBHOOK_SECRET | Verify Fleetbase webhook signatures | Server-only (secret) |
| Payload CMS Secret | PAYLOAD_WEBHOOK_SECRET | Verify Payload CMS webhook signatures | Server-only (secret) |
| Temporal API Key | TEMPORAL_API_KEY | Authenticate with Temporal Cloud | Server-only (secret) |

## Publishable Key Usage

| Context | Implementation |
|---------|---------------|
| Storefront SDK | \`sdk.client.fetch()\` auto-includes as \`x-publishable-api-key\` header |
| Store API Routes | Middleware validates publishable key on all \`/store/*\` requests |
| Build-Time | Available as \`VITE_MEDUSA_PUBLISHABLE_KEY\` (Vite exposes VITE_ prefixed vars) |

## Secret Key Management

| Practice | Implementation |
|----------|---------------|
| Storage | Replit Secrets (encrypted at rest) |
| Access | Server-side only via \`process.env\` |
| Rotation | Manual rotation with service restart |
| Exposure Prevention | Never logged, never in client bundles |

## Webhook Secret Verification

| Integration | Verification Method |
|-------------|-------------------|
| Stripe | HMAC-SHA256 signature in \`Stripe-Signature\` header |
| ERPNext | HMAC signature verification |
| Fleetbase | HMAC signature verification |
| Payload CMS | HMAC signature in custom header |

## Key Security Practices

| Practice | Description |
|----------|-------------|
| No secrets in code | All secrets stored in environment variables |
| VITE_ prefix convention | Only VITE_-prefixed env vars are exposed to client bundle |
| Webhook verification | All inbound webhooks verified via HMAC signatures |
| Separate key scopes | Different keys for different integration contexts |
| Minimal exposure | Each key has the minimum required permissions |

## Key Architecture Decisions

1. Publishable key is intentionally client-safe — it only identifies the store context
2. VITE_ prefix convention ensures only intended variables are bundled for the client
3. HMAC webhook verification prevents request forgery for all inbound webhooks
4. Replit Secrets provides encrypted storage with access control
5. Each integration has its own webhook secret for independent rotation`
  },
  {
    id: 57213086,
    title: '19.4 Route Protection Patterns',
    versionMessage: 'Route protection patterns documentation',
    markdown: `# 19.4 Route Protection Patterns

**Source:** \`apps/storefront/src/components/auth/\`, \`apps/backend/src/api/middlewares.ts\`
**Frontend:** RoleGuard component | **Backend:** Middleware chain

Route protection is implemented at both the frontend (RoleGuard component) and backend (API middleware) levels. The frontend provides immediate UX feedback while the backend enforces security.

## Frontend Protection (RoleGuard)

| Feature | Implementation |
|---------|---------------|
| Component Wrapper | RoleGuard wraps protected route components |
| Weight Check | Compares user role weight against required minimum |
| Redirect | Unauthenticated users redirected to login |
| Forbidden | Authenticated but insufficient role shows forbidden page |
| Loading State | Shows skeleton while checking auth state |

## Backend Protection (Middleware)

| Middleware | Routes | Check |
|-----------|--------|-------|
| Store Auth | \`/store/*\` | Validates publishable key, optional customer JWT |
| Admin Auth | \`/admin/*\` | Validates admin bearer token |
| Vendor Auth | \`/vendor/*\` | Validates vendor JWT and extracts vendor_id |
| Platform Auth | \`/platform/*\` | Internal platform token validation |
| Webhook Auth | \`/api/webhooks/*\` | HMAC signature verification |

## Route Protection by Section

| Route Section | Required Weight | Protection Method |
|--------------|----------------|-------------------|
| Public store | 10 (guest) | No auth required, publishable key only |
| Product detail | 10 (guest) | No auth required |
| Cart/checkout | 20 (customer) | Customer JWT required |
| Account pages | 20 (customer) | RoleGuard + customer JWT |
| Vendor portal | 40 (vendor_staff) | RoleGuard + vendor JWT |
| Vendor settings | 50 (vendor_owner) | RoleGuard + vendor JWT |
| Manage pages | 50-90 (varies) | RoleGuard + admin token |
| Tenant management | 70 (tenant_admin) | RoleGuard + admin token |
| Platform admin | 90 (platform_admin) | RoleGuard + admin token |

## Granular Manage Page Access

| Module | Required Weight | Notes |
|--------|----------------|-------|
| Products | 50 | Vendor-level access |
| Orders | 50 | Vendor-level access |
| Commissions | 70 | Tenant admin only |
| Payouts | 70 | Tenant admin only |
| Governance | 90 | Platform admin only |
| Tenants | 90 | Platform admin only |
| Nodes | 80 | Tenant owner level |

## Protection Flow

| Step | Frontend | Backend |
|------|----------|---------|
| 1 | RoleGuard checks auth state | Middleware extracts auth header/cookie |
| 2 | Weight comparison | Token validation |
| 3 | Redirect if unauthorized | 401/403 response if unauthorized |
| 4 | Render protected content | Execute route handler |

## Key Architecture Decisions

1. Dual-layer protection (frontend + backend) ensures security even if frontend is bypassed
2. RoleGuard provides immediate UX feedback without waiting for API round-trip
3. Backend middleware is the security boundary — frontend protection is UX only
4. Weight-based system allows simple configuration per route without complex permission matrices
5. Webhook routes use HMAC verification instead of JWT for machine-to-machine auth`
  },
  {
    id: 55738625,
    title: '19.5 Vendor Authentication',
    versionMessage: 'Vendor authentication documentation',
    markdown: `# 19.5 Vendor Authentication

**Source:** \`apps/backend/src/api/vendor/\`, \`apps/storefront/src/components/vendor/\`
**Method:** Custom vendor JWT flow
**Roles:** vendor_owner (50), vendor_staff (40)

Vendor authentication uses a custom JWT flow separate from the customer and admin auth systems. This allows vendor-specific claims (vendor_id, role) to be included in the token for vendor portal access control.

## Vendor Auth Flow

| Step | Action |
|------|--------|
| 1 | Vendor navigates to vendor portal login |
| 2 | Credentials validated against vendor user records |
| 3 | JWT issued with vendor_id, user_id, and role claims |
| 4 | Token stored in httpOnly cookie |
| 5 | Vendor middleware extracts vendor context on each request |
| 6 | API routes use vendor_id for data scoping |

## Vendor JWT Claims

| Claim | Type | Description |
|-------|------|-------------|
| vendor_id | string | Associated vendor entity ID |
| user_id | string | Platform user ID |
| role | string | vendor_owner or vendor_staff |
| role_weight | number | 50 (owner) or 40 (staff) |
| tenant_id | string | Tenant context |
| exp | number | Token expiration timestamp |
| iat | number | Token issued-at timestamp |

## Role-Based Vendor Access

| Feature | vendor_owner (50) | vendor_staff (40) |
|---------|-------------------|-------------------|
| Dashboard | Full metrics | Limited metrics |
| Orders | View all, manage | View, fulfill |
| Products | Full CRUD | Create, edit |
| Analytics | Full access | Basic reports |
| Commissions | View all, dispute | View own |
| Payouts | Request, view all | View own |
| Settings | Full access | View only |
| Team | Add/remove staff | Not accessible |
| Financial Reports | Full access | Not accessible |
| Store Configuration | Full access | Not accessible |

## Vendor Portal Route Protection

| Route | Required Role | Description |
|-------|--------------|-------------|
| /vendor/dashboard | vendor_staff+ | Dashboard overview |
| /vendor/orders | vendor_staff+ | Order management |
| /vendor/products | vendor_staff+ | Product management |
| /vendor/analytics | vendor_staff+ | Basic analytics |
| /vendor/commissions | vendor_owner | Commission details |
| /vendor/payouts | vendor_owner | Payout management |
| /vendor/settings | vendor_owner | Vendor configuration |
| /vendor/team | vendor_owner | Staff management |
| /vendor/financial | vendor_owner | Financial reports |

## Vendor API Middleware

| Feature | Implementation |
|---------|---------------|
| Token Extraction | JWT extracted from httpOnly cookie on \`/vendor/*\` routes |
| Vendor Context | vendor_id injected into request context |
| Data Scoping | All queries automatically filtered by vendor_id |
| Error Response | 401 for missing/invalid token, 403 for insufficient role |

## Key Architecture Decisions

1. Separate vendor JWT flow because Medusa doesn't natively support vendor actors
2. vendor_id in JWT claims eliminates per-request vendor lookup
3. Two vendor roles (owner/staff) provide appropriate granularity for small vendor teams
4. Data scoping at middleware level prevents cross-vendor data access
5. Same httpOnly cookie pattern as customer auth for consistent security posture`
  },

  // ===== SECTION 20: Deployment & DevOps =====
  {
    id: 56262992,
    title: '20.1 Development Setup',
    versionMessage: 'Development setup documentation',
    markdown: `# 20.1 Development Setup

**Source:** \`start.sh\`, \`turbo.json\`, \`package.json\`
**Backend Port:** 9000 | **Storefront Port:** 5000
**Database:** Replit PostgreSQL (DATABASE_URL)

The development environment uses a single \`start.sh\` script to launch both the Medusa backend and TanStack Start storefront. The project uses Replit's managed PostgreSQL database directly, requiring no local database setup.

## Start Script (start.sh)

| Step | Action |
|------|--------|
| 1 | Set environment variables (NODE_ENV=development) |
| 2 | Start Medusa backend on port 9000 (background) |
| 3 | Wait for backend health check at :9000/health |
| 4 | Start storefront dev server on port 5000 |
| 5 | Storefront proxies API requests to backend |

## Development Architecture

| Component | Port | Description |
|-----------|------|-------------|
| Medusa Backend | 9000 | API server with 61 modules, 489 routes |
| Storefront Dev | 5000 | TanStack Start with HMR and SSR |
| PostgreSQL | Auto | Replit-managed (DATABASE_URL) |

## Turborepo Configuration

| Command | Scope | Description |
|---------|-------|-------------|
| \`turbo dev\` | All workspaces | Start all apps in development mode |
| \`turbo build\` | All workspaces | Production build of all apps |
| \`turbo lint\` | All workspaces | Lint all packages |

## Environment Requirements

| Variable | Source | Purpose |
|----------|--------|---------|
| DATABASE_URL | Replit auto | PostgreSQL connection string |
| VITE_MEDUSA_PUBLISHABLE_KEY | Replit secrets | Store API identification |
| NODE_ENV | start.sh | development or production |

## Database Setup

| Feature | Implementation |
|---------|---------------|
| Provider | Replit Managed PostgreSQL (Neon) |
| Connection | DATABASE_URL environment variable (auto-configured) |
| Migrations | Run automatically on Medusa startup |
| Seeding | Manual via \`npx medusa exec ./src/scripts/seed-master.ts\` |

## Key Development Practices

1. No local PostgreSQL required — Replit DATABASE_URL connects directly to managed database
2. Backend must be healthy before storefront starts (health check dependency)
3. HMR enabled for storefront development (instant feedback on changes)
4. Medusa watches for file changes and restarts automatically in development
5. Turborepo caches build artifacts to speed up subsequent builds`
  },
  {
    id: 57606343,
    title: '20.2 Production Build',
    versionMessage: 'Production build documentation',
    markdown: `# 20.2 Production Build

**Source:** \`build-production.sh\`
**Backend Output:** \`apps/backend/dist/\`
**Storefront Output:** \`apps/storefront/.output/\` (Nitro SSR)

The production build process uses Turborepo to compile the backend and storefront in parallel, followed by output verification checks to ensure the build completed successfully.

## Build Script (build-production.sh)

| Step | Action |
|------|--------|
| 1 | Set NODE_ENV=production |
| 2 | Set --max-old-space-size=1024 for Medusa build |
| 3 | Run \`turbo build\` for all workspaces |
| 4 | Verify backend dist/ directory exists |
| 5 | Verify storefront .output/ directory exists |
| 6 | Report build success or failure with exit code |

## Build Outputs

| App | Output Directory | Build Tool | Description |
|-----|-----------------|-----------|-------------|
| Backend | \`apps/backend/dist/\` | TypeScript compiler | Compiled Medusa server |
| Storefront | \`apps/storefront/.output/\` | Nitro (Vite) | SSR-ready storefront bundle |
| Contracts | \`packages/cityos-contracts/dist/\` | TypeScript compiler | Shared type definitions |
| Design Tokens | \`packages/cityos-design-tokens/dist/\` | Build script | Token output files |

## Memory Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| --max-old-space-size | 1024 MB | Medusa's 61 modules require significant memory during compilation |
| Node heap limit | 1024 MB | Prevents OOM during TypeScript compilation of large module set |

## Output Verification

| Check | Expected | Exit Code |
|-------|----------|-----------|
| Backend dist/ exists | Directory with compiled JS | 0 on success, 1 on failure |
| Storefront .output/ exists | Nitro SSR bundle | 0 on success, 1 on failure |
| TypeScript errors | Zero compilation errors | Non-zero on errors |

## Build Pipeline

| Phase | Duration (approx) | Description |
|-------|-------------------|-------------|
| TypeScript compilation | 60-90s | Compile all .ts files to .js |
| Vite bundling | 30-45s | Bundle storefront with tree-shaking |
| Nitro SSR build | 15-20s | Generate SSR server bundle |
| Verification | <1s | Check output directories exist |

## Key Architecture Decisions

1. Turborepo parallelizes backend and storefront builds for faster CI
2. Output verification ensures build artifacts exist before deployment
3. Memory limit (1024 MB) accommodates Medusa's large module compilation
4. Nitro SSR output enables server-side rendering in production
5. Exit codes enable CI/CD pipeline integration for automated deployment`
  },
  {
    id: 57082035,
    title: '20.3 Production Architecture',
    versionMessage: 'Production architecture with health responder pattern',
    markdown: `# 20.3 Production Architecture

**Source:** \`run-production.sh\`, \`health-responder.js\`, \`prod-proxy.js\`
**Pattern:** Health responder -> Medusa boot -> Proxy takeover

The production architecture uses a health responder pattern to satisfy Replit's health check requirements while Medusa boots (up to 4 minutes for 60+ modules). A lightweight HTTP server binds port 5000 immediately, Medusa boots on port 9000 in the background, then the production proxy takes over port 5000.

## Boot Sequence

| Phase | Duration | Port 5000 | Port 9000 | Port 5173 |
|-------|----------|-----------|-----------|-----------|
| 1. Health Responder | Immediate | health-responder.js (200 OK) | Not started | Not started |
| 2. Medusa Boot | 3-5 minutes | health-responder.js | Medusa starting | Not started |
| 3. Medusa Ready | After health check passes | health-responder.js | Medusa ready | Not started |
| 4. Storefront Start | ~10 seconds | health-responder.js | Medusa ready | Storefront starting |
| 5. Proxy Takeover | After storefront ready | prod-proxy.js | Medusa ready | Storefront ready |

## Health Responder (health-responder.js)

| Feature | Implementation |
|---------|---------------|
| Purpose | Bind port 5000 immediately to pass Replit health check |
| Response | HTTP 200 with "Starting..." message |
| Lifetime | Killed when prod-proxy.js is ready to take over |
| Weight | Minimal — simple HTTP server with no dependencies |

## Production Proxy (prod-proxy.js on port 5000)

| Request Pattern | Destination | Description |
|----------------|-------------|-------------|
| /api/* | localhost:9000 | Backend API routes |
| /admin/* | localhost:9000 | Medusa admin dashboard |
| /health | localhost:9000 | Health check endpoint |
| Everything else | localhost:5173 | Storefront SSR pages |

## Process Architecture

| Process | Role | Port |
|---------|------|------|
| health-responder.js | Initial health check responder | 5000 (temporary) |
| Medusa server | Backend API and admin | 9000 |
| Storefront (Nitro) | SSR storefront | 5173 |
| prod-proxy.js | Production reverse proxy | 5000 (permanent) |

## Why This Pattern?

| Problem | Solution |
|---------|----------|
| Medusa takes 3-5 minutes to initialize 60+ modules | Health responder binds immediately |
| Replit health check expects port 5000 within seconds | Health responder returns 200 OK |
| Need to route API and storefront on same port | prod-proxy.js multiplexes based on path |
| Storefront needs backend to be ready first | Sequential boot with health checks |

## Key Architecture Decisions

1. Health responder pattern solves the cold start problem for Medusa's slow initialization
2. Port 5000 is shared between health responder and prod-proxy (sequential handoff)
3. Medusa on port 9000 is never directly exposed — always behind proxy
4. Storefront on port 5173 is internal — prod-proxy handles all external traffic
5. Sequential boot ensures dependencies are ready before dependent services start`
  },
  {
    id: 56230142,
    title: '20.4 VM Deployment Strategy',
    versionMessage: 'VM deployment strategy documentation',
    markdown: `# 20.4 VM Deployment Strategy

**Deployment Target:** VM (always-running)
**Reason:** Medusa 60+ module initialization incompatible with autoscale cold starts

The platform uses Replit's VM deployment target instead of autoscale because Medusa's initialization of 60+ modules takes 3-5 minutes, which is incompatible with autoscale's requirement for fast cold starts.

## Deployment Comparison

| Feature | VM (Chosen) | Autoscale (Rejected) |
|---------|-------------|---------------------|
| Boot Time | 3-5 minutes (acceptable) | Must be <30 seconds (too slow) |
| Always Running | Yes | No (scales to zero) |
| Cold Starts | One-time on deploy | Every request after idle |
| Cost Model | Fixed monthly cost | Pay per request |
| State | Can maintain in-memory state | Stateless required |
| Suitability | Stateful apps, slow boot | Fast-starting stateless apps |

## Why Medusa Needs VM

| Factor | Details |
|--------|---------|
| Module Count | 61 custom modules require sequential initialization |
| Migration Check | 203 migrations verified on startup |
| Database Connections | Connection pool established for all modules |
| ORM Metadata | MikroORM entity metadata compiled on boot |
| Integration Init | Stripe, Temporal, ERPNext clients initialized |
| Total Boot Time | 3-5 minutes consistently |

## VM Configuration

| Setting | Value |
|---------|-------|
| Target | VM (always-running) |
| Build Command | \`bash build-production.sh\` |
| Run Command | \`bash run-production.sh\` |
| Health Check | Port 5000 (health-responder.js -> prod-proxy.js) |
| Memory | Sufficient for Node.js with --max-old-space-size=1024 |

## Cost-Benefit Analysis

| Consideration | Assessment |
|--------------|------------|
| Uptime | VM is always running — no cold start latency for users |
| Resource Usage | Fixed allocation, predictable costs |
| Boot Recovery | Auto-restart on crash, health responder covers boot period |
| Scaling | Single instance handles expected traffic volume |

## Key Architecture Decisions

1. VM chosen because 3-5 minute boot time makes autoscale impractical (users would wait minutes)
2. Health responder pattern mitigates the long boot time during deployments
3. Always-running VM eliminates cold start latency for all requests
4. Single instance is sufficient for current traffic with Medusa's built-in request handling
5. Future scaling would use load balancer with multiple VM instances rather than autoscale`
  },
  {
    id: 57409753,
    title: '20.5 Production Proxy',
    versionMessage: 'Production proxy documentation',
    markdown: `# 20.5 Production Proxy

**Source:** \`prod-proxy.js\`
**Port:** 5000 (external-facing)
**Backends:** Medusa (:9000), Storefront (:5173)

The production proxy runs on port 5000 and routes incoming requests to either the Medusa backend or the storefront based on URL path patterns. It handles health checks, CORS headers, and request logging.

## Routing Rules

| Path Pattern | Destination | Port | Description |
|-------------|-------------|------|-------------|
| /api/* | Medusa backend | 9000 | Custom API routes |
| /admin/* | Medusa backend | 9000 | Admin dashboard and API |
| /health | Medusa backend | 9000 | Health check endpoint |
| /store/* | Medusa backend | 9000 | Store API endpoints |
| /* (everything else) | Storefront | 5173 | SSR pages and static assets |

## Proxy Features

| Feature | Implementation |
|---------|---------------|
| Path-based routing | Regex matching on request URL |
| Health checks | Forwards /health to Medusa and returns response |
| CORS headers | Adds appropriate CORS headers for cross-origin requests |
| Request logging | Logs request method, path, status, and duration |
| Error handling | Returns 502 if backend/storefront is unreachable |
| Header forwarding | Passes through all request headers to backends |

## Health Check Handling

| Check | Behavior |
|-------|----------|
| /health request | Proxied to Medusa :9000/health |
| Backend healthy | Returns Medusa health response (200) |
| Backend unhealthy | Returns 503 Service Unavailable |
| Used by | Replit deployment health monitoring |

## CORS Configuration

| Header | Value |
|--------|-------|
| Access-Control-Allow-Origin | Request origin (dynamic) |
| Access-Control-Allow-Methods | GET, POST, PUT, DELETE, OPTIONS, PATCH |
| Access-Control-Allow-Headers | Content-Type, Authorization, x-publishable-api-key |
| Access-Control-Allow-Credentials | true |

## Request Logging

| Field | Description |
|-------|-------------|
| Timestamp | ISO 8601 request timestamp |
| Method | HTTP method (GET, POST, etc.) |
| Path | Request URL path |
| Status | Response status code |
| Duration | Request processing time in ms |
| Target | Backend destination (medusa or storefront) |

## Key Architecture Decisions

1. Single port (5000) simplifies Replit deployment configuration
2. Path-based routing eliminates need for subdomain configuration
3. All API paths (/api/*, /admin/*, /store/*) route to Medusa backend
4. Everything else routes to storefront for SSR page serving
5. CORS headers at proxy level ensure consistent cross-origin behavior`
  },
  {
    id: 55935138,
    title: '20.6 Environment Variables',
    versionMessage: 'Environment variables reference documentation',
    markdown: `# 20.6 Environment Variables

**Source:** Replit Secrets, \`.env\` files, \`medusa-config.ts\`

Complete reference of all environment variables used by the Dakkah CityOS Commerce platform.

## Core Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string (Replit-managed) |
| NODE_ENV | Yes | development or production |
| VITE_MEDUSA_PUBLISHABLE_KEY | Yes | Store API publishable key |
| MEDUSA_ADMIN_ONBOARDING_TYPE | No | Admin onboarding flow type |

## Stripe Integration

| Variable | Required | Description |
|----------|----------|-------------|
| STRIPE_API_KEY | Conditional | Stripe secret API key |
| STRIPE_WEBHOOK_SECRET | Conditional | Stripe webhook signature secret |

## Temporal Cloud

| Variable | Required | Description |
|----------|----------|-------------|
| TEMPORAL_API_KEY | Conditional | Temporal Cloud API authentication key |
| TEMPORAL_ADDRESS | Conditional | Temporal Cloud gRPC address |
| TEMPORAL_NAMESPACE | Conditional | Temporal Cloud namespace |

## ERPNext Integration

| Variable | Required | Description |
|----------|----------|-------------|
| ERPNEXT_URL | Conditional | ERPNext instance URL |
| ERPNEXT_API_KEY | Conditional | ERPNext API key |
| ERPNEXT_API_SECRET | Conditional | ERPNext API secret |
| ERPNEXT_WEBHOOK_SECRET | Conditional | ERPNext webhook signature secret |

## Fleetbase Integration

| Variable | Required | Description |
|----------|----------|-------------|
| FLEETBASE_URL | Conditional | Fleetbase instance URL |
| FLEETBASE_API_KEY | Conditional | Fleetbase API key |
| FLEETBASE_WEBHOOK_SECRET | Conditional | Fleetbase webhook signature secret |

## Payload CMS Integration

| Variable | Required | Description |
|----------|----------|-------------|
| PAYLOAD_URL | Conditional | Payload CMS instance URL |
| PAYLOAD_API_KEY | Conditional | Payload CMS API key |
| PAYLOAD_WEBHOOK_SECRET | Conditional | Payload CMS webhook signature secret |

## Object Storage

| Variable | Required | Description |
|----------|----------|-------------|
| REPLIT_OBJECT_STORAGE_BUCKET | Auto | Object storage bucket name |

## Security Variables

| Variable | Required | Description |
|----------|----------|-------------|
| COOKIE_SECRET | Yes | Session cookie encryption key |
| JWT_SECRET | Yes | JWT token signing secret |

## Variable Categories

| Category | Count | Description |
|----------|-------|-------------|
| Core | 4 | Database, environment, keys |
| Stripe | 2 | Payment processing |
| Temporal | 3 | Workflow orchestration |
| ERPNext | 4 | ERP integration |
| Fleetbase | 3 | Fleet/delivery integration |
| Payload CMS | 3 | CMS integration |
| Object Storage | 1 | Media storage |
| Security | 2 | Encryption and signing |

## Key Architecture Decisions

1. Replit Secrets for all sensitive values (encrypted at rest)
2. VITE_ prefix convention ensures only intended variables reach client bundle
3. Conditional variables allow integrations to be disabled when not configured
4. DATABASE_URL auto-provided by Replit PostgreSQL service
5. Webhook secrets are per-integration for independent rotation`
  },
  {
    id: 57606362,
    title: '20.7 Monorepo Structure',
    versionMessage: 'Monorepo structure documentation',
    markdown: `# 20.7 Monorepo Structure

**Source:** \`turbo.json\`, \`pnpm-workspace.yaml\`, root \`package.json\`
**Build Tool:** Turborepo
**Package Manager:** pnpm (workspaces)

The project is organized as a monorepo using Turborepo for build orchestration and pnpm workspaces for dependency management. This enables shared code between the backend and storefront while maintaining independent build and deployment configurations.

## Workspace Layout

| Workspace | Path | Description |
|-----------|------|-------------|
| Backend | \`apps/backend/\` | Medusa v2 with 61 custom modules |
| Storefront | \`apps/storefront/\` | TanStack Start + React SSR |
| Orchestrator | \`apps/orchestrator/\` | Payload CMS + Temporal orchestration |
| Contracts | \`packages/cityos-contracts/\` | Shared TypeScript type definitions |
| Design Tokens | \`packages/cityos-design-tokens/\` | Design token definitions |
| Design System | \`packages/cityos-design-system/\` | CSS generator and utilities |
| Design Runtime | \`packages/cityos-design-runtime/\` | Runtime token resolution |

## Turborepo Pipeline

| Task | Dependencies | Cache |
|------|-------------|-------|
| build | ^build | Yes |
| dev | ^build | No |
| lint | - | Yes |
| test | ^build | Yes |

## pnpm Workspace Configuration

| Feature | Implementation |
|---------|---------------|
| Workspace Protocol | \`workspace:*\` for internal package references |
| Hoisting | Shared dependencies hoisted to root |
| Overrides | Security patches in root package.json |
| Lock File | Single pnpm-lock.yaml at root |

## Shared Packages

| Package | Used By | Content |
|---------|---------|---------|
| cityos-contracts | Backend, Storefront | TypeScript interfaces, enums, constants |
| cityos-design-tokens | Storefront, Design System | Color, spacing, typography tokens |
| cityos-design-system | Storefront | CSS utilities and component styles |
| cityos-design-runtime | Storefront | Runtime theme switching |

## Dependency Management

| Scope | Strategy |
|-------|----------|
| Shared dependencies | Hoisted to root node_modules |
| App-specific deps | In respective app package.json |
| Internal packages | workspace:* protocol |
| Security overrides | Root package.json overrides |

## Key Architecture Decisions

1. Turborepo provides incremental builds with caching for faster CI
2. pnpm workspaces enable code sharing without publishing packages
3. Shared contracts package ensures type safety between backend and storefront
4. Design tokens in separate package allow sharing across future applications
5. Single lock file at root ensures consistent dependency versions`
  },
  {
    id: 57016581,
    title: '20.8 Object Storage',
    versionMessage: 'Object storage documentation',
    markdown: `# 20.8 Object Storage

**Provider:** Replit Object Storage
**Bucket:** replit-objstore-9ae4a2f3-0592-42b1-908d-b04c0c0e79c4
**Serve Endpoint:** GET /platform/storage/serve?path=...

All media files (product images, vendor logos, category images) are stored in Replit Object Storage and served through a platform API endpoint.

## Storage Architecture

| Component | Purpose |
|-----------|---------|
| Replit Object Storage | S3-compatible blob storage |
| Upload Endpoint | \`POST /platform/storage/upload-buffer\` |
| Serve Endpoint | \`GET /platform/storage/serve?path=...\` |
| JavaScript SDK | \`@replit/object-storage\` npm package |

## Bucket Structure

| Directory | Purpose | Access |
|-----------|---------|--------|
| public/ | Product images, category images | Public read |
| .private/ | User uploads, internal files | Authenticated read |
| products/ | Product media assets | Public read |
| vendors/ | Vendor logos and branding | Public read |
| verticals/ | Vertical-specific images | Public read |
| seed/ | Seed data images | Internal |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /platform/storage/serve?path=... | Serve a file from object storage |
| POST | /platform/storage/upload-buffer | Upload a file to object storage |

## SDK Usage

| Feature | Implementation |
|---------|---------------|
| Package | \`@replit/object-storage\` |
| Client | Initialized with bucket name from environment |
| Upload | \`client.uploadFromBuffer(path, buffer, contentType)\` |
| Download | \`client.downloadAsBuffer(path)\` |
| Delete | \`client.delete(path)\` |
| List | \`client.list(prefix)\` |

## Image Serving

| Feature | Implementation |
|---------|---------------|
| URL Pattern | \`/platform/storage/serve?path=products/image.jpg\` |
| Content Type | Auto-detected from file extension |
| Caching | Cache-Control headers for browser caching |
| Fallback | Placeholder image if file not found |

## Seed Data Images

| Category | Count | Description |
|----------|-------|-------------|
| Product images | ~100 | Generated product photography |
| Vertical images | ~27 | One hero image per vertical |
| Category images | ~20 | Category header images |
| Vendor logos | ~10 | Sample vendor branding |

## Key Architecture Decisions

1. Replit Object Storage chosen for native integration and zero configuration
2. Platform API endpoint serves files instead of direct bucket URLs for access control
3. Upload-buffer endpoint handles server-side file uploads without client direct access
4. Public/private directory split enables access control at the storage level
5. All seed images stored in object storage (zero external image dependencies)`
  },
  {
    id: 56099016,
    title: '20.9 Build Verification and CI',
    versionMessage: 'Build verification and CI documentation',
    markdown: `# 20.9 Build Verification and CI

**Source:** \`build-production.sh\`
**Checks:** Output directory verification, TypeScript compilation, exit codes

The build verification process ensures production builds complete successfully before deployment. The build script includes output verification checks and returns appropriate exit codes for CI/CD pipeline integration.

## Verification Checks

| Check | Expected Result | Failure Action |
|-------|----------------|----------------|
| Backend dist/ exists | Directory with compiled JS files | Exit code 1 |
| Storefront .output/ exists | Nitro SSR bundle directory | Exit code 1 |
| TypeScript compilation | Zero errors | Non-zero exit code |
| Build script exit | Exit code 0 | Deployment blocked |

## Build Script Flow

| Step | Action | On Failure |
|------|--------|-----------|
| 1 | Set NODE_ENV=production | N/A |
| 2 | Set --max-old-space-size=1024 | N/A |
| 3 | Run turbo build | Exit with error code |
| 4 | Check apps/backend/dist/ exists | Exit 1 with error message |
| 5 | Check apps/storefront/.output/ exists | Exit 1 with error message |
| 6 | Report success | Exit 0 |

## Memory Management

| Setting | Value | Purpose |
|---------|-------|---------|
| --max-old-space-size | 1024 MB | Prevent OOM during Medusa module compilation |
| Node heap limit | 1024 MB | Accommodate 61 module TypeScript compilation |

## CI Integration

| Feature | Implementation |
|---------|---------------|
| Exit Codes | 0 = success, 1 = build failure |
| Error Messages | Descriptive messages for each failure type |
| Build Artifacts | dist/ and .output/ directories |
| Reproducibility | pnpm-lock.yaml ensures consistent dependency resolution |

## Pre-Deployment Checklist

| Check | Method | Automated |
|-------|--------|-----------|
| TypeScript compiles | turbo build | Yes |
| Backend output exists | File system check | Yes |
| Storefront output exists | File system check | Yes |
| Migrations valid | Medusa startup check | Yes (on deploy) |
| Environment variables set | Replit Secrets | Manual |

## Known Build Considerations

| Issue | Mitigation |
|-------|-----------|
| Memory pressure | --max-old-space-size=1024 flag |
| Long build times (2-3 min) | Turborepo caching for incremental builds |
| 61 module compilation | Parallel compilation via Turborepo |
| Large dependency tree | pnpm deduplication and hoisting |

## Key Architecture Decisions

1. Output verification prevents deploying incomplete builds
2. Exit codes enable automated CI/CD pipeline integration
3. Memory limit explicitly set to prevent OOM on resource-constrained environments
4. Turborepo caching reduces rebuild times for unchanged packages
5. Single build script encapsulates all build and verification logic`
  },

  // ===== SECTION 21: Testing & Quality =====
  {
    id: 57475248,
    title: '21.1 Testing Strategy',
    versionMessage: 'Testing strategy documentation',
    markdown: `# 21.1 Testing Strategy

**Approach:** Multi-layer verification
**Layers:** TypeScript compilation, migration integrity, seed verification, API coverage, integration contracts

The testing strategy uses multiple verification layers rather than traditional unit/integration test suites. Each layer validates a different aspect of system correctness, from type safety to database integrity to API route coverage.

## Testing Layers

| Layer | What It Validates | How |
|-------|------------------|-----|
| TypeScript Compilation | Type safety across all code | \`tsc --noEmit\` strict mode |
| Migration Integrity | Database schema correctness | 203 migrations applied successfully |
| Seed Verification | Data model completeness | Seed scripts populate all entity types |
| API Route Coverage | All routes are accessible | 489 routes registered and responding |
| Integration Contracts | External API compatibility | Contract specifications validated |

## TypeScript Compilation

| Metric | Value |
|--------|-------|
| Strict Mode | Enabled |
| Files Checked | All .ts files across monorepo |
| Errors Fixed | 132 compilation errors resolved |
| Path Aliases | Configured in tsconfig.json |
| Shared Types | cityos-contracts package |

## Migration Integrity

| Metric | Value |
|--------|-------|
| Total Migrations | 203 |
| Modules with Migrations | 61 |
| Migration Runner | MikroORM migration system |
| Verification | All migrations apply without errors on clean database |

## Seed Data Verification

| Seed Script | Scope | Entities |
|------------|-------|----------|
| seed-master.ts | Core commerce | Products, categories, customers, regions |
| seed-verticals.ts | 27 verticals | Vertical-specific entities |
| seed-all-with-images.ts | Full orchestration | All entities with media assets |

## API Route Coverage

| Namespace | Routes | Verification |
|-----------|--------|-------------|
| Admin | 237 | Route registration confirmed |
| Store | 163 | Route registration confirmed |
| Vendor | 68 | Route registration confirmed |
| Platform | 16 | Route registration confirmed |
| Webhooks | 4 | Route registration confirmed |
| Health | 1 | Health check endpoint |

## Integration Contract Validation

| Integration | Contract | Validation |
|------------|----------|-----------|
| Stripe | Payment and webhook schemas | Webhook signature verification |
| ERPNext | Sync data schemas | Contract specification tests |
| Fleetbase | Delivery data schemas | Contract specification tests |
| Payload CMS | Content sync schemas | Contract specification tests |

## Key Architecture Decisions

1. Multi-layer approach catches different error categories at appropriate levels
2. TypeScript strict mode provides compile-time type safety across the entire codebase
3. Migration integrity testing ensures database schema is always valid
4. Seed verification confirms all data models can be populated successfully
5. API route coverage ensures no orphaned or broken route registrations`
  },
  {
    id: 56819860,
    title: '21.2 TypeScript Compilation',
    versionMessage: 'TypeScript compilation documentation',
    markdown: `# 21.2 TypeScript Compilation

**Source:** \`tsconfig.json\` files across monorepo
**Mode:** Strict
**Shared Types:** \`packages/cityos-contracts/\`

Strict TypeScript compilation is enforced across the entire monorepo. The shared contracts package provides type definitions that ensure type safety between the backend and storefront applications.

## TypeScript Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| strict | true | Enable all strict type checks |
| noEmit | true (for type checking) | Type check without emitting files |
| paths | Configured | Module path aliases |
| moduleResolution | bundler | Modern module resolution |
| target | ES2022 | Modern JavaScript output |
| jsx | react-jsx | React JSX transform |

## Path Aliases

| Alias | Path | Used In |
|-------|------|---------|
| @backend/* | apps/backend/src/* | Backend imports |
| @storefront/* | apps/storefront/src/* | Storefront imports |
| @contracts/* | packages/cityos-contracts/src/* | Shared type imports |

## Compilation Error Resolution

| Category | Count Fixed | Example |
|----------|------------|---------|
| Missing type annotations | 45 | Function parameters, return types |
| Null/undefined checks | 32 | Optional chaining, null guards |
| Import mismatches | 25 | Incorrect module paths |
| Interface mismatches | 18 | Property type disagreements |
| Generic type issues | 12 | Missing generic parameters |
| Total | 132 | Across 40+ files |

## Shared Contracts Package

| Export | Description |
|--------|-------------|
| Module interfaces | TypeScript interfaces for all 61 module entities |
| API types | Request/response types for API routes |
| Enum definitions | Shared enums (status, types, categories) |
| Constants | Shared constants (role weights, limits) |

## Type Safety Benefits

| Benefit | Description |
|---------|-------------|
| Compile-time errors | Catch type mismatches before runtime |
| IDE support | Autocomplete and inline documentation |
| Refactoring safety | Rename/change types across codebase safely |
| API contracts | Frontend and backend agree on data shapes |
| Documentation | Types serve as living documentation |

## Key Architecture Decisions

1. Strict mode enabled for maximum type safety across the entire project
2. Shared contracts package prevents frontend/backend type drift
3. Path aliases simplify imports and make code more readable
4. All 132 compilation errors fixed to achieve zero-error baseline
5. Modern target (ES2022) enables use of latest JavaScript features`
  },
  {
    id: 55738644,
    title: '21.3 Code Quality Standards',
    versionMessage: 'Code quality standards documentation',
    markdown: `# 21.3 Code Quality Standards

**Source:** \`apps/backend/src/\` (all custom code)
**Pattern:** Official Medusa v2 extension patterns only
**Logging:** \`createLogger()\` | **Error Handling:** \`handleApiError()\`

All custom code resides in \`apps/backend/src/\`, cleanly separated from Medusa's node_modules. The project follows official Medusa v2 extension patterns exclusively — no patches, forks, or monkey-patches.

## Code Organization

| Directory | Content | Rule |
|-----------|---------|------|
| \`src/modules/\` | 61 custom modules | Follow Medusa module pattern |
| \`src/api/\` | 489 API routes | Follow Medusa route conventions |
| \`src/subscribers/\` | 38 event subscribers | Follow Medusa subscriber pattern |
| \`src/workflows/\` | 23 workflows | Follow Medusa workflow pattern |
| \`src/links/\` | 38 module links | Follow Medusa defineLink pattern |
| \`src/lib/\` | Shared utilities | Custom helpers and integrations |
| \`src/scripts/\` | 42 seed scripts | Medusa exec compatible |

## Extension Patterns

| Pattern | Description | Anti-Pattern |
|---------|-------------|-------------|
| Custom Module | MikroORM entities + service + index.ts | Modifying core Medusa modules |
| API Route | File-based route handlers | Patching core route files |
| Subscriber | Event listener with handler function | Overriding core subscribers |
| Workflow | Step-based workflow definition | Replacing core workflows |
| Module Link | defineLink between module entities | Direct foreign keys to core tables |

## Structured Logging

| Feature | Implementation |
|---------|---------------|
| Logger Factory | \`createLogger(module)\` returns scoped logger |
| Log Levels | error, warn, info, debug |
| Context | Module name, request ID, operation |
| Format | Structured JSON in production, readable in development |

## Error Handling

| Feature | Implementation |
|---------|---------------|
| API Errors | \`handleApiError(error, res)\` provides consistent error responses |
| Error Format | \`{ message, code, details }\` JSON response |
| HTTP Status | Appropriate status codes (400, 401, 403, 404, 500) |
| Logging | Errors automatically logged with stack trace |

## Code Quality Rules

| Rule | Enforcement |
|------|------------|
| No direct Medusa patches | Code review |
| All code in src/ | Directory structure convention |
| TypeScript strict mode | tsconfig.json |
| Structured logging | createLogger() usage |
| Consistent error handling | handleApiError() usage |
| Module isolation | Each module self-contained |

## Key Architecture Decisions

1. All custom code in src/ ensures clean separation from framework code
2. Official extension patterns only — no patches means safe Medusa version upgrades
3. Structured logging with createLogger() provides consistent observability
4. Centralized error handling via handleApiError() ensures uniform API error responses
5. Module isolation means each of the 61 modules can be understood independently`
  },
  {
    id: 57245953,
    title: '21.4 Database Integrity',
    versionMessage: 'Database integrity documentation',
    markdown: `# 21.4 Database Integrity

**Migrations:** 203 successfully applied
**ORM:** MikroORM with PostgreSQL
**Constraints:** Enum CHECK, foreign keys, JSONB validation

Database integrity is maintained through migration verification, enum CHECK constraints, foreign key relationships, and JSONB field validation across all 61 custom modules.

## Migration Status

| Metric | Value |
|--------|-------|
| Total Migrations | 203 |
| Modules with Migrations | 61 |
| Migration Status | All applied successfully |
| Migration Runner | MikroORM migration system |
| Rollback Support | Down migrations defined |

## Enum CHECK Constraints

| Module | Field | Valid Values |
|--------|-------|-------------|
| Vendor | status | pending, active, suspended, rejected |
| Booking | status | pending, confirmed, in_progress, completed, cancelled, no_show |
| Quote | status | draft, submitted, under_review, approved, rejected, accepted, declined, expired |
| Dispute | status | open, investigating, resolved, closed, escalated |
| Payout | status | pending, processing, completed, failed, on_hold |

## Foreign Key Integrity

| Relationship | From | To | Type |
|-------------|------|-----|------|
| Vendor -> Product | vendor_product | vendor, product | Many-to-Many junction |
| Booking -> Service | booking | service_product | Many-to-One |
| Commission -> Vendor | commission_transaction | vendor | Many-to-One |
| Node -> Parent | node | node (self) | Self-referential |
| Persona -> Customer | persona | customer | Many-to-One |

## JSONB Field Patterns

| Usage | Fields | Validation |
|-------|--------|-----------|
| Metadata | metadata (all modules) | Optional, arbitrary JSON |
| Configuration | config, settings, policies | Schema-validated at application level |
| Arrays | photos, documents, tags | Array of typed objects |
| Nested Objects | address, location, coverage | Structured nested data |

## Known Issues

| Issue | Module | Description | Mitigation |
|-------|--------|-------------|-----------|
| tier_config caching | Loyalty | ORM metadata caching issue on re-seed | Restart server after re-seeding loyalty program data |

## Integrity Verification

| Check | Method | Frequency |
|-------|--------|-----------|
| Migration apply | Medusa startup | Every server start |
| Enum validation | CHECK constraints | Every insert/update |
| FK integrity | PostgreSQL constraints | Every insert/update |
| JSONB validation | Application layer | On data write |

## Key Architecture Decisions

1. MikroORM migrations provide versioned, reversible schema changes
2. Enum CHECK constraints enforce valid values at the database level
3. Foreign keys maintain referential integrity across module boundaries
4. JSONB fields provide flexibility for metadata while typed fields enforce structure
5. Known ORM caching issue documented for operational awareness`
  },
  {
    id: 56459487,
    title: '21.5 Dependency Security',
    versionMessage: 'Dependency security documentation',
    markdown: `# 21.5 Dependency Security

**Source:** Root \`package.json\` (pnpm overrides)
**Practice:** Regular audits, HMAC webhook verification, no secrets in code

Dependency security is managed through pnpm overrides for vulnerable packages, regular security audits, and strict coding practices that prevent secret exposure.

## pnpm Overrides

| Package | Override Reason |
|---------|----------------|
| Vulnerable transitive dependencies | Pinned to patched versions in root package.json |
| Known CVEs | Overridden to fixed versions |
| Deprecated packages | Replaced with maintained alternatives |

## Security Practices

| Practice | Implementation |
|----------|---------------|
| No secrets in code | All secrets in Replit Secrets (environment variables) |
| HMAC webhook verification | All 4 webhook endpoints verify signatures |
| httpOnly cookies | JWT tokens not accessible to JavaScript |
| CORS configuration | Strict origin checking in production |
| Input validation | Request validation on all API routes |
| SQL injection prevention | MikroORM parameterized queries |

## Webhook Security

| Endpoint | Verification Method |
|----------|-------------------|
| /api/webhooks/stripe | Stripe-Signature header with HMAC-SHA256 |
| /api/webhooks/erpnext | HMAC signature verification |
| /api/webhooks/fleetbase | HMAC signature verification |
| /api/webhooks/payload-cms | HMAC signature verification |

## TypeScript Security Benefits

| Benefit | Description |
|---------|-------------|
| Type safety | Prevents type confusion vulnerabilities |
| Null checks | Strict null checks prevent null pointer errors |
| Import validation | Only valid module imports compile |
| API contracts | Type-checked request/response prevents data leaks |

## Dependency Audit Process

| Step | Action |
|------|--------|
| 1 | Run pnpm audit to identify vulnerabilities |
| 2 | Evaluate severity and exploitability |
| 3 | Add pnpm overrides for affected packages |
| 4 | Verify overrides resolve the vulnerability |
| 5 | Test application functionality after override |

## Error Resolution

| Category | Count | Description |
|----------|-------|-------------|
| TypeScript errors fixed | 132 | Type safety improvements across 40+ files |
| Security overrides | Multiple | pnpm overrides for vulnerable packages |
| Deprecated replacements | As needed | Deprecated packages replaced |

## Key Architecture Decisions

1. pnpm overrides in root package.json patch vulnerabilities without forking packages
2. HMAC verification on all webhook endpoints prevents request forgery
3. Strict TypeScript catches potential security issues at compile time
4. MikroORM parameterized queries prevent SQL injection across all 489 routes
5. Replit Secrets provides encrypted storage with access control for all sensitive values`
  },

  // ===== SECTION 22: Appendices & Reference =====
  {
    id: 57049308,
    title: '22.1 Full Module Registry (61 Modules)',
    versionMessage: 'Complete module registry with 61 modules',
    markdown: `# 22.1 Full Module Registry (61 Modules)

**Source:** \`apps/backend/src/modules/\`
**Total:** 61 custom MikroORM modules
**Categories:** Commerce, Verticals (27), Infrastructure, Integration

Complete registry of all 61 custom modules in the Dakkah CityOS Commerce platform.

## Commerce Modules (11)

| # | Module | Key | Tables | Description |
|---|--------|-----|--------|-------------|
| 1 | vendor | vendor | 5 | Multi-vendor marketplace with products, orders, analytics |
| 2 | commission | commission | 3 | Commission rules, tiers, transactions |
| 3 | cart-extension | cartExtension | 2 | Extended cart with gift wrapping, notes |
| 4 | shipping-extension | shippingExtension | 2 | Multi-carrier shipping with rate comparison |
| 5 | inventory-extension | inventoryExtension | 3 | Stock alerts, transfers, reservations |
| 6 | tax-config | taxConfig | 1 | Regional tax rules and exemptions |
| 7 | volume-pricing | volumePricing | 2 | Tiered pricing with quantity breaks |
| 8 | promotion-ext | promotionExt | 2 | Extended promotions with stacking rules |
| 9 | invoice | invoice | 2 | Invoice generation and management |
| 10 | payout | payout | 2 | Vendor payout processing |
| 11 | review | review | 1 | Product and vendor reviews |

## Vertical Modules (27)

| # | Module | Key | Category |
|---|--------|-----|----------|
| 1 | auction | auction | Marketplace |
| 2 | classified | classified | Marketplace |
| 3 | real-estate | realEstate | Marketplace |
| 4 | automotive | automotive | Marketplace |
| 5 | rental | rental | Marketplace |
| 6 | digital-product | digitalProduct | Marketplace |
| 7 | crowdfunding | crowdfunding | Marketplace |
| 8 | booking | booking | Services |
| 9 | healthcare | healthcare | Services |
| 10 | restaurant | restaurant | Services |
| 11 | travel | travel | Services |
| 12 | event-ticketing | eventTicketing | Services |
| 13 | freelance | freelance | Services |
| 14 | fitness | fitness | Services |
| 15 | pet-service | petService | Services |
| 16 | financial-product | financialProduct | Finance |
| 17 | insurance | insurance | Finance |
| 18 | subscription | subscription | Finance |
| 19 | social-commerce | socialCommerce | Content |
| 20 | affiliate | affiliate | Content |
| 21 | advertising | advertising | Content |
| 22 | education | education | Content |
| 23 | charity | charity | Content |
| 24 | grocery | grocery | Content |
| 25 | government | government | Civic |
| 26 | legal | legal | Civic |
| 27 | utilities | utilities | Civic |

## Infrastructure Modules (17)

| # | Module | Key | Description |
|---|--------|-----|-------------|
| 1 | tenant | tenant | Multi-tenant platform management |
| 2 | node | node | 5-level city hierarchy |
| 3 | governance | governance | Policy and authority management |
| 4 | persona | persona | 6-axis persona system |
| 5 | store | store | CityOS store configuration |
| 6 | region-zone | regionZone | Geographic zone management |
| 7 | notification-preferences | notificationPreferences | User notification settings |
| 8 | wallet | wallet | Digital wallet and transactions |
| 9 | loyalty | loyalty | Points and rewards programs |
| 10 | analytics | analytics | Reporting and metrics |
| 11 | cms-content | cmsContent | Content management |
| 12 | membership | membership | Membership plans and access |
| 13 | company | company | B2B company accounts |
| 14 | quote | quote | B2B quote/RFQ system |
| 15 | dispute | dispute | Order dispute resolution |
| 16 | warranty | warranty | After-sales warranty management |
| 17 | wishlist | wishlist | Customer wishlists |

## Additional Modules (6)

| # | Module | Key | Description |
|---|--------|-----|-------------|
| 1 | trade-in | tradeIn | Product trade-in program |
| 2 | i18n | i18n | Internationalization content |
| 3 | channel | channel | Sales channel management |
| 4 | audit | audit | Audit trail logging |
| 5 | events | events | Event management |
| 6 | parking | parking | Parking and transportation |`
  },
  {
    id: 57507980,
    title: '22.2 API Route Index (489 Routes)',
    versionMessage: 'Complete API route index with 489 routes',
    markdown: `# 22.2 API Route Index (489 Routes)

**Source:** \`apps/backend/src/api/\`
**Total:** 489 custom API routes
**Namespaces:** admin (237), store (163), vendor (68), platform (16), webhooks (4), health (1)

Complete index of all 489 custom API routes organized by namespace and module.

## Route Distribution

| Namespace | Count | Base Path | Auth Method |
|-----------|-------|-----------|-------------|
| Admin | 237 | /admin/* | Bearer token |
| Store | 163 | /store/* | Publishable key + optional JWT |
| Vendor | 68 | /vendor/* | Vendor JWT |
| Platform | 16 | /platform/* | Internal token |
| Webhooks | 4 | /api/webhooks/* | HMAC signature |
| Health | 1 | /health | None |

## Route Pattern Convention

| Pattern | HTTP Methods | Description |
|---------|-------------|-------------|
| /admin/{module} | GET, POST | List and create |
| /admin/{module}/{id} | GET, PUT, DELETE | Read, update, delete |
| /admin/{module}/{id}/{action} | POST | Custom actions (approve, reject) |
| /store/{module} | GET | Public listing |
| /store/{module}/{id} | GET | Public detail |
| /vendor/{module} | GET, POST | Vendor-scoped CRUD |

## Admin Routes (237)

| Module | Routes | Endpoints |
|--------|--------|-----------|
| vendors | 12 | CRUD + approve, reject, suspend, reinstate, performance, analytics |
| products | 6 | CRUD + commission |
| tenants | 10 | CRUD + billing, limits, team management |
| companies | 17 | CRUD + approve, credit, payment-terms, roles, spending, tax, workflow |
| bookings | 6 | CRUD + reschedule, settings |
| subscriptions | 10 | CRUD + change-plan, pause, resume, events, discounts |
| commissions | 6 | Rules, tiers, transactions |
| payouts | 8 | CRUD + process, hold, release, retry |
| quotes | 8 | CRUD + approve, reject, convert, expiring |
| disputes | 6 | CRUD + escalate, resolve |
| Other modules | ~148 | Standard CRUD pattern |

## Store Routes (163)

| Module | Routes | Endpoints |
|--------|--------|-----------|
| products | 4 | List, detail, volume-pricing |
| bookings | 10 | CRUD + availability, services, providers, cancel, confirm, check-in, reschedule |
| subscriptions | 10 | CRUD + checkout, me, cancel, pause, resume, change-plan, payment-method, billing-history |
| companies | 8 | List, detail, me, credit, orders, team, pricing |
| vendors | 6 | List, featured, by-handle, products, reviews, register |
| reviews | 6 | CRUD + helpful, products, vendors |
| Other modules | ~119 | Standard list/detail pattern |

## Vendor Routes (68)

| Module | Routes | Description |
|--------|--------|-------------|
| dashboard | 1 | Vendor dashboard overview |
| orders | 3 | Order list, detail, fulfill |
| products | 3 | Product list, create, edit |
| analytics | 1 | Vendor analytics |
| commissions | 1 | Commission history |
| payouts | 2 | Payout list, request |
| Other modules | ~57 | Vendor-scoped operations |

## Platform Routes (16)

| Endpoint | Description |
|----------|-------------|
| /platform/capabilities | Platform feature flags |
| /platform/cms/* | CMS content operations |
| /platform/context | Tenant/store context |
| /platform/storage/* | Object storage serve/upload |
| /platform/tenants/* | Tenant resolution |
| /platform/vendors/* | Vendor public profiles |

## Webhook Routes (4)

| Endpoint | Integration |
|----------|-------------|
| /api/webhooks/stripe | Stripe payment events |
| /api/webhooks/erpnext | ERPNext sync events |
| /api/webhooks/fleetbase | Fleetbase delivery events |
| /api/webhooks/payload-cms | Payload CMS content events |`
  },
  {
    id: 56590419,
    title: '22.3 Database Table Index',
    versionMessage: 'Database table index documentation',
    markdown: `# 22.3 Database Table Index

**Source:** \`apps/backend/src/modules/*/models/\`
**Total Custom Tables:** ~150+
**ORM:** MikroORM with PostgreSQL

Index of all custom database tables created by the 61 custom modules. Core Medusa tables are managed by the framework and not listed here.

## Tables by Module Category

### Commerce Module Tables

| Module | Tables |
|--------|--------|
| vendor | vendor, vendor_product, vendor_order, vendor_analytics, vendor_review |
| commission | commission_rule, commission_tier, commission_transaction |
| cart-extension | cart_extension, cart_gift_wrap |
| shipping-extension | shipping_carrier, shipping_rate |
| inventory-extension | stock_alert, stock_transfer, stock_reservation |
| tax-config | tax_config |
| volume-pricing | volume_pricing_rule, volume_pricing_tier |
| promotion-ext | promotion_extension, promotion_stacking_rule |
| invoice | invoice, invoice_line_item |
| payout | payout, payout_schedule |
| review | review |

### Vertical Module Tables (Selection)

| Module | Tables |
|--------|--------|
| auction | auction, bid, auction_media |
| booking | booking, availability, service_product, service_provider, booking_reminder |
| real-estate | property_listing, property_inquiry, property_viewing, open_house |
| restaurant | restaurant_profile, menu, menu_item, table_reservation |
| healthcare | healthcare_provider, appointment, medical_record, prescription |
| subscription | subscription_plan, subscription, subscription_event |

### Infrastructure Module Tables

| Module | Tables |
|--------|--------|
| tenant | tenant, tenant_member, tenant_billing |
| node | node (self-referential hierarchy) |
| governance | governance_authority |
| persona | persona |
| store | store |
| region-zone | region_zone |
| loyalty | loyalty_program, loyalty_account, loyalty_transaction |
| wallet | wallet, wallet_transaction |
| analytics | analytics_event |
| cms-content | cms_page, cms_navigation |

## Platform Tables (Raw SQL)

| Table | Module | Description |
|-------|--------|-------------|
| sync_tracking | Platform lib | Tracks sync operations between systems |

## Table Count by Category

| Category | Module Count | Approx Tables |
|----------|-------------|---------------|
| Commerce | 11 | ~30 |
| Verticals | 27 | ~80 |
| Infrastructure | 17 | ~35 |
| Additional | 6 | ~10 |
| Total | 61 | ~150+ |

## Common Column Patterns

| Column | Type | Present In |
|--------|------|-----------|
| id | text (PK) | All tables |
| tenant_id | text | Most tables (multi-tenant) |
| status | enum | Most entity tables |
| metadata | jsonb | Most tables (extensibility) |
| created_at | timestamp | All tables (MikroORM auto) |
| updated_at | timestamp | All tables (MikroORM auto) |

## Key Architecture Decisions

1. Each module manages its own tables (1-5 tables per module)
2. MikroORM handles table creation via migrations
3. Common column patterns (id, tenant_id, status, metadata) ensure consistency
4. JSONB metadata field on most tables provides extensibility without schema changes
5. sync_tracking is the only raw SQL table (platform-level, not module-owned)`
  },
  {
    id: 56000688,
    title: '22.4 Seed Data Reference',
    versionMessage: 'Seed data reference documentation',
    markdown: `# 22.4 Seed Data Reference

**Source:** \`apps/backend/src/scripts/\`
**Master Orchestrator:** seed-all-with-images.ts
**Total Seeded Groups:** 71 module groups

Complete reference for all seed data scripts that populate the platform with sample data for development and demonstration.

## Seed Script Hierarchy

| Script | Role | Dependencies |
|--------|------|-------------|
| seed-all-with-images.ts | Master orchestrator | All other seed scripts |
| seed-master.ts | Core commerce data | Medusa core tables |
| seed-verticals.ts | 27 vertical modules | seed-master.ts |
| Infrastructure seeds | 17 infrastructure modules | seed-master.ts |
| Sub-entity seeds | 18 sub-entity types | Parent entity seeds |
| Ancillary seeds | 9 ancillary types | Various parent seeds |

## Seed Data Breakdown

| Category | Count | Description |
|----------|-------|-------------|
| Verticals | 27 | One seed per vertical module |
| Infrastructure | 17 | Tenants, nodes, governance, personas, etc. |
| Sub-entities | 18 | Child entities (bids, menu items, appointments) |
| Ancillary | 9 | Support data (reviews, analytics, notifications) |
| Total | 71 | Module groups seeded |

## Core Seeds (seed-master.ts)

| Entity | Count | Description |
|--------|-------|-------------|
| Regions | 3 | US, EU, MENA |
| Currencies | 3 | USD, EUR, SAR |
| Tax Regions | 3 | Per region |
| Shipping Options | 6 | Standard, express per region |
| Products | ~50 | Sample product catalog |
| Categories | ~15 | Product categories |
| Customers | ~10 | Sample customer accounts |

## Vertical Seeds (seed-verticals.ts)

| # | Vertical | Entities Seeded |
|---|----------|----------------|
| 1 | Auction | Auctions, bids, auction media |
| 2 | Booking | Services, providers, availability, bookings |
| 3 | Healthcare | Providers, appointments, records |
| 4 | Restaurant | Profiles, menus, items, reservations |
| 5 | Real Estate | Listings, inquiries, viewings |
| 6 | Automotive | Vehicle listings, services, test drives |
| 7 | Travel | Packages, itineraries, activities |
| 8 | Education | Courses, modules, enrollments |
| 9-27 | Others | Vertical-specific sample data |

## Infrastructure Seeds

| Module | Entities Seeded |
|--------|----------------|
| Tenant | Platform tenant, team members, billing |
| Node | City -> District -> Zone -> Facility -> Asset hierarchy |
| Governance | Authority levels, policies |
| Persona | Consumer, creator, business, cityops, platform personas |
| Store | Store configurations |
| Loyalty | Programs, tiers, accounts |
| Wallet | Wallets, initial balances |

## Execution Order

| Order | Script | Reason |
|-------|--------|--------|
| 1 | seed-master.ts | Core commerce must exist first |
| 2 | Infrastructure seeds | Tenants, nodes needed by verticals |
| 3 | seed-verticals.ts | Depends on core + infrastructure |
| 4 | Sub-entity seeds | Depends on parent entities |
| 5 | Ancillary seeds | Depends on all above |

## Key Architecture Decisions

1. Master orchestrator (seed-all-with-images.ts) runs all seeds in correct dependency order
2. Separate scripts per module enable selective re-seeding
3. Image assets stored in object storage (zero external image dependencies)
4. Seed data represents realistic sample data for all 27 verticals
5. Idempotent design — re-running seeds updates existing data rather than duplicating`
  },
  {
    id: 57245972,
    title: '22.5 CMS Cross-Reference Map',
    versionMessage: 'CMS cross-reference map documentation',
    markdown: `# 22.5 CMS Cross-Reference Map

**Source:** \`apps/storefront/src/lib/cms-registry.ts\` (conceptual)
**Verticals Mapped:** 27
**Block Types:** 77 across all verticals

Maps each of the 27 verticals to their CMS page configuration, including slug, display name, applicable block types, and detail page template.

## Vertical to CMS Mapping

| # | Vertical | Slug | Display Name | Block Types Used |
|---|----------|------|-------------|-----------------|
| 1 | Auction | auctions | Auctions | Hero, AuctionBid, AuctionTimer, Gallery, FAQ |
| 2 | Automotive | automotive | Automotive | Hero, VehicleSpecs, CompareVehicles, Gallery, TestDriveBooking |
| 3 | Booking | bookings | Bookings | Hero, BookingCalendar, ServiceList, ProviderCard, Testimonials |
| 4 | Charity | charity | Charity | Hero, FeatureGrid, Testimonials, ContactForm, Stats |
| 5 | Classified | classifieds | Classifieds | Hero, FeatureGrid, Gallery, Map, ContactForm |
| 6 | Crowdfunding | crowdfunding | Crowdfunding | Hero, Stats, Timeline, Testimonials, FAQ |
| 7 | Digital Product | digital | Digital Products | Hero, PricingTable, FeatureGrid, FAQ, Video |
| 8 | Education | education | Education | Hero, FeatureGrid, PricingTable, Testimonials, FAQ |
| 9 | Event Ticketing | event-ticketing | Event Ticketing | Hero, EventCalendar, TicketSelector, VenueMap, Gallery |
| 10 | Events | events | Events | Hero, EventCalendar, Gallery, Map, ContactForm |
| 11 | Financial | financial | Financial Services | Hero, PricingTable, FeatureGrid, FAQ, Stats |
| 12 | Fitness | fitness | Fitness | Hero, BookingCalendar, PricingTable, Testimonials, Gallery |
| 13 | Freelance | freelance | Freelance | Hero, FeatureGrid, PricingTable, Testimonials, FAQ |
| 14 | Government | government | Government Services | Hero, FeatureGrid, ContactForm, Map, FAQ |
| 15 | Grocery | grocery | Grocery | Hero, FeatureGrid, Gallery, Map, PricingTable |
| 16 | Healthcare | healthcare | Healthcare | Hero, DoctorDirectory, AppointmentBooker, FAQ, Testimonials |
| 17 | Insurance | insurance | Insurance | Hero, PricingTable, FeatureGrid, FAQ, ContactForm |
| 18 | Legal | legal | Legal Services | Hero, FeatureGrid, Testimonials, FAQ, ContactForm |
| 19 | Memberships | memberships | Memberships | Hero, PricingTable, FeatureGrid, FAQ, Testimonials |
| 20 | Parking | parking | Parking | Hero, Map, PricingTable, FAQ, Stats |
| 21 | Pet Services | pet-services | Pet Services | Hero, FeatureGrid, BookingCalendar, Testimonials, Gallery |
| 22 | Real Estate | real-estate | Real Estate | Hero, PropertyListing, Map, VirtualTour, ContactForm |
| 23 | Rental | rentals | Rentals | Hero, FeatureGrid, BookingCalendar, Gallery, FAQ |
| 24 | Restaurant | restaurants | Restaurants | Hero, MenuDisplay, TableReservation, Gallery, Map |
| 25 | Travel | travel | Travel | Hero, Gallery, Map, PricingTable, Testimonials |
| 26 | Print on Demand | print-on-demand | Print on Demand | Hero, FeatureGrid, Gallery, PricingTable, FAQ |
| 27 | Social Commerce | social-commerce | Social Commerce | Hero, FeatureGrid, Stats, Testimonials, Gallery |

## CMS Registry Structure

| Field | Type | Description |
|-------|------|-------------|
| slug | string | URL-safe vertical identifier |
| displayName | string | Human-readable vertical name |
| blockTypes | string[] | Applicable block type identifiers |
| detailTemplate | string | Detail page template component |
| listTemplate | string | Listing page template component |
| seoDefaults | object | Default meta tags for vertical pages |

## Payload CMS Sync

| Feature | Implementation |
|---------|---------------|
| Content Source | Payload CMS collections |
| Sync Trigger | Webhook from Payload on content change |
| Cache Invalidation | Storefront cache cleared on webhook |
| Preview | Draft preview via Payload preview URL |

## Key Architecture Decisions

1. CMS registry provides a single source of truth for vertical-to-page mapping
2. Each vertical has a curated set of applicable block types
3. Payload CMS webhook enables real-time content updates
4. Slug convention matches URL route patterns for consistency
5. SEO defaults ensure all vertical pages have appropriate meta tags`
  },
  {
    id: 56983748,
    title: '22.6 Vertical Feature Matrix',
    versionMessage: 'Vertical feature matrix documentation',
    markdown: `# 22.6 Vertical Feature Matrix

**Verticals:** 27
**Features Compared:** 10 commerce capabilities

Feature comparison matrix showing which commerce capabilities each of the 27 verticals supports.

## Feature Matrix

| Vertical | Products | Booking | Bidding | Listing | Subscription | B2B Quote | Commission | Delivery | Digital | Event Ticketing |
|----------|----------|---------|---------|---------|-------------|-----------|-----------|----------|---------|----------------|
| Auction | Yes | No | Yes | Yes | No | No | Yes | Yes | No | No |
| Automotive | Yes | Yes | No | Yes | No | Yes | Yes | Yes | No | No |
| Booking | No | Yes | No | No | No | No | Yes | No | No | No |
| Charity | Yes | No | No | No | No | No | No | No | No | No |
| Classified | No | No | No | Yes | No | No | Yes | No | No | No |
| Crowdfunding | No | No | No | Yes | No | No | Yes | No | No | No |
| Digital Product | Yes | No | No | No | Yes | No | Yes | No | Yes | No |
| Education | Yes | Yes | No | No | Yes | No | Yes | No | Yes | No |
| Event Ticketing | No | Yes | No | No | No | No | Yes | No | No | Yes |
| Events | No | Yes | No | Yes | No | No | Yes | No | No | Yes |
| Financial | Yes | No | No | No | Yes | No | Yes | No | No | No |
| Fitness | No | Yes | No | No | Yes | No | Yes | No | No | No |
| Freelance | No | Yes | No | Yes | No | Yes | Yes | No | Yes | No |
| Government | No | No | No | No | No | No | No | No | No | No |
| Grocery | Yes | No | No | No | No | No | Yes | Yes | No | No |
| Healthcare | No | Yes | No | No | No | No | Yes | No | No | No |
| Insurance | Yes | No | No | No | Yes | No | Yes | No | No | No |
| Legal | No | Yes | No | No | No | No | Yes | No | No | No |
| Memberships | No | No | No | No | Yes | No | Yes | No | No | No |
| Parking | No | Yes | No | No | No | No | No | No | No | No |
| Pet Services | No | Yes | No | No | No | No | Yes | No | No | No |
| Print on Demand | Yes | No | No | No | No | No | Yes | Yes | No | No |
| Real Estate | No | No | No | Yes | No | No | Yes | No | No | No |
| Rental | Yes | Yes | No | Yes | No | No | Yes | No | No | No |
| Restaurant | No | Yes | No | No | No | No | Yes | Yes | No | No |
| Social Commerce | Yes | No | No | No | No | No | Yes | Yes | No | No |
| Travel | No | Yes | No | No | No | No | Yes | No | No | No |

## Feature Definitions

| Feature | Description |
|---------|-------------|
| Products/Variants | Standard product catalog with variants and pricing |
| Booking | Time-based reservations and appointments |
| Bidding | Auction-style bidding on listings |
| Listing | Classified-style listings (not standard products) |
| Subscription | Recurring billing and subscription plans |
| B2B Quote | Request for quote and negotiation workflow |
| Commission | Vendor commission on transactions |
| Delivery | Physical delivery/shipping integration |
| Digital | Digital product delivery (downloads, access) |
| Event Ticketing | Event tickets with date/time/venue |

## Feature Usage Summary

| Feature | Verticals Using | Percentage |
|---------|----------------|-----------|
| Commission | 24 | 89% |
| Products | 11 | 41% |
| Booking | 13 | 48% |
| Listing | 7 | 26% |
| Subscription | 6 | 22% |
| Delivery | 6 | 22% |
| Digital | 3 | 11% |
| Bidding | 1 | 4% |
| Event Ticketing | 2 | 7% |
| B2B Quote | 2 | 7% |

## Key Architecture Decisions

1. Commission is the most widely used feature (89%) — core to marketplace model
2. Booking and Products are the two primary transaction models
3. Each vertical uses a subset of features, minimizing unnecessary complexity
4. Feature flags could enable/disable features per tenant configuration
5. Government vertical uses no commerce features (civic services only)`
  },
  {
    id: 56393927,
    title: '22.7 Integration Endpoint Reference',
    versionMessage: 'Integration endpoint reference documentation',
    markdown: `# 22.7 Integration Endpoint Reference

**Source:** \`apps/backend/src/api/webhooks/\`, \`apps/backend/src/integrations/\`
**Webhook Endpoints:** 4
**Security:** HMAC signature verification on all webhooks

Complete reference for all integration endpoints including inbound webhooks, outbound API calls, and verification methods.

## Inbound Webhook Endpoints

| Endpoint | Method | Integration | Events Handled |
|----------|--------|-------------|----------------|
| /api/webhooks/stripe | POST | Stripe | payment_intent.succeeded, payment_intent.failed, invoice.paid, subscription events |
| /api/webhooks/erpnext | POST | ERPNext | inventory.updated, order.synced, product.updated |
| /api/webhooks/fleetbase | POST | Fleetbase | delivery.created, delivery.updated, delivery.completed |
| /api/webhooks/payload-cms | POST | Payload CMS | page.created, page.updated, page.deleted, navigation.updated |

## Webhook Security

| Integration | Header | Algorithm | Secret Variable |
|------------|--------|-----------|----------------|
| Stripe | Stripe-Signature | HMAC-SHA256 | STRIPE_WEBHOOK_SECRET |
| ERPNext | X-ERPNext-Signature | HMAC-SHA256 | ERPNEXT_WEBHOOK_SECRET |
| Fleetbase | X-Fleetbase-Signature | HMAC-SHA256 | FLEETBASE_WEBHOOK_SECRET |
| Payload CMS | X-Payload-Signature | HMAC-SHA256 | PAYLOAD_WEBHOOK_SECRET |

## Verification Flow

| Step | Action |
|------|--------|
| 1 | Receive webhook request with signature header |
| 2 | Extract raw request body (before JSON parsing) |
| 3 | Compute HMAC-SHA256 of body using integration secret |
| 4 | Compare computed signature with header value |
| 5 | Reject request if signatures don't match (401) |
| 6 | Process webhook payload if verified |

## Correlation IDs

| Feature | Implementation |
|---------|---------------|
| Generation | UUID v4 per inbound webhook |
| Header | X-Correlation-ID in response |
| Logging | Included in all log entries for the webhook processing |
| Tracing | Passed to downstream operations for end-to-end tracing |

## Outbound Integration Calls

| Integration | Client | Endpoints Called |
|------------|--------|----------------|
| Stripe | Stripe SDK | Payments, subscriptions, connect |
| ERPNext | REST client | Items, orders, invoices |
| Fleetbase | REST client | Orders, tracking, fleet |
| Payload CMS | REST client | Pages, navigation, media |
| Temporal | gRPC client | Workflow start, signal, query |

## Integration Health Monitoring

| Endpoint | Description |
|----------|-------------|
| /admin/integrations/health | Check health of all integrations |
| /admin/integrations/logs | View recent integration logs |
| /admin/integrations/sync | Trigger manual sync operations |

## Key Architecture Decisions

1. All webhook endpoints use HMAC-SHA256 verification for security
2. Correlation IDs enable end-to-end tracing across integration boundaries
3. Each integration has its own webhook secret for independent rotation
4. Integration health endpoint provides operational monitoring
5. Raw body verification prevents JSON parsing from modifying the signed payload`
  },
  {
    id: 56950925,
    title: '22.8 Node Hierarchy Reference',
    versionMessage: 'Node hierarchy reference with 5 levels',
    markdown: `# 22.8 Node Hierarchy Reference

**Source:** \`apps/backend/src/modules/node/\`
**Levels:** 5 (CITY -> DISTRICT -> ZONE -> FACILITY -> ASSET)
**Model:** Self-referential tree via parent_id

The node hierarchy provides a 5-level geographic and organizational structure for the CityOS platform. Nodes represent physical and logical locations that define governance boundaries and service areas.

## Hierarchy Levels

| Level | Node Type | Example | Purpose |
|-------|----------|---------|---------|
| 1 | CITY | Riyadh | Top-level city boundary |
| 2 | DISTRICT | Al Olaya | Administrative district |
| 3 | ZONE | King Fahd Road Commercial Zone | Service/commerce zone |
| 4 | FACILITY | Mall of Arabia | Physical facility |
| 5 | ASSET | Floor 3, Unit 15 | Specific asset or location |

## Node Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique node identifier |
| parent_id | text | nullable (FK to node) | Parent node reference (null for root) |
| node_type | enum | required | CITY, DISTRICT, ZONE, FACILITY, ASSET |
| name | text | required | Human-readable node name |
| code | text | unique | Machine-readable code (e.g., RUH-OLY-KFR) |
| description | text | nullable | Node description |
| metadata | jsonb | nullable | Additional properties (coordinates, boundaries, etc.) |
| is_active | boolean | default: true | Whether node is active |
| tenant_id | text | required | Owning tenant |

## Hierarchy Rules

| Rule | Description |
|------|-------------|
| Root nodes | CITY nodes have parent_id = null |
| Parent constraint | DISTRICT parent must be CITY |
| Level ordering | Each child is one level below parent |
| Code convention | Hierarchical codes (CITY-DISTRICT-ZONE) |
| Unique codes | Node codes are globally unique |

## Policy Inheritance

| Feature | Behavior |
|---------|----------|
| Direction | Policies inherit downward (parent to child) |
| Override | Child nodes can override parent policies |
| Scope | Governance policies apply to node and all descendants |
| Resolution | Most specific (deepest) policy wins |

## Use Cases

| Use Case | Nodes Involved |
|----------|---------------|
| Governance | Policies applied at any level, inherited down |
| Service Areas | ZONE defines delivery/service boundaries |
| Vendor Assignment | Vendors associated with ZONE or FACILITY |
| Tax Configuration | Tax rules per ZONE or CITY |
| Analytics | Aggregate metrics at any hierarchy level |
| Store Assignment | Stores linked to specific nodes |

## Example Hierarchy

| Level | Code | Name |
|-------|------|------|
| CITY | RUH | Riyadh |
| DISTRICT | RUH-OLY | Al Olaya |
| ZONE | RUH-OLY-KFR | King Fahd Road Commercial |
| FACILITY | RUH-OLY-KFR-MOA | Mall of Arabia |
| ASSET | RUH-OLY-KFR-MOA-F3U15 | Floor 3, Unit 15 |

## Key Architecture Decisions

1. Self-referential tree (parent_id) provides unlimited depth flexibility
2. 5 fixed level types ensure consistent hierarchy across deployments
3. Policy inheritance reduces redundant configuration across the tree
4. Node codes provide human-readable, hierarchical identification
5. Multi-tenant scoping allows different tenants to manage different city hierarchies`
  },
  {
    id: 56164588,
    title: '22.9 Persona System Reference',
    versionMessage: 'Persona system reference with 6-axis categories',
    markdown: `# 22.9 Persona System Reference

**Source:** \`apps/backend/src/modules/persona/\`
**Categories:** 5 persona categories
**Model:** 6-axis persona with preferences and access levels

The persona system provides a multi-axis classification for platform users, enabling personalized experiences and access control based on user category, preferences, and behavior.

## Persona Categories

| Category | Description | Example Users |
|----------|-------------|--------------|
| consumer | End-user shoppers and buyers | Retail customers, subscribers |
| creator | Content creators and sellers | Vendors, artisans, freelancers |
| business | B2B and enterprise users | Company buyers, procurement teams |
| cityops | City operations personnel | Government staff, node managers |
| platform | Platform operators | Admins, support agents |

## Persona Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique persona identifier |
| customer_id | text | required | Associated platform customer |
| tenant_id | text | required | Tenant context |
| category | enum | required | consumer, creator, business, cityops, platform |
| access_level | text | required | Access tier within category |
| preferences | jsonb | nullable | Personalization preferences |
| interests | jsonb | nullable | Interest tags and categories |
| behavior_score | number | nullable | Engagement/behavior metric |
| is_active | boolean | default: true | Whether persona is active |
| metadata | jsonb | nullable | Additional extensible data |

## 6-Axis Persona Dimensions

| Axis | Description | Data Source |
|------|-------------|-----------|
| Category | Primary classification (consumer, creator, etc.) | User registration |
| Access Level | Permission tier within category | Role assignment |
| Preferences | UI, language, communication preferences | User settings |
| Interests | Product/service category interests | Browse history, explicit selection |
| Behavior | Engagement score and patterns | Platform activity tracking |
| Context | Current session context (location, device) | Session data |

## Personalization Use Cases

| Use Case | Persona Axis Used |
|----------|------------------|
| Homepage content | Category + Interests |
| Product recommendations | Interests + Behavior |
| Navigation menu | Category + Access Level |
| Communication preferences | Preferences |
| Feature visibility | Access Level + Category |
| Regional content | Context (location) |

## Access Level by Category

| Category | Access Levels |
|----------|--------------|
| consumer | basic, verified, premium, vip |
| creator | starter, professional, enterprise |
| business | buyer, manager, admin |
| cityops | operator, supervisor, director |
| platform | support, admin, super_admin |

## Persona-to-Role Mapping

| Persona Category | Typical RBAC Roles |
|-----------------|-------------------|
| consumer | guest, customer |
| creator | vendor_staff, vendor_owner |
| business | customer (with company association) |
| cityops | node_manager, tenant_admin |
| platform | support_agent, platform_admin, super_admin |

## Key Architecture Decisions

1. Persona is separate from RBAC role — persona drives personalization, role drives access
2. 5 categories cover all platform user types
3. JSONB preferences field allows flexible personalization without schema changes
4. Behavior scoring enables data-driven personalization
5. Customer association links persona to Medusa's customer entity`
  },
  {
    id: 56164607,
    title: '22.10 Governance Chain Reference',
    versionMessage: 'Governance chain reference with 4 levels',
    markdown: `# 22.10 Governance Chain Reference

**Source:** \`apps/backend/src/modules/governance/\`
**Levels:** 4 (platform -> tenant -> node -> vendor)
**Model:** GovernanceAuthority with policy inheritance

The governance chain provides a 4-level policy framework where governance authorities at each level can define policies that inherit downward with override capability.

## Governance Levels

| Level | Authority | Scope | Example |
|-------|----------|-------|---------|
| 1 | Platform | Entire platform | Platform-wide commission caps, content policies |
| 2 | Tenant | Single tenant | Tenant-specific pricing rules, branding |
| 3 | Node | Geographic area | Zone-specific regulations, operating hours |
| 4 | Vendor | Individual vendor | Vendor-specific commission rates, policies |

## GovernanceAuthority Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique authority identifier |
| authority_level | enum | required | platform, tenant, node, vendor |
| entity_id | text | required | ID of the entity this authority belongs to |
| policy_scope | text | required | Category of policies (commerce, content, operations) |
| policies | jsonb | required | Policy definitions |
| enforcement_mode | enum | required | strict, advisory, disabled |
| is_active | boolean | default: true | Whether authority is active |
| metadata | jsonb | nullable | Additional configuration |

## Policy Inheritance

| Rule | Behavior |
|------|----------|
| Direction | Policies flow downward (platform -> tenant -> node -> vendor) |
| Override | Lower levels can override higher-level policies |
| Merge | Non-overridden policies are inherited from parent |
| Enforcement | Strict mode blocks violations, advisory mode warns |
| Resolution | Most specific (lowest level) policy wins for a given scope |

## Policy Scopes

| Scope | Examples |
|-------|---------|
| commerce | Commission rates, pricing rules, payment terms |
| content | Content moderation rules, allowed categories |
| operations | Operating hours, delivery zones, service areas |
| compliance | KYC requirements, tax reporting, data retention |
| branding | White-label settings, theme overrides |

## Enforcement Modes

| Mode | Behavior |
|------|----------|
| strict | Policy violations are blocked (hard enforcement) |
| advisory | Policy violations generate warnings but are allowed |
| disabled | Policy is defined but not enforced |

## Inheritance Examples

| Scenario | Platform Policy | Tenant Override | Effective Policy |
|----------|----------------|-----------------|-----------------|
| Max commission | 30% | 25% | 25% (tenant is more restrictive) |
| Content moderation | Standard | Strict | Strict (tenant overrides) |
| Operating hours | 24/7 | 9AM-9PM | 9AM-9PM (tenant overrides) |
| KYC required | Yes | (not set) | Yes (inherited from platform) |

## Governance Chain in Practice

| Step | Action |
|------|--------|
| 1 | Request arrives for a vendor operation |
| 2 | Identify the vendor's node, tenant, and platform |
| 3 | Collect policies at all 4 levels |
| 4 | Merge policies (lower levels override higher) |
| 5 | Apply enforcement mode of the effective policy |
| 6 | Allow, warn, or block based on enforcement |

## Key Architecture Decisions

1. 4-level hierarchy mirrors the organizational structure (platform -> tenant -> node -> vendor)
2. JSONB policies field provides flexible policy definition without schema changes
3. Override capability allows each level to customize policies for their context
4. Enforcement modes enable gradual policy rollout (advisory before strict)
5. Policy scope categories organize policies for targeted management`
  },
  {
    id: 56295523,
    title: '22.11 Glossary and Acronyms',
    versionMessage: 'Glossary and acronyms reference',
    markdown: `# 22.11 Glossary and Acronyms

Complete glossary of terms, acronyms, and abbreviations used throughout the Dakkah CityOS Commerce documentation.

## Platform Terms

| Term | Definition |
|------|-----------|
| CityOS | City Operating System — the overarching platform for city-scale commerce and services |
| Dakkah | The project name for the CityOS Commerce platform |
| Medusa | Open-source headless commerce engine (v2) used as the backend framework |
| Payload CMS | Headless content management system used for page content and navigation |
| Storefront | The customer-facing web application built with TanStack Start + React |
| Vendor Portal | Dashboard interface for marketplace vendors to manage their operations |

## Technical Acronyms

| Acronym | Full Form | Context |
|---------|-----------|---------|
| API | Application Programming Interface | Backend communication layer |
| ARIA | Accessible Rich Internet Applications | Web accessibility standard |
| CORS | Cross-Origin Resource Sharing | Browser security mechanism |
| CRUD | Create, Read, Update, Delete | Standard data operations |
| CSS | Cascading Style Sheets | Styling language |
| DID | Decentralized Identifier | Digital identity (Walt.id) |
| GMV | Gross Merchandise Value | Total value of transactions |
| gRPC | Google Remote Procedure Call | Temporal communication protocol |
| HMAC | Hash-based Message Authentication Code | Webhook signature verification |
| HMR | Hot Module Replacement | Development feature |
| HTML | HyperText Markup Language | Web page structure |
| HTTP | HyperText Transfer Protocol | Web communication protocol |
| JWT | JSON Web Token | Authentication token format |
| JSONB | JSON Binary | PostgreSQL JSON storage format |
| KYC | Know Your Customer | Identity verification process |
| ORM | Object-Relational Mapping | Database abstraction layer (MikroORM) |
| RBAC | Role-Based Access Control | Permission management system |
| REST | Representational State Transfer | API architecture style |
| RFQ | Request for Quote | B2B pricing negotiation |
| RTL | Right-to-Left | Text direction for Arabic |
| SAR | Saudi Riyal | Saudi Arabian currency |
| SEO | Search Engine Optimization | Web visibility optimization |
| SLA | Service Level Agreement | Performance commitment |
| SSI | Self-Sovereign Identity | Decentralized identity model |
| SSR | Server-Side Rendering | Page rendering technique |
| VC | Verifiable Credential | Digital credential (Walt.id) |
| VM | Virtual Machine | Deployment target type |

## Architecture Terms

| Term | Definition |
|------|-----------|
| Module | A self-contained Medusa extension with models, service, and migrations |
| Module Link | Cross-module entity relationship defined with defineLink() |
| Subscriber | Event listener that reacts to system events |
| Workflow | Multi-step operation with compensation (rollback) support |
| Middleware | Request processing layer between route and handler |
| Provider Chain | Nested React context providers wrapping the application |
| Block | Reusable CMS content component for page composition |

## Infrastructure Terms

| Term | Definition |
|------|-----------|
| Tenant | An organization operating on the platform (multi-tenant) |
| Node | A geographic/organizational unit in the city hierarchy |
| Governance | Policy framework for platform-wide rule enforcement |
| Persona | Multi-axis user classification for personalization |
| Region Zone | Geographic area for service delivery and pricing |

## Geographic Terms

| Term | Definition |
|------|-----------|
| GCC | Gulf Cooperation Council — regional economic alliance |
| MENA | Middle East and North Africa — geographic region |
| POI | Point of Interest — geographic location marker |

## Commerce Terms

| Term | Definition |
|------|-----------|
| Commission | Fee charged to vendors on each transaction |
| Payout | Payment disbursed to vendor from platform |
| Vertical | Industry-specific module (e.g., healthcare, real estate) |
| White Label | Customizable branding for tenant storefronts |
| Publishable Key | Client-safe API key identifying a store context |

## Key Architecture Decisions

1. Consistent terminology across all 170 documentation pages
2. Technical acronyms defined to ensure accessibility for all team members
3. Platform-specific terms distinguished from general technical terms
4. Geographic and commerce terms reflect the GCC/MENA market focus
5. Glossary serves as a quick reference for onboarding new team members`
  }
];

async function main() {
  try {
    const accessToken = await getAccessToken();
    console.log('Got access token successfully');
    console.log(`Processing ${pages.length} pages...`);

    let success = 0;
    let failed = 0;

    for (const page of pages) {
      try {
        console.log(`Updating page ${page.id}: ${page.title}...`);
        const storageBody = markdownToStorage(page.markdown);
        await updatePage(accessToken, page.id, page.title, storageBody, page.versionMessage);
        console.log(`  ✓ Updated ${page.title}`);
        success++;
      } catch (err) {
        console.error(`  ✗ Failed to update ${page.title}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\nAll pages processed! Success: ${success}, Failed: ${failed}`);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
