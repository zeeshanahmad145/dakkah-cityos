import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/persona/me
 * Returns the current customer's persona/segment data for personalization.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const personaService = req.scope.resolve("persona") as unknown as any;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // List personas assigned to this customer (stored in metadata or junction table)
    let personas: any[] = [];

    if (typeof personaService.listPersonasForCustomer === "function") {
      personas = await personaService.listPersonasForCustomer(customerId);
    } else {
      // Fallback: query by metadata
      const all = await personaService.listPersonas({});
      const list = Array.isArray(all) ? all : [all].filter(Boolean);
      personas = list.filter((p: any) => {
        const members = p.metadata?.members || [];
        return members.includes(customerId);
      });
    }

    return res.json({ personas: Array.isArray(personas) ? personas : [] });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PERSONA-ME");
  }
}
