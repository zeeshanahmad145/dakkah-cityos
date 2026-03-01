import { Modules } from "@medusajs/framework/utils";
import { ExecArgs } from "@medusajs/framework/types";
import scrypt from "scrypt-kdf";

export default async function fixPasswords({ container }: ExecArgs) {
  const logger = container.resolve("logger") as unknown as any;
  const authModuleService = container.resolve(Modules.AUTH) as unknown as any;

  logger.info("Fixing plaintext passwords in auth_identity...");

  const hashPassword = async (password: string) => {
    const hashConfig = { logN: 15, r: 8, p: 1 };
    const hashBuffer = await scrypt.kdf(password, hashConfig);
    return hashBuffer.toString("base64");
  };

  try {
    const adminHash = await hashPassword("admin123456");
    const custHash = await hashPassword("Dakkah2024!");

    const authIdentities = await authModuleService.listAuthIdentities(
      {},
      { relations: ["provider_identities"] },
    );

    for (const identity of authIdentities) {
      for (const provider of identity.provider_identities) {
        if (provider.provider === "emailpass") {
          const email = provider.entity_id;
          const meta = provider.provider_metadata;

          if (meta?.password === "admin123456") {
            await authModuleService.updateProviderIdentities({
              id: provider.id,
              provider_metadata: { ...meta, password: adminHash },
            });
            logger.info(`Updated admin: ${email}`);
          } else if (meta?.password === "Dakkah2024!") {
            await authModuleService.updateProviderIdentities({
              id: provider.id,
              provider_metadata: { ...meta, password: custHash },
            });
            logger.info(`Updated customer: ${email}`);
          }
        }
      }
    }
    logger.info("Done fixing passwords.");
  } catch (err) {
    logger.error("Error fixing passwords: ", err);
  }
}
