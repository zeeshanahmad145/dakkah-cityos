import { MedusaService } from "@medusajs/framework/utils";
import AttorneyProfile from "./models/attorney-profile";
import LegalCase from "./models/legal-case";
import LegalConsultation from "./models/consultation";
import RetainerAgreement from "./models/retainer-agreement";

class LegalModuleService extends MedusaService({
  AttorneyProfile,
  LegalCase,
  LegalConsultation,
  RetainerAgreement,
}) {
  /**
   * Create a new legal case for a client with the specified case type.
   */
  async createCase(clientId: string, caseType: string): Promise<any> {
    const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}`;
    const legalCase = await this.createLegalCases({
      client_id: clientId,
      case_type: caseType,
      case_number: caseNumber,
      status: "open",
      opened_at: new Date(),
    } as any);
    return legalCase;
  }

  /**
   * Assign an attorney to a case. Validates the attorney exists and the case is open.
   */
  async assignAttorney(caseId: string, attorneyId: string): Promise<any> {
    const legalCase = await this.retrieveLegalCase(caseId) as any;
    if (legalCase.status === "closed") {
      throw new Error("Cannot assign attorney to a closed case");
    }
    const attorney = await this.retrieveAttorneyProfile(attorneyId) as any;
    return await this.updateLegalCases({
      id: caseId,
      attorney_id: attorneyId,
      attorney_name: attorney.name,
      assigned_at: new Date(),
    } as any);
  }

  /**
   * Update the status of a legal case with validation of allowed transitions.
   */
  async updateCaseStatus(caseId: string, status: string): Promise<any> {
    const legalCase = await this.retrieveLegalCase(caseId) as any;
    if (legalCase.status === "closed" && status !== "reopened") {
      throw new Error("Closed cases can only be reopened");
    }
    return await this.updateLegalCases({
      id: caseId,
      status,
      updated_at: new Date(),
    } as any);
  }

  /**
   * Generate an invoice for a legal case based on consultations and retainer agreements.
   */
  async generateInvoice(caseId: string): Promise<any> {
    const legalCase = await this.retrieveLegalCase(caseId) as any;
    const consultations = await this.listLegalConsultations({
      case_id: caseId,
    }) as any;
    const consultList = Array.isArray(consultations)
      ? consultations
      : [consultations].filter(Boolean);
    const totalHours = consultList.reduce(
      (sum: number, c: any) => sum + Number(c.duration_hours || 0),
      0,
    );
    // @ts-ignore - LegalCase doesn't have hourly_rate property
    const hourlyRate = Number(legalCase.hourly_rate || 250);
    const totalAmount = totalHours * hourlyRate;
    return {
      caseId,
      caseNumber: legalCase.case_number,
      totalHours,
      hourlyRate,
      totalAmount,
      consultations: consultList.length,
      generatedAt: new Date(),
    };
  }

  async addDocument(
    caseId: string,
    data: {
      title: string;
      documentType: string;
      fileUrl: string;
      uploadedBy: string;
    },
  ): Promise<any> {
    if (!data.title || !data.fileUrl) {
      throw new Error("Document title and file URL are required");
    }

    const legalCase = await this.retrieveLegalCase(caseId) as any;
    if (legalCase.status === "closed") {
      throw new Error("Cannot add documents to a closed case");
    }

    const retainer = await this.createRetainerAgreements({
      case_id: caseId,
      title: data.title,
      document_type: data.documentType,
      file_url: data.fileUrl,
      uploaded_by: data.uploadedBy,
      uploaded_at: new Date(),
      status: "active",
    } as any);

    return retainer;
  }

  async getBillingSummary(caseId: string): Promise<{
    caseId: string;
    totalHours: number;
    hourlyRate: number;
    totalBillable: number;
    consultationCount: number;
    outstandingBalance: number;
  }> {
    const legalCase = await this.retrieveLegalCase(caseId) as any;
    const consultations = await this.listLegalConsultations({
      case_id: caseId,
    }) as any;
    const consultList = Array.isArray(consultations)
      ? consultations
      : [consultations].filter(Boolean);

    const totalHours = consultList.reduce(
      (sum: number, c: any) => sum + Number(c.duration_hours || 0),
      0,
    );
    const hourlyRate = Number(legalCase.hourly_rate || 250);
    const totalBillable = Math.round(totalHours * hourlyRate * 100) / 100;
    const paidAmount = Number(legalCase.paid_amount || 0);
    const outstandingBalance =
      Math.round((totalBillable - paidAmount) * 100) / 100;

    return {
      caseId,
      totalHours,
      hourlyRate,
      totalBillable,
      consultationCount: consultList.length,
      outstandingBalance,
    };
  }

  async scheduleConsultation(
    caseId: string,
    data: { date: Date; duration: number; attendees: string[] },
  ): Promise<any> {
    if (!data.date || !data.duration) {
      throw new Error("Consultation date and duration are required");
    }

    if (new Date(data.date) < new Date()) {
      throw new Error("Consultation date must be in the future");
    }

    if (data.duration <= 0 || data.duration > 8) {
      throw new Error("Duration must be between 1 and 8 hours");
    }

    const legalCase = await this.retrieveLegalCase(caseId) as any;
    if (legalCase.status === "closed") {
      throw new Error("Cannot schedule consultations for a closed case");
    }

    const consultation = await this.createLegalConsultations({
      case_id: caseId,
      scheduled_date: data.date,
      duration_hours: data.duration,
      attendees: data.attendees || [],
      status: "scheduled",
      created_at: new Date(),
    } as any);

    return consultation;
  }
}

export default LegalModuleService;
