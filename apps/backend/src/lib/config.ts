const env = process.env

export const appConfig = {
  nodeEnv: env.NODE_ENV || "development",
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV !== "production",
  appVersion: env.APP_VERSION || "1.0.0",
  serviceName: env.SERVICE_NAME || "dakkah-cityos",
  logLevel: env.LOG_LEVEL || "info",

  urls: {
    backend: env.MEDUSA_BACKEND_URL || env.BACKEND_URL || "",
    storefront: env.STOREFRONT_URL || env.STORE_URL || "",
  },

  database: {
    url: env.NEON_DATABASE_URL || env.DATABASE_URL || "",
  },

  redis: {
    url: env.REDIS_URL || "",
    isConfigured: !!env.REDIS_URL,
  },

  emails: {
    support: env.SUPPORT_EMAIL || "support@dakkah.com",
    admin: env.ADMIN_EMAIL || "admin@dakkah.com",
    noreply: env.NOREPLY_EMAIL || "noreply@dakkah.com",
  },

  stripe: {
    apiKey: env.STRIPE_API_KEY || "",
    secretKey: env.STRIPE_SECRET_KEY || "",
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    isConfigured: !!(env.STRIPE_API_KEY || env.STRIPE_SECRET_KEY),
  },

  sendgrid: {
    apiKey: env.SENDGRID_API_KEY || "",
    isConfigured: !!env.SENDGRID_API_KEY,
  },

  sentry: {
    dsn: env.SENTRY_DSN || "",
    authToken: env.SENTRY_AUTH_TOKEN || "",
    org: env.SENTRY_ORG || "",
    project: env.SENTRY_PROJECT || "",
    isConfigured: !!env.SENTRY_DSN,
    isApiConfigured: !!(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT),
  },

  temporal: {
    endpoint: env.TEMPORAL_ENDPOINT || "",
    namespace: env.TEMPORAL_NAMESPACE || "",
    apiKey: env.TEMPORAL_API_KEY || "",
    isConfigured: !!env.TEMPORAL_API_KEY,
  },

  payloadCms: {
    url: env.PAYLOAD_CMS_URL_DEV || env.PAYLOAD_CMS_URL || "",
    apiKey: env.PAYLOAD_API_KEY || "",
    webhookSecret: env.PAYLOAD_CMS_WEBHOOK_SECRET || env.PAYLOAD_WEBHOOK_SECRET || "",
    isConfigured: !!(env.PAYLOAD_CMS_URL_DEV || env.PAYLOAD_CMS_URL),
  },

  erpnext: {
    url: env.ERPNEXT_URL_DEV || "",
    apiKey: env.ERPNEXT_API_KEY || "",
    apiSecret: env.ERPNEXT_API_SECRET || "",
    webhookSecret: env.ERPNEXT_WEBHOOK_SECRET || "",
    isConfigured: !!(env.ERPNEXT_API_KEY && env.ERPNEXT_URL_DEV),
  },

  fleetbase: {
    url: env.FLEETBASE_URL_DEV || "",
    apiKey: env.FLEETBASE_API_KEY || "",
    orgId: env.FLEETBASE_ORG_ID || "",
    webhookSecret: env.FLEETBASE_WEBHOOK_SECRET || "",
    isConfigured: !!env.FLEETBASE_API_KEY,
  },

  waltid: {
    url: env.WALTID_URL_DEV || "",
    apiKey: env.WALTID_API_KEY || "",
    issuerDid: env.WALTID_ISSUER_DID || "",
    isConfigured: !!env.WALTID_API_KEY,
  },

  meilisearch: {
    host: env.MEILISEARCH_HOST || "",
    isConfigured: !!env.MEILISEARCH_HOST,
  },

  storage: {
    provider: env.STORAGE_PROVIDER || "vercel-blob",
    blobToken: env.BLOB_READ_WRITE_TOKEN || "",
    blobStoreUrl: env.VERCEL_BLOB_STORE_URL || "",
    replitBucketId: env.REPLIT_BUCKET_ID || env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "",
    privateObjectDir: env.PRIVATE_OBJECT_DIR || "",
    publicObjectSearchPaths: env.PUBLIC_OBJECT_SEARCH_PATHS || "",
    isBlobConfigured: !!env.BLOB_READ_WRITE_TOKEN,
  },

  tenant: {
    defaultId: env.DEFAULT_TENANT_ID || env.CITYOS_DEFAULT_TENANT || "dakkah",
  },

  subscription: {
    maxPaymentRetries: parseInt(env.MAX_PAYMENT_RETRIES || "3", 10),
    gracePeriodDays: parseInt(env.GRACE_PERIOD_DAYS || "7", 10),
    trialDays: parseInt(env.DEFAULT_TRIAL_DAYS || "14", 10),
    renewalReminderDays: [7, 3, 1],
  },

  booking: {
    checkInWindowMinutes: parseInt(env.BOOKING_CHECKIN_WINDOW || "30", 10),
    noShowGracePeriodMinutes: parseInt(env.BOOKING_NOSHOW_GRACE || "15", 10),
    cancellationHoursNotice: parseInt(env.BOOKING_CANCEL_NOTICE_HOURS || "24", 10),
  },

  vendor: {
    inactiveDaysWarning: parseInt(env.VENDOR_INACTIVE_WARNING_DAYS || "30", 10),
    inactiveDaysDeactivate: parseInt(env.VENDOR_INACTIVE_DEACTIVATE_DAYS || "60", 10),
    commissionPercentDefault: parseFloat(env.DEFAULT_COMMISSION_PERCENT || "10"),
  },

  b2b: {
    quoteExpiryDays: parseInt(env.QUOTE_EXPIRY_DAYS || "30", 10),
    invoiceDueDays: parseInt(env.INVOICE_DUE_DAYS || "30", 10),
    defaultPaymentTerms: env.DEFAULT_PAYMENT_TERMS || "net_30",
  },

  features: {
    enableStripeConnect: env.ENABLE_STRIPE_CONNECT === "true",
    enableEmailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS !== "false",
    enableAdminNotifications: env.ENABLE_ADMIN_NOTIFICATIONS !== "false",
  },
}

export type AppConfig = typeof appConfig
