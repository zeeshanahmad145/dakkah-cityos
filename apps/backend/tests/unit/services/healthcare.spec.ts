jest.mock("@medusajs/framework/utils", () => {
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
        async retrieveHealthcareAppointment(_id: string): Promise<any> {
          return null;
        }
        async createHealthcareAppointments(_data: any): Promise<any> {
          return {};
        }
        async updateHealthcareAppointments(_data: any): Promise<any> {
          return {};
        }
        async listHealthcareAppointments(_filter: any): Promise<any> {
          return [];
        }
        async retrievePractitioner(_id: string): Promise<any> {
          return null;
        }
        async listPractitioners(_filter: any): Promise<any> {
          return [];
        }
        async createPrescriptions(_data: any): Promise<any> {
          return {};
        }
        async createInsuranceClaims(_data: any): Promise<any> {
          return {};
        }
        async listInsuranceClaims(_filter: any): Promise<any> {
          return [];
        }
        async listMedicalRecords(_filter: any): Promise<any> {
          return [];
        }
        async listPrescriptions(_filter: any): Promise<any> {
          return [];
        }
        async listLabOrders(_filter: any): Promise<any> {
          return [];
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
    service = new HealthcareModuleService();
    jest.clearAllMocks();
  });

  describe("verifyInsurance", () => {
    it("should verify when active insurance claims exist for provider", async () => {
      jest.spyOn(service, "listInsuranceClaims").mockResolvedValue([
        {
          id: "claim_01",
          insurance_provider_id: "prov_01",
          patient_id: "pat_01",
          status: "approved",
        },
      ]);
      jest.spyOn(service, "retrievePractitioner").mockResolvedValue({
        id: "prov_01",
        name: "Dr. Smith",
      });

      const result = await service.verifyInsurance("pat_01", "prov_01");
      expect(result.verified).toBe(true);
      expect(result.coverageStatus).toBe("active");
    });

    it("should not verify when no matching claims exist", async () => {
      jest.spyOn(service, "listInsuranceClaims").mockResolvedValue([]);
      jest.spyOn(service, "retrievePractitioner").mockResolvedValue({
        id: "prov_01",
        name: "Dr. Smith",
      });

      const result = await service.verifyInsurance("pat_01", "prov_01");
      expect(result.verified).toBe(false);
    });

    it("should throw when patient or provider ID missing", async () => {
      await expect(service.verifyInsurance("", "prov_01")).rejects.toThrow(
        "Patient ID and provider ID are required",
      );
    });
  });

  describe("createPrescription", () => {
    it("should create a valid prescription", async () => {
      jest.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt_01",
        patient_id: "pat_01",
        practitioner_id: "prov_01",
        status: "completed",
      });
      jest.spyOn(service, "createPrescriptions").mockResolvedValue({
        id: "rx_01",
        medications: "Amoxicillin",
        dosage: "500mg",
      });

      const result = await service.createPrescription("apt_01", {
        medications: "Amoxicillin",
        dosage: "500mg",
        prescribedById: "prov_01",
      });
      expect(result.medications).toBe("Amoxicillin");
    });

    it("should reject prescription without medications", async () => {
      jest.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt_01",
        status: "completed",
      });

      await expect(
        service.createPrescription("apt_01", {
          medications: "",
          dosage: "500mg",
          prescribedById: "prov_01",
        }),
      ).rejects.toThrow("Medications and dosage are required");
    });

    it("should reject prescription without dosage", async () => {
      jest.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt_01",
        status: "completed",
      });

      await expect(
        service.createPrescription("apt_01", {
          medications: "Amoxicillin",
          dosage: "",
          prescribedById: "prov_01",
        }),
      ).rejects.toThrow("Medications and dosage are required");
    });

    it("should reject prescription without prescriber ID", async () => {
      jest.spyOn(service, "retrieveHealthcareAppointment").mockResolvedValue({
        id: "apt_01",
        status: "completed",
      });

      await expect(
        service.createPrescription("apt_01", {
          medications: "Amoxicillin",
          dosage: "500mg",
          prescribedById: "",
        }),
      ).rejects.toThrow("Prescriber ID is required");
    });
  });

  describe("bookAppointment", () => {
    it("should book appointment with available provider", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      jest.spyOn(service, "retrievePractitioner").mockResolvedValue({
        id: "prov_01",
        name: "Dr. Smith",
      });
      jest.spyOn(service, "checkProviderAvailability").mockResolvedValue(true);
      jest.spyOn(service, "createHealthcareAppointments").mockResolvedValue({
        id: "apt_01",
        practitioner_id: "prov_01",
        patient_id: "pat_01",
        status: "scheduled",
      });

      const result = await service.bookAppointment(
        "prov_01",
        "pat_01",
        futureDate,
      );
      expect(result.status).toBe("scheduled");
    });

    it("should reject appointment when provider is not available", async () => {
      jest.spyOn(service, "retrievePractitioner").mockResolvedValue({
        id: "prov_01",
        name: "Dr. Smith",
      });
      jest.spyOn(service, "checkProviderAvailability").mockResolvedValue(false);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      await expect(
        service.bookAppointment("prov_01", "pat_01", futureDate),
      ).rejects.toThrow("Provider is not available at the requested time");
    });
  });
});
