import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { AccountLayout } from "@/components/account"
import { KYCForm } from "@/components/identity/kyc-form"
import { VerificationBadge } from "@/components/identity/verification-badge"
import { t, formatDate } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/verification")({
  component: VerificationPage,
})

interface VerificationStatus {
  type: string
  label: string
  status: "not-started" | "pending" | "verified" | "rejected" | "expired"
  submittedAt?: string
  verifiedAt?: string
  rejectionReason?: string
}

function VerificationPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [mounted, setMounted] = useState(false)
  const [showKYCForm, setShowKYCForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const verifications: VerificationStatus[] = [
    {
      type: "kyc",
      label: t(locale, "identity.kyc"),
      status: "not-started",
    },
    {
      type: "age",
      label: t(locale, "identity.age_verification"),
      status: "not-started",
    },
  ]

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    "not-started": {
      bg: "bg-ds-muted",
      text: "text-ds-muted-foreground",
      label: t(locale, "identity.not_started"),
    },
    pending: {
      bg: "bg-ds-warning/20",
      text: "text-ds-warning",
      label: t(locale, "identity.pending"),
    },
    verified: {
      bg: "bg-ds-success/20",
      text: "text-ds-success",
      label: t(locale, "identity.verified"),
    },
    rejected: {
      bg: "bg-ds-destructive/20",
      text: "text-ds-destructive",
      label: t(locale, "identity.rejected"),
    },
    expired: {
      bg: "bg-ds-muted",
      text: "text-ds-muted-foreground",
      label: "Expired",
    },
  }

  const handleKYCSubmit = async (data: any) => {
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 2000))
    setIsSubmitting(false)
    setShowKYCForm(false)
  }

  if (!mounted) {
    return (
      <AccountLayout
        title={t(locale, "identity.verify_identity")}
        description={t(locale, "identity.title")}
      >
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 bg-ds-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout
      title={t(locale, "identity.verify_identity")}
      description={t(locale, "identity.title")}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifications.map((v) => {
            const config = statusConfig[v.status]
            return (
              <div
                key={v.type}
                className="bg-ds-background rounded-lg border border-ds-border p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {v.type === "kyc" ? "🪪" : "🔒"}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ds-foreground">
                        {v.label}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}
                  >
                    {config.label}
                  </span>
                </div>

                {v.status === "verified" && (
                  <div className="flex items-center gap-2 text-sm text-ds-muted-foreground mb-3">
                    <VerificationBadge verified type="identity" size="sm" />
                    <span>{t(locale, "identity.verified")}</span>
                    {v.verifiedAt && (
                      <span>· {formatDate(v.verifiedAt, locale as import("@/lib/i18n").SupportedLocale)}</span>
                    )}
                  </div>
                )}

                {v.status === "rejected" && v.rejectionReason && (
                  <p className="text-sm text-ds-destructive mb-3">
                    {v.rejectionReason}
                  </p>
                )}

                {v.type === "kyc" &&
                  (v.status === "not-started" || v.status === "rejected") && (
                    <button
                      onClick={() => setShowKYCForm(true)}
                      className="w-full px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {v.status === "rejected"
                        ? "Resubmit"
                        : t(locale, "identity.verify_identity")}
                    </button>
                  )}

                {v.status === "pending" && (
                  <p className="text-sm text-ds-muted-foreground">
                    Your verification is being reviewed. This typically takes
                    1-3 business days.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {showKYCForm && (
          <KYCForm
            onSubmit={handleKYCSubmit}
            onCancel={() => setShowKYCForm(false)}
            isSubmitting={isSubmitting}
          />
        )}

        <div>
          <h3 className="text-lg font-semibold text-ds-foreground mb-4">
            {t(locale, "identity.credentials")}
          </h3>
          <div className="bg-ds-background rounded-lg border border-ds-border p-8 text-center">
            <span className="text-3xl block mb-3">🎫</span>
            <p className="text-sm text-ds-muted-foreground">
              No credentials issued yet. Complete your verification to receive
              digital credentials.
            </p>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
