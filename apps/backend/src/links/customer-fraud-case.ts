import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import FraudModule from "../modules/fraud";

export default defineLink(
  CustomerModule.linkable.customer,
  FraudModule.linkable.fraudCase,
);
