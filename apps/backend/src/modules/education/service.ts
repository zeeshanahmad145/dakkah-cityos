import { MedusaService } from "@medusajs/framework/utils";
import Course from "./models/course";
import Lesson from "./models/lesson";
import Enrollment from "./models/enrollment";
import Certificate from "./models/certificate";
import Quiz from "./models/quiz";
import Assignment from "./models/assignment";

class EducationModuleService extends MedusaService({
  Course,
  Lesson,
  Enrollment,
  Certificate,
  Quiz,
  Assignment,
}) {
  /** Enroll a student in a course */
  async enrollStudent(courseId: string, studentId: string): Promise<any> {
    if (!courseId || !studentId) {
      throw new Error("Course ID and student ID are required");
    }

    const course = await this.retrieveCourse(courseId) as any;
    if (course.status !== "published" && course.status !== "active") {
      throw new Error("Course is not available for enrollment");
    }

    const existing = await this.listEnrollments({
      course_id: courseId,
      student_id: studentId,
    }) as any;
    const list = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (list.length > 0) {
      throw new Error("Student is already enrolled in this course");
    }

    if (
      course.max_students &&
      Number(course.enrolled_count || 0) >= Number(course.max_students)
    ) {
      throw new Error("Course is at full capacity");
    }

    const enrollment = await this.createEnrollments({
      course_id: courseId,
      student_id: studentId,
      status: "active",
      progress: 0,
      enrolled_at: new Date(),
    } as any);

    await this.updateCourses({
      id: courseId,
      enrolled_count: Number(course.enrolled_count || 0) + 1,
    } as any);

    return enrollment;
  }

  /** Track student progress on a lesson */
  async trackProgress(enrollmentId: string, lessonId: string): Promise<any> {
    const enrollment = await this.retrieveEnrollment(enrollmentId) as any;

    if (enrollment.status !== "active") {
      throw new Error("Enrollment is not active");
    }

    const completedLessons = (enrollment.completed_lessons as string[]) || [];
    if (completedLessons.includes(lessonId)) {
      return enrollment;
    }

    const updatedLessons = [...completedLessons, lessonId];
    const lessons = await this.listLessons({
      course_id: enrollment.course_id,
    }) as any;
    const lessonList = Array.isArray(lessons)
      ? lessons
      : [lessons].filter(Boolean);
    const progress =
      lessonList.length > 0
        ? Math.round((updatedLessons.length / lessonList.length) * 100)
        : 0;

    return await this.updateEnrollments({
      id: enrollmentId,
      completed_lessons: updatedLessons,
      progress,
      last_activity_at: new Date(),
    } as any);
  }

  /** Issue a certificate for a completed enrollment */
  async issueCertificate(enrollmentId: string): Promise<any> {
    const enrollment = await this.retrieveEnrollment(enrollmentId) as any;

    if (Number(enrollment.progress) < 100) {
      throw new Error(
        "Course must be fully completed before issuing a certificate",
      );
    }

    const existing = await this.listCertificates({
      enrollment_id: enrollmentId,
    }) as any;
    const certList = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);
    if (certList.length > 0) {
      return certList[0];
    }

    const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const certificate = await this.createCertificates({
      enrollment_id: enrollmentId,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      certificate_number: certNumber,
      issued_at: new Date(),
      status: "issued",
    } as any);

    await this.updateEnrollments({
      id: enrollmentId,
      status: "completed",
      completed_at: new Date(),
    } as any);

    return certificate;
  }

  /** Get completion rate for a course */
  async getCompletionRate(
    courseId: string,
  ): Promise<{ total: number; completed: number; rate: number }> {
    const enrollments = await this.listEnrollments({
      course_id: courseId,
    }) as any;
    const list = Array.isArray(enrollments)
      ? enrollments
      : [enrollments].filter(Boolean);

    const total = list.length;
    const completed = list.filter(
      (e: any) => e.status === "completed" || Number(e.progress) >= 100,
    ).length;
    const rate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    return { total, completed, rate };
  }

  async getCourseAnalytics(courseId: string): Promise<{
    enrolled: number;
    completed: number;
    averageProgress: number;
    dropoutRate: number;
    completionRate: number;
  }> {
    const course = await this.retrieveCourse(courseId) as any;
    const enrollments = await this.listEnrollments({
      course_id: courseId,
    }) as any;
    const list = Array.isArray(enrollments)
      ? enrollments
      : [enrollments].filter(Boolean);

    const enrolled = list.length;
    const completed = list.filter(
      (e: any) => e.status === "completed" || Number(e.progress) >= 100,
    ).length;
    const dropped = list.filter(
      (e: any) => e.status === "dropped" || e.status === "cancelled",
    ).length;
    const totalProgress = list.reduce(
      (sum: number, e: any) => sum + Number(e.progress || 0),
      0,
    );
    const averageProgress =
      enrolled > 0 ? Math.round((totalProgress / enrolled) * 100) / 100 : 0;
    const dropoutRate =
      enrolled > 0 ? Math.round((dropped / enrolled) * 10000) / 100 : 0;
    const completionRate =
      enrolled > 0 ? Math.round((completed / enrolled) * 10000) / 100 : 0;

    return {
      enrolled,
      completed,
      averageProgress,
      dropoutRate,
      completionRate,
    };
  }
}

export default EducationModuleService;
