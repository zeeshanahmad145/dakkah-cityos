import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FreelanceModule from "../modules/freelance";

export default defineLink(
  ProductModule.linkable.product,
  FreelanceModule.linkable.gigListing,
);
