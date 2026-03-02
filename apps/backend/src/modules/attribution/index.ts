import AttributionModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const ATTRIBUTION_MODULE = "attribution";
export { AttributionModuleService };

export default Module(ATTRIBUTION_MODULE, {
  service: AttributionModuleService,
});
