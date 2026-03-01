import PrintOnDemandModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const PRINT_ON_DEMAND_MODULE = "printOnDemand";

// Named export for migrations if needed by explicit migration runner
export { Migration20260220000020 } from "./migrations/Migration20260220000020";

export default Module(PRINT_ON_DEMAND_MODULE, {
  service: PrintOnDemandModuleService,
});
