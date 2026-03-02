import RmaModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const RMA_MODULE = "rma";
export { RmaModuleService };

export default Module(RMA_MODULE, { service: RmaModuleService });
