import { defineLink } from "@medusajs/framework/utils";
import VendorModule from "../modules/vendor";
import RmaModule from "../modules/rma";

export default defineLink(
  VendorModule.linkable.vendor,
  RmaModule.linkable.restockingFeeRule,
);
