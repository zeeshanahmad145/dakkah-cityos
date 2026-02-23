/**
 * Centralized environment configuration for the storefront.
 *
 * Canonical env var names (set once in secrets / .env):
 *   MEDUSA_BACKEND_URL         — backend API origin
 *   MEDUSA_PUBLISHABLE_KEY     — publishable API key
 *
 * Vite requires the VITE_ prefix to embed values into client bundles at build
 * time.  To avoid forcing users to duplicate every var, each getter checks
 * both the canonical name (via process.env on the server) and the VITE_
 * prefixed name (via import.meta.env, available on both client and server
 * after the build).
 */

const isServer = typeof window === "undefined"

function serverEnv(key: string): string {
  if (!isServer) return ""
  if (typeof process !== "undefined") return process.env?.[key] || ""
  return ""
}

export function getBackendUrl(): string {
  return (
    import.meta.env.VITE_MEDUSA_BACKEND_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    serverEnv("MEDUSA_BACKEND_URL") ||
    serverEnv("BACKEND_URL") ||
    ""
  )
}

export function getServerBaseUrl(): string {
  if (isServer) return getBackendUrl()
  return ""
}

export function getStorefrontUrl(): string {
  return import.meta.env.VITE_STOREFRONT_URL || serverEnv("STOREFRONT_URL") || ""
}

export function getStripePublishableKey(): string | undefined {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || serverEnv("STRIPE_PUBLISHABLE_KEY") || undefined
}

export function isStripeConfigured(): boolean {
  return !!getStripePublishableKey()
}

export function getDefaultCountryCode(): string {
  return import.meta.env.VITE_DEFAULT_COUNTRY || serverEnv("DEFAULT_COUNTRY") || "us"
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

export function isProduction(): boolean {
  return import.meta.env.PROD
}

export function getMedusaPublishableKey(): string {
  return (
    import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY ||
    serverEnv("MEDUSA_PUBLISHABLE_KEY") ||
    ""
  )
}

export function getPayloadCmsUrl(): string {
  return import.meta.env.VITE_PAYLOAD_CMS_URL || serverEnv("PAYLOAD_CMS_URL") || ""
}

const DEFAULT_TIMEOUT_MS = 10000

export function fetchWithTimeout(
  url: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options || {}

  const publishableKey = getMedusaPublishableKey()
  const headers = new Headers(fetchOptions.headers)
  if (publishableKey && !headers.has("x-publishable-api-key")) {
    headers.set("x-publishable-api-key", publishableKey)
  }
  fetchOptions.headers = headers

  let resolvedUrl = url
  if (url.startsWith("/")) {
    const base = getServerBaseUrl()
    if (base) {
      resolvedUrl = `${base}${url}`
    }
  }

  const controller = new AbortController()
  const existingSignal = fetchOptions.signal
  if (existingSignal) {
    existingSignal.addEventListener("abort", () =>
      controller.abort(existingSignal.reason),
    )
  }
  const timeoutId = setTimeout(
    () => controller.abort("Request timeout"),
    timeoutMs,
  )
  return fetch(resolvedUrl, { ...fetchOptions, signal: controller.signal }).finally(
    () => clearTimeout(timeoutId),
  )
}
