import { MedusaService } from "@medusajs/framework/utils";
import ServiceRequest from "./models/service-request";
import Permit from "./models/permit";
import MunicipalLicense from "./models/municipal-license";
import Fine from "./models/fine";
import CitizenProfile from "./models/citizen-profile";

class GovernmentModuleService extends MedusaService({
  ServiceRequest,
  Permit,
  MunicipalLicense,
  Fine,
  CitizenProfile,
}) {
  /**
   * Submit a new government service application for a citizen.
   */
  async submitApplication(
    serviceId: string,
    applicantId: string,
    data: Record<string, any>,
  ): Promise<any> {
    const citizen = await this.retrieveCitizenProfile(applicantId) as any;
    const applicationNumber = `APP-${Date.now().toString(36).toUpperCase()}`;
    const request = await this.createServiceRequests({
      service_id: serviceId,
      citizen_id: applicantId,
      status: "submitted",
      applicant_name: citizen.full_name,
      ...data,
    } as any);
    return request;
  }

  /**
   * Review a submitted application and record an approval or rejection decision.
   */
  async reviewApplication(
    applicationId: string,
    decision: "approved" | "rejected",
  ): Promise<any> {
    const application = await this.retrieveServiceRequest(applicationId) as any;
    if (
      application.status !== "submitted" &&
      application.status !== "acknowledged"
    ) {
      throw new Error("Application is not in a reviewable state");
    }
    const updated = await this.updateServiceRequests({
      id: applicationId,
      status: decision === "approved" ? "resolved" : "rejected",
      decision,
    } as any);
    if (decision === "approved") {
      await this.createPermits({
        service_request_id: applicationId,
        citizen_id: application.citizen_id,
        status: "active",
        issued_at: new Date(),
      } as any);
    }
    return updated;
  }

  /**
   * Track the current status and history of a government application.
   */
  async trackApplication(applicationId: string): Promise<any> {
    const application = await this.retrieveServiceRequest(applicationId) as any;
    const permits = await this.listPermits({
      service_request_id: applicationId,
    }) as any;
    const permitList = Array.isArray(permits)
      ? permits
      : [permits].filter(Boolean);
    return {
      status: application.status,
      permits: permitList,
    };
  }

  /**
   * Calculate fees for a government service based on its type and configuration.
   */
  async calculateFees(
    serviceId: string,
  ): Promise<{ baseFee: number; processingFee: number; totalFee: number }> {
    const fines = await this.listFines({ service_id: serviceId }) as any;
    const fineList = Array.isArray(fines) ? fines : [fines].filter(Boolean);
    const baseFee = fineList.reduce(
      (sum: number, f: any) => sum + Number(f.amount || 0),
      0,
    );
    const processingFee = baseFee * 0.05;
    return { baseFee, processingFee, totalFee: baseFee + processingFee };
  }

  async issuePermit(
    applicationId: string,
    data: {
      permitType: string;
      validFrom: Date;
      validUntil: Date;
      conditions?: string;
    },
  ): Promise<any> {
    const application = await this.retrieveServiceRequest(applicationId) as any;

    if (application.status !== "resolved") {
      throw new Error("Permit can only be issued for approved applications");
    }

    if (new Date(data.validFrom) >= new Date(data.validUntil)) {
      throw new Error("Valid-from date must be before valid-until date");
    }

    const permit = await this.createPermits({
      service_request_id: applicationId,
      citizen_id: application.citizen_id,
      permit_type: data.permitType,
      valid_from: data.validFrom,
      valid_until: data.validUntil,
      conditions: data.conditions || null,
      status: "active",
      issued_at: new Date(),
    } as any);

    return permit;
  }

  async renewPermit(permitId: string): Promise<any> {
    const permit = await this.retrievePermit(permitId) as any;

    if (permit.status !== "active" && permit.status !== "expired") {
      throw new Error("Only active or expired permits can be renewed");
    }

    const currentValidUntil = new Date(permit.valid_until);
    const newValidFrom =
      currentValidUntil > new Date() ? currentValidUntil : new Date();
    const newValidUntil = new Date(newValidFrom);
    newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);

    const renewed = await this.updatePermits({
      id: permitId,
      valid_from: newValidFrom,
      valid_until: newValidUntil,
      status: "active",
      renewed_at: new Date(),
    } as any);

    return renewed;
  }

  async getApplicationStatus(applicationId: string): Promise<{
    applicationId: string;
    status: string;
    permits: any[];
    timeline: Array<{ event: string; date: Date }>;
  }> {
    const application = await this.retrieveServiceRequest(applicationId) as any;
    const permits = await this.listPermits({
      service_request_id: applicationId,
    }) as any;
    const permitList = Array.isArray(permits)
      ? permits
      : [permits].filter(Boolean);

    const timeline: Array<{ event: string; date: Date }> = [];

    if (application.created_at) {
      timeline.push({
        event: "submitted",
        date: new Date(application.created_at),
      });
    }
    if (application.status === "acknowledged") {
      timeline.push({
        event: "acknowledged",
        date: new Date(application.updated_at || application.created_at),
      });
    }
    if (application.status === "resolved") {
      timeline.push({
        event: "approved",
        date: new Date(application.updated_at),
      });
    }
    if (application.status === "rejected") {
      timeline.push({
        event: "rejected",
        date: new Date(application.updated_at),
      });
    }
    for (const permit of permitList) {
      if (permit.issued_at) {
        timeline.push({
          event: "permit_issued",
          date: new Date(permit.issued_at),
        });
      }
    }

    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      applicationId,
      status: application.status,
      permits: permitList,
      timeline,
    };
  }
}

export default GovernmentModuleService;
