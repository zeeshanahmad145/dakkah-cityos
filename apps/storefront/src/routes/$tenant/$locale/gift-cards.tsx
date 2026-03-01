import { createFileRoute } from "@tanstack/react-router"
import { GiftCardDisplay, GiftCardPurchaseForm } from "@/components/payments/gift-card-display"
import { GiftCardDesignPicker } from "@/components/gift-cards/gift-card-design-picker"
import { GiftCardAmountSelector } from "@/components/gift-cards/gift-card-amount-selector"
import { GiftCardMessageForm } from "@/components/gift-cards/gift-card-message-form"
import { GiftCardBalance } from "@/components/gift-cards/gift-card-balance"
import { GiftCardRedeem } from "@/components/gift-cards/gift-card-redeem"
import { useGiftCards, usePurchaseGiftCard } from "@/lib/hooks/use-payments"
import { useGiftCardDesigns, useRedeemGiftCard } from "@/lib/hooks/use-gift-cards"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"

export const Route = createFileRoute("/$tenant/$locale/gift-cards")({
  component: GiftCardsPage,
  head: () => ({
    meta: [
      { title: "Gift Cards | Dakkah CityOS" },
      { name: "description", content: "Browse gift cards on Dakkah CityOS" },
    ],
  }),
})

const defaultAmounts = [25, 50, 100, 150, 200, 500]

function GiftCardsPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [mounted, setMounted] = useState(false)

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

  return <GiftCardsPageClient locale={locale} />
}

type TabId = "purchase" | "my-cards" | "redeem"

function GiftCardsPageClient({ locale }: { locale: string }) {
  const { data: giftCards, isLoading } = useGiftCards()
  const { data: designs = [] } = useGiftCardDesigns()
  const purchaseMutation = usePurchaseGiftCard()
  const redeemMutation = useRedeemGiftCard()

  const [activeTab, setActiveTab] = useState<TabId>("purchase")
  const [selectedDesignId, setSelectedDesignId] = useState<string>("")
  const [selectedAmount, setSelectedAmount] = useState<number>(50)
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    senderName: "",
    message: "",
    deliveryDate: "",
  })

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePurchase = () => {
    purchaseMutation.mutate({
      amount: selectedAmount,
      recipientEmail: formData.recipientEmail,
      senderName: formData.senderName || undefined,
      message: formData.message || undefined,
    })
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "purchase", label: t(locale, "giftCards.buy_gift_card") },
    { id: "my-cards", label: t(locale, "giftCards.my_cards") },
    { id: "redeem", label: t(locale, "giftCards.redeem_title") },
  ]

  return (
    <div className="min-h-screen bg-ds-muted">
      <div className="bg-ds-background border-b border-ds-border">
        <div className="content-container py-8">
          <h1 className="text-2xl font-bold text-ds-foreground">{t(locale, "giftCards.title")}</h1>
          <p className="mt-1 text-ds-muted-foreground">{t(locale, "giftCards.description")}</p>
        </div>
      </div>

      <div className="content-container py-6">
        <div className="flex gap-1 mb-6 bg-ds-background border border-ds-border rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-ds-primary text-ds-primary-foreground"
                  : "text-ds-muted-foreground hover:text-ds-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "purchase" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {designs.length > 0 && (
                <GiftCardDesignPicker
                  designs={designs}
                  selectedDesignId={selectedDesignId}
                  onSelect={setSelectedDesignId}
                  locale={locale}
                />
              )}

              <GiftCardAmountSelector
                presetAmounts={defaultAmounts}
                selectedAmount={selectedAmount}
                currencyCode="USD"
                onAmountChange={setSelectedAmount}
                locale={locale}
              />
            </div>

            <GiftCardMessageForm
              recipientEmail={formData.recipientEmail}
              recipientName={formData.recipientName}
              senderName={formData.senderName}
              message={formData.message}
              deliveryDate={formData.deliveryDate}
              onFieldChange={handleFieldChange}
              onSubmit={handlePurchase}
              loading={purchaseMutation.isPending}
              locale={locale}
            />
          </div>
        )}

        {activeTab === "my-cards" && (
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-ds-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !giftCards?.length ? (
              <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "giftCards.no_cards_title")}
                </h3>
                <p className="text-ds-muted-foreground">
                  {t(locale, "giftCards.no_cards_description")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giftCards.map((card) => (
                  <GiftCardBalance
                    key={card.id}
                    balance={card.balance}
                    originalAmount={card.originalAmount}
                    currencyCode={card.currency}
                    code={card.code}
                    expiresAt={card.expiresAt}
                    status={card.status}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "redeem" && (
          <div className="max-w-md mx-auto">
            <GiftCardRedeem
              onRedeem={(code: string) => redeemMutation.mutate(code)}
              loading={redeemMutation.isPending}
              error={redeemMutation.error?.message}
              success={redeemMutation.isSuccess}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  )
}
