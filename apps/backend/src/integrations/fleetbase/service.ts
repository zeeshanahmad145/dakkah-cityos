// @ts-nocheck
import axios, { AxiosInstance } from "axios";
import { MedusaError } from "@medusajs/framework/utils";

export interface FleetbaseConfig {
  apiKey: string;
  apiUrl: string;
  organizationId: string;
}

export interface CreateShipmentData {
  order_id: string;
  pickup: {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  dropoff: {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
  }>;
  scheduled_at?: Date;
  instructions?: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  status: string;
  driver_id?: string;
  driver_name?: string;
  estimated_delivery?: Date;
  actual_delivery?: Date;
  tracking_url: string;
}

export class FleetbaseService {
  private client: AxiosInstance;
  private config: FleetbaseConfig;

  constructor(config: FleetbaseConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Organization-ID": config.organizationId,
      },
    });
  }

  /**
   * Create a new shipment/delivery order
   */
  async createShipment(data: CreateShipmentData): Promise<Shipment> {
    try {
      const response = await this.client.post("/orders", {
        type: "delivery",
        meta: {
          order_id: data.order_id,
        },
        pickup: {
          ...data.pickup,
          scheduled_at: data.scheduled_at || new Date(),
        },
        dropoff: data.dropoff,
        payload: {
          items: data.items,
        },
        notes: data.instructions,
      });

      return {
        id: response.data.id,
        tracking_number: response.data.public_id,
        status: response.data.status,
        tracking_url: `${this.config.apiUrl}/track/${response.data.public_id}`,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to create shipment: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Get shipment details
   */
  async getShipment(shipmentId: string): Promise<Shipment> {
    try {
      const response = await this.client.get(`/orders/${shipmentId}`);
      const data = response.data;

      return {
        id: data.id,
        tracking_number: data.public_id,
        status: data.status,
        driver_id: data.driver_assigned?.id,
        driver_name: data.driver_assigned?.name,
        estimated_delivery: data.scheduled_at
          ? new Date(data.scheduled_at)
          : undefined,
        actual_delivery: data.completed_at
          ? new Date(data.completed_at)
          : undefined,
        tracking_url: `${this.config.apiUrl}/track/${data.public_id}`,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Shipment not found: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Get tracking information
   */
  async getTracking(
    trackingNumber: string
  ): Promise<{
    status: string;
    location?: { lat: number; lng: number };
    updates: Array<{
      status: string;
      timestamp: Date;
      location?: string;
      note?: string;
    }>;
  }> {
    try {
      const response = await this.client.get(`/track/${trackingNumber}`);
      const data = response.data;

      return {
        status: data.status,
        location: data.driver_location
          ? {
              lat: data.driver_location.coordinates[1],
              lng: data.driver_location.coordinates[0],
            }
          : undefined,
        updates: (data.activity || []).map((activity: any) => ({
          status: activity.status,
          timestamp: new Date(activity.created_at),
          location: activity.location?.address,
          note: activity.details,
        })),
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Tracking not found: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: string, reason?: string): Promise<void> {
    try {
      await this.client.post(`/orders/${shipmentId}/cancel`, {
        reason: reason || "Cancelled by merchant",
      });
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to cancel shipment: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Assign driver to shipment
   */
  async assignDriver(shipmentId: string, driverId: string): Promise<void> {
    try {
      await this.client.post(`/orders/${shipmentId}/assign`, {
        driver_id: driverId,
      });
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to assign driver: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Get available drivers
   */
  async getAvailableDrivers(): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      vehicle_type: string;
      current_location?: { lat: number; lng: number };
    }>
  > {
    try {
      const response = await this.client.get("/drivers", {
        params: {
          status: "active",
          available: true,
        },
      });

      return (response.data || []).map((driver: any) => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicle_type: driver.vehicle?.type || "unknown",
        current_location: driver.location
          ? {
              lat: driver.location.coordinates[1],
              lng: driver.location.coordinates[0],
            }
          : undefined,
      }));
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to get drivers: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Estimate delivery time and cost
   */
  async estimateDelivery(data: {
    pickup_location: { lat: number; lng: number };
    dropoff_location: { lat: number; lng: number };
    scheduled_at?: Date;
  }): Promise<{
    distance_km: number;
    duration_minutes: number;
    estimated_cost: number;
    currency: string;
  }> {
    try {
      const response = await this.client.post("/orders/estimate", {
        pickup: {
          coordinates: [data.pickup_location.lng, data.pickup_location.lat],
        },
        dropoff: {
          coordinates: [data.dropoff_location.lng, data.dropoff_location.lat],
        },
        scheduled_at: data.scheduled_at || new Date(),
      });

      return {
        distance_km: response.data.distance / 1000,
        duration_minutes: Math.round(response.data.duration / 60),
        estimated_cost: response.data.price.amount,
        currency: response.data.price.currency,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to estimate delivery: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Geocode an address string to coordinates
   */
  async geocodeAddress(address: string): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
    placeId: string;
  }> {
    try {
      const response = await this.client.post("/geocode", {
        address,
      });

      const data = response.data;
      return {
        lat: data.location?.lat ?? data.coordinates?.[1] ?? 0,
        lng: data.location?.lng ?? data.coordinates?.[0] ?? 0,
        formattedAddress: data.formatted_address || data.address || address,
        placeId: data.place_id || data.id || "",
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to geocode address: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Validate and normalize an address
   */
  async validateAddress(address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }): Promise<{
    valid: boolean;
    normalized: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    confidence: number;
  }> {
    try {
      const response = await this.client.post("/addresses/validate", {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postal_code: address.postalCode,
      });

      const data = response.data;
      return {
        valid: data.valid ?? data.is_valid ?? false,
        normalized: {
          street: data.normalized?.street || data.street || address.street,
          city: data.normalized?.city || data.city || address.city,
          state: data.normalized?.state || data.state || address.state,
          country: data.normalized?.country || data.country || address.country,
          postalCode: data.normalized?.postal_code || data.postal_code || address.postalCode,
        },
        confidence: data.confidence ?? data.score ?? 0,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to validate address: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Get delivery zones covering a geographic point
   */
  async getDeliveryZones(params: {
    lat: number;
    lng: number;
  }): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      polygon: Array<{ lat: number; lng: number }>;
    }>
  > {
    try {
      const response = await this.client.get("/zones", {
        params: {
          lat: params.lat,
          lng: params.lng,
        },
      });

      return (response.data?.zones || response.data || []).map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        type: zone.type || zone.zone_type || "delivery",
        polygon: (zone.polygon || zone.boundary || zone.coordinates || []).map(
          (point: any) => ({
            lat: Array.isArray(point) ? point[1] : point.lat,
            lng: Array.isArray(point) ? point[0] : point.lng,
          })
        ),
      }));
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to get delivery zones: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  }
}
