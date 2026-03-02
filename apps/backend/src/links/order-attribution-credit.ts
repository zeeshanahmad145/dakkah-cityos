import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import AttributionModule from "../modules/attribution";

export default defineLink(
  OrderModule.linkable.order,
  AttributionModule.linkable.attributionCredit,
);
