import { useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useManageRole } from "@/components/manage/role-guard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AuthModal } from "./auth-modal"
import {
  User,
  ArrowRightOnRectangle,
  ShoppingBag,
  CreditCard,
  Calendar,
  BuildingStorefront,
  CogSixTooth,
} from "@medusajs/icons"

function formatRoleName(role: string | null): string {
  if (!role) return ""
  return role
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function UserMenu() {
  const { customer, isAuthenticated, isB2B, logout, isLoading } = useAuth()
  const { role, hasAccess } = useManageRole()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const prefix = useTenantPrefix()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-ds-muted animate-pulse" />
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAuthModalOpen(true)}
          className="text-ds-muted-foreground hover:text-ds-foreground"
        >
          <User className="h-5 w-5 me-1" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    )
  }

  const initials = customer
    ? `${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`.toUpperCase() ||
      "U"
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-ds-muted-foreground hover:text-ds-foreground focus:outline-none">
          <div className="w-8 h-8 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
          <span className="hidden sm:inline text-sm font-medium">
            {customer?.first_name || "Account"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {customer?.first_name} {customer?.last_name}
            </p>
            <p className="text-xs text-ds-muted-foreground truncate">
              {customer?.email}
            </p>
            {hasAccess && role && (
              <p className="text-xs text-ds-primary font-medium">
                {formatRoleName(role)}
              </p>
            )}
            {isB2B && customer?.company && (
              <p className="text-xs text-ds-info font-medium">
                {customer.company.name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={`${prefix}/account` as never} className="cursor-pointer">
            <User className="me-2 h-4 w-4" />
            My Account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to={`${prefix}/account/orders` as never} className="cursor-pointer">
            <ShoppingBag className="me-2 h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to={`${prefix}/account/subscriptions` as never}
            className="cursor-pointer"
          >
            <CreditCard className="me-2 h-4 w-4" />
            Subscriptions
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to={`${prefix}/account/bookings` as never} className="cursor-pointer">
            <Calendar className="me-2 h-4 w-4" />
            Bookings
          </Link>
        </DropdownMenuItem>

        {isB2B && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-ds-muted-foreground">
              Business
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={`${prefix}/b2b/dashboard` as never} className="cursor-pointer">
                <BuildingStorefront className="me-2 h-4 w-4" />
                Company Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {hasAccess && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-ds-muted-foreground">
              Management
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={`${prefix}/manage` as never} className="cursor-pointer">
                <BuildingStorefront className="me-2 h-4 w-4" />
                Store Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={`${prefix}/account/settings` as never} className="cursor-pointer">
            <CogSixTooth className="me-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-ds-destructive focus:text-ds-destructive cursor-pointer"
        >
          <ArrowRightOnRectangle className="me-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
