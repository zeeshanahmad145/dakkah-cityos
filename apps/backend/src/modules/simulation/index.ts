import SimulationModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const SIMULATION_MODULE = "simulation";
export { SimulationModuleService };

export default Module(SIMULATION_MODULE, { service: SimulationModuleService });
