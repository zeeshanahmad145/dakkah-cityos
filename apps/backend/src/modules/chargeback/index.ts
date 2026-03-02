import ChargebackModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const CHARGEBACK_MODULE = "chargeback";
export { ChargebackModuleService };
export default Module(CHARGEBACK_MODULE, { service: ChargebackModuleService });
