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
        async retrieveCourse(_id: string): Promise<any> {
          return null;
        }
        async updateCourses(_data: any): Promise<any> {
          return {};
        }
        async listEnrollments(_filter: any): Promise<any> {
          return [];
        }
        async createEnrollments(_data: any): Promise<any> {
          return {};
        }
        async retrieveEnrollment(_id: string): Promise<any> {
          return null;
        }
        async updateEnrollments(_data: any): Promise<any> {
          return {};
        }
        async listLessons(_filter: any): Promise<any> {
          return [];
        }
        async createCertificates(_data: any): Promise<any> {
          return {};
        }
        async listCertificates(_filter: any): Promise<any> {
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

import EducationModuleService from "../../../src/modules/education/service";

describe("EducationModuleService", () => {
  let service: EducationModuleService;

  beforeEach(() => {
    service = new EducationModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("enrollStudent", () => {
    it("should enroll a student in an available course", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "course_01",
        status: "published",
        max_students: 30,
        enrolled_count: 10,
      });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([]);
      vi.spyOn(service, "createEnrollments").mockResolvedValue({
        id: "enr_01",
        course_id: "course_01",
        student_id: "stud_01",
        status: "active",
      });
      vi.spyOn(service, "updateCourses").mockResolvedValue({});

      const result = await service.enrollStudent("course_01", "stud_01");
      expect(result.status).toBe("active");
    });

    it("should reject enrollment when course is full", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "course_01",
        status: "published",
        max_students: 5,
        enrolled_count: 5,
      });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([]);

      await expect(
        service.enrollStudent("course_01", "stud_01"),
      ).rejects.toThrow("Course is at full capacity");
    });

    it("should reject enrollment for unpublished course", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "course_01",
        status: "draft",
        max_students: 30,
      });

      await expect(
        service.enrollStudent("course_01", "stud_01"),
      ).rejects.toThrow("Course is not available for enrollment");
    });

    it("should reject duplicate enrollment", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "course_01",
        status: "published",
        max_students: 30,
        enrolled_count: 10,
      });
      jest
        .spyOn(service, "listEnrollments")
        .mockResolvedValue([{ student_id: "stud_01", status: "active" }]);

      await expect(
        service.enrollStudent("course_01", "stud_01"),
      ).rejects.toThrow("Student is already enrolled in this course");
    });
  });

  describe("trackProgress", () => {
    it("should track lesson completion and update progress", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "enr_01",
        course_id: "course_01",
        student_id: "stud_01",
        status: "active",
        progress: 50,
        completed_lessons: ["l1", "l2", "l3", "l4", "l5"],
      });
      jest
        .spyOn(service, "listLessons")
        .mockResolvedValue(Array(10).fill({ id: "lesson_x" }));
      vi.spyOn(service, "updateEnrollments").mockResolvedValue({
        id: "enr_01",
        progress: 60,
      });

      const result = await service.trackProgress("enr_01", "lesson_06");
      expect(result).toBeDefined();
    });

    it("should return existing enrollment if lesson already completed", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "enr_01",
        course_id: "course_01",
        status: "active",
        progress: 50,
        completed_lessons: ["lesson_01"],
      });

      const result = await service.trackProgress("enr_01", "lesson_01");
      expect(result).toBeDefined();
    });

    it("should reject progress on inactive enrollment", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "enr_01",
        status: "cancelled",
        completed_lessons: [],
      });

      await expect(
        service.trackProgress("enr_01", "lesson_01"),
      ).rejects.toThrow("Enrollment is not active");
    });
  });

  describe("issueCertificate", () => {
    it("should issue certificate for completed course", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "enr_01",
        course_id: "course_01",
        student_id: "stud_01",
        status: "active",
        progress: 100,
      });
      vi.spyOn(service, "listCertificates").mockResolvedValue([]);
      vi.spyOn(service, "createCertificates").mockResolvedValue({
        id: "cert_01",
        enrollment_id: "enr_01",
        status: "issued",
      });
      vi.spyOn(service, "updateEnrollments").mockResolvedValue({});

      const result = await service.issueCertificate("enr_01");
      expect(result).toBeDefined();
    });

    it("should reject certificate for incomplete course", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "enr_01",
        course_id: "course_01",
        progress: 75,
        status: "active",
      });

      await expect(service.issueCertificate("enr_01")).rejects.toThrow(
        "Course must be fully completed before issuing a certificate",
      );
    });
  });
});
