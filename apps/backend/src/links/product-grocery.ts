import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import GroceryModule from "../modules/grocery";

export default defineLink(
  ProductModule.linkable.product,
  GroceryModule.linkable.freshProduct,
);
