import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useState, useEffect } from "react";

// WorkflowPolicy Admin Page — View and manage governance rules for Temporal workflows
export default function WorkflowPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetch("/admin/custom/workflow-policies")
      .then((r) => r.json())
      .then((d) => {
        setPolicies(d.policies ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          ⚡ Workflow Governance
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
          Canonical Temporal workflow policies — control who can launch,
          override, and roll back workflows.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#9ca3af" }}>Loading workflow policies…</p>
      ) : policies.length === 0 ? (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <strong>No policies configured.</strong> Seed them via the{" "}
          <code>seed-reconciliation-config</code> startup job or Temporal worker
          startup.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {policies.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                background: selected?.id === p.id ? "#eff6ff" : "#fff",
                border: `1px solid ${selected?.id === p.id ? "#3b82f6" : "#e5e7eb"}`,
                borderRadius: "0.5rem",
                padding: "1rem 1.25rem",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "0.5rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  {p.workflow_name}
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#6b7280",
                    }}
                  >
                    v{p.version}
                  </span>
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Launchers:{" "}
                  <code>{(p.permitted_launchers ?? []).join(", ")}</code>
                  {" · "}Rollback: <code>{p.rollback_strategy}</code>
                  {p.override_requires_approval && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "0 0.35rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      Approval required
                    </span>
                  )}
                </div>
              </div>
              <div style={{ alignSelf: "center" }}>
                <span
                  style={{
                    background: p.is_active_version ? "#d1fae5" : "#f3f4f6",
                    color: p.is_active_version ? "#059669" : "#6b7280",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                  }}
                >
                  {p.is_active_version ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "1.25rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            {selected.workflow_name} — Details
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <tbody>
              {[
                ["Version", selected.version],
                [
                  "Permitted launchers",
                  (selected.permitted_launchers ?? []).join(", "),
                ],
                [
                  "Override requires approval",
                  selected.override_requires_approval ? "Yes" : "No",
                ],
                ["Rollback strategy", selected.rollback_strategy],
                [
                  "Audit all transitions",
                  selected.audit_all_transitions ? "Yes" : "No",
                ],
                [
                  "Audit retention",
                  `${selected.audit_retention_days ?? 365} days`,
                ],
                [
                  "Default timeout",
                  selected.default_timeout_minutes
                    ? `${selected.default_timeout_minutes} min`
                    : "None",
                ],
                [
                  "Escalation after",
                  selected.escalation_after_minutes
                    ? `${selected.escalation_after_minutes} min`
                    : "None",
                ],
                ["Escalation target", selected.escalation_target ?? "—"],
              ].map(([label, value]) => (
                <tr
                  key={String(label)}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <td
                    style={{
                      padding: "0.5rem 0",
                      color: "#6b7280",
                      width: "40%",
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "0.5rem 0", fontWeight: 500 }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const config = defineRouteConfig({
  label: "Workflows",
  icon: () => null,
});
