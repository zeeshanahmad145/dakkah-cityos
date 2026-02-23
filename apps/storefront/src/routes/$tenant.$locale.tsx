import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { TenantProvider } from "@/lib/context/tenant-context"
import type { TenantConfig } from "@/lib/context/tenant-context"
import { PlatformContextProvider } from "@/lib/context/platform-context"
import { sdk } from "@/lib/utils/sdk"
import { useEffect, useState } from "react"

const SUPPORTED_LOCALES = ["en", "fr", "ar"]

const DEFAULT_TENANT: TenantConfig = {
  id: "01KGZ2JRYX607FWMMYQNQRKVWS",
  name: "Dakkah",
  slug: "dakkah",
  handle: "dakkah",
  residencyZone: "MENA",
  defaultLocale: "en",
  supportedLocales: ["en", "ar", "fr"],
  defaultCurrency: "sar",
  timezone: "Asia/Riyadh",
  primaryColor: "#1a5f2a",
  accentColor: "#d4af37",
}

function mapApiTenantToConfig(apiTenant: Record<string, any>): TenantConfig {
  return {
    id: apiTenant.id,
    name: apiTenant.name,
    slug: apiTenant.slug,
    handle: apiTenant.handle || apiTenant.slug,
    domain: apiTenant.domain || undefined,
    residencyZone: apiTenant.residency_zone || "MENA",
    defaultLocale: apiTenant.default_locale || "en",
    supportedLocales: apiTenant.supported_locales || ["en"],
    defaultCurrency: apiTenant.default_currency || "sar",
    timezone: apiTenant.timezone || "Asia/Riyadh",
    logoUrl: apiTenant.logo_url || undefined,
    faviconUrl: apiTenant.favicon_url || undefined,
    primaryColor: apiTenant.primary_color || undefined,
    accentColor: apiTenant.accent_color || undefined,
    fontFamily: apiTenant.font_family || undefined,
    branding: apiTenant.branding || undefined,
  }
}

export const Route = createFileRoute("/$tenant/$locale")({
  loader: async ({ params, context }) => {
    const { tenant, locale } = params
    const { queryClient } = context

    if (!SUPPORTED_LOCALES.includes(locale)) {
      throw notFound()
    }

    if (typeof window === "undefined") {
      return {
        tenant: tenant === "dakkah" ? DEFAULT_TENANT : null,
        tenantSlug: tenant,
        locale,
        direction: locale === "ar" ? "rtl" : "ltr",
        regions: null,
      }
    }

    let tenantConfig: TenantConfig | null = null
    try {
      const response = await sdk.client.fetch<{ tenant: Record<string, any> }>(`/store/cityos/tenant?slug=${encodeURIComponent(tenant)}`)
      if (response.tenant) {
        tenantConfig = mapApiTenantToConfig(response.tenant)
      }
    } catch (e) {
      // Tenant resolution failed - expected during development or initial load
    }

    if (!tenantConfig && tenant === "dakkah") {
      tenantConfig = DEFAULT_TENANT
    }

    const regions = await queryClient.ensureQueryData({
      queryKey: ["regions"],
      queryFn: async () => {
        const { listRegions } = await import("@/lib/data/regions")
        return listRegions({ fields: "currency_code, *countries" })
      },
    })

    return {
      tenant: tenantConfig,
      tenantSlug: tenant,
      locale,
      direction: locale === "ar" ? "rtl" : "ltr",
      regions,
    }
  },
  component: TenantLocaleLayout,
})

function TenantLocaleLayout() {
  const { tenant, tenantSlug, locale, direction } = Route.useLoaderData()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div dir={direction} lang={locale}>
      <TenantProvider value={{ tenant, tenantSlug, locale, direction }}>
        <PlatformContextProvider tenantSlug={tenantSlug}>
          <Outlet />
        </PlatformContextProvider>
      </TenantProvider>
    </div>
  )
}
