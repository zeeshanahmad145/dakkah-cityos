import { useState } from "react"
import { formatDate } from "@/lib/i18n"
import { t } from "@/lib/i18n"
import { useParams } from "@tanstack/react-router"
import type { Announcement } from "@/lib/hooks/use-content"

interface AnnouncementCardProps {
  announcement: Announcement
  onDismiss?: (id: string) => void
}

const typeConfig: Record<
  Announcement["type"],
  { bg: string; border: string; icon: string; text: string }
> = {
  info: {
    bg: "bg-ds-accent/10",
    border: "border-ds-accent/20",
    icon: "ℹ️",
    text: "text-ds-accent",
  },
  warning: {
    bg: "bg-ds-warning/10",
    border: "border-ds-warning/30",
    icon: "⚠️",
    text: "text-ds-warning",
  },
  critical: {
    bg: "bg-ds-destructive/10",
    border: "border-ds-destructive/30",
    icon: "🚨",
    text: "text-ds-destructive",
  },
  promotion: {
    bg: "bg-ds-accent/10",
    border: "border-ds-accent/20",
    icon: "🎉",
    text: "text-ds-accent",
  },
}

export function AnnouncementCard({
  announcement,
  onDismiss,
}: AnnouncementCardProps) {
  const { locale } = useParams({ strict: false }) as { locale: string }
  const [dismissed, setDismissed] = useState(false)
  const config = typeConfig[announcement.type]

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.(announcement.id)
  }

  return (
    <div
      className={`relative rounded-lg border p-4 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${config.text}`}>
              {announcement.title}
            </h4>
            {announcement.pinned && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-ds-primary text-ds-primary-foreground rounded">
                📌
              </span>
            )}
          </div>
          <p className="text-sm text-ds-foreground/80">
            {announcement.content}
          </p>
          <p className="text-xs text-ds-muted-foreground mt-2">
            {formatDate(announcement.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-ds-muted transition-colors text-ds-muted-foreground hover:text-ds-foreground"
            aria-label={t(locale, "blocks.dismiss")}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
