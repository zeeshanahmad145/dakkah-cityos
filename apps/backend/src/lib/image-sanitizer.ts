import * as fs from "fs"
import * as path from "path"

const SEED_IMAGES_DIR = path.resolve(__dirname, "../../static/seed-images")

const imageCache: Record<string, string[]> = {}

function getLocalImages(vertical: string): string[] {
  if (imageCache[vertical]) return imageCache[vertical]
  try {
    const dir = path.join(SEED_IMAGES_DIR, vertical)
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".webp"))
    imageCache[vertical] = files
    return files
  } catch {
    imageCache[vertical] = []
    return []
  }
}

function toLocalUrl(vertical: string, filename: string): string {
  return `/seed-images/${vertical}%2F${filename}`
}

function isUnsplashUrl(url: string): boolean {
  return typeof url === "string" && url.includes("unsplash.com")
}

function extractUnsplashId(url: string): string | null {
  const match = url.match(/photo-([a-f0-9-]+)/)
  return match ? match[1] : null
}

function replaceUrl(url: string, vertical: string, index: number): string {
  if (!isUnsplashUrl(url)) return url
  const localImages = getLocalImages(vertical)
  if (localImages.length === 0) return url

  const unsplashId = extractUnsplashId(url)
  if (unsplashId) {
    const match = localImages.find(f => f.includes(unsplashId))
    if (match) return toLocalUrl(vertical, match)
  }

  const fallback = localImages[index % localImages.length]
  return toLocalUrl(vertical, fallback)
}

export function sanitizeImageUrls<T extends Record<string, any>>(
  item: T,
  vertical: string,
  imageFields: string[],
  index: number = 0
): T {
  const result = { ...item }
  for (const field of imageFields) {
    const val = result[field]
    if (typeof val === "string" && isUnsplashUrl(val)) {
      (result as any)[field] = replaceUrl(val, vertical, index)
    } else if (Array.isArray(val)) {
      (result as any)[field] = val.map((v: any, i: number) =>
        typeof v === "string" && isUnsplashUrl(v) ? replaceUrl(v, vertical, index + i) : v
      )
    }
  }

  if (result.metadata && typeof result.metadata === "object") {
    const md = { ...result.metadata } as Record<string, any>
    for (const key of ["thumbnail", "image", "cover_image", "logo", "banner"]) {
      if (typeof md[key] === "string" && isUnsplashUrl(md[key])) {
        md[key] = replaceUrl(md[key], vertical, index)
      }
    }
    if (Array.isArray(md.images)) {
      md.images = md.images.map((v: any, i: number) =>
        typeof v === "string" && isUnsplashUrl(v) ? replaceUrl(v, vertical, index + i) : v
      )
    }
    (result as any).metadata = md
  }

  return result
}

export function sanitizeList<T extends Record<string, any>>(
  items: T[],
  vertical: string,
  imageFields: string[] = ["thumbnail", "image", "logo_url", "banner_url", "cover_image", "photo"]
): T[] {
  return items.map((item, i) => sanitizeImageUrls(item, vertical, imageFields, i))
}
