// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const inviteTeamMemberSchema = z.object({
  email: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  permissions: z.array(z.string()).optional(),
}).passthrough()

// GET - List tenant team members
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query")

    const { data: members } = await query.graph({
      entity: "tenant_user",
      fields: [
        "id",
        "user_id",
        "user.email",
        "user.first_name",
        "user.last_name",
        "role",
        "permissions",
        "invited_at",
        "joined_at",
        "status",
        "last_active_at"
      ],
      filters: { tenant_id: id }
    })

    res.json({ members })

  } catch (error: any) {
    handleApiError(res, error, "GET admin tenants id team")}
}

// POST - Invite team member
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const parsed = inviteTeamMemberSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const { email, role, permissions } = parsed.data

    const tenantService = req.scope.resolve("tenantModuleService")
    const query = req.scope.resolve("query")

    // Check if user already a member
    const { data: existing } = await query.graph({
      entity: "tenant_user",
      fields: ["id"],
      filters: { tenant_id: id, "user.email": email }
    })

    if (existing.length > 0) {
      return res.status(400).json({ message: "User is already a team member" })
    }

    // Create invitation
    const invitation = await tenantService.createTenantInvitations({
      tenant_id: id,
      email,
      role,
      permissions: permissions || [],
      invited_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending"
    })

    // TODO: Send invitation email

    res.status(201).json({
      message: "Invitation sent",
      invitation
    })

  } catch (error: any) {
    handleApiError(res, error, "POST admin tenants id team")}
}

