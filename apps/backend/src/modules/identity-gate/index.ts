import IdentityGateModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const IDENTITY_GATE_MODULE = "identityGate";
export { IdentityGateModuleService };

export default Module(IDENTITY_GATE_MODULE, {
  service: IdentityGateModuleService,
});
