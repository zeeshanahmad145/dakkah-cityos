import { appConfig } from "../lib/config"

export interface SeedContext {
  tenantId: string
  storeId: string
  salesChannelIds: string[]
  regionId: string
  apiKeyId: string
  stockLocationId: string
  shippingProfileId: string
  categoryIds: Record<string, string>
  productIds: string[]
  customerIds: string[]
  vendorIds: string[]
  companyIds: string[]
}

const IMAGE_CATALOG: Record<string, string[]> = {
  electronics: [
    "1526738549149-8e07eca6c147",
    "1523275335684-37898b6baf30",
    "1505740420928-5e560c06d30e",
    "1610945265064-0e34e5519bbf",
    "1498049794561-7780e7231661",
    "1461896836934-ffe607ba8211",
    "1519389950473-47ba0277781c",
    "1514228742587-6b1558fcca3d",
  ],
  fashion: [
    "1445205170230-053b83016050",
    "1556821840-3a63f95609a7",
    "1521572163474-6864f9cf17ab",
    "1515562141207-7a88fb7ce338",
    "1552674605-db6ffd4facb5",
    "1514228742587-6b1558fcca3d",
    "1556742049-0cfed4f6a45d",
  ],
  food: [
    "1504674900247-0877df9cc836",
    "1473093295043-cdd812d0e601",
    "1447933601403-0c6688de566e",
    "1589656966895-2f33e7653819",
    "1509042239860-f550ce710b93",
    "1555041469-a586c61ea9bc",
    "1517248135467-4c7edcad34c4",
  ],
  grocery: [
    "1542838132-92c53300491e",
    "1556228578-8c89e6adf883",
    "1602143407151-7111542de6e8",
    "1506484381186-d0bd208751a7",
    "1543168256-418811576931",
    "1550989460-0adf9ea622e2",
  ],
  home: [
    "1560448204-e02f11c3d0e2",
    "1581578731548-c64695cc6952",
    "1599643478518-a784e5dc4c8f",
    "1618221195710-dd6b41faaea6",
    "1556909114-f6e7ad7d3136",
    "1555041469-a586c61ea9bc",
  ],
  beauty: [
    "1588405748880-12d1d2a59f75",
    "1587017539504-67cfbddac569",
    "1596462502278-27bfdc403348",
    "1571781926291-c477ebfd024b",
    "1522335789203-aabd1fc54bc9",
    "1512496015851-a90fb38ba796",
  ],
  automotive: [
    "1503376780353-7e6692767b70",
    "1492144534655-ae79c964c9d7",
    "1494976388531-d1058494cdd8",
    "1489824904134-891ab64532f1",
    "1580273916550-e323b7adbe07",
    "1449130320544-cf37a3432f44",
  ],
  healthcare: [
    "1519494026892-80bbd2d6fd0d",
    "1576091160399-112ba8d25d1d",
    "1530026405186-ed1f139313f8",
    "1551601651-bc60f254d532",
    "1579684385127-1ef15d508118",
    "1538108149393-fbbd81895907",
  ],
  fitness: [
    "1544816155-12df9643f363",
    "1608248543803-ba4f8c70ae0b",
    "1571019613454-1cb2f99b2d8b",
    "1518611012118-696072aa579a",
    "1574680096145-d05b13162c63",
    "1534438327276-14e5300c3a48",
  ],
  travel: [
    "1486406146926-c627a92ad1ab",
    "1466442929976-97f336a657be",
    "1539037116277-4db20889f2d4",
    "1506929562872-bb421503ef21",
    "1520250497591-112f2f40a3f4",
    "1469854523086-cc02fe5d8800",
  ],
  education: [
    "1519389950473-47ba0277781c",
    "1490481651871-ab68de25d43d",
    "1503454537195-1dcabb73ffb9",
    "1515488042361-ee00e0ddd4e4",
    "1497633762265-9d179a990aa6",
    "1524178232363-1fb2b075b655",
  ],
  real_estate: [
    "1486406146926-c627a92ad1ab",
    "1497366216548-37526070297c",
    "1560185127-6ed189bf02f4",
    "1560518883-ce09059eeffa",
    "1545324418-cc1a3fa10c00",
    "1512917774080-9991f1c4c750",
  ],
  restaurant: [
    "1517248135467-4c7edcad34c4",
    "1555041469-a586c61ea9bc",
    "1504674900247-0877df9cc836",
    "1473093295043-cdd812d0e601",
    "1414235077428-338989a2e8c0",
    "1552566626-98f62a8a0a33",
  ],
  pets: [
    "1494976388531-d1058494cdd8",
    "1587300003388-59208cc962cb",
    "1548199973-03cce0bbc87b",
    "1450778869180-41d0601e0e68",
    "1583511655826-05700d52f4d9",
    "1415369629372-26f2fe60c467",
  ],
  legal: [
    "1589829545856-d10d557cf95f",
    "1505664194779-8beaceb93744",
    "1450101499163-c8848e968838",
    "1479142506502-19b3a3b7ff33",
    "1521791055727-0637c0e61a68",
  ],
  financial: [
    "1526304640581-d334cdbbf45e",
    "1554224155-6726b3ff858f",
    "1460925895917-afdab827c52f",
    "1444653614773-995cb1ef9efa",
    "1497366216548-37526070297c",
    "1507679799987-c73779587ccf",
  ],
  government: [
    "1486406146926-c627a92ad1ab",
    "1555685812-4b943f1cb0eb",
    "1523995462485-3d171b5c8fa9",
    "1541872703-a56853f91985",
    "1577495508048-b635879837f1",
  ],
  charity: [
    "1488521787991-ed7bbaae773c",
    "1532629345422-7515f3d16bb6",
    "1559027615-cd4628902d4a",
    "1469571486292-0ba58a3f068b",
    "1593113630400-ea4288922497",
  ],
  events: [
    "1540575467063-178a50c2df87",
    "1501281668745-f7f57925c3b4",
    "1492684223f3-73e31b89c846",
    "1505373877841-8d25f7d46678",
    "1519671482749-fd09be7ccebf",
    "1464366400600-7168b8af9bc3",
  ],
  parking: [
    "1506521781263-d8422e82f76d",
    "1573348722427-f1d6819fdf98",
    "1558618666-fcd25c85f7aa",
    "1545179605-1e4fce14fa43",
    "1470224114660-3f6686c562eb",
  ],
  freelance: [
    "1497366216548-37526070297c",
    "1519389950473-47ba0277781c",
    "1498049794561-7780e7231661",
    "1522071820081-009f0129c71c",
    "1497215842964-222b430dc094",
    "1517502884422-41eaead166d4",
  ],
  auction: [
    "1513364776144-60967b0f800f",
    "1578662996442-48f60103fc96",
    "1544967082-d9d25d867d66",
    "1531685250784-a1cf226d3bcc",
    "1541367777708-7905fe3296c0",
  ],
  rental: [
    "1503376780353-7e6692767b70",
    "1560185127-6ed189bf02f4",
    "1449130320544-cf37a3432f44",
    "1580273916550-e323b7adbe07",
    "1497366216548-37526070297c",
  ],
  digital: [
    "1519389950473-47ba0277781c",
    "1526738549149-8e07eca6c147",
    "1498049794561-7780e7231661",
    "1490481651871-ab68de25d43d",
    "1461896836934-ffe607ba8211",
    "1504384308090-c894fdcc538d",
  ],
  booking: [
    "1560066984-138dadb4c035",
    "1522337360788-8b13dee7a37e",
    "1506377247377-2a5b3b417ebb",
    "1540555700478-4be289fbecef",
    "1596462502278-27bfdc403348",
  ],
  vendor: [
    "1441986300917-64674bd600d8",
    "1556742049-0cfed4f6a45d",
    "1542838132-92c53300491e",
    "1486406146926-c627a92ad1ab",
    "1497366216548-37526070297c",
    "1517248135467-4c7edcad34c4",
  ],
}

export function getImage(category: string, index: number, _width = 800): string {
  return getBucketImageUrl(category, index, false)
}

export function getThumb(category: string, index: number): string {
  return getBucketThumb(category, index)
}

export function sarPrice(amount: number): number {
  return Math.round(amount * 100)
}

const SAUDI_CITIES = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Dhahran",
  "Tabuk",
  "Abha",
  "Taif",
  "Hail",
  "Buraidah",
  "Najran",
  "Jizan",
  "Yanbu",
  "Al Jubail",
  "Khamis Mushait",
  "Al Ahsa",
]

export function randomSaudiCity(): string {
  return SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)]
}

export function saudiPhone(): string {
  const prefix = "05"
  const suffixes = ["0", "3", "4", "5", "6", "7", "8", "9"]
  const third = suffixes[Math.floor(Math.random() * suffixes.length)]
  let rest = ""
  for (let i = 0; i < 7; i++) {
    rest += Math.floor(Math.random() * 10).toString()
  }
  return `+966${prefix}${third}${rest}`
}

export function log(section: string, msg: string): string {
  const formatted = `[${section}] ${msg}`
  return formatted
}

let _gcsStorage: any = null
let _bucketUploadAvailable: boolean | null = null

function getGcsStorage() {
  if (_gcsStorage) return _gcsStorage
  try {
    const { Storage } = require("@google-cloud/storage")
    const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106"
    _gcsStorage = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: { type: "json", subject_token_field_name: "access_token" },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    })
    return _gcsStorage
  } catch (e) {
    return null
  }
}

export async function uploadImageToBucket(buffer: Buffer, path: string, contentType: string): Promise<boolean> {
  try {
    const storage = getGcsStorage()
    if (!storage) return false
    const bucketName = appConfig.storage.replitBucketId
    if (!bucketName) return false
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(path)
    await file.save(buffer, { contentType, resumable: false })
    return true
  } catch (e: any) {
    console.error(`[storage] Upload failed for ${path}: ${e.message}`)
    return false
  }
}

export async function checkBucketAvailable(): Promise<boolean> {
  if (_bucketUploadAvailable !== null) return _bucketUploadAvailable
  try {
    const storage = getGcsStorage()
    if (!storage) {
      _bucketUploadAvailable = false
      return false
    }
    const bucketName = appConfig.storage.replitBucketId
    if (!bucketName) {
      _bucketUploadAvailable = false
      return false
    }
    const bucket = storage.bucket(bucketName)
    const testFile = bucket.file("_health_check.txt")
    await testFile.save(Buffer.from("ok"), { contentType: "text/plain", resumable: false })
    _bucketUploadAvailable = true
    return true
  } catch (e) {
    _bucketUploadAvailable = false
    return false
  }
}

async function downloadImageBuffer(unsplashId: string, width: number = 800): Promise<Buffer | null> {
  try {
    const url = `https://images.unsplash.com/photo-${unsplashId}?w=${width}&q=80&fit=crop`
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (e) {
    return null
  }
}

export function getBucketImageUrl(category: string, index: number, isThumb: boolean = false): string {
  const images = IMAGE_CATALOG[category] || IMAGE_CATALOG.electronics
  const safeIdx = index % images.length
  const suffix = isThumb ? "-thumb" : ""
  const objectPath = `media/products/${category}/${category}-${safeIdx}${suffix}.jpg`
  return `/platform/storage/serve?path=${encodeURIComponent(objectPath)}`
}

export function getBucketThumb(category: string, index: number): string {
  return getBucketImageUrl(category, index, true)
}

export function getBucketImages(category: string, indices: number[]): { url: string }[] {
  return indices.map(i => ({ url: getBucketImageUrl(category, i, false) }))
}

export async function downloadAndUploadImage(
  unsplashId: string,
  category: string,
  index: number,
  productHandle?: string,
  width: number = 800
): Promise<string> {
  const fallbackUrl = `https://images.unsplash.com/photo-${unsplashId}?w=${width}&q=80&fit=crop`

  const available = await checkBucketAvailable()
  if (!available) return fallbackUrl

  const filename = productHandle
    ? `${productHandle}-${index}.jpg`
    : `${category}-${index}.jpg`
  const objectPath = `media/products/${category}/${filename}`

  const buffer = await downloadImageBuffer(unsplashId, width)
  if (!buffer) return fallbackUrl

  const success = await uploadImageToBucket(buffer, objectPath, "image/jpeg")
  if (!success) return fallbackUrl

  return `/platform/storage/serve?path=${encodeURIComponent(objectPath)}`
}

export async function getStoredThumb(
  category: string,
  index: number,
  productHandle: string
): Promise<string> {
  const images = IMAGE_CATALOG[category] || IMAGE_CATALOG.electronics
  const id = images[index % images.length]
  return downloadAndUploadImage(id, category, index, `${productHandle}-thumb`, 400)
}

export async function getStoredImages(
  category: string,
  indices: number[],
  productHandle: string
): Promise<{ url: string }[]> {
  const images = IMAGE_CATALOG[category] || IMAGE_CATALOG.electronics
  const results: { url: string }[] = []

  for (const idx of indices) {
    const id = images[idx % images.length]
    const url = await downloadAndUploadImage(id, category, idx, productHandle, 800)
    results.push({ url })
  }

  return results
}

export function getMultipleImages(
  category: string,
  startIndex: number,
  count: number
): { url: string }[] {
  const indices = Array.from({ length: count }, (_, i) => startIndex + i)
  return getBucketImages(category, indices)
}

export async function preUploadCategoryImages(
  logger: { info: (msg: string) => void; error: (msg: string) => void }
): Promise<Map<string, string[]>> {
  const uploadedPaths = new Map<string, string[]>()
  const available = await checkBucketAvailable()

  if (!available) {
    logger.info("  Bucket not available, will use Unsplash URLs as fallback")
    return uploadedPaths
  }

  logger.info("  Bucket available, pre-uploading category images...")

  const categoriesToUpload = Object.keys(IMAGE_CATALOG)

  let uploaded = 0
  let failed = 0

  for (const category of categoriesToUpload) {
    const images = IMAGE_CATALOG[category] || []
    const paths: string[] = []

    for (let i = 0; i < Math.min(images.length, 6); i++) {
      const id = images[i]
      const objectPath = `media/products/${category}/${category}-${i}.jpg`
      const buffer = await downloadImageBuffer(id, 800)
      if (buffer) {
        const success = await uploadImageToBucket(buffer, objectPath, "image/jpeg")
        if (success) {
          paths.push(`/platform/storage/serve?path=${encodeURIComponent(objectPath)}`)
          uploaded++
        } else {
          failed++
        }
      } else {
        failed++
      }
    }

    if (images.length > 0) {
      const thumbId = images[0]
      const thumbPath = `media/products/${category}/${category}-thumb-0.jpg`
      const thumbBuffer = await downloadImageBuffer(thumbId, 400)
      if (thumbBuffer) {
        const success = await uploadImageToBucket(thumbBuffer, thumbPath, "image/jpeg")
        if (success) {
          paths.push(`/platform/storage/serve?path=${encodeURIComponent(thumbPath)}`)

          uploaded++
        }
      }
    }

    uploadedPaths.set(category, paths)
    logger.info(`  ${category}: ${paths.length} images uploaded`)
  }

  logger.info(`  Pre-upload complete: ${uploaded} uploaded, ${failed} failed`)
  return uploadedPaths
}

export { IMAGE_CATALOG }
