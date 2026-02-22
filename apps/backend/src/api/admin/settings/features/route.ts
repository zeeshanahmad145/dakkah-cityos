import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateFeaturesSchema = z.object({
  core: z.any().optional(),
  modules: z.any().optional(),
  homepage: z.any().optional(),
  navigation: z.any().optional(),
}).passthrough()

/**
 * Feature Configuration System
 * 
 * This API manages which features/modules are enabled for the store.
 * Each feature can be toggled on/off and configured individually.
 */

export interface FeatureConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  config?: Record<string, any>
}

export interface StoreFeatures {
  // Core Commerce (always enabled)
  core: {
    products: { enabled: true }
    cart: { enabled: true }
    checkout: { enabled: true }
    orders: { enabled: true }
    customers: { enabled: true }
  }
  
  // Optional Modules
  modules: {
    // Marketplace / Multi-vendor
    marketplace: {
      enabled: boolean
      config: {
        allowVendorRegistration: boolean
        requireApproval: boolean
        commissionRate: number
        showVendorPages: boolean
      }
    }
    
    // B2B Commerce
    b2b: {
      enabled: boolean
      config: {
        allowCompanyRegistration: boolean
        requireApproval: boolean
        enableCreditLimits: boolean
        enableSpendingLimits: boolean
        enableTaxExemptions: boolean
        enableApprovalWorkflows: boolean
        enableQuotes: boolean
        enableInvoices: boolean
      }
    }
    
    // Subscriptions
    subscriptions: {
      enabled: boolean
      config: {
        showOnProductPages: boolean
        allowPause: boolean
        allowSkip: boolean
        trialEnabled: boolean
        trialDays: number
      }
    }
    
    // Bookings / Services
    bookings: {
      enabled: boolean
      config: {
        showOnHomepage: boolean
        allowOnlinePayment: boolean
        requireDeposit: boolean
        depositPercentage: number
        cancellationWindow: number // hours
        reminderHours: number[]
      }
    }
    
    // Reviews & Ratings
    reviews: {
      enabled: boolean
      config: {
        requireApproval: boolean
        allowPhotos: boolean
        minRating: number
        maxRating: number
        showOnProductPages: boolean
        verifiedPurchaseOnly: boolean
      }
    }
    
    // Volume / Tiered Pricing
    volumePricing: {
      enabled: boolean
      config: {
        showOnProductPages: boolean
        showSavingsPercentage: boolean
      }
    }
    
    // Wishlists
    wishlists: {
      enabled: boolean
      config: {
        allowMultipleLists: boolean
        allowSharing: boolean
      }
    }
    
    // Gift Cards
    giftCards: {
      enabled: boolean
      config: {
        customAmounts: boolean
        minAmount: number
        maxAmount: number
      }
    }
  }
  
  // Homepage Sections (order determines display order)
  homepage: {
    sections: Array<{
      id: string
      type: 'hero' | 'featured_products' | 'categories' | 'vendors' | 'services' | 'subscriptions' | 'reviews' | 'newsletter' | 'custom'
      enabled: boolean
      config: Record<string, any>
    }>
  }
  
  // Navigation Config
  navigation: {
    header: {
      showCategories: boolean
      showVendors: boolean
      showServices: boolean
      showB2BPortal: boolean
      customLinks: Array<{ label: string; href: string; enabled: boolean }>
    }
    footer: {
      showCategories: boolean
      showVendors: boolean
      showServices: boolean
      customSections: Array<{ title: string; links: Array<{ label: string; href: string }> }>
    }
  }
}

// Default feature configuration
const DEFAULT_FEATURES: StoreFeatures = {
  core: {
    products: { enabled: true },
    cart: { enabled: true },
    checkout: { enabled: true },
    orders: { enabled: true },
    customers: { enabled: true }
  },
  modules: {
    marketplace: {
      enabled: false,
      config: {
        allowVendorRegistration: true,
        requireApproval: true,
        commissionRate: 10,
        showVendorPages: true
      }
    },
    b2b: {
      enabled: false,
      config: {
        allowCompanyRegistration: true,
        requireApproval: true,
        enableCreditLimits: true,
        enableSpendingLimits: true,
        enableTaxExemptions: true,
        enableApprovalWorkflows: true,
        enableQuotes: true,
        enableInvoices: true
      }
    },
    subscriptions: {
      enabled: false,
      config: {
        showOnProductPages: true,
        allowPause: true,
        allowSkip: true,
        trialEnabled: false,
        trialDays: 7
      }
    },
    bookings: {
      enabled: false,
      config: {
        showOnHomepage: true,
        allowOnlinePayment: true,
        requireDeposit: false,
        depositPercentage: 20,
        cancellationWindow: 24,
        reminderHours: [24, 2]
      }
    },
    reviews: {
      enabled: true,
      config: {
        requireApproval: true,
        allowPhotos: true,
        minRating: 1,
        maxRating: 5,
        showOnProductPages: true,
        verifiedPurchaseOnly: false
      }
    },
    volumePricing: {
      enabled: false,
      config: {
        showOnProductPages: true,
        showSavingsPercentage: true
      }
    },
    wishlists: {
      enabled: true,
      config: {
        allowMultipleLists: false,
        allowSharing: true
      }
    },
    giftCards: {
      enabled: false,
      config: {
        customAmounts: true,
        minAmount: 10,
        maxAmount: 500
      }
    }
  },
  homepage: {
    sections: [
      { id: 'hero', type: 'hero', enabled: true, config: {} },
      { id: 'featured', type: 'featured_products', enabled: true, config: { limit: 8 } },
      { id: 'categories', type: 'categories', enabled: true, config: { limit: 6 } },
      { id: 'vendors', type: 'vendors', enabled: false, config: { limit: 4 } },
      { id: 'services', type: 'services', enabled: false, config: { limit: 4 } },
      { id: 'subscriptions', type: 'subscriptions', enabled: false, config: {} },
      { id: 'reviews', type: 'reviews', enabled: true, config: { limit: 3 } },
      { id: 'newsletter', type: 'newsletter', enabled: true, config: {} }
    ]
  },
  navigation: {
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

// In-memory store (in production, this would be in database)
let storeFeatures: StoreFeatures = { ...DEFAULT_FEATURES }

/**
 * GET /admin/settings/features
 * Get current feature configuration
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    res.json({
      features: storeFeatures
    })

  } catch (error: any) {
    handleApiError(res, error, "GET admin settings features")}
}

/**
 * PUT /admin/settings/features
 * Update feature configuration
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const parsed = updateFeaturesSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const updates = parsed.data as Partial<StoreFeatures>
  
    // Deep merge updates
    storeFeatures = deepMerge(storeFeatures, updates)
  
    // Auto-enable related homepage sections when modules are enabled
    if (updates.modules) {
      if (updates.modules.marketplace?.enabled) {
        const vendorSection = storeFeatures.homepage.sections.find(s => s.type === 'vendors')
        if (vendorSection) vendorSection.enabled = true
        storeFeatures.navigation.header.showVendors = true
      }
    
      if (updates.modules.bookings?.enabled) {
        const servicesSection = storeFeatures.homepage.sections.find(s => s.type === 'services')
        if (servicesSection) servicesSection.enabled = true
        storeFeatures.navigation.header.showServices = true
      }
    
      if (updates.modules.b2b?.enabled) {
        storeFeatures.navigation.header.showB2BPortal = true
      }
    
      if (updates.modules.subscriptions?.enabled) {
        const subSection = storeFeatures.homepage.sections.find(s => s.type === 'subscriptions')
        if (subSection) subSection.enabled = true
      }
    }
  
    res.json({
      features: storeFeatures,
      message: "Features updated successfully"
    })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin settings features")}
}

/**
 * POST /admin/settings/features/reset
 * Reset to default configuration
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    storeFeatures = { ...DEFAULT_FEATURES }
  
    res.json({
      features: storeFeatures,
      message: "Features reset to defaults"
    })

  } catch (error: any) {
    handleApiError(res, error, "POST admin settings features")}
}

// Helper function for deep merge
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

