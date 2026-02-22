# Storefront Migration Guide — Moving to Dakkah CityOS CMS Project

This guide covers everything needed to migrate the storefront from this Medusa commerce monorepo into the Dakkah CityOS CMS (Payload) project.

## Migration Overview

| Item | Source (this repo) | Target (CMS repo) |
|---|---|---|
| Storefront app | `apps/storefront/` | `apps/storefront/` (new) |
| Design Runtime | `packages/cityos-design-runtime/` | `packages/cityos-design-runtime/` |
| Design Tokens | `packages/cityos-design-tokens/` | `packages/cityos-design-tokens/` |
| Design System | `packages/cityos-design-system/` | `packages/cityos-design-system/` |

## 1. Storefront Structure

```
apps/storefront/
├── src/                    # 1,041 files, ~8.5 MB
│   ├── routes/             # TanStack file-based routes
│   │   ├── $tenant/        # Tenant-scoped routes (all verticals)
│   │   ├── __root.tsx      # Root layout
│   │   └── index.tsx       # Landing page
│   ├── components/         # React components
│   ├── lib/                # Utilities, custom-api, SDK setup
│   └── ...
├── vite.config.ts          # TanStack Start + Vite config
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── vercel.json             # Vercel deployment config
```

## 2. Dependencies to Copy

### Shared Packages (copy entire directories)
These must move to `packages/` in the CMS monorepo:

| Package | Directory | Files | Purpose |
|---|---|---|---|
| `@dakkah-cityos/design-runtime` | `packages/cityos-design-runtime/` | 5 files | ThemeProvider, runtime context |
| `@dakkah-cityos/design-tokens` | `packages/cityos-design-tokens/` | 9 files | Colors, typography, spacing, borders, shadows, motion |
| `@dakkah-cityos/design-system` | `packages/cityos-design-system/` | 45 files | Component type system, CMS block definitions |

### Key NPM Dependencies
```json
{
  "@medusajs/js-sdk": "2.11.3-preview-20251103060142",
  "@medusajs/ui": "4.1.1",
  "@medusajs/icons": "2.11.3-preview-20251103060142",
  "@tanstack/react-start": "1.131.32",
  "@tanstack/react-router": "1.131.32",
  "@tanstack/react-query": "5.66.2",
  "react": "19.1.1",
  "react-dom": "19.1.1",
  "tailwindcss": "4.1.12",
  "@tailwindcss/vite": "4.1.4",
  "vite": "7.3.1"
}
```

## 3. Environment Variables Required

### Build-time (VITE_ prefix)
| Variable | Description | Example |
|---|---|---|
| `VITE_MEDUSA_BACKEND_URL` | Medusa backend API URL | `https://your-medusa.vercel.app` |
| `VITE_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable API key | `pk_...` |

### Runtime / Server
| Variable | Description |
|---|---|
| `MEDUSA_BACKEND_URL` | Used by vite proxy in dev mode |
| `VERCEL` | Auto-set by Vercel, controls TanStack Start target |

## 4. API Contracts

The storefront communicates with the Medusa backend via:

### Medusa JS SDK
- **106 files** use the Medusa API client
- SDK initialized via `@medusajs/js-sdk` with publishable key
- All commerce operations: products, carts, orders, customers, payments

### Custom API Client (`src/lib/custom-api.ts`)
- **100+ typed functions** for all 27+ verticals
- Covers: bookings, subscriptions, auctions, rentals, digital products, event ticketing, freelance, insurance, wallets, etc.
- Uses `sdk.client.fetch()` for automatic publishable key inclusion

### Proxied Routes (dev only)
The vite dev server proxies these paths to the Medusa backend:
- `/store/*` — Store API
- `/admin/*` — Admin API
- `/auth/*` — Authentication
- `/platform/*` — Platform API
- `/commerce/*` — Commerce admin

**In production**, these proxies don't exist. The storefront calls the backend directly via `VITE_MEDUSA_BACKEND_URL`.

## 5. Vite Config Considerations

Key settings to preserve in the CMS project:

```typescript
// TanStack Start target — auto-detect Vercel
tanstackStart({
  target: process.env.VERCEL ? "vercel" : "node",
})

// SSR noExternal — these must be bundled
ssr: {
  noExternal: [
    "@medusajs/js-sdk",
    "@medusajs/types",
    "lodash-es",
    "@dakkah-cityos/design-runtime",
    "@dakkah-cityos/design-tokens",
    "@dakkah-cityos/design-system"
  ]
}
```

## 6. Vercel Config

The storefront currently uses this `vercel.json`:
```json
{
  "framework": null,
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "cd apps/storefront && pnpm run build",
  "outputDirectory": "apps/storefront/.output"
}
```

In the CMS project, update paths accordingly based on where the storefront lives.

## 7. Migration Steps

### Step 1: Copy files to CMS project
```bash
# From this repo, copy storefront app
cp -r apps/storefront/ /path/to/cms-project/apps/storefront/

# Copy shared design packages
cp -r packages/cityos-design-runtime/ /path/to/cms-project/packages/cityos-design-runtime/
cp -r packages/cityos-design-tokens/ /path/to/cms-project/packages/cityos-design-tokens/
cp -r packages/cityos-design-system/ /path/to/cms-project/packages/cityos-design-system/
```

### Step 2: Update CMS project pnpm-workspace.yaml
Ensure `apps/*` and `packages/*` are listed:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Step 3: Set environment variables in CMS Vercel project
- `VITE_MEDUSA_BACKEND_URL` — Point to deployed Medusa backend URL
- `VITE_MEDUSA_PUBLISHABLE_KEY` — From Medusa admin

### Step 4: Install dependencies
```bash
cd /path/to/cms-project
pnpm install
```

### Step 5: Configure Vercel deployment
- **Root Directory:** `apps/storefront` (or configure via vercel.json)
- **Build Command:** `pnpm run build`
- **Output Directory:** `.output`

### Step 6: Test locally
```bash
cd apps/storefront
pnpm dev
```

## 8. What Stays in This Repo

After migration, this Medusa commerce repo retains:
- `apps/backend/` — Medusa v2 backend (commerce engine)
- `packages/cityos-contracts/` — Shared TypeScript types (used by backend)
- `packages/lodash-set-safe/` — Security patch (used by backend)
- All tests, docs, migrations, and backend modules

## 9. Post-Migration Cleanup

After confirming the storefront works in the CMS project:
1. Remove `apps/storefront/` from this repo
2. Remove `packages/cityos-design-*` from this repo (if not used by backend)
3. Update `turbo.json` to remove storefront-related build outputs
4. Update `start.sh` to only start the backend
5. Update `replit.md` to reflect the new structure
