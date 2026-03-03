import ResourceModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const RESOURCE_MODULE = "resource";
export { ResourceModuleService };

export default Module(RESOURCE_MODULE, { service: ResourceModuleService });
