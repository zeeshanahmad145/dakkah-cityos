// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/returns/")({
  component: ReturnsPage,
  head: () => ({
    meta: [
      { title: "Returns | Dakkah CityOS" },
      { name: "description", content: "Manage returns on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const steps = [
        {
          id: "1",
          title: "Initiate Return",
          description:
            "Log into your account, go to 'My Orders', select the item, and click 'Return Item'. Fill in the reason for return.",
          icon: "📋",
        },
        {
          id: "2",
          title: "Print Label",
          description:
            "Download and print the prepaid return shipping label. Attach it securely to your package.",
          icon: "🏷️",
        },
        {
          id: "3",
          title: "Ship Item",
          description:
            "Drop off the package at any authorized shipping location or schedule a free pickup.",
          icon: "📦",
        },
        {
          id: "4",
          title: "Get Refund",
          description:
            "Once we receive and inspect the item, your refund is processed within 5-7 business days.",
          icon: "💰",
        },
      ]
      const policies = [
        {
          title: "30-Day Return Window",
          description:
            "Most items can be returned within 30 days of delivery for a full refund.",
        },
        {
          title: "Free Return Shipping",
          description:
            "We provide prepaid return labels at no cost for all eligible returns.",
        },
        {
          title: "Original Condition Required",
          description:
            "Items must be unused, unworn, and in original packaging with all tags attached.",
        },
        {
          title: "Non-Returnable Items",
          description:
            "Perishable goods, personal care items, and custom orders cannot be returned.",
        },
      ]
      const faqs = [
        {
          id: "r1",
          question: "How long do I have to return an item?",
          answer:
            "You have 30 days from the delivery date to initiate a return for most items. Some categories like electronics have a 15-day window.",
        },
        {
          id: "r2",
          question: "When will I receive my refund?",
          answer:
            "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The refund goes back to your original payment method.",
        },
        {
          id: "r3",
          question: "Can I exchange instead of return?",
          answer:
            "Yes, you can request an exchange for a different size, color, or variant during the return process. Exchanges are processed within 3-5 business days.",
        },
        {
          id: "r4",
          question: "What if my item arrived damaged?",
          answer:
            "If your item arrived damaged, contact us within 48 hours with photos. We'll arrange a free return and send a replacement immediately.",
        },
      ]
      return { steps, policies, faqs }
    } catch {
      return { steps: [], policies: [], faqs: [] }
    }
  },
})

function ReturnsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [trackingId, setTrackingId] = useState("")
  const data = Route.useLoaderData()
  const steps = data?.steps || []
  const policies = data?.policies || []
  const faqs = data?.faqs || []

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Returns</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Returns & Refunds
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Easy, hassle-free returns with free shipping. Get your refund within
            5-7 business days.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{t(locale, "returns.badge_30_day", "30-day returns")}</span>
            <span>|</span>
            <span>
              {t(
                locale,
                "returns.badge_free_return_shipping",
                "Free return shipping",
              )}
            </span>
            <span>|</span>
            <span>
              {t(locale, "returns.badge_fast_refunds", "Fast refunds")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-ds-destructive/10 to-rose-500/5 border border-ds-destructive/20 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-ds-foreground mb-3">
            Track Your Return
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder={t(locale, "returns.search_placeholder")}
              className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-destructive"
            />
            <button className="px-6 py-2.5 text-sm font-medium rounded-lg bg-ds-destructive text-white hover:bg-ds-destructive transition-colors">
              Track
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          How to Return
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step: any) => (
            <div
              key={step.id}
              className="bg-ds-background border border-ds-border rounded-xl p-6 text-center hover:shadow-lg hover:border-ds-destructive/40 transition-all duration-200"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <div className="w-8 h-8 rounded-full bg-ds-destructive text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">
                {step.id}
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Return Policy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {policies.map((policy: any, i: number) => (
            <div
              key={i}
              className="bg-ds-background border border-ds-border rounded-xl p-6 flex items-start gap-4"
            >
              <svg
                className="w-6 h-6 text-ds-destructive flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-ds-foreground mb-1">
                  {policy.title}
                </h3>
                <p className="text-sm text-ds-muted-foreground">
                  {policy.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Frequently Asked Questions
        </h2>
        {faqs.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              No FAQs available
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {faqs.map((faq: any) => (
              <div
                key={faq.id}
                className="bg-ds-background border border-ds-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-ds-muted/50 transition-colors"
                >
                  <span className="font-medium text-ds-foreground">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-ds-muted-foreground transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-ds-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
