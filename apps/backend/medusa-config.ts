import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import path from "path";
import { validateEnvironment } from "./src/lib/env-validation";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

validateEnvironment();

const iconsPath = path.resolve(
  __dirname,
  "node_modules/@medusajs/icons/dist/esm/index.js",
);

module.exports = defineConfig({
  admin: {
    path: "/commerce/admin",
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    vite: () => {
      let allowedHosts: string[] | true = true;
      if (process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS) {
        allowedHosts = process.env.__MEDUSA_ADDITIONAL_ALLOWED_HOSTS
          .split(",")
          .map((h) => h.trim());
      }

      return {
        server: {
          allowedHosts,
          hmr: false,
        },
        resolve: {
          alias: {
            "@medusajs/icons": iconsPath,
          },
        },
        optimizeDeps: {
          include: ["@medusajs/icons"],
        },
      };
    },
  },
  projectConfig: {
    databaseUrl: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,

    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  plugins: [
    // RSC-Labs plugins — evaluated 2026-02-16
    // @rsc-labs/medusa-store-analytics-v2 (v0.1.3) — NOT NEEDED: custom analytics module provides BI with Report/Dashboard models beyond Medusa Analytics
    // @rsc-labs/medusa-documents-v2 (v0.2.11) — CANDIDATE: PDF invoice generation. Can be enabled when needed. Requires: @emotion/react, @mui/material, react-table
    // @rsc-labs/medusa-wishlist (v0.0.3) — NOT NEEDED: custom wishlist module already implemented with tenant scoping
    // @rsc-labs/medusa-rbac — NOT NEEDED: custom 10-role RBAC system already implemented via governance module
  ],
  modules: [
    ...(process.env.REDIS_URL
      ? [
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
            },
          },
          {
            resolve: "@medusajs/medusa/cache-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
              ttl: 300,
            },
          },
        ]
      : []),
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["feed"],
            },
          },
          ...(process.env.SENDGRID_API_KEY
            ? [
                {
                  resolve: "@medusajs/medusa/notification-sendgrid",
                  id: "sendgrid",
                  options: {
                    channels: ["email"],
                    api_key: process.env.SENDGRID_API_KEY,
                    from: process.env.SENDGRID_FROM,
                  },
                },
              ]
            : []),
        ],
      },
    },
    // Payment Module (Stripe) - only enabled if API key is set
    ...(process.env.STRIPE_API_KEY
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        ]
      : []),
    // Meilisearch Module - only enabled if configured
    ...(process.env.MEILISEARCH_HOST
      ? [
          {
            resolve: "./src/modules/meilisearch",
            options: {
              host: process.env.MEILISEARCH_HOST,
              apiKey: process.env.MEILISEARCH_API_KEY || "masterKey",
              productIndexName:
                process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "products",
            },
          },
        ]
      : []),
    {
      resolve: "./src/modules/tenant",
      key: "tenant",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/node",
      key: "node",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/governance",
      key: "governance",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/persona",
      key: "persona",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/store",
      key: "cityosStore",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/vendor",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/commission",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/payout",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/subscription",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/company",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/quote",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/volume-pricing",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/booking",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/review",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/invoice",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/events",
      key: "eventOutbox",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/audit",
      key: "audit",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/i18n",
      key: "i18n",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/channel",
      key: "channel",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/region-zone",
      key: "regionZone",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/promotion-ext",
      key: "promotionExt",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/digital-product",
      key: "digitalProduct",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/auction",
      key: "auction",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/rental",
      key: "rental",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/restaurant",
      key: "restaurant",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/event-ticketing",
      key: "eventTicketing",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/classified",
      key: "classified",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/affiliate",
      key: "affiliate",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/warranty",
      key: "warranty",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/freelance",
      key: "freelance",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/travel",
      key: "travel",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/real-estate",
      key: "realEstate",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/membership",
      key: "membership",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/crowdfunding",
      key: "crowdfunding",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/social-commerce",
      key: "socialCommerce",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/grocery",
      key: "grocery",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/automotive",
      key: "automotive",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/healthcare",
      key: "healthcare",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/education",
      key: "education",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/charity",
      key: "charity",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/financial-product",
      key: "financialProduct",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/advertising",
      key: "advertising",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/parking",
      key: "parking",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/utilities",
      key: "utilities",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/government",
      key: "government",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/pet-service",
      key: "petService",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/fitness",
      key: "fitness",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/legal",
      key: "legal",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/analytics",
      key: "analytics",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/cart-extension",
      key: "cartExtension",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/cms-content",
      key: "cmsContent",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/dispute",
      key: "dispute",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/inventory-extension",
      key: "inventoryExtension",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/loyalty",
      key: "loyalty",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/notification-preferences",
      key: "notificationPreferences",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/shipping-extension",
      key: "shippingExtension",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/tax-config",
      key: "taxConfig",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "./src/modules/wishlist",
      key: "wishlist",
      options: {
        definition: {
          isQueryable: true,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          ...(process.env.BLOB_READ_WRITE_TOKEN
            ? [
                {
                  resolve: "./src/modules/file-vercel-blob",
                  id: "vercel-blob",
                  options: {
                    token: process.env.BLOB_READ_WRITE_TOKEN,
                    access: "private",
                  },
                },
              ]
            : [
                {
                  resolve: "./src/modules/file-replit",
                  id: "replit-file",
                  options: {
                    bucket_id:
                      "replit-objstore-d0367ca5-bb93-42b5-b2e7-53122f51e3cb",
                    backend_url: process.env.MEDUSA_BACKEND_URL,
                  },
                },
              ]),
        ],
      },
    },
    {
      resolve: "./src/modules/wallet",
      key: "wallet",
      options: {
        definition: {
          isQueryable: true
        }
      },
    },
    {
      resolve: "./src/modules/insurance",
      key: "insurance",
      options: {
        definition: {
          isQueryable: true
        }
      },
    },
    {
      resolve: "./src/modules/print-on-demand",
      key: "printOnDemand",
      options: {},
    },
    {
      resolve: "./src/modules/white-label",
      key: "whiteLabel",
      options: {},
    },
  ],
});
