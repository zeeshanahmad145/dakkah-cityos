import React, { useState } from "react"

interface DownloadItem {
  id: string
  productName: string
  purchaseDate: string
  fileSize: string
  fileName: string
  downloadCount: number
  maxDownloads: number
  expiresAt?: string
  downloadUrl?: string
}

interface DownloadsPageProps {
  downloads?: DownloadItem[]
  loading?: boolean
}

const sampleDownloads: DownloadItem[] = [
  { id: "1", productName: "Design System Guide", purchaseDate: "2026-01-15", fileSize: "12.5 MB", fileName: "design-system-v2.pdf", downloadCount: 2, maxDownloads: 5 },
  { id: "2", productName: "Photography Preset Pack", purchaseDate: "2026-01-10", fileSize: "45.8 MB", fileName: "presets-pro.zip", downloadCount: 1, maxDownloads: 3 },
  { id: "3", productName: "Audio Sample Library", purchaseDate: "2025-11-20", fileSize: "234.1 MB", fileName: "samples-collection.zip", downloadCount: 3, maxDownloads: 3, expiresAt: "2025-12-20" },
]

export function DownloadsPage({ downloads = sampleDownloads, loading = false }: DownloadsPageProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const isExpired = (item: DownloadItem) => {
    if (!item.expiresAt) return false
    return new Date(item.expiresAt!) < new Date()
  }

  const isMaxedOut = (item: DownloadItem) => {
    return item.downloadCount >= item.maxDownloads
  }

  const handleDownload = (item: DownloadItem) => {
    if (isExpired(item) || isMaxedOut(item)) return
    setDownloadingId(item.id)
    setTimeout(() => setDownloadingId(null), 2000)
  }

  const handleDownloadAll = () => {
    const available = downloads.filter((d) => !isExpired(d) && !isMaxedOut(d))
    if (available.length === 0) return
    setDownloadingId("all")
    setTimeout(() => setDownloadingId(null), 3000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const availableCount = downloads.filter((d) => !isExpired(d) && !isMaxedOut(d)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ds-foreground">Digital Downloads</h2>
          <p className="text-sm text-ds-muted-foreground">{downloads.length} products purchased</p>
        </div>
        {availableCount > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloadingId === "all"}
            className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {downloadingId === "all" ? "Downloading..." : `Download All (${availableCount})`}
          </button>
        )}
      </div>

      {downloads.length === 0 ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <span className="text-3xl block mb-3">📥</span>
          <p className="text-sm text-ds-muted-foreground">No digital products purchased yet.</p>
        </div>
      ) : (
        <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px_100px] gap-4 px-4 py-3 bg-ds-muted border-b border-ds-border text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
            <span>Product</span>
            <span>Purchase Date</span>
            <span>File Size</span>
            <span>Downloads</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-ds-border">
            {downloads.map((item) => {
              const expired = isExpired(item)
              const maxed = isMaxedOut(item)
              const disabled = expired || maxed

              return (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex flex-col md:grid md:grid-cols-[1fr_120px_100px_120px_100px] gap-2 md:gap-4 items-start md:items-center ${
                    disabled ? "opacity-50" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-ds-foreground">{item.productName}</p>
                    <p className="text-xs text-ds-muted-foreground">{item.fileName}</p>
                  </div>
                  <span className="text-sm text-ds-muted-foreground">
                    {new Date(item.purchaseDate!).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-ds-muted-foreground">{item.fileSize}</span>
                  <div>
                    <span className="text-sm text-ds-muted-foreground">
                      {item.downloadCount}/{item.maxDownloads}
                    </span>
                    <div className="w-full bg-ds-muted rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${maxed ? "bg-ds-destructive" : "bg-ds-primary"}`}
                        style={{ width: `${(item.downloadCount / item.maxDownloads) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    {expired ? (
                      <span className="text-xs text-ds-destructive font-medium">Expired</span>
                    ) : maxed ? (
                      <span className="text-xs text-ds-destructive font-medium">Limit reached</span>
                    ) : (
                      <button
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                        className="px-3 py-1.5 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {downloadingId === item.id ? "..." : "Download"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
