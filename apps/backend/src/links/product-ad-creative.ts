import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import AdvertisingModule from "../modules/advertising";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  AdvertisingModule.linkable.adCreative,
);
