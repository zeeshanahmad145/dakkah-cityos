import en from "./locales/en.json"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"

export type SupportedLocale = "en" | "fr" | "ar"

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "fr", "ar"]

const translations: Record<string, typeof en> = { en, fr, ar }

export function t(locale: string, key: string, fallback?: string): string {
  const keys = key.split(".")
  let value: any = translations[locale] || translations.en
  for (const k of keys) {
    value = value?.[k]
  }
  return value || fallback || key
}

export const LOCALE_CONFIG: Record<
  SupportedLocale,
  {
    name: string
    nativeName: string
    direction: "ltr" | "rtl"
    dateFormat: string
    numberFormat: string
  }
> = {
  en: {
    name: "English",
    nativeName: "English",
    direction: "ltr",
    dateFormat: "MM/dd/yyyy",
    numberFormat: "en-US",
  },
  fr: {
    name: "French",
    nativeName: "Français",
    direction: "ltr",
    dateFormat: "dd/MM/yyyy",
    numberFormat: "fr-FR",
  },
  ar: {
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    dateFormat: "dd/MM/yyyy",
    numberFormat: "ar-SA",
  },
}

export function isRTL(locale: string): boolean {
  return locale === "ar"
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr"
}

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

export function formatDate(
  date: Date | string,
  locale: SupportedLocale = "en",
): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US",
  ).format(d)
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: SupportedLocale = "en",
): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  }
  return new Intl.NumberFormat(localeMap[locale] || "en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = "en",
): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  }
  return new Intl.NumberFormat(localeMap[locale] || "en-US").format(value)
}
