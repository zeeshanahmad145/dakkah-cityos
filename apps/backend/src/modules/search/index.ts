import SearchModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const SEARCH_MODULE = "search";
export { SearchModuleService };
export default Module(SEARCH_MODULE, { service: SearchModuleService });
