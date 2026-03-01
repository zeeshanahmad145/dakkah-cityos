import { MedusaService } from "@medusajs/framework/utils";
import ReservationHold from "./models/reservation-hold";
import StockAlert from "./models/stock-alert";
import WarehouseTransfer from "./models/warehouse-transfer";

type ReservationHoldRecord = {
  id: string;
  tenant_id: string;
  variant_id: string;
  quantity: number;
  reason: string;
  reference_id: string | null;
  expires_at: Date | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

type StockAlertRecord = {
  id: string;
  tenant_id: string;
  variant_id: string;
  product_id: string;
  alert_type: string;
  threshold: number;
  current_quantity: number;
  is_resolved: boolean;
  notified_at: Date | null;
  resolved_at: Date | null;
  metadata: Record<string, unknown> | null;
};

type WarehouseTransferRecord = {
  id: string;
  tenant_id: string;
  source_location_id: string;
  destination_location_id: string;
  transfer_number: string;
  status: string;
  items: unknown | null;
  notes: string | null;
  initiated_by: string | null;
  shipped_at: Date | null;
  received_at: Date | null;
  metadata: Record<string, unknown> | null;
};

interface InventoryExtensionServiceBase {
  retrieveReservationHold(id: string): Promise<ReservationHoldRecord>;
  listReservationHolds(
    filters?: Record<string, unknown>,
  ): Promise<ReservationHoldRecord[]>;
  createReservationHolds(
    data: Record<string, unknown>,
  ): Promise<ReservationHoldRecord>;
  updateReservationHolds(
    data: Record<string, unknown>,
  ): Promise<ReservationHoldRecord>;
  listStockAlerts(
    filters?: Record<string, unknown>,
  ): Promise<StockAlertRecord[]>;
  updateStockAlerts(data: Record<string, unknown>): Promise<StockAlertRecord>;
  createStockAlerts(data: Record<string, unknown>): Promise<StockAlertRecord>;
  retrieveWarehouseTransfer(id: string): Promise<WarehouseTransferRecord>;
  createWarehouseTransfers(
    data: Record<string, unknown>,
  ): Promise<WarehouseTransferRecord>;
  updateWarehouseTransfers(
    data: Record<string, unknown>,
  ): Promise<WarehouseTransferRecord>;
}

const Base = MedusaService({ ReservationHold, StockAlert, WarehouseTransfer });

class InventoryExtensionModuleService
  extends Base
  implements InventoryExtensionServiceBase
{
  async createReservation(data: {
    tenant_id: string;
    variant_id: string;
    quantity: number;
    reason: "cart" | "checkout" | "order" | "manual";
    reference_id?: string;
    expires_at?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<ReservationHoldRecord> {
    return this.createReservationHolds({
      tenant_id: data.tenant_id,
      variant_id: data.variant_id,
      quantity: data.quantity,
      reason: data.reason,
      reference_id: data.reference_id ?? null,
      expires_at: data.expires_at ?? null,
      status: "active",
      metadata: data.metadata ?? null,
    } as any);
  }

  async releaseReservation(
    reservationId: string,
  ): Promise<ReservationHoldRecord> {
    const reservation = await this.retrieveReservationHold(reservationId) as any;
    if (reservation.status !== "active") {
      throw new Error("Reservation is not active");
    }
    await this.updateReservationHolds({
      id: reservationId,
      status: "released",
    } as any);
    return this.retrieveReservationHold(reservationId);
  }

  async expireReservations(): Promise<{
    expired_count: number;
    expired_ids: string[];
  }> {
    const reservations = await this.listReservationHolds({ status: "active" }) as any;
    const now = new Date();
    const expiredIds: string[] = [];

    for (const reservation of reservations) {
      if (reservation.expires_at && new Date(reservation.expires_at) <= now) {
        await this.updateReservationHolds({
          id: reservation.id,
          status: "expired",
        } as any);
        expiredIds.push(reservation.id);
      }
    }

    return { expired_count: expiredIds.length, expired_ids: expiredIds };
  }

  async checkStockAlerts(
    tenantId: string,
    variantId: string,
    currentQty: number,
  ): Promise<StockAlertRecord[]> {
    const existingAlerts = await this.listStockAlerts({
      tenant_id: tenantId,
      variant_id: variantId,
      is_resolved: false,
    }) as any;

    for (const alert of existingAlerts) {
      await this.updateStockAlerts({
        id: alert.id,
        current_quantity: currentQty,
      } as any);
    }

    const createdAlerts: StockAlertRecord[] = [];

    if (currentQty === 0) {
      const hasOos = existingAlerts.some(
        (a) => a.alert_type === "out_of_stock",
      );
      if (!hasOos) {
        const alert = await this.createStockAlerts({
          tenant_id: tenantId,
          variant_id: variantId,
          product_id: "",
          alert_type: "out_of_stock",
          threshold: 0,
          current_quantity: currentQty,
          is_resolved: false,
        } as any);
        createdAlerts.push(alert);
      }
    }

    return createdAlerts;
  }

  async getActiveAlerts(
    tenantId: string,
    options?: { alertType?: string; resolved?: boolean },
  ): Promise<StockAlertRecord[]> {
    const filters: Record<string, unknown> = {
      tenant_id: tenantId,
      is_resolved: options?.resolved ?? false,
    };
    if (options?.alertType) {
      filters.alert_type = options.alertType;
    }
    return this.listStockAlerts(filters);
  }

  async initiateTransfer(data: {
    tenant_id: string;
    source_location_id: string;
    destination_location_id: string;
    transfer_number: string;
    items?: unknown[];
    notes?: string;
    initiated_by?: string;
    metadata?: Record<string, unknown>;
  }): Promise<WarehouseTransferRecord> {
    return this.createWarehouseTransfers({
      tenant_id: data.tenant_id,
      source_location_id: data.source_location_id,
      destination_location_id: data.destination_location_id,
      transfer_number: data.transfer_number,
      status: "draft",
      // model.json() is typed as Record<string,unknown> by MedusaService; we store an
      // item array — JSON stores arrays and objects uniformly so this cast is safe.
      items: (data.items ?? null) as unknown as Record<string, unknown> | null,
      notes: data.notes ?? null,
      initiated_by: data.initiated_by ?? null,
      metadata: data.metadata ?? null,
    } as any);
  }

  async updateTransferStatus(
    transferId: string,
    status: "draft" | "pending" | "in_transit" | "received" | "cancelled",
  ): Promise<WarehouseTransferRecord> {
    const updateData: Record<string, unknown> = { id: transferId, status };
    if (status === "in_transit") updateData.shipped_at = new Date();
    if (status === "received") updateData.received_at = new Date();
    await this.updateWarehouseTransfers(updateData);
    return this.retrieveWarehouseTransfer(transferId);
  }
}

export default InventoryExtensionModuleService;
