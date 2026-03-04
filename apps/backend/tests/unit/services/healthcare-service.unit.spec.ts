import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listPractitioners(_filter: any): Promise<any> {
          return [];
        }
        async retrievePractitioner(_id: string): Promise<any> {
          return null;
        }
        async listHealthcareAppointments(_filter: any): Promise<any> {
          return [];
        }
        async retrieveHealthcareAppointment(_id: string): Promise<any> {
          return null;
        }
        async createHealthcareAppointments(_data: any): Promise<any> {
          return {};
        }
        async updateHealthcareAppointments(_data: any): Promise<any> {
          return {};
        }
        async listPrescriptions(_filter: any): Promise<any> {
          return [];
        }
        async createPrescriptions(_data: any): Promise<any> {
          return {};
        }
        async listLabOrders(_filter: any): Promise<any> {
          return [];
        }
        async createLabOrders(_data: any): Promise<any> {
          return {};
        }
        async listMedicalRecords(_filter: any): Promise<any> {
          return [];
        }
        async listInsuranceClaims(_filter: any): Promise<any> {
          return [];
        }
        async createInsuranceClaims(_data: any): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import HealthcareModuleService from "../../../src/modules/healthcare/service";

describe("HealthcareModuleService", () => {
  let service: HealthcareModuleService;

  beforeEach(() => {
    service = new HealthcareModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("cancelAppointment", () => {
    it("cancels a scheduled appointment", async () => {
      vi.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt-1",
        status: "scheduled",
      });
      const updateSpy = jest
        .spyOn(service, "updateHealthcareAppointments")
        .mockResolvedValue({ id: "apt-1", status: "cancelled" });

      const result = await service.cancelAppointment(
        "apt-1",
        "patient request",
      );

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "apt-1",
          status: "cancelled",
          cancellation_reason: "patient request",
        }),
      );
      expect(result.status).toBe("cancelled");
    });

    it("throws when appointment is not scheduled", async () => {
      vi.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt-1",
        status: "completed",
      });

      await expect(service.cancelAppointment("apt-1")).rejects.toThrow(
        "Only scheduled appointments can be cancelled",
      );
    });
  });

  describe("createPrescription", () => {
    it("creates a prescription linked to an appointment", async () => {
      vi.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt-1",
        patient_id: "patient-1",
      });
      const createSpy = jest
        .spyOn(service, "createPrescriptions")
        .mockResolvedValue({ id: "rx-1" });

      await service.createPrescription("apt-1", {
        medications: "Amoxicillin",
        dosage: "500mg 3x daily",
        prescribedById: "doc-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: "apt-1",
          patient_id: "patient-1",
          practitioner_id: "doc-1",
          medications: "Amoxicillin",
          status: "active",
        }),
      );
    });

    it("throws when medications or dosage is missing", async () => {
      jest
        .spyOn(service, "retrieveHealthcareAppointment")
        .mockResolvedValue({ id: "apt-1" });

      await expect(
        service.createPrescription("apt-1", {
          medications: "",
          dosage: "500mg",
          prescribedById: "doc-1",
        }),
      ).rejects.toThrow("Medications and dosage are required");
    });

    it("throws when prescriber ID is missing", async () => {
      jest
        .spyOn(service, "retrieveHealthcareAppointment")
        .mockResolvedValue({ id: "apt-1" });

      await expect(
        service.createPrescription("apt-1", {
          medications: "Amoxicillin",
          dosage: "500mg",
          prescribedById: "",
        }),
      ).rejects.toThrow("Prescriber ID is required");
    });
  });

  describe("orderLabTest", () => {
    it("creates a lab order with normal priority", async () => {
      const createSpy = jest
        .spyOn(service, "createLabOrders")
        .mockResolvedValue({ id: "lab-1" });

      await service.orderLabTest("patient-1", {
        testType: "blood_panel",
        practitionerId: "doc-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "normal",
          status: "pending",
        }),
      );
    });

    it("sets status to in_progress for urgent priority", async () => {
      const createSpy = jest
        .spyOn(service, "createLabOrders")
        .mockResolvedValue({ id: "lab-1" });

      await service.orderLabTest("patient-1", {
        testType: "blood_panel",
        priority: "urgent",
        practitionerId: "doc-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "urgent",
          status: "in_progress",
        }),
      );
    });

    it("throws for invalid priority", async () => {
      await expect(
        service.orderLabTest("patient-1", {
          testType: "blood_panel",
          priority: "critical",
          practitionerId: "doc-1",
        }),
      ).rejects.toThrow("Invalid priority");
    });
  });

  describe("submitInsuranceClaim", () => {
    it("submits a claim with valid data", async () => {
      vi.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt-1",
        patient_id: "patient-1",
      });
      const createSpy = jest
        .spyOn(service, "createInsuranceClaims")
        .mockResolvedValue({ id: "claim-1" });

      await service.submitInsuranceClaim("apt-1", {
        insuranceProviderId: "ins-1",
        policyNumber: "POL-123",
        claimAmount: 500,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          claim_amount: 500,
          currency: "USD",
          status: "submitted",
        }),
      );
    });

    it("throws when claim amount is zero or negative", async () => {
      jest
        .spyOn(service, "retrieveHealthcareAppointment")
        .mockResolvedValue({ id: "apt-1" });

      await expect(
        service.submitInsuranceClaim("apt-1", {
          insuranceProviderId: "ins-1",
          policyNumber: "POL-123",
          claimAmount: 0,
        }),
      ).rejects.toThrow("Claim amount must be greater than zero");
    });

    it("throws when insurance provider or policy number is missing", async () => {
      jest
        .spyOn(service, "retrieveHealthcareAppointment")
        .mockResolvedValue({ id: "apt-1" });

      await expect(
        service.submitInsuranceClaim("apt-1", {
          insuranceProviderId: "",
          policyNumber: "POL-123",
          claimAmount: 500,
        }),
      ).rejects.toThrow("Insurance provider ID and policy number are required");
    });
  });

  describe("getPractitionerDashboard", () => {
    it("returns dashboard with upcoming appointments and pending lab orders", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      vi.spyOn(service, "listHealthcareAppointments").mockResolvedValue([
        {
          id: "apt-1",
          status: "scheduled",
          appointment_date: futureDate.toISOString(),
        },
        {
          id: "apt-2",
          status: "completed",
          appointment_date: new Date("2024-01-01").toISOString(),
        },
      ]);
      jest
        .spyOn(service, "listPrescriptions")
        .mockResolvedValue([{ id: "rx-1" }, { id: "rx-2" }]);
      vi.spyOn(service, "listLabOrders").mockResolvedValue([
        { id: "lab-1", status: "pending" },
        { id: "lab-2", status: "completed" },
        { id: "lab-3", status: "in_progress" },
      ]);

      const result = await service.getPractitionerDashboard("doc-1");

      expect(result.practitionerId).toBe("doc-1");
      expect(result.upcomingCount).toBe(1);
      expect(result.totalPrescriptions).toBe(2);
      expect(result.pendingLabOrderCount).toBe(2);
    });
  });
});
