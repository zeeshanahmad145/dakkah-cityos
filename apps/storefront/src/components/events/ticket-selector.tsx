import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"

export interface TicketType {
  id: string
  name: string
  description?: string
  price: { amount: number; currencyCode: string }
  available: number
  maxPerOrder?: number
  benefits?: string[]
}

interface TicketSelectorProps {
  locale: string
  ticketTypes: TicketType[]
  selectedTickets: Record<string, number>
  onSelectionChange: (selection: Record<string, number>) => void
}

export function TicketSelector({
  locale,
  ticketTypes,
  selectedTickets,
  onSelectionChange,
}: TicketSelectorProps) {
  const updateQuantity = (ticketId: string, delta: number) => {
    const ticket = ticketTypes.find((tt) => tt.id === ticketId)
    if (!ticket) return

    const current = selectedTickets[ticketId] || 0
    const next = Math.max(
      0,
      Math.min(current + delta, ticket.maxPerOrder ?? ticket.available),
    )

    const updated = { ...selectedTickets }
    if (next === 0) {
      delete updated[ticketId]
    } else {
      updated[ticketId] = next
    }
    onSelectionChange(updated)
  }

  const total = ticketTypes.reduce((sum, tt) => {
    const qty = selectedTickets[tt.id] || 0
    return sum + tt.price.amount * qty
  }, 0)

  const totalCount = Object.values(selectedTickets).reduce((s, q) => s + q, 0)
  const currency = ticketTypes[0]?.price.currencyCode || "USD"

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-ds-border">
        <h3 className="font-semibold text-ds-foreground">
          {t(locale, "events.select_tickets")}
        </h3>
      </div>

      <div className="divide-y divide-ds-border">
        {ticketTypes.map((ticket) => {
          const qty = selectedTickets[ticket.id] || 0
          const max = ticket.maxPerOrder ?? ticket.available
          const soldOut = ticket.available === 0

          return (
            <div key={ticket.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-ds-foreground">
                    {ticket.name}
                  </h4>
                  {ticket.description && (
                    <p className="text-sm text-ds-muted-foreground mt-0.5">
                      {ticket.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-ds-foreground mt-1">
                    {formatCurrency(
                      ticket.price.amount,
                      ticket.price.currencyCode, locale as any,
                    )}
                  </p>
                  {ticket.benefits && ticket.benefits.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {ticket.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-ds-muted-foreground"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-ds-success flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-ds-muted-foreground mt-1">
                    {soldOut
                      ? t(locale, "events.sold_out")
                      : `${ticket.available} ${t(locale, "events.tickets_available")}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(ticket.id, -1)}
                    disabled={qty === 0 || soldOut}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-ds-border text-ds-foreground hover:bg-ds-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease"
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
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-ds-foreground">
                    {qty}
                  </span>
                  <button
                    onClick={() => updateQuantity(ticket.id, 1)}
                    disabled={qty >= max || soldOut}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-ds-border text-ds-foreground hover:bg-ds-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalCount > 0 && (
        <div className="px-4 py-3 border-t border-ds-border bg-ds-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-muted-foreground">
                {totalCount} {totalCount === 1 ? "ticket" : "tickets"}
              </p>
              <p className="text-lg font-bold text-ds-foreground">
                {formatCurrency(total, currency, locale as import("@/lib/i18n").SupportedLocale)}
              </p>
            </div>
            <button className="px-6 py-2.5 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              {t(locale, "events.book_tickets")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
