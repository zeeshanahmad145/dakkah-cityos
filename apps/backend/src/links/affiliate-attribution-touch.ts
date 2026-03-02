import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import AttributionModule from "../modules/attribution";

export default defineLink(
  ProductModule.linkable.product,
  AttributionModule.linkable.attributionTouch,
);
