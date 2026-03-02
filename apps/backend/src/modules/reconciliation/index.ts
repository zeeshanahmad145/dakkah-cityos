import ReconciliationModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const RECONCILIATION_MODULE = "reconciliation";
export { ReconciliationModuleService };
export default Module(RECONCILIATION_MODULE, {
  service: ReconciliationModuleService,
});
