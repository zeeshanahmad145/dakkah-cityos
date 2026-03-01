import { MedusaService } from "@medusajs/framework/utils";
import AuditLog from "./models/audit-log";

class AuditModuleService extends MedusaService({
  AuditLog,
}) {
  async logAction(data: {
    tenantId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    actorId?: string;
    actorRole?: string;
    actorEmail?: string;
    nodeId?: string;
    changes?: Record<string, any>;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    dataClassification?: "public" | "internal" | "confidential" | "restricted";
    metadata?: Record<string, any>;
  }) {
    return await this.createAuditLogs({
      tenant_id: data.tenantId,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      actor_id: data.actorId || null,
      actor_role: data.actorRole || null,
      actor_email: data.actorEmail || null,
      node_id: data.nodeId || null,
      changes: data.changes || null,
      previous_values: data.previousValues || null,
      new_values: data.newValues || null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      data_classification: data.dataClassification || "internal",
      metadata: data.metadata || null,
    } as any);
  }

  async getAuditTrail(
    tenantId: string,
    filters: {
      resourceType?: string;
      resourceId?: string;
      actorId?: string;
      action?: string;
      from?: Date;
      to?: Date;
      dataClassification?: string;
    } = {},
  ) {
    const query: Record<string, any> = { tenant_id: tenantId };

    if (filters.resourceType) {
      query.resource_type = filters.resourceType;
    }
    if (filters.resourceId) {
      query.resource_id = filters.resourceId;
    }
    if (filters.actorId) {
      query.actor_id = filters.actorId;
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.dataClassification) {
      query.data_classification = filters.dataClassification;
    }

    const logs = await this.listAuditLogs(query) as any;
    let result = Array.isArray(logs) ? logs : [logs].filter(Boolean);

    if (filters.from || filters.to) {
      result = result.filter((log: any) => {
        const createdAt = new Date(log.created_at);
        if (filters.from && createdAt < filters.from) return false;
        if (filters.to && createdAt > filters.to) return false;
        return true;
      });
    }

    return result;
  }

  async getResourceHistory(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ) {
    const logs = await this.listAuditLogs({
      tenant_id: tenantId,
      resource_type: resourceType,
      resource_id: resourceId,
    }) as any;

    return Array.isArray(logs) ? logs : [logs].filter(Boolean);
  }

  async getAuditSummary(
    tenantId: string,
    dateRange: { start: Date; end: Date },
  ) {
    const logs = await this.listAuditLogs(
      { tenant_id: tenantId },
      {
        take: 5000,
        order: { created_at: "DESC" },
      },
    ) as any;
    let result = Array.isArray(logs) ? logs : [logs].filter(Boolean);

    result = result.filter((log: any) => {
      const createdAt = new Date(log.created_at);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });

    const eventsByType: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    const riskFlags: Array<{
      type: string;
      description: string;
      severity: string;
    }> = [];

    for (const log of result) {
      const action = log.action || "unknown";
      eventsByType[action] = (eventsByType[action] || 0) + 1;

      const actorId = log.actor_id || "system";
      actorCounts[actorId] = (actorCounts[actorId] || 0) + 1;
    }

    const topActors = Object.entries(actorCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([actorId, count]) => ({ actorId, count }));

    const deleteCount =
      eventsByType["delete"] || eventsByType["bulk_delete"] || 0;
    if (deleteCount > 10) {
      riskFlags.push({
        type: "high_delete_volume",
        description: `${deleteCount} delete actions detected in period`,
        severity: "high",
      });
    }

    for (const [actorId, count] of Object.entries(actorCounts)) {
      if ((count as number) > 100) {
        riskFlags.push({
          type: "high_frequency_actor",
          description: `Actor ${actorId} performed ${count} actions`,
          severity: "medium",
        });
      }
    }

    const restrictedAccess = result.filter(
      (l: any) => l.data_classification === "restricted",
    ).length;
    if (restrictedAccess > 0) {
      riskFlags.push({
        type: "restricted_data_access",
        description: `${restrictedAccess} accesses to restricted data`,
        severity: "high",
      });
    }

    return {
      totalEvents: result.length,
      eventsByType,
      topActors,
      riskFlags,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
    };
  }

  async searchAuditLogs(
    tenantId: string,
    filters: {
      actorId?: string;
      action?: string;
      entityType?: string;
      dateRange?: { start: Date; end: Date };
    } = {},
  ) {
    const query: Record<string, any> = { tenant_id: tenantId };

    if (filters.actorId) {
      query.actor_id = filters.actorId;
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.entityType) {
      query.resource_type = filters.entityType;
    }

    const logs = await this.listAuditLogs(query) as any;
    let result = Array.isArray(logs) ? logs : [logs].filter(Boolean);

    if (filters.dateRange) {
      result = result.filter((log: any) => {
        const createdAt = new Date(log.created_at);
        if (filters.dateRange!.start && createdAt < filters.dateRange!.start)
          return false;
        if (filters.dateRange!.end && createdAt > filters.dateRange!.end)
          return false;
        return true;
      });
    }

    return result;
  }

  async flagSuspiciousActivity(tenantId: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const logs = await this.listAuditLogs(
      { tenant_id: tenantId },
      {
        take: 5000,
        order: { created_at: "DESC" },
      },
    ) as any;
    let recentLogs = Array.isArray(logs) ? logs : [logs].filter(Boolean);
    recentLogs = recentLogs.filter((log: any) => {
      const createdAt = new Date(log.created_at);
      return createdAt >= oneDayAgo && createdAt <= now;
    });

    const flags: Array<{
      type: string;
      actorId: string;
      description: string;
      severity: string;
      timestamp: string;
    }> = [];

    const actorActions: Record<string, any[]> = {};
    for (const log of recentLogs) {
      const actorId = log.actor_id || "system";
      if (!actorActions[actorId]) actorActions[actorId] = [];
      actorActions[actorId].push(log);
    }

    for (const [actorId, actions] of Object.entries(actorActions)) {
      if (actions.length > 50) {
        flags.push({
          type: "high_frequency",
          actorId,
          description: `${actions.length} actions in last 24 hours`,
          severity: "medium",
          timestamp: now.toISOString(),
        });
      }

      const deleteActions = actions.filter(
        (a: any) => a.action === "delete" || a.action === "bulk_delete",
      );
      if (deleteActions.length > 5) {
        flags.push({
          type: "bulk_delete",
          actorId,
          description: `${deleteActions.length} delete operations in last 24 hours`,
          severity: "high",
          timestamp: now.toISOString(),
        });
      }

      const restrictedAccess = actions.filter(
        (a: any) =>
          a.data_classification === "restricted" ||
          a.data_classification === "confidential",
      );
      if (restrictedAccess.length > 10) {
        flags.push({
          type: "sensitive_data_access",
          actorId,
          description: `${restrictedAccess.length} accesses to sensitive data in last 24 hours`,
          severity: "high",
          timestamp: now.toISOString(),
        });
      }

      const uniqueIps = new Set(
        actions.map((a: any) => a.ip_address).filter(Boolean),
      );
      if (uniqueIps.size > 5) {
        flags.push({
          type: "multiple_ips",
          actorId,
          description: `Actions from ${uniqueIps.size} different IP addresses`,
          severity: "medium",
          timestamp: now.toISOString(),
        });
      }
    }

    return {
      tenantId,
      scannedPeriod: { start: oneDayAgo.toISOString(), end: now.toISOString() },
      totalLogsScanned: recentLogs.length,
      flagsFound: flags.length,
      flags,
    };
  }

  async exportAuditReport(tenantId: string, format: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const summary = await this.getAuditSummary(tenantId, {
      start: thirtyDaysAgo,
      end: now,
    });
    const suspiciousActivity = await this.flagSuspiciousActivity(tenantId);

    const logs = await this.listAuditLogs({ tenant_id: tenantId }) as any;
    let allLogs = Array.isArray(logs) ? logs : [logs].filter(Boolean);
    allLogs = allLogs.filter((log: any) => {
      const createdAt = new Date(log.created_at);
      return createdAt >= thirtyDaysAgo && createdAt <= now;
    });

    const reportData = {
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      tenantId,
      generatedAt: now.toISOString(),
      format: format || "json",
      period: { start: thirtyDaysAgo.toISOString(), end: now.toISOString() },
      summary: {
        totalEvents: summary.totalEvents,
        eventsByType: summary.eventsByType,
        topActors: summary.topActors,
        riskFlags: summary.riskFlags,
      },
      suspiciousActivity: {
        flagsFound: suspiciousActivity.flagsFound,
        flags: suspiciousActivity.flags,
      },
      logs: allLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        actor_id: log.actor_id,
        actor_role: log.actor_role,
        ip_address: log.ip_address,
        data_classification: log.data_classification,
        created_at: log.created_at,
      })),
    };

    if (format === "csv") {
      const headers = [
        "id",
        "action",
        "resource_type",
        "resource_id",
        "actor_id",
        "actor_role",
        "ip_address",
        "data_classification",
        "created_at",
      ];
      const rows = reportData.logs.map((log: any) =>
        headers.map((h) => String(log[h] || "")).join(","),
      );
      return {
        ...reportData,
        csvContent: [headers.join(","), ...rows].join("\n"),
      };
    }

    return reportData;
  }
}

export default AuditModuleService;
