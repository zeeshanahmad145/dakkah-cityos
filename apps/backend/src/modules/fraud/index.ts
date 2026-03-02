import FraudModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const FRAUD_MODULE = "fraud";
export { FraudModuleService };

export default Module(FRAUD_MODULE, { service: FraudModuleService });
