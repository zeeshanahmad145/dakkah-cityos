import FulfillmentLegsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const FULFILLMENT_LEGS_MODULE = "fulfillmentLegs";
export { FulfillmentLegsModuleService };

export default Module(FULFILLMENT_LEGS_MODULE, {
  service: FulfillmentLegsModuleService,
});
