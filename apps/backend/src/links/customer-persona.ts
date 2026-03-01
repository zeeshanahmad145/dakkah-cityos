import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import PersonaModule from "../modules/persona";

/**
 * Links a Medusa Customer to a Persona.
 * Persona segmentation (buyer archetype) is assigned per customer.
 * Enables personalized pricing, promotions, and content targeting.
 */
export default defineLink(
  CustomerModule.linkable.customer,
  PersonaModule.linkable.persona,
);
