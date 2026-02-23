/**
 * Centralized environment configuration
 * All environment-dependent values should be accessed through these functions
 */

/**
 * Get the backend URL for API requests
 * Uses VITE_BACKEND_URL environment variable with fallback
 */
export function getBackendUrl(): string {
  return (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_MEDUSA_BACKEND_URL ||
    ""
  )
}

export function getServerBaseUrl(): string {
  const isServer = typeof window === "undefined"
  if (isServer) return getBackendUrl()
  return import.meta.env.VITE_MEDUSA_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || ""
}

/**
 * Get the storefront URL
 * Uses VITE_STOREFRONT_URL environment variable with fallback
 */
export function getStorefrontUrl(): string {
  return import.meta.env.VITE_STOREFRONT_URL || ""
}

/**
 * Get Stripe publishable key
 */
export function getStripePublishableKey(): string | undefined {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!getStripePublishableKey()
}

/**
 * Get the default country code
 */
export function getDefaultCountryCode(): string {
  return import.meta.env.VITE_DEFAULT_COUNTRY || "us"
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD
}

/**
 * Get Medusa publishable API key
 */
export function getMedusaPublishableKey(): string {
  return import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || ""
}

/**
 * Get Payload CMS URL
 */
export function getPayloadCmsUrl(): string {
  return (
    import.meta.env?.VITE_PAYLOAD_CMS_URL ||
    ""
  )
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
  if (typeof window !== "undefined" && url.startsWith("/")) {
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
