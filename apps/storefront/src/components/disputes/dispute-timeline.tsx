// @ts-nocheck
import { t } from "../../lib/i18n"

interface DisputeEvent {
  id: string
  type: string
  description: string
  timestamp: string
  actor: string
}

interface DisputeTimelineProps {
  events: DisputeEvent[]
  locale: string
}

const eventTypeConfig: Record<string, { color: string; icon: string }> = {
  opened: { color: "bg-ds-warning text-white", icon: "●" },
  evidence_submitted: { color: "bg-ds-accent text-white", icon: "📎" },
  under_review: { color: "bg-ds-primary text-white", icon: "◎" },
  resolved: { color: "bg-ds-success text-white", icon: "✓" },
  rejected: { color: "bg-ds-destructive text-white", icon: "✗" },
  escalated: { color: "bg-ds-destructive text-white", icon: "⚠" },
  comment: { color: "bg-ds-muted text-ds-foreground", icon: "💬" },
}

const defaultConfig = { color: "bg-ds-muted text-ds-foreground", icon: "●" }

export default function DisputeTimeline({
  events,
  locale,
}: DisputeTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-ds-card rounded-xl border border-ds-border p-6 text-center">
        <p className="text-sm text-ds-muted-foreground">
          {t(locale, "disputes.no_events")}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-ds-card rounded-xl border border-ds-border p-6">
      <h3 className="text-lg font-semibold text-ds-foreground mb-6">
        {t(locale, "disputes.timeline")}
      </h3>

      <div className="relative">
        {events.map((event, index) => {
          const config = eventTypeConfig[event.type] || defaultConfig
          const isLast = index === events.length - 1

          return (
            <div key={event.id} className="relative flex gap-4 pb-6">
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-ds-border" />
              )}

              <div
                className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${config.color}`}
              >
                {config.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ds-foreground">
                    {t(locale, `disputes.events.${event.type}`)}
                  </span>
                  <span className="text-xs text-ds-muted-foreground">
                    {new Date(event.timestamp!).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-ds-muted-foreground mt-1">
                  {event.description}
                </p>
                <p className="text-xs text-ds-muted-foreground mt-1">
                  {t(locale, "disputes.by")} {event.actor}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
