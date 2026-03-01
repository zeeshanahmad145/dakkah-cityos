import { Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useFeatures } from "../../lib/context/feature-context"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface DynamicFooterProps {
  categories?: Array<{ id: string; name: string; handle: string }>
}

export function DynamicFooter({ categories = [] }: DynamicFooterProps) {
  const { getNavigation, isEnabled } = useFeatures()
  const prefix = useTenantPrefix()
  const navigation = getNavigation()
  const { footer } = navigation
  const [year, setYear] = useState<string>("")
  useEffect(() => {
    setYear(new Date().getFullYear().toString())
  }, [])

  const sections: Array<{
    title: string
    links: Array<{ label: string; href: string }>
  }> = []

  if (footer.showCategories && categories.length > 0) {
    sections.push({
      title: "Shop",
      links: categories.slice(0, 6).map((cat) => ({
        label: cat.name,
        href: `${prefix}/categories/${cat.handle}`,
      })),
    })
  }

  if (footer.showVendors && isEnabled("marketplace")) {
    sections.push({
      title: "Marketplace",
      links: [
        { label: "Browse Vendors", href: `${prefix}/vendors` },
        { label: "Become a Vendor", href: `${prefix}/vendor/register` },
      ],
    })
  }

  if (footer.showServices && isEnabled("bookings")) {
    sections.push({
      title: "Services",
      links: [
        { label: "Browse Services", href: `${prefix}/services` },
        { label: "Book Appointment", href: `${prefix}/bookings` },
      ],
    })
  }

  const customerLinks = [
    { label: "My Account", href: `${prefix}/account` },
    { label: "Order History", href: `${prefix}/account/orders` },
  ]

  if (isEnabled("wishlists")) {
    customerLinks.push({
      label: "Wishlist",
      href: `${prefix}/account/wishlist`,
    })
  }

  if (isEnabled("subscriptions")) {
    customerLinks.push({
      label: "Subscriptions",
      href: `${prefix}/account/subscriptions`,
    })
  }

  if (isEnabled("b2b")) {
    customerLinks.push({
      label: "Business Portal",
      href: `${prefix}/b2b/dashboard`,
    })
  }

  sections.push({
    title: "Account",
    links: customerLinks,
  })

  sections.push({
    title: "Help",
    links: [
      { label: "Contact Us", href: `${prefix}/help` },
      { label: "Shipping Info", href: `${prefix}/shipping` },
      { label: "Returns", href: `${prefix}/returns` },
      { label: "FAQ", href: `${prefix}/help` },
    ],
  })

  footer.customSections?.forEach((section) => {
    sections.push({
      title: section.title,
      links: (section.links || []).map((link) => ({
        label: link.label,
        href: link.href.startsWith("/") ? `${prefix}${link.href}` : link.href,
      })),
    })
  })

  return (
    <footer className="bg-ds-primary text-ds-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to={`${prefix}` as never} className="text-xl font-bold">
              Store
            </Link>
            <p className="mt-4 text-ds-muted-foreground text-sm">
              Your one-stop shop for quality products and services.
            </p>
          </div>

          {sections.map((section, index) => (
            <div key={index}>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {(section.links || []).map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.href}
                      className="text-ds-muted-foreground hover:text-ds-primary-foreground text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-ds-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-ds-muted-foreground text-sm">
              {year || ""} Store. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to={`${prefix}/privacy` as never}
                className="text-ds-muted-foreground hover:text-ds-primary-foreground text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to={`${prefix}/terms` as never}
                className="text-ds-muted-foreground hover:text-ds-primary-foreground text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
