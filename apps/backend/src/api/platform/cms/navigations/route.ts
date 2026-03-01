import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  NAVIGATION_REGISTRY,
  type NavigationEntry,
} from "../../../../lib/platform/cms-registry";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      where: whereStr,
      limit: limitStr,
      page: pageStr,
    } = req.query as Record<string, string>;

    let where: Record<string, any> | undefined;
    if (whereStr) {
      try {
        where = JSON.parse(whereStr);
      } catch {
        return res.status(400).json({
          errors: [{ message: "Invalid JSON in 'where' parameter" }],
        });
      }
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const page = pageStr ? parseInt(pageStr, 10) : 1;

    if (isNaN(limit) || isNaN(page) || limit < 1 || page < 1) {
      return res.status(400).json({
        errors: [{ message: "Invalid limit or page parameter" }],
      });
    }

    let filtered: NavigationEntry[] = [...NAVIGATION_REGISTRY];

    if (where) {
      filtered = filtered.filter((nav) => {
        for (const [field, condition] of Object.entries(where!)) {
          const value = nav[field];
          if (typeof condition === "object" && condition !== null) {
            if ("equals" in condition && value !== condition.equals)
              return false;
            if ("not_equals" in condition && value === condition.not_equals)
              return false;
            if (
              "in" in condition &&
              Array.isArray(condition.in) &&
              !condition.in.includes(value)
            )
              return false;
            if (
              "not_in" in condition &&
              Array.isArray(condition.not_in) &&
              condition.not_in.includes(value)
            )
              return false;
          } else {
            if (value !== condition) return false;
          }
        }
        return true;
      });
    }

    const totalDocs = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    const start = (page - 1) * limit;
    const docs = filtered.slice(start, start + limit);
    const pagingCounter = (page - 1) * limit + 1;

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    return res.status(200).json({
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      pagingCounter,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "PLATFORM-CMS-NAVIGATIONS");
  }
}
