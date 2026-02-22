// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"

export const Route = createFileRoute("/$tenant/$locale/crowdfunding/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$tenant/$locale/campaigns/$id", params })
  },
  component: () => null,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Crowdfunding Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/crowdfunding/campaigns/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data }
    } catch { return { item: null } }
  },
})
