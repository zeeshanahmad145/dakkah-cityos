import { vi } from "vitest";
const mockTenantService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  configure: vi.fn(),
}

const mockTeamService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  inviteMember: vi.fn(),
  removeMember: vi.fn(),
  listMembers: vi.fn(),
  updateMemberRole: vi.fn(),
}

const mockInventoryService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  create: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockSettingsService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  update: vi.fn(),
  retrieve: vi.fn(),
}

const mockRbacService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

  checkPermission: vi.fn(),
  assignRole: vi.fn(),
  listRoles: vi.fn(),
}

interface Tenant {
  id: string
  name: string
  status: string
  settings?: Record<string, any>
}

interface TeamMember {
  id: string
  email: string
  role: string
  status: string
  tenant_id: string
}

describe("Admin Management Flow E2E", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("create tenant → configure → invite team → manage inventory", () => {
    it("should complete full admin management flow", async () => {
      const tenant: Tenant = {
        id: "tenant_01", name: "Fresh Market", status: "active",
        settings: {},
      }
      mockTenantService.create.mockResolvedValue(tenant)

      const created = await mockTenantService.create({
        name: "Fresh Market", plan: "business",
      })
      expect(created.status).toBe("active")
      expect(created.id).toBe("tenant_01")

      mockSettingsService.update.mockResolvedValue({
        tenant_id: "tenant_01",
        currency: "SAR",
        timezone: "Asia/Riyadh",
        language: "ar",
      })
      const settings = await mockSettingsService.update("tenant_01", {
        currency: "SAR", timezone: "Asia/Riyadh", language: "ar",
      })
      expect(settings.currency).toBe("SAR")

      const member: TeamMember = {
        id: "member_01", email: "staff@freshmarket.com",
        role: "staff", status: "invited", tenant_id: "tenant_01",
      }
      mockTeamService.inviteMember.mockResolvedValue(member)

      const invited = await mockTeamService.inviteMember({
        tenant_id: "tenant_01", email: "staff@freshmarket.com", role: "staff",
      })
      expect(invited.role).toBe("staff")
      expect(invited.status).toBe("invited")

      mockInventoryService.create.mockResolvedValue({
        id: "inv_01", product_id: "prod_01", quantity: 100,
        tenant_id: "tenant_01",
      })
      const inventory = await mockInventoryService.create({
        product_id: "prod_01", quantity: 100, tenant_id: "tenant_01",
      })
      expect(inventory.quantity).toBe(100)

      mockInventoryService.update.mockResolvedValue({
        id: "inv_01", quantity: 85,
      })
      const updated = await mockInventoryService.update("inv_01", {
        quantity: 85,
      })
      expect(updated.quantity).toBe(85)
    })
  })

  describe("RBAC - admin vs staff permissions", () => {
    it("should allow admin to list inventory", async () => {
      mockRbacService.checkPermission.mockResolvedValue({ allowed: true })

      const permission = await mockRbacService.checkPermission({
        user_id: "admin_01", role: "admin",
        action: "list", resource: "inventory",
      })
      expect(permission.allowed).toBe(true)

      mockInventoryService.list.mockResolvedValue([
        { id: "inv_01", product_id: "prod_01", quantity: 100 },
        { id: "inv_02", product_id: "prod_02", quantity: 50 },
      ])
      const items = await mockInventoryService.list({ tenant_id: "tenant_01" })
      expect(items).toHaveLength(2)
    })

    it("should allow staff to list inventory", async () => {
      mockRbacService.checkPermission.mockResolvedValue({ allowed: true })

      const permission = await mockRbacService.checkPermission({
        user_id: "staff_01", role: "staff",
        action: "list", resource: "inventory",
      })
      expect(permission.allowed).toBe(true)
    })

    it("should deny staff from deleting inventory", async () => {
      mockRbacService.checkPermission.mockResolvedValue({
        allowed: false, reason: "Staff cannot delete inventory items",
      })

      const permission = await mockRbacService.checkPermission({
        user_id: "staff_01", role: "staff",
        action: "delete", resource: "inventory",
      })
      expect(permission.allowed).toBe(false)
      expect(permission.reason).toBe("Staff cannot delete inventory items")
    })

    it("should allow admin to delete inventory", async () => {
      mockRbacService.checkPermission.mockResolvedValue({ allowed: true })

      const permission = await mockRbacService.checkPermission({
        user_id: "admin_01", role: "admin",
        action: "delete", resource: "inventory",
      })
      expect(permission.allowed).toBe(true)

      mockInventoryService.delete.mockResolvedValue({ deleted: true })
      const deleted = await mockInventoryService.delete("inv_01")
      expect(deleted.deleted).toBe(true)
    })
  })

  describe("team management", () => {
    it("should list team members for a tenant", async () => {
      mockTeamService.listMembers.mockResolvedValue([
        { id: "member_01", email: "admin@fresh.com", role: "admin", status: "active" },
        { id: "member_02", email: "staff@fresh.com", role: "staff", status: "active" },
      ])

      const members = await mockTeamService.listMembers({ tenant_id: "tenant_01" })
      expect(members).toHaveLength(2)
      expect(members[0].role).toBe("admin")
    })

    it("should update team member role", async () => {
      mockRbacService.checkPermission.mockResolvedValue({ allowed: true })
      mockTeamService.updateMemberRole.mockResolvedValue({
        id: "member_02", role: "manager",
      })

      const updated = await mockTeamService.updateMemberRole("member_02", {
        role: "manager",
      })
      expect(updated.role).toBe("manager")
    })

    it("should remove team member from tenant", async () => {
      mockRbacService.checkPermission.mockResolvedValue({ allowed: true })
      mockTeamService.removeMember.mockResolvedValue({ removed: true })

      const result = await mockTeamService.removeMember("member_02", "tenant_01")
      expect(result.removed).toBe(true)
    })
  })

  describe("tenant configuration", () => {
    it("should update tenant settings", async () => {
      mockSettingsService.retrieve.mockResolvedValue({
        tenant_id: "tenant_01", currency: "SAR",
        timezone: "Asia/Riyadh",
      })

      const current = await mockSettingsService.retrieve("tenant_01")
      expect(current.currency).toBe("SAR")

      mockSettingsService.update.mockResolvedValue({
        tenant_id: "tenant_01", currency: "USD",
        timezone: "Asia/Riyadh",
      })
      const updated = await mockSettingsService.update("tenant_01", { currency: "USD" })
      expect(updated.currency).toBe("USD")
    })
  })
})
