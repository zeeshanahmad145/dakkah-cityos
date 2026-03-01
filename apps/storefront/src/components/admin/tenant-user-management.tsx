import { useState } from "react"
import { useTenantUsers, useCreateTenantUser, useUpdateTenantUser, useDeleteTenantUser } from "@/lib/hooks/use-tenant-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TenantUser, RbacRole } from "@/lib/types/tenant-admin"

const ROLES: RbacRole[] = [
  "super-admin", "city-manager", "district-manager", "zone-manager",
  "facility-manager", "asset-manager", "vendor-admin", "content-editor",
  "analyst", "viewer",
]

export function TenantUserManagement() {
  const { data, isLoading } = useTenantUsers()
  const createMutation = useCreateTenantUser()
  const deleteMutation = useDeleteTenantUser()
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: "", role: "viewer" as RbacRole })

  const users = data?.users || []

  const handleCreate = async () => {
    if (!newUser.email.trim()) return
    await createMutation.mutateAsync(newUser)
    setNewUser({ email: "", role: "viewer" })
    setShowForm(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tenant Users ({users.length})</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-muted/20 space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="flex-1"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as RbacRole })}
              className="border rounded px-3 py-2"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg divide-y">
        {users.map((user: TenantUser) => (
          <div key={user.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user.first_name} {user.last_name} <span className="text-muted-foreground">({user.email})</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={user.role} />
                {(user.assigned_node_ids?.length ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {user.assigned_node_ids!.length} node(s)
                  </span>
                )}
                {user.last_login_at && (
                  <span className="text-xs text-muted-foreground">
                    Last login: {new Date(user.last_login_at!).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${user.is_active === true ? "bg-ds-success text-ds-success" : "bg-ds-destructive text-ds-destructive"}`}>
                {user.is_active === true ? "Active" : "Inactive"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(user.id)}
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: RbacRole }) {
  const roleColors: Record<string, string> = {
    "super-admin": "bg-ds-destructive text-ds-destructive",
    "city-manager": "bg-ds-accent/10 text-ds-accent",
    "district-manager": "bg-ds-info text-ds-info",
    "zone-manager": "bg-ds-success text-ds-success",
    "facility-manager": "bg-ds-warning text-ds-warning",
    "asset-manager": "bg-ds-warning/15 text-ds-warning",
    "vendor-admin": "bg-ds-primary/15 text-ds-primary",
    "content-editor": "bg-ds-destructive/15 text-ds-destructive",
    analyst: "bg-ds-success/15 text-ds-success",
    viewer: "bg-ds-muted text-ds-foreground",
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[role] || "bg-ds-muted"}`}>
      {role}
    </span>
  )
}
