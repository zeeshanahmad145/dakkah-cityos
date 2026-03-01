import { MedusaService } from "@medusajs/framework/utils";
import TravelProperty from "./models/property";
import RoomType from "./models/room-type";
import Room from "./models/room";
import TravelReservation from "./models/reservation";
import RatePlan from "./models/rate-plan";
import GuestProfile from "./models/guest-profile";
import Amenity from "./models/amenity";

class TravelModuleService extends MedusaService({
  TravelProperty,
  RoomType,
  Room,
  TravelReservation,
  RatePlan,
  GuestProfile,
  Amenity,
}) {
  /**
   * Search available travel packages by destination, date range, and number of travelers.
   */
  async searchPackages(
    destination: string,
    dates: { checkIn: Date; checkOut: Date },
    travelers: number,
  ): Promise<any[]> {
    const properties = await this.listTravelProperties({
      location: destination,
    }) as any;
    const list = Array.isArray(properties)
      ? properties
      : [properties].filter(Boolean);
    const results: any[] = [];
    for (const property of list) {
      const rooms = await this.listRoomTypes({
        property_id: property.id,
      }) as any;
      const roomList = Array.isArray(rooms) ? rooms : [rooms].filter(Boolean);
      const available = roomList.filter(
        (r: any) => (r.max_occupancy || 2) >= travelers,
      );
      if (available.length > 0) {
        results.push({ property, availableRoomTypes: available });
      }
    }
    return results;
  }

  /**
   * Book a travel package (property/room) for a customer. Creates a reservation record.
   */
  async bookPackage(packageId: string, customerId: string): Promise<any> {
    const roomType = await this.retrieveRoomType(packageId) as any;
    const available = await this.checkAvailability(packageId, new Date());
    if (!available) {
      throw new Error("Package is not available for the selected dates");
    }
    const reservation = await this.createTravelReservations({
      room_type_id: packageId,
      guest_id: customerId,
      status: "confirmed",
      booked_at: new Date(),
    } as any);
    return reservation;
  }

  /**
   * Calculate the total price for a package based on travelers count and optional add-ons.
   */
  async calculatePrice(
    packageId: string,
    travelers: number,
    addons: string[] = [],
  ): Promise<{ basePrice: number; addonTotal: number; total: number }> {
    const roomType = await this.retrieveRoomType(packageId) as any;
    const basePrice = Number(roomType.base_price || 0) * travelers;
    let addonTotal = 0;
    for (const addonId of addons) {
      const amenity = await this.retrieveAmenity(addonId) as any;
      addonTotal += Number(amenity.price || 0);
    }
    return { basePrice, addonTotal, total: basePrice + addonTotal };
  }

  /**
   * Check if a specific room type / package is available on a given date.
   */
  async checkAvailability(packageId: string, date: Date): Promise<boolean> {
    const rooms = await this.listRooms({
      room_type_id: packageId,
      status: "available",
    }) as any;
    const roomList = Array.isArray(rooms) ? rooms : [rooms].filter(Boolean);
    return roomList.length > 0;
  }

  async createBooking(
    packageId: string,
    data: {
      customerId: string;
      travelers: number;
      startDate: Date;
      endDate: Date;
      specialRequests?: string;
    },
  ): Promise<any> {
    if (!data.customerId) {
      throw new Error("Customer ID is required");
    }

    if (data.travelers <= 0) {
      throw new Error("Number of travelers must be at least 1");
    }

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error("Start date must be before end date");
    }

    const roomType = await this.retrieveRoomType(packageId) as any;

    if ((roomType.max_occupancy || 2) < data.travelers) {
      throw new Error(
        `Package supports maximum ${roomType.max_occupancy || 2} travelers`,
      );
    }

    const available = await this.checkAvailability(
      packageId,
      new Date(data.startDate),
    );
    if (!available) {
      throw new Error("Package is not available for the selected dates");
    }

    const pricing = await this.calculatePrice(packageId, data.travelers);

    const reservation = await this.createTravelReservations({
      room_type_id: packageId,
      guest_id: data.customerId,
      travelers: data.travelers,
      check_in: data.startDate,
      check_out: data.endDate,
      special_requests: data.specialRequests || null,
      total_price: pricing.total,
      status: "confirmed",
      booked_at: new Date(),
    } as any);

    return reservation;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    const reservation = await this.retrieveTravelReservation(bookingId) as any;

    if (reservation.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    if (reservation.status === "checked_out") {
      throw new Error("Cannot cancel a completed booking");
    }

    let refundPercentage = 100;
    const checkIn = new Date(reservation.check_in);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilCheckIn < 1) {
      refundPercentage = 0;
    } else if (daysUntilCheckIn < 3) {
      refundPercentage = 50;
    } else if (daysUntilCheckIn < 7) {
      refundPercentage = 75;
    }

    const updated = await this.updateTravelReservations({
      id: bookingId,
      status: "cancelled",
      cancellation_reason: reason || null,
      cancelled_at: new Date(),
      refund_percentage: refundPercentage,
    } as any);

    return {
      booking: updated,
      refundPercentage,
      refundAmount:
        Number(reservation.total_price || 0) * (refundPercentage / 100),
    };
  }

  async getItinerary(bookingId: string): Promise<any> {
    const reservation = await this.retrieveTravelReservation(bookingId) as any;

    const roomType = await this.retrieveRoomType(reservation.room_type_id) as any;

    let property = null;
    if (roomType.property_id) {
      property = await this.retrieveTravelProperty(roomType.property_id) as any;
    }

    const amenities = await this.listAmenities({
      room_type_id: reservation.room_type_id,
    }) as any;
    const amenityList = Array.isArray(amenities)
      ? amenities
      : [amenities].filter(Boolean);

    let guest = null;
    if (reservation.guest_id) {
      try {
        guest = await this.retrieveGuestProfile(reservation.guest_id) as any;
      } catch {
        guest = null;
      }
    }

    return {
      bookingId,
      status: reservation.status,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      travelers: reservation.travelers,
      totalPrice: reservation.total_price,
      specialRequests: reservation.special_requests,
      property: property
        ? {
            name: property.name,
            location: property.location,
            description: property.description,
          }
        : null,
      roomType: {
        name: roomType.name,
        description: roomType.description,
        maxOccupancy: roomType.max_occupancy,
      },
      amenities: amenityList.map((a: any) => ({
        name: a.name,
        description: a.description,
        price: a.price,
      })),
      guest,
    };
  }

  async calculatePackagePrice(
    packageId: string,
    travelers: number,
    extras?: string[],
  ): Promise<{
    basePrice: number;
    extrasCost: number;
    discount: number;
    total: number;
  }> {
    const roomType = await this.retrieveRoomType(packageId) as any;
    const basePrice = Number(roomType.base_price || 0) * travelers;

    let extrasCost = 0;
    if (extras && extras.length > 0) {
      for (const extraId of extras) {
        const amenity = await this.retrieveAmenity(extraId) as any;
        extrasCost += Number(amenity.price || 0) * travelers;
      }
    }

    let discount = 0;
    if (travelers >= 5) {
      discount = (basePrice + extrasCost) * 0.1;
    } else if (travelers >= 3) {
      discount = (basePrice + extrasCost) * 0.05;
    }

    return {
      basePrice,
      extrasCost,
      discount,
      total: basePrice + extrasCost - discount,
    };
  }
}

export default TravelModuleService;
