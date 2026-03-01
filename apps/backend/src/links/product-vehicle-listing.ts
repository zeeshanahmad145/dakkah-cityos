import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import AutomotiveModule from "../modules/automotive";

/**
 * Links a Medusa Product to a VehicleListing.
 * Each vehicle for sale/lease is a Medusa product (title = "Make Model Year").
 * VehicleListing retains automotive-domain metadata: VIN, mileage, condition,
 * fuel type, transmission, body type, features, location.
 * Product pricing: sale price → PriceSet; lease → separate variant with monthly PriceSet.
 */
export default defineLink(
  ProductModule.linkable.product,
  AutomotiveModule.linkable.vehicleListing,
);
