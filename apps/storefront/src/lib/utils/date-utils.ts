export function formatDate(
  date: string | Date | null | undefined,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  if (date == null) return ""

  const d = typeof date === "string" ? new Date(date) : date

  if (isNaN(d.getTime())) return ""

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(d)
}

export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (date == null) return ""

  const d = typeof date === "string" ? new Date(date) : date

  if (isNaN(d.getTime())) return ""

  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

  return formatDate(d)
}

export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
  locale: string = "en-US"
): string {
  const startStr = formatDate(start, locale as import("@/lib/i18n").SupportedLocale)
  const endStr = formatDate(end, locale as import("@/lib/i18n").SupportedLocale)

  if (!startStr && !endStr) return ""
  if (!startStr) return endStr
  if (!endStr) return startStr

  return `${startStr} – ${endStr}`
}

export function parseISODate(isoString: string): Date | null {
  if (!isoString) return null
  const d = new Date(isoString)
  return isNaN(d.getTime()) ? null : d
}
