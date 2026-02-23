export type StorageDomain =
  | "commerce"
  | "charity"
  | "healthcare"
  | "fleet-logistics"
  | "transportation"
  | "education"
  | "real-estate"
  | "government"
  | "legal"
  | "fitness"
  | "pet-service"
  | "automotive"
  | "restaurant"
  | "travel"
  | "parking"
  | "utilities"
  | "insurance"
  | "advertising"
  | "social-commerce"
  | "crowdfunding"
  | "membership"
  | "freelance"
  | "event-ticketing"
  | "classified"
  | "auction"
  | "rental"
  | "digital-product"
  | "grocery";

export type ScopeLevel =
  | "global"
  | "country"
  | "city"
  | "district"
  | "zone"
  | "facility"
  | "asset"
  | "tenant";

export type Visibility = "public" | "tenant" | "private" | "user-private";

export interface PrefixEntry {
  prefix: string;
  domain: StorageDomain | "core" | "system" | "governance" | "poi" | "user";
  visibility: Visibility;
  maxSizeMB: number;
  allowedMimeTypes: string[];
  description: string;
}

export interface SystemPolicy {
  systemId: string;
  prefixes: string[];
  accessLevel: "public" | "private" | "public+private";
  allowedFileTypes: string[];
  maxSizeMB: number;
  operations: ("read" | "write" | "delete" | "list" | "signed-url")[];
}

const PREFIX_REGISTRY: Record<string, PrefixEntry> = {
  media: {
    prefix: "media",
    domain: "core",
    visibility: "public",
    maxSizeMB: 100,
    allowedMimeTypes: ["image/*", "video/*", "audio/*", "application/pdf"],
    description: "General media assets",
  },
  "media/thumbnails": {
    prefix: "media/thumbnails",
    domain: "core",
    visibility: "public",
    maxSizeMB: 5,
    allowedMimeTypes: ["image/*"],
    description: "Pre-generated thumbnails",
  },
  "media/cards": {
    prefix: "media/cards",
    domain: "core",
    visibility: "public",
    maxSizeMB: 10,
    allowedMimeTypes: ["image/*"],
    description: "Card-size images",
  },
  "media/heroes": {
    prefix: "media/heroes",
    domain: "core",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Hero/banner images",
  },
  "media/originals": {
    prefix: "media/originals",
    domain: "core",
    visibility: "public",
    maxSizeMB: 100,
    allowedMimeTypes: ["image/*", "video/*", "audio/*"],
    description: "Original uploads",
  },
  "media/processed": {
    prefix: "media/processed",
    domain: "core",
    visibility: "public",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Post-processed files",
  },
  templates: {
    prefix: "templates",
    domain: "core",
    visibility: "public",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "application/pdf", "text/*"],
    description: "Template assets",
  },

  "branding/logos": {
    prefix: "branding/logos",
    domain: "core",
    visibility: "public",
    maxSizeMB: 5,
    allowedMimeTypes: ["image/*"],
    description: "Tenant logos",
  },
  "branding/favicons": {
    prefix: "branding/favicons",
    domain: "core",
    visibility: "public",
    maxSizeMB: 1,
    allowedMimeTypes: ["image/*"],
    description: "Tenant favicons",
  },
  "branding/themes": {
    prefix: "branding/themes",
    domain: "core",
    visibility: "public",
    maxSizeMB: 10,
    allowedMimeTypes: ["image/*", "text/css", "application/json"],
    description: "Theme assets",
  },

  "users/uploads": {
    prefix: "users/uploads",
    domain: "user",
    visibility: "tenant",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "application/pdf", "video/*"],
    description: "User uploads",
  },
  "users/private": {
    prefix: "users/private",
    domain: "user",
    visibility: "user-private",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "User-private files",
  },
  "users/avatars": {
    prefix: "users/avatars",
    domain: "user",
    visibility: "public",
    maxSizeMB: 5,
    allowedMimeTypes: ["image/*"],
    description: "User avatars",
  },

  poi: {
    prefix: "poi",
    domain: "poi",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "POI spatial identity",
  },

  "governance/policies": {
    prefix: "governance/policies",
    domain: "governance",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["application/pdf", "image/*", "application/msword", "text/csv"],
    description: "Policy documents",
  },
  "governance/compliance": {
    prefix: "governance/compliance",
    domain: "governance",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["application/pdf", "image/*"],
    description: "Compliance documents",
  },

  "system/logs": {
    prefix: "system/logs",
    domain: "system",
    visibility: "private",
    maxSizeMB: 500,
    allowedMimeTypes: ["*/*"],
    description: "System logs",
  },
  "system/backups": {
    prefix: "system/backups",
    domain: "system",
    visibility: "private",
    maxSizeMB: 500,
    allowedMimeTypes: ["*/*"],
    description: "System backups",
  },
  "system/migrations": {
    prefix: "system/migrations",
    domain: "system",
    visibility: "private",
    maxSizeMB: 500,
    allowedMimeTypes: ["*/*"],
    description: "Migration files",
  },
  workflows: {
    prefix: "workflows",
    domain: "system",
    visibility: "private",
    maxSizeMB: 500,
    allowedMimeTypes: ["*/*"],
    description: "Workflow files",
  },

  "domains/commerce/products": {
    prefix: "domains/commerce/products",
    domain: "commerce",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Medusa product images",
  },
  "domains/commerce/catalogs": {
    prefix: "domains/commerce/catalogs",
    domain: "commerce",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Medusa catalog images",
  },
  "domains/commerce/orders": {
    prefix: "domains/commerce/orders",
    domain: "commerce",
    visibility: "private",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Order attachments",
  },
  "domains/commerce/vendors": {
    prefix: "domains/commerce/vendors",
    domain: "commerce",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Vendor images",
  },

  "domains/charity": {
    prefix: "domains/charity",
    domain: "charity",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Charity campaign media",
  },

  "domains/healthcare": {
    prefix: "domains/healthcare",
    domain: "healthcare",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Healthcare documents",
  },

  "domains/fleet-logistics": {
    prefix: "domains/fleet-logistics",
    domain: "fleet-logistics",
    visibility: "private",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Fleet logistics media",
  },

  "domains/transportation": {
    prefix: "domains/transportation",
    domain: "transportation",
    visibility: "private",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Transportation media",
  },

  "domains/education": {
    prefix: "domains/education",
    domain: "education",
    visibility: "public",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "video/*", "application/pdf"],
    description: "Education media",
  },

  "domains/real-estate": {
    prefix: "domains/real-estate",
    domain: "real-estate",
    visibility: "public",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Real estate media",
  },

  "domains/government": {
    prefix: "domains/government",
    domain: "government",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Government documents",
  },

  "domains/legal": {
    prefix: "domains/legal",
    domain: "legal",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["application/pdf", "image/*"],
    description: "Legal documents",
  },

  "domains/fitness": {
    prefix: "domains/fitness",
    domain: "fitness",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Fitness media",
  },

  "domains/pet-service": {
    prefix: "domains/pet-service",
    domain: "pet-service",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Pet service media",
  },

  "domains/automotive": {
    prefix: "domains/automotive",
    domain: "automotive",
    visibility: "public",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Automotive media",
  },

  "domains/restaurant": {
    prefix: "domains/restaurant",
    domain: "restaurant",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Restaurant media",
  },

  "domains/travel": {
    prefix: "domains/travel",
    domain: "travel",
    visibility: "public",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Travel media",
  },

  "domains/parking": {
    prefix: "domains/parking",
    domain: "parking",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Parking media",
  },

  "domains/utilities": {
    prefix: "domains/utilities",
    domain: "utilities",
    visibility: "private",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Utility documents",
  },

  "domains/insurance": {
    prefix: "domains/insurance",
    domain: "insurance",
    visibility: "private",
    maxSizeMB: 50,
    allowedMimeTypes: ["application/pdf", "image/*"],
    description: "Insurance documents",
  },

  "domains/advertising": {
    prefix: "domains/advertising",
    domain: "advertising",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Ad creatives",
  },

  "domains/social-commerce": {
    prefix: "domains/social-commerce",
    domain: "social-commerce",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Social commerce media",
  },

  "domains/crowdfunding": {
    prefix: "domains/crowdfunding",
    domain: "crowdfunding",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*", "video/*"],
    description: "Crowdfunding media",
  },

  "domains/membership": {
    prefix: "domains/membership",
    domain: "membership",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Membership media",
  },

  "domains/freelance": {
    prefix: "domains/freelance",
    domain: "freelance",
    visibility: "public",
    maxSizeMB: 30,
    allowedMimeTypes: ["image/*", "application/pdf"],
    description: "Freelance portfolios",
  },

  "domains/event-ticketing": {
    prefix: "domains/event-ticketing",
    domain: "event-ticketing",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Event media",
  },

  "domains/classified": {
    prefix: "domains/classified",
    domain: "classified",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Classified listings media",
  },

  "domains/auction": {
    prefix: "domains/auction",
    domain: "auction",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Auction item media",
  },

  "domains/rental": {
    prefix: "domains/rental",
    domain: "rental",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Rental listing media",
  },

  "domains/digital-product": {
    prefix: "domains/digital-product",
    domain: "digital-product",
    visibility: "private",
    maxSizeMB: 100,
    allowedMimeTypes: ["*/*"],
    description: "Digital product files",
  },

  "domains/grocery": {
    prefix: "domains/grocery",
    domain: "grocery",
    visibility: "public",
    maxSizeMB: 20,
    allowedMimeTypes: ["image/*"],
    description: "Grocery product media",
  },
};

const COLLECTION_TO_PREFIX: Record<string, string> = {
  media: "media",
  products: "domains/commerce/products",
  "product-categories": "domains/commerce/catalogs",
  orders: "domains/commerce/orders",
  vendors: "domains/commerce/vendors",
  "charity-campaigns": "domains/charity",
  "medical-records": "domains/healthcare",
  "fleet-vehicles": "domains/fleet-logistics",
  "education-courses": "domains/education",
  "real-estate-listings": "domains/real-estate",
  "government-services": "domains/government",
  "legal-cases": "domains/legal",
  "fitness-programs": "domains/fitness",
  "pet-services": "domains/pet-service",
  "automotive-listings": "domains/automotive",
  "restaurant-menus": "domains/restaurant",
  "travel-packages": "domains/travel",
  "parking-facilities": "domains/parking",
  "utility-services": "domains/utilities",
  "insurance-policies": "domains/insurance",
  "ad-campaigns": "domains/advertising",
  "social-posts": "domains/social-commerce",
  "crowdfunding-campaigns": "domains/crowdfunding",
  "membership-plans": "domains/membership",
  "freelance-gigs": "domains/freelance",
  events: "domains/event-ticketing",
  classifieds: "domains/classified",
  auctions: "domains/auction",
  rentals: "domains/rental",
  "digital-products": "domains/digital-product",
  "grocery-products": "domains/grocery",
  "audit-logs": "system/logs",
  policies: "governance/policies",
  compliance: "governance/compliance",
  tenants: "branding/logos",
  users: "users/avatars",
};

const SYSTEM_POLICIES: Record<string, SystemPolicy> = {
  "payload-cms": {
    systemId: "payload-cms",
    prefixes: ["media", "tenants", "templates", "domains"],
    accessLevel: "public+private",
    allowedFileTypes: ["image/*", "video/*", "audio/*", "application/pdf"],
    maxSizeMB: 100,
    operations: ["read", "write", "delete", "list", "signed-url"],
  },
  medusa: {
    systemId: "medusa",
    prefixes: ["domains/commerce/products", "domains/commerce/catalogs", "media"],
    accessLevel: "public",
    allowedFileTypes: ["image/*"],
    maxSizeMB: 20,
    operations: ["read", "write", "delete", "list"],
  },
  erpnext: {
    systemId: "erpnext",
    prefixes: ["governance/policies", "governance/compliance", "system/logs"],
    accessLevel: "private",
    allowedFileTypes: ["application/pdf", "image/*", "application/msword", "text/csv"],
    maxSizeMB: 50,
    operations: ["read", "write", "list", "signed-url"],
  },
  fleetbase: {
    systemId: "fleetbase",
    prefixes: ["domains/fleet-logistics", "domains/transportation"],
    accessLevel: "private",
    allowedFileTypes: ["image/*", "application/pdf"],
    maxSizeMB: 30,
    operations: ["read", "write", "signed-url"],
  },
  temporal: {
    systemId: "temporal",
    prefixes: ["workflows", "system"],
    accessLevel: "private",
    allowedFileTypes: ["*/*"],
    maxSizeMB: 500,
    operations: ["read", "write", "delete", "list"],
  },
};

export function getPrefix(collectionSlug: string): string | undefined {
  return COLLECTION_TO_PREFIX[collectionSlug];
}

export function getPrefixEntry(prefixKey: string): PrefixEntry | undefined {
  return PREFIX_REGISTRY[prefixKey];
}

export function getSystemPolicy(systemId: string): SystemPolicy | undefined {
  return SYSTEM_POLICIES[systemId];
}

export function validateSystemAccess(
  systemId: string,
  prefix: string
): { allowed: boolean; reason?: string } {
  const policy = SYSTEM_POLICIES[systemId];
  if (!policy) {
    return { allowed: false, reason: `Unknown system: ${systemId}` };
  }
  const hasPrefix = policy.prefixes.some(
    (p) => prefix === p || prefix.startsWith(p + "/")
  );
  if (!hasPrefix) {
    return {
      allowed: false,
      reason: `System ${systemId} not authorized for prefix: ${prefix}`,
    };
  }
  return { allowed: true };
}

export function buildTenantPath(
  tenantSlug: string,
  prefix: string,
  filename: string
): string {
  return `tenants/${tenantSlug}/${prefix}/${filename}`;
}

export function buildGlobalPath(prefix: string, filename: string): string {
  return `${prefix}/${filename}`;
}

export function buildUserPath(
  tenantSlug: string,
  userId: string,
  subdir: "uploads" | "private" | "avatars",
  filename: string
): string {
  return `tenants/${tenantSlug}/users/${userId}/${subdir}/${filename}`;
}

export function parseTenantFromPath(
  path: string
): { tenantSlug: string; rest: string } | null {
  const match = path.match(/^tenants\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { tenantSlug: match[1], rest: match[2] };
}

export function getAllPrefixes(): Record<string, PrefixEntry> {
  return { ...PREFIX_REGISTRY };
}

export function getAllSystemPolicies(): Record<string, SystemPolicy> {
  return { ...SYSTEM_POLICIES };
}

export function getAllCollectionMappings(): Record<string, string> {
  return { ...COLLECTION_TO_PREFIX };
}

export function getScaffoldFolders(tenantSlug: string, activeDomains: StorageDomain[]): string[] {
  const folders: string[] = [
    `tenants/${tenantSlug}/media`,
    `tenants/${tenantSlug}/media/thumbnails`,
    `tenants/${tenantSlug}/media/cards`,
    `tenants/${tenantSlug}/media/heroes`,
    `tenants/${tenantSlug}/media/originals`,
    `tenants/${tenantSlug}/media/processed`,
    `tenants/${tenantSlug}/branding/logos`,
    `tenants/${tenantSlug}/branding/favicons`,
    `tenants/${tenantSlug}/branding/themes`,
  ];

  for (const domain of activeDomains) {
    const domainEntries = Object.values(PREFIX_REGISTRY).filter(
      (e) => e.domain === domain
    );
    for (const entry of domainEntries) {
      folders.push(`tenants/${tenantSlug}/${entry.prefix}`);
    }
  }

  return folders;
}

export function getUserScaffoldFolders(tenantSlug: string, userId: string): string[] {
  return [
    `tenants/${tenantSlug}/users/${userId}/uploads`,
    `tenants/${tenantSlug}/users/${userId}/private`,
    `tenants/${tenantSlug}/users/${userId}/avatars`,
  ];
}

export const MEDUSA_PRODUCT_PREFIX = "domains/commerce/products";
export const MEDUSA_CATALOG_PREFIX = "domains/commerce/catalogs";
export const MEDUSA_SYSTEM_ID = "medusa";
