import { defineLink } from "@medusajs/framework/utils";
import RegionModule from "@medusajs/medusa/region";
import RegionZoneModule from "../modules/region-zone";

/**
 * Links a Medusa Region to a RegionZoneMapping.
 * Extends Medusa's native region with CityOS-specific zone data:
 * governorate boundaries, zone types, postal code ranges,
 * and multi-city delivery configuration for KSA/GCC markets.
 */
export default defineLink(
  RegionModule.linkable.region,
  RegionZoneModule.linkable.regionZoneMapping,
);
