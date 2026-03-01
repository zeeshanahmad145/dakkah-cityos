import { MedusaService } from "@medusajs/framework/utils";
import RentalProduct from "./models/rental-product";
import RentalAgreement from "./models/rental-agreement";
import RentalPeriod from "./models/rental-period";
import RentalReturn from "./models/rental-return";
import DamageClaim from "./models/damage-claim";

class RentalModuleService extends MedusaService({
  RentalProduct,
  RentalAgreement,
  RentalPeriod,
  RentalReturn,
  DamageClaim,
}) {
  /** Check if a rental item is available for a given date range */
  async checkAvailability(
    itemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    if (startDate >= endDate) {
      throw new Error("Start date must be before end date");
    }

    const product = await this.retrieveRentalProduct(itemId) as any;
    if (product.status !== "available") return false;

    const agreements = await this.listRentalAgreements({
      rental_product_id: itemId,
      status: ["active", "reserved"],
    }) as any;
    const list = Array.isArray(agreements)
      ? agreements
      : [agreements].filter(Boolean);

    for (const agreement of list) {
      const aStart = new Date(agreement.start_date);
      const aEnd = new Date(agreement.end_date);
      if (startDate < aEnd && endDate > aStart) return false;
    }

    return true;
  }

  /** Create a new rental agreement */
  async createRental(
    itemId: string,
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const isAvailable = await this.checkAvailability(
      itemId,
      startDate,
      endDate,
    );
    if (!isAvailable) {
      throw new Error("Item is not available for the selected dates");
    }

    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = await this.calculateRentalPrice(itemId, duration);

    const agreement = await this.createRentalAgreements({
      rental_product_id: itemId,
      customer_id: customerId,
      start_date: startDate,
      end_date: endDate,
      duration_days: duration,
      total_price: totalPrice,
      status: "reserved",
      created_at: new Date(),
    } as any);

    return agreement;
  }

  /** Calculate rental price based on item daily rate and duration */
  async calculateRentalPrice(
    itemId: string,
    durationDays: number,
  ): Promise<number> {
    if (durationDays <= 0) {
      throw new Error("Duration must be at least 1 day");
    }

    const product = await this.retrieveRentalProduct(itemId) as any;
    const dailyRate = Number(product.daily_rate || product.price || 0);
    let total = dailyRate * durationDays;

    if (durationDays >= 30) {
      total *= 0.8;
    } else if (durationDays >= 7) {
      total *= 0.9;
    }

    return Math.round(total * 100) / 100;
  }

  /** Process return of a rental item */
  async processReturn(
    rentalId: string,
    condition?: string,
    notes?: string,
  ): Promise<any> {
    const agreement = await this.retrieveRentalAgreement(rentalId) as any;

    if (agreement.status !== "active") {
      throw new Error("Only active rentals can be returned");
    }

    const returnRecord = await this.createRentalReturns({
      rental_agreement_id: rentalId,
      returned_at: new Date(),
      condition: condition || "good",
      notes: notes || null,
      status: "completed",
    } as any);

    await this.updateRentalAgreements({
      id: rentalId,
      status: "returned",
      actual_return_date: new Date(),
    } as any);

    await this.updateRentalProducts({
      id: agreement.rental_product_id,
      status: "available",
    } as any);

    return returnRecord;
  }
}

export default RentalModuleService;
