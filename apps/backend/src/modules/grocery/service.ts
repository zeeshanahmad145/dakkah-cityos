import { MedusaService } from "@medusajs/framework/utils";
import FreshProduct from "./models/fresh-product";
import BatchTracking from "./models/batch-tracking";
import SubstitutionRule from "./models/substitution-rule";
import DeliverySlot from "./models/delivery-slot";

class GroceryModuleService extends MedusaService({
  FreshProduct,
  BatchTracking,
  SubstitutionRule,
  DeliverySlot,
}) {
  /**
   * Check the freshness status of a product by evaluating batch expiry dates.
   */
  async checkFreshness(
    productId: string,
  ): Promise<{ isFresh: boolean; daysUntilExpiry: number; batchId?: string }> {
    const batches = await this.listBatchTrackings({
      product_id: productId,
    }) as any;
    const batchList = Array.isArray(batches)
      ? batches
      : [batches].filter(Boolean);
    const now = new Date();
    const freshBatch = batchList.find(
      (b: any) => new Date(b.expiry_date) > now,
    );
    if (!freshBatch) {
      return { isFresh: false, daysUntilExpiry: 0 };
    }
    const daysUntilExpiry = Math.ceil(
      (new Date(freshBatch.expiry_date).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return {
      isFresh: daysUntilExpiry > 0,
      daysUntilExpiry,
      batchId: freshBatch.id,
    };
  }

  /**
   * Get available delivery slots for a zone on a given date.
   */
  async getDeliverySlots(zoneId: string, date: Date): Promise<any[]> {
    const slots = await this.listDeliverySlots({ zone_id: zoneId }) as any;
    const slotList = Array.isArray(slots) ? slots : [slots].filter(Boolean);
    const targetDate = new Date(date).toDateString();
    return slotList.filter(
      (s: any) =>
        new Date(s.slot_date).toDateString() === targetDate &&
        (s.capacity_remaining || 0) > 0,
    );
  }

  /**
   * Create a shopping basket for a customer with the given items. Validates freshness for each item.
   */
  async createBasket(
    customerId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<any> {
    const basketItems: any[] = [];
    for (const item of items) {
      const product = await this.retrieveFreshProduct(item.productId) as any;
      const freshness = await this.checkFreshness(item.productId);
      if (!freshness.isFresh) {
        const substitutes = await this.suggestSubstitutes(item.productId);
        if (substitutes.length > 0) {
          basketItems.push({
            ...item,
            substituted: true,
            substituteId: substitutes[0].id,
          });
          continue;
        }
      }
      // @ts-ignore - FreshProduct doesn't have price property
      basketItems.push({ ...item, unitPrice: Number(product.price || 0) });
    }
    return { customerId, items: basketItems, createdAt: new Date() };
  }

  /**
   * Suggest substitute products when a product is unavailable or not fresh.
   */
  async suggestSubstitutes(productId: string): Promise<any[]> {
    const rules = await this.listSubstitutionRules({
      original_product_id: productId,
    }) as any;
    const ruleList = Array.isArray(rules) ? rules : [rules].filter(Boolean);
    const substitutes: any[] = [];
    for (const rule of ruleList) {
      const sub = await this.retrieveFreshProduct(rule.substitute_product_id) as any;
      const freshness = await this.checkFreshness(rule.substitute_product_id);
      if (freshness.isFresh) {
        substitutes.push(sub);
      }
    }
    return substitutes;
  }

  async createDeliverySlot(data: {
    date: Date;
    startTime: string;
    endTime: string;
    maxOrders: number;
    zoneId: string;
  }): Promise<any> {
    if (!data.startTime || !data.endTime) {
      throw new Error("Start time and end time are required");
    }

    if (data.maxOrders <= 0) {
      throw new Error("Max orders must be a positive number");
    }

    const slot = await this.createDeliverySlots({
      slot_date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      max_orders: data.maxOrders,
      capacity_remaining: data.maxOrders,
      zone_id: data.zoneId,
      status: "available",
    } as any);

    return slot;
  }

  async bookDeliverySlot(slotId: string, orderId: string): Promise<any> {
    const slot = await this.retrieveDeliverySlot(slotId) as any;

    if (slot.status !== "available") {
      throw new Error("This delivery slot is no longer available");
    }

    const remaining = Number(slot.capacity_remaining || 0);
    if (remaining <= 0) {
      throw new Error("This delivery slot is fully booked");
    }

    const newRemaining = remaining - 1;
    const updated = await this.updateDeliverySlots({
      id: slotId,
      capacity_remaining: newRemaining,
      status: newRemaining === 0 ? "full" : "available",
    } as any);

    return {
      slotId,
      orderId,
      date: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      confirmed: true,
    };
  }

  async getAvailableSlots(zoneId: string, date: string): Promise<any[]> {
    const slots = await this.listDeliverySlots({ zone_id: zoneId }) as any;
    const slotList = Array.isArray(slots) ? slots : [slots].filter(Boolean);
    const targetDate = new Date(date).toDateString();

    return slotList.filter(
      (s: any) =>
        new Date(s.slot_date).toDateString() === targetDate &&
        s.status === "available" &&
        (Number(s.capacity_remaining) || 0) > 0,
    );
  }

  async updateInventoryFreshness(
    productId: string,
    expiryDate: Date,
    batchNumber: string,
  ): Promise<any> {
    if (!batchNumber) {
      throw new Error("Batch number is required");
    }

    if (new Date(expiryDate) <= new Date()) {
      throw new Error("Expiry date must be in the future");
    }

    await this.retrieveFreshProduct(productId) as any;

    const existingBatches = await this.listBatchTrackings({
      product_id: productId,
      batch_number: batchNumber,
    }) as any;
    const batchList = Array.isArray(existingBatches)
      ? existingBatches
      : [existingBatches].filter(Boolean);

    if (batchList.length > 0) {
      const updated = await this.updateBatchTrackings({
        id: batchList[0].id,
        expiry_date: expiryDate,
        updated_at: new Date(),
      } as any);
      return updated;
    }

    const batch = await this.createBatchTrackings({
      product_id: productId,
      batch_number: batchNumber,
      expiry_date: expiryDate,
      created_at: new Date(),
    } as any);

    return batch;
  }
}

export default GroceryModuleService;
