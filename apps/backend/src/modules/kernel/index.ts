import KernelModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const KERNEL_MODULE = "kernel";
export { KernelModuleService };

export default Module(KERNEL_MODULE, {
  service: KernelModuleService,
});
