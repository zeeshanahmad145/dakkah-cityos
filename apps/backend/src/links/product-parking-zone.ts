import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ParkingModule from "../modules/parking";

/**
 * Links a Medusa Product to a ParkingZone.
 * Parking passes (hourly, daily, monthly, reserved) are product variants;
 * Medusa's pricing engine manages rate tiers.
 * ParkingZone retains geo/operational metadata (coordinates, capacity, EV charging).
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true, // One zone can have multiple product pass types
  },
  ParkingModule.linkable.parkingZone,
);
