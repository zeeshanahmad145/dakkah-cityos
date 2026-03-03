import SagaModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const SAGA_MODULE = "saga";
export { SagaModuleService };

export default Module(SAGA_MODULE, {
  service: SagaModuleService,
});
