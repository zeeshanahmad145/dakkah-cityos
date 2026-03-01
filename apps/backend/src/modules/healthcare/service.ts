import { MedusaService } from "@medusajs/framework/utils";
import Practitioner from "./models/practitioner";
import HealthcareAppointment from "./models/healthcare-appointment";
import Prescription from "./models/prescription";
import LabOrder from "./models/lab-order";
import MedicalRecord from "./models/medical-record";
import PharmacyProduct from "./models/pharmacy-product";
import InsuranceClaim from "./models/insurance-claim";

class HealthcareModuleService extends MedusaService({
  Practitioner,
  HealthcareAppointment,
  Prescription,
  LabOrder,
  MedicalRecord,
  PharmacyProduct,
  InsuranceClaim,
}) {
  /**
   * Book an appointment with a healthcare provider for a patient on a given date.
   * Validates provider availability before creating the appointment.
   */
  async bookAppointment(
    providerId: string,
    patientId: string,
    date: Date,
  ): Promise<any> {
    const provider = (await this.retrievePractitioner(providerId)) as any;
    const isAvailable = await this.checkProviderAvailability(providerId, date);
    if (!isAvailable) {
      throw new Error("Provider is not available at the requested time");
    }
    const appointment = await this.createHealthcareAppointments({
      practitioner_id: providerId,
      patient_id: patientId,
      appointment_date: date,
      status: "scheduled",
      provider_name: provider.name,
    } as any);
    return appointment;
  }

  /**
   * Check whether a provider has availability on a given date.
   * Returns true if no conflicting appointments exist.
   */
  async checkProviderAvailability(
    providerId: string,
    date: Date,
  ): Promise<boolean> {
    const appointments = (await this.listHealthcareAppointments({
      practitioner_id: providerId,
      status: ["scheduled", "confirmed", "in_progress"],
    })) as any;
    const list = Array.isArray(appointments)
      ? appointments
      : [appointments].filter(Boolean);
    const targetDate = new Date(date).toDateString();
    const conflicts = list.filter(
      (a: any) => new Date(a.appointment_date).toDateString() === targetDate,
    );
    return conflicts.length === 0;
  }

  /**
   * Retrieve the full medical history for a patient including records, prescriptions, and lab orders.
   */
  async getPatientHistory(patientId: string): Promise<any> {
    const records = (await this.listMedicalRecords({
      patient_id: patientId,
    })) as any;
    const prescriptions = (await this.listPrescriptions({
      patient_id: patientId,
    })) as any;
    const labOrders = (await this.listLabOrders({
      patient_id: patientId,
    })) as any;
    const appointments = (await this.listHealthcareAppointments({
      patient_id: patientId,
    })) as any;
    return {
      records: Array.isArray(records) ? records : [records].filter(Boolean),
      prescriptions: Array.isArray(prescriptions)
        ? prescriptions
        : [prescriptions].filter(Boolean),
      labOrders: Array.isArray(labOrders)
        ? labOrders
        : [labOrders].filter(Boolean),
      appointments: Array.isArray(appointments)
        ? appointments
        : [appointments].filter(Boolean),
    };
  }

  /**
   * Cancel a scheduled appointment. Only appointments not yet completed can be cancelled.
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string,
  ): Promise<any> {
    const appointment = (await this.retrieveHealthcareAppointment(
      appointmentId,
    )) as any;
    if (appointment.status !== "scheduled") {
      throw new Error("Only scheduled appointments can be cancelled");
    }
    const updated = await this.updateHealthcareAppointments({
      id: appointmentId,
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: reason || null,
    } as any);
    return updated;
  }

  async createPrescription(
    appointmentId: string,
    data: {
      medications: string;
      dosage: string;
      notes?: string;
      prescribedById: string;
    },
  ): Promise<any> {
    const appointment = (await this.retrieveHealthcareAppointment(
      appointmentId,
    )) as any;
    if (!data.medications || !data.dosage) {
      throw new Error("Medications and dosage are required");
    }
    if (!data.prescribedById) {
      throw new Error("Prescriber ID is required");
    }

    return await this.createPrescriptions({
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      practitioner_id: data.prescribedById,
      medications: data.medications,
      dosage: data.dosage,
      notes: data.notes || null,
      status: "active",
      prescribed_at: new Date(),
    } as any);
  }

  async orderLabTest(
    patientId: string,
    data: {
      testType: string;
      priority?: string;
      practitionerId: string;
      notes?: string;
    },
  ): Promise<any> {
    if (!data.testType) {
      throw new Error("Test type is required");
    }
    if (!data.practitionerId) {
      throw new Error("Practitioner ID is required");
    }

    const priority = data.priority || "normal";
    const validPriorities = ["urgent", "high", "normal", "low"];
    if (!validPriorities.includes(priority)) {
      throw new Error(
        `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
      );
    }

    return await this.createLabOrders({
      patient_id: patientId,
      practitioner_id: data.practitionerId,
      test_type: data.testType,
      priority,
      notes: data.notes || null,
      status: priority === "urgent" ? "in_progress" : "pending",
      ordered_at: new Date(),
    } as any);
  }

  async submitInsuranceClaim(
    appointmentId: string,
    data: {
      insuranceProviderId: string;
      policyNumber: string;
      claimAmount: number;
      currency?: string;
    },
  ): Promise<any> {
    const appointment = (await this.retrieveHealthcareAppointment(
      appointmentId,
    )) as any;
    if (!data.insuranceProviderId || !data.policyNumber) {
      throw new Error("Insurance provider ID and policy number are required");
    }
    if (!data.claimAmount || data.claimAmount <= 0) {
      throw new Error("Claim amount must be greater than zero");
    }

    return await this.createInsuranceClaims({
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      insurance_provider_id: data.insuranceProviderId,
      policy_number: data.policyNumber,
      claim_amount: data.claimAmount,
      currency: data.currency || "USD",
      status: "submitted",
      submitted_at: new Date(),
    } as any);
  }

  async verifyInsurance(
    patientId: string,
    providerId: string,
  ): Promise<{
    verified: boolean;
    patientId: string;
    providerId: string;
    coverageStatus: string;
    reason?: string;
  }> {
    if (!patientId || !providerId) {
      throw new Error("Patient ID and provider ID are required");
    }

    const claims = (await this.listInsuranceClaims({
      patient_id: patientId,
    })) as any;
    const claimList = Array.isArray(claims) ? claims : [claims].filter(Boolean);

    const activeClaims = claimList.filter(
      (c: any) =>
        c.insurance_provider_id === providerId &&
        (c.status === "submitted" ||
          c.status === "approved" ||
          c.status === "active"),
    );

    if (activeClaims.length > 0) {
      return {
        verified: true,
        patientId,
        providerId,
        coverageStatus: "active",
      };
    }

    let provider: any = null;
    try {
      provider = (await this.retrievePractitioner(providerId)) as any;
    } catch {
      provider = null;
    }
    if (!provider) {
      return {
        verified: false,
        patientId,
        providerId,
        coverageStatus: "provider_not_found",
        reason: "Insurance provider not found in the system",
      };
    }

    return {
      verified: false,
      patientId,
      providerId,
      coverageStatus: "no_coverage",
      reason:
        "No active insurance coverage found for this patient with the specified provider",
    };
  }

  async getPractitionerDashboard(practitionerId: string): Promise<any> {
    const appointments = (await this.listHealthcareAppointments({
      practitioner_id: practitionerId,
    })) as any;
    const appointmentList = Array.isArray(appointments)
      ? appointments
      : [appointments].filter(Boolean);

    const now = new Date();
    const upcomingAppointments = appointmentList
      .filter(
        (a: any) =>
          a.status === "scheduled" && new Date(a.appointment_date) >= now,
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      );

    const prescriptions = (await this.listPrescriptions({
      practitioner_id: practitionerId,
    })) as any;
    const prescriptionList = Array.isArray(prescriptions)
      ? prescriptions
      : [prescriptions].filter(Boolean);

    const labOrders = (await this.listLabOrders({
      practitioner_id: practitionerId,
    })) as any;
    const labOrderList = Array.isArray(labOrders)
      ? labOrders
      : [labOrders].filter(Boolean);
    const pendingLabOrders = labOrderList.filter(
      (l: any) => l.status === "pending" || l.status === "in_progress",
    );

    return {
      practitionerId,
      upcomingAppointments,
      upcomingCount: upcomingAppointments.length,
      totalPrescriptions: prescriptionList.length,
      pendingLabOrders,
      pendingLabOrderCount: pendingLabOrders.length,
    };
  }
}

export default HealthcareModuleService;
