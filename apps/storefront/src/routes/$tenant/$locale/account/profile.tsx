import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout, ProfileForm } from "@/components/account"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/profile")({
  component: ProfilePage,
})

function ProfilePage() {
  const { locale } = Route.useParams() as { locale: string }
  return (
    <AccountLayout title={t(locale, "account.profile_title", "Profile")} description={t(locale, "account.profile_description", "Manage your personal information")}>
      <div className="bg-ds-background rounded-lg border border-ds-border p-6">
        <h2 className="text-lg font-semibold text-ds-foreground mb-6">Personal Information</h2>
        <ProfileForm />
      </div>
    </AccountLayout>
  )
}
