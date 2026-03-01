import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import LegalModule from "../modules/legal";

/**
 * Links a Medusa Product to a LegalConsultation type.
 * Legal consultation fees are managed via Medusa's pricing engine;
 * Product variants represent different consultation types (Initial, Follow-up, Strategy).
 * LegalConsultation retains appointment-specific metadata (attorney, client, case, virtual link).
 */
export default defineLink(
  ProductModule.linkable.product,
  LegalModule.linkable.legalConsultation,
);
