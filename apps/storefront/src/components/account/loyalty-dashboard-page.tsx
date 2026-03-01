import React, { useState } from "react"

interface PointsActivity {
  id: string
  date: string
  description: string
  points: number
  type: "earned" | "redeemed"
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  image?: string
  category: string
}

interface EarnRule {
  id: string
  action: string
  description: string
  pointsReward: number
  icon: string
}

interface ReferralInfo {
  code: string
  referralCount: number
  earnedRewards: number
}

interface LoyaltyDashboardPageProps {
  balance?: number
  lifetimeEarned?: number
  currentTier?: string
  nextTier?: string
  tierProgress?: number
  pointsToNextTier?: number
  pointsHistory?: PointsActivity[]
  rewards?: Reward[]
  earnRules?: EarnRule[]
  referral?: ReferralInfo
  loading?: boolean
}

const defaultEarnRules: EarnRule[] = [
  { id: "purchase", action: "Purchase", description: "Earn 1 point per $1 spent", pointsReward: 1, icon: "🛒" },
  { id: "review", action: "Review", description: "Write a product review", pointsReward: 50, icon: "⭐" },
  { id: "referral", action: "Referral", description: "Refer a friend who makes a purchase", pointsReward: 200, icon: "👥" },
  { id: "birthday", action: "Birthday", description: "Birthday bonus points", pointsReward: 100, icon: "🎂" },
]

const sampleRewards: Reward[] = [
  { id: "r1", name: "$5 Store Credit", description: "Convert points to store credit", pointsCost: 500, category: "Credit" },
  { id: "r2", name: "Free Shipping", description: "Free shipping on your next order", pointsCost: 300, category: "Shipping" },
  { id: "r3", name: "10% Off Coupon", description: "10% discount on any order", pointsCost: 800, category: "Discount" },
  { id: "r4", name: "$25 Store Credit", description: "Convert points to store credit", pointsCost: 2000, category: "Credit" },
]

const sampleHistory: PointsActivity[] = [
  { id: "1", date: "2026-02-10", description: "Purchase - Order #1234", points: 150, type: "earned" },
  { id: "2", date: "2026-02-05", description: "Product Review", points: 50, type: "earned" },
  { id: "3", date: "2026-01-28", description: "Redeemed - Free Shipping", points: -300, type: "redeemed" },
  { id: "4", date: "2026-01-20", description: "Referral Bonus", points: 200, type: "earned" },
  { id: "5", date: "2026-01-15", description: "Purchase - Order #1200", points: 85, type: "earned" },
]

export function LoyaltyDashboardPage({
  balance = 1285,
  lifetimeEarned = 2585,
  currentTier = "Silver",
  nextTier = "Gold",
  tierProgress = 65,
  pointsToNextTier = 715,
  pointsHistory = sampleHistory,
  rewards = sampleRewards,
  earnRules = defaultEarnRules,
  referral = { code: "FRIEND2026", referralCount: 3, earnedRewards: 600 },
  loading = false,
}: LoyaltyDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<"history" | "rewards" | "earn">("history")
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    if (referral?.code) {
      navigator.clipboard?.writeText(referral.code).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-ds-muted rounded-lg animate-pulse" />
        <div className="h-24 bg-ds-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-ds-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  const tierColors: Record<string, string> = {
    Bronze: "text-ds-warning",
    Silver: "text-ds-muted-foreground",
    Gold: "text-ds-warning",
    Platinum: "text-ds-primary",
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ds-background rounded-lg border border-ds-border p-6 text-center">
          <p className="text-sm text-ds-muted-foreground mb-1">Points Balance</p>
          <p className="text-4xl font-bold text-ds-foreground">{balance.toLocaleString()}</p>
          <p className="text-xs text-ds-muted-foreground mt-1">Lifetime: {lifetimeEarned.toLocaleString()}</p>
        </div>
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <p className="text-sm text-ds-muted-foreground mb-1">Current Tier</p>
          <p className={`text-2xl font-bold ${tierColors[currentTier] || "text-ds-foreground"}`}>
            {currentTier}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-ds-muted-foreground mb-1">
              <span>{currentTier}</span>
              <span>{nextTier}</span>
            </div>
            <div className="w-full bg-ds-muted rounded-full h-2">
              <div
                className="h-2 rounded-full bg-ds-primary transition-all"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-xs text-ds-muted-foreground mt-1">
              {pointsToNextTier} points to {nextTier}
            </p>
          </div>
        </div>
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <p className="text-sm text-ds-muted-foreground mb-1">Referral Program</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 px-3 py-2 bg-ds-muted rounded-md text-sm font-mono text-ds-foreground text-center">
              {referral.code}
            </code>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex justify-between mt-3 text-xs text-ds-muted-foreground">
            <span>{referral.referralCount} referred</span>
            <span>{referral.earnedRewards} pts earned</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 px-2 py-1.5 text-xs font-medium bg-ds-muted text-ds-foreground rounded-md hover:bg-ds-muted/80 transition-colors">
              Share via Email
            </button>
            <button className="flex-1 px-2 py-1.5 text-xs font-medium bg-ds-muted text-ds-foreground rounded-md hover:bg-ds-muted/80 transition-colors">
              Share Link
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-ds-border">
        {(["history", "rewards", "earn"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
              activeTab === tab
                ? "border-ds-primary text-ds-primary"
                : "border-transparent text-ds-muted-foreground hover:text-ds-foreground"
            }`}
          >
            {tab === "earn" ? "Ways to Earn" : tab === "rewards" ? "Rewards Catalog" : "Points History"}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <div className="bg-ds-background rounded-lg border border-ds-border divide-y divide-ds-border">
          {pointsHistory.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-3xl block mb-3">📊</span>
              <p className="text-sm text-ds-muted-foreground">No points activity yet.</p>
            </div>
          ) : (
            pointsHistory.map((activity) => (
              <div key={activity.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ds-foreground">{activity.description}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(activity.date!).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    activity.type === "earned" ? "text-ds-success" : "text-ds-destructive"
                  }`}
                >
                  {activity.type === "earned" ? "+" : ""}{activity.points}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-ds-background rounded-lg border border-ds-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-ds-foreground">{reward.name}</p>
                  <p className="text-xs text-ds-muted-foreground mt-0.5">{reward.description}</p>
                </div>
                <span className="px-2 py-0.5 text-xs bg-ds-muted text-ds-muted-foreground rounded">
                  {reward.category}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-ds-foreground">{reward.pointsCost} points</span>
                <button
                  disabled={balance < reward.pointsCost}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-opacity ${
                    balance >= reward.pointsCost
                      ? "bg-ds-primary text-ds-primary-foreground hover:opacity-90"
                      : "bg-ds-muted text-ds-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {balance >= reward.pointsCost ? "Redeem" : "Not enough points"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "earn" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earnRules.map((rule) => (
            <div key={rule.id} className="bg-ds-background rounded-lg border border-ds-border p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{rule.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ds-foreground">{rule.action}</p>
                <p className="text-xs text-ds-muted-foreground mt-0.5">{rule.description}</p>
              </div>
              <span className="text-sm font-bold text-ds-primary">+{rule.pointsReward}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
