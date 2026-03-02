import EntitlementsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const ENTITLEMENTS_MODULE = "entitlements";
export { EntitlementsModuleService };

export default Module(ENTITLEMENTS_MODULE, {
  service: EntitlementsModuleService,
});
