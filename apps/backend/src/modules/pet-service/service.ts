import { MedusaService } from "@medusajs/framework/utils";
import PetProfile from "./models/pet-profile";
import GroomingBooking from "./models/grooming-booking";
import VetAppointment from "./models/vet-appointment";
import PetProduct from "./models/pet-product";

class PetServiceModuleService extends MedusaService({
  PetProfile,
  GroomingBooking,
  VetAppointment,
  PetProduct,
}) {
  /**
   * Book a grooming session for a pet with a specific service type and date.
   */
  async bookGrooming(
    petId: string,
    serviceType: string,
    date: Date,
  ): Promise<any> {
    const pet = await this.retrievePetProfile(petId) as any;
    const booking = await this.createGroomingBookings({
      pet_id: petId,
      service_type: serviceType,
      scheduled_date: date,
      status: "scheduled",
      pet_name: pet.name,
      owner_id: pet.owner_id,
    } as any);
    return booking;
  }

  /**
   * Check veterinarian availability on a specific date.
   */
  async getVetAvailability(
    vetId: string,
    date: Date,
  ): Promise<{ available: boolean; slots: any[] }> {
    const appointments = await this.listVetAppointments({
      vet_id: vetId,
      status: ["scheduled", "confirmed"],
    }) as any;
    const list = Array.isArray(appointments)
      ? appointments
      : [appointments].filter(Boolean);
    const targetDate = new Date(date).toDateString();
    const dayAppointments = list.filter(
      (a: any) => new Date(a.appointment_date).toDateString() === targetDate,
    );
    const maxDaily = 8;
    return {
      available: dayAppointments.length < maxDaily,
      slots: dayAppointments,
    };
  }

  /**
   * Get a comprehensive pet profile including grooming history and vet appointments.
   */
  async getPetProfile(petId: string): Promise<any> {
    const pet = await this.retrievePetProfile(petId) as any;
    const groomings = await this.listGroomingBookings({
      pet_id: petId,
    }) as any;
    const vetVisits = await this.listVetAppointments({
      pet_id: petId,
    }) as any;
    return {
      ...pet,
      groomingHistory: Array.isArray(groomings)
        ? groomings
        : [groomings].filter(Boolean),
      vetHistory: Array.isArray(vetVisits)
        ? vetVisits
        : [vetVisits].filter(Boolean),
    };
  }

  /**
   * Track vaccination records for a pet from their vet appointment history.
   */
  async trackVaccinations(petId: string): Promise<any[]> {
    const appointments = await this.listVetAppointments({
      pet_id: petId,
      visit_type: "vaccination",
    }) as any;
    const list = Array.isArray(appointments)
      ? appointments
      : [appointments].filter(Boolean);
    return list.map((a: any) => ({
      id: a.id,
      vaccine: a.notes || a.treatment,
      date: a.appointment_date,
      nextDue: a.next_due_date,
    }));
  }

  async addPetProfile(
    ownerId: string,
    data: {
      name: string;
      species: string;
      breed?: string;
      age?: number;
      weight?: number;
      medicalNotes?: string;
    },
  ): Promise<any> {
    if (!data.name || !data.species) {
      throw new Error("Pet name and species are required");
    }

    const validSpecies = [
      "dog",
      "cat",
      "bird",
      "rabbit",
      "fish",
      "reptile",
      "hamster",
      "other",
    ];
    if (!validSpecies.includes(data.species.toLowerCase())) {
      throw new Error(
        `Invalid species. Must be one of: ${validSpecies.join(", ")}`,
      );
    }

    const pet = await this.createPetProfiles({
      owner_id: ownerId,
      name: data.name,
      species: data.species.toLowerCase(),
      breed: data.breed || null,
      age: data.age || null,
      weight: data.weight || null,
      medical_notes: data.medicalNotes || null,
      status: "active",
      created_at: new Date(),
    } as any);

    return pet;
  }

  async getServiceHistory(petId: string): Promise<{
    petId: string;
    groomings: any[];
    vetVisits: any[];
    totalServices: number;
  }> {
    const pet = await this.retrievePetProfile(petId) as any;
    const groomings = await this.listGroomingBookings({
      pet_id: petId,
    }) as any;
    const groomingList = Array.isArray(groomings)
      ? groomings
      : [groomings].filter(Boolean);

    const vetVisits = await this.listVetAppointments({
      pet_id: petId,
    }) as any;
    const vetList = Array.isArray(vetVisits)
      ? vetVisits
      : [vetVisits].filter(Boolean);

    return {
      petId,
      groomings: groomingList.sort(
        (a: any, b: any) =>
          new Date(b.scheduled_date).getTime() -
          new Date(a.scheduled_date).getTime(),
      ),
      vetVisits: vetList.sort(
        (a: any, b: any) =>
          new Date(b.appointment_date).getTime() -
          new Date(a.appointment_date).getTime(),
      ),
      totalServices: groomingList.length + vetList.length,
    };
  }

  async bookPetService(
    petId: string,
    serviceType: string,
    date: Date,
  ): Promise<any> {
    if (!petId || !serviceType) {
      throw new Error("Pet ID and service type are required");
    }

    const pet = await this.retrievePetProfile(petId) as any;

    if (serviceType === "boarding") {
      const vaccinations = await this.trackVaccinations(petId);
      const now = new Date();
      const validVaccinations = vaccinations.filter((v: any) => {
        if (!v.nextDue) return true;
        return new Date(v.nextDue) > now;
      });

      if (vaccinations.length === 0 || validVaccinations.length === 0) {
        throw new Error(
          "Pet must have up-to-date vaccinations for boarding services",
        );
      }
    }

    const booking = await this.createGroomingBookings({
      pet_id: petId,
      service_type: serviceType,
      scheduled_date: new Date(date),
      status: "scheduled",
      pet_name: pet.name,
      owner_id: pet.owner_id,
      booked_at: new Date(),
    } as any);

    return booking;
  }

  async updateVaccinationRecord(
    petId: string,
    vaccination: {
      vaccineName: string;
      dateAdministered: Date;
      expiryDate?: Date;
      veterinarian?: string;
      notes?: string;
    },
  ): Promise<any> {
    if (!vaccination.vaccineName || !vaccination.dateAdministered) {
      throw new Error("Vaccine name and date administered are required");
    }

    const pet = await this.retrievePetProfile(petId) as any;

    const expiryDate =
      vaccination.expiryDate ||
      (() => {
        const d = new Date(vaccination.dateAdministered);
        d.setFullYear(d.getFullYear() + 1);
        return d;
      })();

    const record = await this.createVetAppointments({
      pet_id: petId,
      visit_type: "vaccination",
      appointment_date: new Date(vaccination.dateAdministered),
      treatment: vaccination.vaccineName,
      notes: vaccination.notes || `${vaccination.vaccineName} vaccination`,
      next_due_date: expiryDate,
      vet_name: vaccination.veterinarian || null,
      status: "completed",
      owner_id: pet.owner_id,
    } as any);

    return record;
  }

  async calculateServiceCost(
    serviceType: string,
    petSize: string,
    duration: number,
  ): Promise<{
    serviceType: string;
    basePrice: number;
    sizeMultiplier: number;
    durationMultiplier: number;
    totalCost: number;
  }> {
    const basePrices: Record<string, number> = {
      grooming: 40,
      bathing: 25,
      nail_trim: 15,
      vet_checkup: 60,
      vaccination: 35,
      dental: 80,
      walking: 20,
      boarding: 50,
    };

    const sizeMultipliers: Record<string, number> = {
      small: 1.0,
      medium: 1.3,
      large: 1.6,
      extra_large: 2.0,
    };

    const basePrice = basePrices[serviceType] || 30;
    const sizeMultiplier = sizeMultipliers[petSize] || 1.0;
    const durationMultiplier = Math.max(1, duration / 60);
    const totalCost =
      Math.round(basePrice * sizeMultiplier * durationMultiplier * 100) / 100;

    return {
      serviceType,
      basePrice,
      sizeMultiplier,
      durationMultiplier,
      totalCost,
    };
  }
}

export default PetServiceModuleService;
