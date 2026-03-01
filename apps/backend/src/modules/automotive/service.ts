import { MedusaService } from "@medusajs/framework/utils";
import VehicleListing from "./models/vehicle-listing";
import TestDrive from "./models/test-drive";
import VehicleService from "./models/vehicle-service";
import PartCatalog from "./models/part-catalog";
import TradeIn from "./models/trade-in";

class AutomotiveModuleService extends MedusaService({
  VehicleListing,
  TestDrive,
  VehicleService,
  PartCatalog,
  TradeIn,
}) {
  /** Submit a vehicle for trade-in evaluation */
  async submitTradeIn(
    vehicleId: string,
    customerId: string,
    description?: string,
  ): Promise<any> {
    if (!vehicleId || !customerId) {
      throw new Error("Vehicle ID and customer ID are required");
    }

    const existing = await this.listTradeIns({
      vehicle_listing_id: vehicleId,
      customer_id: customerId,
      status: ["pending", "evaluating"],
    }) as any;
    const list = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (list.length > 0) {
      throw new Error("A trade-in request already exists for this vehicle");
    }

    return await this.createTradeIns({
      vehicle_listing_id: vehicleId,
      customer_id: customerId,
      description: description || null,
      status: "pending",
      submitted_at: new Date(),
    } as any);
  }

  /** Evaluate a trade-in vehicle and provide an offer */
  async evaluateVehicle(
    tradeInId: string,
    evaluatedValue?: number,
  ): Promise<any> {
    const tradeIn = await this.retrieveTradeIn(tradeInId) as any;

    if (tradeIn.status !== "pending") {
      throw new Error("Trade-in is not pending evaluation");
    }

    let value = evaluatedValue;
    if (!value && tradeIn.vehicle_listing_id) {
      const vehicle = await this.retrieveVehicleListing(
        tradeIn.vehicle_listing_id,
      ) as any;
      const basePrice = Number(vehicle.price || 0);
      const year = Number(vehicle.year || new Date().getFullYear());
      const age = new Date().getFullYear() - year;
      const depreciation = Math.max(0.3, 1 - age * 0.1);
      value = Math.round(basePrice * depreciation * 0.85);
    }

    return await this.updateTradeIns({
      id: tradeInId,
      status: "evaluated",
      evaluated_value: value || 0,
      evaluated_at: new Date(),
    } as any);
  }

  /** Publish a vehicle listing */
  async publishListing(vehicleId: string): Promise<any> {
    const vehicle = await this.retrieveVehicleListing(vehicleId) as any;

    if (vehicle.status === "published") {
      throw new Error("Vehicle listing is already published");
    }

    if (!vehicle.price) {
      throw new Error("Vehicle must have a price before publishing");
    }

    return await this.updateVehicleListings({
      id: vehicleId,
      status: "published",
      published_at: new Date(),
    } as any);
  }

  async listVehicle(data: {
    make: string;
    model: string;
    year: number;
    vin: string;
    price: number;
    condition: string;
    sellerId: string;
  }): Promise<any> {
    if (!data.make || !data.model || !data.year || !data.vin) {
      throw new Error("Make, model, year, and VIN are required");
    }
    if (data.price <= 0) {
      throw new Error("Price must be greater than zero");
    }
    const validConditions = ["new", "certified_pre_owned", "used", "salvage"];
    if (!validConditions.includes(data.condition)) {
      throw new Error(
        `Condition must be one of: ${validConditions.join(", ")}`,
      );
    }
    const existing = await this.listVehicleListings({ vin: data.vin }) as any;
    const existingList = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    const activeListing = existingList.find(
      (v: any) => v.status !== "sold" && v.status !== "cancelled",
    );
    if (activeListing) {
      throw new Error("A vehicle with this VIN is already listed");
    }
    return await this.createVehicleListings({
      make: data.make,
      model: data.model,
      year: data.year,
      vin: data.vin,
      price: data.price,
      condition: data.condition,
      seller_id: data.sellerId,
      status: "draft",
      listed_at: new Date(),
    } as any);
  }

  async scheduleTestDrive(
    vehicleId: string,
    data: {
      customerId: string;
      date: Date;
      dealershipId: string;
    },
  ): Promise<any> {
    if (!vehicleId || !data.customerId || !data.date) {
      throw new Error("Vehicle ID, customer ID, and date are required");
    }
    const vehicle = await this.retrieveVehicleListing(vehicleId) as any;
    if (vehicle.status !== "published") {
      throw new Error("Vehicle is not available for test drives");
    }
    const scheduleDate = new Date(data.date);
    if (scheduleDate <= new Date()) {
      throw new Error("Test drive date must be in the future");
    }
    const existingDrives = await this.listTestDrives({
      vehicle_listing_id: vehicleId,
      customer_id: data.customerId,
      status: ["scheduled", "confirmed"],
    }) as any;
    const driveList = Array.isArray(existingDrives)
      ? existingDrives
      : [existingDrives].filter(Boolean);
    if (driveList.length > 0) {
      throw new Error(
        "Customer already has a test drive scheduled for this vehicle",
      );
    }
    return await this.createTestDrives({
      vehicle_listing_id: vehicleId,
      customer_id: data.customerId,
      dealership_id: data.dealershipId || null,
      scheduled_date: scheduleDate,
      status: "scheduled",
    } as any);
  }

  async appraise(vehicleId: string): Promise<{
    vehicleId: string;
    estimatedValue: number;
    factors: Record<string, any>;
  }> {
    const vehicle = await this.retrieveVehicleListing(vehicleId) as any;
    const basePrice = Number(vehicle.price || 0);
    const year = Number(vehicle.year || new Date().getFullYear());
    const age = new Date().getFullYear() - year;
    const mileage = Number(vehicle.mileage || 0);

    let conditionMultiplier = 1.0;
    switch (vehicle.condition) {
      case "new":
        conditionMultiplier = 1.0;
        break;
      case "certified_pre_owned":
        conditionMultiplier = 0.85;
        break;
      case "used":
        conditionMultiplier = 0.7;
        break;
      case "salvage":
        conditionMultiplier = 0.4;
        break;
      default:
        conditionMultiplier = 0.7;
    }

    const ageDepreciation = Math.max(0.2, 1 - age * 0.08);
    const mileageDepreciation =
      mileage > 0 ? Math.max(0.3, 1 - mileage / 200000) : 1.0;
    const estimatedValue = Math.round(
      basePrice * conditionMultiplier * ageDepreciation * mileageDepreciation,
    );

    return {
      vehicleId,
      estimatedValue,
      factors: {
        basePrice,
        age,
        mileage,
        condition: vehicle.condition,
        conditionMultiplier,
        ageDepreciation,
        mileageDepreciation,
      },
    };
  }

  async processTradeIn(
    vehicleId: string,
    tradeInVehicleId: string,
  ): Promise<{
    purchaseVehicleId: string;
    tradeInVehicleId: string;
    tradeInValue: number;
    purchasePrice: number;
    amountDue: number;
  }> {
    const purchaseVehicle = await this.retrieveVehicleListing(vehicleId) as any;
    if (purchaseVehicle.status !== "published") {
      throw new Error("Purchase vehicle is not available for sale");
    }
    const appraisal = await this.appraise(tradeInVehicleId);
    const tradeInValue = appraisal.estimatedValue;
    const purchasePrice = Number(purchaseVehicle.price || 0);
    const amountDue = Math.max(0, purchasePrice - tradeInValue);

    await this.createTradeIns({
      vehicle_listing_id: vehicleId,
      trade_in_vehicle_id: tradeInVehicleId,
      trade_in_value: tradeInValue,
      status: "applied",
      submitted_at: new Date(),
    } as any);

    return {
      purchaseVehicleId: vehicleId,
      tradeInVehicleId,
      tradeInValue,
      purchasePrice,
      amountDue,
    };
  }

  /** Calculate monthly financing payment for a vehicle */
  async calculateFinancing(
    price: number,
    downPayment: number,
    termMonths: number,
    annualRate?: number,
  ): Promise<{
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    loanAmount: number;
  }> {
    if (price <= 0 || downPayment < 0 || termMonths <= 0) {
      throw new Error("Invalid financing parameters");
    }

    if (downPayment >= price) {
      throw new Error("Down payment cannot exceed or equal the price");
    }

    const loanAmount = price - downPayment;
    const rate = (annualRate || 5.9) / 100 / 12;

    const monthlyPayment =
      rate > 0
        ? (loanAmount * rate * Math.pow(1 + rate, termMonths)) /
          (Math.pow(1 + rate, termMonths) - 1)
        : loanAmount / termMonths;

    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - loanAmount;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      loanAmount,
    };
  }
}

export default AutomotiveModuleService;
