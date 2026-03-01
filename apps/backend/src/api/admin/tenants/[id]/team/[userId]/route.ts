// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../../lib/api-error-handler"

const updateTeamMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  permissions: z.array(z.string()).optional(),
}).passthrough()

// PUT - Update team member role/permissions
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id, userId } = req.params
    const parsed = updateTeamMemberSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const { role, permissions } = parsed.data

    const tenantService = req.scope.resolve("tenant") as unknown as any
    const query = req.scope.resolve("query") as unknown as any

    // Verify member exists
    const { data: members } = await query.graph({
      entity: "tenant_user",
      fields: ["id", "role"],
      filters: { tenant_id: id, user_id: userId }
    })

    if (!members.length) {
      return res.status(404).json({ message: "Team member not found" })
    }

    // Prevent removing last owner
    if (members[0].role === "owner" && role !== "owner") {
      const { data: owners } = await query.graph({
        entity: "tenant_user",
        fields: ["id"],
        filters: { tenant_id: id, role: "owner" }
      })

      if (owners.length <= 1) {
        return res.status(400).json({ message: "Cannot remove the last owner" })
      }
    }

    await tenantService.updateTenantUsers({
      selector: { tenant_id: id, user_id: userId },
      data: {
        ...(role && { role }),
        ...(permissions && { permissions })
      }
    })

    res.json({ message: "Team member updated" })

  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin tenants id team userId")}
}

// DELETE - Remove team member
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id, userId } = req.params
    const tenantService = req.scope.resolve("tenant") as unknown as any
    const query = req.scope.resolve("query") as unknown as any

    // Verify member exists
    const { data: members } = await query.graph({
      entity: "tenant_user",
      fields: ["id", "role"],
      filters: { tenant_id: id, user_id: userId }
    })

    if (!members.length) {
      return res.status(404).json({ message: "Team member not found" })
    }

    // Prevent removing last owner
    if (members[0].role === "owner") {
      const { data: owners } = await query.graph({
        entity: "tenant_user",
        fields: ["id"],
        filters: { tenant_id: id, role: "owner" }
      })

      if (owners.length <= 1) {
        return res.status(400).json({ message: "Cannot remove the last owner" })
      }
    }

    await tenantService.deleteTenantUsers(members[0].id)

    res.json({ message: "Team member removed", user_id: userId })

  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin tenants id team userId")}
}

