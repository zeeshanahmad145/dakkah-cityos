/**
 * Unified API Client - Fetches data from both Medusa and Payload
 * 
 * This client provides a single interface to access:
 * - Commerce data from Medusa (products, cart, orders)
 * - Content data from Payload (pages, SEO, rich content)
 * - Combined product data (Medusa product + Payload content)
 */

import { getServerBaseUrl, getMedusaPublishableKey, getPayloadCmsUrl } from "@/lib/utils/env"

const MEDUSA_BACKEND_URL = getServerBaseUrl()
const PAYLOAD_CMS_URL = getPayloadCmsUrl()
const MEDUSA_PUBLISHABLE_KEY = getMedusaPublishableKey()

export interface UnifiedProduct {
  // Medusa fields
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  images: Array<{ url: string }>
  variants: Array<any>
  options: Array<any>
  tags: Array<any>
  collection: any
  categories: Array<any>
  // Payload content fields
  content?: {
    richDescription?: any
    features?: string[]
    specifications?: Array<{ label: string; value: string }>
    contentBlocks?: any[]
    seo?: {
      title?: string
      description?: string
      keywords?: string
    }
    tags?: string[]
  }
}

export interface PayloadPage {
  id: string
  title: string
  slug: string
  path?: string
  template?: "landing" | "static" | "vertical-list" | "vertical-detail" | "home" | "category" | "node-browser" | "custom"
  description?: string
  layout: any[]
  verticalConfig?: {
    verticalSlug: string
    medusaEndpoint: string
    itemsPerPage?: number
    cardLayout?: "grid" | "list" | "map"
    filterFields?: Array<{ fieldName: string; fieldType: string; label: string }>
    sortFields?: Array<{ fieldName: string; label: string; defaultDirection?: string }>
    detailFields?: Array<{ fieldName: string; fieldType: string; label: string; section?: string }>
  }
  seo?: {
    title?: string
    description?: string
    ogImage?: any
    keywords?: string[]
    canonicalUrl?: string
    noIndex?: boolean
  }
  meta?: {
    title?: string
    description?: string
    image?: { url?: string }
  }
  status: 'draft' | 'published' | 'archived'
  publishAt?: string
  publishedAt?: string
  tenant: string | { id: string; name?: string; slug?: string }
  store?: string
  locale?: string
  parent?: string | { id: string; title?: string; path?: string }
  nodeScope?: string | { id: string; name?: string }
  governanceTags?: string[]
  breadcrumbs?: Array<{ id: string; title: string; path: string }>
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export interface StoreBranding {
  id: string
  name: string
  handle: string
  logo?: { url: string }
  favicon?: { url: string }
  themeConfig?: any
  seo?: {
    title?: string
    description?: string
    ogImage?: any
  }
}

class UnifiedAPIClient {
  private medusaUrl: string
  private payloadUrl: string
  private publishableKey: string
  
  constructor() {
    this.medusaUrl = MEDUSA_BACKEND_URL
    this.payloadUrl = PAYLOAD_CMS_URL
    this.publishableKey = MEDUSA_PUBLISHABLE_KEY
  }
  
  // ===== Medusa API Methods =====
  
  async getMedusaProducts(params: {
    limit?: number
    offset?: number
    category_id?: string[]
    collection_id?: string[]
    tags?: string[]
    region_id?: string
    q?: string
  } = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => query.append(key, v))
        } else {
          query.set(key, String(value))
        }
      }
    })
    
    const response = await fetch(`${this.medusaUrl}/store/products?${query}`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.products || []
  }
  
  async getMedusaProduct(id: string) {
    const response = await fetch(`${this.medusaUrl}/store/products/${id}`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.product
  }
  
  async getMedusaProductByHandle(handle: string) {
    const products = await this.getMedusaProducts({ limit: 1 })
    // Note: Medusa doesn't have a handle endpoint, need to query and filter
    // In production, you'd want to add a custom endpoint in Medusa backend
    const response = await fetch(`${this.medusaUrl}/store/products?handle=${handle}`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.products?.[0] || null
  }
  
  async getMedusaRegions() {
    const response = await fetch(`${this.medusaUrl}/store/regions`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.regions || []
  }
  
  async getMedusaCollections() {
    const response = await fetch(`${this.medusaUrl}/store/collections`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.collections || []
  }
  
  async getMedusaCategories() {
    const response = await fetch(`${this.medusaUrl}/store/product-categories`, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
      },

    })
    
    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.product_categories || []
  }
  
  // ===== Payload CMS API Methods =====
  
  async getPayloadContent(productId: string, tenantId?: string, storeId?: string) {
    try {
      const query = new URLSearchParams({
        where: JSON.stringify({
          medusaProductId: { equals: productId },
          ...(tenantId && { tenant: { equals: tenantId } }),
          ...(storeId && { store: { equals: storeId } }),
        }),
        limit: '1',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/product-content?${query}`, {

      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.docs?.[0] || null
    } catch (error) {
      console.warn(`PayloadCMS unavailable for product content "${productId}":`, error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return null
    }
  }
  
  async getPayloadPage(slug: string, tenantId?: string, storeId?: string): Promise<PayloadPage | null> {
    try {
      const query = new URLSearchParams({
        where: JSON.stringify({
          slug: { equals: slug },
          status: { equals: 'published' },
          ...(tenantId && { tenant: { equals: tenantId } }),
          ...(storeId && { store: { equals: storeId } }),
        }),
        limit: '1',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/pages?${query}`, {

      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.docs?.[0] || null
    } catch (error) {
      console.warn(`PayloadCMS unavailable for page "${slug}":`, error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return null
    }
  }
  
  async getPayloadPages(tenantId?: string, storeId?: string): Promise<PayloadPage[]> {
    try {
      const query = new URLSearchParams({
        where: JSON.stringify({
          status: { equals: 'published' },
          ...(tenantId && { tenant: { equals: tenantId } }),
          ...(storeId && { store: { equals: storeId } }),
        }),
        limit: '100',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/pages?${query}`, {

      })
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.docs || []
    } catch (error) {
      console.warn(`PayloadCMS unavailable for pages list:`, error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return []
    }
  }
  
  async getStoreBranding(storeHandle: string, tenantId?: string): Promise<StoreBranding | null> {
    try {
      const query = new URLSearchParams({
        where: JSON.stringify({
          handle: { equals: storeHandle },
          status: { equals: 'active' },
          ...(tenantId && { tenant: { equals: tenantId } }),
        }),
        limit: '1',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/stores?${query}`, {

      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.docs?.[0] || null
    } catch (error) {
      console.warn(`PayloadCMS unavailable for store branding "${storeHandle}":`, error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return null
    }
  }
  
  async getStores(tenantId?: string): Promise<StoreBranding[]> {
    // Try Medusa backend first
    try {
      const response = await fetch(`${this.medusaUrl}/store/stores`, {
        headers: {
          'x-publishable-api-key': this.publishableKey,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.stores || []
      } else {
        const errorText = await response.text()
        console.error('Stores API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch from Medusa:', error)
    }
    
    // Fallback to Payload CMS
    const query = new URLSearchParams({
      where: JSON.stringify({
        status: { equals: 'active' },
        ...(tenantId && { tenant: { equals: tenantId } }),
      }),
      limit: '100',
    })
    
    const response = await fetch(`${this.payloadUrl}/api/stores?${query}`)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.docs || []
  }
  
  async getPayloadPageByPath(path: string, tenantId?: string, locale?: string): Promise<PayloadPage | null> {
    try {
      const where: Record<string, any> = {
        path: { equals: path },
        status: { equals: 'published' },
      }
      if (tenantId) {
        where.tenant = { equals: tenantId }
      }
      if (locale) {
        where.locale = { in: [locale, 'all'] }
      }

      const query = new URLSearchParams({
        where: JSON.stringify(where),
        limit: '1',
        depth: '2',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/pages?${query}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.docs?.[0] || null
    } catch (error) {
      console.warn(`PayloadCMS unavailable for page path "${path}":`, error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return null
    }
  }

  async getPayloadPageChildren(parentId: string, tenantId?: string): Promise<PayloadPage[]> {
    try {
      const where: Record<string, any> = {
        parent: { equals: parentId },
        status: { equals: 'published' },
      }
      if (tenantId) {
        where.tenant = { equals: tenantId }
      }

      const query = new URLSearchParams({
        where: JSON.stringify(where),
        sort: 'sortOrder',
        limit: '100',
        depth: '1',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/pages?${query}`)
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.docs || []
    } catch (error) {
      console.warn('PayloadCMS unavailable for page children:', error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return []
    }
  }

  async getPayloadNavigation(tenantId: string, location: string, locale?: string): Promise<any | null> {
    try {
      const where: Record<string, any> = {
        tenant: { equals: tenantId },
        location: { equals: location },
        status: { equals: 'active' },
      }
      if (locale) {
        where.locale = { equals: locale }
      }

      const query = new URLSearchParams({
        where: JSON.stringify(where),
        limit: '1',
        depth: '3',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/navigations?${query}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.docs?.[0] || null
    } catch (error) {
      console.warn('PayloadCMS unavailable for navigation:', error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return null
    }
  }

  async getPayloadVerticals(tenantId: string): Promise<any[]> {
    try {
      const query = new URLSearchParams({
        where: JSON.stringify({
          tenant: { equals: tenantId },
          isEnabled: { equals: true },
          status: { equals: 'active' },
        }),
        sort: 'sortOrder',
        limit: '100',
      })
      
      const response = await fetch(`${this.payloadUrl}/api/verticals?${query}`)
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.docs || []
    } catch (error) {
      console.warn('PayloadCMS unavailable for verticals:', error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error)
      return []
    }
  }

  // ===== Unified Methods (Medusa + Payload) =====
  
  async getUnifiedProduct(handle: string, tenantId?: string, storeId?: string): Promise<UnifiedProduct | null> {
    const medusaProduct = await this.getMedusaProductByHandle(handle)
    
    if (!medusaProduct) {
      return null
    }
    
    // Fetch Payload content for this product
    const payloadContent = await this.getPayloadContent(medusaProduct.id, tenantId, storeId)
    
    return {
      ...medusaProduct,
      content: payloadContent ? {
        richDescription: payloadContent.description,
        features: payloadContent.features?.map((f: any) => f.feature) || [],
        specifications: payloadContent.specifications || [],
        contentBlocks: payloadContent.contentBlocks || [],
        seo: payloadContent.seo,
        tags: payloadContent.tags?.map((t: any) => t.tag) || [],
      } : undefined,
    }
  }
  
  async getUnifiedProducts(params: {
    limit?: number
    offset?: number
    category_id?: string[]
    collection_id?: string[]
    tags?: string[]
    region_id?: string
    q?: string
    tenantId?: string
    storeId?: string
  } = {}): Promise<UnifiedProduct[]> {
    const { tenantId, storeId, ...medusaParams } = params
    
    const medusaProducts = await this.getMedusaProducts(medusaParams)
    
    // Fetch Payload content for all products in parallel
    const productsWithContent = await Promise.all(
      medusaProducts.map(async (product: any) => {
        const payloadContent = await this.getPayloadContent(product.id, tenantId, storeId)
        
        return {
          ...product,
          content: payloadContent ? {
            richDescription: payloadContent.description,
            features: payloadContent.features?.map((f: any) => f.feature) || [],
            specifications: payloadContent.specifications || [],
            contentBlocks: payloadContent.contentBlocks || [],
            seo: payloadContent.seo,
            tags: payloadContent.tags?.map((t: any) => t.tag) || [],
          } : undefined,
        }
      })
    )
    
    return productsWithContent
  }
}

// Singleton instance
let clientInstance: UnifiedAPIClient | null = null

export function getUnifiedClient(): UnifiedAPIClient {
  if (!clientInstance) {
    clientInstance = new UnifiedAPIClient()
  }
  return clientInstance
}

export default getUnifiedClient
