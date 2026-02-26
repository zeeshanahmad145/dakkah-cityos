import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"

export function useManageProducts(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["manage", "products", limit, offset],
    queryFn: async () => {
      const response = await sdk.client.fetch("/store/products", {
        method: "GET",
        query: {
          limit,
          offset,
          fields:
            "id,title,thumbnail,status,variants.prices.*,variants.inventory_quantity",
        },
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })
}

export function useManageOrders(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["manage", "orders", limit, offset],
    queryFn: async () => {
      const response = await sdk.client.fetch("/store/orders", {
        method: "GET",
        query: { limit, offset },
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })
}

export function useManageCustomers() {
  return useQuery({
    queryKey: ["manage", "customers"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/store/customers/me", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })
}

export function useManageStats() {
  return useQuery({
    queryKey: ["manage", "stats"],
    queryFn: async () => {
      try {
        const [productsRes] = await Promise.all([
          sdk.client.fetch("/store/products", {
            method: "GET",
            query: { limit: 0, offset: 0 },
          }),
        ])
        return {
          totalProducts: (productsRes as any)?.count || 0,
          totalOrders: 0,
          totalRevenue: 0,
          teamMembers: 0,
        }
      } catch {
        return {
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          teamMembers: 0,
        }
      }
    },
    enabled: typeof window !== "undefined",
    retry: false,
  })
}
