// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

export const Route = createFileRoute("/$tenant/$locale/print-on-demand-shop/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$tenant/$locale/print-on-demand/$id", params })
  },
  component: () => null,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Print on Demand Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/print-on-demand/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data }
    } catch { return { item: null } }
  },
})
