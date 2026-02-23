/**
 * Centralized environment configuration
 * All environment-dependent values should be accessed through these functions
 */

/**
 * Get the backend URL for API requests
 * Uses VITE_BACKEND_URL environment variable with fallback.
 * On server (Vercel SSR), also checks process.env as runtime fallback
 * since VITE_ vars are baked at build time and may be missing from cached builds.
 */
export function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_MEDUSA_BACKEND_URL ||
      (typeof process !== "undefined" && process.env?.MEDUSA_BACKEND_URL) ||
      (typeof process !== "undefined" && process.env?.BACKEND_URL) ||
      ""
    )
  }
  return (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_MEDUSA_BACKEND_URL ||
    ""
  )
}

export function getServerBaseUrl(): string {
  const isServer = typeof window === "undefined"
  if (isServer) return getBackendUrl()
  return ""
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
 * On server, also checks process.env as runtime fallback for Vercel SSR.
 */
export function getMedusaPublishableKey(): string {
  const viteKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY
  if (viteKey) return viteKey
  if (typeof window === "undefined" && typeof process !== "undefined") {
    return process.env?.MEDUSA_PUBLISHABLE_KEY || process.env?.VITE_MEDUSA_PUBLISHABLE_KEY || ""
  }
  return ""
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
