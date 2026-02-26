import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PayloadModule from "../modules/payload";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  {
    linkable: PayloadModule.linkable.payloadRecord,
    field: "medusa_id",
  },
);
