import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PetServiceModule from "../modules/pet-service";

/**
 * Links a Medusa Product to a PetProduct extension.
 * Pet food, accessories, and health products are in the Medusa catalog;
 * PetProduct extension stores pet-domain metadata (species, age group, ingredients).
 */
export default defineLink(
  ProductModule.linkable.product,
  PetServiceModule.linkable.petProduct,
);
