import OrderOrchestrationModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const ORDER_ORCHESTRATION_MODULE = "orderOrchestration";

export { OrderOrchestrationModuleService };

export default Module(ORDER_ORCHESTRATION_MODULE, {
  service: OrderOrchestrationModuleService,
});
