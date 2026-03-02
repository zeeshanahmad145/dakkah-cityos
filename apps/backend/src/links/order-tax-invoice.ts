import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import TaxArtifactModule from "../modules/tax-artifact";

export default defineLink(
  OrderModule.linkable.order,
  TaxArtifactModule.linkable.taxInvoice,
);
