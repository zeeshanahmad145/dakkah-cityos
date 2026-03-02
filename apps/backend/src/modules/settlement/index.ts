import SettlementModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const SETTLEMENT_MODULE = "settlement";
export { SettlementModuleService };

export default Module(SETTLEMENT_MODULE, { service: SettlementModuleService });
