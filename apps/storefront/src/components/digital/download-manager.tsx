import { useState } from "react"
import { useLocale } from "@/lib/context/tenant-context"
import { formatDate } from "@/lib/i18n"
import type { DownloadItem } from "@/lib/hooks/use-digital-products"

interface DownloadManagerProps {
  downloads: DownloadItem[]
  loading?: boolean
}

export function DownloadManager({ downloads, loading }: DownloadManagerProps) {
  const { locale } = useLocale()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!downloads.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
        <svg
          className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-ds-muted-foreground">No downloads yet</p>
        <p className="text-sm text-ds-muted-foreground mt-1">
          Purchase digital products to see them here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {downloads.map((item) => (
        <DownloadRow key={item.id} item={item} locale={locale} />
      ))}
    </div>
  )
}

function DownloadRow({ item, locale }: { item: DownloadItem; locale: string }) {
  const [showLicense, setShowLicense] = useState(false)
  const isExpired = item.expires_at
    ? new Date(item.expires_at!) < new Date()
    : false
  const noDownloadsLeft =
    item.downloads_remaining !== undefined && item.downloads_remaining <= 0

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
          {item.thumbnail ? (
            <img
              loading="lazy"
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-ds-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ds-foreground">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-ds-muted-foreground">
            <span>{item.file_type.toUpperCase()}</span>
            <span className="text-ds-border">·</span>
            <span>{item.file_size}</span>
            <span className="text-ds-border">·</span>
            <span>Purchased {formatDate(item.purchase_date, locale as import("@/lib/i18n").SupportedLocale)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            {item.downloads_remaining !== undefined && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${noDownloadsLeft ? "bg-ds-destructive/10 text-ds-destructive" : "bg-ds-muted text-ds-muted-foreground"}`}
              >
                {item.downloads_remaining} downloads remaining
              </span>
            )}
            {item.expires_at && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${isExpired ? "bg-ds-destructive/10 text-ds-destructive" : "bg-ds-muted text-ds-muted-foreground"}`}
              >
                {isExpired
                  ? "Expired"
                  : `Expires ${formatDate(item.expires_at, locale as import("@/lib/i18n").SupportedLocale)}`}
              </span>
            )}
          </div>

          {item.license_key && (
            <div className="mt-2">
              <button
                onClick={() => setShowLicense(!showLicense)}
                className="text-xs text-ds-primary hover:underline"
              >
                {showLicense ? "Hide License Key" : "Show License Key"}
              </button>
              {showLicense && (
                <div className="mt-1 px-3 py-2 bg-ds-muted rounded text-xs font-mono text-ds-foreground break-all">
                  {item.license_key}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <a
            href={isExpired || noDownloadsLeft ? undefined : item.download_url}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isExpired || noDownloadsLeft
                ? "bg-ds-muted text-ds-muted-foreground cursor-not-allowed"
                : "bg-ds-primary text-ds-primary-foreground hover:opacity-90"
            }`}
            onClick={(e) => {
              if (isExpired || noDownloadsLeft) e.preventDefault()
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
