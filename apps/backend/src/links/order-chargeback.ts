import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import ChargebackModule from "../modules/chargeback";

export default defineLink(
  OrderModule.linkable.order,
  ChargebackModule.linkable.chargeback,
);
