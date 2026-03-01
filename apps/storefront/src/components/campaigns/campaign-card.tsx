import { Link } from "@tanstack/react-router"
import { useTenantPrefix, useLocale } from "@/lib/context/tenant-context"
import { formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { CampaignProgressBar } from "./campaign-progress-bar"
import type { Campaign } from "@/lib/hooks/use-campaigns"

interface CampaignCardProps {
  campaign: Campaign
}

const statusStyles: Record<string, string> = {
  active: "bg-ds-success/10 text-ds-success",
  funded: "bg-ds-accent/10 text-ds-accent",
  ended: "bg-ds-muted text-ds-muted-foreground",
  cancelled: "bg-ds-destructive/10 text-ds-destructive",
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const prefix = useTenantPrefix()
  const { locale } = useLocale()

  return (
    <Link
      to={`${prefix}/campaigns/${campaign.id}` as never}
      className="group bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:shadow-md transition-all"
    >
      <div className="aspect-video bg-ds-muted relative overflow-hidden">
        {campaign.thumbnail ? (
          <img
            src={campaign.thumbnail}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-ds-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        )}
        <div className="absolute top-2 end-2">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${statusStyles[campaign.status] || "bg-ds-muted text-ds-muted-foreground"}`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
          {campaign.title}
        </h3>

        {campaign.description && (
          <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">
            {campaign.description}
          </p>
        )}

        <div className="mt-4">
          <CampaignProgressBar
            raised={campaign.raised_amount}
            goal={campaign.goal_amount}
            currencyCode={campaign.currency_code}
            locale={locale}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border text-sm">
          <div className="text-ds-muted-foreground">
            <span className="font-semibold text-ds-foreground">
              {campaign.backers_count}
            </span>{" "}
            backers
          </div>
          <div className="text-ds-muted-foreground">
            <span className="font-semibold text-ds-foreground">
              {campaign.days_remaining}
            </span>{" "}
            days left
          </div>
        </div>

        {campaign.status === "active" && (
          <button className="w-full mt-4 px-4 py-2 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            Back This Project
          </button>
        )}
      </div>
    </Link>
  )
}
