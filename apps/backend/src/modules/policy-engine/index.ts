import PolicyEngineModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const POLICY_ENGINE_MODULE = "policyEngine";
export { PolicyEngineModuleService };

export default Module(POLICY_ENGINE_MODULE, {
  service: PolicyEngineModuleService,
});
