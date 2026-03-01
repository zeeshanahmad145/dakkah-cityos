import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { AccountLayout } from "@/components/account"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner, ExclamationCircle } from "@medusajs/icons"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { tenant, locale } = Route.useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate({ to: `/${tenant}/${locale}` })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AccountLayout
      title={t(locale, "account.settings_title", "Settings")}
      description={t(
        locale,
        "account.settings_description",
        "Manage your account settings and preferences",
      )}
    >
      <div className="space-y-6">
        {/* Password Change */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">
            Change Password
          </h2>
          <p className="text-sm text-ds-muted-foreground mb-4">
            To change your password, we'll send you a reset link to your email.
          </p>
          <Button
            variant="outline"
            size="fit"
            onClick={() =>
              navigate({ to: `/${tenant}/${locale}/reset-password` })
            }
          >
            Request password reset
          </Button>
        </div>

        {/* Notifications */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-ds-border"
              />
              <div>
                <p className="text-sm font-medium text-ds-foreground">
                  Order updates
                </p>
                <p className="text-xs text-ds-muted-foreground">
                  Get notified about order status changes and shipping updates
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-ds-border"
              />
              <div>
                <p className="text-sm font-medium text-ds-foreground">
                  Promotional emails
                </p>
                <p className="text-xs text-ds-muted-foreground">
                  Receive special offers, discounts, and new product
                  announcements
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-ds-border"
              />
              <div>
                <p className="text-sm font-medium text-ds-foreground">
                  Subscription reminders
                </p>
                <p className="text-xs text-ds-muted-foreground">
                  Get reminded before subscription renewals
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-ds-border"
              />
              <div>
                <p className="text-sm font-medium text-ds-foreground">
                  Booking reminders
                </p>
                <p className="text-xs text-ds-muted-foreground">
                  Receive reminders before your scheduled bookings
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Session */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">
            Session
          </h2>
          <p className="text-sm text-ds-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button
            variant="outline"
            size="fit"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Spinner className="animate-spin me-2 h-4 w-4" />
                Signing out...
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="bg-ds-background rounded-lg border border-ds-destructive p-6">
          <h2 className="text-lg font-semibold text-ds-destructive mb-4">
            Danger Zone
          </h2>

          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-ds-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <Button
                variant="danger"
                size="fit"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete account
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-ds-destructive rounded-lg">
                <ExclamationCircle className="h-5 w-5 text-ds-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ds-destructive">
                    Are you sure you want to delete your account?
                  </p>
                  <p className="text-sm text-ds-destructive mt-1">
                    This will permanently delete all your data including orders,
                    subscriptions, and bookings.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="fit"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" size="fit">
                  Yes, delete my account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
