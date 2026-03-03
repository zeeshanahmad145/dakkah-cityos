import CommerceContractModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const COMMERCE_CONTRACT_MODULE = "commerceContract";
export { CommerceContractModuleService };

export default Module(COMMERCE_CONTRACT_MODULE, {
  service: CommerceContractModuleService,
});
