import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/education/progress
 * Get a student's course progress.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const educationService = req.scope.resolve("education") as unknown as any;
    const { student_id, course_id } = req.query as {
      student_id?: string;
      course_id?: string;
    };

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    let progress: any;
    if (typeof educationService.getProgress === "function") {
      progress = await educationService.getProgress(student_id, course_id);
    } else {
      progress =
        (await educationService.listProgressRecords?.({
          student_id,
          course_id,
        })) ?? [];
    }

    return res.json({ progress });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-EDUCATION-PROGRESS");
  }
}

/**
 * POST /store/education/progress
 * Mark a lesson as completed.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const educationService = req.scope.resolve("education") as unknown as any;
    const { student_id, lesson_id, course_id } = req.body as {
      student_id: string;
      lesson_id: string;
      course_id?: string;
    };

    if (!student_id || !lesson_id) {
      return res
        .status(400)
        .json({ error: "student_id and lesson_id are required" });
    }

    let result: any;
    if (typeof educationService.completeLesson === "function") {
      result = await educationService.completeLesson(student_id, lesson_id);
    } else {
      result = await educationService.createProgressRecords({
        student_id,
        lesson_id,
        course_id: course_id || null,
        completed_at: new Date(),
        status: "completed",
      });
    }

    return res.status(201).json({ progress: result });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-EDUCATION-COMPLETE-LESSON");
  }
}
