import ProjectionsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const PROJECTIONS_MODULE = "projections";
export { ProjectionsModuleService };

export default Module(PROJECTIONS_MODULE, {
  service: ProjectionsModuleService,
});
