import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { DownloadManager } from "@/components/digital/download-manager"
import { useMyDownloads } from "@/lib/hooks/use-digital-products"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/downloads")({
  component: DownloadsPage,
})

function DownloadsPage() {
  const { locale } = Route.useParams() as { locale: string }
  const { data: downloads, isLoading } = useMyDownloads()

  return (
    <AccountLayout title={t(locale, "account.downloads_title", "My Downloads")} description={t(locale, "account.downloads_description", "Your purchased digital products")}>
      <DownloadManager downloads={downloads || []} loading={isLoading} />
    </AccountLayout>
  )
}
