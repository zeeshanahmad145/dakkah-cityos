// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/help/")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: "Help Center | Dakkah CityOS" },
      { name: "description", content: "Get help and support on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const categories = [
        { id: "1", name: "Orders", icon: "📦", description: "Track orders, order issues, cancellations, and modifications.", count: 24 },
        { id: "2", name: "Payments", icon: "💳", description: "Payment methods, billing issues, refunds, and invoices.", count: 18 },
        { id: "3", name: "Shipping", icon: "🚚", description: "Delivery times, tracking, international shipping, and fees.", count: 15 },
        { id: "4", name: "Account", icon: "👤", description: "Profile settings, security, notifications, and preferences.", count: 12 },
      ]
      const faqs = [
        { id: "f1", question: "How do I track my order?", answer: "You can track your order by visiting your account dashboard and clicking on 'My Orders'. Each order has a tracking number that you can use to see real-time delivery updates.", category: "Orders" },
        { id: "f2", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express, Apple Pay, mada, and bank transfers. All payments are processed securely through our PCI-compliant payment gateway.", category: "Payments" },
        { id: "f3", question: "How long does shipping take?", answer: "Standard shipping within Saudi Arabia takes 2-5 business days. Express shipping is available for 1-2 business day delivery. International shipping takes 7-14 business days.", category: "Shipping" },
        { id: "f4", question: "How do I reset my password?", answer: "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link expires after 24 hours for security.", category: "Account" },
        { id: "f5", question: "Can I cancel my order?", answer: "You can cancel your order within 1 hour of placing it. After that, the order enters processing and may not be cancellable. Contact our support team for assistance.", category: "Orders" },
        { id: "f6", question: "How do I request a refund?", answer: "Navigate to your order in 'My Orders', click 'Request Refund', and follow the instructions. Refunds are processed within 5-7 business days to your original payment method.", category: "Payments" },
        { id: "f7", question: "Do you ship internationally?", answer: "Yes, we ship to over 30 countries. International shipping rates and delivery times vary by destination. You can check availability at checkout.", category: "Shipping" },
        { id: "f8", question: "How do I update my email address?", answer: "Go to Account Settings > Profile Information and click 'Edit' next to your email. You'll need to verify the new email address before the change takes effect.", category: "Account" },
      ]
      return { categories, faqs }
    } catch {
      return { categories: [], faqs: [] }
    }
  },
})

function HelpPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const data = Route.useLoaderData()
  const categories = data?.categories || []
  const faqs = data?.faqs || []

  const filteredFaqs = faqs.filter((f: any) => {
    const matchSearch = searchQuery ? f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()) : true
    const matchCat = activeCategory === "all" || f.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-info text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Help</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">Find answers to common questions, browse support topics, or contact our team for assistance.</p>
          <div className="mt-6 max-w-lg mx-auto">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(locale, 'help.search_placeholder')} className="w-full px-4 py-3 text-sm rounded-lg bg-ds-card/20 backdrop-blur text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-ds-foreground mb-6">Support Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.name)} className={`text-left bg-ds-background border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${activeCategory === cat.name ? "border-ds-info ring-2 ring-ds-primary/20" : "border-ds-border hover:border-ds-primary/40"}`}>
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-ds-foreground mb-1">{cat.name}</h3>
              <p className="text-sm text-ds-muted-foreground mb-2">{cat.description}</p>
              <span className="text-xs text-ds-primary font-medium">{cat.count} articles</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ds-foreground">Frequently Asked Questions</h2>
          {activeCategory !== "all" && (
            <button onClick={() => setActiveCategory("all")} className="text-sm text-ds-primary hover:underline">Show all</button>
          )}
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
            <p className="text-ds-muted-foreground text-sm">Try a different search term or category.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {filteredFaqs.map((faq: any) => (
              <div key={faq.id} className="bg-ds-background border border-ds-border rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-ds-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs font-medium bg-ds-info/15 text-ds-info rounded">{faq.category}</span>
                    <span className="font-medium text-ds-foreground">{faq.question}</span>
                  </div>
                  <svg className={`w-5 h-5 text-ds-muted-foreground transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-ds-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-br from-ds-primary/10 to-ds-info/5 border border-ds-info/20 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-ds-foreground mb-2">Still need help?</h3>
          <p className="text-sm text-ds-muted-foreground mb-4">Our support team is available 24/7 to assist you.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="px-6 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-white hover:bg-ds-primary/90 transition-colors">Contact Support</button>
            <button className="px-6 py-2.5 text-sm font-medium rounded-lg bg-ds-background border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors">Live Chat</button>
          </div>
        </div>
      </div>
    </div>
  )
}
