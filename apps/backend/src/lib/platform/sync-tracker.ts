// @ts-nocheck
import crypto from "crypto"
import { createLogger } from "../../lib/logger"
import { appConfig } from "../config"
const logger = createLogger("lib:platform")

export interface SyncEntry {
  id: string
  system: string
  entity_type: string
  entity_id: string
  direction: "inbound" | "outbound"
  status: "pending" | "processing" | "completed" | "failed"
  error_message?: string
  retry_count: number
  payload_hash?: string
  correlation_id?: string
  tenant_id: string
  created_at: Date
  updated_at: Date
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS sync_tracking (
    id TEXT PRIMARY KEY,
    system TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    payload_hash TEXT,
    correlation_id TEXT,
    tenant_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_sync_tracking_system ON sync_tracking(system);
  CREATE INDEX IF NOT EXISTS idx_sync_tracking_status ON sync_tracking(status);
  CREATE INDEX IF NOT EXISTS idx_sync_tracking_tenant ON sync_tracking(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_sync_tracking_entity ON sync_tracking(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_sync_tracking_correlation ON sync_tracking(correlation_id);
`

export class DurableSyncTracker {
  private initialized = false
  private pool: any = null

  private async getPool() {
    if (this.pool) return this.pool
    const pg = await import("pg")
    this.pool = new pg.Pool({
      connectionString: appConfig.database.url,
    })
    return this.pool
  }

  private async ensureTable(): Promise<void> {
    if (this.initialized) return
    try {
      const pool = await this.getPool()
      await pool.query(CREATE_TABLE_SQL)
      this.initialized = true
      logger.info("[DurableSyncTracker] sync_tracking table initialized")
    } catch (err: any) {
      logger.error(`[DurableSyncTracker] Failed to initialize table: ${err.message}`)
      throw err
    }
  }

  async recordSync(data: {
    system: string
    entity_type: string
    entity_id: string
    direction: "inbound" | "outbound"
    payload_hash?: string
    correlation_id?: string
    tenant_id: string
  }): Promise<SyncEntry> {
    await this.ensureTable()
    const pool = await this.getPool()
    const id = crypto.randomUUID()
    const now = new Date()
    const correlationId = data.correlation_id || crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO sync_tracking (id, system, entity_type, entity_id, direction, status, retry_count, payload_hash, correlation_id, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', 0, $6, $7, $8, $9, $9)
       RETURNING *`,
      [id, data.system, data.entity_type, data.entity_id, data.direction, data.payload_hash || null, correlationId, data.tenant_id, now]
    )

    logger.info(`[DurableSyncTracker] Recorded sync: ${id} | ${data.system} | ${data.entity_type}:${data.entity_id} | ${data.direction}`)
    return result.rows[0]
  }

  async updateStatus(id: string, status: "pending" | "processing" | "completed" | "failed", errorMessage?: string): Promise<SyncEntry | null> {
    await this.ensureTable()
    const pool = await this.getPool()

    const result = await pool.query(
      `UPDATE sync_tracking SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, errorMessage || null, id]
    )

    if (result.rows.length === 0) {
      logger.info(`[DurableSyncTracker] Sync entry not found: ${id}`)
      return null
    }

    return result.rows[0]
  }

  async getFailedSyncs(system?: string, limit: number = 50): Promise<SyncEntry[]> {
    await this.ensureTable()
    const pool = await this.getPool()

    let query = `SELECT * FROM sync_tracking WHERE status = 'failed'`
    const params: any[] = []

    if (system) {
      params.push(system)
      query += ` AND system = $${params.length}`
    }

    query += ` ORDER BY updated_at DESC`
    params.push(limit)
    query += ` LIMIT $${params.length}`

    const result = await pool.query(query, params)
    return result.rows
  }

  async retryFailed(id: string): Promise<SyncEntry | null> {
    await this.ensureTable()
    const pool = await this.getPool()

    const result = await pool.query(
      `UPDATE sync_tracking SET status = 'pending', retry_count = retry_count + 1, error_message = NULL, updated_at = NOW() WHERE id = $1 AND status = 'failed' RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      logger.info(`[DurableSyncTracker] Cannot retry sync entry: ${id} (not found or not failed)`)
      return null
    }

    logger.info(`[DurableSyncTracker] Retrying sync: ${id} (attempt ${result.rows[0].retry_count})`)
    return result.rows[0]
  }

  async getPendingCount(system?: string): Promise<number> {
    await this.ensureTable()
    const pool = await this.getPool()

    let query = `SELECT COUNT(*) as count FROM sync_tracking WHERE status = 'pending'`
    const params: any[] = []

    if (system) {
      params.push(system)
      query += ` AND system = $${params.length}`
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count, 10)
  }

  async getSyncHistory(filters: {
    system?: string
    entityType?: string
    tenantId?: string
    dateRange?: { from: Date; to: Date }
  } = {}): Promise<SyncEntry[]> {
    await this.ensureTable()
    const pool = await this.getPool()

    let query = `SELECT * FROM sync_tracking WHERE 1=1`
    const params: any[] = []

    if (filters.system) {
      params.push(filters.system)
      query += ` AND system = $${params.length}`
    }
    if (filters.entityType) {
      params.push(filters.entityType)
      query += ` AND entity_type = $${params.length}`
    }
    if (filters.tenantId) {
      params.push(filters.tenantId)
      query += ` AND tenant_id = $${params.length}`
    }
    if (filters.dateRange) {
      params.push(filters.dateRange.from)
      query += ` AND created_at >= $${params.length}`
      params.push(filters.dateRange.to)
      query += ` AND created_at <= $${params.length}`
    }

    query += ` ORDER BY created_at DESC LIMIT 100`
    const result = await pool.query(query, params)
    return result.rows
  }

  async cleanupOldEntries(olderThanDays: number): Promise<number> {
    await this.ensureTable()
    const pool = await this.getPool()

    const result = await pool.query(
      `DELETE FROM sync_tracking WHERE status = 'completed' AND created_at < NOW() - INTERVAL '1 day' * $1`,
      [olderThanDays]
    )

    const deleted = result.rowCount || 0
    logger.info(`[DurableSyncTracker] Cleaned up ${deleted} old completed entries (older than ${olderThanDays} days)`)
    return deleted
  }
}

export const durableSyncTracker = new DurableSyncTracker()
