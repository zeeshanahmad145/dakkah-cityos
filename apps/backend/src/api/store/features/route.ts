import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"

/**
 * GET /store/features
 * 
 * Public API to get enabled features for the storefront.
 * This is called on app load to determine which features to show.
 */

// Import the features state from admin route (in production, use database)
// For now, we'll use a shared state approach

interface PublicFeatureFlags {
  // Simple boolean flags for conditional rendering
  marketplace: boolean
  b2b: boolean
  subscriptions: boolean
  bookings: boolean
  reviews: boolean
  volumePricing: boolean
  wishlists: boolean
  giftCards: boolean
  quotes: boolean
  invoices: boolean
  
  // Module-specific public config
  config: {
    marketplace?: {
      allowRegistration: boolean
      showVendorPages: boolean
    }
    b2b?: {
      allowRegistration: boolean
      enableQuotes: boolean
    }
    subscriptions?: {
      showOnProducts: boolean
      trialEnabled: boolean
      trialDays: number
    }
    bookings?: {
      showOnHomepage: boolean
    }
    reviews?: {
      showOnProducts: boolean
      allowPhotos: boolean
    }
    volumePricing?: {
      showOnProducts: boolean
      showSavings: boolean
    }
  }
  
  // Homepage configuration
  homepage: {
    sections: Array<{
      id: string
      type: string
      enabled: boolean
      config: Record<string, any>
    }>
  }
  
  // Navigation configuration
  navigation: {
    header: {
      showCategories: boolean
      showVendors: boolean
      showServices: boolean
      showB2BPortal: boolean
      customLinks: Array<{ label: string; href: string }>
    }
    footer: {
      showCategories: boolean
      showVendors: boolean
      showServices: boolean
      customSections: Array<{ title: string; links: Array<{ label: string; href: string }> }>
    }
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // In production, fetch from database based on store/tenant ID
    // For now, return a sensible default that can be overridden
  
    // Simulating fetching from admin settings
    const adminFeaturesResponse = await fetch(
      `${appConfig.urls.backend}/admin/settings/features`,
      {
        headers: {
          'Authorization': req.headers.authorization || ''
        }
      }
    ).catch(() => null)
  
    let features: any = null
    if (adminFeaturesResponse?.ok) {
      const data = await adminFeaturesResponse.json()
      features = data.features
    }
  
    // If we can't fetch admin features, use defaults
    if (!features) {
      features = getDefaultPublicFeatures()
    }
  
    // Transform admin features to public feature flags
    const publicFeatures: PublicFeatureFlags = {
      marketplace: features.modules?.marketplace?.enabled || false,
      b2b: features.modules?.b2b?.enabled || false,
      subscriptions: features.modules?.subscriptions?.enabled || false,
      bookings: features.modules?.bookings?.enabled || false,
      reviews: features.modules?.reviews?.enabled || true,
      volumePricing: features.modules?.volumePricing?.enabled || false,
      wishlists: features.modules?.wishlists?.enabled || true,
      giftCards: features.modules?.giftCards?.enabled || false,
      quotes: features.modules?.b2b?.enabled && features.modules?.b2b?.config?.enableQuotes || false,
      invoices: features.modules?.b2b?.enabled && features.modules?.b2b?.config?.enableInvoices || false,
    
      config: {
        marketplace: features.modules?.marketplace?.enabled ? {
          allowRegistration: features.modules.marketplace.config.allowVendorRegistration,
          showVendorPages: features.modules.marketplace.config.showVendorPages
        } : undefined,
      
        b2b: features.modules?.b2b?.enabled ? {
          allowRegistration: features.modules.b2b.config.allowCompanyRegistration,
          enableQuotes: features.modules.b2b.config.enableQuotes
        } : undefined,
      
        subscriptions: features.modules?.subscriptions?.enabled ? {
          showOnProducts: features.modules.subscriptions.config.showOnProductPages,
          trialEnabled: features.modules.subscriptions.config.trialEnabled,
          trialDays: features.modules.subscriptions.config.trialDays
        } : undefined,
      
        bookings: features.modules?.bookings?.enabled ? {
          showOnHomepage: features.modules.bookings.config.showOnHomepage
        } : undefined,
      
        reviews: features.modules?.reviews?.enabled ? {
          showOnProducts: features.modules.reviews.config.showOnProductPages,
          allowPhotos: features.modules.reviews.config.allowPhotos
        } : undefined,
      
        volumePricing: features.modules?.volumePricing?.enabled ? {
          showOnProducts: features.modules.volumePricing.config.showOnProductPages,
          showSavings: features.modules.volumePricing.config.showSavingsPercentage
        } : undefined
      },
    
      homepage: features.homepage || { sections: [] },
      navigation: features.navigation || getDefaultNavigation()
    }
  
    res.json({ features: publicFeatures })

  } catch (error: unknown) {
    handleApiError(res, error, "GET store features")}
}

function getDefaultPublicFeatures() {
  return {
    modules: {
      marketplace: { enabled: false, config: { allowVendorRegistration: true, showVendorPages: true } },
      b2b: { enabled: false, config: { allowCompanyRegistration: true, enableQuotes: true, enableInvoices: true } },
      subscriptions: { enabled: false, config: { showOnProductPages: true, trialEnabled: false, trialDays: 7 } },
      bookings: { enabled: false, config: { showOnHomepage: true } },
      reviews: { enabled: true, config: { showOnProductPages: true, allowPhotos: true } },
      volumePricing: { enabled: false, config: { showOnProductPages: true, showSavingsPercentage: true } },
      wishlists: { enabled: true, config: {} },
      giftCards: { enabled: false, config: {} }
    },
    homepage: {
      sections: [
        { id: 'hero', type: 'hero', enabled: true, config: {} },
        { id: 'featured', type: 'featured_products', enabled: true, config: { limit: 8 } },
        { id: 'categories', type: 'categories', enabled: true, config: { limit: 6 } },
        { id: 'reviews', type: 'reviews', enabled: true, config: { limit: 3 } },
        { id: 'newsletter', type: 'newsletter', enabled: true, config: {} }
      ]
    },
    navigation: getDefaultNavigation()
  }
}

function getDefaultNavigation() {
  return {
    header: {
      showCategories: true,
      showVendors: false,
      showServices: false,
      showB2BPortal: false,
      customLinks: []
    },
    footer: {
      showCategories: true,
      showVendors: false,
      showServices: false,
      customSections: []
    }
  }
}

