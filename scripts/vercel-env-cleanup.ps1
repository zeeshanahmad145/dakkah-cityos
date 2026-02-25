$keys = @(
    # All commerce_db_* (redundant - DATABASE_URL already set)
    "commerce_db_DATABASE_URL", "commerce_db_DATABASE_URL_UNPOOLED", "commerce_db_NEON_PROJECT_ID",
    "commerce_db_PGDATABASE", "commerce_db_PGHOST", "commerce_db_PGHOST_UNPOOLED",
    "commerce_db_PGPASSWORD", "commerce_db_PGUSER", "commerce_db_POSTGRES_DATABASE",
    "commerce_db_POSTGRES_HOST", "commerce_db_POSTGRES_PASSWORD", "commerce_db_POSTGRES_PRISMA_URL",
    "commerce_db_POSTGRES_URL", "commerce_db_POSTGRES_URL_NO_SSL", "commerce_db_POSTGRES_URL_NON_POOLING",
    "commerce_db_POSTGRES_USER",
    # Individual PG* vars (redundant with DATABASE_URL)
    "PGDATABASE", "PGHOST", "PGHOST_UNPOOLED", "PGPASSWORD", "PGUSER",
    # Individual POSTGRES_* vars (redundant with DATABASE_URL)
    "POSTGRES_DATABASE", "POSTGRES_HOST", "POSTGRES_PASSWORD", "POSTGRES_PRISMA_URL",
    "POSTGRES_URL", "POSTGRES_URL_NO_SSL", "POSTGRES_URL_NON_POOLING", "POSTGRES_USER",
    # Duplicate DB vars
    "NEON_DATABASE_URL", "DATABASE_URL_UNPOOLED",
    # Minio (not used on Vercel - using Blob storage)
    "MINIO_AISTOR_KEY", "MINIO_BUCKET", "MINIO_ENDPOINT", "MINIO_ROOT_PASSWORD", "MINIO_ROOT_USER", "ENABLE_MINIO",
    # Storefront/frontend-only vars
    "VITE_MEDUSA_BACKEND_URL", "VITE_MEDUSA_PUBLISHABLE_KEY",
    "STOREFRONT_PORT", "STOREFRONT_URL", "STOREFRONT_URL_LOCAL", "NEXT_PUBLIC_MAPBOX_TOKEN",
    # CMS (Payload) vars - not needed in Medusa backend
    "PAYLOAD_SECRET", "PAYLOAD_PUBLIC_SERVER_URL", "PAYLOAD_CMS_URL_LOCAL", "cms_blob_READ_WRITE_TOKEN",
    # Replit Object Storage (not on Vercel)
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID", "PUBLIC_OBJECT_SEARCH_PATHS", "PRIVATE_OBJECT_DIR",
    # Local/dev URLs (not needed in Vercel production)
    "MEDUSA_BACKEND_URL_LOCAL", "MEDUSA_BACKEND_PORT",
    "ERPNEXT_URL_LOCAL", "FLEETBASE_URL_LOCAL", "WALTID_URL_LOCAL",
    # Duplicate/redundant
    "MEDUSA_API_URL",
    # Vercel-managed automatically
    "PORT", "NODE_ENV",
    # Non-critical / not used
    "LOG_LEVEL", "SERVICE_NAME", "APP_VERSION",
    # Firebase (not connected in medusa-config)
    "FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_JSON", "GOOGLE_APPLICATION_CREDENTIALS",
    # Replit-specific CORS helper
    "__MEDUSA_ADDITIONAL_ALLOWED_HOSTS",
    # Misc
    "SENDGRID_FROM", "SEED_DB"
)

$ok = 0
$fail = 0
foreach ($k in $keys) {
    Write-Host -NoNewline "Removing $k ... "
    $out = vercel env rm $k production --scope mvp-lab-team --yes 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $out -match "Removed|Success|removed") {
        Write-Host "OK"
        $ok++
    }
    else {
        Write-Host "SKIP ($($out.Trim() | Select-Object -Last 1))"
        $fail++
    }
}
Write-Host ""
Write-Host "Complete: $ok removed, $fail skipped/not-found"
