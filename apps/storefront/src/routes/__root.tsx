import Layout from "@/components/layout"
import { listRegions } from "@/lib/data/regions"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { lazy, type ReactNode } from "react"
import appCss from "../styles/app.css?url"
import rtlCss from "../styles/rtl.css?url"
import { BrandingProvider } from "@/lib/context/branding-context"
import { AuthProvider } from "@/lib/context/auth-context"
import { StoreProvider } from "@/lib/store-context"
import { ToastProvider } from "@/components/ui/toast"

const NotFound = lazy(() => import("@/components/not-found"))

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async ({ context }) => {
    try {
      const { queryClient } = context
      await queryClient.ensureQueryData({
        queryKey: ["regions"],
        queryFn: () => listRegions({ fields: "id, name, currency_code, *countries" }),
      })
      return {}
    } catch {
      return {}
    }
  },
  head: () => ({
    links: [
      { rel: "icon", href: "/images/medusa.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: rtlCss },
    ],
    meta: [
      { title: "Dakkah CityOS Commerce" },
      { charSet: "UTF-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
    ],
    scripts: [],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
})

function ClientProviders({ children, queryClient }: {
  children: ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider initialStore={null}>
        <AuthProvider>
          <BrandingProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </BrandingProvider>
        </AuthProvider>
      </StoreProvider>
    </QueryClientProvider>
  )
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ClientProviders queryClient={queryClient}>
          <Layout />
        </ClientProviders>
        <Scripts />
      </body>
    </html>
  )
}
