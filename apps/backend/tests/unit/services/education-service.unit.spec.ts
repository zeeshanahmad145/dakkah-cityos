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
        async listCourses(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCourse(_id: string): Promise<any> {
          return null;
        }
        async createCourses(_data: any): Promise<any> {
          return {};
        }
        async updateCourses(_data: any): Promise<any> {
          return {};
        }
        async listLessons(_filter: any): Promise<any> {
          return [];
        }
        async listEnrollments(_filter: any): Promise<any> {
          return [];
        }
        async retrieveEnrollment(_id: string): Promise<any> {
          return null;
        }
        async createEnrollments(_data: any): Promise<any> {
          return {};
        }
        async updateEnrollments(_data: any): Promise<any> {
          return {};
        }
        async listCertificates(_filter: any): Promise<any> {
          return [];
        }
        async createCertificates(_data: any): Promise<any> {
          return {};
        }
        async listQuizzes(_filter: any): Promise<any> {
          return [];
        }
        async listAssignments(_filter: any): Promise<any> {
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
    it("enrolls a student successfully", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "c1",
        status: "published",
        max_students: 30,
        enrolled_count: 5,
      });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createEnrollments")
        .mockResolvedValue({ id: "e1" });
      vi.spyOn(service, "updateCourses").mockResolvedValue({});

      const result = await service.enrollStudent("c1", "s1");

      expect(result.id).toBe("e1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          course_id: "c1",
          student_id: "s1",
          status: "active",
        }),
      );
    });

    it("throws when course is at full capacity", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({
        id: "c1",
        status: "active",
        max_students: 2,
        enrolled_count: 2,
      });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([]);

      await expect(service.enrollStudent("c1", "s1")).rejects.toThrow(
        "Course is at full capacity",
      );
    });

    it("throws when student is already enrolled", async () => {
      jest
        .spyOn(service, "retrieveCourse")
        .mockResolvedValue({ id: "c1", status: "published" });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([{ id: "e1" }]);

      await expect(service.enrollStudent("c1", "s1")).rejects.toThrow(
        "Student is already enrolled in this course",
      );
    });

    it("throws when course is not available", async () => {
      jest
        .spyOn(service, "retrieveCourse")
        .mockResolvedValue({ id: "c1", status: "draft" });

      await expect(service.enrollStudent("c1", "s1")).rejects.toThrow(
        "Course is not available for enrollment",
      );
    });
  });

  describe("getCourseAnalytics", () => {
    it("returns correct analytics metrics", async () => {
      vi.spyOn(service, "retrieveCourse").mockResolvedValue({ id: "c1" });
      vi.spyOn(service, "listEnrollments").mockResolvedValue([
        { status: "completed", progress: 100 },
        { status: "active", progress: 50 },
        { status: "dropped", progress: 10 },
        { status: "active", progress: 75 },
      ]);

      const result = await service.getCourseAnalytics("c1");

      expect(result.enrolled).toBe(4);
      expect(result.completed).toBe(1);
      expect(result.averageProgress).toBe(58.75);
      expect(result.dropoutRate).toBe(25);
      expect(result.completionRate).toBe(25);
    });
  });

  describe("trackProgress", () => {
    it("updates progress when completing a lesson", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "e1",
        status: "active",
        completed_lessons: ["l1"],
        course_id: "c1",
      });
      jest
        .spyOn(service, "listLessons")
        .mockResolvedValue([{ id: "l1" }, { id: "l2" }, { id: "l3" }]);
      const updateSpy = jest
        .spyOn(service, "updateEnrollments")
        .mockResolvedValue({ id: "e1", progress: 67 });

      await service.trackProgress("e1", "l2");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 67 }),
      );
    });

    it("throws when enrollment is not active", async () => {
      jest
        .spyOn(service, "retrieveEnrollment")
        .mockResolvedValue({ id: "e1", status: "completed" });

      await expect(service.trackProgress("e1", "l1")).rejects.toThrow(
        "Enrollment is not active",
      );
    });
  });

  describe("issueCertificate", () => {
    it("issues certificate for completed course", async () => {
      vi.spyOn(service, "retrieveEnrollment").mockResolvedValue({
        id: "e1",
        progress: 100,
        student_id: "s1",
        course_id: "c1",
      });
      vi.spyOn(service, "listCertificates").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createCertificates")
        .mockResolvedValue({ id: "cert-1" });
      vi.spyOn(service, "updateEnrollments").mockResolvedValue({});

      const result = await service.issueCertificate("e1");

      expect(result.id).toBe("cert-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "issued" }),
      );
    });

    it("throws when course is not fully completed", async () => {
      jest
        .spyOn(service, "retrieveEnrollment")
        .mockResolvedValue({ id: "e1", progress: 80 });

      await expect(service.issueCertificate("e1")).rejects.toThrow(
        "Course must be fully completed before issuing a certificate",
      );
    });
  });
});
