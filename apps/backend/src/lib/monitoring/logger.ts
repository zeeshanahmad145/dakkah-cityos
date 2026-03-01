/**
 * Structured Logging for CityOS Commerce
 *
 * Provides structured logging with:
 * - Request/response logging
 * - Error tracking
 * - Performance metrics
 * - Audit trails
 */

import { appConfig } from "../config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  tenant_id?: string;
  store_id?: string;
  vendor_id?: string;
  customer_id?: string;
  user_id?: string;
  request_id?: string;
  order_id?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class CityOSLogger {
  private minLevel: LogLevel;
  private serviceName: string;

  constructor() {
    this.minLevel = (appConfig.logLevel as LogLevel) || "info";
    this.serviceName = appConfig.serviceName || "cityos-backend";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    if (appConfig.isProduction) {
      // JSON format for production (easy to parse by log aggregators)
      return JSON.stringify({
        ...entry,
        service: this.serviceName,
        env: appConfig.nodeEnv,
      });
    }

    // Human-readable format for development
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;
    const context = entry.context
      ? ` [${Object.entries(entry.context)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")}]`
      : "";
    const duration = entry.duration_ms ? ` (${entry.duration_ms}ms)` : "";
    const error = entry.error ? `\n  Error: ${entry.error.message}` : "";

    return `${timestamp} ${level} ${message}${context}${duration}${error}`;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    extra?: Partial<LogEntry>,
  ) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...extra,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case "error":
        logger.error(formatted);
        break;
      case "warn":
        logger.warn(formatted);
        break;
      case "debug":
        console.debug(formatted);
        break;
      default:
        logger.info(formatted);
    }

    // Send to external logging service in production
    if (appConfig.isProduction && appConfig.sentry.dsn) {
      this.sendToSentry(entry);
    }
  }

  private sendToSentry(entry: LogEntry) {
    // Integration with Sentry or other error tracking
    if (entry.level === "error" && entry.error) {
      // Sentry.captureException would go here
      // For now, just log that we would send to Sentry
      console.debug("[Sentry] Would capture error:", entry.error.message);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log("error", message, context, {
      error: error
        ? {
            name: error.name,
            message: error instanceof Error ? error.message : String(error),
            stack: error.stack,
          }
        : undefined,
    });
  }

  /**
   * Log a timed operation
   */
  async timed<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.log("info", `${operation} completed`, context, {
        duration_ms: duration,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.log("error", `${operation} failed`, context, {
        duration_ms: duration,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error instanceof Error ? error.message : String(error),
                stack: error.stack,
              }
            : { name: "UnknownError", message: String(error) },
      });
      throw error;
    }
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Log vendor-related action
   */
  vendor(action: string, vendorId: string, details?: Record<string, unknown>) {
    this.info(`Vendor ${action}`, {
      vendor_id: vendorId,
      ...details,
    });
  }

  /**
   * Log order-related action
   */
  order(action: string, orderId: string, details?: Record<string, unknown>) {
    this.info(`Order ${action}`, {
      order_id: orderId,
      ...details,
    });
  }

  /**
   * Log commission-related action
   */
  commission(action: string, details: Record<string, unknown>) {
    this.info(`Commission ${action}`, details as LogContext);
  }

  /**
   * Log payout-related action
   */
  payout(
    action: string,
    vendorId: string,
    amount: number,
    details?: Record<string, unknown>,
  ) {
    this.info(`Payout ${action}`, {
      vendor_id: vendorId,
      amount: amount.toString(),
      ...details,
    });
  }

  /**
   * Log API request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ) {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this.log(level, `${method} ${path} ${statusCode}`, context, {
      duration_ms: duration,
      metadata: { status_code: statusCode },
    });
  }

  /**
   * Log audit event
   */
  audit(
    action: string,
    resourceType: string,
    resourceId: string,
    userId: string,
    details?: Record<string, unknown>,
  ) {
    this.info(`Audit: ${action} ${resourceType}`, {
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      ...details,
    } as LogContext);
  }
}

class ChildLogger {
  constructor(
    private parent: CityOSLogger,
    private context: LogContext,
  ) {}

  debug(message: string, context?: LogContext) {
    this.parent.debug(message, { ...this.context, ...context });
  }

  info(message: string, context?: LogContext) {
    this.parent.info(message, { ...this.context, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.parent.warn(message, { ...this.context, ...context });
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.parent.error(message, error, { ...this.context, ...context });
  }
}

// Singleton instance
export const logger = new CityOSLogger();

// Export for use in middleware
export function createRequestLogger(requestId: string, context?: LogContext) {
  return logger.child({ request_id: requestId, ...context });
}
