import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const createRoleSchema = z
  .object({
    role: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      permissions: z.array(z.string()),
    }),
  })
  .passthrough();

const updateRoleSchema = z
  .object({
    role_id: z.string(),
    updates: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    }),
  })
  .passthrough();

// Company User Role Management
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const { id } = req.params;

    // Get company
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "name", "metadata"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get company users
    const { data: users } = await query.graph({
      entity: "company_user",
      fields: ["*"],
      filters: { company_id: id },
    });

    // Get roles from metadata or return defaults
    const metadata = company.metadata || {};
    const roles = metadata.custom_roles || [
      {
        id: "admin",
        name: "Administrator",
        description: "Full access to company account",
        permissions: [
          "manage_users",
          "manage_orders",
          "manage_billing",
          "approve_orders",
          "view_reports",
        ],
        is_system: true,
      },
      {
        id: "approver",
        name: "Approver",
        description: "Can approve orders above threshold",
        permissions: ["view_orders", "approve_orders", "view_reports"],
        is_system: true,
      },
      {
        id: "buyer",
        name: "Buyer",
        description: "Can place orders up to spending limit",
        permissions: ["create_orders", "view_own_orders"],
        is_system: true,
      },
    ];

    // Available permissions
    const availablePermissions = [
      {
        id: "manage_users",
        name: "Manage Users",
        description: "Add, edit, remove company users",
      },
      {
        id: "manage_orders",
        name: "Manage Orders",
        description: "View and manage all orders",
      },
      {
        id: "manage_billing",
        name: "Manage Billing",
        description: "Update payment methods, view invoices",
      },
      {
        id: "approve_orders",
        name: "Approve Orders",
        description: "Approve pending orders",
      },
      {
        id: "view_reports",
        name: "View Reports",
        description: "Access company reports and analytics",
      },
      {
        id: "create_orders",
        name: "Create Orders",
        description: "Place new orders",
      },
      {
        id: "view_own_orders",
        name: "View Own Orders",
        description: "View orders they placed",
      },
      {
        id: "manage_addresses",
        name: "Manage Addresses",
        description: "Add/edit shipping addresses",
      },
    ];

    res.json({
      company_id: id,
      roles,
      users: users.map((u: any) => ({
        id: u.id,
        customer_id: u.customer_id,
        role: u.role,
        spending_limit: u.spending_limit,
        can_approve: u.can_approve,
      })),
      available_permissions: availablePermissions,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin companies id roles");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const companyService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { role } = parsed.data;

    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "metadata"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const metadata = company.metadata || {};
    const existingRoles = metadata.custom_roles || [];

    // Check if role ID already exists
    if (existingRoles.some((r: any) => r.id === role.id)) {
      return res
        .status(400)
        .json({ message: "Role with this ID already exists" });
    }

    const newRole = {
      ...role,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    await companyService.updateCompanies({
      id,
      metadata: {
        ...metadata,
        custom_roles: [...existingRoles, newRole],
      },
    });

    res.status(201).json({ role: newRole });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin companies id roles");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const companyService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const { role_id, updates } = parsed.data;

    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "metadata"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const metadata = company.metadata || {};
    const existingRoles = metadata.custom_roles || [];

    const roleIndex = existingRoles.findIndex((r: any) => r.id === role_id);
    if (roleIndex === -1) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (existingRoles[roleIndex].is_system) {
      return res.status(400).json({ message: "Cannot modify system roles" });
    }

    existingRoles[roleIndex] = {
      ...existingRoles[roleIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await companyService.updateCompanies({
      id,
      metadata: {
        ...metadata,
        custom_roles: existingRoles,
      },
    });

    res.json({ role: existingRoles[roleIndex] });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin companies id roles");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const companyService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const { role_id } = req.query as { role_id: string };

    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "metadata"],
      filters: { id },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const metadata = company.metadata || {};
    const existingRoles = metadata.custom_roles || [];

    const role = existingRoles.find((r: any) => r.id === role_id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.is_system) {
      return res.status(400).json({ message: "Cannot delete system roles" });
    }

    const updatedRoles = existingRoles.filter((r: any) => r.id !== role_id);

    await companyService.updateCompanies({
      id,
      metadata: {
        ...metadata,
        custom_roles: updatedRoles,
      },
    });

    res.json({ id: role_id, deleted: true });
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin companies id roles");
  }
}
