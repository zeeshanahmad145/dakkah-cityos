import React, { useState } from "react"

interface VerificationItem {
  id: string
  type: string
  label: string
  status: "verified" | "unverified" | "pending" | "expired"
  verifiedAt?: string
  icon: string
}

interface Credential {
  id: string
  type: string
  issuer: string
  issuedDate: string
  status: "active" | "expired" | "revoked"
}

interface VerificationPageProps {
  verifications?: VerificationItem[]
  credentials?: Credential[]
  onVerify?: (type: string) => void
  loading?: boolean
}

const defaultVerifications: VerificationItem[] = [
  { id: "email", type: "email", label: "Email Address", status: "verified", verifiedAt: "2026-01-01", icon: "📧" },
  { id: "phone", type: "phone", label: "Phone Number", status: "verified", verifiedAt: "2026-01-05", icon: "📱" },
  { id: "identity", type: "identity", label: "Identity (KYC)", status: "unverified", icon: "🪪" },
  { id: "address", type: "address", label: "Address", status: "pending", icon: "📍" },
  { id: "age", type: "age", label: "Age Verification", status: "unverified", icon: "🔒" },
]

const sampleCredentials: Credential[] = [
  { id: "c1", type: "Email Verification", issuer: "CityOS Platform", issuedDate: "2026-01-01", status: "active" },
  { id: "c2", type: "Phone Verification", issuer: "CityOS Platform", issuedDate: "2026-01-05", status: "active" },
]

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  verified: { bg: "bg-ds-success/10", text: "text-ds-success", label: "Verified" },
  unverified: { bg: "bg-ds-muted", text: "text-ds-muted-foreground", label: "Not Verified" },
  pending: { bg: "bg-ds-warning/10", text: "text-ds-warning", label: "Pending" },
  expired: { bg: "bg-ds-destructive/10", text: "text-ds-destructive", label: "Expired" },
}

export function VerificationPage({
  verifications = defaultVerifications,
  credentials = sampleCredentials,
  onVerify,
  loading = false,
}: VerificationPageProps) {
  const [verifyingType, setVerifyingType] = useState<string | null>(null)

  const verifiedCount = verifications.filter((v) => v.status === "verified").length
  const totalCount = verifications.length
  const trustLevel = Math.round((verifiedCount / totalCount) * 100)

  const handleVerify = (type: string) => {
    setVerifyingType(type)
    onVerify?.(type)
    setTimeout(() => setVerifyingType(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-ds-muted rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const credentialStatusStyles: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-ds-success/10", text: "text-ds-success" },
    expired: { bg: "bg-ds-destructive/10", text: "text-ds-destructive" },
    revoked: { bg: "bg-ds-muted", text: "text-ds-muted-foreground" },
  }

  return (
    <div className="space-y-6">
      <div className="bg-ds-background rounded-lg border border-ds-border p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-ds-foreground">Trust Level</h2>
            <p className="text-sm text-ds-muted-foreground">
              {verifiedCount} of {totalCount} verifications completed
            </p>
          </div>
          <div className="text-end">
            <p className={`text-3xl font-bold ${trustLevel >= 80 ? "text-ds-success" : trustLevel >= 40 ? "text-ds-warning" : "text-ds-destructive"}`}>
              {trustLevel}%
            </p>
          </div>
        </div>
        <div className="w-full bg-ds-muted rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              trustLevel >= 80 ? "bg-ds-success" : trustLevel >= 40 ? "bg-ds-warning" : "bg-ds-destructive"
            }`}
            style={{ width: `${trustLevel}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ds-foreground mb-4">Verification Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifications.map((v) => {
            const config = statusConfig[v.status]
            return (
              <div key={v.id} className="bg-ds-background rounded-lg border border-ds-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-ds-foreground">{v.label}</p>
                      {v.verifiedAt && v.status === "verified" && (
                        <p className="text-xs text-ds-muted-foreground">
                          Verified on {new Date(v.verifiedAt!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                {v.status === "verified" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <svg className="w-4 h-4 text-ds-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs text-ds-success">Credential issued</span>
                  </div>
                )}

                {(v.status === "unverified" || v.status === "expired") && (
                  <button
                    onClick={() => handleVerify(v.type)}
                    disabled={verifyingType === v.type}
                    className="mt-3 w-full px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {verifyingType === v.type ? "Requesting..." : v.status === "expired" ? "Re-verify" : "Verify"}
                  </button>
                )}

                {v.status === "pending" && (
                  <p className="mt-2 text-xs text-ds-warning">
                    Verification in progress. This typically takes 1-3 business days.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ds-foreground mb-4">Credentials (Walt.id)</h3>
        {credentials.length === 0 ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <span className="text-3xl block mb-3">🎫</span>
            <p className="text-sm text-ds-muted-foreground">
              No credentials issued yet. Complete your verifications to receive digital credentials.
            </p>
          </div>
        ) : (
          <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_1fr_120px_80px] gap-4 px-4 py-3 bg-ds-muted border-b border-ds-border text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
              <span>Type</span>
              <span>Issuer</span>
              <span>Issued</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-ds-border">
              {credentials.map((cred) => {
                const style = credentialStatusStyles[cred.status] || credentialStatusStyles.active
                return (
                  <div
                    key={cred.id}
                    className="px-4 py-3 flex flex-col md:grid md:grid-cols-[1fr_1fr_120px_80px] gap-1 md:gap-4 md:items-center"
                  >
                    <p className="text-sm font-medium text-ds-foreground">{cred.type}</p>
                    <p className="text-sm text-ds-muted-foreground">{cred.issuer}</p>
                    <span className="text-sm text-ds-muted-foreground">
                      {new Date(cred.issuedDate!).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded w-fit ${style.bg} ${style.text}`}>
                      {cred.status.charAt(0).toUpperCase() + cred.status.slice(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button className="px-6 py-2 text-sm font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors border border-ds-border">
          Request New Verification
        </button>
      </div>
    </div>
  )
}
