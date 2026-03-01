import { type ReactNode, useState, useEffect } from "react"
import { useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { Link } from "@tanstack/react-router"
import { RoleGuard } from "./role-guard"
import { ManageSidebar } from "./manage-sidebar"
import { ManageHeader } from "./manage-header"
import { ArrowLeftMini, BuildingStorefront } from "@medusajs/icons"

interface ManageLayoutProps {
  children: ReactNode
  locale?: string
}

export function ManageLayout({
  children,
  locale: localeProp,
}: ManageLayoutProps) {
  const { locale: ctxLocale, tenantSlug } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <RoleGuard locale={locale}>
      <ManageLayoutClient locale={locale} tenantSlug={tenantSlug}>
        {children}
      </ManageLayoutClient>
    </RoleGuard>
  )
}

function ManageLayoutClient({
  children,
  locale,
  tenantSlug,
}: {
  children: ReactNode
  locale: string
  tenantSlug: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sidebarOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSidebarOpen(false)
      }
      document.addEventListener("keydown", handleEsc)
      return () => document.removeEventListener("keydown", handleEsc)
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-ds-muted/50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 w-[216px] bg-ds-card border-e border-ds-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen
            ? "translate-x-0"
            : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="h-12 px-4 flex items-center border-b border-ds-border/50">
          <Link
            to={`/${tenantSlug}/${locale}/manage` as never}
            className="flex items-center gap-2.5"
          >
            <div className="w-6 h-6 rounded-md bg-ds-primary flex items-center justify-center">
              <BuildingStorefront className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-[13px] text-ds-foreground">
              Dakkah
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <ManageSidebar
            locale={locale}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>
        <div className="px-3 py-3 border-t border-ds-border/50">
          <Link
            to={`/${tenantSlug}/${locale}` as never}
            className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-ds-muted-foreground/70 hover:text-ds-muted-foreground rounded-md transition-colors"
          >
            <ArrowLeftMini className="w-3.5 h-3.5 flex-shrink-0 rtl:rotate-180" />
            {t(locale, "manage.back_to_store")}
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <ManageHeader
          locale={locale}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 px-6 py-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
