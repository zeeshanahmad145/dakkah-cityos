// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/$tenant/$locale/business/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/${params.tenant}/${params.locale}/b2b/dashboard`,
    })
  },
  component: () => null,
})
