import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import SettlementModule from "../modules/settlement";

export default defineLink(
  OrderModule.linkable.order,
  SettlementModule.linkable.settlementLedger,
);
