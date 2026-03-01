import { type ReactNode } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useAuth } from "@/lib/context/auth-context"
import { AuthGuard } from "@/components/auth"
import { clsx } from "clsx"
import {
  User,
  ShoppingBag,
  MapPin,
  CreditCard,
  Calendar,
  CogSixTooth,
  ChevronRight,
  Star,
  DocumentText,
  ArrowDownTray,
} from "@medusajs/icons"

interface AccountLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

type NavItem = { icon: typeof User; label: string; path: string }

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [
      { icon: User, label: "Overview", path: "" },
      { icon: ShoppingBag, label: "Orders", path: "/orders" },
      { icon: MapPin, label: "Addresses", path: "/addresses" },
      { icon: User, label: "Profile", path: "/profile" },
    ],
  },
  {
    label: "Payments & Billing",
    items: [
      { icon: CreditCard, label: "Payment Methods", path: "/payment-methods" },
      { icon: CreditCard, label: "Wallet", path: "/wallet" },
      { icon: CreditCard, label: "Store Credits", path: "/store-credits" },
      { icon: DocumentText, label: "Invoices", path: "/invoices" },
      { icon: CreditCard, label: "Installments", path: "/installments" },
    ],
  },
  {
    label: "Shopping",
    items: [
      { icon: CreditCard, label: "Subscriptions", path: "/subscriptions" },
      { icon: Calendar, label: "Bookings", path: "/bookings" },
      { icon: Star, label: "Wishlist", path: "/wishlist" },
      { icon: ArrowDownTray, label: "Downloads", path: "/downloads" },
      {
        icon: DocumentText,
        label: "Purchase Orders",
        path: "/purchase-orders",
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      { icon: Star, label: "Reviews", path: "/reviews" },
      { icon: Star, label: "Loyalty", path: "/loyalty" },
      { icon: User, label: "Referrals", path: "/referrals" },
      { icon: DocumentText, label: "Quotes", path: "/quotes" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CogSixTooth, label: "Settings", path: "/settings" },
      { icon: DocumentText, label: "Consents", path: "/consents" },
      { icon: DocumentText, label: "Disputes", path: "/disputes" },
      { icon: User, label: "Verification", path: "/verification" },
    ],
  },
]

export function AccountLayout({
  children,
  title,
  description,
}: AccountLayoutProps) {
  const location = useLocation()
  const prefix = useTenantPrefix()
  const baseHref = `${prefix}/account`
  const { customer, isB2B } = useAuth()

  const isActive = (path: string) => {
    const fullPath = `${baseHref}${path}`
    if (path === "") {
      return (
        location.pathname === baseHref || location.pathname === `${baseHref}/`
      )
    }
    return location.pathname.startsWith(fullPath)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-ds-muted">
        <div className="bg-ds-background border-b border-ds-border">
          <div className="content-container py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ds-foreground">
                  {title || `Welcome back, ${customer?.first_name || "there"}`}
                </h1>
                {description && (
                  <p className="mt-1 text-ds-muted-foreground">{description}</p>
                )}
              </div>
              {isB2B && customer?.company && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-ds-info rounded-lg">
                  <span className="text-sm font-medium text-ds-info">
                    {customer.company.name}
                  </span>
                  <span className="text-xs text-ds-info bg-ds-info px-2 py-0.5 rounded">
                    Business
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
                {navSections.map((section, sectionIndex) => (
                  <div key={section.label || "main"}>
                    {section.label && (
                      <div
                        className={clsx(
                          "px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-ds-muted-foreground",
                          sectionIndex > 0 && "border-t border-ds-border",
                        )}
                      >
                        {section.label}
                      </div>
                    )}
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.path)
                      return (
                        <Link
                          key={item.path}
                          to={`${baseHref}${item.path}` as never}
                          className={clsx(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-ds-border last:border-b-0",
                            active
                              ? "bg-ds-primary text-ds-primary-foreground"
                              : "text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                          <ChevronRight
                            className={clsx(
                              "ms-auto h-4 w-4",
                              active
                                ? "text-ds-primary-foreground"
                                : "text-ds-muted-foreground",
                            )}
                          />
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>

              {isB2B && (
                <div className="mt-4 bg-ds-background rounded-lg border border-ds-border p-4">
                  <h3 className="text-sm font-semibold text-ds-foreground mb-3">
                    Business
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to={`${prefix}/b2b/dashboard` as never}
                      className="flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                      Company Dashboard
                    </Link>
                    <Link
                      to={`${prefix}/business/catalog` as never}
                      className="flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                      Quotes
                    </Link>
                  </div>
                </div>
              )}
            </aside>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
