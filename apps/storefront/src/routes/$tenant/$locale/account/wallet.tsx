import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { WalletBalance } from "@/components/payments/wallet-balance"
import { WalletTransactions } from "@/components/payments/wallet-transactions"
import {
  useWalletBalance,
  useWalletTransactions,
} from "@/lib/hooks/use-payments"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"
import { clsx } from "clsx"

export const Route = createFileRoute("/$tenant/$locale/account/wallet")({
  component: WalletPage,
})

type TransactionFilter = "all" | "credit" | "debit"

function WalletPage() {
  const { tenant, locale } = Route.useParams() as {
    tenant: string
    locale: string
  }
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <p className="text-sm text-ds-muted-foreground">
          {t(locale, "common.loading")}
        </p>
      </div>
    )
  }

  return (
    <WalletPageClient
      locale={locale}
      filter={filter}
      setFilter={setFilter}
      page={page}
      setPage={setPage}
    />
  )
}

function WalletPageClient({
  locale,
  filter,
  setFilter,
  page,
  setPage,
}: {
  locale: string
  filter: TransactionFilter
  setFilter: (f: TransactionFilter) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  const { data: walletData, isLoading: walletLoading } = useWalletBalance()
  const { data: txData, isLoading: txLoading } = useWalletTransactions(page)

  const filteredTransactions =
    txData?.transactions?.filter((tx) => {
      if (filter === "all") return true
      if (filter === "credit")
        return (
          tx.type === "credit" || tx.type === "refund" || tx.type === "top-up"
        )
      return tx.type === "debit" || tx.type === "transfer"
    }) || []

  const filters: { key: TransactionFilter; labelKey: string }[] = [
    { key: "all", labelKey: "payment.all_transactions" },
    { key: "credit", labelKey: "payment.credits" },
    { key: "debit", labelKey: "payment.debits" },
  ]

  return (
    <AccountLayout
      title={t(locale, "payment.wallet")}
      description={t(locale, "payment.wallet_description")}
    >
      <div className="space-y-6">
        <WalletBalance
          balance={walletData?.available || 0}
          pendingBalance={walletData?.pending}
          currency={walletData?.currency || "USD"}
          lastUpdated={walletData?.lastUpdated}
          locale={locale}
          loading={walletLoading}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ds-foreground">
              {t(locale, "payment.transactions")}
            </h2>
          </div>

          <div className="flex gap-2 mb-4">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key)
                  setPage(1)
                }}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  filter === f.key
                    ? "bg-ds-primary text-ds-primary-foreground"
                    : "bg-ds-background text-ds-muted-foreground border border-ds-border hover:bg-ds-muted",
                )}
              >
                {t(locale, f.labelKey)}
              </button>
            ))}
          </div>

          <WalletTransactions
            transactions={filteredTransactions}
            locale={locale}
            loading={txLoading}
            hasMore={txData?.hasMore || false}
            onLoadMore={() => setPage((p: number) => p + 1)}
          />
        </div>
      </div>
    </AccountLayout>
  )
}
