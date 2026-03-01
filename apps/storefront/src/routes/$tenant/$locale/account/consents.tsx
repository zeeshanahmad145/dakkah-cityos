import { createFileRoute } from "@tanstack/react-router"
import { PrivacySettings } from "@/components/consent/privacy-settings"
import { AccountLayout } from "@/components/account"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"

export const Route = createFileRoute("/$tenant/$locale/account/consents")({
  component: ConsentsPage,
})

const defaultCategories = [
  { id: "essential", title: "consent.essential", description: "consent.essential_desc", required: true, defaultEnabled: true },
  { id: "analytics", title: "consent.analytics", description: "consent.analytics_desc", required: false, defaultEnabled: false },
  { id: "marketing", title: "consent.marketing", description: "consent.marketing_desc", required: false, defaultEnabled: false },
  { id: "personalization", title: "consent.personalization", description: "consent.personalization_desc", required: false, defaultEnabled: false },
]

function ConsentsPage() {
  const { locale, tenant } = Route.useParams()
  const [preferences, setPreferences] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cookie_consent_preferences")
      if (stored) {
        setPreferences(JSON.parse(stored))
      } else {
        const initial: Record<string, boolean> = {}
        defaultCategories.forEach((cat) => { initial[cat.id] = cat.required || cat.defaultEnabled })
        setPreferences(initial)
      }
    } catch {
      const initial: Record<string, boolean> = {}
      defaultCategories.forEach((cat) => { initial[cat.id] = cat.required || cat.defaultEnabled })
      setPreferences(initial)
    }
  }, [])

  const handleSave = (newPreferences: Record<string, boolean>) => {
    setPreferences(newPreferences)
    try { localStorage.setItem("cookie_consent_preferences", JSON.stringify(newPreferences)) } catch {}
  }

  return (
    <AccountLayout title={t(locale, "consent.page_title")} description={t(locale, "consent.page_desc")}>
      <div className="max-w-3xl mx-auto">
        <PrivacySettings
          categories={defaultCategories}
          currentPreferences={preferences}
          onSave={handleSave}
          dataRetentionDays={365}
          showDeleteAccount
          onDeleteAccount={() => {}}
          locale={locale}
        />
      </div>
    </AccountLayout>
  )
}
