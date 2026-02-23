import Medusa from "@medusajs/js-sdk"
import { getBackendUrl, getMedusaPublishableKey } from "@/lib/utils/env"

const isServer = typeof window === "undefined"
const MEDUSA_BACKEND_URL = isServer ? getBackendUrl() : ""
const PUBLISHABLE_KEY = getMedusaPublishableKey()

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: false,
  publishableKey: PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
  },
})

const originalFetch = sdk.client.fetch.bind(sdk.client)
sdk.client.fetch = async (...args: any[]) => {
  const [path, options = {}] = args

  const headers = (options.headers || {}) as Record<string, string>

  if (PUBLISHABLE_KEY && !headers["x-publishable-api-key"]) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }

  options.headers = headers
  return originalFetch(path, options)
}
