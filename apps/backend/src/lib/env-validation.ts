import { appConfig } from "./config"

interface EnvVarConfig {
  key: string
  required: boolean
  description: string
  fallbackBehavior?: string
  configPath?: string
}

const ENV_VARS: EnvVarConfig[] = [
  { key: "DATABASE_URL", required: false, description: "PostgreSQL connection string (fallback)", configPath: "database.url" },
  { key: "NEON_DATABASE_URL", required: false, description: "Neon PostgreSQL connection string (primary)", configPath: "database.url" },
  { key: "VITE_MEDUSA_PUBLISHABLE_KEY", required: true, description: "Medusa publishable API key" },
  { key: "STRIPE_API_KEY", required: false, description: "Stripe API key for payments", fallbackBehavior: "Payment processing disabled" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, description: "Stripe webhook signature verification", fallbackBehavior: "Webhook verification disabled" },
  { key: "SENDGRID_API_KEY", required: false, description: "SendGrid API key for email notifications", fallbackBehavior: "Email notifications disabled" },
  { key: "PAYLOAD_CMS_URL_DEV", required: false, description: "Payload CMS URL", fallbackBehavior: "CMS hierarchy sync disabled" },
  { key: "PAYLOAD_API_KEY", required: false, description: "Payload CMS API key", fallbackBehavior: "CMS hierarchy sync disabled" },
  { key: "ERPNEXT_URL_DEV", required: false, description: "ERPNext URL", fallbackBehavior: "ERPNext sync disabled" },
  { key: "ERPNEXT_API_KEY", required: false, description: "ERPNext API key", fallbackBehavior: "ERPNext sync disabled" },
  { key: "ERPNEXT_API_SECRET", required: false, description: "ERPNext API secret", fallbackBehavior: "ERPNext sync disabled" },
  { key: "TEMPORAL_ADDRESS", required: false, description: "Temporal Cloud address", fallbackBehavior: "Workflow orchestration disabled" },
  { key: "FLEETBASE_API_KEY", required: false, description: "Fleetbase API key", fallbackBehavior: "Logistics/geo features disabled" },
  { key: "WALTID_API_KEY", required: false, description: "Walt.id API key", fallbackBehavior: "Digital identity features disabled" },
  { key: "REDIS_URL", required: false, description: "Redis URL", fallbackBehavior: "Using in-memory fallback (not production-ready)" },
  { key: "MEILISEARCH_HOST", required: false, description: "Meilisearch host", fallbackBehavior: "Search functionality disabled" },
  { key: "SENTRY_DSN", required: false, description: "Sentry DSN for error monitoring", fallbackBehavior: "Error monitoring disabled" },
]

function maskUrl(url: string): string {
  if (!url) return "(not set)"
  try {
    const u = new URL(url)
    const maskedPassword = u.password ? "****" : ""
    const host = u.hostname
    const dbName = u.pathname.replace("/", "") || "(default)"
    return `${u.protocol}//${u.username}:${maskedPassword}@${host}${u.port ? ":" + u.port : ""}/${dbName}${u.searchParams.has("sslmode") ? "?sslmode=" + u.searchParams.get("sslmode") : ""}`
  } catch {
    return url.substring(0, 20) + "..."
  }
}

function getDatabaseSource(): { source: string; url: string } {
  const env = process.env
  if (env.NEON_DATABASE_URL) {
    return { source: "Neon (external/production)", url: env.NEON_DATABASE_URL }
  }
  if (env.DATABASE_URL) {
    return { source: "Replit PostgreSQL (heliumdb/local)", url: env.DATABASE_URL }
  }
  return { source: "NONE — no database configured!", url: "" }
}

export function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[]; summary: string } {
  const missing: string[] = []
  const warnings: string[] = []
  const lines: string[] = []

  lines.push("╔══════════════════════════════════════════════════════════════╗")
  lines.push("║        Dakkah CityOS Commerce Platform — Startup           ║")
  lines.push("╠══════════════════════════════════════════════════════════════╣")

  const dbInfo = getDatabaseSource()
  lines.push(`║  Database Source : ${dbInfo.source}`)
  lines.push(`║  Database URL   : ${maskUrl(dbInfo.url)}`)
  lines.push(`║  Environment    : ${appConfig.nodeEnv}`)
  lines.push(`║  Service        : ${appConfig.serviceName} v${appConfig.appVersion}`)
  lines.push("╠══════════════════════════════════════════════════════════════╣")
  lines.push("║  Environment Variable Status:                              ║")

  if (!dbInfo.url) {
    missing.push("DATABASE_URL or NEON_DATABASE_URL")
  }

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key]
    if (envVar.key === "DATABASE_URL" || envVar.key === "NEON_DATABASE_URL") continue

    if (!value || value.trim() === "") {
      if (envVar.required) {
        missing.push(envVar.key)
        lines.push(`║  [MISSING]  ${envVar.key} — ${envVar.description}`)
      } else {
        warnings.push(envVar.key)
        lines.push(`║  [  --  ]   ${envVar.key} — ${envVar.fallbackBehavior || "Feature limited"}`)
      }
    } else {
      lines.push(`║  [  OK  ]   ${envVar.key}`)
    }
  }

  lines.push("╠══════════════════════════════════════════════════════════════╣")

  const integrations = [
    { name: "Stripe Payments", configured: appConfig.stripe.isConfigured },
    { name: "SendGrid Email", configured: appConfig.sendgrid.isConfigured },
    { name: "Redis Cache/Events", configured: appConfig.redis.isConfigured },
    { name: "Sentry Monitoring", configured: appConfig.sentry.isConfigured },
    { name: "Payload CMS", configured: appConfig.payloadCms.isConfigured },
    { name: "ERPNext", configured: appConfig.erpnext.isConfigured },
    { name: "Temporal Workflows", configured: appConfig.temporal.isConfigured },
    { name: "Fleetbase Logistics", configured: appConfig.fleetbase.isConfigured },
    { name: "Walt.id Identity", configured: appConfig.waltid.isConfigured },
    { name: "Meilisearch", configured: appConfig.meilisearch.isConfigured },
  ]

  lines.push("║  Integration Status:                                       ║")
  for (const i of integrations) {
    lines.push(`║    ${i.configured ? "[ACTIVE]" : "[  --  ]"}  ${i.name}`)
  }

  lines.push("╠══════════════════════════════════════════════════════════════╣")

  if (missing.length > 0) {
    lines.push(`║  RESULT: ${missing.length} REQUIRED variable(s) missing!`)
    lines.push(`║  Missing: ${missing.join(", ")}`)
  } else {
    lines.push(`║  RESULT: All required variables loaded`)
  }
  if (warnings.length > 0) {
    lines.push(`║  ${warnings.length} optional variable(s) not set (features limited)`)
  }

  lines.push("╚══════════════════════════════════════════════════════════════╝")

  const summary = lines.join("\n")
  return { valid: missing.length === 0, missing, warnings, summary }
}

export async function validateDatabaseConnection(): Promise<{ connected: boolean; tableCount?: number; error?: string }> {
  const dbUrl = appConfig.database.url
  if (!dbUrl) {
    return { connected: false, error: "No database URL configured" }
  }

  try {
    const { Client } = await import("pg")
    const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 })
    await client.connect()

    const result = await client.query(
      "SELECT count(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public'"
    )
    const tableCount = result.rows[0]?.table_count || 0

    const versionResult = await client.query("SELECT version()")
    const pgVersion = versionResult.rows[0]?.version?.split(",")[0] || "unknown"

    await client.end()

    return { connected: true, tableCount }
  } catch (err: any) {
    return { connected: false, error: err.message || String(err) }
  }
}
