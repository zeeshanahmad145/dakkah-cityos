import { MedusaService } from "@medusajs/framework/utils";
import ShippingRate from "./models/shipping-rate";
import CarrierConfig from "./models/carrier-config";

// ShippingRate model fields (from model definition)
type ShippingRateRecord = {
  id: string;
  tenant_id: string;
  carrier_id: string;
  carrier_name: string;
  service_type: string;
  origin_zone: string | null;
  destination_zone: string | null;
  base_rate: number | string;
  per_kg_rate: number | string;
  min_weight: number;
  max_weight: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
};

// CarrierConfig model fields (from model definition)
type CarrierConfigRecord = {
  id: string;
  tenant_id: string;
  carrier_code: string;
  carrier_name: string;
  api_endpoint: string | null;
  is_active: boolean;
  supported_countries: Record<string, unknown> | null;
  tracking_url_template: string | null;
  max_weight: number | null;
  max_dimensions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

interface ShippingExtensionServiceBase {
  listShippingRates(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<ShippingRateRecord[]>;
  retrieveShippingRate(id: string): Promise<ShippingRateRecord>;
  createShippingRates(
    data: Record<string, unknown>,
  ): Promise<ShippingRateRecord>;
  updateShippingRates(
    data: Record<string, unknown>,
  ): Promise<ShippingRateRecord>;
  listCarrierConfigs(
    filters?: Record<string, unknown>,
  ): Promise<CarrierConfigRecord[]>;
  retrieveCarrierConfig(id: string): Promise<CarrierConfigRecord>;
}

const Base = MedusaService({ ShippingRate, CarrierConfig });

class ShippingExtensionModuleService
  extends Base
  implements ShippingExtensionServiceBase
{
  async getRatesForShipment(
    tenantId: string,
    data: { weight: number; originZone?: string; destZone?: string },
  ): Promise<ShippingRateRecord[]> {
    const rates = await this.listShippingRates({
      tenant_id: tenantId,
      is_active: true,
    }) as any;
    return rates.filter((rate) => {
      if (data.weight < rate.min_weight || data.weight > rate.max_weight)
        return false;
      if (
        data.originZone &&
        rate.origin_zone &&
        rate.origin_zone !== data.originZone
      )
        return false;
      if (
        data.destZone &&
        rate.destination_zone &&
        rate.destination_zone !== data.destZone
      )
        return false;
      return true;
    });
  }

  async getActiveCarriers(tenantId: string): Promise<CarrierConfigRecord[]> {
    return this.listCarrierConfigs({ tenant_id: tenantId, is_active: true });
  }

  async calculateShippingCost(
    rateId: string,
    weight: number,
  ): Promise<{
    rate_id: string;
    carrier_name: string;
    service_type: string;
    weight: number;
    base_rate: number;
    per_kg_rate: number;
    total_cost: number;
    estimated_days_min: number;
    estimated_days_max: number;
  }> {
    const rate = await this.retrieveShippingRate(rateId) as any;
    const baseRate = Number(rate.base_rate);
    const perKgRate = Number(rate.per_kg_rate);
    return {
      rate_id: rateId,
      carrier_name: rate.carrier_name,
      service_type: rate.service_type,
      weight,
      base_rate: baseRate,
      per_kg_rate: perKgRate,
      total_cost: baseRate + perKgRate * weight,
      estimated_days_min: rate.estimated_days_min,
      estimated_days_max: rate.estimated_days_max,
    };
  }

  async getTrackingUrl(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<string | null> {
    const carriers = await this.listCarrierConfigs({
      carrier_code: carrierCode,
    }) as any;
    if (carriers.length === 0)
      throw new Error(`Carrier with code "${carrierCode}" not found`);
    const carrier = carriers[0];
    if (!carrier.tracking_url_template) return null;
    return carrier.tracking_url_template.replace(
      "{{tracking_number}}",
      trackingNumber,
    );
  }

  async calculateShippingRate(data: {
    originZone: string;
    destinationZone: string;
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    shippingMethod?: string;
  }): Promise<
    Array<{
      rate_id: string;
      carrier_name: string;
      service_type: string;
      total_cost: number;
      estimated_days_min: number;
      estimated_days_max: number;
    }>
  > {
    if (data.weight <= 0) throw new Error("Weight must be a positive number");

    const rates = await this.listShippingRates({
      origin_zone: data.originZone,
      destination_zone: data.destinationZone,
      is_active: true,
    }) as any;

    const applicable = rates.filter((rate) => {
      if (data.weight < rate.min_weight || data.weight > rate.max_weight)
        return false;
      if (data.shippingMethod && rate.service_type !== data.shippingMethod)
        return false;
      return true;
    });
    if (applicable.length === 0)
      throw new Error("No shipping rates available for the given parameters");

    let volumetricWeight = data.weight;
    if (data.dimensions) {
      const { length, width, height } = data.dimensions;
      volumetricWeight = Math.max(
        data.weight,
        (length * width * height) / 5000,
      );
    }

    return applicable.map((rate) => ({
      rate_id: rate.id,
      carrier_name: rate.carrier_name,
      service_type: rate.service_type,
      total_cost:
        Number(rate.base_rate) + Number(rate.per_kg_rate) * volumetricWeight,
      estimated_days_min: rate.estimated_days_min,
      estimated_days_max: rate.estimated_days_max,
    }));
  }

  /**
   * Validate a carrier and return a structured shipment config.
   * NOTE: Actual shipment tracking records live in the core Fulfillment module.
   * This method validates the carrier config and returns the data needed to
   * create an external shipment via Medusa's fulfillment provider.
   */
  async validateShipmentCarrier(
    carrierId: string,
    trackingNumber: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<{
    carrier_id: string;
    carrier_name: string;
    tracking_number: string;
    item_count: number;
    valid: boolean;
  }> {
    if (!trackingNumber) throw new Error("Tracking number is required");
    if (!items?.length)
      throw new Error("At least one item is required for a shipment");

    const carrier = await this.retrieveCarrierConfig(carrierId) as any;
    if (!carrier.is_active)
      throw new Error("Selected carrier is not currently active");

    return {
      carrier_id: carrierId,
      carrier_name: carrier.carrier_name,
      tracking_number: trackingNumber,
      item_count: items.length,
      valid: true,
    };
  }

  async estimateDeliveryDate(
    originZone: string,
    destinationZone: string,
    method: string,
  ): Promise<{
    origin_zone: string;
    destination_zone: string;
    method: string;
    estimated_min_date: Date;
    estimated_max_date: Date;
    estimated_days_min: number;
    estimated_days_max: number;
  }> {
    const rates = await this.listShippingRates({
      origin_zone: originZone,
      destination_zone: destinationZone,
      service_type: method,
      is_active: true,
    }) as any;
    if (rates.length === 0)
      throw new Error("No shipping rates found for the given route and method");

    const rate = rates[0];
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + rate.estimated_days_min);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + rate.estimated_days_max);

    return {
      origin_zone: originZone,
      destination_zone: destinationZone,
      method,
      estimated_min_date: minDate,
      estimated_max_date: maxDate,
      estimated_days_min: rate.estimated_days_min,
      estimated_days_max: rate.estimated_days_max,
    };
  }
}

export default ShippingExtensionModuleService;
