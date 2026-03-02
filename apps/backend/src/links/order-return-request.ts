import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import RmaModule from "../modules/rma";

export default defineLink(
  OrderModule.linkable.order,
  RmaModule.linkable.returnRequest,
);
