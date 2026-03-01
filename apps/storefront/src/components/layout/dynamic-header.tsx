import { Link } from "@tanstack/react-router"
import { useFeatures } from "../../lib/context/feature-context"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { ShoppingBag, User, XMark, ChevronDownMini } from "@medusajs/icons"
import { useState } from "react"

interface DynamicHeaderProps {
  categories?: Array<{ id: string; name: string; handle: string }>
  cartItemCount?: number
  isLoggedIn?: boolean
}

export function DynamicHeader({
  categories = [],
  cartItemCount = 0,
  isLoggedIn = false,
}: DynamicHeaderProps) {
  const { getNavigation, isEnabled } = useFeatures()
  const prefix = useTenantPrefix()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navigation = getNavigation()
  const { header } = navigation

  const navItems: Array<{
    label: string
    href: string
    children?: Array<{ label: string; href: string }>
  }> = []

  if (header.showCategories && categories.length > 0) {
    navItems.push({
      label: "Shop",
      href: `${prefix}/categories`,
      children: categories.map((cat) => ({
        label: cat.name,
        href: `${prefix}/categories/${cat.handle}`,
      })),
    })
  }

  if (header.showVendors && isEnabled("marketplace")) {
    navItems.push({
      label: "Vendors",
      href: `${prefix}/vendors`,
    })
  }

  if (header.showServices && isEnabled("bookings")) {
    navItems.push({
      label: "Services",
      href: `${prefix}/services`,
    })
  }

  if (header.showB2BPortal && isEnabled("b2b")) {
    navItems.push({
      label: "Business",
      href: `${prefix}/b2b/dashboard`,
    })
  }

  navItems.push({
    label: "Browse",
    href: "#",
    children: [
      { label: "Restaurants", href: `${prefix}/restaurants` },
      { label: "Real Estate", href: `${prefix}/real-estate` },
      { label: "Automotive", href: `${prefix}/automotive` },
      { label: "Healthcare", href: `${prefix}/healthcare` },
      { label: "Education", href: `${prefix}/education` },
      { label: "Events", href: `${prefix}/events` },
      { label: "Travel", href: `${prefix}/travel` },
      { label: "Fitness", href: `${prefix}/fitness` },
      { label: "Grocery", href: `${prefix}/grocery` },
      { label: "Rentals", href: `${prefix}/rentals` },
      { label: "Freelance", href: `${prefix}/freelance` },
      { label: "Digital Products", href: `${prefix}/digital-products` },
    ],
  })

  header.customLinks?.forEach((link) => {
    navItems.push({
      label: link.label,
      href: link.href.startsWith("/") ? `${prefix}${link.href}` : link.href,
    })
  })

  return (
    <header className="bg-ds-background border-b border-ds-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={`${prefix}` as never} className="flex-shrink-0">
            <span className="text-xl font-bold">Store</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() =>
                  item.children && setActiveDropdown(item.label)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.href}
                  className="flex items-center text-ds-foreground hover:text-ds-foreground text-sm font-medium"
                >
                  {item.label}
                  {item.children && (
                    <ChevronDownMini className="ms-1 h-4 w-4" />
                  )}
                </Link>

                {item.children && activeDropdown === item.label && (
                  <div className="absolute start-0 mt-2 w-48 bg-ds-background rounded-md shadow-lg py-1 z-50">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        to={child.href}
                        className="block px-4 py-2 text-sm text-ds-foreground hover:bg-ds-muted"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to={isLoggedIn ? `${prefix}/account` : `${prefix}/login`} {...({} as any)} {...{} as any}
              className="text-ds-foreground hover:text-ds-foreground"
            >
              <User className="h-6 w-6" />
            </Link>

            <Link
              to={`${prefix}/cart` as never}
              className="text-ds-foreground hover:text-ds-foreground relative"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-black text-ds-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden text-ds-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMark className="h-6 w-6" />
              ) : (
                <span className="text-2xl">&#9776;</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-ds-border">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item, index) => (
              <div key={index}>
                <Link
                  to={item.href}
                  className="block py-2 text-ds-foreground hover:text-ds-foreground font-medium"
                  onClick={() => !item.children && setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ps-4 space-y-1">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        to={child.href}
                        className="block py-1 text-sm text-ds-muted-foreground hover:text-ds-foreground"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
