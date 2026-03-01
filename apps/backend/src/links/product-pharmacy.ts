import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import HealthcareModule from "../modules/healthcare";

/**
 * Links a Medusa Product to a PharmacyProduct extension.
 * Medications and OTC products are in the Medusa product catalog;
 * PharmacyProduct stores clinical metadata (dosage form, prescription requirements,
 * controlled substance schedule, contraindications).
 * Medusa's inventory module tracks stock_quantity.
 */
export default defineLink(
  ProductModule.linkable.product,
  HealthcareModule.linkable.pharmacyProduct,
);
