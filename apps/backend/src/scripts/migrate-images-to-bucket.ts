// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { uploadImageToBucket, checkBucketAvailable } from "./seed-utils"

interface ImageRecord {
  table: string
  column: string
  id: string
  url: string
}

function extractUnsplashId(url: string): string | null {
  const match = url.match(/photo-([^?&]+)/)
  return match ? match[1] : null
}

function isBucketUrl(url: string): boolean {
  return url.includes("/platform/storage/serve?path=")
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

export default async function migrateImagesToBucket({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  logger.info("==========================================")
  logger.info("Starting Image Migration: Unsplash → Bucket")
  logger.info("==========================================\n")

  // Check if bucket is available
  const bucketAvailable = await checkBucketAvailable()
  if (!bucketAvailable) {
    logger.error("❌ Object Storage bucket is not available. Cannot proceed.")
    return
  }
  logger.info("✓ Object Storage bucket is available\n")

  // Define tables and columns to scan
  const tablesToScan: Array<{ table: string; columns: string[] }> = [
    { table: "image", columns: ["url"] },
    { table: "restaurant", columns: ["logo_url", "banner_url"] },
    { table: "review", columns: ["images"] },
    { table: "product", columns: ["thumbnail"] },
    { table: "store", columns: ["logo_url"] },
    { table: "tenant", columns: ["logo_url"] },
    { table: "vendor", columns: ["logo_url", "banner_url"] },
    { table: "vendor_order", columns: ["thumbnail"] },
    { table: "menu_item", columns: ["image_url"] },
    { table: "event", columns: ["image_url"] },
    { table: "venue", columns: ["image_url"] },
    { table: "reward", columns: ["image_url"] },
    { table: "reward_tier", columns: ["image_url"] },
    { table: "live_stream", columns: ["thumbnail_url"] },
    { table: "course", columns: ["thumbnail_url"] },
    { table: "charity_org", columns: ["logo_url"] },
    { table: "ad_creative", columns: ["image_url"] },
    { table: "purchase_order_item", columns: ["thumbnail"] },
    { table: "quote_item", columns: ["thumbnail"] },
  ]

  const allImages: ImageRecord[] = []

  // Scan all tables for Unsplash URLs
  logger.info("Scanning database tables for Unsplash image URLs...\n")

  for (const { table, columns } of tablesToScan) {
    for (const column of columns) {
      try {
        const query = `SELECT id, "${column}" as url FROM "${table}" WHERE "${column}" LIKE '%unsplash%' OR "${column}" LIKE '%images.unsplash.com%'`
        const result = await pgConnection.raw(query)
        const rows = result.rows || result

        if (rows && rows.length > 0) {
          logger.info(`  Found ${rows.length} records in ${table}.${column}`)

          for (const row of rows) {
            if (row.url && typeof row.url === "string" && !isBucketUrl(row.url)) {
              allImages.push({
                table,
                column,
                id: row.id,
                url: row.url,
              })
            }
          }
        }
      } catch (error: any) {
        // Table or column might not exist, continue silently
      }
    }
  }

  // Handle review.images column which is JSON
  try {
    const reviewQuery = `SELECT id, images FROM "review" WHERE images IS NOT NULL AND images != '[]'`
    const result = await pgConnection.raw(reviewQuery)
    const rows = result.rows || result

    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (row.images && Array.isArray(row.images)) {
          for (let i = 0; i < row.images.length; i++) {
            const img = row.images[i]
            if (typeof img === "string" && img.includes("unsplash")) {
              allImages.push({
                table: "review",
                column: `images[${i}]`,
                id: row.id,
                url: img,
              })
            } else if (typeof img === "object" && img.url && img.url.includes("unsplash")) {
              allImages.push({
                table: "review",
                column: `images[${i}].url`,
                id: row.id,
                url: img.url,
              })
            }
          }
        }
      }
    }
  } catch (error: any) {
    // Continue if review.images doesn't exist or is empty
  }

  logger.info(`\nTotal Unsplash URLs found: ${allImages.length}\n`)

  if (allImages.length === 0) {
    logger.info("✓ No Unsplash URLs found. Migration complete.")
    return
  }

  // Process images in batches
  const batchSize = 10
  let successCount = 0
  let failureCount = 0

  logger.info(`Processing ${allImages.length} images in batches of ${batchSize}...\n`)

  for (let i = 0; i < allImages.length; i += batchSize) {
    const batch = allImages.slice(i, i + batchSize)

    for (const record of batch) {
      try {
        const unsplashId = extractUnsplashId(record.url)
        if (!unsplashId) {
          logger.warn(`  ⚠ Could not extract Unsplash ID from: ${record.url}`)
          failureCount++
          continue
        }

        // Download image
        const buffer = await downloadImageBuffer(unsplashId)
        if (!buffer) {
          logger.warn(`  ⚠ Failed to download image from Unsplash: ${unsplashId}`)
          failureCount++
          continue
        }

        // Upload to bucket
        const objectPath = `media/${record.table}/${record.table}-${record.id}.jpg`
        const uploaded = await uploadImageToBucket(buffer, objectPath, "image/jpeg")

        if (!uploaded) {
          logger.warn(`  ⚠ Failed to upload to bucket: ${objectPath}`)
          failureCount++
          continue
        }

        // Update database
        const bucketUrl = `/platform/storage/serve?path=${encodeURIComponent(objectPath)}`

        if (record.column === "images" && record.table === "review") {
          // Handle simple array of URLs in review.images
          await pgConnection.raw(
            `UPDATE "review" SET "images" = array_replace("images", ?, ?) WHERE id = ?`,
            [record.url, bucketUrl, record.id]
          )
        } else if (record.column.startsWith("images[") && record.table === "review") {
          // Handle array of objects in review.images - update the entire array
          const currentReview = await pgConnection.raw(
            `SELECT images FROM "review" WHERE id = ?`,
            [record.id]
          )
          const currentRows = currentReview.rows || currentReview
          if (currentRows && currentRows[0]) {
            let images = currentRows[0].images || []
            // Update the array
            images = images.map((img: any) => {
              if (typeof img === "string" && img === record.url) {
                return bucketUrl
              } else if (typeof img === "object" && img.url === record.url) {
                return { ...img, url: bucketUrl }
              }
              return img
            })
            await pgConnection.raw(`UPDATE "review" SET "images" = ? WHERE id = ?`, [
              JSON.stringify(images),
              record.id,
            ])
          }
        } else {
          // Handle regular columns
          const columnName = record.column
          await pgConnection.raw(
            `UPDATE "${record.table}" SET "${columnName}" = ? WHERE id = ?`,
            [bucketUrl, record.id]
          )
        }

        successCount++
        logger.info(`  ✓ ${record.table}.${record.column} [${record.id}]`)
      } catch (error: any) {
        logger.error(`  ✗ Error processing ${record.table}.${record.column}: ${error.message}`)
        failureCount++
      }
    }

    logger.info(`  Progress: ${Math.min(i + batchSize, allImages.length)}/${allImages.length}`)
  }

  logger.info("\n==========================================")
  logger.info("Image Migration Complete")
  logger.info("==========================================")
  logger.info(`✓ Successfully migrated: ${successCount} images`)
  logger.info(`✗ Failed: ${failureCount} images`)
  logger.info(`Total processed: ${successCount + failureCount}/${allImages.length}`)
  logger.info("==========================================")
}
