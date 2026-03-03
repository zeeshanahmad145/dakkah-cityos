import RevenueTopologyModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const REVENUE_TOPOLOGY_MODULE = "revenueTopology";
export { RevenueTopologyModuleService };

export default Module(REVENUE_TOPOLOGY_MODULE, {
  service: RevenueTopologyModuleService,
});
