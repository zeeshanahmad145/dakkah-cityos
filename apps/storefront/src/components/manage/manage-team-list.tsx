import { useState } from "react"
import { useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { RBAC_ROLE_WEIGHTS, type RbacRole } from "@/lib/types/tenant-admin"
import { clsx } from "clsx"

interface TeamMember {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  role: RbacRole
  status: "invited" | "active" | "suspended" | "deactivated"
  last_active_at?: string
}

interface ManageTeamListProps {
  members?: TeamMember[]
  locale?: string
  onInvite?: (email: string, role: RbacRole) => void
}

const roleStyles: Record<string, string> = {
  "super-admin": "bg-ds-destructive/10 text-ds-destructive",
  "city-manager": "bg-ds-primary/10 text-ds-primary",
  "district-manager": "bg-ds-primary/10 text-ds-primary",
  "zone-manager": "bg-ds-success/10 text-ds-success",
  "facility-manager": "bg-ds-success/10 text-ds-success",
  "asset-manager": "bg-ds-warning/10 text-ds-warning",
  "vendor-admin": "bg-ds-warning/10 text-ds-warning",
  "content-editor": "bg-ds-accent text-ds-text",
  analyst: "bg-ds-accent text-ds-text",
  viewer: "bg-ds-accent text-ds-muted",
}

const statusDot: Record<string, string> = {
  active: "bg-ds-success",
  invited: "bg-ds-warning",
  suspended: "bg-ds-destructive",
  deactivated: "bg-ds-muted",
}

const availableRoles: RbacRole[] = Object.keys(RBAC_ROLE_WEIGHTS) as RbacRole[]

export function ManageTeamList({ members = [], locale: localeProp, onInvite }: ManageTeamListProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<RbacRole>("viewer")

  const handleInvite = () => {
    if (inviteEmail && onInvite) {
      onInvite(inviteEmail, inviteRole)
      setInviteEmail("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-ds-card border border-ds-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ds-text mb-3">{t(locale, "manage.invite_member")}</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t(locale, "manage.invite_email_placeholder")}
            className="flex-1 px-3 py-2 bg-ds-background border border-ds-border rounded-lg text-sm text-ds-text placeholder:text-ds-muted focus:outline-none focus:ring-2 focus:ring-ds-primary"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as RbacRole)}
            className="px-3 py-2 bg-ds-background border border-ds-border rounded-lg text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!inviteEmail}
            className="px-4 py-2 bg-ds-primary text-ds-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t(locale, "manage.send_invite")}
          </button>
        </div>
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-background">
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.member_name")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.email")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.role")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.status")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.last_active")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-ds-muted">
                    {t(locale, "manage.no_team_members")}
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-ds-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ds-accent flex items-center justify-center text-ds-text text-sm font-medium flex-shrink-0">
                          {(member.first_name?.[0] || member.email?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-ds-text">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ds-muted">{member.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("px-2 py-1 text-xs font-medium rounded-full", roleStyles[member.role] || "bg-ds-accent text-ds-text")}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full", statusDot[member.status] || "bg-ds-muted")} />
                        <span className="text-sm text-ds-text capitalize">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ds-muted">
                      {member.last_active_at ? new Date(member.last_active_at!).toLocaleDateString(locale) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-ds-border text-xs text-ds-muted">
          {members.length} {t(locale, "manage.team_members").toLowerCase()}
        </div>
      </div>
    </div>
  )
}
