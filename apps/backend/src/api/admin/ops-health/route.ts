import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const auditService = req.scope.resolve("audit") as any;

    const alerts =
      (await auditService?.listSlaAlerts?.({ acknowledged_at: null })) ?? [];
    const grouped = alerts.reduce((acc: any, alert: any) => {
      const key = alert.alert_type ?? "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(alert);
      return acc;
    }, {});

    res.json({
      ok: true,
      alert_count: alerts.length,
      alerts_by_type: grouped,
      healthy: alerts.length === 0,
    });
  } catch {
    res.status(500).json({ ok: false, error: "Failed to load SLA alerts" });
  }
}
