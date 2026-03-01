// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"
import { Star } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/account/reviews")({
  component: ReviewsPage,
  head: () => ({
    meta: [
      { title: "My Reviews" },
      { name: "description", content: "View and manage your product reviews" },
    ],
  }),
})

function ReviewsPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [mounted, setMounted] = useState(false)
  const prefix = `/${tenant}/${locale}`

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <p className="text-sm text-ds-muted-foreground">{t(locale, "common.loading")}</p>
      </div>
    )
  }

  return (
    <AccountLayout title="My Reviews" description="View and manage your product reviews">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ds-foreground">My Reviews</h1>
          <p className="text-sm text-ds-muted-foreground mt-1">View and manage your product reviews</p>
        </div>

        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-ds-muted-foreground" />
          </div>
          <p className="text-ds-muted-foreground">No reviews yet</p>
          <p className="text-xs text-ds-muted-foreground mt-2">Share your thoughts on products you've purchased.</p>
          <Link
            to={`${prefix}/` as never}
            className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-ds-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </AccountLayout>
  )
}
