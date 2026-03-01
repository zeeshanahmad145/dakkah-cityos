import { type ReactNode } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { RBAC_ROLE_WEIGHTS, type RbacRole } from "@/lib/types/tenant-admin"
import { Link } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { useQuery } from "@tanstack/react-query"
import { LoginForm } from "@/components/auth/login-form"
import { BuildingStorefront } from "@medusajs/icons"

const MIN_MANAGE_WEIGHT = 20

interface RoleGuardProps {
  children: ReactNode
  locale?: string
  requiredWeight?: number
}

function resolveRole(
  tenantUserRole: RbacRole | null,
  customerMetadataRole: RbacRole | null,
): RbacRole | null {
  if (tenantUserRole && tenantUserRole in RBAC_ROLE_WEIGHTS)
    return tenantUserRole
  if (customerMetadataRole && customerMetadataRole in RBAC_ROLE_WEIGHTS)
    return customerMetadataRole
  return null
}

function useTenantUserRole(tenantSlug: string, customerId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-user-role", tenantSlug, customerId],
    queryFn: async () => {
      try {
        const response = await sdk.client.fetch(
          `/platform/context?tenant=${encodeURIComponent(tenantSlug)}`,
          { method: "GET" },
        )
        const data = response as any
        const userRole = data?.user?.role || data?.tenantUser?.role
        if (userRole && userRole in RBAC_ROLE_WEIGHTS) {
          return userRole as RbacRole
        }
        return null
      } catch {
        return null
      }
    },
    enabled: !!customerId && !!tenantSlug,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

function LoadingState({ locale }: { locale: string }) {
  return (
    <div className="min-h-screen bg-ds-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-ds-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-ds-muted-foreground">
          {t(locale, "common.loading")}
        </p>
      </div>
    </div>
  )
}

function LoginRequired({
  locale,
  tenantSlug,
}: {
  locale: string
  tenantSlug: string
}) {
  return (
    <div className="min-h-screen bg-ds-background flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="bg-ds-card rounded-xl shadow-sm p-8 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-lg bg-ds-primary flex items-center justify-center">
              <BuildingStorefront className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-semibold text-ds-foreground">
                Dakkah CityOS
              </h1>
              <p className="text-[13px] text-ds-muted-foreground">
                {t(locale, "manage.log_in_subtitle")}
              </p>
            </div>
          </div>

          <LoginForm />

          <div className="pt-4 border-t border-ds-border text-center">
            <Link
              to={`/${tenantSlug}/${locale}` as never}
              className="text-[13px] text-ds-muted-foreground hover:text-ds-foreground transition-colors"
            >
              {t(locale, "manage.back_to_store")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessDenied({
  locale,
  tenantSlug,
}: {
  locale: string
  tenantSlug: string
}) {
  return (
    <div className="min-h-screen bg-ds-background flex items-center justify-center px-4">
      <div className="bg-ds-card rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 bg-ds-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-ds-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "manage.access_denied")}
        </h2>
        <p className="text-ds-muted-foreground text-[13px]">
          {t(locale, "manage.unauthorized_message")}
        </p>
        <p className="text-ds-muted-foreground/70 text-xs">
          {t(locale, "manage.role_required")}
        </p>
        <Link
          to={`/${tenantSlug}/${locale}` as never}
          className="inline-block px-6 py-2 bg-ds-primary hover:bg-ds-primary/90 text-white rounded-lg text-[13px] font-medium transition-colors"
        >
          {t(locale, "manage.back_to_store")}
        </Link>
      </div>
    </div>
  )
}

function AuthenticatedRoleCheck({
  children,
  locale,
  tenantSlug,
  customer,
  requiredWeight,
}: {
  children: ReactNode
  locale: string
  tenantSlug: string
  customer: any
  requiredWeight: number
}) {
  const { data: tenantRole, isLoading: isRoleLoading } = useTenantUserRole(
    tenantSlug,
    customer?.id,
  )
  const metadataRole = customer?.metadata?.role as RbacRole | undefined
  const role = resolveRole(
    tenantRole ?? null,
    metadataRole && metadataRole in RBAC_ROLE_WEIGHTS ? metadataRole : null,
  )
  const weight = role ? RBAC_ROLE_WEIGHTS[role] : 0

  if (isRoleLoading) {
    return <LoadingState locale={locale} />
  }

  if (weight < requiredWeight) {
    return <AccessDenied locale={locale} tenantSlug={tenantSlug} />
  }

  return <>{children}</>
}

export function RoleGuard({
  children,
  locale: localeProp,
  requiredWeight = MIN_MANAGE_WEIGHT,
}: RoleGuardProps) {
  const { locale: ctxLocale, tenantSlug } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const { customer, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <LoadingState locale={locale} />
  }

  if (!isAuthenticated) {
    return <LoginRequired locale={locale} tenantSlug={tenantSlug} />
  }

  return (
    <AuthenticatedRoleCheck
      locale={locale}
      tenantSlug={tenantSlug}
      customer={customer}
      requiredWeight={requiredWeight}
    >
      {children}
    </AuthenticatedRoleCheck>
  )
}

export function useManageRole() {
  const { customer } = useAuth()
  const { tenantSlug } = useTenant()
  const { data: tenantRole } = useTenantUserRole(tenantSlug, customer?.id)
  const metadataRole = customer?.metadata?.role as RbacRole | undefined
  const role = resolveRole(
    tenantRole ?? null,
    metadataRole && metadataRole in RBAC_ROLE_WEIGHTS ? metadataRole : null,
  )
  const weight = role ? RBAC_ROLE_WEIGHTS[role] : 0
  return {
    role,
    weight,
    hasAccess: weight >= MIN_MANAGE_WEIGHT,
    isSuperAdmin: role === "super-admin",
    isManager: weight >= 70,
  }
}
