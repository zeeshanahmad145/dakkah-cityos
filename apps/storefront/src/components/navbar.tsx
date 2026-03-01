import { CartDropdown } from "@/components/cart"
import { UserMenu } from "@/components/auth"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useCategories } from "@/lib/hooks/use-categories"
import { useCMSNavigation } from "@/lib/hooks/use-cms"
import { useAuth } from "@/lib/context/auth-context"
import { getTenantLocalePrefix } from "@/lib/utils/region"
import LocaleSwitcher from "@/components/layout/locale-switcher"
import { SearchModal } from "@/components/search"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { Link, useLocation } from "@tanstack/react-router"
import { useState, useEffect } from "react"

export const Navbar = () => {
  const location = useLocation()
  const baseHref = getTenantLocalePrefix(location.pathname)
  const [openMobileSections, setOpenMobileSections] = useState<
    Record<string, boolean>
  >({})
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data: topLevelCategories } = useCategories({
    fields: "id,name,handle,parent_category_id",
    queryParams: { parent_category_id: "null" },
  })

  const { data: headerNav } = useCMSNavigation("header")

  const navGroups =
    headerNav?.items
      ?.sort((a, b) => a.order - b.order)
      .map((item) => ({
        label: item.label,
        items: (item.children ?? [])
          .sort((a, b) => a.order - b.order)
          .map((child) => ({
            name: child.label,
            href: child.url,
          })),
      })) ?? []

  const categoryLinks = [
    { id: "shop-all", name: "Shop all", to: `${baseHref}/store` },
    ...(topLevelCategories?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      to: `${baseHref}/categories/${cat.handle}`,
    })) ?? []),
  ]

  const toggleMobileSection = (key: string) => {
    setOpenMobileSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isMounted) {
    return (
      <div className="sticky top-0 inset-x-0 z-40">
        <header className="relative h-16 mx-auto border-b bg-ds-background border-ds-border">
          <nav className="content-container text-sm font-medium text-ds-muted-foreground flex items-center justify-between w-full h-full">
            <div className="flex items-center h-full absolute start-1/2 transform -translate-x-1/2">
              <span className="text-xl font-bold uppercase">Dakkah CityOS</span>
            </div>
          </nav>
        </header>
      </div>
    )
  }

  return (
    <div className="sticky top-0 inset-x-0 z-40">
      <header className="relative h-16 mx-auto border-b bg-ds-background border-ds-border">
        <nav className="content-container text-sm font-medium text-ds-muted-foreground flex items-center justify-between w-full h-full">
          <NavigationMenu.Root className="hidden lg:flex items-center h-full">
            <NavigationMenu.List className="flex items-center gap-x-6 h-full">
              <NavigationMenu.Item className="h-full flex items-center">
                <NavigationMenu.Trigger className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center gap-1 select-none">
                  Shop
                  <svg
                    className="w-3 h-3 ms-0.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M3 4.5L6 7.5L9 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="content-container py-8">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-ds-foreground text-base font-semibold uppercase tracking-wide">
                      Categories
                    </h3>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                      {categoryLinks.map((link) => (
                        <NavigationMenu.Link key={link.id} asChild>
                          <Link
                            to={link.to}
                            className="text-ds-muted-foreground hover:text-ds-foreground text-sm font-medium transition-colors py-1"
                          >
                            {link.name}
                          </Link>
                        </NavigationMenu.Link>
                      ))}
                    </div>
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {navGroups.length > 0 ? (
                navGroups.map((group) =>
                  group.items.length > 0 ? (
                    <NavigationMenu.Item
                      key={group.label}
                      className="h-full flex items-center"
                    >
                      <NavigationMenu.Trigger className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center gap-1 select-none">
                        {group.label}
                        <svg
                          className="w-3 h-3 ms-0.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M3 4.5L6 7.5L9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className="content-container py-8">
                        <div className="grid grid-cols-5 gap-x-8 gap-y-6">
                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                              {group.label}
                            </h4>
                            <div className="flex flex-col gap-1">
                              {group.items.map((item) => (
                                <NavigationMenu.Link key={item.href} asChild>
                                  <Link
                                    to={`${baseHref}${item.href}` as never}
                                    className="text-sm text-ds-muted-foreground hover:text-ds-foreground font-medium transition-colors py-1"
                                  >
                                    {item.name}
                                  </Link>
                                </NavigationMenu.Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  ) : (
                    <NavigationMenu.Item
                      key={group.label}
                      className="h-full flex items-center"
                    >
                      <NavigationMenu.Link asChild>
                        <Link
                          to={`${baseHref}/${group.label.toLowerCase()}` as never}
                          className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center"
                        >
                          {group.label}
                        </Link>
                      </NavigationMenu.Link>
                    </NavigationMenu.Item>
                  ),
                )
              ) : (
                <>
                  <NavigationMenu.Item className="h-full flex items-center">
                    <NavigationMenu.Link asChild>
                      <Link
                        to={`${baseHref}/store` as never}
                        className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center"
                      >
                        Store
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                  <NavigationMenu.Item className="h-full flex items-center">
                    <NavigationMenu.Link asChild>
                      <Link
                        to={`${baseHref}/vendors` as never}
                        className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center"
                      >
                        Vendors
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                  <NavigationMenu.Item className="h-full flex items-center">
                    <NavigationMenu.Link asChild>
                      <Link
                        to={`${baseHref}/bookings` as never}
                        className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full flex items-center"
                      >
                        Bookings
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                </>
              )}
            </NavigationMenu.List>

            <NavigationMenu.Viewport
              className="absolute top-full bg-ds-background border-b border-ds-border shadow-lg overflow-hidden
                data-[state=open]:animate-[dropdown-open_300ms_ease-out]
                data-[state=closed]:animate-[dropdown-close_300ms_ease-out]"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                width: "100vw",
              }}
            />
          </NavigationMenu.Root>

          <Drawer>
            <DrawerTrigger className="lg:hidden text-ds-muted-foreground hover:text-ds-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </DrawerTrigger>
            <DrawerContent side="left">
              <DrawerHeader>
                <DrawerTitle className="uppercase">Menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col py-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                <button
                  onClick={() => toggleMobileSection("shop")}
                  className="px-6 py-4 text-ds-foreground text-lg font-medium flex items-center justify-between w-full text-start"
                >
                  Shop
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${openMobileSections["shop"] ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M3 4.5L6 7.5L9 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openMobileSections["shop"] && (
                  <div className="flex flex-col">
                    {categoryLinks.map((link) => (
                      <DrawerClose key={link.id} asChild>
                        <Link
                          to={link.to}
                          className="px-10 py-3 text-ds-muted-foreground hover:bg-ds-muted transition-colors"
                        >
                          {link.name}
                        </Link>
                      </DrawerClose>
                    ))}
                  </div>
                )}

                {navGroups.length > 0 ? (
                  navGroups.map((group) => (
                    <div key={group.label}>
                      {group.items.length > 0 ? (
                        <>
                          <button
                            onClick={() =>
                              toggleMobileSection(`nav-${group.label}`)
                            }
                            className="px-6 py-4 text-ds-foreground text-lg font-medium flex items-center justify-between w-full text-start"
                          >
                            {group.label}
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${openMobileSections[`nav-${group.label}`] ? "rotate-180" : ""}`}
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {openMobileSections[`nav-${group.label}`] && (
                            <div className="flex flex-col">
                              {group.items.map((item) => (
                                <DrawerClose key={item.href} asChild>
                                  <Link
                                    to={`${baseHref}${item.href}` as never}
                                    className="px-10 py-3 text-ds-muted-foreground hover:bg-ds-muted transition-colors text-sm"
                                  >
                                    {item.name}
                                  </Link>
                                </DrawerClose>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <DrawerClose asChild>
                          <Link
                            to={`${baseHref}/${group.label.toLowerCase()}` as never}
                            className="px-6 py-4 text-ds-foreground text-lg font-medium block hover:bg-ds-muted transition-colors"
                          >
                            {group.label}
                          </Link>
                        </DrawerClose>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="border-t border-ds-border mt-2 pt-2">
                    <DrawerClose asChild>
                      <Link
                        to={`${baseHref}/store` as never}
                        className="px-6 py-4 text-ds-foreground text-lg font-medium block hover:bg-ds-muted transition-colors"
                      >
                        Store
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        to={`${baseHref}/vendors` as never}
                        className="px-6 py-4 text-ds-foreground text-lg font-medium block hover:bg-ds-muted transition-colors"
                      >
                        Vendors
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        to={`${baseHref}/bookings` as never}
                        className="px-6 py-4 text-ds-foreground text-lg font-medium block hover:bg-ds-muted transition-colors"
                      >
                        Bookings
                      </Link>
                    </DrawerClose>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex items-center h-full absolute start-1/2 transform -translate-x-1/2">
            <Link
              to={baseHref || "/"}
              className="text-xl font-bold hover:text-ds-muted-foreground uppercase"
            >
              Dakkah CityOS
            </Link>
          </div>

          <div className="flex items-center gap-x-4 h-full justify-end">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-ds-muted-foreground hover:text-ds-foreground transition-colors"
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
            {(() => {
              const segments = location.pathname.split("/").filter(Boolean)
              const tenant = segments[0] || ""
              const locale = segments[1] || "en"
              return <LocaleSwitcher currentLocale={locale} tenant={tenant} />
            })()}
            <UserMenu />
            <CartDropdown />
          </div>
          <SearchModal
            open={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </nav>
      </header>
    </div>
  )
}
