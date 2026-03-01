import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery } from "@tanstack/react-query"
import { normalizeItem } from "@/lib/utils/normalize-item"

export interface BlogPost {
  id: string
  title: string
  name?: string
  description?: string
  slug: string
  excerpt?: string
  content?: string
  thumbnail?: string
  author?: { name: string; avatar?: string; bio?: string }
  publishedAt: string
  updatedAt?: string
  category?: string
  tags?: string[]
  readingTime?: string
  relatedPosts?: BlogPost[]
}

export interface HelpCategory {
  id: string
  title: string
  description?: string
  icon?: string
  articleCount: number
  slug: string
}

export interface HelpArticle {
  id: string
  title: string
  excerpt?: string
  content?: string
  category: string
  slug: string
  helpful?: { yes: number; no: number }
  updatedAt?: string
  relatedArticles?: HelpArticle[]
}

export interface POI {
  id: string
  name: string
  description?: string
  thumbnail?: string
  category?: string
  address: string
  lat: number
  lng: number
  rating?: { average: number; count: number }
  phone?: string
  hours?: string
  distance?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: "info" | "warning" | "critical" | "promotion"
  publishedAt: string
  expiresAt?: string
  pinned?: boolean
}

export interface BlogFilters {
  category?: string
  tag?: string
  search?: string
  page?: number
  limit?: number
}

export interface POIFilters {
  category?: string
  search?: string
  page?: number
  limit?: number
}

const baseUrl = getServerBaseUrl()

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Request failed")
  }
  return response.json()
}

export const contentKeys = {
  all: ["content"] as const,
  blogPosts: (filters?: BlogFilters) =>
    [...contentKeys.all, "blog", filters] as const,
  blogPost: (slug: string) => [...contentKeys.all, "blog", slug] as const,
  helpCategories: () => [...contentKeys.all, "help-categories"] as const,
  helpArticle: (slug: string) => [...contentKeys.all, "help", slug] as const,
  pois: (filters?: POIFilters) =>
    [...contentKeys.all, "pois", filters] as const,
  announcements: () => [...contentKeys.all, "announcements"] as const,
}

export function useBlogPosts(filters?: BlogFilters) {
  return useQuery({
    queryKey: contentKeys.blogPosts(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.set("category", filters.category)
      if (filters?.tag) params.set("tag", filters.tag)
      if (filters?.search) params.set("search", filters.search)
      if (filters?.page) params.set("page", String(filters.page))
      if (filters?.limit) params.set("limit", String(filters.limit))
      const qs = params.toString()
      const response = await fetchApi<{ posts: BlogPost[] }>(
        `/store/content/blog${qs ? `?${qs}` : ""}`,
      )
      return response.posts
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: contentKeys.blogPost(slug),
    queryFn: async () => {
      const response = await fetchApi<{ post: BlogPost }>(
        `/store/content/blog/${slug}`,
      )
      return response.post
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export function useHelpCategories() {
  return useQuery({
    queryKey: contentKeys.helpCategories(),
    queryFn: async () => {
      const response = await fetchApi<{
        categories: HelpCategory[]
        featuredArticles: HelpArticle[]
      }>("/store/content/help")
      return response
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useHelpArticle(slug: string) {
  return useQuery({
    queryKey: contentKeys.helpArticle(slug),
    queryFn: async () => {
      const response = await fetchApi<{ article: HelpArticle }>(
        `/store/content/help/${slug}`,
      )
      return response.article
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePOIs(filters?: POIFilters) {
  return useQuery({
    queryKey: contentKeys.pois(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.set("category", filters.category)
      if (filters?.search) params.set("search", filters.search)
      if (filters?.page) params.set("page", String(filters.page))
      if (filters?.limit) params.set("limit", String(filters.limit))
      const qs = params.toString()
      const response = await fetchApi<{ pois: POI[] }>(
        `/store/content/pois${qs ? `?${qs}` : ""}`,
      )
      return response.pois
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePOI(id: string) {
  return useQuery({
    queryKey: [...contentKeys.all, "poi", id],
    queryFn: async () => {
      const response = await fetchApi<{ poi: POI }>(`/store/content/pois/${id}`)
      return normalizeItem(response.poi)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAnnouncements() {
  return useQuery({
    queryKey: contentKeys.announcements(),
    queryFn: async () => {
      const response = await fetchApi<{ announcements: Announcement[] }>(
        "/store/content/announcements",
      )
      return response.announcements
    },
    staleTime: 2 * 60 * 1000,
  })
}
