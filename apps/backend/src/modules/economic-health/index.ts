import EconomicHealthModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const ECONOMIC_HEALTH_MODULE = "economicHealth";
export { EconomicHealthModuleService };

export default Module(ECONOMIC_HEALTH_MODULE, {
  service: EconomicHealthModuleService,
});
