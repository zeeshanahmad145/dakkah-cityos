import { createFileRoute, notFound, Outlet, Link } from "@tanstack/react-router"
import { TenantProvider } from "@/lib/context/tenant-context"
import type { TenantConfig } from "@/lib/context/tenant-context"
import { PlatformContextProvider } from "@/lib/context/platform-context"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"

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

    let tenantConfig: TenantConfig | null = null

    if (typeof window !== "undefined") {
      try {
        const response = await sdk.client.fetch<{ tenant: Record<string, any> }>(`/store/cityos/tenant?slug=${encodeURIComponent(tenant)}`)
        if (response.tenant) {
          tenantConfig = mapApiTenantToConfig(response.tenant)
        }
      } catch (e) {
      }
    }

    if (!tenantConfig && tenant === "dakkah") {
      tenantConfig = DEFAULT_TENANT
    }

    if (!tenantConfig) {
      throw notFound()
    }

    let regions = null
    if (typeof window !== "undefined") {
      try {
        regions = await queryClient.ensureQueryData({
          queryKey: ["regions"],
          queryFn: async () => {
            const { listRegions } = await import("@/lib/data/regions")
            return listRegions({ fields: "currency_code, *countries" })
          },
        })
      } catch (e) {
      }
    }

    return {
      tenant: tenantConfig,
      tenantSlug: tenant,
      locale,
      direction: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
      regions,
    }
  },
  component: TenantLocaleLayout,
  notFoundComponent: () => {
    return (
      <div className="content-container py-12">
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-8xl font-light text-ds-foreground">404</h1>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-ds-foreground">Tenant Not Found</h2>
              <p className="text-ds-muted-foreground">
                The tenant or page you are looking for does not exist.
              </p>
            </div>
            <Link to="/$tenant/$locale" params={{ tenant: "dakkah", locale: "en" }}>
              <Button className="px-6 py-3" variant="primary">Go to Dakkah</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  },
})

function TenantLocaleLayout() {
  const { tenant, tenantSlug, locale, direction } = Route.useLoaderData()

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
