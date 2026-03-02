import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import FraudModule from "../modules/fraud";

export default defineLink(
  OrderModule.linkable.order,
  FraudModule.linkable.fraudCase,
);
