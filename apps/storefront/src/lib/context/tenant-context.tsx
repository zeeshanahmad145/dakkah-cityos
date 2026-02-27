import { createContext, useContext } from "react"
import type { ReactNode } from "react"

export interface TenantConfig {
  id: string
  name: string
  slug: string
  handle: string
  domain?: string
  residencyZone: string
  defaultLocale: string
  supportedLocales: string[]
  defaultCurrency: string
  timezone: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  accentColor?: string
  fontFamily?: string
  branding?: Record<string, any>
}

export interface TenantContextValue {
  tenant: TenantConfig | null
  tenantSlug: string
  locale: string
  direction: "ltr" | "rtl"
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenantSlug: "dakkah",
  locale: "en",
  direction: "ltr",
})

export function TenantProvider({
  children,
  value,
}: {
  children: ReactNode
  value: TenantContextValue
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

const defaultTenantValue: TenantContextValue = {
  tenant: null,
  tenantSlug: "dakkah",
  locale: "en",
  direction: "ltr",
}

export function useTenant() {
  return useContext(TenantContext)
}

export function useTenantPrefix(): string {
  const { tenantSlug, locale } = useContext(TenantContext)
  return `/${tenantSlug}/${locale}`
}

export function useLocale() {
  const { locale, direction } = useContext(TenantContext)
  return { locale, direction, isRTL: direction === "rtl" }
}
