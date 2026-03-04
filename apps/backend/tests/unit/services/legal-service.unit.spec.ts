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
        async listAttorneyProfiles(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAttorneyProfile(_id: string): Promise<any> {
          return null;
        }
        async listLegalCases(_filter: any): Promise<any> {
          return [];
        }
        async retrieveLegalCase(_id: string): Promise<any> {
          return null;
        }
        async createLegalCases(_data: any): Promise<any> {
          return {};
        }
        async updateLegalCases(_data: any): Promise<any> {
          return {};
        }
        async listLegalConsultations(_filter: any): Promise<any> {
          return [];
        }
        async createLegalConsultations(_data: any): Promise<any> {
          return {};
        }
        async listRetainerAgreements(_filter: any): Promise<any> {
          return [];
        }
        async createRetainerAgreements(_data: any): Promise<any> {
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

import LegalModuleService from "../../../src/modules/legal/service";

describe("LegalModuleService", () => {
  let service: LegalModuleService;

  beforeEach(() => {
    service = new LegalModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("addDocument", () => {
    it("adds document to an open case", async () => {
      jest
        .spyOn(service, "retrieveLegalCase")
        .mockResolvedValue({ id: "case-1", status: "open" });
      const createSpy = jest
        .spyOn(service, "createRetainerAgreements")
        .mockResolvedValue({ id: "doc-1" });

      const result = await service.addDocument("case-1", {
        title: "Contract",
        documentType: "contract",
        fileUrl: "https://example.com/doc.pdf",
        uploadedBy: "user-1",
      });

      expect(result.id).toBe("doc-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ case_id: "case-1", title: "Contract" }),
      );
    });

    it("throws when title or file URL is missing", async () => {
      await expect(
        service.addDocument("case-1", {
          title: "",
          documentType: "contract",
          fileUrl: "https://example.com/doc.pdf",
          uploadedBy: "user-1",
        }),
      ).rejects.toThrow("Document title and file URL are required");
    });

    it("throws when case is closed", async () => {
      jest
        .spyOn(service, "retrieveLegalCase")
        .mockResolvedValue({ id: "case-1", status: "closed" });

      await expect(
        service.addDocument("case-1", {
          title: "Doc",
          documentType: "contract",
          fileUrl: "https://example.com/doc.pdf",
          uploadedBy: "user-1",
        }),
      ).rejects.toThrow("Cannot add documents to a closed case");
    });
  });

  describe("getBillingSummary", () => {
    it("calculates billing summary correctly", async () => {
      vi.spyOn(service, "retrieveLegalCase").mockResolvedValue({
        id: "case-1",
        hourly_rate: 300,
        paid_amount: 500,
      });
      jest
        .spyOn(service, "listLegalConsultations")
        .mockResolvedValue([
          { duration_hours: 2 },
          { duration_hours: 3 },
          { duration_hours: 1.5 },
        ]);

      const result = await service.getBillingSummary("case-1");

      expect(result.totalHours).toBe(6.5);
      expect(result.hourlyRate).toBe(300);
      expect(result.totalBillable).toBe(1950);
      expect(result.consultationCount).toBe(3);
      expect(result.outstandingBalance).toBe(1450);
    });
  });

  describe("scheduleConsultation", () => {
    it("schedules consultation for an open case", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveLegalCase")
        .mockResolvedValue({ id: "case-1", status: "open" });
      const createSpy = jest
        .spyOn(service, "createLegalConsultations")
        .mockResolvedValue({ id: "consult-1" });

      const result = await service.scheduleConsultation("case-1", {
        date: futureDate,
        duration: 2,
        attendees: ["att-1"],
      });

      expect(result.id).toBe("consult-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ case_id: "case-1", status: "scheduled" }),
      );
    });

    it("throws when date is in the past", async () => {
      const pastDate = new Date("2020-01-01");

      await expect(
        service.scheduleConsultation("case-1", {
          date: pastDate,
          duration: 2,
          attendees: [],
        }),
      ).rejects.toThrow("Consultation date must be in the future");
    });

    it("throws when duration is invalid", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await expect(
        service.scheduleConsultation("case-1", {
          date: futureDate,
          duration: 10,
          attendees: [],
        }),
      ).rejects.toThrow("Duration must be between 1 and 8 hours");
    });

    it("throws when case is closed", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveLegalCase")
        .mockResolvedValue({ id: "case-1", status: "closed" });

      await expect(
        service.scheduleConsultation("case-1", {
          date: futureDate,
          duration: 2,
          attendees: [],
        }),
      ).rejects.toThrow("Cannot schedule consultations for a closed case");
    });
  });
});
