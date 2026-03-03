import MeteringModuleService from "./service";
import { Module } from "@medusajs/framework/utils";
import { UsageEvent, MeteringPeriod } from "./models/metering-models";

export const METERING_MODULE = "metering";
export { MeteringModuleService, UsageEvent, MeteringPeriod };

export default Module(METERING_MODULE, {
  service: MeteringModuleService,
});
