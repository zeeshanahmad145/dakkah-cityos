import React, { useState } from "react"

interface ConsentItem {
  id: string
  label: string
  description: string
  category: string
  enabled: boolean
  lastUpdated?: string
  required?: boolean
}

interface ConsentsPageProps {
  consents?: ConsentItem[]
  privacyPolicyUrl?: string
  onSave?: (consents: Record<string, boolean>) => void
  onDataDownload?: () => void
  onDeleteAccount?: () => void
  loading?: boolean
}

const defaultConsents: ConsentItem[] = [
  { id: "marketing_email", label: "Marketing Emails", description: "Receive promotional emails and newsletters", category: "Communications", enabled: true, lastUpdated: "2026-01-15" },
  { id: "sms_notifications", label: "SMS Notifications", description: "Receive order updates and promotions via SMS", category: "Communications", enabled: false, lastUpdated: "2026-01-10" },
  { id: "push_notifications", label: "Push Notifications", description: "Receive push notifications for deals and order updates", category: "Communications", enabled: true, lastUpdated: "2026-01-15" },
  { id: "cookie_essential", label: "Essential Cookies", description: "Required for basic site functionality", category: "Cookie Preferences", enabled: true, required: true, lastUpdated: "2026-01-01" },
  { id: "cookie_analytics", label: "Analytics Cookies", description: "Help us understand how you use our site", category: "Cookie Preferences", enabled: false, lastUpdated: "2026-01-01" },
  { id: "cookie_marketing", label: "Marketing Cookies", description: "Used to deliver relevant advertisements", category: "Cookie Preferences", enabled: false, lastUpdated: "2026-01-01" },
  { id: "data_sharing", label: "Data Sharing with Partners", description: "Share anonymized data with trusted partners for better services", category: "Data & Privacy", enabled: false, lastUpdated: "2025-12-20" },
  { id: "location_tracking", label: "Location Tracking", description: "Use your location to show nearby stores and delivery options", category: "Data & Privacy", enabled: true, lastUpdated: "2026-01-05" },
  { id: "personalized_recommendations", label: "Personalized Recommendations", description: "Receive product recommendations based on your browsing and purchase history", category: "Data & Privacy", enabled: true, lastUpdated: "2026-01-15" },
]

export function ConsentsPage({
  consents = defaultConsents,
  privacyPolicyUrl = "#",
  onSave,
  onDataDownload,
  onDeleteAccount,
  loading = false,
}: ConsentsPageProps) {
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    Object.fromEntries(consents.map((c) => [c.id, c.enabled]))
  )
  const [saved, setSaved] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [dataRequested, setDataRequested] = useState(false)

  const handleToggle = (id: string) => {
    const consent = consents.find((c) => c.id === id)
    if (consent?.required) return
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }))
    setSaved(false)
  }

  const handleSave = () => {
    onSave?.(preferences)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDataDownload = () => {
    onDataDownload?.()
    setDataRequested(true)
    setTimeout(() => setDataRequested(false), 3000)
  }

  const categories = Array.from(new Set(consents.map((c) => c.category)))

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ds-foreground">Consent Management</h2>
        <p className="text-sm text-ds-muted-foreground mt-1">
          Manage how we use your data and communicate with you.{" "}
          <a href={privacyPolicyUrl} className="text-ds-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {categories.map((category) => {
        const categoryConsents = consents.filter((c) => c.category === category)

        return (
          <div key={category} className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
            <div className="px-4 py-3 bg-ds-muted border-b border-ds-border">
              <h3 className="text-sm font-semibold text-ds-foreground">{category}</h3>
            </div>
            <div className="divide-y divide-ds-border">
              {categoryConsents.map((consent) => (
                <div key={consent.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ds-foreground">{consent.label}</p>
                      {consent.required && (
                        <span className="px-1.5 py-0.5 text-xs bg-ds-muted text-ds-muted-foreground rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ds-muted-foreground mt-0.5">{consent.description}</p>
                    {consent.lastUpdated && (
                      <p className="text-xs text-ds-muted-foreground mt-1">
                        Last updated: {new Date(consent.lastUpdated!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[consent.id]}
                    disabled={consent.required}
                    onClick={() => handleToggle(consent.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                      consent.required
                        ? "bg-ds-primary/50 cursor-not-allowed"
                        : preferences[consent.id]
                        ? "bg-ds-primary cursor-pointer"
                        : "bg-ds-muted cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        preferences[consent.id] ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {saved ? "Preferences Saved!" : "Update Preferences"}
        </button>
      </div>

      <div className="bg-ds-background rounded-lg border border-ds-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ds-foreground">Data Management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDataDownload}
            disabled={dataRequested}
            className="px-4 py-2 text-sm font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors border border-ds-border disabled:opacity-50"
          >
            {dataRequested ? "Request Submitted" : "Download My Data"}
          </button>
          {showDeleteWarning ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ds-destructive">This action cannot be undone.</span>
              <button
                onClick={() => { onDeleteAccount?.(); setShowDeleteWarning(false) }}
                className="px-3 py-2 text-xs font-medium bg-ds-destructive text-white rounded-lg hover:opacity-90"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteWarning(false)}
                className="px-3 py-2 text-xs font-medium text-ds-muted-foreground hover:text-ds-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteWarning(true)}
              className="px-4 py-2 text-sm font-medium text-ds-destructive hover:underline"
            >
              Delete My Account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
