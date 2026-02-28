import { MedusaApp } from "@medusajs/modules-sdk";
import { resolve } from "path";
import { loadEnv } from "@medusajs/framework/utils";
import { createMedusaContainer } from "@medusajs/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

async function run() {
  try {
    console.log("Booting Medusa App Container...");
    const { modules } = await MedusaApp({
      sharedResourcesConfig: {
        database: {
          clientUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
        },
      },
      modulesConfig: {
        tenant: {
          resolve: resolve("./src/modules/tenant"),
          options: {},
        },
        wallet: {
          resolve: resolve("./src/modules/wallet"),
          options: {},
        },
      },
    });

    console.log("Modules loaded:", Object.keys(modules));

    const tenantService = modules.tenant;
    if (!tenantService) {
      throw new Error("tenantModuleService is undefined in the container");
    }

    console.log("Calling listAndCountTenants()...");
    const tenantResult = await (tenantService as any).listAndCountTenants();
    console.log("Success! Tenants:", tenantResult);

    const walletService = modules.wallet;
    console.log("Calling listWallets()...");
    const walletResult = await (walletService as any).listWallets();
    console.log("Success! Wallets:", walletResult);
  } catch (error) {
    console.error("FATAL ERROR:", error);
  }
}

run();
