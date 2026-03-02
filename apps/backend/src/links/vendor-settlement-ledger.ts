import { defineLink } from "@medusajs/framework/utils";
import VendorModule from "../modules/vendor";
import SettlementModule from "../modules/settlement";

export default defineLink(
  VendorModule.linkable.vendor,
  SettlementModule.linkable.settlementLedger,
);
