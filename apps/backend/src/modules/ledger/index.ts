import LedgerModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const LEDGER_MODULE = "ledger";
export { LedgerModuleService };

export default Module(LEDGER_MODULE, { service: LedgerModuleService });
