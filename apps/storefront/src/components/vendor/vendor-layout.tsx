import { type ReactNode, useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { AuthGuard } from "@/components/auth"
import { clsx } from "clsx"
import {
  ShoppingBag,
  CreditCard,
  Calendar,
  Star,
  User,
  CogSixTooth,
  ChevronRight,
  ChevronDown,
} from "@medusajs/icons"

interface VendorLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

type NavItem = { icon: typeof User; label: string; path: string }
type NavSection = { label: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { icon: ShoppingBag, label: "Dashboard", path: "" },
      { icon: Star, label: "Analytics", path: "/analytics" },
      { icon: Star, label: "Reviews", path: "/reviews" },
      { icon: CreditCard, label: "Commissions", path: "/commissions" },
      { icon: CreditCard, label: "Transactions", path: "/transactions" },
      { icon: CreditCard, label: "Invoices", path: "/invoices" },
      { icon: CreditCard, label: "Wallet", path: "/wallet" },
    ],
  },
  {
    label: "Products & Inventory",
    items: [
      { icon: ShoppingBag, label: "Products", path: "/products" },
      { icon: ShoppingBag, label: "Bundles", path: "/bundles" },
      {
        icon: ShoppingBag,
        label: "Digital Products",
        path: "/digital-products",
      },
      { icon: ShoppingBag, label: "Inventory", path: "/inventory" },
      {
        icon: ShoppingBag,
        label: "Inventory Extension",
        path: "/inventory-extension",
      },
      { icon: ShoppingBag, label: "Print on Demand", path: "/print-on-demand" },
    ],
  },
  {
    label: "Orders & Fulfillment",
    items: [
      { icon: ShoppingBag, label: "Orders", path: "/orders" },
      { icon: CreditCard, label: "Payouts", path: "/payouts" },
      {
        icon: CogSixTooth,
        label: "Shipping Extension",
        path: "/shipping-extension",
      },
      { icon: CogSixTooth, label: "Shipping Rules", path: "/shipping-rules" },
      { icon: CogSixTooth, label: "Cart Extension", path: "/cart-extension" },
      { icon: CogSixTooth, label: "Cart Rules", path: "/cart-rules" },
    ],
  },
  {
    label: "Services & Verticals",
    items: [
      { icon: Calendar, label: "Bookings", path: "/bookings" },
      { icon: Calendar, label: "Events", path: "/events" },
      { icon: Calendar, label: "Event Ticketing", path: "/event-ticketing" },
      { icon: Star, label: "Auctions", path: "/auctions" },
      { icon: Calendar, label: "Rentals", path: "/rentals" },
      { icon: ShoppingBag, label: "Restaurants", path: "/restaurants" },
      { icon: User, label: "Freelance", path: "/freelance" },
      { icon: User, label: "Fitness", path: "/fitness" },
      { icon: User, label: "Healthcare", path: "/healthcare" },
      { icon: User, label: "Education", path: "/education" },
      { icon: CogSixTooth, label: "Automotive", path: "/automotive" },
      { icon: ShoppingBag, label: "Real Estate", path: "/real-estate" },
      { icon: User, label: "Pet Service", path: "/pet-service" },
      { icon: CogSixTooth, label: "Parking", path: "/parking" },
      { icon: Calendar, label: "Travel", path: "/travel" },
      { icon: CreditCard, label: "Insurance", path: "/insurance" },
      { icon: CogSixTooth, label: "Government", path: "/government" },
      { icon: ShoppingBag, label: "Grocery", path: "/grocery" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { icon: Star, label: "Advertising", path: "/advertising" },
      { icon: User, label: "Affiliate", path: "/affiliate" },
      { icon: Star, label: "Social Commerce", path: "/social-commerce" },
      { icon: Star, label: "Flash Sales", path: "/flash-sales" },
      { icon: Star, label: "Flash Deals", path: "/flash-deals" },
      { icon: CreditCard, label: "Crowdfunding", path: "/crowdfunding" },
      { icon: Star, label: "Charity", path: "/charity" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: CreditCard, label: "Credit", path: "/credit" },
      {
        icon: CreditCard,
        label: "Financial Product",
        path: "/financial-product",
      },
      { icon: CreditCard, label: "Volume Pricing", path: "/volume-pricing" },
      { icon: CreditCard, label: "Volume Deals", path: "/volume-deals" },
      { icon: CreditCard, label: "Subscriptions", path: "/subscriptions" },
      { icon: Star, label: "Loyalty", path: "/loyalty" },
      { icon: User, label: "Memberships", path: "/memberships" },
      { icon: CreditCard, label: "Gift Cards", path: "/gift-cards" },
      { icon: CogSixTooth, label: "Tax Config", path: "/tax-config" },
    ],
  },
  {
    label: "Other",
    items: [
      { icon: ShoppingBag, label: "B2B", path: "/b2b" },
      { icon: ShoppingBag, label: "Classified", path: "/classified" },
      { icon: ShoppingBag, label: "Consignments", path: "/consignments" },
      { icon: ShoppingBag, label: "Dropshipping", path: "/dropshipping" },
      { icon: ShoppingBag, label: "Trade-in", path: "/trade-in" },
      {
        icon: ShoppingBag,
        label: "Try Before You Buy",
        path: "/try-before-you-buy",
      },
      { icon: CogSixTooth, label: "Warranty", path: "/warranty" },
      { icon: ShoppingBag, label: "White Label", path: "/white-label" },
      { icon: Star, label: "Wishlists", path: "/wishlists" },
      { icon: Star, label: "Newsletter", path: "/newsletter" },
      {
        icon: CogSixTooth,
        label: "Notification Preferences",
        path: "/notification-preferences",
      },
      { icon: Star, label: "Disputes", path: "/disputes" },
      { icon: CogSixTooth, label: "Legal", path: "/legal" },
      { icon: CreditCard, label: "Quotes", path: "/quotes" },
    ],
  },
]

function sectionContainsActivePath(
  section: NavSection,
  baseHref: string,
  pathname: string,
): boolean {
  return section.items.some((item) => {
    if (item.path === "") {
      return pathname === baseHref || pathname === `${baseHref}/`
    }
    return pathname.startsWith(`${baseHref}${item.path}`)
  })
}

export function VendorLayout({
  children,
  title,
  description,
}: VendorLayoutProps) {
  const location = useLocation()
  const prefix = useTenantPrefix()
  const baseHref = `${prefix}/vendor`

  const isActive = (path: string) => {
    const fullPath = `${baseHref}${path}`
    if (path === "") {
      return (
        location.pathname === baseHref || location.pathname === `${baseHref}/`
      )
    }
    return location.pathname.startsWith(fullPath)
  }

  const initialOpen = navSections.reduce<Record<string, boolean>>(
    (acc, section) => {
      if (section.label === "Main") {
        acc[section.label] = true
      } else {
        acc[section.label] = sectionContainsActivePath(
          section,
          baseHref,
          location.pathname,
        )
      }
      return acc
    },
    {},
  )

  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(initialOpen)

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-ds-muted">
        <div className="bg-ds-background border-b border-ds-border">
          <div className="content-container py-8">
            <div>
              <h1 className="text-2xl font-bold text-ds-foreground">
                {title || "Vendor Dashboard"}
              </h1>
              {description && (
                <p className="mt-1 text-ds-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="content-container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
                {navSections.map((section, sectionIndex) => {
                  const isOpen = openSections[section.label] ?? false
                  return (
                    <div key={section.label}>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.label)}
                        className={clsx(
                          "w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ds-muted-foreground hover:bg-ds-muted transition-colors",
                          sectionIndex > 0 && "border-t border-ds-border",
                        )}
                      >
                        {section.label}
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isOpen &&
                        section.items.map((item) => {
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
                  )
                })}
              </nav>
            </aside>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
