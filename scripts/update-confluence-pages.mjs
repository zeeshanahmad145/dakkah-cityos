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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
    const cells = row.split('|').filter(c => c.trim() !== '' || c === '').slice(0);
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
  {
    id: 56525017,
    title: '8.1 Government Module',
    versionMessage: 'Verified with actual codebase - 5 models with complete field documentation',
    markdown: `# 8.1 Government Module

**Module Path:** \`apps/backend/src/modules/government/\`
**Tables:** service_request, permit, municipal_license, fine, citizen_profile
**API Routes:** 5 route files (admin CRUD, admin by-ID, store list, store by-ID, vendor list)

The Government module provides a comprehensive civic services platform for municipal and government operations. It manages citizen service requests (maintenance, complaints, inquiries), permit applications (building, business, event), municipal license issuance and tracking, fine management (traffic, parking, building code violations), and citizen profiles. The module supports multi-tenant deployment for different government authorities with full lifecycle tracking from submission through resolution.

## Data Models

### ServiceRequest

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant/authority identifier |
| citizen_id | text | required | Reference to citizen profile |
| request_type | enum | required | maintenance, complaint, inquiry, permit, license, inspection, emergency |
| category | text | nullable | Service category classification |
| title | text | required | Short title of the request |
| description | text | required | Detailed description of the service request |
| location | json | nullable | Geographic location data for the request |
| status | enum | default: submitted | submitted, acknowledged, in_progress, resolved, closed, rejected |
| priority | enum | default: medium | low, medium, high, urgent |
| assigned_to | text | nullable | Staff member assigned to handle request |
| department | text | nullable | Department responsible for handling |
| resolution | text | nullable | Description of how the request was resolved |
| resolved_at | dateTime | nullable | Timestamp when request was resolved |
| photos | json | nullable | Array of photo URLs as evidence |
| reference_number | text | unique | Human-readable reference number |
| metadata | json | nullable | Additional extensible data |

### Permit

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant/authority identifier |
| applicant_id | text | required | Reference to applicant citizen/entity |
| permit_type | enum | required | building, business, event, parking, renovation, demolition, signage, food, other |
| permit_number | text | unique | System-generated permit number |
| status | enum | default: draft | draft, submitted, under_review, approved, denied, expired, revoked |
| description | text | nullable | Details about the permit application |
| property_address | json | nullable | Address of the property/location |
| fee | bigNumber | nullable | Permit application fee amount |
| currency_code | text | nullable | Currency for the fee |
| submitted_at | dateTime | nullable | When the application was submitted |
| approved_at | dateTime | nullable | When the permit was approved |
| approved_by | text | nullable | Authority who approved the permit |
| expires_at | dateTime | nullable | Permit expiration date |
| conditions | json | nullable | Conditions attached to the permit |
| denial_reason | text | nullable | Reason if permit was denied |
| documents | json | nullable | Supporting documents array |
| metadata | json | nullable | Additional extensible data |

### MunicipalLicense

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant/authority identifier |
| holder_id | text | required | License holder reference |
| license_type | enum | required | business, trade, professional, vehicle, pet, firearm, alcohol, food_handling |
| license_number | text | unique | Unique license number |
| status | enum | required | active, expired, suspended, revoked |
| issued_at | dateTime | required | Date the license was issued |
| expires_at | dateTime | nullable | License expiration date |
| renewal_date | dateTime | nullable | Next renewal due date |
| fee | bigNumber | nullable | License fee amount |
| currency_code | text | nullable | Currency for the fee |
| conditions | json | nullable | Special conditions on the license |
| issuing_authority | text | nullable | Authority that issued the license |
| metadata | json | nullable | Additional extensible data |

### Fine

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant/authority identifier |
| citizen_id | text | nullable | Reference to citizen who received the fine |
| fine_type | enum | required | traffic, parking, building_code, environmental, noise, other |
| fine_number | text | unique | System-generated fine number |
| description | text | required | Description of the violation |
| amount | bigNumber | required | Fine amount |
| currency_code | text | required | Currency for the amount |
| status | enum | required | issued, contested, paid, overdue, waived |
| issued_at | dateTime | required | When the fine was issued |
| due_date | dateTime | required | Payment due date |
| paid_at | dateTime | nullable | When the fine was paid |
| payment_reference | text | nullable | Payment transaction reference |
| location | json | nullable | Location where violation occurred |
| metadata | json | nullable | Additional extensible data |

### CitizenProfile

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant/authority identifier |
| customer_id | text | nullable | Link to platform customer account |
| national_id | text | nullable | Government-issued national ID |
| full_name | text | required | Citizen full name |
| date_of_birth | dateTime | nullable | Date of birth |
| address | json | nullable | Residential address |
| phone | text | nullable | Contact phone number |
| email | text | nullable | Contact email address |
| preferred_language | text | default: en | Preferred language for communications |
| registered_services | json | nullable | Array of services the citizen is registered for |
| total_requests | number | default: 0 | Running count of service requests |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/government | List all government records with filters |
| POST | /admin/government | Create a new government record |
| GET | /admin/government/:id | Get government record by ID |
| PUT | /admin/government/:id | Update a government record |
| DELETE | /admin/government/:id | Delete a government record |
| GET | /store/government | List government records (storefront) |
| GET | /store/government/:id | Get government record detail (storefront) |
| GET | /vendor/government | List government records for vendor |

## Key Business Logic

1. Service requests follow a lifecycle from submitted through acknowledged, in_progress, to resolved/closed/rejected with automatic reference number generation
2. Permits support a multi-stage review workflow: draft, submitted, under_review, approved/denied with expiration tracking
3. Municipal licenses track issuance, renewal dates, and support suspension/revocation for compliance enforcement
4. Fines support contestation workflow and overdue tracking with payment reference linking
5. Citizen profiles aggregate service history with total_requests counter and multi-language preference support
6. All entities are multi-tenant scoped via tenant_id for deployment across multiple government authorities`
  },
  {
    id: 57147492,
    title: '8.2 Legal Module',
    versionMessage: 'Verified with actual codebase - 4 models with complete field documentation',
    markdown: `# 8.2 Legal Module

**Module Path:** \`apps/backend/src/modules/legal/\`
**Tables:** attorney_profile, legal_consultation, legal_case, retainer_agreement
**API Routes:** 5 route files (admin CRUD, admin by-ID, store list, store by-ID, vendor list)

The Legal module enables legal practice management within the platform. It handles attorney profiles with specializations and ratings, client consultations (in-person and virtual), full case lifecycle management across multiple case types (civil, criminal, corporate, family, etc.), and retainer agreement tracking with billing cycle management. The module supports the complete legal service workflow from initial consultation through case resolution.

## Data Models

### AttorneyProfile

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| user_id | text | nullable | Link to platform user account |
| name | text | required | Attorney full name |
| bar_number | text | nullable | State bar association number |
| specializations | json | nullable | Array of legal specializations |
| practice_areas | json | nullable | Areas of practice |
| bio | text | nullable | Professional biography |
| education | json | nullable | Educational background array |
| experience_years | number | nullable | Years of legal experience |
| hourly_rate | bigNumber | nullable | Standard hourly billing rate |
| currency_code | text | nullable | Currency for rates |
| is_accepting_cases | boolean | default: true | Whether attorney is taking new cases |
| rating | number | nullable | Client satisfaction rating |
| total_cases | number | default: 0 | Lifetime case count |
| photo_url | text | nullable | Profile photo URL |
| languages | json | nullable | Languages spoken |
| metadata | json | nullable | Additional extensible data |

### LegalConsultation

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| attorney_id | text | required | Reference to attorney profile |
| client_id | text | required | Reference to client |
| case_id | text | nullable | Associated case if applicable |
| consultation_type | enum | required | initial, follow_up, strategy, settlement, mediation |
| status | enum | required | scheduled, in_progress, completed, cancelled, no_show |
| scheduled_at | dateTime | required | Scheduled date and time |
| duration_minutes | number | default: 60 | Expected duration in minutes |
| is_virtual | boolean | default: false | Whether consultation is virtual |
| virtual_link | text | nullable | Video conference link |
| fee | bigNumber | nullable | Consultation fee |
| currency_code | text | nullable | Currency for the fee |
| notes | text | nullable | Consultation notes |
| action_items | json | nullable | Follow-up action items |
| completed_at | dateTime | nullable | Actual completion timestamp |
| metadata | json | nullable | Additional extensible data |

### LegalCase

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| attorney_id | text | required | Lead attorney reference |
| client_id | text | required | Client reference |
| case_number | text | unique | System-generated case number |
| title | text | required | Case title |
| description | text | nullable | Detailed case description |
| case_type | enum | required | civil, criminal, corporate, family, real_estate, immigration, ip, tax, labor, other |
| status | enum | default: consultation | consultation, retained, active, discovery, trial, settled, closed, appeal |
| priority | enum | default: medium | low, medium, high, urgent |
| filing_date | dateTime | nullable | Court filing date |
| court_name | text | nullable | Name of the court |
| opposing_party | text | nullable | Opposing party name |
| documents | json | nullable | Case documents array |
| notes | text | nullable | Internal case notes |
| estimated_cost | bigNumber | nullable | Estimated total legal cost |
| actual_cost | bigNumber | nullable | Actual incurred cost |
| currency_code | text | nullable | Currency for costs |
| outcome | text | nullable | Case outcome description |
| closed_at | dateTime | nullable | Case closure date |
| metadata | json | nullable | Additional extensible data |

### RetainerAgreement

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| attorney_id | text | required | Attorney reference |
| client_id | text | required | Client reference |
| case_id | text | nullable | Associated case if applicable |
| agreement_number | text | unique | Unique agreement identifier |
| status | enum | required | draft, active, expired, terminated |
| retainer_amount | bigNumber | required | Retainer fee amount |
| currency_code | text | required | Currency for the retainer |
| billing_cycle | enum | required | monthly, quarterly, annually |
| hours_included | number | nullable | Hours included per billing cycle |
| hourly_overage_rate | bigNumber | nullable | Rate for hours exceeding included |
| start_date | dateTime | required | Agreement start date |
| end_date | dateTime | nullable | Agreement end date |
| auto_renew | boolean | default: false | Whether agreement auto-renews |
| balance_remaining | bigNumber | default: 0 | Remaining retainer balance |
| total_billed | bigNumber | default: 0 | Total amount billed to date |
| terms | json | nullable | Agreement terms and conditions |
| signed_at | dateTime | nullable | Date agreement was signed |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/legal | List all legal records with filters |
| POST | /admin/legal | Create a new legal record |
| GET | /admin/legal/:id | Get legal record by ID |
| PUT | /admin/legal/:id | Update a legal record |
| DELETE | /admin/legal/:id | Delete a legal record |
| GET | /store/legal | List legal services (storefront) |
| GET | /store/legal/:id | Get legal service detail (storefront) |
| GET | /vendor/legal | List legal records for vendor |

## Key Business Logic

1. Attorney profiles track availability (is_accepting_cases), ratings, and case counts for client matching
2. Consultations support both in-person and virtual meetings with scheduling and no-show tracking
3. Legal cases follow a comprehensive lifecycle: consultation, retained, active, discovery, trial, settled/closed/appeal
4. Retainer agreements manage billing cycles with included hours and overage rate calculations
5. Cost tracking compares estimated vs actual costs for financial management and reporting
6. All entities support multi-tenant deployment for legal practice networks`
  },
  {
    id: 56819802,
    title: '8.3 Utilities Module',
    versionMessage: 'Verified with actual codebase - 4 models with complete field documentation',
    markdown: `# 8.3 Utilities Module

**Module Path:** \`apps/backend/src/modules/utilities/\`
**Tables:** utility_account, meter_reading, usage_record, utility_bill
**API Routes:** 4 route files (admin CRUD, admin by-ID, store list, store by-ID)

The Utilities module manages utility service accounts and billing for electricity, water, gas, internet, phone, cable, and waste services. It tracks meter readings (manual, smart meter, and estimated), usage records with tiered consumption analysis, and generates bills with late fee management. The module supports auto-pay configuration and provides a complete utility management lifecycle from account creation through billing and payment.

## Data Models

### UtilityAccount

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| customer_id | text | required | Customer reference |
| utility_type | enum | required | electricity, water, gas, internet, phone, cable, waste |
| provider_name | text | required | Utility provider company name |
| account_number | text | required | Provider account number |
| meter_number | text | nullable | Physical meter identifier |
| address | json | nullable | Service address |
| status | enum | required | active, suspended, closed |
| auto_pay | boolean | default: false | Whether auto-pay is enabled |
| payment_method_id | text | nullable | Reference to payment method |
| metadata | json | nullable | Additional extensible data |

### MeterReading

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| account_id | text | required | Reference to utility account |
| reading_value | number | required | Current meter reading value |
| reading_date | dateTime | required | Date the reading was taken |
| reading_type | enum | required | manual, smart_meter, estimated |
| previous_reading | number | nullable | Previous reading for comparison |
| consumption | number | nullable | Calculated consumption since last reading |
| unit | text | nullable | Unit of measurement (kWh, gallons, etc.) |
| submitted_by | text | nullable | Person who submitted the reading |
| is_verified | boolean | default: false | Whether reading has been verified |
| photo_url | text | nullable | Photo evidence of meter reading |
| metadata | json | nullable | Additional extensible data |

### UsageRecord

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| account_id | text | required | Reference to utility account |
| period_start | dateTime | required | Usage period start date |
| period_end | dateTime | required | Usage period end date |
| usage_value | number | required | Amount of utility consumed |
| unit | text | required | Unit of measurement |
| usage_type | enum | required | consumption, peak, off_peak, reactive |
| cost | bigNumber | nullable | Cost for this usage |
| currency_code | text | nullable | Currency for the cost |
| tier | text | nullable | Pricing tier classification |
| metadata | json | nullable | Additional extensible data |

### UtilityBill

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| account_id | text | required | Reference to utility account |
| bill_number | text | unique | Unique bill identifier |
| billing_period_start | dateTime | required | Billing period start |
| billing_period_end | dateTime | required | Billing period end |
| due_date | dateTime | required | Payment due date |
| amount | bigNumber | required | Total bill amount |
| currency_code | text | required | Currency for the amount |
| consumption | number | nullable | Total consumption in period |
| consumption_unit | text | nullable | Unit of consumption measurement |
| status | enum | default: generated | generated, sent, paid, overdue, disputed |
| paid_at | dateTime | nullable | Payment timestamp |
| payment_reference | text | nullable | Payment transaction reference |
| late_fee | bigNumber | nullable | Late payment fee if applicable |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/utilities | List all utility records with filters |
| POST | /admin/utilities | Create a new utility record |
| GET | /admin/utilities/:id | Get utility record by ID |
| PUT | /admin/utilities/:id | Update a utility record |
| DELETE | /admin/utilities/:id | Delete a utility record |
| GET | /store/utilities | List utility accounts (storefront) |
| GET | /store/utilities/:id | Get utility account detail (storefront) |

## Key Business Logic

1. Utility accounts support seven service types with auto-pay configuration and payment method linking
2. Meter readings support three collection methods (manual, smart_meter, estimated) with verification workflow
3. Usage records differentiate between consumption types (peak, off_peak, reactive) for tiered pricing
4. Bills track the full billing lifecycle from generated through sent, paid, or overdue with late fee calculation
5. Consumption is calculated from meter reading deltas and used to generate accurate billing
6. Dispute status on bills enables customer challenge workflow for incorrect charges`
  },
  {
    id: 56361198,
    title: '8.4 Parking & Transportation Module',
    versionMessage: 'Verified with actual codebase - 4 models with complete field documentation',
    markdown: `# 8.4 Parking & Transportation Module

**Module Path:** \`apps/backend/src/modules/parking/\`
**Tables:** parking_zone, parking_session, ride_request, shuttle_route
**API Routes:** 5 route files (admin CRUD, admin by-ID, store list, store by-ID, vendor list)

The Parking & Transportation module manages urban mobility services including parking zone management, real-time parking sessions, ride-hailing requests, and shuttle route operations. It supports multiple zone types (street, garage, lot, valet, airport, reserved) with EV charging and accessibility features, flexible pricing (hourly, daily, monthly), and integrated transportation services with fare estimation and driver matching.

## Data Models

### ParkingZone

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| name | text | required | Zone display name |
| description | text | nullable | Zone description |
| zone_type | enum | required | street, garage, lot, valet, airport, reserved |
| address | json | nullable | Zone address |
| latitude | number | nullable | GPS latitude coordinate |
| longitude | number | nullable | GPS longitude coordinate |
| total_spots | number | required | Total parking spots in zone |
| available_spots | number | required | Currently available spots |
| hourly_rate | bigNumber | nullable | Hourly parking rate |
| daily_rate | bigNumber | nullable | Daily parking rate |
| monthly_rate | bigNumber | nullable | Monthly parking rate |
| currency_code | text | required | Currency for rates |
| operating_hours | json | nullable | Operating schedule |
| is_active | boolean | default: true | Whether zone is operational |
| has_ev_charging | boolean | default: false | EV charging station availability |
| has_disabled_spots | boolean | default: false | Accessible parking availability |
| metadata | json | nullable | Additional extensible data |

### ParkingSession

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| zone_id | text | required | Reference to parking zone |
| customer_id | text | nullable | Customer reference |
| vehicle_plate | text | nullable | Vehicle license plate |
| spot_number | text | nullable | Assigned spot identifier |
| status | enum | required | active, completed, expired, cancelled |
| started_at | dateTime | required | Session start time |
| ended_at | dateTime | nullable | Session end time |
| duration_minutes | number | nullable | Total parking duration |
| amount | bigNumber | nullable | Calculated parking fee |
| currency_code | text | required | Currency for the fee |
| payment_status | enum | required | pending, paid, failed |
| payment_reference | text | nullable | Payment transaction reference |
| is_ev_charging | boolean | default: false | Whether using EV charging |
| metadata | json | nullable | Additional extensible data |

### RideRequest

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| customer_id | text | required | Requesting customer reference |
| pickup_location | json | required | Pickup coordinates and address |
| dropoff_location | json | required | Dropoff coordinates and address |
| ride_type | enum | required | standard, premium, shared, accessible |
| status | enum | required | requested, matched, driver_en_route, in_progress, completed, cancelled |
| driver_id | text | nullable | Assigned driver reference |
| vehicle_id | text | nullable | Assigned vehicle reference |
| estimated_fare | bigNumber | nullable | Pre-trip fare estimate |
| actual_fare | bigNumber | nullable | Final calculated fare |
| currency_code | text | required | Currency for fares |
| distance_km | number | nullable | Trip distance in kilometers |
| duration_minutes | number | nullable | Trip duration in minutes |
| requested_at | dateTime | required | When ride was requested |
| picked_up_at | dateTime | nullable | Actual pickup time |
| dropped_off_at | dateTime | nullable | Actual dropoff time |
| rating | number | nullable | Post-ride rating (1-5) |
| metadata | json | nullable | Additional extensible data |

### ShuttleRoute

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| name | text | required | Route display name |
| description | text | nullable | Route description |
| route_type | enum | required | airport, hotel, campus, event, city |
| stops | json | required | Array of stop locations with coordinates |
| schedule | json | nullable | Operating schedule and frequencies |
| vehicle_type | text | nullable | Type of vehicle (bus, van, etc.) |
| capacity | number | nullable | Maximum passenger capacity |
| price | bigNumber | nullable | Fare per ride |
| currency_code | text | nullable | Currency for the fare |
| is_active | boolean | default: true | Whether route is currently running |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/parking | List all parking/transport records |
| POST | /admin/parking | Create a new parking/transport record |
| GET | /admin/parking/:id | Get record by ID |
| PUT | /admin/parking/:id | Update a record |
| DELETE | /admin/parking/:id | Delete a record |
| GET | /store/parking | List parking zones and services (storefront) |
| GET | /store/parking/:id | Get parking/transport detail (storefront) |
| GET | /vendor/parking | List parking records for vendor |

## Key Business Logic

1. Parking zones track real-time availability with total_spots vs available_spots counters and GPS coordinates
2. Parking sessions calculate fees based on duration and zone rates (hourly, daily, monthly) with payment tracking
3. Ride requests follow a real-time matching workflow: requested, matched, driver_en_route, in_progress, completed
4. Shuttle routes define fixed stops with schedules for recurring transportation services (airport, campus, events)
5. EV charging support is tracked at both the zone level (has_ev_charging) and session level (is_ev_charging)
6. Multi-rate pricing supports hourly, daily, and monthly rates per zone with currency flexibility`
  },
  {
    id: 56426636,
    title: '8.6 Warranty Module',
    versionMessage: 'Verified with actual codebase - 5 models with complete field documentation',
    markdown: `# 8.6 Warranty Module

**Module Path:** \`apps/backend/src/modules/warranty/\`
**Tables:** warranty_plan, warranty_claim, repair_order, spare_part, service_center
**API Routes:** 6 route files (admin warranties CRUD, admin warranties by-ID, admin warranty list, store warranties CRUD, store warranties by-ID, vendor warranty list)

The Warranty module provides end-to-end warranty and after-sales service management. It covers warranty plan configuration (standard, extended, premium, accidental damage), claim submission and processing, repair order workflow tracking, spare parts inventory management, and service center operations. The module manages the complete post-purchase support lifecycle from warranty registration through claim resolution.

## Data Models

### WarrantyPlan

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| name | text | required | Plan display name |
| description | text | nullable | Plan description and details |
| plan_type | enum | required | standard, extended, premium, accidental |
| duration_months | number | required | Warranty coverage duration in months |
| price | bigNumber | nullable | Plan purchase price |
| currency_code | text | required | Currency for the price |
| coverage | json | required | Coverage details and included items |
| exclusions | json | nullable | Items/conditions excluded from coverage |
| is_active | boolean | default: true | Whether plan is available for purchase |
| metadata | json | nullable | Additional extensible data |

### WarrantyClaim

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| plan_id | text | nullable | Associated warranty plan |
| customer_id | text | required | Claiming customer reference |
| order_id | text | required | Original purchase order reference |
| product_id | text | required | Product being claimed |
| claim_number | text | unique | System-generated claim number |
| issue_description | text | required | Description of the issue |
| evidence_urls | json | nullable | Photo/video evidence URLs |
| status | enum | required | submitted, reviewing, approved, in_repair, replaced, denied, closed |
| resolution_type | enum | nullable | repair, replace, refund, credit |
| resolution_notes | text | nullable | Notes about the resolution |
| approved_at | dateTime | nullable | Claim approval timestamp |
| resolved_at | dateTime | nullable | Final resolution timestamp |
| denied_reason | text | nullable | Reason if claim was denied |
| metadata | json | nullable | Additional extensible data |

### RepairOrder

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| claim_id | text | required | Associated warranty claim |
| service_center_id | text | nullable | Assigned service center |
| status | enum | required | created, received, diagnosing, repairing, testing, ready, shipped, completed |
| diagnosis | text | nullable | Technical diagnosis of the issue |
| repair_notes | text | nullable | Repair technician notes |
| parts_used | json | nullable | Array of spare parts used |
| estimated_cost | bigNumber | nullable | Estimated repair cost |
| actual_cost | bigNumber | nullable | Actual repair cost |
| currency_code | text | required | Currency for costs |
| estimated_completion | dateTime | nullable | Expected completion date |
| completed_at | dateTime | nullable | Actual completion timestamp |
| tracking_number | text | nullable | Shipping tracking number for return |
| metadata | json | nullable | Additional extensible data |

### SparePart

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| name | text | required | Part name |
| sku | text | unique | Stock keeping unit code |
| description | text | nullable | Part description |
| compatible_products | json | nullable | Array of compatible product IDs |
| price | bigNumber | required | Part unit price |
| currency_code | text | required | Currency for the price |
| stock_quantity | number | default: 0 | Current stock level |
| reorder_level | number | default: 5 | Minimum stock before reorder alert |
| supplier | text | nullable | Supplier name or reference |
| is_active | boolean | default: true | Whether part is available |
| metadata | json | nullable | Additional extensible data |

### ServiceCenter

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| tenant_id | text | required | Tenant identifier |
| name | text | required | Service center name |
| address_line1 | text | required | Primary address line |
| address_line2 | text | nullable | Secondary address line |
| city | text | required | City |
| state | text | nullable | State or province |
| postal_code | text | required | Postal/ZIP code |
| country_code | text | required | ISO country code |
| phone | text | nullable | Contact phone |
| email | text | nullable | Contact email |
| specializations | json | nullable | Array of repair specializations |
| is_active | boolean | default: true | Whether center is operational |
| capacity_per_day | number | nullable | Maximum daily repair capacity |
| current_load | number | default: 0 | Current active repairs count |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/warranties | List all warranty records |
| POST | /admin/warranties | Create a warranty record |
| GET | /admin/warranties/:id | Get warranty record by ID |
| PUT | /admin/warranties/:id | Update a warranty record |
| DELETE | /admin/warranties/:id | Delete a warranty record |
| GET | /admin/warranty | List warranty overview |
| GET | /store/warranties | List warranties (storefront) |
| GET | /store/warranties/:id | Get warranty detail (storefront) |
| GET | /vendor/warranty | List warranty records for vendor |

## Key Business Logic

1. Warranty plans define coverage scope with explicit inclusions (coverage JSON) and exclusions for clear customer expectations
2. Claims follow a review workflow: submitted, reviewing, approved/denied, then repair/replace/refund/credit resolution
3. Repair orders track an 8-stage workflow from created through diagnosis, repair, testing, to shipping and completion
4. Spare parts inventory maintains stock levels with automatic reorder alerts when quantity falls below reorder_level
5. Service centers track daily capacity and current load for optimal repair order distribution
6. Resolution types (repair, replace, refund, credit) provide flexible claim resolution options`
  },
  {
    id: 56361217,
    title: '8.7 Quote / RFQ Module',
    versionMessage: 'Verified with actual codebase - 2 models with complete field documentation',
    markdown: `# 8.7 Quote / RFQ Module

**Module Path:** \`apps/backend/src/modules/quote/\`
**Tables:** quote, quote_item
**API Routes:** 11 route files (admin CRUD, admin by-ID, admin approve, admin reject, admin convert, admin expiring, store CRUD, store by-ID, store accept, store decline, vendor list)

The Quote module implements a B2B Request for Quote (RFQ) system enabling companies to request custom pricing before placing orders. It supports the complete negotiation workflow from draft creation through sales team review to customer acceptance, with line-item level pricing customization, discount management, validity period tracking, and conversion to orders upon acceptance.

## Data Models

### Quote

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| quote_number | text | required | Human-readable quote number (e.g., Q-2024-0001) |
| company_id | text | required | B2B company requesting the quote |
| customer_id | text | required | Individual requester reference |
| cart_id | text | nullable | Associated cart for conversion |
| draft_order_id | text | nullable | Associated draft order for conversion |
| tenant_id | text | required | Tenant identifier |
| store_id | text | nullable | Store context |
| region_id | text | nullable | Region for pricing/tax |
| status | enum | default: draft | draft, submitted, under_review, approved, rejected, accepted, declined, expired |
| subtotal | bigNumber | default: 0 | Sum of line item subtotals |
| discount_total | bigNumber | default: 0 | Total discount amount |
| tax_total | bigNumber | default: 0 | Total tax amount |
| shipping_total | bigNumber | default: 0 | Total shipping cost |
| total | bigNumber | default: 0 | Grand total |
| currency_code | text | default: usd | Quote currency |
| custom_discount_percentage | number | nullable | Custom discount percentage applied |
| custom_discount_amount | bigNumber | nullable | Custom discount amount applied |
| discount_reason | text | nullable | Justification for discount |
| valid_from | dateTime | nullable | Quote validity start date |
| valid_until | dateTime | nullable | Quote expiration date |
| reviewed_by | text | nullable | Admin user who reviewed |
| reviewed_at | dateTime | nullable | Review timestamp |
| rejection_reason | text | nullable | Reason if rejected by sales |
| accepted_at | dateTime | nullable | Customer acceptance timestamp |
| declined_at | dateTime | nullable | Customer decline timestamp |
| declined_reason | text | nullable | Reason customer declined |
| customer_notes | text | nullable | Notes from the customer |
| internal_notes | text | nullable | Internal sales team notes |
| metadata | json | nullable | Additional extensible data |

### QuoteItem

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| quote_id | text | required | Parent quote reference |
| product_id | text | required | Product reference |
| variant_id | text | required | Product variant reference |
| title | text | required | Product title snapshot |
| description | text | nullable | Product description snapshot |
| sku | text | nullable | SKU at time of quote |
| thumbnail | text | nullable | Product thumbnail URL |
| quantity | number | required | Requested quantity |
| unit_price | bigNumber | required | Catalog price per unit |
| custom_unit_price | bigNumber | nullable | Negotiated custom price per unit |
| subtotal | bigNumber | required | Line subtotal |
| discount_total | bigNumber | default: 0 | Line discount amount |
| tax_total | bigNumber | default: 0 | Line tax amount |
| total | bigNumber | required | Line total |
| discount_percentage | number | nullable | Line-level discount percentage |
| discount_reason | text | nullable | Reason for line discount |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/quotes | List all quotes with filters |
| POST | /admin/quotes | Create a new quote |
| GET | /admin/quotes/:id | Get quote by ID |
| PUT | /admin/quotes/:id | Update a quote |
| DELETE | /admin/quotes/:id | Delete a quote |
| POST | /admin/quotes/:id/approve | Approve a quote |
| POST | /admin/quotes/:id/reject | Reject a quote |
| POST | /admin/quotes/:id/convert | Convert quote to order |
| GET | /admin/quotes/expiring | List quotes nearing expiration |
| GET | /store/quotes | List customer quotes (storefront) |
| POST | /store/quotes | Submit a new quote request |
| GET | /store/quotes/:id | Get quote detail (storefront) |
| POST | /store/quotes/:id/accept | Customer accepts quote |
| POST | /store/quotes/:id/decline | Customer declines quote |
| GET | /vendor/quotes | List quotes for vendor |

## Key Business Logic

1. Quotes follow a two-phase workflow: internal review (draft, submitted, under_review, approved/rejected) and customer response (accepted/declined/expired)
2. Line items snapshot product data at quote time (title, SKU, price) to preserve accuracy even if catalog changes
3. Custom pricing supports both percentage and fixed amount discounts at quote level and per line item
4. Validity period tracking with valid_from/valid_until enables automatic expiration of stale quotes
5. Quote conversion to cart or draft order facilitates seamless transition from negotiation to purchase
6. Expiring quotes endpoint enables proactive sales follow-up before quotes expire`
  },
  {
    id: 57049289,
    title: '8.8 Company / B2B Module',
    versionMessage: 'Verified with actual codebase - 4 models with complete field documentation',
    markdown: `# 8.8 Company / B2B Module

**Module Path:** \`apps/backend/src/modules/company/\`
**Tables:** company, company_user, approval_workflow, tax_exemption
**API Routes:** 17 route files (admin companies CRUD, admin by-ID, admin approve, admin credit, admin payment-terms, admin roles, admin spending-limits, admin tax-exemptions, admin workflow, admin company list, store companies list, store by-ID, store me, store me/credit, store me/orders, store me/team, store companies/pricing)

The Company / B2B module enables business-to-business commerce with company account management, multi-user access with role-based permissions, spending controls, configurable approval workflows for purchase orders and quotes, and tax exemption certificate management. It supports tiered company classifications (bronze, silver, gold, platinum) with credit limits and payment terms for enterprise purchasing.

## Data Models

### Company

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| handle | text | unique | URL-friendly company identifier |
| name | text | required | Company display name |
| legal_name | text | nullable | Registered legal entity name |
| tax_id | text | nullable | Tax identification number |
| email | text | required | Primary contact email |
| phone | text | nullable | Contact phone number |
| industry | text | nullable | Industry classification |
| employee_count | number | nullable | Number of employees |
| annual_revenue | bigNumber | nullable | Annual revenue for tier assessment |
| credit_limit | bigNumber | default: 0 | Maximum credit extended |
| credit_used | bigNumber | default: 0 | Currently utilized credit |
| payment_terms_days | number | default: 30 | Net payment terms (30, 60, 90) |
| status | enum | default: pending | pending, active, suspended, inactive |
| tier | enum | default: bronze | bronze, silver, gold, platinum |
| approved_at | dateTime | nullable | Account approval timestamp |
| approved_by | text | nullable | Admin who approved the account |
| metadata | json | nullable | Additional extensible data |

### CompanyUser

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| company_id | text | required | Parent company reference |
| customer_id | text | required | Platform customer account link |
| role | enum | default: buyer | admin, approver, buyer, viewer |
| spending_limit | bigNumber | nullable | Per-user spending limit (null = unlimited) |
| spending_limit_period | enum | nullable | daily, weekly, monthly, yearly |
| current_period_spend | bigNumber | default: 0 | Spend in current period |
| period_start | dateTime | nullable | Current spending period start |
| approval_limit | bigNumber | nullable | Maximum amount user can approve |
| status | enum | default: active | active, inactive |
| invited_at | dateTime | nullable | When user was invited |
| joined_at | dateTime | nullable | When user accepted invitation |
| metadata | json | nullable | Additional extensible data |

### ApprovalWorkflow

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| company_id | text | required | Company this workflow belongs to |
| tenant_id | text | nullable | Tenant identifier |
| name | text | required | Workflow display name |
| description | text | nullable | Workflow description |
| workflow_type | enum | required | purchase_order, quote_request, quote_acceptance, user_registration, credit_increase, payment_terms_change, return_request, custom |
| is_active | boolean | default: true | Whether workflow is enabled |
| priority | number | default: 0 | Evaluation priority (higher = first) |
| conditions | json | nullable | Trigger conditions (amount_threshold, categories) |
| steps | json | required | Array of approval step configurations |
| metadata | json | nullable | Additional extensible data |

### TaxExemption

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| company_id | text | required | Company holding the exemption |
| tenant_id | text | nullable | Tenant identifier |
| certificate_number | text | required | Tax exemption certificate number |
| certificate_type | enum | required | resale, nonprofit, government, manufacturer, agricultural, educational, medical, religious, other |
| issuing_state | text | nullable | State/province that issued certificate |
| issuing_country | text | nullable | Country of issuance |
| issuing_authority | text | nullable | Issuing tax authority name |
| issue_date | dateTime | required | Certificate issue date |
| expiration_date | dateTime | nullable | Certificate expiration date |
| is_permanent | boolean | default: false | Whether exemption is permanent |
| status | enum | default: pending_verification | pending_verification, verified, rejected, expired, revoked |
| verified_by_id | text | nullable | Admin who verified the certificate |
| verified_at | dateTime | nullable | Verification timestamp |
| verification_notes | text | nullable | Notes from verification |
| rejection_reason | text | nullable | Reason if rejected |
| exemption_percentage | bigNumber | default: 100 | Exemption rate (100 = full) |
| applicable_categories | json | nullable | Product categories covered |
| applicable_regions | json | nullable | Regions where exemption applies |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/companies | List all companies |
| POST | /admin/companies | Create a company |
| GET | /admin/companies/:id | Get company by ID |
| PUT | /admin/companies/:id | Update company details |
| DELETE | /admin/companies/:id | Delete a company |
| POST | /admin/companies/:id/approve | Approve company registration |
| PUT | /admin/companies/:id/credit | Manage company credit limit |
| PUT | /admin/companies/:id/payment-terms | Update payment terms |
| PUT | /admin/companies/:id/roles | Manage user roles |
| PUT | /admin/companies/:id/spending-limits | Configure spending limits |
| GET | /admin/companies/:id/tax-exemptions | List company tax exemptions |
| POST | /admin/companies/:id/tax-exemptions | Add tax exemption |
| GET | /admin/companies/:id/workflow | Get approval workflows |
| POST | /admin/companies/:id/workflow | Create approval workflow |
| GET | /admin/company | Company overview/dashboard |
| GET | /store/companies | List companies (storefront) |
| GET | /store/companies/:id | Company detail (storefront) |
| GET | /store/companies/:id/pricing | Company-specific pricing |
| GET | /store/companies/me | Current user company profile |
| GET | /store/companies/me/credit | Company credit balance |
| GET | /store/companies/me/orders | Company order history |
| GET | /store/companies/me/team | Company team members |

## Key Business Logic

1. Company accounts follow an approval workflow: pending registration, admin review, active status with tier assignment
2. Role-based access (admin, approver, buyer, viewer) controls what company users can do within the platform
3. Spending limits enforce per-user purchase controls with configurable periods (daily, weekly, monthly, yearly)
4. Approval workflows support multi-step configurations with role-based or user-based approvers and timeout escalation
5. Tax exemption certificates go through verification (pending_verification, verified, rejected) with partial exemption support
6. Credit management tracks credit_limit vs credit_used for net-terms purchasing with configurable payment terms`
  },
  {
    id: 56623245,
    title: '8.9 Dispute Module',
    versionMessage: 'Verified with actual codebase - 2 models with complete field documentation',
    markdown: `# 8.9 Dispute Module

**Module Path:** \`apps/backend/src/modules/dispute/\`
**Tables:** dispute, dispute_message
**API Routes:** 6 route files (admin CRUD, admin by-ID, admin escalate, admin resolve, store list, vendor list)

The Dispute module handles order dispute resolution between customers, vendors, and platform administrators. It supports dispute creation with type and priority classification, threaded messaging between all parties (with internal-only messages for staff), escalation workflows, and resolution tracking with optional monetary compensation. The module enables fair conflict resolution across marketplace transactions.

## Data Models

### Dispute

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| order_id | text | required | Reference to disputed order |
| customer_id | text | required | Customer who filed the dispute |
| vendor_id | text | nullable | Vendor involved in the dispute |
| tenant_id | text | required | Tenant identifier |
| type | text | required | Dispute type classification |
| status | text | default: open | Current dispute status |
| priority | text | default: medium | Dispute priority level |
| resolution | text | nullable | Resolution description |
| resolution_amount | bigNumber | nullable | Monetary resolution amount if applicable |
| resolved_by | text | nullable | Admin/staff who resolved the dispute |
| resolved_at | dateTime | nullable | Resolution timestamp |
| escalated_at | dateTime | nullable | When dispute was escalated |
| metadata | json | nullable | Additional extensible data |

### DisputeMessage

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | Unique identifier |
| dispute_id | text | required | Parent dispute reference |
| sender_type | text | required | Type of sender (customer, vendor, admin) |
| sender_id | text | required | Sender user reference |
| content | text | required | Message content |
| attachments | json | nullable | Array of attachment URLs |
| is_internal | boolean | default: false | Whether message is internal (staff only) |
| metadata | json | nullable | Additional extensible data |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/disputes | List all disputes with filters |
| POST | /admin/disputes | Create a dispute |
| GET | /admin/disputes/:id | Get dispute by ID with messages |
| PUT | /admin/disputes/:id | Update dispute details |
| DELETE | /admin/disputes/:id | Delete a dispute |
| POST | /admin/disputes/:id/escalate | Escalate dispute priority |
| POST | /admin/disputes/:id/resolve | Resolve dispute with resolution details |
| GET | /store/disputes | List customer disputes (storefront) |
| POST | /store/disputes | Submit a new dispute |
| GET | /vendor/disputes | List vendor disputes |

## Key Business Logic

1. Disputes link orders to customers and optionally vendors for three-party resolution tracking
2. Threaded messaging supports customer, vendor, and admin communications with internal-only message flag for staff discussions
3. Escalation workflow tracks when disputes are elevated with escalated_at timestamp for SLA monitoring
4. Resolution supports both descriptive resolution text and monetary resolution_amount for refunds/credits
5. Priority-based triage enables support teams to handle urgent disputes first
6. Multi-tenant scoping ensures dispute isolation between different marketplace tenants`
  }
];

async function main() {
  try {
    const accessToken = await getAccessToken();
    console.log('Got access token successfully');

    for (const page of pages) {
      try {
        console.log(`Updating page ${page.id}: ${page.title}...`);
        const storageBody = markdownToStorage(page.markdown);
        await updatePage(accessToken, page.id, page.title, storageBody, page.versionMessage);
        console.log(`  ✓ Updated ${page.title}`);
      } catch (err) {
        console.error(`  ✗ Failed to update ${page.title}: ${err.message}`);
      }
    }

    console.log('\nAll pages processed!');
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
