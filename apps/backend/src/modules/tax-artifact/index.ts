import TaxArtifactModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const TAX_ARTIFACT_MODULE = "taxArtifact";
export { TaxArtifactModuleService };
export default Module(TAX_ARTIFACT_MODULE, {
  service: TaxArtifactModuleService,
});
