import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import SocialCommerceModule from "../modules/social-commerce";

export default defineLink(
  ProductModule.linkable.product,
  SocialCommerceModule.linkable.liveProduct,
);
